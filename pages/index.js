import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const FONT_PAIRS = [
  { f: "Georgia, 'Times New Roman', serif", fw: '700' },
  { f: "'Pretendard', sans-serif", fw: '600' },
  { f: "'Pretendard', sans-serif", fw: '800' },
  { f: "Georgia, serif", fw: '700' },
]

const SPINE_COLORS = [
  { bg: '#F4F1E2', text: '#513229' },
  { bg: '#D8EBF9', text: '#2C4A5A' },
  { bg: '#FCE6B7', text: '#6B4A10' },
  { bg: '#D7D4B1', text: '#3A3820' },
  { bg: '#513229', text: '#F4F1E2' },
]

const C = {
  bg: '#F5F2EC',
  bgShelf: '#EEEBE4',
  text: '#1A1A1A',
  muted: 'rgba(0,0,0,0.35)',
  faint: 'rgba(0,0,0,0.18)',
  border: 'rgba(0,0,0,0.1)',
  borderMid: 'rgba(0,0,0,0.2)',
  font: "'Pretendard', 'Courier New', monospace",
  mono: "'Courier New', Courier, monospace",
}

function getSpineWidth(pages) {
  const MIN_W = 48, MAX_W = 88, MIN_P = 100, MAX_P = 700
  const c = Math.max(MIN_P, Math.min(MAX_P, pages || 250))
  return Math.round(MIN_W + ((c - MIN_P) / (MAX_P - MIN_P)) * (MAX_W - MIN_W))
}

function getTitleMode(title, width) {
  const clean = title.replace(/\s/g, '')
  return clean.length * 11 <= width - 22 ? 'h' : 'v'
}

function Barcode({ seed }) {
  const bars = []
  let x = 0
  for (let i = 0; i < 52; i++) {
    const w = ((seed * (i + 1) * 13) % 3) + 1
    const g = i % 5 === 0 ? 2 : 1
    bars.push({ x, w })
    x += w + g
  }
  return (
    <svg viewBox={`0 0 ${x} 34`} style={{ width: 176, height: 34, display: 'block', margin: '0 auto' }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={34} fill="#1A1A1A" />
      ))}
    </svg>
  )
}

function NavBar({ onBack, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `0.5px solid ${C.border}` }}>
      <span style={{ fontSize: 10, letterSpacing: '0.1em', color: C.muted, cursor: 'pointer', fontFamily: C.font }} onClick={onBack}>← BACK</span>
      <span style={{ fontSize: 10, letterSpacing: '0.2em', color: C.text, textTransform: 'uppercase', fontFamily: C.mono }}>{title}</span>
      <span style={{ fontSize: 10, color: C.muted, minWidth: 40, textAlign: 'right', fontFamily: C.font }}>{right}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: `1px dashed ${C.border}`, margin: '12px 0' }} />
}

