import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";

dotenv.config();

interface KeystoneAuthResponse {
  token: {
    expires_at: string;
    catalog: any[];
  };
}

export class OpenStackService {
  private adminTokenCache = new NodeCache({ stdTTL: 300 });

  private getAuthUrl(): string {
    return process.env.OS_AUTH_URL!;
  }

  private async getAdminToken(): Promise<string> {
    const cached = this.adminTokenCache.get<string>("adminToken");
    if (cached) return cached;

    const authUrl = this.getAuthUrl();
    // Authenticate to Keystone to get admin token
    let resp;
    try {
    // Determine if domain/project env vars are UUIDs (to use id) or names
    const domainEnv = process.env.OS_ADMIN_DOMAIN_ID!;
    const projectEnv = process.env.OS_ADMIN_PROJECT_ID!;
    const uuidRegex = /^[0-9a-fA-F\-]{32,}$/;
    const domainKey = uuidRegex.test(domainEnv) ? 'id' : 'name';
    const projectKey = uuidRegex.test(projectEnv) ? 'id' : 'name';
    const identityDomain: Record<string, string> = { [domainKey]: domainEnv };
    const scopeProject: Record<string, any> = { [projectKey]: projectEnv, domain: identityDomain };
    resp = await axios.post<KeystoneAuthResponse>(
      `${authUrl}/auth/tokens`,
      {
        auth: {
          identity: {
            methods: ['password'],
            password: {
              user: {
                name: process.env.OS_ADMIN_USERNAME,
                domain: identityDomain,
                password: process.env.OS_ADMIN_PASSWORD,
              },
            },
          },
          scope: { project: scopeProject },
        },
      },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          validateStatus: () => true,
        }
      );
    } catch (err) {
      console.error('Error requesting admin token:', err);
      throw new Error('Failed to request admin token from Keystone');
    }
    const token = resp.headers['x-subject-token'];
    if (!token) {
      console.error('Keystone did not return x-subject-token header', {
        status: resp.status,
        data: resp.data,
      });
      throw new Error('Keystone authentication failed: missing token header');
    }
    if (!resp.data || !resp.data.token || !resp.data.token.expires_at) {
      console.error('Keystone auth response missing token or expires_at', {
        status: resp.status,
        data: resp.data,
      });
      throw new Error('Keystone authentication failed: invalid response');
    }
    const expiresAt = resp.data.token.expires_at;
    const ttl = Math.max(0, (new Date(expiresAt).getTime() - Date.now()) / 1000 - 60);
    this.adminTokenCache.set('adminToken', token, ttl);
    return token;
  }

  private async request<T = any>(options: {
    method: "get" | "post" | "put" | "delete";
    url: string;
    data?: any;
  }): Promise<T> {
    const token = await this.getAdminToken();
    const resp = await axios({
      method: options.method,
      url: options.url,
      data: options.data,
      headers: {
        "X-Auth-Token": token,
        "Content-Type": "application/json",
      },
      validateStatus: () => true
    });
    return resp.data;
  }

  async createUser(name: string, password: string, email: string): Promise<{ id: string }> {
    // Create a user in Keystone, scoping to the configured domain
    const url = `${this.getAuthUrl()}/users`;
    // Determine if domain env var is UUID (use id) or name
    const domainEnv = process.env.OS_ADMIN_DOMAIN_ID!;
    const uuidRegex = /^[0-9a-fA-F\-]{32,}$/;
    const domainKey = uuidRegex.test(domainEnv) ? 'id' : 'name';
    const identityDomain: Record<string, string> = { [domainKey]: domainEnv };
    // Prepare user payload with domain scoping
    const userPayload: any = { name, password, email };
    userPayload.domain = identityDomain;
    try {
      const resp = await this.request<{ user: { id: string } }>({
        method: 'post',
        url,
        data: { user: userPayload },
      });
      if (!resp.user || !resp.user.id) {
        console.error('Unexpected createUser response', resp);
        throw new Error('Keystone createUser failed: invalid response');
      }
      return { id: resp.user.id };
    } catch (err) {
      console.error('Error creating Keystone user:', err);
      throw err;
    }
  }

  async createProject(name: string): Promise<{ id: string }> {
    // Create a project in Keystone under the configured domain
    const url = `${this.getAuthUrl()}/projects`;
    // Determine domain scoping
    const domainEnv = process.env.OS_ADMIN_DOMAIN_ID!;
    const uuidRegex = /^[0-9a-fA-F\-]{32,}$/;
    const domainKey = uuidRegex.test(domainEnv) ? 'id' : 'name';
    const projectPayload: any = { name };
    if (domainKey === 'id') {
      projectPayload.domain_id = domainEnv;
    } else {
      projectPayload.domain = { name: domainEnv };
    }
    try {
      const resp = await this.request<{ project: { id: string } }>({
        method: 'post',
        url,
        data: { project: projectPayload },
      });
      if (!resp.project || !resp.project.id) {
        console.error('Unexpected createProject response', resp);
        throw new Error('Keystone createProject failed: invalid response');
      }
      return { id: resp.project.id };
    } catch (err) {
      console.error('Error creating Keystone project:', err);
      throw err;
    }
  }

  async assignRole(userId: string, projectId: string): Promise<void> {
    const rolesResp = await this.request<{ roles: { id: string; name: string }[] }>({
      method: "get",
      url: `${this.getAuthUrl()}/roles`,
    });
    let role = rolesResp.roles.find((r) => r.name === process.env.OS_DEFAULT_ROLE_NAME);
    if (!role) {
      // Fallback to first available role if default not found
      console.warn(
        `Role '${process.env.OS_DEFAULT_ROLE_NAME}' not found, available roles: ${rolesResp.roles
          .map((r) => r.name)
          .join(', ')}, defaulting to '${rolesResp.roles[0]?.name}'`
      );
      role = rolesResp.roles[0];
      if (!role) {
        throw new Error('No roles available to assign');
      }
    }
    await this.request({
      method: "put",
      url: `${this.getAuthUrl()}/projects/${projectId}/users/${userId}/roles/${role.id}`,
    });
  }
  // ---- Compute (Nova) ----
  private getComputeUrl(): string {
    return process.env.OS_COMPUTE_URL!;
  }
  /**
   * List available Nova flavors
   */
  async listFlavors(projectKeystoneId: string): Promise<any> {
    const url = `${this.getComputeUrl()}/${projectKeystoneId}/flavors/detail`;
    return this.request({ method: 'get', url });
  }

  async listServers(projectKeystoneId: string): Promise<any> {
    const url = `${this.getComputeUrl()}/${projectKeystoneId}/servers/detail`;
    return this.request({ method: "get", url });
  }

  async deleteServer(projectKeystoneId: string, serverId: string): Promise<void> {
    const url = `${this.getComputeUrl()}/${projectKeystoneId}/servers/${serverId}`;
    await this.request({ method: "delete", url });
  }

  async actionServer(
    projectKeystoneId: string,
    serverId: string,
    action: "reboot" | "shutdown" | "start"
  ): Promise<void> {
    let data: any;
    switch (action) {
      case "reboot":
        data = { reboot: { type: "SOFT" } };
        break;
      case "shutdown":
        data = { "os-stop": {} };
        break;
      case "start":
        data = { "os-start": {} };
        break;
      default:
        throw new Error("Invalid action");
    }
    const url = `${this.getComputeUrl()}/${projectKeystoneId}/servers/${serverId}/action`;
    await this.request({ method: "post", url, data });
  }
  /**
   * Boot a new Nova server
   */
  async createServer(
    projectKeystoneId: string,
    name: string,
    imageRef: string,
    flavorRef: string,
    networkIds: string[]
  ): Promise<any> {
    const url = `${this.getComputeUrl()}/${projectKeystoneId}/servers`;
    const serverPayload: any = {
      name,
      imageRef,
      flavorRef,
      networks: networkIds.map((id) => ({ uuid: id })),
    };
    return this.request({ method: 'post', url, data: { server: serverPayload } });
  }

  // ---- Volumes (Cinder) ----
  private getVolumeUrl(): string {
    return process.env.OS_VOLUME_URL!;
  }
  /**
   * List available Neutron networks
   */
  private getNetworkUrl(): string {
    return process.env.OS_NETWORK_URL!;
  }
  async listNetworks(projectKeystoneId: string): Promise<any> {
    // Include project_id to list networks scoped to the project
    const url = `${this.getNetworkUrl()}/networks?project_id=${projectKeystoneId}`;
    return this.request({ method: 'get', url });
  }

  async listVolumes(projectKeystoneId: string): Promise<any> {
    const url = `${this.getVolumeUrl()}/${projectKeystoneId}/volumes`;
    return this.request({ method: "get", url });
  }

  async createVolume(
    projectKeystoneId: string,
    size: number,
    name?: string
  ): Promise<any> {
    const url = `${this.getVolumeUrl()}/${projectKeystoneId}/volumes`;
    return this.request({
      method: "post",
      url,
      data: { volume: { size, name } },
    });
  }

  async deleteVolume(projectKeystoneId: string, volumeId: string): Promise<void> {
    const url = `${this.getVolumeUrl()}/${projectKeystoneId}/volumes/${volumeId}`;
    await this.request({ method: "delete", url });
  }

  async attachVolume(
    projectKeystoneId: string,
    serverId: string,
    volumeId: string,
    device?: string
  ): Promise<any> {
    const url = `${this.getComputeUrl()}/${projectKeystoneId}/servers/${serverId}/os-volume_attachments`;
    return this.request({
      method: "post",
      url,
      data: { volumeAttachment: { volumeId, device } },
    });
  }

  async detachVolume(
    projectKeystoneId: string,
    serverId: string,
    attachmentId: string
  ): Promise<void> {
    const url = `${this.getComputeUrl()}/${projectKeystoneId}/servers/${serverId}/os-volume_attachments/${attachmentId}`;
    await this.request({ method: "delete", url });
  }
}

export const openstack = new OpenStackService();