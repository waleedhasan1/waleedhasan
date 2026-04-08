'use client'

import { useEffect, useRef, useState } from 'react'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type NeighborhoodData = {
  areaNumber: number
  rent: { avg: number; low: number; high: number } | null
  crime: { total: number; per100k: number | null; year: number } | null
  demographics: { population: number; estimatedMedianIncome: number; households: number } | null
  transit: { ctaStations: number; ctaLines: string[] }
  bus: { busReliability: number | null; busRouteCount: number; busAvgWeekdayRiders: number; busRoutes: string[] }
}

type TopPickData = { name: string; data: NeighborhoodData }

type SearchMeta = {
  transitLines: string[]
  topPicks: string[]
  topPicksData: TopPickData[]
  allMatches: string[]
  rentBudget: number | null
}

const NEIGHBORHOOD_TAG_RE = /\[\[NEIGHBORHOODS:\s*([^\]]+)\]\]/
const META_RE = /__META__(.+?)__META__\n?/

function FormattedMessage({ content }: { content: string }) {
  if (!content) return null
  const lines = content.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
        if (/^\s*[-*•]\s/.test(line)) {
          return (
            <div key={i} style={{ paddingLeft: 12, position: 'relative', marginBottom: 2 }}>
              <span style={{ position: 'absolute', left: 0 }}>•</span>
              {formatInline(line.replace(/^\s*[-*•]\s+/, ''))}
            </div>
          )
        }
        return <div key={i} style={{ marginBottom: 2 }}>{formatInline(line)}</div>
      })}
    </>
  )
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <b key={i} style={{ color: '#c10070' }}>{part.slice(2, -2)}</b>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function NeighborhoodFinderInline() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = async (q: string) => {
    const userMessage: ChatMessage = { role: 'user', content: q }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setIsLoading(true)

    try {
      const res = await fetch('/api/neighborhood-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, query: q }),
      })

      if (!res.ok) {
        const errText = await res.text()
        setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, something went wrong: ${errText}` }])
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let accumulated = ''
      let metaParsed = false

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })

        if (!metaParsed) {
          const metaMatch = accumulated.match(META_RE)
          if (metaMatch) {
            try {
              const meta = JSON.parse(metaMatch[1])
              setSearchMeta(meta)
            } catch { /* ignore */ }
            accumulated = accumulated.replace(META_RE, '')
            metaParsed = true
          }
        }

        const display = accumulated.replace(NEIGHBORHOOD_TAG_RE, '').trimEnd()
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: display }
          return copy
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return
    sendMessage(query)
    setQuery('')
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: '#FFF',
    border: '2px inset #DFDFDF',
    padding: '4px 6px',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
  }
  const btnStyle: React.CSSProperties = {
    background: '#C0C0C0',
    border: '2px outset #DFDFDF',
    padding: '4px 12px',
    fontFamily: 'inherit',
    fontSize: 12,
    cursor: isLoading ? 'wait' : 'pointer',
    fontWeight: 'bold',
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: '#008080',
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        padding: 4,
        gap: 4,
      }}
    >
      {/* LEFT: matched neighborhoods list */}
      <div
        style={{
          width: 240,
          background: '#0a0a1a',
          border: '2px inset #DFDFDF',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: 6,
            background: 'linear-gradient(to right, #6A0DAD, #008B8B)',
            color: '#FFD700',
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: 1,
            textShadow: '1px 1px 0 #000',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          MATCHES
          {searchMeta && (
            <span style={{ fontSize: 9, opacity: 0.8, marginLeft: 6 }}>
              {searchMeta.allMatches.length} found
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {!searchMeta && (
            <div style={{ color: '#888', fontSize: 11, padding: 12, textAlign: 'center', fontStyle: 'italic' }}>
              Ask the chat to find neighborhoods. Matches will appear here.
            </div>
          )}
          {searchMeta?.allMatches.map((name, i) => {
            const pick = searchMeta.topPicksData.find(p => p.name === name)
            const isTop = searchMeta.topPicks.includes(name)
            return (
              <div
                key={i}
                style={{
                  background: isTop ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.04)',
                  borderLeft: isTop ? '3px solid #FFD700' : '2px solid #008B8B',
                  padding: 6,
                  marginBottom: 4,
                  borderRadius: 2,
                }}
              >
                <div style={{ color: isTop ? '#FFD700' : '#eee', fontSize: 12, fontWeight: 'bold' }}>
                  {titleCase(name)}
                </div>
                {pick && (
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, lineHeight: 1.4 }}>
                    {pick.data.rent && <div>Rent: ${pick.data.rent.avg.toLocaleString()}/mo</div>}
                    {pick.data.crime?.per100k != null && (
                      <div>Crime: {Math.round(pick.data.crime.per100k).toLocaleString()}/100k</div>
                    )}
                    {pick.data.transit.ctaLines.length > 0 && (
                      <div>CTA: {pick.data.transit.ctaLines.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT: chat */}
      <div
        style={{
          flex: 1,
          background: '#f0f8f8',
          border: '2px inset #DFDFDF',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: 6,
            background: 'linear-gradient(to right, #6A0DAD, #008B8B)',
            color: '#FFD700',
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: 1,
            textShadow: '1px 1px 0 #000',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          NEIGHBORHOOD FINDER
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #999',
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              maxWidth: '85%',
              alignSelf: 'flex-start',
            }}
          >
            Hey! Tell me what you&apos;re looking for in a Chicago neighborhood and I&apos;ll help you find the right spot.
          </div>
          {messages.length === 0 && (
            <div style={{ color: '#666', fontSize: 11, textAlign: 'center', padding: 4, fontStyle: 'italic' }}>
              Try: &quot;walkable, near the L, under $1500 rent, low crime&quot;
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                background: msg.role === 'user' ? '#008B8B' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#000',
                border: msg.role === 'user' ? 'none' : '1px solid #999',
                padding: '6px 10px',
                borderRadius: 4,
                fontSize: 12,
                maxWidth: '85%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
              }}
            >
              {msg.role === 'assistant' ? <FormattedMessage content={msg.content} /> : msg.content}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #999',
                padding: '6px 10px',
                borderRadius: 4,
                fontSize: 12,
                maxWidth: '85%',
                alignSelf: 'flex-start',
                opacity: 0.7,
                fontStyle: 'italic',
              }}
            >
              thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 6,
            background: '#C0C0C0',
            display: 'flex',
            gap: 6,
            borderTop: '1px solid #808080',
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where should I live..."
            style={inputStyle}
            disabled={isLoading}
          />
          <button type="submit" style={btnStyle} disabled={isLoading}>
            {isLoading ? '...' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  )
}
