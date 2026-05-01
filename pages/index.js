import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const FONT_PAIRS = [
  { f: "'Playfair Display', Georgia, serif", fw: '700' },
  { f: "'Space Mono', 'Courier New', monospace", fw: '700' },
  { f: "'Bebas Neue', Arial, sans-serif", fw: '400' },
  { f: "'DM Serif Display', Georgia, serif", fw: '400' },
  { f: "'Pretendard', sans-serif", fw: '800' },
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
  font: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'Courier New', Courier, monospace",
  receipt: "'NeoDGM', 'Fixedsys', 'Courier New', monospace",
}

const BOOKS_PER_ROW = 6
const SPINE_H = 150
const SHELF_ROWS = 3

function getSpineWidth(pages) {
  const MIN_W = 36, MAX_W = 60, MIN_P = 100, MAX_P = 700
  const c = Math.max(MIN_P, Math.min(MAX_P, pages || 250))
  return Math.round(MIN_W + ((c - MIN_P) / (MAX_P - MIN_P)) * (MAX_W - MIN_W))
}

function BookSpine({ b, onClick }) {
  const w = getSpineWidth(b.pages)
  const fp = FONT_PAIRS[b.fp % FONT_PAIRS.length]
  const tc = b.spineText || '#1A1A1A'

  return (
    <div
      onClick={onClick}
      style={{
        width: w,
        height: SPINE_H,
        background: b.bg,
        borderRight: '2px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)'
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.14)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: 7, color: tc, opacity: 0.6, fontFamily: C.font, padding: '8px 4px 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textAlign: 'center', flexShrink: 0 }}>
        {b.author}
      </div>

      <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '4px 2px' }}>
        <div style={{
          maxHeight: '100%',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: b.title.length > 10 ? 10 : 12,
          fontWeight: fp.fw,
          color: tc,
          fontFamily: fp.f,
          lineHeight: 1.1,
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'horizontal',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          wordBreak: 'break-all'
        }}>
          {b.title}
        </div>
      </div>
    </div>
  )
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
    <svg viewBox={`0 0 ${x} 34`} style={{ width: '100%', maxWidth: 200, height: 34, display: 'block', margin: '0 auto' }}>
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={34} fill="#1A1A1A" />)}
    </svg>
  )
}

