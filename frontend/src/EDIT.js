import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, FileText, Table, File, Box } from 'lucide-react';

function EDIT() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(location.state?.selectedProject || null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [classification, setClassification] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-excel': '.xls',
    'application/step': '.step,.stp',
    'model/step': '.step,.stp',
    'application/octet-stream': '.step,.stp'
  };

  useEffect(() => {
    if (!selectedProject) {
      navigate('/');
      return;
    }
    fetch(`http://localhost:3001/files?projectId=${selectedProject.id}`)
      .then(res => res.json())
      .then(setFiles);
  }, [selectedProject, navigate]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => uploadFile(file));
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      selectedFiles.forEach(file => uploadFile(file));
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file) => {
    if (!selectedProject) {
      alert('Bitte wählen Sie zuerst eine Zeichnung aus');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classification', classification);
    formData.append('projectId', selectedProject.id);
    await fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData
    });
    fetch(`http://localhost:3001/files?projectId=${selectedProject.id}`)
      .then(res => res.json())
      .then(setFiles);
  };

  const handleUpload = async (e) => {
    if (!selectedProject) {
      alert('Bitte wählen Sie zuerst eine Zeichnung aus');
      return;
    }
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('classification', classification);
    formData.append('projectId', selectedProject.id);
    await fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData
    });
    fetch(`http://localhost:3001/files?projectId=${selectedProject.id}`)
      .then(res => res.json())
      .then(setFiles);
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Datei löschen möchten?')) return;
    await fetch(`http://localhost:3001/file/${filename}`, {
      method: 'DELETE'
    });
    fetch(`http://localhost:3001/files?projectId=${selectedProject.id}`)
      .then(res => res.json())
      .then(setFiles);
  };

  if (!selectedProject) {
    return null;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <button 
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#B31318',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Zurück
      </button>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#B31318', margin: 0 }}>
          Zeichnung bearbeiten: {selectedProject.name}
        </h1>
      </div>

      {/* Zeichnungs-Info */}
      <div style={{ 
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#B31318' }}>Zeichnungsinformationen</h2>
          <p><strong>Name:</strong> {selectedProject.name}</p>
          <p><strong>Verantwortlicher Mitarbeiter:</strong> {selectedProject.responsibleEmployee}</p>
          <p><strong>Bearbeitungsdatum:</strong> {new Date(selectedProject.editDate).toLocaleString()}</p>
        </div>
      </div>

      {/* Dateien hochladen */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#B31318' }}>Dateien hochladen</h2>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <label style={{ color: '#333', fontWeight: '500' }}>Klassifikation:</label>
          <select 
            value={classification} 
            onChange={(e) => setClassification(e.target.value)}
            style={{
              padding: '10px 15px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minWidth: '200px'
            }}
          >
               <option value=""></option>
               <option value="BOM">BOM</option>
            <option value="Stückliste">Stückliste</option>
            <option value="Bauteildatenblatt">Bauteildatenblatt</option>
           
          </select>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onClick={handleDropZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed #B31318' : '2px dashed rgba(179, 18, 24, 0.3)',
            borderRadius: '12px',
            padding: '12px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: isDragging ? 'rgba(179, 18, 24, 0.05)' : 'white',
            marginBottom: '20px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept={Object.values(acceptedTypes).join(',')}
          />
          
          <Upload style={{ width: '32px', height: '32px', color: '#B31318', margin: '0 auto 4px' }} />
          
          <h3 style={{ color: '#B31318', marginBottom: '2px', fontSize: '16px', marginTop: 0 }}>
            Dateien hochladen
          </h3>
          <p style={{ color: '#B31318', opacity: 0.7, marginBottom: '8px', fontSize: '13px' }}>
            Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid rgba(179, 18, 24, 0.2)',
              minWidth: '70px'
            }}>
              <Box style={{ width: '24px', height: '24px', color: '#B31318' }} />
              <span style={{ color: '#B31318', fontWeight: '500', fontSize: '12px' }}>STEP</span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid rgba(179, 18, 24, 0.2)',
              minWidth: '70px'
            }}>
              <Table style={{ width: '24px', height: '24px', color: '#B31318' }} />
              <span style={{ color: '#B31318', fontWeight: '500', fontSize: '12px' }}>Excel</span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid rgba(179, 18, 24, 0.2)',
              minWidth: '70px'
            }}>
              <FileText style={{ width: '24px', height: '24px', color: '#B31318' }} />
              <span style={{ color: '#B31318', fontWeight: '500', fontSize: '12px' }}>PDF</span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid rgba(179, 18, 24, 0.2)',
              minWidth: '70px'
            }}>
              <File style={{ width: '24px', height: '24px', color: '#B31318' }} />
              <span style={{ color: '#B31318', fontWeight: '500', fontSize: '12px' }}>Word</span>
            </div>
          </div>
        </div>

        <h3 style={{ color: '#B31318' }}>Hochgeladene Dateien</h3>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#B31318', color: 'white' }}>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Dateiname</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Klassifikation</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Hochgeladen am</th>
              <th style={{ padding: '12px 15px', textAlign: 'center' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                  Keine Dateien gefunden
                </td>
              </tr>
            ) : (
              files.map((f, index) => (
                <tr 
                  key={f.name}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <td style={{ padding: '12px 15px' }}>
                    <a 
                      href={`http://localhost:3001/file/${f.name}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#B31318' }}
                    >
                      {f.name}
                    </a>
                  </td>
                  <td style={{ padding: '12px 15px' }}>{f.classification}</td>
                  <td style={{ padding: '12px 15px' }}>{new Date(f.uploadedAt).toLocaleString()}</td>
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(f.name)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {selectedFile && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px' 
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#B31318' }}>Ausgewählt: {selectedFile}</h4>
            <a 
              href={`http://localhost:3001/file/${selectedFile}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#B31318' }}
            >
              {selectedFile} herunterladen
            </a>
          </div>
        )}
      </div>

      {/* Analyse starten */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#B31318' }}>Analyse</h2>
        <button
          onClick={() => navigate('/daten-analysieren', { state: { selectedProject } })}
          style={{
            padding: '15px 40px',
            fontSize: '16px',
            fontWeight: '500',
            backgroundColor: '#B31318',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Analyse starten
        </button>
      </div>
    </div>
  );
}

export default EDIT;
