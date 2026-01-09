import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Query all albums ordered by ELO rating (highest first)
    const { rows } = await sql`
      SELECT 
        id,
        title,
        artist,
        year,
        cover_url,
        elo_rating
      FROM albums 
      ORDER BY elo_rating DESC, title ASC
    `;
    
    console.log(`Successfully fetched ${rows.length} albums`);
    
    return NextResponse.json({ 
      albums: rows,
      total: rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch rankings', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}