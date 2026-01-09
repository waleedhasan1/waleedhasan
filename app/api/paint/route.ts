import { NextResponse } from 'next/server';

// In-memory storage (replace with database in production)
let canvasImageData: string | null = null;
let drawActions: Array<{
  id: string;
  type: 'draw' | 'fill' | 'clear';
  x?: number;
  y?: number;
  prevX?: number;
  prevY?: number;
  color?: string;
  size?: number;
  tool?: string;
  fillX?: number;
  fillY?: number;
  timestamp: number;
}> = [];

// GET - Fetch canvas state or updates
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = parseInt(searchParams.get('since') || '0');
    
    if (since > 0) {
      // Return only new actions since timestamp
      const newActions = drawActions.filter(action => action.timestamp > since);
      const latestTimestamp = drawActions.length > 0 
        ? Math.max(...drawActions.map(a => a.timestamp))
        : Date.now();
      
      return NextResponse.json({
        actions: newActions,
        timestamp: latestTimestamp
      });
    }
    
    // Return full canvas state
    return NextResponse.json({
      imageData: canvasImageData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching canvas:', error);
    return NextResponse.json({ error: 'Failed to fetch canvas' }, { status: 500 });
  }
}

// POST - Add a draw action
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    
    // Add timestamp if not present
    if (!action.timestamp) {
      action.timestamp = Date.now();
    }
    
    drawActions.push(action);
    
    // Keep only last 1000 actions to prevent memory issues
    if (drawActions.length > 1000) {
      drawActions = drawActions.slice(-1000);
    }
    
    return NextResponse.json({ success: true, timestamp: action.timestamp });
  } catch (error) {
    console.error('Error posting action:', error);
    return NextResponse.json({ error: 'Failed to post action' }, { status: 500 });
  }
}

// PUT - Save full canvas state
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { imageData } = body;
    
    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }
    
    canvasImageData = imageData;
    
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error('Error saving canvas:', error);
    return NextResponse.json({ error: 'Failed to save canvas' }, { status: 500 });
  }
}