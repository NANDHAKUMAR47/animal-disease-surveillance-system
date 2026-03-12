# Setting Up MongoDB for ZoonoGuard

Your application requires a MongoDB database to store Case Reports, Owner details, and SMS Logs. Currently, you do not have MongoDB installed on your system.

Follow these steps to install and connect it.

## Option 1: Install MongoDB Community Server (Recommended for Windows)

This runs the database on your own computer (`localhost`).

1.  **Download**: Go to the [MongoDB Download Center](https://www.mongodb.com/try/download/community).
2.  **Select Version**: Choose the current stable version for Windows (msi).
3.  **Install**:
    *   Run the installer.
    *   Choose "Complete" setup.
    *   **IMPORTANT**: Ensure "Install MongoDB as a Service" is CHECKED.
    *   **IMPORTANT**: Uncheck "Install MongoDB Compass" if you want a faster install (you can install it later), or keep it if you want a visual tool to see your data.
4.  **Verify**:
    *   Open Task Manager services and check if `MongoDB` is running.
    *   Or open a terminal and try running `"C:\Program Files\MongoDB\Server\7.0\bin\mongo.exe"` (path may vary slightly).

## Option 2: Use MongoDB Atlas (Cloud)

If you don't want to install anything, use a free cloud database.

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up.
2.  Create a **Free Cluster**.
3.  Create a Database User (username and password).
4.  Allow Network Access (allow IP `0.0.0.0/0` for development).
5.  Get the **Connection String** (it looks like `mongodb+srv://<user>:<password>@cluster0...`).

## Connecting the App

Once you have a database running (local or cloud):

1.  **Edit Environment Variables**:
    *   Open `server/.env` (create it if it doesn't exist, using `.env.example`).
    *   Set `MONGO_URI`:
        *   For Local: `mongodb://localhost:27017/animal-health`
        *   For Cloud: `mongodb+srv://<user>:<password>@cluster0...` (replace details).

2.  **Populate Sample Data**:
    *   Open a new terminal in VS Code.
    *   Navigate to the server folder: `cd server`
    *   Run the seed script: `npm run seed`
    *   You should see: `Connected for seeding... Data Seeded!`

3.  **Restart Backend**:
    *   If `npm run dev` or `node server.js` was running, stop it (Ctrl+C) and run it again.

## Verification

After seeding, go to your dashboard at `http://localhost:3000` (or 3001) and the "Case Reports" database should now show the data from your screenshot.
