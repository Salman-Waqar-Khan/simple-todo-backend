# Simple Todo Backend

A beginner-friendly REST API for creating and managing todo items. It uses Node.js, Express, MongoDB, and Mongoose and supports the full set of CRUD operations: create, read, update, and delete.

## What this project does

- Creates a todo
- Lists all todos
- Gets one todo by its MongoDB ID
- Updates a todo
- Deletes a todo
- Stores data in MongoDB Atlas or a local MongoDB database viewed with Compass

## Prerequisites

Install the following before starting:

- [Node.js](https://nodejs.org/) (the current LTS release is recommended)
- npm (included with Node.js)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account, or a local MongoDB installation
- [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (optional, but useful for viewing the data)
- [Postman](https://www.postman.com/downloads/) (optional, for testing the API)

Check that Node.js and npm are available:

```bash
node --version
npm --version
```

## Setup

1. Clone the repository and open the project folder:

   ```bash
   git clone <your-repository-url>
   cd simple-todo-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file by copying `.env.example` to `.env`:

   **Windows PowerShell**

   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS/Linux**

   ```bash
   cp .env.example .env
   ```

4. Replace the placeholder values in `.env` with your own connection details:

   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_URL_ENCODED_PASSWORD@YOUR_CLUSTER_HOST/todo_app?retryWrites=true&w=majority&appName=TodoCluster
   ```

   Keep `.env` private. It is ignored by Git and must never be committed, pasted into screenshots, or shared. If a real password is exposed, rotate it immediately in MongoDB Atlas.

5. Start the API. Use the script provided by the project:

   ```bash
   npm run dev
   ```

   If the project does not have a development script, use:

   ```bash
   npm start
   ```

The API is available at `http://localhost:5000` by default.

## MongoDB Atlas setup

1. Sign in to MongoDB Atlas and create a free project and cluster.
2. Under **Database Access**, create a database user. Use a strong password that is different from your Atlas account password.
3. Under **Network Access**, add your current IP address. For a classroom demo, Atlas also offers access from anywhere (`0.0.0.0/0`), but restricting access to your own IP is safer.
4. Open **Database > Connect > Drivers**, select Node.js, and copy the connection string.
5. Replace `<password>` and any other placeholders in that string, then put it in your local `.env` as `MONGODB_URI`.
6. Start the server and create the first todo.

MongoDB creates the database and collection lazily. Therefore, the database/collection may not appear in Atlas or Compass until the first todo is successfully inserted. Refresh the Atlas Collections view or Compass after making the first `POST /todos` request.

### View Atlas data in MongoDB Compass

1. In Atlas, choose **Connect > Compass** and copy the Compass connection string.
2. Open Compass, paste the string, replace any password placeholder, and select **Connect**.
3. Open the `todo_app` database and its `todos` collection.

For a local MongoDB server, a typical URI is:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/todo_app
```

## API endpoints

All request and response bodies use JSON. When sending a body, include the header `Content-Type: application/json`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/todos` | Create a todo |
| `GET` | `/todos` | List all todos |
| `GET` | `/todos/:id` | Get one todo |
| `PUT` | `/todos/:id` | Update one todo |
| `DELETE` | `/todos/:id` | Delete one todo |

### Create a todo

`POST http://localhost:5000/todos`

Example request body:

```json
{
  "title": "Finish backend assignment",
  "description": "Create and test all CRUD endpoints.",
  "completed": false
}
```

Example `201 Created` response:

```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Finish backend assignment",
    "description": "Create and test all CRUD endpoints.",
    "completed": false,
    "createdAt": "2026-11-01T08:00:00.000Z",
    "updatedAt": "2026-11-01T08:00:00.000Z"
  }
}
```

### List all todos

`GET http://localhost:5000/todos`

Example response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "671234567890abcdef123456",
      "title": "Finish backend assignment",
      "completed": false
    }
  ]
}
```

### Get one todo

`GET http://localhost:5000/todos/671234567890abcdef123456`

Example response:

```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Finish backend assignment",
    "completed": false
  }
}
```

### Update a todo

`PUT http://localhost:5000/todos/671234567890abcdef123456`

Example request body:

```json
{
  "title": "Submit backend assignment",
  "completed": true
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Submit backend assignment",
    "completed": true
  }
}
```

### Delete a todo

`DELETE http://localhost:5000/todos/671234567890abcdef123456`

Example response:

```json
{
  "success": true,
  "message": "Todo deleted successfully.",
  "data": {
    "_id": "671234567890abcdef123456",
    "title": "Submit backend assignment",
    "completed": true
  }
}
```

Common error responses include `400 Bad Request` for invalid input/IDs, `404 Not Found` when a todo does not exist, and `500 Internal Server Error` for unexpected server or database errors. Errors use this general shape:

```json
{
  "success": false,
  "message": "Todo not found"
}
```

Validation errors can also include an `errors` array whose entries contain `field` and `message` values.

## Test with Postman

This repository includes `Simple-Todo-Backend.postman_collection.json`.

1. Start the API and confirm that MongoDB connects successfully.
2. Open Postman and select **Import**.
3. Choose `Simple-Todo-Backend.postman_collection.json`.
4. Open the imported collection. Its `baseUrl` variable is already set to `http://localhost:5000`.
5. Send **Create Todo** first. Its test script saves the returned `_id` as the collection variable `todoId`.
6. Send the remaining requests in order, or use the Collection Runner.

If an existing todo should be tested instead, open the collection variables and paste its MongoDB ID into `todoId`. This implementation returns `201` for create and `200` for reads, update, and delete.

### Verified result

The full collection was run against MongoDB Atlas on November 1, 2026. All **5 requests**, **5 test scripts**, and **9 assertions** passed with **0 failures**. The todo created during the run was deleted by the final request.

## Push the project to GitHub

Before pushing, confirm that `.env` is not tracked:

```bash
git status
```

Then create an empty GitHub repository and run:

```bash
git init
git add .
git commit -m "Build simple todo backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/simple-todo-backend.git
git push -u origin main
```

If the project already has Git initialized or already has an `origin` remote, skip the corresponding command. Never use `git add -f .env`.

## Troubleshooting

- **MongoDB connection fails:** Check the Atlas username, password, cluster host, IP access list, and connection string. URL-encode special characters in a password.
- **Port 5000 is busy:** Change `PORT` in `.env`, restart the API, and update Postman's `baseUrl`.
- **A todo is not found:** Confirm that `todoId` contains a real 24-character MongoDB ObjectId from the same database.
- **Database is missing in Atlas/Compass:** Create the first todo successfully, then refresh the database list.
- **Environment variables are undefined:** Confirm the filename is exactly `.env`, restart the server after editing it, and ensure the application loads `dotenv` before reading the variables.

## Security reminder

Only `.env.example` belongs in source control. It should contain placeholders, never a real database URI, password, API key, or token.

