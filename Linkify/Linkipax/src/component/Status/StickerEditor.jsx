import React, { useState, useEffect } from 'react';
import { Card, Form, Spinner, Alert, Button, ButtonGroup } from 'react-bootstrap';
import { EmojiSmile, ExclamationTriangle, ArrowsExpand, Sticky } from 'react-bootstrap-icons';
import './StickerEditor.css';

const StickerEditor = ({ onAddSticker }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStickerCategory, setSelectedStickerCategory] = useState(0);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stickers'); // 'stickers' or 'emojis'

  const apiUrl = import.meta.env.VITE_API_URL + '/api/stickers';

  // Emoji categories
  const emojiCategories = [
    {
      name: "Smileys & People",
      emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾"]
    },
    {
      name: "Animals & Nature",
      emojis: ["🐵","🐒","🦍","🦧","🐶","🐕","🦮","🐩","🐺","🦊","🦝","🐱","🐈","🦁","🐯","🐅","🐆","🐴","🐎","🦄","🦓","🦌","🐮","🐂","🐃","🐄","🐷","🐖","🐗","🐽","🐏","🐑","🐐","🐪","🐫","🦙","🦒","🐘","🦏","🦛","🐭","🐁","🐀","🐹","🐰","🐇","🐿️","🦔","🦇","🐻","🐨","🐼","🦥","🦦","🦨","🦘","🦡","🐾","🦃","🐔","🐓","🐣","🐤","🐥","🐦","🐧","🕊️","🦅","🦆","🦢","🦉","🦩","🦚","🦜","🐸","🐊","🐢","🦎","🐍","🐲","🐉","🦕","🦖","🐳","🐋","🐬","🐟","🐠","🐡","🦈","🐙","🐚","🐌","🦋","🐛","🐜","🐝","🐞","🦗","🕷️","🕸️","🦂","🦟","🦠","💐","🌸","💮","🏵️","🌹","🥀","🌺","🌻","🌼","🌷","🌱","🌲","🌳","🌴","🌵","🌾","🌿","☘️","🍀","🍁","🍂","🍃"]
    },
    {
      name: "Food & Drink",
      emojis: ["🍇","🍈","🍉","🍊","🍋","🍌","🍍","🥭","🍎","🍏","🍐","🍑","🍒","🍓","🥝","🍅","🥥","🥑","🍆","🥔","🥕","🌽","🌶️","🥒","🥬","🥦","🧄","🧅","🍄","🥜","🌰","🍞","🥐","🥖","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🥙","🧆","🥚","🍳","🥘","🍲","🥣","🥗","🍿","🧈","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🦀","🦞","🦐","🦑","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🍵","🍶","🍾","🍷","🍸","🍹","🍺","🍻","🥂","🥃","🥤","🧃","🧉","🧊","🥢","🍽️","🍴","🥄","🔪","🏺"]
    },
    {
      name: "Activities & Sports",
      emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪁","🥅","⛳","🪃","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"]
    },
    {
      name: "Objects & Symbols",
      emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️"]
    }
  ];

  // Fetch stickers from backend
  const fetchStickers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch stickers');
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

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const handleStickerClick = (sticker) => onAddSticker(getStickerUrl(sticker.path), 'sticker');

  const handleEmojiClick = (emoji) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    context.clearRect(0, 0, size, size);
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(emoji, size / 2, size / 2);
    const dataUrl = canvas.toDataURL('image/png');
    onAddSticker(dataUrl, 'emoji', emoji);
  };

  const getStickerUrl = (path) => path;


  const categorizeStickers = (stickers) => {
    const categories = {
      emojis: { name: "Emojis", stickers: [] },
      objects: { name: "Objects", stickers: [] },
      celebrations: { name: "Celebrations", stickers: [] },
      custom: { name: "Custom", stickers: [] }
    };
    stickers.forEach(sticker => {
      const name = sticker.name.toLowerCase();
      if (name.includes('emoji') || name.includes('smile') || name.includes('face') || name.includes('happy')) categories.emojis.stickers.push(sticker);
      else if (name.includes('balloon') || name.includes('party') || name.includes('celebration') || name.includes('firework')) categories.celebrations.stickers.push(sticker);
      else if (name.includes('heart') || name.includes('star') || name.includes('flower')) categories.custom.stickers.push(sticker);
      else categories.objects.stickers.push(sticker);
    });
    return Object.values(categories).filter(cat => cat.stickers.length > 0);
  };

  const stickerCategories = categorizeStickers(stickers);

  const filteredStickers = (stickerCategories[selectedStickerCategory]?.stickers || []).filter(
    s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmojis = (emojiCategories[selectedEmojiCategory]?.emojis || []).filter(
    e => e.includes(searchQuery)
  );

  const renderStickersTab = () => (
    <>
      {stickerCategories.length > 1 && (
        <div className="category-tabs">
          {stickerCategories.map((cat, i) => (
            <button key={i} className={`category-tab ${selectedStickerCategory === i ? 'active' : ''}`} onClick={() => setSelectedStickerCategory(i)}>
              {cat.name} ({cat.stickers.length})
            </button>
          ))}
        </div>
      )}
      <div className="sticker-grid">
        {filteredStickers.length ? filteredStickers.map((sticker, i) => (
          <div key={`${sticker.filename}-${i}`} className="sticker-item" onClick={() => handleStickerClick(sticker)} title={sticker.name}>
            <img src={getStickerUrl(sticker.path)} alt={sticker.name} className="sticker-img" 
              onError={e => e.target.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiPjxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg=='}
            />
          </div>
        )) : <div className="text-center py-4 w-100"><p className="text-muted">No stickers found</p></div>}
      </div>
    </>
  );

  const renderEmojisTab = () => (
    <>
      <div className="category-tabs">
        {emojiCategories.map((cat, i) => (
          <button key={i} className={`category-tab ${selectedEmojiCategory === i ? 'active' : ''}`} onClick={() => setSelectedEmojiCategory(i)}>
            {cat.name} ({cat.emojis.length})
          </button>
        ))}
      </div>
      <div className="emoji-grid">
        {filteredEmojis.length ? filteredEmojis.map((emoji, i) => (
          <div key={`${emoji}-${i}`} className="emoji-item" onClick={() => handleEmojiClick(emoji)} title={`Emoji: ${emoji}`}>
            <span className="emoji">{emoji}</span>
          </div>
        )) : <div className="text-center py-4 w-100"><p className="text-muted">No emojis found</p></div>}
      </div>
    </>
  );

  if (loading) return (
    <Card className="sticker-editor-card"><Card.Body className="text-center"><Spinner animation="border" /><p>Loading stickers...</p></Card.Body></Card>
  );

  if (error) return (
    <Card className="sticker-editor-card"><Card.Body className="text-center"><ExclamationTriangle size={32} className="text-warning mb-2" /><Alert variant="warning">{error}</Alert><Button size="sm" onClick={fetchStickers}>Retry</Button></Card.Body></Card>
  );

  return (
    <Card className="sticker-editor-card">
      <Card.Body>
        <div className="sticker-header">
          <h5><EmojiSmile className="me-2" /> Stickers & Emojis</h5>
          <small className="text-muted"><ArrowsExpand size={14} className="me-1" /> Drag to move, drag corners to resize</small>
          <Form.Control type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={handleSearch} className="sticker-search" />
        </div>

        <div className="tab-selection mb-3">
          <ButtonGroup className="w-100">
            <Button variant={activeTab === 'stickers' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => { setActiveTab('stickers'); setSearchQuery(''); setSelectedStickerCategory(0); }}><Sticky className="me-1" />Stickers</Button>
            <Button variant={activeTab === 'emojis' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => { setActiveTab('emojis'); setSearchQuery(''); setSelectedEmojiCategory(0); }}><EmojiSmile className="me-1" />Emojis</Button>
          </ButtonGroup>
        </div>

        {activeTab === 'stickers' ? renderStickersTab() : renderEmojisTab()}

        <div className="sticker-footer">
          <small className="text-muted">
            {activeTab === 'stickers' 
              ? `${filteredStickers.length} sticker${filteredStickers.length !== 1 ? 's' : ''} displayed`
              : `${filteredEmojis.length} emoji${filteredEmojis.length !== 1 ? 's' : ''} displayed`}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StickerEditor;
