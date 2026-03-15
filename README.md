# Cank

A full-stack application with a Node.js/Express backend REST API and a plain HTML/CSS/JS frontend.

## Structure

```
Cank-3/
├── backend/          # Express REST API (port 5000)
│   ├── server.js
│   ├── server.test.js
│   └── package.json
├── frontend/         # Static HTML/CSS/JS app (port 3000)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── package.json
└── package.json      # Root scripts
```

## Getting Started

### Install dependencies

```bash
npm run install:all
```

### Run the backend

```bash
npm run start:backend
# API available at http://localhost:5000
```

### Run the frontend

```bash
npm run start:frontend
# App available at http://localhost:3000
```

Open `http://localhost:3000` in your browser while the backend is running.

## API Endpoints

| Method | Path              | Description          |
|--------|-------------------|----------------------|
| GET    | /api/health       | Health check         |
| GET    | /api/items        | List all items       |
| GET    | /api/items/:id    | Get a single item    |
| POST   | /api/items        | Create a new item    |
| PUT    | /api/items/:id    | Update an item       |
| DELETE | /api/items/:id    | Delete an item       |

## Running Tests

```bash
cd backend && npm test
```
