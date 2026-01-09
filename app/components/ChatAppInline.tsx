'use client'

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

export default function ChatAppInline() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim()
        })
      });

      if (response.ok) {
        setMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div style={{ 
      height: '100%', 
      background: '#008080',
      padding: 8,
      fontFamily: 'MS Sans Serif, Arial, sans-serif',
      fontSize: 11,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#C0C0C0',
        border: '2px outset #DFDFDF',
        padding: 8,
        marginBottom: 8,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: '#000080',
          color: 'white',
          padding: '6px 8px',
          fontWeight: 'bold',
          fontSize: 12,
          textAlign: 'center'
        }}>
          Chat!
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        background: '#C0C0C0',
        border: '2px inset #DFDFDF',
        padding: 8,
        marginBottom: 8,
        overflowY: 'auto',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
        minHeight: 0
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ color: '#000' }}>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ color: '#000' }}>No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  background: 'white',
                  border: '1px solid #808080',
                  padding: 8,
                  marginBottom: 8,
                  boxShadow: '1px 1px 0 rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  borderBottom: '1px solid #C0C0C0',
                  paddingBottom: 4
                }}>
                  <strong style={{ color: '#000080' }}>{msg.name}</strong>
                  <span style={{ color: '#808080', fontSize: 10 }}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: '#000', wordWrap: 'break-word' }}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage}>
        <div style={{
          background: '#C0C0C0',
          border: '2px outset #DFDFDF',
          padding: 8,
          boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
        }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              marginBottom: 4,
              color: '#000'
            }}>
              Your Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              style={{
                width: '100%',
                padding: 4,
                border: '2px inset #DFDFDF',
                fontFamily: 'MS Sans Serif, Arial, sans-serif',
                fontSize: 11,
                boxSizing: 'border-box'
              }}
              placeholder="Enter your name..."
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              marginBottom: 4,
              color: '#000'
            }}>
              Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              style={{
                width: '100%',
                padding: 4,
                border: '2px inset #DFDFDF',
                fontFamily: 'MS Sans Serif, Arial, sans-serif',
                fontSize: 11,
                resize: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Type your message..."
            />
            <div style={{ 
              textAlign: 'right', 
              fontSize: 10, 
              color: '#808080',
              marginTop: 2
            }}>
              {message.length}/500
            </div>
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !message.trim()}
            style={{
              background: '#C0C0C0',
              border: '2px outset #DFDFDF',
              padding: '6px 16px',
              cursor: !name.trim() || !message.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: 11,
              width: '100%',
              opacity: !name.trim() || !message.trim() ? 0.5 : 1
            }}
            onMouseDown={(e) => {
              if (name.trim() && message.trim()) {
                e.currentTarget.style.border = '2px inset #DFDFDF';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.border = '2px outset #DFDFDF';
            }}
          >
            📤 Send Message
          </button>
        </div>
      </form>
    </div>
  );
}