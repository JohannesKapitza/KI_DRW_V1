const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const METADATA_FILE = path.join(__dirname, 'metadata.json');
const ZEICHNUNG_FILE = path.join(__dirname, 'zeichnung.json');
const DIN_FORMATS_FILE = path.join(__dirname, 'din-formats.json');
const ZEICHNUNGSKOPF_FILE = path.join(__dirname, 'zeichnungskopf.json');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, '{}');
if (!fs.existsSync(ZEICHNUNG_FILE)) fs.writeFileSync(ZEICHNUNG_FILE, '[]');
if (!fs.existsSync(ZEICHNUNGSKOPF_FILE)) fs.writeFileSync(ZEICHNUNGSKOPF_FILE, '{}');
if (!fs.existsSync(DIN_FORMATS_FILE)) {
  const defaultFormats = [
    { format: 'DIN A0', width: 841, height: 1189, containedInA0: '1x', name: 'Doppelbogen' },
    { format: 'DIN A1', width: 594, height: 841, containedInA0: '2x', name: 'Bogen' },
    { format: 'DIN A2', width: 420, height: 594, containedInA0: '4x', name: 'Halbbogen' },
    { format: 'DIN A3', width: 297, height: 420, containedInA0: '8x', name: 'Viertelbogen' },
    { format: 'DIN A4', width: 210, height: 297, containedInA0: '16x', name: 'Blatt (Briefbogen)' },
    { format: 'DIN A5', width: 148, height: 210, containedInA0: '32x', name: 'Halbblatt' },
    { format: 'DIN A6', width: 105, height: 148, containedInA0: '64x', name: 'Viertelblatt' },
    { format: 'DIN A7', width: 74, height: 105, containedInA0: '128x', name: 'Achtelblatt' },
    { format: 'DIN A8', width: 52, height: 74, containedInA0: '256x', name: 'Sechzehntelblatt' },
    { format: 'DIN A9', width: 37, height: 52, containedInA0: '512x', name: '–' },
    { format: 'DIN A10', width: 26, height: 37, containedInA0: '1024x', name: '–' }
  ];
  fs.writeFileSync(DIN_FORMATS_FILE, JSON.stringify(defaultFormats, null, 2));
}

const getMetadata = () => JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
const saveMetadata = (data) => fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
const getZeichnungen = () => JSON.parse(fs.readFileSync(ZEICHNUNG_FILE, 'utf8'));
const saveZeichnungen = (data) => fs.writeFileSync(ZEICHNUNG_FILE, JSON.stringify(data, null, 2));
const getDinFormats = () => JSON.parse(fs.readFileSync(DIN_FORMATS_FILE, 'utf8'));
const saveDinFormats = (data) => fs.writeFileSync(DIN_FORMATS_FILE, JSON.stringify(data, null, 2));
const getZeichnungskopfData = () => JSON.parse(fs.readFileSync(ZEICHNUNGSKOPF_FILE, 'utf8'));
const saveZeichnungskopfData = (data) => fs.writeFileSync(ZEICHNUNGSKOPF_FILE, JSON.stringify(data, null, 2));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Create project endpoint
app.post('/projects', (req, res) => {
  const zeichnungen = getZeichnungen();
  const newProject = {
    id: Date.now().toString(),
    name: req.body.name,
    zeichnungsnummer: req.body.zeichnungsnummer || '',
    createdAt: new Date().toISOString(),
    editDate: new Date().toISOString()
  };
  zeichnungen.push(newProject);
  saveZeichnungen(zeichnungen);
  res.json(newProject);
});

// List projects endpoint
app.get('/projects', (req, res) => {
  res.json(getZeichnungen());
});

// Delete project endpoint
app.delete('/projects/:id', (req, res) => {
  const projectId = req.params.id;
  
  // Delete all files associated with this project
  const metadata = getMetadata();
  const filesToDelete = Object.keys(metadata).filter(filename => metadata[filename].projectId === projectId);
  
  filesToDelete.forEach(filename => {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    delete metadata[filename];
  });
  saveMetadata(metadata);
  
  // Delete associated zeichnungskopf data
  const zeichnungskopfData = getZeichnungskopfData();
  delete zeichnungskopfData[projectId];
  saveZeichnungskopfData(zeichnungskopfData);
  
  // Delete the project
  let zeichnungen = getZeichnungen();
  zeichnungen = zeichnungen.filter(p => p.id !== projectId);
  saveZeichnungen(zeichnungen);
  
  res.json({ message: 'Project and associated files deleted', deletedFiles: filesToDelete.length });
});

