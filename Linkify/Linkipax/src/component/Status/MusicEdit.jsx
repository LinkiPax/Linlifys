import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

const MusicEditor = ({ setSelectedMusic }) => {
  const [musicList] = useState([
    { id: 1, name: 'Song 1', url: 'https://example.com/song1.mp3' },
    { id: 2, name: 'Song 2', url: 'https://example.com/song2.mp3' },
    { id: 3, name: 'Song 3', url: 'https://example.com/song3.mp3' },
    // Add more songs here
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMusicSelection = (music) => {
    setSelectedMusic(music.name);
    setPreviewUrl(music.url);
    setIsPlaying(true);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredMusicList = musicList.filter((music) =>
    music.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>Select Music</h4>

      {/* Search Bar */}
      <Form.Control
        type="text"
        placeholder="Search songs..."
        value={searchQuery}
        onChange={handleSearch}
        style={styles.searchBar}
      />

      {/* Music List */}
      <div style={styles.musicList}>
        {filteredMusicList.map((music) => (
          <div
            key={music.id}
            style={styles.musicItem}
            onClick={() => handleMusicSelection(music)}
          >
            <span style={styles.musicName}>{music.name}</span>
          </div>
        ))}
      </div>

      {/* Music Preview */}
      {previewUrl && (
        <div style={styles.previewContainer}>
          <audio controls autoPlay={isPlaying} src={previewUrl} style={styles.audioPlayer} />
          <Button onClick={togglePlayPause} style={styles.playButton}>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      )}
    </div>
  );
};

// Inline Styles
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    marginBottom: '20px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
  searchBar: {
    marginBottom: '20px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    padding: '10px',
    width: '100%',
  },
  musicList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  },
  musicItem: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'center',
  },
  musicName: {
    fontSize: '1rem',
    color: '#555',
  },
  previewContainer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  audioPlayer: {
    width: '100%',
    marginBottom: '10px',
  },
  playButton: {
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};

export default MusicEditor;