import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const C = {
  bg: '#F5F2EC', bgShelf: '#EEEBE4', text: '#1A1A1A',
  muted: 'rgba(0,0,0,0.35)', faint: 'rgba(0,0,0,0.18)',
  border: 'rgba(0,0,0,0.1)', borderMid: 'rgba(0,0,0,0.2)',
  font: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'Courier New', Courier, monospace",
}

function getSpineWidth(pages) {
  const MIN_W = 36, MAX_W = 60, MIN_P = 100, MAX_P = 700
  const c = Math.max(MIN_P, Math.min(MAX_P, pages || 250))
  return Math.round(MIN_W + ((c - MIN_P) / (MAX_P - MIN_P)) * (MAX_W - MIN_W))
}

function getSpineHeight(bookId) {
  return 130 + (bookId % 7) * 4
}

function getSpineTitle(title) {
  if (!title) return ''
  return title.length > 8 ? title.slice(0, 8) + '…' : title
}

const FONT_PAIRS = [
  { f: "'Playfair Display', Georgia, serif", fw: '700' },
  { f: "'Space Mono', 'Courier New', monospace", fw: '700' },
  { f: "'Bebas Neue', Arial, sans-serif", fw: '400' },
  { f: "'DM Serif Display', Georgia, serif", fw: '400' },
  { f: "'Pretendard', sans-serif", fw: '800' },
]

const STATUS_LABEL = {
  read: '✅ 읽음',
  reading: '📖 읽는 중',
  want: '🔖 읽고 싶어요',
}

export default function ShelfPage() {
  const router = useRouter()
  const { userId } = router.query
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || userId === 'guest') { setLoading(false); return }
    supabase.from('books').select('*').eq('user_id', userId).order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setBooks(data.map(b => ({
          id: b.id, title: b.title, author: b.author, publisher: b.publisher,
          thumbnail: b.thumbnail, pages: b.pages, bg: b.bg, spineText: b.spine_text,
          fp: b.fp, status: b.status || 'read', receipts: b.receipts || [],
        })))
        setLoading(false)
      })
  }, [userId])

  const readCount = books.filter(b => b.status === 'read').length
  const readingCount = books.filter(b => b.status === 'reading').length

  if (loading) return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: C.muted, fontFamily: C.mono }}>불러오는 중...</div>
    </div>
  )

  if (!userId || userId === 'guest' || books.length === 0) return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>📚</div>
      <div style={{ fontSize: 14, color: C.muted, fontFamily: C.font, textAlign: 'center', marginBottom: 24 }}>아직 서재가 비어있어요</div>
      <a href="/" style={{ fontSize: 12, color: C.text, fontFamily: C.mono, textDecoration: 'underline' }}>나도 서재 만들기 →</a>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
      <Head>
        <title>STOCKED — 나의 서재</title>
        <meta property="og:title" content="STOCKED — 나의 서재" />
        <meta property="og:description" content={`${readCount}권 읽음 · ${readingCount}권 읽는 중`} />
        <meta property="og:image" content="https://stocked-phi.vercel.app/logo.png" />
      </Head>

      {/* 헤더 */}
      <div style={{ padding: '28px 20px 16px', borderBottom: `0.5px solid ${C.border}` }}>
        <img src="/logo.png" alt="STOCKED" style={{ height: 24, marginBottom: 10, objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: C.font }}>{books.length}</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono }}>전체</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: C.font }}>{readCount}</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono }}>읽음</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: C.font }}>{readingCount}</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono }}>읽는 중</div>
          </div>
        </div>
      </div>

      {/* 서재 */}
      <div style={{ background: C.bgShelf, padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', minHeight: 140 }}>
          {books.map(b => {
            const w = getSpineWidth(b.pages)
            const h = getSpineHeight(b.id)
            const fp = FONT_PAIRS[b.fp % FONT_PAIRS.length]
            const tc = b.spineText || '#1A1A1A'
            return (
              <div key={b.id} title={b.title} style={{
                width: w, height: h, background: b.bg,
                borderRight: '2px solid rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0, overflow: 'hidden',
                boxSizing: 'border-box', padding: '6px 3px',
              }}>
                <div style={{ fontSize: 7, color: tc, opacity: 0.55, fontFamily: C.font, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textAlign: 'center' }}>{b.author}</div>
                <div style={{ fontSize: 9, fontWeight: fp.fw, color: tc, fontFamily: fp.f, wordBreak: 'break-all', overflow: 'hidden', textAlign: 'center', lineHeight: '12px', height: '60px', maxHeight: '60px', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>{getSpineTitle(b.title)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 책 목록 */}
      <div style={{ padding: 20 }}>
        {books.map(b => (
          <div key={b.id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: `0.5px solid ${C.border}` }}>
            {b.thumbnail ? <img src={b.thumbnail} alt={b.title} style={{ width: 44, height: 62, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 44, height: 62, background: b.bg, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.font, marginBottom: 2 }}>{b.title}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font, marginBottom: 4 }}>{b.author}</div>
              <div style={{ fontSize: 10, color: C.faint, fontFamily: C.mono }}>{STATUS_LABEL[b.status] || '✅ 읽음'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 푸터 CTA */}
      <div style={{ padding: '20px 20px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font, marginBottom: 12 }}>나도 독서 서재 만들기</div>
        <a href="/" style={{ display: 'inline-block', background: C.text, color: C.bg, padding: '12px 28px', fontSize: 13, fontFamily: C.font, textDecoration: 'none' }}>STOCKED 시작하기 →</a>
      </div>
    </div>
  )
}
