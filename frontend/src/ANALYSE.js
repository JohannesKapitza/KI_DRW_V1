import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ANALYSE() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(location.state?.selectedProject || null);
  const [files, setFiles] = useState([]);
  const [analyseType, setAnalyseType] = useState('Zeichnungskopf');
  const [zeichnungskopfData, setZeichnungskopfData] = useState({
    'CAD System': '##',
    'Abteilung': '##',
    'Name Zeichnungsverantwortlicher': '##',
    'Telefonnummer Zeichnungsverantwortlicher': '##',
    'Projekt': '##',
    'Werkstoff': '##',
    'Gewicht': '##',
    'Halbzeug': '##',
    'Format Zeichnungsblatt': '##',
    'Oberflächenschutz': '##',
    'Blattnummer': '##',
    'Blattanzahl': '##',
    'Benennung': '##',
    'Teilenummer': '##',
    'Maßstab': '##'
  });

  const handleZeichnungskopfChange = (fieldName, value) => {
    setZeichnungskopfData(prev => ({
      ...prev,
      [fieldName]: value
    }));
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

  if (!selectedProject) {
    return null;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <button 
        onClick={() => navigate('/zeichnung-bearbeiten', { state: { selectedProject } })}
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
          Daten analysieren: {selectedProject.name}
        </h1>
      </div>

      {/* Zeichnungs-Info and Hochgeladene Dateien side by side */}
      <div style={{ 
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        alignItems: 'flex-start'
      }}>
        {/* Zeichnungs-Info */}
        <div style={{ 
          flex: '0 0 350px',
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

        {/* Hochgeladene Dateien */}
        <div style={{ 
          flex: 1,
          padding: '20px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#B31318' }}>Hochgeladene Dateien</h2>
          {files.length === 0 ? (
            <p style={{ color: '#666' }}>Keine Dateien vorhanden. Bitte laden Sie zuerst Dateien hoch.</p>
          ) : (
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#B31318', color: 'white' }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Dateiname</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f, index) => (
                  <tr 
                    key={f.name}
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <td style={{ padding: '12px 15px' }}>{f.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Analyse Typ */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#B31318' }}>Modul auswählen</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={analyseType} 
            onChange={(e) => setAnalyseType(e.target.value)}
            style={{
              padding: '10px 15px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minWidth: '200px'
            }}
          >
            <option value="Zeichnungskopf">Zeichnungskopf</option>
            <option value="Stückliste">Stückliste</option>
          </select>
        </div>
      </div>

      {/* Zeichnungskopf Tabelle - nur anzeigen wenn Zeichnungskopf ausgewählt */}
      {analyseType === 'Zeichnungskopf' && (
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#B31318' }}>Zeichnungskopf Daten</h2>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#B31318', color: 'white' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left' }}>Feldname</th>
                <th style={{ padding: '12px 15px', textAlign: 'left' }}>Wert</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(zeichnungskopfData).map((fieldName, index) => (
                <tr 
                  key={fieldName}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <td style={{ padding: '12px 15px', fontWeight: '500' }}>{fieldName}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <input
                      type="text"
                      value={zeichnungskopfData[fieldName]}
                      onChange={(e) => handleZeichnungskopfChange(fieldName, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ANALYSE;
