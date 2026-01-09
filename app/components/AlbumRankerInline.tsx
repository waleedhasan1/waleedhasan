'use client'

import { useState, useEffect } from 'react';

interface Album {
  title: string;
  artist: string;
  cover_url: string;
  year: string;
  elo_rating: number;
}

export default function AlbumRankerInline() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'elo' | 'title' | 'artist' | 'year'>('elo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchAllAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching from /api/rankings...');
      const response = await fetch('/api/rankings');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const textResponse = await response.text();
      console.log('Response text (first 200 chars):', textResponse.substring(0, 200));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rankings: ${response.status} - ${textResponse}`);
      }
      
      // Try to parse as JSON
      const data = JSON.parse(textResponse);
      console.log('Parsed data:', data);
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
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
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
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #9333EA',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6B7280' }}>Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ 
          background: '#FEF2F2', 
          border: '1px solid #FECACA', 
          borderRadius: 8, 
          padding: 24,
          textAlign: 'center',
          maxWidth: 400
        }}>
          <h2 style={{ color: '#991B1B', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Error</h2>
          <p style={{ color: '#DC2626', marginBottom: 16 }}>{error}</p>
          <button 
            onClick={fetchAllAlbums}
            style={{
              background: '#DC2626',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'linear-gradient(135deg, #F3E7F8 0%, #E0F2FE 100%)' }}>
      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
            🎵 Album Rankings
          </h1>
          <p style={{ color: '#6B7280' }}>
            {albums.length} albums ranked by ELO rating
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Total Albums</h3>
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{albums.length}</p>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Highest ELO</h3>
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>
              {albums.length > 0 ? Math.max(...albums.map(a => a.elo_rating)) : 0}
            </p>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Lowest ELO</h3>
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#DC2626' }}>
              {albums.length > 0 ? Math.min(...albums.map(a => a.elo_rating)) : 0}
            </p>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Average ELO</h3>
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#2563EB' }}>
              {albums.length > 0 ? Math.round(albums.reduce((sum, a) => sum + a.elo_rating, 0) / albums.length) : 0}
            </p>
          </div>
        </div>

        {/* Rankings List */}
        <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '60px 80px 2fr 2fr 80px 100px',
            gap: 8,
            padding: '12px 16px',
            background: '#F9FAFB',
            fontWeight: 600,
            fontSize: 12,
            color: '#6B7280',
            borderBottom: '1px solid #E5E7EB'
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
                padding: '12px 16px',
                alignItems: 'center',
                borderBottom: index < sortedAlbums.length - 1 ? '1px solid #E5E7EB' : 'none',
                background: index % 2 === 0 ? 'white' : '#F9FAFB'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 'bold', color: getRankColor(index) }}>
                {getRankIcon(index)}
              </div>
              <div>
                {album.cover_url ? (
                  <img 
                    style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover' }}
                    src={album.cover_url} 
                    alt={`${album.title} cover`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: 60, 
                    height: 60, 
                    background: '#E5E7EB', 
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    🎵
                  </div>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {album.title}
              </div>
              <div style={{ fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {album.artist}
              </div>
              <div style={{ fontSize: 14, color: '#111827' }}>
                {album.year}
              </div>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 12,
                  background: album.elo_rating >= 1400 ? '#D1FAE5' :
                             album.elo_rating >= 1200 ? '#FEF3C7' : '#FEE2E2',
                  color: album.elo_rating >= 1400 ? '#065F46' :
                         album.elo_rating >= 1200 ? '#92400E' : '#991B1B'
                }}>
                  {album.elo_rating}
                </span>
              </div>
            </div>
          ))}
        </div>

        {albums.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: '#6B7280', fontSize: 18 }}>No albums found. Start battling to see rankings!</p>
          </div>
        )}
      </div>
    </div>
  );
}