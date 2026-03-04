import { NextResponse } from 'next/server'

const API_KEY = 'b5UXWhTf2mD3igc77SQNGSHzT'
const BASE = 'http://www.ctabustracker.com/bustime/api/v2'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'predictions'
  const rt = searchParams.get('rt')
  const dir = searchParams.get('dir')
  const stpid = searchParams.get('stpid')

  try {
    if (action === 'stops' && rt && dir) {
      const res = await fetch(`${BASE}/getstops?key=${API_KEY}&rt=${rt}&dir=${dir}&format=json`)
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === 'directions' && rt) {
      const res = await fetch(`${BASE}/getdirections?key=${API_KEY}&rt=${rt}&format=json`)
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === 'predictions' && stpid) {
      const url = rt
        ? `${BASE}/getpredictions?key=${API_KEY}&stpid=${stpid}&rt=${rt}&format=json`
        : `${BASE}/getpredictions?key=${API_KEY}&stpid=${stpid}&format=json`
      const res = await fetch(url)
      const data = await res.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  } catch (error) {
    console.error('CTA Bus API error:', error)
    return NextResponse.json({ error: 'Failed to fetch CTA bus data' }, { status: 500 })
  }
}
