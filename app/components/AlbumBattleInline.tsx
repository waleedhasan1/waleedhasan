'use client'

import { useState, useEffect } from 'react';

interface Album {
  id: number;
  title: string;
  artist: string;
  cover_url: string;
  year: string;
  elo_rating: number;
}

interface AlbumBattleInlineProps {
  openLeaderboard?: () => void;
}

export default function AlbumBattleInline({ openLeaderboard }: AlbumBattleInlineProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [album1, setAlbum1] = useState<Album | null>(null);
  const [album2, setAlbum2] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [battling, setBattling] = useState(false);

  const fetchAllAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rankings');
      const textResponse = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch albums: ${response.status}`);
      }
      
      const data = JSON.parse(textResponse);
      setAlbums(data.albums || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRandomAlbums = () => {
    if (albums.length < 2) return;
    
    const shuffled = [...albums].sort(() => Math.random() - 0.5);
    setAlbum1(shuffled[0]);
    setAlbum2(shuffled[1]);
  };

  const calculateNewElo = (winnerElo: number, loserElo: number) => {
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
    
    const newWinnerElo = Math.round(winnerElo + K * (1 - expectedWinner));
    const newLoserElo = Math.round(loserElo + K * (0 - expectedLoser));
    
    return { newWinnerElo, newLoserElo };
  };

  const handleBattle = async (winnerId: number, loserId: number) => {
    if (!album1 || !album2 || battling) return;
    
    setBattling(true);
    const winner = winnerId === album1.id ? album1 : album2;
    const loser = loserId === album1.id ? album1 : album2;
    
    const { newWinnerElo, newLoserElo } = calculateNewElo(winner.elo_rating, loser.elo_rating);
    
    try {
      await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId,
          loserId,
          newWinnerElo,
          newLoserElo
        })
      });
      
      setAlbums(albums.map(a => {
        if (a.id === winnerId) return { ...a, elo_rating: newWinnerElo };
        if (a.id === loserId) return { ...a, elo_rating: newLoserElo };
        return a;
      }));
      
      setTimeout(() => {
        getRandomAlbums();
        setBattling(false);
      }, 500);
    } catch (err) {
      console.error('Battle error:', err);
      setBattling(false);
    }
  };

  useEffect(() => {
    fetchAllAlbums();
  }, []);

  useEffect(() => {
    if (albums.length >= 2) {
      getRandomAlbums();
    }
  }, [albums]);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#C0C0C0' }}>
        <div style={{ 
          background: 'white', 
          border: '2px outset #DFDFDF',
          padding: 24,
          textAlign: 'center',
          boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '2px solid #000080',
            borderTop: '2px solid #0000FF',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#000', fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 11 }}>Loading albums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#C0C0C0' }}>
        <div style={{ 
          background: 'white', 
          border: '2px outset #DFDFDF', 
          padding: 24,
          textAlign: 'center',
          maxWidth: 400,
          boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ color: '#000', fontSize: 16, fontWeight: 'bold', marginBottom: 8, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>Error</h2>
          <p style={{ color: '#000', marginBottom: 16, fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 11 }}>{error}</p>
          <button 
            onClick={fetchAllAlbums}
            style={{
              background: '#C0C0C0',
              color: '#000',
              padding: '4px 12px',
              border: '2px outset #DFDFDF',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: 11
            }}
            onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
            onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!album1 || !album2) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#C0C0C0' }}>
        <div style={{ 
          background: 'white', 
          border: '2px outset #DFDFDF',
          padding: 24,
          boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
        }}>
          <p style={{ color: '#000', fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 11 }}>Not enough albums to battle!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#008080', color: '#000' }}>
      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ 
          background: '#C0C0C0',
          border: '2px outset #DFDFDF',
          padding: 12,
          marginBottom: 16,
          boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: 16, fontWeight: 'bold', margin: 0, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>⚔️ Album Battle</h1>
            {openLeaderboard && (
              <button
                onClick={openLeaderboard}
                style={{
                  background: '#C0C0C0',
                  color: '#000',
                  padding: '4px 12px',
                  border: '2px outset #DFDFDF',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'MS Sans Serif, Arial, sans-serif',
                  fontSize: 11
                }}
                onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
                onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
              >
                🏆 View Leaderboard
              </button>
            )}
          </div>
        </div>

        <div style={{ 
          background: 'white',
          border: '2px inset #DFDFDF',
          padding: 16,
          marginBottom: 16,
          fontFamily: 'MS Sans Serif, Arial, sans-serif',
          fontSize: 11
        }}>
          <p style={{ textAlign: 'center', margin: 0 }}>
            Click on your favorite album!
          </p>
        </div>

        {/* Battle Arena */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
          {/* Album 1 */}
          <button
            onClick={() => handleBattle(album1.id, album2.id)}
            disabled={battling}
            style={{
              background: '#C0C0C0',
              border: '2px outset #DFDFDF',
              padding: 12,
              cursor: battling ? 'wait' : 'pointer',
              opacity: battling ? 0.6 : 1,
              boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
            }}
            onMouseDown={(e) => {
              if (!battling) e.currentTarget.style.border = '2px inset #DFDFDF';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.border = '2px outset #DFDFDF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px outset #DFDFDF';
            }}
          >
            <img 
              src={album1.cover_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjQzBDMEMwIi8+CjxwYXRoIGQ9Ik04MCA4MEgxMjBWMTIwSDgwVjgwWiIgZmlsbD0iIzgwODA4MCIvPgo8L3N2Zz4='}
              alt={album1.title}
              style={{ width: '100%', marginBottom: 12, border: '1px solid #000' }}
            />
            <div style={{ 
              background: 'white',
              border: '1px inset #DFDFDF',
              padding: 8,
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: 11
            }}>
              <h3 style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#000' }}>{album1.title}</h3>
              <p style={{ fontSize: 11, color: '#000', marginBottom: 2 }}>{album1.artist}</p>
              <p style={{ fontSize: 10, color: '#808080' }}>{album1.year}</p>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 'bold', color: '#000080' }}>
                ELO: {album1.elo_rating}
              </div>
            </div>
          </button>

          {/* VS */}
          <div style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#FFFFFF',
            background: '#000080',
            padding: '8px 16px',
            border: '2px outset #DFDFDF',
            fontFamily: 'MS Sans Serif, Arial, sans-serif'
          }}>VS</div>

          {/* Album 2 */}
          <button
            onClick={() => handleBattle(album2.id, album1.id)}
            disabled={battling}
            style={{
              background: '#C0C0C0',
              border: '2px outset #DFDFDF',
              padding: 12,
              cursor: battling ? 'wait' : 'pointer',
              opacity: battling ? 0.6 : 1,
              boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
            }}
            onMouseDown={(e) => {
              if (!battling) e.currentTarget.style.border = '2px inset #DFDFDF';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.border = '2px outset #DFDFDF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px outset #DFDFDF';
            }}
          >
            <img 
              src={album2.cover_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjQzBDMEMwIi8+CjxwYXRoIGQ9Ik04MCA4MEgxMjBWMTIwSDgwVjgwWiIgZmlsbD0iIzgwODA4MCIvPgo8L3N2Zz4='}
              alt={album2.title}
              style={{ width: '100%', marginBottom: 12, border: '1px solid #000' }}
            />
            <div style={{ 
              background: 'white',
              border: '1px inset #DFDFDF',
              padding: 8,
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: 11
            }}>
              <h3 style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#000' }}>{album2.title}</h3>
              <p style={{ fontSize: 11, color: '#000', marginBottom: 2 }}>{album2.artist}</p>
              <p style={{ fontSize: 10, color: '#808080' }}>{album2.year}</p>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 'bold', color: '#000080' }}>
                ELO: {album2.elo_rating}
              </div>
            </div>
          </button>
        </div>

        <div style={{ 
          background: 'white',
          border: '2px inset #DFDFDF',
          padding: 12,
          marginTop: 16,
          fontFamily: 'MS Sans Serif, Arial, sans-serif',
          fontSize: 11
        }}>
          <p style={{ textAlign: 'center', margin: 0 }}>
            Battles help rank albums by your preferences using ELO ratings!
          </p>
        </div>
      </div>
    </div>
  );
}