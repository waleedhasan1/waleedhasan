import { NextResponse } from 'next/server';

// In-memory storage (replace with database in production)
let messages: Array<{
  id: string;
  name: string;
  message: string;
  timestamp: string;
}> = [];

export async function GET() {
  try {
    // Return the last 50 messages
    const recentMessages = messages.slice(-50);
    return NextResponse.json({ messages: recentMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, message } = body;

    if (!name || !message) {
      return NextResponse.json({ error: 'Name and message are required' }, { status: 400 });
    }

    // Create new message
    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: name.substring(0, 30), // Limit name length
      message: message.substring(0, 500), // Limit message length
      timestamp: new Date().toISOString()
    };

    messages.push(newMessage);

    // Keep only last 100 messages to prevent memory issues
    if (messages.length > 100) {
      messages = messages.slice(-100);
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}