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

interface AlbumLeaderboardInlineProps {
  openBattle?: () => void;
}

export default function AlbumLeaderboardInline({ openBattle }: AlbumLeaderboardInlineProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'elo' | 'title' | 'artist' | 'year'>('elo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchAllAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rankings');
      const textResponse = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rankings: ${response.status}`);
      }
      
      const data = JSON.parse(textResponse);
      setAlbums(data.albums || []);
    } catch (err) {
      console.error('Full error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sortedAlbums = [...albums].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'elo':
        aValue = a.elo_rating;
        bValue = b.elo_rating;
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'artist':
        aValue = a.artist.toLowerCase();
        bValue = b.artist.toLowerCase();
        break;
      case 'year':
        aValue = parseInt(a.year) || 0;
        bValue = parseInt(b.year) || 0;
        break;
      default:
        aValue = a.elo_rating;
        bValue = b.elo_rating;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (column: 'elo' | 'title' | 'artist' | 'year') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getRankColor = (index: number) => {
    if (index === 0) return '#FFD700';
    if (index === 1) return '#C0C0C0';
    if (index === 2) return '#CD7F32';
    return '#4B5563';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  useEffect(() => {
    fetchAllAlbums();
  }, []);

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
          <p style={{ color: '#000', fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 11 }}>Loading rankings...</p>
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

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#008080' }}>
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
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>
                🏆 Album Leaderboard
              </h1>
              <p style={{ color: '#000', margin: 0, fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 10 }}>
                {albums.length} albums ranked by ELO rating
              </p>
            </div>
            {openBattle && (
              <button
                onClick={openBattle}
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
                ⚔️ Battle Mode
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
          <div style={{ background: '#C0C0C0', border: '2px outset #DFDFDF', padding: 8, boxShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 10, fontWeight: 'bold', color: '#000', marginBottom: 4, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>Total Albums</h3>
            <p style={{ fontSize: 20, fontWeight: 'bold', color: '#000080', margin: 0, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>{albums.length}</p>
          </div>
          <div style={{ background: '#C0C0C0', border: '2px outset #DFDFDF', padding: 8, boxShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 10, fontWeight: 'bold', color: '#000', marginBottom: 4, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>Highest ELO</h3>
            <p style={{ fontSize: 20, fontWeight: 'bold', color: '#008000', margin: 0, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>
              {albums.length > 0 ? Math.max(...albums.map(a => a.elo_rating)) : 0}
            </p>
          </div>
          <div style={{ background: '#C0C0C0', border: '2px outset #DFDFDF', padding: 8, boxShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 10, fontWeight: 'bold', color: '#000', marginBottom: 4, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>Lowest ELO</h3>
            <p style={{ fontSize: 20, fontWeight: 'bold', color: '#800000', margin: 0, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>
              {albums.length > 0 ? Math.min(...albums.map(a => a.elo_rating)) : 0}
            </p>
          </div>
          <div style={{ background: '#C0C0C0', border: '2px outset #DFDFDF', padding: 8, boxShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 10, fontWeight: 'bold', color: '#000', marginBottom: 4, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>Average ELO</h3>
            <p style={{ fontSize: 20, fontWeight: 'bold', color: '#000080', margin: 0, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>
              {albums.length > 0 ? Math.round(albums.reduce((sum, a) => sum + a.elo_rating, 0) / albums.length) : 0}
            </p>
          </div>
        </div>

        {/* Rankings List */}
        <div style={{ background: 'white', border: '2px inset #DFDFDF', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '60px 80px 2fr 2fr 80px 100px',
            gap: 8,
            padding: '8px 12px',
            background: '#000080',
            fontWeight: 'bold',
            fontSize: 11,
            color: 'white',
            borderBottom: '2px solid #808080',
            fontFamily: 'MS Sans Serif, Arial, sans-serif'
          }}>
            <div>RANK</div>
            <div>COVER</div>
            <div style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
              TITLE {getSortIcon('title')}
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => handleSort('artist')}>
              ARTIST {getSortIcon('artist')}
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => handleSort('year')}>
              YEAR {getSortIcon('year')}
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => handleSort('elo')}>
              ELO {getSortIcon('elo')}
            </div>
          </div>

          {/* Table Body */}
          {sortedAlbums.map((album, index) => (
            <div 
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 80px 2fr 2fr 80px 100px',
                gap: 8,
                padding: '8px 12px',
                alignItems: 'center',
                borderBottom: index < sortedAlbums.length - 1 ? '1px solid #C0C0C0' : 'none',
                background: index % 2 === 0 ? 'white' : '#DFDFDF',
                fontFamily: 'MS Sans Serif, Arial, sans-serif',
                fontSize: 11
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 'bold', color: getRankColor(index) }}>
                {getRankIcon(index)}
              </div>
              <div>
                {album.cover_url ? (
                  <img 
                    style={{ width: 60, height: 60, objectFit: 'cover', border: '1px solid #808080' }}
                    src={album.cover_url} 
                    alt={`${album.title} cover`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjQzBDMEMwIi8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiM4MDgwODAiLz4KPC9zdmc+';
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: 60, 
                    height: 60, 
                    background: '#C0C0C0', 
                    border: '1px solid #808080',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    🎵
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {album.title}
              </div>
              <div style={{ fontSize: 11, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {album.artist}
              </div>
              <div style={{ fontSize: 11, color: '#000' }}>
                {album.year}
              </div>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: 'bold',
                  border: '1px solid #808080',
                  background: album.elo_rating >= 1400 ? '#00FF00' :
                             album.elo_rating >= 1200 ? '#FFFF00' : '#FF0000',
                  color: '#000'
                }}>
                  {album.elo_rating}
                </span>
              </div>
            </div>
          ))}
        </div>

        {albums.length === 0 && (
          <div style={{ 
            background: 'white',
            border: '2px inset #DFDFDF',
            padding: 24,
            textAlign: 'center',
            marginTop: 16
          }}>
            <p style={{ color: '#000', fontSize: 11, margin: 0, fontFamily: 'MS Sans Serif, Arial, sans-serif' }}>No albums found. Start battling to see rankings!</p>
          </div>
        )}
      </div>
    </div>
  );
}