import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { winnerId, loserId, newWinnerElo, newLoserElo } = await request.json();
    
    if (!winnerId || !loserId || !newWinnerElo || !newLoserElo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Update both albums' ELO ratings
    await sql`
      UPDATE albums 
      SET elo_rating = ${newWinnerElo}
      WHERE id = ${winnerId}
    `;
    
    await sql`
      UPDATE albums 
      SET elo_rating = ${newLoserElo}
      WHERE id = ${loserId}
    `;
    
    console.log(`Battle complete: Winner #${winnerId} (${newWinnerElo}), Loser #${loserId} (${newLoserElo})`);
    
    return NextResponse.json({ 
      success: true,
      winnerId,
      loserId,
      newWinnerElo,
      newLoserElo
    });
    
  } catch (error) {
    console.error('Battle update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update battle results', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}