function NavBar({ onBack, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `0.5px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: C.font }} onClick={onBack}>← 뒤로</span>
      <span style={{ fontSize: 11, letterSpacing: '0.15em', color: C.text, textTransform: 'uppercase', fontFamily: C.mono }}>{title}</span>
      <span style={{ fontSize: 11, color: C.muted, minWidth: 40, textAlign: 'right', fontFamily: C.font }}>{right}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: `1px dashed ${C.border}`, margin: '12px 0' }} />
}

function BookShelf({ books, onBookClick, onAddClick }) {
  const rows = []
  for (let i = 0; i < SHELF_ROWS; i++) {
    rows.push(books.slice(i * BOOKS_PER_ROW, (i + 1) * BOOKS_PER_ROW))
  }
  const extra = books.slice(SHELF_ROWS * BOOKS_PER_ROW)

  return (
    <div style={{ background: C.bgShelf }}>
      {rows.map((row, ri) => {
        const isLast = ri === SHELF_ROWS - 1
        const rowBooks = isLast ? [...row, ...extra] : row
        return (
          <div key={ri} style={{ borderBottom: isLast ? 'none' : `1px solid rgba(0,0,0,0.07)` }}>
            <div style={{ display: 'flex', gap: 2, overflowX: 'auto', padding: '20px 16px 16px', alignItems: 'flex-end', height: SPINE_H + 40, scrollbarWidth: 'none' }}>
              {rowBooks.map((b) => (
                <BookSpine key={b.id} b={b} onClick={() => onBookClick(b)} />
              ))}
              {isLast && (
                <div onClick={onAddClick} style={{ width: 32, height: SPINE_H, border: `1px dashed ${C.borderMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: C.muted, fontSize: 18, alignSelf: 'flex-end' }}>+</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const [view, setView] = useState('library')
  const [books, setBooks] = useState([])
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showGuestNotice, setShowGuestNotice] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [nickname, setNickname] = useState('')
  const [quotes, setQuotes] = useState([{ text: '', page: '' }])
  const receiptRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadBooks(session.user.id) }
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); setIsGuest(false); loadBooks(session.user.id) }
      else { setUser(null); setBooks([]); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadBooks = async (uid) => {
    setLoading(true)
    const { data } = await supabase.from('books').select('*').eq('user_id', uid).order('created_at', { ascending: true })
    if (data) setBooks(data.map(b => ({
      id: b.id, title: b.title, author: b.author, publisher: b.publisher,
      thumbnail: b.thumbnail, readDate: b.read_date, pages: b.pages,
      h: b.h, bg: b.bg, spineText: b.spine_text, fp: b.fp, receipts: b.receipts || [],
    })))
    setLoading(false)
  }

  const saveBooks = async (updated) => {
    setBooks(updated)
    if (isGuest) {
      localStorage.setItem('stocked_books', JSON.stringify(updated))
    } else {
      for (const b of updated) {
        await supabase.from('books').upsert({
          id: b.id, user_id: user.id, title: b.title, author: b.author,
          publisher: b.publisher, thumbnail: b.thumbnail, read_date: b.readDate,
          pages: b.pages, h: b.h, bg: b.bg, spine_text: b.spineText,
          fp: b.fp, receipts: b.receipts,
        })
      }
    }
  }

  const deleteBook = async (bookId) => {
    if (!window.confirm('이 책을 서재에서 삭제할까요?')) return
    const updated = books.filter((b) => b.id !== bookId)
    if (isGuest) {
      setBooks(updated)
      localStorage.setItem('stocked_books', JSON.stringify(updated))
    } else {
      await supabase.from('books').delete().eq('id', bookId)
      setBooks(updated)
    }
    setView('library')
  }

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  const enterAsGuest = () => {
    setIsGuest(true)
    const saved = localStorage.getItem('stocked_books')
    if (saved) setBooks(JSON.parse(saved))
    setLoading(false)
  }

  const logout = async () => { await supabase.auth.signOut(); setIsGuest(false) }

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
      pages: 250, h: SPINE_H,
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
    setSelectedBook(updated.find((b) => b.id === selectedBook.id))
    setSelectedReceipt(newReceipt)
    setView('receipt')
  }

  const saveAsImage = async () => {
    if (!receiptRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `stocked_${selectedBook.title}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch { alert('이미지 저장 중 오류가 발생했습니다') }
  }

  const inputStyle = { width: '100%', padding: '11px 12px', fontSize: 15, border: `0.5px solid ${C.borderMid}`, background: 'transparent', color: C.text, fontFamily: C.font, outline: 'none', borderRadius: 0 }
  const btnOutline = { width: '100%', padding: '14px 12px', fontSize: 13, cursor: 'pointer', border: `0.5px solid ${C.borderMid}`, background: 'transparent', color: C.text, fontFamily: C.font }
  const btnSolid = { width: '100%', padding: '14px 12px', fontSize: 13, cursor: 'pointer', border: 'none', background: C.text, color: C.bg, fontFamily: C.font }

  if (!user && !isGuest && !loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <img src="/logo.png" alt="STOCKED" style={{ height: 40, marginBottom: 16 }} />
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 56, fontFamily: C.font }}>나의 책장과 명대사 영수증</div>
        <button onClick={loginWithGoogle} style={{ ...btnOutline, marginBottom: 10 }}>Google로 로그인</button>
        <button onClick={enterAsGuest} style={btnSolid}>로그인 없이 이용하기</button>
      </div>
    )
  }

  if (loading) return <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontFamily: C.mono }}>LOADING...</div>

  if (view === 'library') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <div style={{ padding: '20px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo.png" alt="STOCKED" style={{ height: 28 }} />
          {isGuest ? <button onClick={loginWithGoogle} style={{ fontSize: 11, padding: '5px 10px', border: `0.5px solid ${C.borderMid}`, background: 'none', cursor: 'pointer' }}>로그인</button> : <button onClick={logout} style={{ fontSize: 11, color: C.faint, border: 'none', background: 'none', cursor: 'pointer' }}>로그아웃</button>}
        </div>

        {isGuest && showGuestNotice && (
          <div style={{ padding: '10px 40px 10px 20px', background: '#FCE6B7', borderBottom: `0.5px solid ${C.border}`, position: 'relative' }}>
            <div style={{ fontSize: 12, color: '#6B4A10', textAlign: 'center' }}>현재 기기에만 저장돼요 · <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={loginWithGoogle}>로그인하면 어디서든 볼 수 있어요</span></div>
            <button onClick={() => setShowGuestNotice(false)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', fontSize: 18, color: '#6B4A10', cursor: 'pointer' }}>×</button>
          </div>
        )}

        <BookShelf books={books} onBookClick={(b) => { setSelectedBook(b); setView('detail') }} onAddClick={() => setView('search')} />
        <div style={{ textAlign: 'center', padding: '24px 20px', fontSize: 13, color: C.muted, fontFamily: C.mono }}>© kimsogenie · v.0.99.1</div>
      </div>
    )
  }

  if (view === 'search') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('library')} title="책 추가" right="" />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="책 제목 또는 저자..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleSearch} style={{ ...btnSolid, width: 'auto' }}>{searching ? '...' : '검색'}</button>
          </div>
          {searchResults.map((book, i) => (
            <div key={i} onClick={() => addBook(book)} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer' }}>
              <img src={book.thumbnail || ''} alt="" style={{ width: 48, height: 66, background: '#eee' }} />
              <div>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>{book.title}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{book.authors?.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'detail' && selectedBook) {
    const b = selectedBook
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('library')} title="BOOK" right={`영수증 ${b.receipts.length}`} />
        <div style={{ display: 'flex', gap: 16, padding: 20, borderBottom: `0.5px solid ${C.border}` }}>
          <img src={b.thumbnail} alt="" style={{ width: 68, height: 94, boxShadow: '2px 2px 8px rgba(0,0,0,0.1)' }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{b.title}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{b.author}</div>
            <div style={{ fontSize: 10, color: C.faint, marginTop: 12 }}>READ · {b.readDate}</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <button onClick={() => setView('form')} style={{ ...btnSolid, marginBottom: 8 }}>영수증 발급하기 →</button>
          <button onClick={() => deleteBook(b.id)} style={{ ...btnOutline, color: 'red', borderColor: '#fcc' }}>서재에서 삭제</button>
        </div>
        <div style={{ padding: 20 }}>
          {b.receipts.map((r, i) => (
            <div key={r.id} onClick={() => { setSelectedReceipt(r); setView('receipt') }} style={{ padding: '12px 0', borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
              <div>#{String(i + 1).padStart(4, '0')} · {r.nickname}</div>
              <span>→</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'form' && selectedBook) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('detail')} title="영수증 발급" right="" />
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>CARDHOLDER</div>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임 입력" style={inputStyle} />
          </div>
          {quotes.map((q, i) => (
            <div key={i} style={{ background: '#EDE9E2', padding: 14, marginBottom: 10 }}>
              <textarea value={q.text} onChange={(e) => { const u = [...quotes]; u[i].text = e.target.value; setQuotes(u) }} placeholder="명대사를 입력하세요" style={{ ...inputStyle, height: 80, resize: 'none', marginBottom: 8 }} />
              <input value={q.page} onChange={(e) => { const u = [...quotes]; u[i].page = e.target.value; setQuotes(u) }} placeholder="페이지" style={inputStyle} />
            </div>
          ))}
          <button onClick={() => setQuotes([...quotes, { text: '', page: '' }])} style={{ ...btnOutline, marginBottom: 10 }}>+ 문장 추가</button>
          <button onClick={generateReceipt} style={btnSolid}>생성하기</button>
        </div>
      </div>
    )
  }

  if (view === 'receipt' && selectedBook && selectedReceipt) {
    const b = selectedBook, r = selectedReceipt
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('detail')} title="RECEIPT" right="" />
        <div style={{ padding: 20 }}>
          <div ref={receiptRef} style={{ background: '#fff', padding: 24, border: `0.5px solid ${C.border}`, fontFamily: C.receipt }}>
            <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}>{b.title}</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginBottom: 20 }}>{r.date} · {r.nickname}</div>
            <Divider />
            {r.quotes.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: '#ccc' }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{q.text}</span>
                <span style={{ color: '#ccc' }}>p.{q.page}</span>
              </div>
            ))}
            <Divider />
            <Barcode seed={r.id} />
          </div>
          <button onClick={saveAsImage} style={{ ...btnOutline, marginTop: 20 }}>이미지로 저장 ↓</button>
        </div>
      </div>
    )
  }

  return null
}
