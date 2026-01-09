import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function GET() {
  try {
    // Open the SQLite database
    const db = await open({
      filename: path.join(process.cwd(), 'albums.db'),
      driver: sqlite3.Database
    });
    
    // Query all albums ordered by ELO rating (highest first)
    const albums = await db.all(`
      SELECT 
        id,
        title,
        artist,
        year,
        cover_url,
        elo_rating
      FROM albums 
      ORDER BY elo_rating DESC, title ASC
    `);
    
    await db.close();
    
    return NextResponse.json({ 
      albums,
      total: albums.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}