export default function Home() {
  const [view, setView] = useState('library')
  const [books, setBooks] = useState([])
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [nickname, setNickname] = useState('')
  const [quotes, setQuotes] = useState([{ text: '', page: '' }])
  const receiptRef = useRef(null)

  useEffect(() => { initAuth() }, [])

  const initAuth = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    let user = session?.user
    if (!user) {
      const { data } = await supabase.auth.signInAnonymously()
      user = data?.user
    }
    if (user) {
      setUserId(user.id)
      await loadBooks(user.id)
    }
    setLoading(false)
  }

  const loadBooks = async (uid) => {
    const { data } = await supabase.from('books').select('*').eq('user_id', uid).order('created_at', { ascending: true })
    if (data) {
      setBooks(data.map(b => ({
        id: b.id, title: b.title, author: b.author, publisher: b.publisher,
        thumbnail: b.thumbnail, readDate: b.read_date, pages: b.pages,
        h: b.h, bg: b.bg, spineText: b.spine_text, fp: b.fp, receipts: b.receipts || [],
      })))
    }
  }

  const saveBooks = async (updated) => {
    setBooks(updated)
    for (const b of updated) {
      await supabase.from('books').upsert({
        id: b.id, user_id: userId, title: b.title, author: b.author,
        publisher: b.publisher, thumbnail: b.thumbnail, read_date: b.readDate,
        pages: b.pages, h: b.h, bg: b.bg, spine_text: b.spineText,
        fp: b.fp, receipts: b.receipts,
      })
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/search-book?query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.books || [])
    } catch { alert('검색 중 오류가 발생했습니다') }
    setSearching(false)
  }

  const addBook = async (kakaoBook) => {
    const colorSet = SPINE_COLORS[books.length % SPINE_COLORS.length]
    const newBook = {
      id: Date.now(), title: kakaoBook.title, author: kakaoBook.authors?.join(', ') || '',
      publisher: kakaoBook.publisher || '', thumbnail: kakaoBook.thumbnail || '',
      readDate: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1),
      pages: 250, h: 200 + Math.floor(Math.random() * 60),
      bg: colorSet.bg, spineText: colorSet.text,
      fp: books.length % FONT_PAIRS.length, receipts: [],
    }
    await saveBooks([...books, newBook])
    setView('library')
    setSearchQuery('')
    setSearchResults([])
  }

  const generateReceipt = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요')
    const valid = quotes.filter((q) => q.text.trim())
    if (!valid.length) return alert('명대사를 하나 이상 입력해주세요')
    const d = new Date()
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    const newReceipt = { id: Date.now(), date: dateStr, nickname, quotes: valid }
    const updated = books.map((b) => b.id === selectedBook.id ? { ...b, receipts: [...b.receipts, newReceipt] } : b)
    await saveBooks(updated)
    const updatedBook = updated.find((b) => b.id === selectedBook.id)
    setSelectedBook(updatedBook)
    setSelectedReceipt(newReceipt)
    setView('receipt')
  }

  const saveAsImage = async () => {
    if (!receiptRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `stocked_${selectedBook.title}_${selectedReceipt.date}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch { alert('이미지 저장 중 오류가 발생했습니다') }
  }

  const inputStyle = {
    width: '100%', padding: '9px 10px', fontSize: 13,
    border: `0.5px solid ${C.borderMid}`,
    background: 'transparent', color: C.text,
    fontFamily: C.font, outline: 'none',
  }
  const btnOutline = {
    width: '100%', padding: 12, fontSize: 11, letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer',
    border: `0.5px solid ${C.borderMid}`,
    background: 'transparent', color: C.text, fontFamily: C.font,
  }
  const btnSolid = {
    width: '100%', padding: 12, fontSize: 11, letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer',
    border: 'none', background: C.text, color: C.bg, fontFamily: C.font,
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', fontFamily: C.mono }}>LOADING...</div>
      </div>
    )
  }

  // ── LIBRARY ──
  if (view === 'library') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        {/* 헤더 */}
        <div style={{ padding: '28px 20px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <img src="/logo.png" alt="STOCKED" style={{ height: 36, display: 'block' }} />
        </div>

        {/* 책장 */}
        <div style={{ background: C.bgShelf, marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 3, overflowX: 'auto', padding: '40px 20px 32px', alignItems: 'flex-end', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {books.map((b) => {
              const w = getSpineWidth(b.pages)
              const mode = getTitleMode(b.title, w)
              const fp = FONT_PAIRS[b.fp]
              const tc = b.spineText || '#1A1A1A'
              return (
                <div
                  key={b.id}
                  onClick={() => { setSelectedBook(b); setView('detail') }}
                  style={{
                    width: w, height: b.h || 230, background: b.bg,
                    padding: '12px 11px', borderRight: '3px solid rgba(0,0,0,0.07)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    cursor: 'pointer', flexShrink: 0,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-12px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 8, letterSpacing: '0.05em', color: tc, opacity: 0.7, wordBreak: 'keep-all', fontFamily: C.font }}>{b.author}</div>
                  <div>
                    {b.receipts.length > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: tc, opacity: 0.5, marginBottom: 8 }} />}
                    {mode === 'v'
                      ? <div style={{ writingMode: 'vertical-rl', fontSize: 12, fontWeight: fp.fw, color: tc, fontFamily: fp.f, lineHeight: `${w - 10}px` }}>{b.title}</div>
                      : <div style={{ fontSize: 11, fontWeight: fp.fw, color: tc, fontFamily: fp.f, lineHeight: 1.25, wordBreak: 'keep-all' }}>{b.title}</div>
                    }
                  </div>
                </div>
              )
            })}
            <div onClick={() => setView('search')} style={{ width: 44, height: 150, border: `1px dashed ${C.borderMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: C.muted, fontSize: 20 }}>+</div>
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.14em', color: C.faint, textAlign: 'center', paddingBottom: 16, fontFamily: C.mono }}>— 스크롤 —</div>
        </div>

        {books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 13, lineHeight: 2, fontFamily: C.font }}>
            <div>아직 책이 없어요</div>
            <div style={{ fontSize: 11, color: C.faint }}>+ 를 눌러 첫 번째 책을 추가해보세요</div>
          </div>
        )}
      </div>
    )
  }

  // ── SEARCH ──
  if (view === 'search') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('library')} title="책 추가" right="" />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="책 제목 또는 저자..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleSearch} style={{ ...btnSolid, width: 'auto', padding: '0 16px' }}>{searching ? '...' : '검색'}</button>
          </div>
          {searchResults.map((book, i) => (
            <div key={i} onClick={() => addBook(book)} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer' }}>
              {book.thumbnail
                ? <img src={book.thumbnail} alt={book.title} style={{ width: 44, height: 60, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 44, height: 60, background: '#E8E4DC', flexShrink: 0 }} />
              }
              <div>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 4, lineHeight: 1.4, fontFamily: C.font }}>{book.title}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font }}>{book.authors?.join(', ')} · {book.publisher}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── DETAIL ──
  if (view === 'detail' && selectedBook) {
    const b = selectedBook
    const rc = b.receipts.length
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('library')} title="BOOK" right={`영수증 ${rc}`} />
        <div style={{ display: 'flex', gap: 16, padding: 20, borderBottom: `0.5px solid ${C.border}` }}>
          {b.thumbnail
            ? <img src={b.thumbnail} alt={b.title} style={{ width: 64, height: 88, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 64, height: 88, background: b.bg, borderRight: '3px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 5, lineHeight: 1.4, fontFamily: C.font }}>{b.title}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 2, fontFamily: C.font }}>{b.author}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontFamily: C.font }}>{b.publisher}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: C.faint, fontFamily: C.mono }}>READ · {b.readDate}</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <button onClick={() => { setNickname(''); setQuotes([{ text: '', page: '' }]); setView('form') }} style={btnSolid}>영수증 발급하기 →</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', color: C.muted, textTransform: 'uppercase', marginBottom: 12, fontFamily: C.mono }}>발급된 영수증</div>
          {rc === 0
            ? <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '16px 0', fontFamily: C.font }}>아직 없어요</div>
            : b.receipts.map((r, i) => (
                <div key={r.id} onClick={() => { setSelectedReceipt(r); setView('receipt') }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.text, marginBottom: 2, fontFamily: C.font }}>ORDER #{String(i + 1).padStart(4, '0')} · {r.nickname}</div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font }}>{r.date} · {r.quotes.length}개의 문장</div>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted }}>→</span>
                </div>
              ))
          }
        </div>
      </div>
    )
  }

  // ── FORM ──
  if (view === 'form' && selectedBook) {
    const b = selectedBook
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('detail')} title="영수증 발급" right="" />
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', color: C.muted, textTransform: 'uppercase', marginBottom: 5, fontFamily: C.mono }}>BOOK</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.font }}>{b.title}</div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', color: C.muted, textTransform: 'uppercase', marginBottom: 8, fontFamily: C.mono }}>CARDHOLDER</div>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임 입력" style={inputStyle} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: C.muted, textTransform: 'uppercase', fontFamily: C.mono }}>명대사</div>
            <div style={{ fontSize: 11, color: C.faint, fontFamily: C.font }}>{quotes.filter((q) => q.text).length}개 입력됨</div>
          </div>
          {quotes.map((q, i) => (
            <div key={i} style={{ background: '#EDE9E2', padding: 12, borderRadius: 3, marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: C.mono }}>#{String(i + 1).padStart(2, '0')}</span>
                {quotes.length > 1 && <span style={{ fontSize: 11, cursor: 'pointer', color: C.muted, fontFamily: C.font }} onClick={() => setQuotes(quotes.filter((_, idx) => idx !== i))}>삭제</span>}
              </div>
              <textarea value={q.text} onChange={(e) => { const u = [...quotes]; u[i].text = e.target.value; setQuotes(u) }} placeholder="명대사를 입력하세요" style={{ ...inputStyle, height: 64, resize: 'none', marginBottom: 5 }} />
              <input value={q.page} onChange={(e) => { const u = [...quotes]; u[i].page = e.target.value; setQuotes(u) }} placeholder="페이지 번호 (예: 42)" style={inputStyle} />
            </div>
          ))}
          <button onClick={() => setQuotes([...quotes, { text: '', page: '' }])} style={{ ...btnOutline, marginBottom: 8 }}>+ 명대사 추가</button>
          <button onClick={generateReceipt} style={btnSolid}>영수증 생성하기 →</button>
        </div>
      </div>
    )
  }

  // ── RECEIPT ──
  if (view === 'receipt' && selectedBook && selectedReceipt) {
    const b = selectedBook, r = selectedReceipt
    const idx = b.receipts.findIndex((x) => x.id === r.id)
    const orderNum = `#${String(idx + 1).padStart(4, '0')}`
    const cardNum = `**** **** **** ${1000 + (r.id % 9000)}`
    const authCode = String(100000 + (r.id * 7) % 900000)
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('detail')} title="RECEIPT" right="" />
        <div style={{ padding: 20 }}>
          <div ref={receiptRef} style={{ background: '#fff', border: `0.5px solid ${C.border}`, borderRadius: 3, padding: '24px 20px', fontFamily: C.mono }}>
            <div style={{ textAlign: 'center', fontSize: 16, letterSpacing: '0.3em', color: '#bbb', marginBottom: 14 }}>° ✦ ☆ ✦ °</div>
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 4, fontFamily: C.font }}>{b.title}</div>
            <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.14em', color: '#999', marginBottom: 13 }}>{b.author} · {b.publisher}</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#1A1A1A', marginBottom: 3 }}>ORDER {orderNum} FOR {r.nickname} ☆</div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa' }}>{r.date}</div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: '0.1em', color: '#aaa', marginBottom: 9 }}>
              <span>NO</span><span style={{ flex: 1, textAlign: 'left', paddingLeft: 7 }}>SENTENCE</span><span>PAGE</span>
            </div>
            {r.quotes.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.6, color: '#1A1A1A', fontFamily: C.font }}>
                <span style={{ minWidth: 20, color: '#aaa', fontSize: 10, fontFamily: C.mono }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, paddingRight: 6 }}>{q.text}</span>
                <span style={{ fontSize: 10, color: '#aaa', whiteSpace: 'nowrap', fontFamily: C.mono }}>p.{q.page || '—'}</span>
              </div>
            ))}
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, lineHeight: 2.1, color: '#1A1A1A' }}><span>ITEM COUNT</span><span>{r.quotes.length}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#1A1A1A' }}><span>TOTAL</span><span>{r.quotes.length}개의 문장</span></div>
            <Divider />
            <div style={{ fontSize: 11, lineHeight: 2.2, color: '#1A1A1A' }}>
              <div>CARD #: {cardNum}</div>
              <div>AUTH CODE: {authCode}</div>
              <div>CARDHOLDER: {r.nickname} ☆</div>
            </div>
            <Divider />
            <Barcode seed={r.id} />
            <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.2em', color: '#ccc', marginTop: 8 }}>THANK YOU FOR READING!</div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={saveAsImage} style={btnOutline}>이미지로 저장하기 ↓</button>
            <button onClick={() => setView('detail')} style={btnOutline}>서재로 돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
