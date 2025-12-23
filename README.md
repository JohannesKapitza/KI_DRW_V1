# KI_DRW_V1 - CATIA V5 CATPart Manager

A React/Node.js application for managing CATIA V5 drawing data, extracting Zeichnungskopf (title block) information from Excel files, and organizing technical documentation.

## Features

- 📁 Project management for technical drawings (Zeichnungen)
- 📤 File upload with classification (Zeichnungskopf, Stückliste)
- 🔍 Automatic data extraction from Excel files
- ✏️ Editable Zeichnungskopf data fields
- 💾 Persistent data storage in JSON files

## Prerequisites

Before running the application, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **pip** (Python package manager)

## Installation

### 1. Clone the Repository

```powershell
git clone https://github.com/JohannesKapitza/KI_DRW_V1.git
cd KI_DRW_V1
```

### 2. Install Backend Dependencies

```powershell
cd backend
npm install
```

### 3. Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

### 4. Install Python Dependencies

```powershell
pip install pandas openpyxl
```

## Running the Application

### Option 1: Using the Start Script (Recommended)

Simply double-click `start.bat` or run:

```powershell
.\start.bat
```

This will start both backend and frontend automatically.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

## Accessing the Application

Once both servers are running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## Project Structure

```
KI_DRW_V1/
├── backend/
│   ├── server.js              # Express API server
│   ├── extract_from_excel.py  # Python script for data extraction
│   ├── zeichnung.json         # Project data storage
│   ├── zeichnungskopf.json    # Extracted title block data
│   ├── metadata.json          # File metadata
│   └── uploads/               # Uploaded files
├── frontend/
│   ├── public/
│   │   └── steckbrief_v1.svg  # PDF template
│   └── src/
│       ├── App.js             # Home page - project list
│       ├── EDIT.js            # Edit page - file upload
│       └── ANALYSE.js         # Analysis page - data extraction
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects` | GET | List all projects |
| `/projects` | POST | Create a new project |
| `/projects/:id` | PUT | Update a project |
| `/projects/:id` | DELETE | Delete a project and its files |
| `/upload` | POST | Upload a file |
| `/files` | GET | List files (optional: ?projectId=) |
| `/zeichnungskopf/:projectId` | GET | Get saved Zeichnungskopf data |
| `/zeichnungskopf/:projectId` | PUT | Save Zeichnungskopf data |
| `/extract-titleblock` | POST | Extract data from Excel files |

## Troubleshooting

### Python not found
Make sure Python is installed and added to your PATH. On Windows, you may need to use:
```powershell
py -m pip install pandas openpyxl
```

### Port already in use
If port 3000 or 3001 is already in use, the application will prompt you to use a different port.

### Unicode errors
The application handles Unicode characters (German umlauts, special symbols). If you encounter encoding issues, ensure your terminal supports UTF-8.

## License

MIT License
