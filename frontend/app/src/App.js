// App.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // We'll create this file for our styles

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [files, setFiles] = useState([]);
  const [view, setView] = useState('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (view === 'list') {
      fetchFiles();
    }
  }, [view]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setStatus('Error fetching files');
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setStatus(`File selected: ${selectedFile.name}`);
    setUploadProgress(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setStatus('Please select a file');
      return;
    }

    const socket = new WebSocket('ws://localhost:8000/ws');
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('Connected. Starting file upload...');
      socket.send(`filename:${file.name}`);
      
      const chunkSize = 1024 * 1024;
      let offset = 0;

      const readAndUploadChunk = () => {
        const reader = new FileReader();
        const blob = file.slice(offset, offset + chunkSize);
        reader.onload = (e) => {
          if (e.target.readyState === FileReader.DONE) {
            socket.send(e.target.result);
            offset += e.target.result.byteLength;
            const progress = Math.min(100, Math.round((offset / file.size) * 100));
            setUploadProgress(progress);
            if (offset < file.size) {
              readAndUploadChunk();
            } else {
              socket.send(new ArrayBuffer(0));
            }
          }
        };
        reader.readAsArrayBuffer(blob);
      };

      readAndUploadChunk();
    };

    socket.onmessage = (event) => {
      setStatus(event.data);
      setUploadProgress(100);
      setFile(null);
      document.getElementById('fileInput').value = '';
    };

    socket.onerror = (error) => {
      setStatus(`WebSocket Error: ${error}`);
    };

    socket.onclose = () => {
      setStatus('WebSocket connection closed');
    };
  };

  const UploadView = () => (
    <div className="upload-container">
      <h2>File Uploader</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input-container">
          <input 
            type="file" 
            id="fileInput"
            onChange={handleFileChange} 
            className="file-input"
          />
          <label htmlFor="fileInput" className="file-input-label">
            Choose File
          </label>
          {file && <span className="file-name">{file.name}</span>}
        </div>
        <button type="submit" disabled={!file} className="upload-button">
          Upload
        </button>
      </form>
      {status && <p className="status-message">{status}</p>}
      {uploadProgress > 0 && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
          <span className="progress-text">{uploadProgress}%</span>
        </div>
      )}
    </div>
  );

  const ListView = () => (
    <div className="list-container">
      <h2>Uploaded Files</h2>
      <button onClick={fetchFiles} className="refresh-button">Refresh</button>
      <ul className="file-list">
        {files.map((file) => (
          <li key={file.id} className="file-item">
            <div className="file-info">
              <span className="file-original">Original: {file.original_filename}</span>
              <span className="file-saved">Saved as: {file.saved_filename}</span>
              <span className="file-time">Uploaded: {new Date(file.upload_time).toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>File Management System</h1>
        <nav className="app-nav">
          <button onClick={() => setView('upload')} className={view === 'upload' ? 'active' : ''}>Upload</button>
          <button onClick={() => setView('list')} className={view === 'list' ? 'active' : ''}>View Files</button>
        </nav>
      </header>
      <main className="app-main">
        {view === 'upload' ? <UploadView /> : <ListView />}
      </main>
    </div>
  );
}

export default App;