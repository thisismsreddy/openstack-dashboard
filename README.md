> **Note:** This project was built by Codex with 04-min model and it costed me 9 USD.

# OpenStack Dashboard

This project is a web-based dashboard for managing OpenStack resources, including servers, volumes, and projects. It features user authentication and provides a user-friendly interface to interact with an OpenStack environment.

## Project Structure

The project is divided into two main parts:

-   `frontend/`: Contains the React-based user interface.
-   `backend/`: Contains the Node.js/Express API server that interacts with OpenStack and manages data persistence.

## Technology Stack

**Frontend:**

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   React Router

**Backend:**

-   Node.js
-   Express
-   TypeScript
-   Prisma (with PostgreSQL - inferred from typical Prisma usage)
-   JWT for authentication
-   Bcrypt for password hashing

## Getting Started

### Prerequisites

-   Node.js and npm/yarn
-   Access to an OpenStack environment
-   A PostgreSQL database (or adjust `prisma/schema.prisma` for a different database)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in your OpenStack credentials, database URL, and JWT secret.
    ```bash
    cp .env.example .env
    # Edit .env with your details
    ```
4.  **Apply database migrations:**
    ```bash
    npx prisma migrate dev
    ```
5.  **Start the backend server:**
    (Defaults to port 3000, check `backend/src/index.ts` if needed)
    ```bash
    npm run dev
    # or
    yarn dev
    ```

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Start the frontend development server:**
    (Defaults to port 5173, check `frontend/vite.config.ts` if needed)
    ```bash
    npm run dev
    # or
    yarn dev
    ```

The application should now be accessible, typically at `http://localhost:5173` (Vite's default).

## Usage

1.  **Register/Login:** Access the frontend URL (e.g., `http://localhost:5173`) in your browser. Register a new user account or log in with existing credentials.
2.  **Manage Projects:** After logging in, you can view existing OpenStack projects or potentially create new ones (depending on backend implementation).
3.  **Manage Servers:** Select a project to view its servers. You can create new servers, view details, perform actions (start, stop, reboot), and delete servers.
4.  **Manage Volumes:** Within a project context, you can view, create, delete, attach, and detach volumes from servers.
5.  **API Interaction:** The frontend interacts with the backend API. You can also interact with the API directly using tools like `curl` or Postman (authentication required for most endpoints).

## API Endpoints

The backend exposes the following RESTful API endpoints (base path typically `/api`, check `backend/src/index.ts`):

**Authentication (`/auth`)**

-   `POST /register`: Register a new user.
-   `POST /login`: Log in a user, returns JWT tokens.
-   `POST /refresh`: Refresh JWT access token using a refresh token.

**Projects (`/projects`)** (Requires Authentication)

-   `GET /`: List accessible OpenStack projects.
-   `POST /`: Create a new OpenStack project (implementation details may vary).

**Servers (`/servers`)** (Requires Authentication)

-   `GET /:projectId`: List servers within a specific project.
-   `POST /:projectId`: Create/boot a new server in a project.
-   `POST /:projectId/:serverId/action`: Perform an action on a server (e.g., reboot, stop, start). Requires action details in the request body.
-   `DELETE /:projectId/:serverId`: Delete a server.
-   `GET /:projectId/flavors`: List available server flavors (sizes) for a project.
-   `GET /:projectId/networks`: List available networks for a project.

**Volumes (`/volumes`)** (Requires Authentication)

-   `GET /:projectId`: List volumes within a specific project.
-   `POST /:projectId`: Create a new volume in a project.
-   `DELETE /:projectId/:volumeId`: Delete a volume.
-   `POST /:projectId/:serverId/attach`: Attach a volume to a server. Requires volume details in the request body.
-   `DELETE /:projectId/:serverId/attach/:attachmentId`: Detach a volume from a server.

*(Note: All endpoints requiring authentication expect a valid JWT Bearer token in the `Authorization` header.)*

