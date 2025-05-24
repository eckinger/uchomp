# UChomps

UChomps makes group food ordering at the University of Chicago fast, social, and convenient. It connects students who want to place shared orders from nearby restaurants—saving money and time.

---

## 📋 Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Functionality Overview](#functionality-overview)
- [How to Use](#how-to-use)
- [Development](#development)
- [Testing](#testing)
- [Running the Server](#running-the-server)
- [License](#license)

---

## 📖 Introduction

UChomps is a web application that facilitates group food ordering among UChicago students. Users can create or join order groups based on location and restaurant, verify their UChicago email, share contact information with group members, and confirm group orders collaboratively.

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://docs.docker.com/desktop/) (CLI is preferred)

---

## 🚀 Getting Started

### Development

1. Clone the repo:
   ```bash
   git clone https://github.com/eckinger/uchomp.git
   cd uchomps
   ```

2. Navigate to the backend:
   ```bash
   cd server/
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `.env` and `.env.db` files:

   **.env**
   ```env
   DATABASE_URL=postgresql://neondb_owner:password@localhost:5432/uchomp_dev
   ```

   **.env.db**
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DB=uchomp_dev
   POSTGRES_PORT=5432
   ```

   > `neondb_owner` is required due to Docker DB permissions setup in `.init-db.sql`.

5. Start the backend with Docker:
   ```bash
   docker compose up --build
   ```

   > To stop Docker when done:
   ```bash
   docker compose down
   ```

---

## Testing

1. Set up the environment as described in [Development](#development).
2. In a new terminal:
   ```bash
   cd server/
   npm test
   ```

---

## Running the Server

### Backend
```bash
cd server/
npm run build
npm start
```
Runs at: `http://localhost:5151`

### Frontend
```bash
cd client/
npm install
npm run build
npm start
```
Runs at: `http://localhost:3000`

---

## Functionality Overview

UChomps offers a streamlined system for initiating and joining group food orders with classmates:

- **Email Verification**: Ensures users are UChicago students.
- **Profile Setup**: Requires name and phone number for contact within groups.
- **Group Creation**: Users specify restaurant, location, and an expiration time.
- **Group Viewing**: All open and personal groups are accessible with relevant status and participant details.
- **Order Confirmation**: Group owners can finalize groups and begin the order process.
- **Participation Management**: Members can leave groups at any time; owners can transfer or finalize.

---

## How to Use

1. **Start the servers**:
   - In one terminal:
     ```bash
     cd server/
     npm start
     ```
   - In a second terminal:
     ```bash
     cd client/
     npm start
     ```

2. **Go to the app**: Open `http://localhost:3000` in your browser.

3. **Verify your UChicago email**:
   - Click the **"Create Group"** button.
   - Enter your UChicago email.
   - Wait for a verification code to arrive in your inbox.
   - Input the code in the app.

4. **Set up your profile**:
   - Provide your **name** and **phone number**.
   - This information helps group members coordinate orders.

5. **Create a group**:
   - Fill out:
     - **Restaurant name**
     - **Delivery location** (e.g., Regenstein Library)
     - **Order expiration time**
   - Submit to create the group.

6. **Manage your group**:
   - As the owner, you can:
     - View participants
     - Leave the group (ownership transfers or group deletes if alone)
     - Confirm the group to lock participants and initiate the order

7. **Join other groups**:
   - Explore active groups on the main page
   - Click **Join** to participate in a group order

8. **Confirming an order**:
   - When you're ready to place the order, click **Confirm**
   - You’ll receive final instructions and participant details

---
