# WebPilot

This is a monolithic application built with Next.js for the frontend and Node.js for the backend.

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- Node.js
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shodh-ai/WebPilot.git
   ```
2. Navigate to the project directory:
   ```bash
   cd WebPilot
   ```
3. Install the dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Environment Variables

Create a `.env` file in the root directory of the project with the following structure:
```
SUPABASE_URL = url to supabase
SUPABASE_KEY = api key for supabase
JWT_SECRET = secret for jwt
NEXT_PUBLIC_OPENAI_API_KEY = api key for openai
BACKEND_PORT = port for backend server
```

### Running the Application

To run the application in development mode, use the following command:
```bash
npm run dev
# or
yarn dev
```
This will start both the frontend and backend servers.

### Populating the Database

To populate a new database, run the following command:
```bash
python populate_database.py
```
