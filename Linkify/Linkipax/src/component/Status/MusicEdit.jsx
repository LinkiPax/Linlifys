import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { MusicNote, Play, Pause, Search, ExclamationTriangle } from 'react-bootstrap-icons';
import './MusicEditor.css';

const MusicEditor = ({ selectedMusic, setSelectedMusic, isPlaying, onTogglePlay }) => {
  const [musicList, setMusicList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audio, setAudio] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const fetchMusic = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiUrl = import.meta.env.VITE_API_URL + '/music';
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.startsWith('<!DOCTYPE html>') || text.startsWith('<!doctype html>')) {
          throw new Error('Server returned HTML instead of JSON. Check if the API endpoint exists.');
        }
        throw new Error(`Unexpected response format: ${contentType}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Music API Response:', data); // Debug
      setMusicList(data.music || []);
    } catch (err) {
      console.error('Error fetching music:', err);
      setError(`Failed to load music: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusic();
    
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  const handleMusicSelection = (music) => {
    // Create complete music object with all necessary data
    const musicData = {
      id: music._id || music.id || music.filename, // Use available identifier
      name: music.name,
      filename: music.filename,
      path: music.path,
      // Include any other fields your backend might need
    };
    
    setSelectedMusic(musicData);
    setSelectedTrack(music);
    
    if (audio) {
      audio.pause();
      onTogglePlay(); // Update parent component
    }
    
     const musicUrl = music.path;
    
    const newAudio = new Audio(musicUrl);
    setAudio(newAudio);
    setPreviewUrl(musicUrl);
    
    newAudio.play().catch(e => {
      console.error('Error playing audio:', e);
      setError('Cannot play audio. Please check if the file exists.');
      onTogglePlay(); // Ensure parent state is updated
    });
    
    onTogglePlay(); // Notify parent that music is playing
    
    newAudio.onended = () => {
      onTogglePlay(); // Notify parent that music stopped
    };
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const togglePlayPause = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => {
        console.error('Error playing audio:', e);
        setError('Cannot play audio file.');
      });
    }
    onTogglePlay();
  };

  const formatMusicName = (name) => {
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredMusicList = musicList.filter((music) =>
    music.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    music.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clear selection when component unmounts or music is deselected
  useEffect(() => {
    if (!selectedMusic && audio) {
      audio.pause();
      setAudio(null);
      setPreviewUrl(null);
      setSelectedTrack(null);
    }
  }, [selectedMusic]);

  if (loading) {
    return (
      <Card className="music-editor-card">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading music...</span>
          </Spinner>
          <p className="text-muted">Loading music library...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="music-editor-card">
        <Card.Body className="text-center py-4">
          <ExclamationTriangle size={32} className="text-warning mb-3" />
          <Alert variant="warning" className="mb-3">
            {error}
          </Alert>
          <div className="d-flex gap-2 justify-content-center">
            <Button 
              variant="primary" 
              size="sm"
              onClick={fetchMusic}
            >
              Retry
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setError('')}
            >
              Dismiss
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="music-editor-card">
      <Card.Body>
        <div className="music-header">
          <h5><MusicNote className="me-2" /> Select Music</h5>
          <Form.Control
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={handleSearch}
            className="music-search"
          />
        </div>

        <div className="music-stats mb-3">
          <small className="text-muted">
            {filteredMusicList.length} of {musicList.length} song{musicList.length !== 1 ? 's' : ''}
            {selectedMusic && (
              <span className="ms-2 text-primary">
                • Selected: {selectedMusic.name}
              </span>
            )}
          </small>
        </div>

        <div className="music-list">
          {filteredMusicList.length > 0 ? (
            filteredMusicList.map((music, index) => (
              <div
                key={music.filename || index}
                className={`music-item ${selectedTrack?.filename === music.filename ? 'selected' : ''}`}
                onClick={() => handleMusicSelection(music)}
              >
                <div className="music-info">
                  <div className="music-icon">
                    <MusicNote size={20} />
                  </div>
                  <div className="music-details">
                    <div className="music-name">
                      {formatMusicName(music.name)}
                    </div>
                    <div className="music-filename">
                      {music.filename}
                    </div>
                  </div>
                </div>
                <div className="music-action">
                  {selectedTrack?.filename === music.filename && isPlaying ? (
                    <div className="playing-indicator">
                      <div className="sound-wave">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMusicSelection(music);
                      }}
                    >
                      {selectedTrack?.filename === music.filename ? 'Selected' : 'Select'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Search size={32} className="text-muted mb-2" />
              <p className="text-muted">
                {musicList.length === 0 ? 'No music files found' : 'No songs match your search'}
              </p>
              {musicList.length === 0 && (
                <small className="text-muted">
                  Add music files to the public/music folder on the server
                </small>
              )}
            </div>
          )}
        </div>

        {selectedTrack && (
          <div className="music-preview mt-4 p-3 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="flex-grow-1">
                <strong>Now Playing:</strong> {formatMusicName(selectedTrack.name)}
              </div>
              <Button 
                variant={isPlaying ? "warning" : "success"} 
                size="sm"
                onClick={togglePlayPause}
                className="d-flex align-items-center gap-1 flex-shrink-0"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
            <div className="audio-controls">
              <audio
                controls
                src={previewUrl}
                style={{ width: '100%' }}
                onPlay={() => onTogglePlay()}
                onPause={() => onTogglePlay()}
                onEnded={() => onTogglePlay()}
                onError={(e) => {
                  console.error('Audio error:', e);
                  setError('Error playing audio file');
                }}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MusicEditor;