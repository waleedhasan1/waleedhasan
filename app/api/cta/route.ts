import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mapid = searchParams.get('mapid') || '40350'
  
  console.log('=== CTA API ROUTE CALLED ===')
  console.log('Request URL:', request.url)
  console.log('mapid parameter:', mapid)
  
  const API_KEY = '017acdd6a96947089c23ead6d6a5ccd0'
  const url = `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${API_KEY}&mapid=${mapid}&max=10`
  
  console.log('CTA API URL:', url)
  
  try {
    const response = await fetch(url)
    console.log('CTA Response Status:', response.status)
    
    const data = await response.text()
    console.log('CTA Response (first 200 chars):', data.substring(0, 200))
    
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('CTA API ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CTA data' },
      { status: 500 }
    )
  }
}