import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Spinner, Alert, Button, ButtonGroup } from 'react-bootstrap';
import { Search, EmojiSmile, ExclamationTriangle, ArrowsExpand, Sticky } from 'react-bootstrap-icons';
import './StickerEditor.css';

const StickerEditor = ({ onAddSticker }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stickers'); // 'stickers' or 'emojis'
  
  const apiUrl = import.meta.env.VITE_API_URL + '/api/stickers';

  // Emoji categories
  const emojiCategories = [
    {
      name: "Smileys & People",
      emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"]
    },
    {
      name: "Animals & Nature",
      emojis: ["🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮", "🐩", "🐺", "🦊", "🦝", "🐱", "🐈", "🦁", "🐯", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦏", "🦛", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐿️", "🦔", "🦇", "🐻", "🐨", "🐼", "🦥", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🕊️", "🦅", "🦆", "🦢", "🦉", "🦩", "🦚", "🦜", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🐳", "🐋", "🐬", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🐌", "🦋", "🐛", "🐜", "🐝", "🐞", "🦗", "🕷️", "🕸️", "🦂", "🦟", "🦠", "💐", "🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃"]
    },
    {
      name: "Food & Drink",
      emojis: ["🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🥝", "🍅", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🥒", "🥬", "🥦", "🧄", "🧅", "🍄", "🥜", "🌰", "🍞", "🥐", "🥖", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🦀", "🦞", "🦐", "🦑", "🦪", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🥤", "🧃", "🧉", "🧊", "🥢", "🍽️", "🍴", "🥄", "🔪", "🏺"]
    },
    {
      name: "Activities & Sports",
      emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪁", "🥅", "⛳", "🪃", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰", "🧩"]
    },
    {
      name: "Objects & Symbols",
      emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🔢", "#️⃣", "*️⃣", "⏏️", "▶️", "⏸️", "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️", "⤴️", "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "♾️", "💲", "💱", "™️", "©️", "®️", "〰️", "➰", "➿", "🔚", "🔙", "🔛", "🔝", "🔜", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇", "🔉", "🔊", "🔔", "🔕", "📣", "📢", "👁️‍🗨️", "💬", "💭", "🗯️", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴", "🀄", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛", "🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧"]
    }
  ];

  // Fetch stickers from backend
  const fetchStickers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stickers');
      }
      
      const data = await response.json();
      setStickers(data.stickers || []);
    } catch (err) {
      console.error('Error fetching stickers:', err);
      setError('Failed to load stickers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickers();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStickerClick = (sticker) => {
    onAddSticker(sticker.path, 'sticker');
  };

  const handleEmojiClick = (emoji) => {
    // Create a canvas to convert emoji to image data URL
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = 64; // Size of the emoji image
    
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas with transparent background
    context.clearRect(0, 0, size, size);
    
    // Set font and draw emoji
    context.font = '48px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(emoji, size / 2, size / 2);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    const emojiSticker = {
      type: 'emoji',
      content: emoji,
      path: dataUrl,
      name: `Emoji: ${emoji}`
    };
    
    onAddSticker(emojiSticker.path, 'emoji', emoji);
  };

  // Categorize stickers based on their names or create default categories
  const categorizeStickers = (stickers) => {
    const categories = {
      emojis: { name: "Emojis", stickers: [] },
      objects: { name: "Objects", stickers: [] },
      celebrations: { name: "Celebrations", stickers: [] },
      custom: { name: "Custom", stickers: [] }
    };

    stickers.forEach(sticker => {
      const name = sticker.name.toLowerCase();
      
      if (name.includes('emoji') || name.includes('smile') || name.includes('face') || name.includes('happy')) {
        categories.emojis.stickers.push(sticker);
      } else if (name.includes('balloon') || name.includes('party') || name.includes('celebration') || name.includes('firework')) {
        categories.celebrations.stickers.push(sticker);
      } else if (name.includes('heart') || name.includes('star') || name.includes('flower')) {
        categories.custom.stickers.push(sticker);
      } else {
        categories.objects.stickers.push(sticker);
      }
    });

    // Filter out empty categories
    return Object.values(categories).filter(category => category.stickers.length > 0);
  };

  const categories = categorizeStickers(stickers);

  // Filter stickers based on search query
  const filteredStickers = categories[selectedCategory]?.stickers.filter((sticker) =>
    sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sticker.filename.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter emojis based on search query
  const filteredEmojis = emojiCategories[selectedCategory]?.emojis.filter((emoji) =>
    emoji.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderStickersTab = () => (
    <>
      {categories.length > 1 && (
        <div className="category-tabs">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`category-tab ${selectedCategory === index ? 'active' : ''}`}
              onClick={() => setSelectedCategory(index)}
            >
              {category.name} ({category.stickers.length})
            </button>
          ))}
        </div>
      )}

      <div className="sticker-grid">
        {filteredStickers.length > 0 ? (
          filteredStickers.map((sticker, index) => (
            <div
              key={`${sticker.filename}-${index}`}
              className="sticker-item"
              onClick={() => handleStickerClick(sticker)}
              title={sticker.name}
            >
              <img 
                src={sticker.path} 
                alt={sticker.name} 
                className="sticker-img"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAzNkMzNC4yMDkxIDM2IDM2IDM0LjIwOTEgMzYgMzJDMzYgMjkuNzkwOSAzNC4yMDkxIDI4IDMyIDI4QzI5Ljc5MDkgMjggMjggMjkuNzkwOSAyOCAzMkMyOCAzNC4yMDkxIDI5Ljc5MDkgMzYgMzIgMzZaIiBmaWxsPSIjOUE5/QkFCIi8+CjxwYXRoIGQ9Ik0zOC42NjY3IDQyLjY2NjdIMjUuMzMzM0MyNC4wMDU5IDQyLjY2NjcgMjIuODc2MiA0MS41MzcgMjIuODc2MiA0MC4yMDk3VjM3LjMzMzNDMjIuODc2MiAzNi4wMDYgMjQuMDA1OSAzNC44NzYyIDI1LjMzMzMgMzQuODc2MkgzOC42NjY3QzM5Ljk5NDEgMzQuODc2MiA0MS4xMjM4IDM2LjAwNiA0MS4xMjM4IDM3LjMzMzNWNDAuMjA5N0M0MS4xMjM4IDQxLjUzNyAzOS45OTQxIDQyLjY2NjcgMzguNjY2NyA0Mi42NjY3WiIgZmlsbD0iIzlBOUI5QSIvPgo8L3N2Zz4K';
                }}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-4 w-100">
            <p className="text-muted">No stickers found matching your search</p>
          </div>
        )}
      </div>
    </>
  );

  const renderEmojisTab = () => (
    <>
      <div className="category-tabs">
        {emojiCategories.map((category, index) => (
          <button
            key={index}
            className={`category-tab ${selectedCategory === index ? 'active' : ''}`}
            onClick={() => setSelectedCategory(index)}
          >
            {category.name} ({category.emojis.length})
          </button>
        ))}
      </div>

      <div className="emoji-grid">
        {filteredEmojis.length > 0 ? (
          filteredEmojis.map((emoji, index) => (
            <div
              key={`${emoji}-${index}`}
              className="emoji-item"
              onClick={() => handleEmojiClick(emoji)}
              title={`Emoji: ${emoji}`}
            >
              <span className="emoji">{emoji}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 w-100">
            <p className="text-muted">No emojis found matching your search</p>
          </div>
        )}
      </div>
    </>
  );

  if (loading) {
    return (
      <Card className="sticker-editor-card">
        <Card.Body className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading stickers...</span>
          </Spinner>
          <p>Loading stickers...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="sticker-editor-card">
        <Card.Body className="text-center">
          <ExclamationTriangle size={32} className="text-warning mb-2" />
          <Alert variant="warning" className="mb-3">
            {error}
          </Alert>
          <button 
            className="btn btn-primary btn-sm"
            onClick={fetchStickers}
          >
            Retry
          </button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="sticker-editor-card">
      <Card.Body>
        <div className="sticker-header">
          <h5><EmojiSmile className="me-2" /> Stickers & Emojis</h5>
          <small className="text-muted">
            <ArrowsExpand size={14} className="me-1" />
            Drag to move, drag corners to resize
          </small>
          
          <Form.Control
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={handleSearch}
            className="sticker-search"
          />
        </div>

        {/* Tab Selection */}
        <div className="tab-selection mb-3">
          <ButtonGroup className="w-100">
            <Button
              variant={activeTab === 'stickers' ? 'primary' : 'outline-secondary'}
              onClick={() => {
                setActiveTab('stickers');
                setSelectedCategory(0);
                setSearchQuery('');
              }}
              size="sm"
            >
              <Sticky className="me-1" />
              Stickers
            </Button>
            <Button
              variant={activeTab === 'emojis' ? 'primary' : 'outline-secondary'}
              onClick={() => {
                setActiveTab('emojis');
                setSelectedCategory(0);
                setSearchQuery('');
              }}
              size="sm"
            >
              <EmojiSmile className="me-1" />
              Emojis
            </Button>
          </ButtonGroup>
        </div>

        {activeTab === 'stickers' ? renderStickersTab() : renderEmojisTab()}

        <div className="sticker-footer">
          <small className="text-muted">
            {activeTab === 'stickers' 
              ? `${filteredStickers.length} sticker${filteredStickers.length !== 1 ? 's' : ''} displayed`
              : `${filteredEmojis.length} emoji${filteredEmojis.length !== 1 ? 's' : ''} displayed`
            }
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StickerEditor;