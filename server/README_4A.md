# UChomps – Iteration 2

## Iteration 2 Plan

In this second iteration of UChomps, we aim to enhance group-related functionality and integrate actual email communication. These features build upon the foundations laid in our original design document by enabling group coordination and notifications.

### Features to Implement
- **Join group (frontend-linked)** – *Alex*
- **Create a group (frontend-linked)** – *Alex*
- **Email functionality (Resend integration)** – *Sam*
- **Group expiration triggers email notifications** – *Sam*
- **Notifications for joining/leaving a group** – *Sam*
- **Filtering functionality** – *Mai*
- **Member view for group with participation counts** – *Mai*
- **GLeave group (with ownership transfer and group deletion logic)** – *Mai*

## Division of Labor

| Feature                                          | Assigned To |
|--------------------------------------------------|-------------|
| Join group (frontend-linked)                     | Alex        |
| Create a group (frontend-linked)                 | Alex        |
| Email delivery via Resend                        | Sam         |
| Group expiration notifications                   | Sam         |
| Join/leave email notifications                   | Sam         |
| Filtering                                        | Mai         |
| Group member viewer and participation count view | Mai         |
| Leave group                                      | Mai         |

## Main Code Directory Structure:

- uchomp-main/
  - client/
    - src/
      - pages/
        - createGroup.tsx
        - recordInfo.tsx
        - viewGroups.tsx
      - components/
        - VerificationModal.tsx
      - services/
        - apiClient.ts
        - orderService.ts
        - userService.ts
      - App.tsx
      - index.tsx
  - server/
    - __tests__/
      - userService.test.ts
      - orderService.test.ts
    - controllers/
      - userController.ts
      - orderController.ts
    - services/
      - userService.ts
      - orderService.ts
    - routes/
      - userRoutes.ts
      - orderRoutes.ts
    - db/
      - db.ts
      - init-db.sql
      - schema.sql
      - seed.sql
    - docker-compose.yml
    - server.ts

## Environment Setup, Compilation, and Build

This section describes how to set up the development environment, build the backend, and run tests

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://docs.docker.com/desktop/)

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd uchomp-main/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment files**

   Create a `.env` file inside the `server/` directory:
   ```env
   DATABASE_URL=postgresql://neondb_owner:password@localhost:5432/uchomp_dev
   ```

   Create a `.env.db` file inside the same directory:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DB=uchomp_dev
   POSTGRES_PORT=5432
   ```

   > Note: The `neondb_owner` user is required because it is granted privileges in the `init-db.sql` setup script.

4. **Start Docker containers**
   ```bash
   docker compose up --build
   ```

5. **Build the TypeScript backend**
   ```bash
   npm run build
   ```

6. **Start the backend server**
   ```bash
   npm start
   ```

   The server will be running at: `http://localhost:5151`

---

## Unit Tests

We include unit tests for all core service functions using Jest and TypeScript. Navigate to `/server` and run:

```bash
npm test
```
Note: Environment setup should be completed beforehand

In the files containing our unit tests, we have comments that describe what the unit test aims to do.


