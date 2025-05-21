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

### Prerequisites

1. Node.js
2. [Docker](https://docs.docker.com/desktop/)

- We use the command line interface (CLI) instead of the GUI primarily

### Getting Started

### Development

1. Clone the repo
2. Navigate to `server/`
3. Install packages with `npm install`
    3a. Remember: 'npm install resend'
4. Create a `.env` and `.env.db` environment files. Reasonable defaults are below:

```.env
DATABASE_URL=postgresql://neondb_owner:password@localhost:5432/uchomp_dev
RESEND_API_KEY=re_FtKzmJQ5_52cUV7JdTPEAQuSe53PzQs6S
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
2. In a separate terminal, navigate to `/server` and run the tests with `npm run test`

Once your environment is configured, build the TypeScript project by running `npm run build`. . After a successful build, you can start the server using `npm start`. The server runs on `http://localhost:5151`.

You can also run manual acceptance tests using PowerShell. Ensure that a terminal is running the server before you use the commands below.
To send a verification code to a user, use a POST request to `/send-code` with a JSON body containing an email. A successful response includes the generated code. Use that code in a POST request to `/verify` to confirm the user's email. To complete the user's profile, send a POST request to `/update-profile` with the same email and the user's name and phone number in the format `XXX-XXX-XXXX`. For order management, create a new food order by POSTing to `/create` with `owner_id`, `restaurant`, `expiration` (as an ISO timestamp), and `loc` (one of the predefined enum values like `Regenstein Library`). Notice that the `owner_id` should match a user ID that you created. You can check for a user ID on the NeonDB under Tables. Delete an order using DELETE `/delete-order/:id` where `:id` is the order's ID.
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

The implementation includes the new notification service module: `notificationService.ts`:

In `notificationService.ts`, the following functionality was implemented:

- `sendEmail(email, subject, html)`: Function to actually send an email using resend
- `sendExpirationNotification(userEmail, groupName, expirationTime)`: Triggers an email to be sent if the expiration of a group occurs
- `sendJoinNotification(userEmail, groupName)`: Triggers an email to be sent if a member joins a group
- `sendLeaveNotification(userEmail, groupName)`: Triggers an email to be sent if a member of a group leaves

