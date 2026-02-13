import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('playerId') || '1630162'
  const season = searchParams.get('season') || '2024-25'

  try {
    const url = `https://stats.nba.com/stats/shotchartdetail?PlayerID=${playerId}&Season=${season}&SeasonType=Regular+Season&TeamID=0&GameID=&Outcome=&Location=&Month=0&SeasonSegment=&DateFrom=&DateTo=&OpponentTeamID=0&VsConference=&VsDivision=&Position=&RookieYear=&GameSegment=&Period=0&LastNGames=0&ContextMeasure=FGA`

    const response = await fetch(url, {
      headers: {
        'Host': 'stats.nba.com',
        'Referer': 'https://www.nba.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.nba.com',
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `NBA API returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('NBA API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shot data' },
      { status: 500 }
    )
  }
}
