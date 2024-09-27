# File Management System

This project is a full-stack application for file management, featuring a React frontend and a FastAPI backend. It allows users to upload files, view uploaded files, and manages file storage with a SQLite database.

## Project Structure

```
Dir/
├── backend/
│   ├── venv/
│   ├── app.py
│   └── requirements.txt
└── frontend/
    ├── node_modules/
    ├── public/
    ├── src/
    ├── .gitignore
    ├── package-lock.json
    ├── package.json
    └── README.md
```

## Backend

The backend is built with FastAPI and uses SQLite for database management.

### Setup

1. Navigate to the backend directory:
   ```
   cd Dir/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```
   uvicorn app:app --reload
   ```

The backend will be available at `http://localhost:8000`.

## Frontend

The frontend is a React application.

### Setup

1. Navigate to the frontend directory:
   ```
   cd Dir/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend will be available at `http://localhost:3000`.

## Features

- File upload with real-time progress
- View list of uploaded files
- Backend handles file storage and database management
- Responsive design for both desktop and mobile use

## API Endpoints

- `GET /files`: Retrieve list of uploaded files
- `WebSocket /ws`: Handle file uploads

## Technologies Used

- Backend:
  - FastAPI
  - SQLite
  - WebSockets
- Frontend:
  - React
  - Axios for HTTP requests
  - WebSocket API for real-time communication

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.