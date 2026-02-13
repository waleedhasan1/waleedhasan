import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const season = searchParams.get('season') || '2024-25'

  try {
    const url = `https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=${season}&IsOnlyCurrentSeason=1`

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
    const rows = data.resultSets[0].rowSet

    const filtered = rows
      .filter((row: any[]) => {
        if (!search) return row[3] === 1
        return row[2].toLowerCase().includes(search.toLowerCase())
      })
      .slice(0, 25)
      .map((row: any[]) => ({
        id: row[0],
        name: row[2],
        teamAbbr: row[10] || '',
        teamCity: row[8] || '',
        teamName: row[9] || '',
      }))

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('NBA Players API error:', error)
    return NextResponse.json(
      { error: 'Failed to search players' },
      { status: 500 }
    )
  }
}
