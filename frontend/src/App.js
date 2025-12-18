import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [zeichnungsnummer, setZeichnungsnummer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filesCounts, setFilesCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    fetch('http://localhost:3001/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        // Fetch file counts for each project
        data.forEach(project => {
          fetch(`http://localhost:3001/files?projectId=${project.id}`)
            .then(res => res.json())
            .then(files => {
              setFilesCounts(prev => ({ ...prev, [project.id]: files.length }));
            });
        });
      });
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert('Bitte geben Sie einen Zeichnungsnamen ein');
      return;
    }
    const res = await fetch('http://localhost:3001/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName, zeichnungsnummer })
    });
    const newProject = await res.json();
    setProjects([...projects, newProject]);
    setProjectName('');
    setZeichnungsnummer('');
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Zeichnung löschen möchten?')) return;
    await fetch(`http://localhost:3001/projects/${projectId}`, {
      method: 'DELETE'
    });
    fetchProjects();
  };

  const handleSelectProject = (project) => {
    // Navigate to Zeichnung bearbeiten page with selected project
    navigate('/zeichnung-bearbeiten', { state: { selectedProject: project } });
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.zeichnungsnummer && p.zeichnungsnummer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#B31318', borderBottom: '2px solid #B31318', paddingBottom: '10px' }}>
        KI DRW
      </h1>

      {/* Neue Zeichnung erstellen */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#B31318' }}>Neue Zeichnung erstellen</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Zeichnungsname"
            style={{
              padding: '10px 15px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minWidth: '200px'
            }}
          />
          <input
            type="text"
            value={zeichnungsnummer}
            onChange={(e) => setZeichnungsnummer(e.target.value)}
            placeholder="Zeichnungsnummer"
            style={{
              padding: '10px 15px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              minWidth: '200px'
            }}
          />
          <button 
            onClick={handleCreateProject}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: '#B31318',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Zeichnung erstellen
          </button>
        </div>
      </div>

      {/* Zeichnungsübersicht */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#B31318' }}>Zeichnungsübersicht</h2>
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zeichnungen suchen..."
              style={{
                padding: '8px 15px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '250px'
              }}
            />
          </div>
        </div>

        <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
          Anzahl Zeichnungen: <strong>{filteredProjects.length}</strong>
        </p>

        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#B31318', color: 'white' }}>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Zeichnungsname</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Zeichnungsnummer</th>
              <th style={{ padding: '12px 15px', textAlign: 'center' }}>Hochgeladene Dateien</th>
              <th style={{ padding: '12px 15px', textAlign: 'left' }}>Bearbeitungsdatum</th>
              <th style={{ padding: '12px 15px', textAlign: 'center' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                  Keine Zeichnungen gefunden
                </td>
              </tr>
            ) : (
              filteredProjects.map((p, index) => (
                <tr 
                  key={p.id} 
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <td style={{ padding: '12px 15px' }}>{p.name}</td>
                  <td style={{ padding: '12px 15px' }}>{p.zeichnungsnummer || '-'}</td>
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>{filesCounts[p.id] !== undefined ? filesCounts[p.id] : '...'}</td>
                  <td style={{ padding: '12px 15px' }}>{new Date(p.editDate).toLocaleString()}</td>
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleSelectProject(p)}
                      style={{
                        padding: '6px 12px',
                        marginRight: '5px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      bearbeiten
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(p.id)}
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
      </div>
    </div>
  );
}

export default App;
