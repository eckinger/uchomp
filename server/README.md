# Uchomp Server

This server powers the backend of the Uchomp application and is built using Node.js with TypeScript, Express for handling HTTP requests, and PostgreSQL for persistent data storage using NeonDB

To get started, make sure Node.js and PostgreSQL are installed. Clone the repository and make sure you're inside the `server` folder. Install dependencies using `npm install`. A `.env.local` file must be created in the `server` directory with a valid `DATABASE_URL` connection string pointing to your PostgreSQL instance in the NeonDB. This enables the server to connect to the database. Access to the NeonDB should be supplied to you via email, then you login, and paste the connection string into the .env.local file inside the server folder.

Once your environment is configured, build the TypeScript project by running `npm run build`. . After a successful build, you can start the server using `npm start`. The server runs on `http://localhost:5151`.

Testing is supported using Jest. Run `npx jest` to execute all unit tests defined in the `__tests__` directory. These include automated tests for `userService` and `orderService` functionality.

You can also run manual acceptance tests using PowerShell. ENsure that a terminal is running the server before you use the commands below.
 To send a verification code to a user, use a POST request to `/send-code` with a JSON body containing an email. A successful response includes the generated code. Use that code in a POST request to `/verify` to confirm the user's email. To complete the user's profile, send a POST request to `/update-profile` with the same email and the user's name and phone number in the format `XXX-XXX-XXXX`. For order management, create a new food order by POSTing to `/create-order` with `owner_id`, `restaurant`, `expiration` (as an ISO timestamp), and `loc` (one of the predefined enum values like `Regenstein Library`). Notice, that the `owner_id` should match a user ID that you created. You can check for a user ID on the NeonDB under Tables. Delete an order using DELETE `/delete-order/:id` where `:id` is the order's ID.
Here's an example of the commands to use in powershell:

Sending Verication Code:
Invoke-RestMethod -Uri "http://localhost:5151/send-code" `
  -Method POST `
  -Body '{"email": "test@example.com"}' `
  -ContentType "application/json"

Expected Output:
{ "success": true, "code": "XXXXXX" }


Verify Code:
Invoke-RestMethod -Uri "http://localhost:5151/verify" `
  -Method POST `
  -Body '{"email": "test@example.com", "key": "XXXXXX"}' `
  -ContentType "application/json"

Expected Output:
{ "success": true }

Update User Profile:
Invoke-RestMethod -Uri "http://localhost:5151/update-profile" `
  -Method POST `
  -Body '{"email": "test@example.com", "name": "Test User", "cell": "123-456-7890"}' `
  -ContentType "application/json"

Expected Output:
{ "success": true }

Create Order:
Invoke-RestMethod -Uri "http://localhost:5151/create-order" `
  -Method POST `
  -Body '{
    "owner_id": "user-id-from-db",
    "restaurant": "Pizza Palace",
    "expiration": "2025-05-06T23:59:00Z",
    "loc": "Regenstein Library"
  }' `
  -ContentType "application/json"

Expected Output:
{ "success": true, "order_id": <order_id> }


Delete Order:
Invoke-RestMethod -Uri "http://localhost:5151/delete-order/<order_id>" `
  -Method DELETE

Expected Output:
{ "success": true }

Get Orders:
Invoke-RestMethod -Uri "http://localhost:5151/orders" `
  -Method GET

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
- `create_order(owner_id, restaurant, expiration, loc)`: Accepts a user ID (must exist in the `user` table), restaurant name (must be provided), expiration time (must be in the future), and a location (must be one of the predefined `locs` enum values). If validation passes, the order is inserted into the `food_order` table.
- `delete_order(order_id)`: Deletes the order with the specified ID from the `food_order` table.
- `get_orders()`: Retrieves all active food orders (where expiration is in the future) along with the count and list of participants for each order. Orders are sorted by expiration date in ascending order.

The backend server was refactored from a single JavaScript file (`server.js`) to a modular and strictly typed TypeScript setup (`server.ts`). The original `server.js` only included a GET route to fetch users and lacked structured validation or business logic. The new `server.ts` introduces:
- POST `/send-code`: Triggers a verification code to the specified email.
- POST `/verify`: Verifies the submitted code for a given email.
- POST `/update-profile`: Updates a user’s full name and cell number.
- POST `/create-order`: Adds a new food order to the system.
- DELETE `/delete-order/:id`: Removes a specific food order by ID.
- GET `/orders`: Retrieves all active food orders with participant information.
- GET `/api/users`: Lists all users in the system.

Additionally, the PostgreSQL schema was modernized. In the old schema, the order model involved an ambiguous relation between `order_group`, `food_order`, and `user`, and lacked structured phone/email fields. The new schema now includes:
- A `user` table with fields: `id`, `email`, `name`, `cell`, and `created_at`.
- A `code` table with composite primary keys on `email` and `key`, used for temporary verification codes.
- A `food_order` table which now explicitly uses `owner_id` referencing a user, and adds `restaurant`, `expiration` as a timestamp, and `loc`, a constrained enum (`Regenstein Library`, `Harper Library`, or `John Crerar Library`).
- An `order_group` table referencing both a user and a food order with properly enforced foreign keys and cascading deletes.