// Update project endpoint
app.put('/projects/:id', (req, res) => {
  let zeichnungen = getZeichnungen();
  const index = zeichnungen.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }
  zeichnungen[index] = {
    ...zeichnungen[index],
    name: req.body.name || zeichnungen[index].name,
    zeichnungsnummer: req.body.zeichnungsnummer !== undefined ? req.body.zeichnungsnummer : zeichnungen[index].zeichnungsnummer,
    editDate: new Date().toISOString()
  };
  saveZeichnungen(zeichnungen);
  res.json(zeichnungen[index]);
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  const metadata = getMetadata();
  metadata[req.file.originalname] = {
    uploadedAt: new Date().toISOString(),
    projectId: req.body.projectId || null,
    classification: req.body.classification || 'Stückliste'
  };
  saveMetadata(metadata);
  res.json({ filename: req.file.originalname });
});

// List files endpoint
app.get('/files', (req, res) => {
  const projectId = req.query.projectId;
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).send('Error reading files');
    const metadata = getMetadata();
    let fileData = files.map(filename => ({
      name: filename,
      uploadedAt: metadata[filename]?.uploadedAt || null,
      projectId: metadata[filename]?.projectId || null,
      classification: metadata[filename]?.classification || null
    }));
    if (projectId) {
      fileData = fileData.filter(f => f.projectId === projectId);
    }
    res.json(fileData);
  });
});

// Serve files
app.get('/file/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  res.sendFile(filePath);
});

// Delete file endpoint
app.delete('/file/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).send('Error deleting file');
    const metadata = getMetadata();
    delete metadata[req.params.filename];
    saveMetadata(metadata);
    res.json({ message: 'File deleted' });
  });
});

// Get DIN formats endpoint
app.get('/din-formats', (req, res) => {
  res.json(getDinFormats());
});

// Add DIN format endpoint
app.post('/din-formats', (req, res) => {
  const formats = getDinFormats();
  const newFormat = {
    format: req.body.format,
    width: req.body.width,
    height: req.body.height,
    containedInA0: req.body.containedInA0,
    name: req.body.name
  };
  formats.push(newFormat);
  saveDinFormats(formats);
  res.json(newFormat);
});

// Update DIN format endpoint
app.put('/din-formats/:format', (req, res) => {
  let formats = getDinFormats();
  const index = formats.findIndex(f => f.format === req.params.format);
  if (index === -1) {
    return res.status(404).json({ message: 'Format not found' });
  }
  formats[index] = {
    format: req.body.format || formats[index].format,
    width: req.body.width || formats[index].width,
    height: req.body.height || formats[index].height,
    containedInA0: req.body.containedInA0 || formats[index].containedInA0,
    name: req.body.name || formats[index].name
  };
  saveDinFormats(formats);
  res.json(formats[index]);
});

// Delete DIN format endpoint
app.delete('/din-formats/:format', (req, res) => {
  let formats = getDinFormats();
  formats = formats.filter(f => f.format !== req.params.format);
  saveDinFormats(formats);
  res.json({ message: 'Format deleted' });
});


// Zeichnungskopf endpoints
app.get('/zeichnungskopf/:projectId', (req, res) => {
  const data = getZeichnungskopfData();
  const projectData = data[req.params.projectId] || null;
  res.json(projectData);
});

app.put('/zeichnungskopf/:projectId', (req, res) => {
  const data = getZeichnungskopfData();
  data[req.params.projectId] = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  saveZeichnungskopfData(data);
  res.json(data[req.params.projectId]);
});

app.delete('/zeichnungskopf/:projectId', (req, res) => {
  const data = getZeichnungskopfData();
  delete data[req.params.projectId];
  saveZeichnungskopfData(data);
  res.json({ message: 'Zeichnungskopf data deleted' });
});

// Extraction endpoint: extract Zeichnungskopf data from Excel files
const { exec } = require('child_process');
const PYTHON_PATH = '"C:\\Program Files (x86)\\Microsoft Visual Studio\\Shared\\Python39_64\\python.exe"';

app.post('/extract-titleblock', (req, res) => {
  const { projectId } = req.body;
  
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }
  
  // Get the project to find the zeichnungsnummer
  const zeichnungen = getZeichnungen();
  const project = zeichnungen.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const zeichnungsnummer = project.zeichnungsnummer || '';
  
  if (!zeichnungsnummer) {
    return res.status(400).json({ error: 'Projekt hat keine Zeichnungsnummer. Bitte zuerst eine Zeichnungsnummer eingeben.' });
  }
  
  // Run the Python extraction script
  const command = `${PYTHON_PATH} extract_from_excel.py "${UPLOAD_DIR}" "${zeichnungsnummer}"`;
  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, stderr });
    }
    try {
      const result = JSON.parse(stdout);
      
      // Save extracted data to zeichnungskopf.json
      if (result.success && result.data) {
        const zeichnungskopfData = getZeichnungskopfData();
        zeichnungskopfData[projectId] = {
          ...result.data,
          extractedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveZeichnungskopfData(zeichnungskopfData);
      }
      
      res.json(result);
    } catch (parseError) {
      res.status(500).json({ error: 'Failed to parse extraction result', output: stdout, stderr });
    }
  });
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
