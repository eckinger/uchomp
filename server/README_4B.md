# UChomps – Iteration 2

## README Overview

1. We recall the initial Iteration 2 Plan, including initial features to implement and divison of labor
2. We summarize everything that we accomplished, everything we did not, and roughly who did what
3. We outline how to get the current version up and running


## Initial Iteration 2 Plan

In this second iteration of UChomps, we aimed to enhance group-related functionality and integrate actual email communication. These features build upon the foundations laid in our original design document by enabling group coordination and notifications.

### Initial Features to Implement/Unit Case Implementations and Divison of Labor
- **Join group (frontend-linked)** – *Alex*
- **Create a group (frontend-linked)** – *Alex*
- **Email functionality (Resend integration)** – *Sam*
- **Group expiration triggers email notifications** – *Sam*
- **Notifications for joining/leaving a group** – *Sam*
- **Filtering functionality** – *Mai*
- **Member view for group with participation counts** – *Mai*
- **GLeave group (with ownership transfer and group deletion logic)** – *Mai*


## Uchomp (Iteration) 2 Accomplishments / Labor

Note: We all worked together, helped on everything, and the divisons of labor below are loose. This was a team effort. 

- **Join group** – *Alex*
- **Create a group** – *Alex*
- **Email functionality (Resend integration)** – *Sam*
- **Group expiration triggers email notifications** – *Sam*
- **Notifications for joining/leaving a group** – *Sam*
- **Filtering functionality** – *Mai*
- **Member view for group with participation counts** – *Mai*
- **GLeave group (with ownership transfer and group deletion logic)** – *Mai*
- **Fixed, Improved, and Expanded several testing frameworks, particularly the notificationservice tests to reflect changes in our approach** - *Sam and Ben*
- **Debugging join and create group** - *Andrew and Alex*
- **Code Chiropractor At Large** - *Ben*
- **Getting mock to run tests for email** - *Ben and Sam*

## Running UChomp (iteration 2 it's even chompier!)

This server powers the backend of the Uchomp application and is built using Node.js with TypeScript, Express for handling HTTP requests, and PostgreSQL for persistent data storage using NeonDB

## Prerequisites

1. Node.js
2. [Docker](https://docs.docker.com/desktop/)

- We use the command line interface (CLI) instead of the GUI primarily

## Getting Started

### Development

1. Clone the repo
2. Navigate to `client/`
3. Install packages with `npm install`
4. Go back with `cd ..`
5. Navigate to `server/`
6. Install packages with `npm install`
7. Create a `.env` and `.env.db` environment files. Reasonable defaults are below:

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

8. Fire up the container using `docker compose up --build`
 > Note: Make sure docker desktop is open before firing up the container, and after you're done with docker, use `docker compose down` to close the container. 
9. Develop against a working database

### Testing

1. Follow steps 1-5 of [Development](#Development)
2. In a separate terminal, navigate to `/server` and run the tests with `npm test`

Once your environment is configured, build the TypeScript project by running `npm run build`. . After a successful build, you can start the server using `npm start`. The server runs on `http://localhost:5151`.

You can also run manual acceptance tests using PowerShell. Ensure that a terminal is running the server and you do `docker compose up --build` before you use the commands below. Also, be sure to be inside `/server` when doing manual testing.

To send a verification code to a user, use a POST request to `api/users/send-code` with a JSON body containing an email. A successful response includes the generated code. Use that code in a POST request to `api/users/verify` to confirm the user's email. To complete the user's profile, send a POST request to `api/users/update` with the same email and the user's name and phone number in the format `XXX-XXX-XXXX`. For order management, create a new food order by POSTing to `/api/orders/create` with `owner_id`, `restaurant`, `expiration` (as an ISO timestamp), and `loc` (one of the predefined enum values like `Regenstein Library`). Notice that the `owner_id` should match a user ID that you created. You can check for a user ID on the NeonDB under Tables. Delete an order using POST `/api/orders/delete/:id` where `:id` is the order's ID.

Here's an example of the commands to use in powershell:

Sending Verication Code:
```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/users/send-code" `
-Method POST `
-Body '{"email": "test@example.com"}' `
-ContentType "application/json"
```

Expected Output:
`{ "success": true, "code": "XXXXXX" }`
> Use the "XXXXXX" in the following command below

Verify Code:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/users/verify" `
  -Method POST `
  -Body '{"email": "test@example.com", "key": "XXXXXX"}' `
  -ContentType "application/json"
```

Expected Output:
`{ "success": true }`

Update User Profile:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/users/update" `
  -Method POST `
  -Body '{"email": "test@example.com", "name": "Test User", "cell": "123-456-7890"}' `
  -ContentType "application/json"
```

Expected Output:
`{ "success": true }`

Create Order:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/orders/create" `
  -Method POST `
  -Body '{
    "owner_id": "user-id-from-db",
    "restaurant": "Pizza Palace",
    "expiration": "2026-05-06T23:59:00Z",
    "loc": "Regenstein Library"
  }' `
  -ContentType "application/json"
```
> Note: You'll have to manually access the database to retrieve a user-id. You can do this with postgres installed, and using `psql -U postgres -d uchomp_dev` then to access the users table and list all users in the postgres, use `SELECT * FROM USERS;`. Then find a user-id from the table, and copy and paste it into `"owner_id"` below. If postgres is giving you trouble, you can also use download pgadmin 4, and add the docker server into pgadmin. Then use the dropdown to open servers, then Databases, then right-click on uchomp_dev, click on `Query Tool`, then input `SELECT * FROM USERS;`, and finally click the play button/execute script. The users table will be shown, and select a user-id from that table.

Expected Output:
`{ "success": true, "order_id": <order_id> }`
> Note: You need the order_id to delete an order, so be sure to use this order_id when using the delete order command below.

Get Orders:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/orders" `
  -Method GET
```

Expected Output:
```
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
```
> Note: If there are no orders in the database, then it won't return anything

Delete Order:

```powershell
Invoke-RestMethod -Uri "http://localhost:5151/api/orders/delete/<order_id>" `
  -Method POST
```

Expected Output:
`{ "success": true }`

## Implementation Details

The implementation includes the new notification service module: `notificationService.ts`:

In `notificationService.ts`, the following functionality was implemented:

- `sendEmail(email, subject, html)`: Function to actually send an email using resend
- `sendExpirationNotification(userEmail, groupName, expirationTime)`: Triggers an email to be sent if the expiration of a group occurs
- `sendJoinNotification(userEmail, groupName)`: Triggers an email to be sent if a member joins a group
- `sendLeaveNotification(userEmail, groupName)`: Triggers an email to be sent if a member of a group leaves

