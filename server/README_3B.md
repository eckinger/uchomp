# Uchomp Server

This server powers the backend of the Uchomp application and is built using Node.js with TypeScript, Express for handling HTTP requests, and PostgreSQL for persistent data storage using NeonDB

## Prerequisites

1. Node.js
2. [Docker](https://docs.docker.com/desktop/)

- We use the command line interface (CLI) instead of the GUI primarily

## Getting Started

### Development

1. Clone the repo
2. Navigate to `server/`
3. Install packages with `npm install`
4. Create a `.env` and `.env.db` environment files. Reasonable defaults are below:

```.env
DATABASE_URL=postgresql://neondb_owner:password@localhost:5432/uchomp_dev
```

```.env.db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=uchomp_dev
POSTGRES_PORT=5432
```

> [!important] > `neondb_owner` is not arbitrary—it is given privileges to the docker database in `.init-db.sql`

5. Fire up the container using `docker compose up --build`
6. Develop against a working database

### Testing

1. Follow steps 1-5 of [Development](#Development)
2. In a separate terminal, navigate to `/server` and run the tests with `npm run tests`

Once your environment is configured, build the TypeScript project by running `npm run build`. . After a successful build, you can start the server using `npm start`. The server runs on `http://localhost:5151`.

You can also run manual acceptance tests using PowerShell. Ensure that a terminal is running the server before you use the commands below.
To send a verification code to a user, use a POST request to `/send-code` with a JSON body containing an email. A successful response includes the generated code. Use that code in a POST request to `/verify` to confirm the user's email. To complete the user's profile, send a POST request to `/update-profile` with the same email and the user's name and phone number in the format `XXX-XXX-XXXX`. For order management, create a new food order by POSTing to `/create-order` with `owner_id`, `restaurant`, `expiration` (as an ISO timestamp), and `loc` (one of the predefined enum values like `Regenstein Library`). Notice that the `owner_id` should match a user ID that you created. You can check for a user ID on the NeonDB under Tables. Delete an order using DELETE `/delete-order/:id` where `:id` is the order's ID.
Here's an example of the commands to use in powershell:

Sending Verication Code:
```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/users/send-code" `
-Method POST `
-Body '{"email": "test@example.com"}' `
-ContentType "application/json"
```

Expected Output:
{ "success": true, "code": "XXXXXX" }

Verify Code:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/users/verify" `
  -Method POST `
  -Body '{"email": "test@example.com", "key": "XXXXXX"}' `
  -ContentType "application/json"
```

Expected Output:
{ "success": true }

Update User Profile:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/users/update" `
  -Method POST `
  -Body '{"email": "test@example.com", "name": "Test User", "cell": "123-456-7890"}' `
  -ContentType "application/json"
```

Expected Output:
{ "success": true }

Create Order:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/orders/create" `
  -Method POST `
  -Body '{
    "owner_id": "user-id-from-db",
    "restaurant": "Pizza Palace",
    "expiration": "2025-05-06T23:59:00Z",
    "loc": "Regenstein Library"
  }' `
  -ContentType "application/json"
```

Expected Output:
{ "success": true, "order_id": <order_id> }

Delete Order:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/orders/delete/<order_id>" `
  -Method DELETE
```

Expected Output:
{ "success": true }

Get Orders:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/orders" `
  -Method GET
```

Expected Output:
[
{
"id": 1,
"owner_id": "user-id-from-db",
"restaurant": "Pizza Palace",
"expiration": "2025-05-06T23:59:00Z",
"loc": "Regenstein Library",
"participant_count": 3,
"participants": ["user-id-1", "user-id-2", "user-id-3"]
},
...
]

The implementation includes two core service modules: `userService.ts` and `orderService.ts`.

In `userService.ts`, the following functionality was implemented:

- `send_code(email)`: Generates a 6-digit numeric code, stores it in the `code` table using an upsert (insert or update) strategy, and ensures the email exists in the `user` table. If not, it creates a new user entry with just the email.
- `verify(email, code)`: Checks if the code exists and matches the given email. It ensures the code is not older than 10 minutes. If valid, it deletes the code from the database and confirms the user.
- `get_name_and_cell(email, name, cell)`: Updates the user’s record with a full name and a phone number. Phone numbers are validated to match the format `XXX-XXX-XXXX`. If the user does not exist, it throws an error.
- `save_user(name, cell, email)`: A utility function (not used in the live routes) that inserts or updates a user’s full profile in the database.

In `orderService.ts`, the following logic was implemented:

- `createOrder(owner_id, restaurant, expiration, loc)`: Accepts a user ID (must exist in the `user` table), restaurant name (must be provided), expiration time (must be in the future), and a location (must be one of the predefined `locs` enum values). If validation passes, the order is inserted into the `food_order` table.
- `deleteOrder(order_id)`: Deletes the order with the specified ID from the `food_order` table.
- `getOrders()`: Retrieves all active food orders (where expiration is in the future) along with the count and list of participants for each order. Orders are sorted by expiration date in ascending order.

The backend server was refactored from a single JavaScript file (`server.js`) to a modular and strictly typed TypeScript setup (`server.ts`). The original `server.js` only included a GET route to fetch users and lacked structured validation or business logic. The new `server.ts` introduces:

- POST `/send-code`: Triggers a verification code to the specified email.
- POST `/verify`: Verifies the submitted code for a given email.
- POST `/update-profile`: Updates a user’s full name and cell number.
- POST `/create-order`: Adds a new food order to the system.
- DELETE `/delete-order/:id`: Removes a specific food order by ID.
- GET `/api/users`: Lists all users in the system.
- GET `/orders`: Retrieves all active food orders with participant information.
- GET `/api/users`: Lists all users in the system.

Additionally, the PostgreSQL schema was modernized. In the old schema, the order model involved an ambiguous relation between `order_group`, `food_order`, and `user`, and lacked structured phone/email fields. The new schema now includes:

- A `users` table with fields: `id`, `email`, `name`, `cell`, and `created_at`.
- A `codes` table with composite primary keys on `email` and `key`, used for temporary verification codes.
- A `food_orders` table which now explicitly uses `id` referencing a user, and adds `restaurant`, `expiration` as a timestamp, and `location`, a constrained enum (`Regenstein Library`, `Harper Library`, or `John Crerar Library`).
- An `order_groups` table referencing both a user and a food order with properly enforced foreign keys and cascading deletes.

# Contributions

### Backend: Andrew

- Implemented first iteration of orderSevice.ts and userService.ts
- Changed test files from .js to .ts and moved them to server instead of client
- Changed server.js to server.ts and moved to server folder
- Contributed to first iteration of server.ts implementing api calls verify, update-profile, create-order, and delete-order
- Assisted in creating the schema.sql
- Assisted in README.md
- Assisted in TestCaseChanges.md
- Contributed in testing the server functionality, and reviewing code implemented

### Frontend + Backend: Ben

- Designed frontend mockups
- Scaffolded routing for the frontend
- Setup docker configuration
- Migrated backend code into SQL stored procedures and functions
- Architected the infrastructure of the frontend and backend (refactoring, naming conventions, general architecture)

### Frontend + (a tiny bit of) Backend : Mai

- Overall responsible for all client/src code
- Designed frontend mockups
- Built React pages and components
- Set up frontend service layer for API integration with the backend
- Added GET /orders endpoint to backend
