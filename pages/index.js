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

function getSpineTitle(title) {
  const MAX = 8
  if (!title) return ''
  return title.length > MAX ? title.slice(0, MAX) + '…' : title
}

// [핵심 수정 1] 제목이 넘치지 않도록 코드 단에서 강제 컷팅 (안전장치)
function BookSpine({ b, onClick }) {
  const w = getSpineWidth(b.pages)
  const fp = FONT_PAIRS[b.fp % FONT_PAIRS.length]
  const tc = b.spineText || '#1A1A1A'

  return (
    <div
      onClick={onClick}
      style={{
        width: w,
        height: 150,
        background: b.bg,
        borderRight: '2px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        padding: '6px 3px',
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
      <div style={{
        fontSize: 7,
        color: tc,
        opacity: 0.55,
        fontFamily: C.font,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        textAlign: 'center',
      }}>
        {b.author}
      </div>
      <div style={{
        fontSize: 9,
        fontWeight: fp.fw,
        color: tc,
        fontFamily: fp.f,
        wordBreak: 'break-all',
        overflow: 'hidden',
        textAlign: 'center',
        lineHeight: '12px',
        height: '60px',
        maxHeight: '60px',
        display: '-webkit-box',
        WebkitLineClamp: 5,
        WebkitBoxOrient: 'vertical',
      }}>
        {getSpineTitle(b.title)}
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
            <div style={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '20px 16px 16px',
              alignItems: 'flex-end',
              height: SPINE_H + 40,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}>
              {rowBooks.map((b) => (
                <BookSpine key={b.id} b={b} onClick={() => onBookClick(b)} />
              ))}
              {isLast && (
                <div
                  onClick={onAddClick}
                  style={{
                    width: 32, height: SPINE_H,
                    border: `1px dashed ${C.borderMid}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                    color: C.muted, fontSize: 18,
                    alignSelf: 'flex-end',
                  }}
                >+</div>
              )}
            </div>
          </div>
        )
      })}
      <div style={{ fontSize: 8, letterSpacing: '0.12em', color: C.faint, textAlign: 'center', paddingBottom: 12, fontFamily: C.mono }}>
        — 스크롤 —
      </div>
    </div>
  )
}

const ONBOARDING_STEPS = [
  { emoji: '📚', title: '책 추가하기', desc: '+ 버튼을 눌러 읽은 책을 검색하고 내 서재에 꽂아보세요.' },
  { emoji: '🧾', title: '명대사 영수증', desc: '책을 클릭하면 영수증 발급 버튼이 나와요. 기억하고 싶은 문장을 골라 나만의 영수증을 만들어보세요.' },
  { emoji: '💾', title: '이미지로 저장', desc: '완성된 영수증은 이미지로 저장해서 SNS에 공유할 수 있어요.' },
  { emoji: '☁️', title: '어디서든 내 서재', desc: '구글 로그인하면 모든 기기에서 내 서재와 영수증을 볼 수 있어요.' },
]

function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0)
  const current = ONBOARDING_STEPS[step]
  const isLast = step === ONBOARDING_STEPS.length - 1
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: 480, background: C.bg, borderRadius: '16px 16px 0 0', padding: '32px 28px 40px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? C.text : C.border, transition: 'width 0.2s' }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>{current.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12, fontFamily: C.font }}>{current.title}</div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, fontFamily: C.font }}>{current.desc}</div>
        </div>
        <button onClick={() => isLast ? onClose() : setStep(step + 1)} style={{ width: '100%', padding: 15, fontSize: 14, fontWeight: 600, border: 'none', background: C.text, color: C.bg, fontFamily: C.font, cursor: 'pointer', borderRadius: 2 }}>
          {isLast ? '시작하기 →' : '다음'}
        </button>
        {!isLast && (
          <button onClick={onClose} style={{ width: '100%', padding: 12, fontSize: 13, border: 'none', background: 'transparent', color: C.faint, fontFamily: C.font, cursor: 'pointer', marginTop: 8 }}>건너뛰기</button>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [view, setView] = useState('library')
  const [books, setBooks] = useState([])
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
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
      if (session?.user) { setUser(session.user); loadBooks(session.user.id); checkOnboarding() }
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); setIsGuest(false); loadBooks(session.user.id); checkOnboarding() }
      else { setUser(null); setBooks([]); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkOnboarding = () => {
    if (!localStorage.getItem('stocked_onboarding_seen')) setShowOnboarding(true)
  }

  const handleOnboardingClose = () => {
    localStorage.setItem('stocked_onboarding_seen', '1')
    setShowOnboarding(false)
  }

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
    checkOnboarding()
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
      link.download = `stocked_${selectedBook.title}_${selectedReceipt.date}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch { alert('이미지 저장 중 오류가 발생했습니다') }
  }

  const inputStyle = {
    width: '100%', padding: '11px 12px', fontSize: 15,
    border: `0.5px solid ${C.borderMid}`, background: 'transparent', color: C.text,
    fontFamily: C.font, outline: 'none', WebkitAppearance: 'none', borderRadius: 0,
  }

  const btnOutline = {
    width: '100%', padding: '14px 12px', fontSize: 13, cursor: 'pointer',
    border: `0.5px solid ${C.borderMid}`, background: 'transparent', color: C.text, fontFamily: C.font,
  }

  const btnSolid = {
    width: '100%', padding: '14px 12px', fontSize: 13, cursor: 'pointer',
    border: 'none', background: C.text, color: C.bg, fontFamily: C.font,
  }

  if (!user && !isGuest && !loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
          <img src="/logo.png" alt="STOCKED" style={{ height: 40, marginBottom: 16, objectFit: 'contain' }} />
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 56, fontFamily: C.font, letterSpacing: '0.05em' }}>나의 책장과 명대사 영수증</div>
          <div style={{ width: '100%', marginBottom: 10 }}>
            <button onClick={loginWithGoogle} style={{ ...btnOutline, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              Google로 로그인
            </button>
          </div>
          <div style={{ width: '100%', marginBottom: 32 }}>
            <button onClick={enterAsGuest} style={btnSolid}>로그인 없이 이용하기</button>
          </div>
          <div style={{ fontSize: 12, color: C.faint, textAlign: 'center', fontFamily: C.font, lineHeight: 1.9 }}>
            로그인하면 어느 기기에서든<br />내 서재를 계속 볼 수 있어요
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', fontFamily: C.mono }}>LOADING...</div>
      </div>
    )
  }

  if (view === 'library') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
        <div style={{ padding: '20px 20px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo.png" alt="STOCKED" style={{ height: 28, objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isGuest && <button onClick={loginWithGoogle} style={{ fontSize: 11, color: C.text, background: 'none', border: `0.5px solid ${C.borderMid}`, cursor: 'pointer', fontFamily: C.font, padding: '5px 10px' }}>로그인</button>}
            {!isGuest && <button onClick={logout} style={{ fontSize: 11, color: C.faint, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.font }}>로그아웃</button>}
            <button onClick={() => setShowOnboarding(true)} style={{ fontSize: 16, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>?</button>
          </div>
        </div>

        {isGuest && showGuestNotice && (
          <div style={{ padding: '10px 44px 10px 20px', background: '#FCE6B7', borderBottom: `0.5px solid ${C.border}`, position: 'relative' }}>
            <div style={{ fontSize: 12, color: '#6B4A10', fontFamily: C.font, textAlign: 'center' }}>
              현재 기기에만 저장돼요 · <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={loginWithGoogle}>로그인하면 어디서든 볼 수 있어요</span>
            </div>
            <button
              onClick={() => setShowGuestNotice(false)}
              aria-label="안내 닫기"
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                color: '#6B4A10',
                fontSize: 16,
                lineHeight: 1,
                cursor: 'pointer',
                fontFamily: C.font,
              }}
            >
              ×
            </button>
          </div>
        )}

        <BookShelf
          books={books}
          onBookClick={(b) => { setSelectedBook(b); setView('detail') }}
          onAddClick={() => setView('search')}
        />

        {books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 14, lineHeight: 2, fontFamily: C.font }}>
            <div>아직 책이 없어요</div>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>+ 를 눌러 첫 번째 책을 추가해보세요</div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 20px', fontSize: 13, color: C.muted, fontFamily: C.mono, letterSpacing: '0.08em' }}>
          © kimsogenie · v.0.99.4
        </div>
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
            <button onClick={handleSearch} style={{ ...btnSolid, width: 'auto', padding: '0 18px' }}>{searching ? '...' : '검색'}</button>
          </div>
          {searchResults.map((book, i) => (
            <div key={i} onClick={() => addBook(book)} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer' }}>
              {book.thumbnail ? <img src={book.thumbnail} alt={book.title} style={{ width: 48, height: 66, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 48, height: 66, background: '#E8E4DC', flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 5, lineHeight: 1.4, fontFamily: C.font }}>{book.title}</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font }}>{book.authors?.join(', ')} · {book.publisher}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'detail' && selectedBook) {
    const b = selectedBook
    const rc = b.receipts.length
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('library')} title="BOOK" right={`영수증 ${rc}`} />
        <div style={{ display: 'flex', gap: 16, padding: 20, borderBottom: `0.5px solid ${C.border}` }}>
          {b.thumbnail ? <img src={b.thumbnail} alt={b.title} style={{ width: 68, height: 94, objectFit: 'cover', flexShrink: 0, boxShadow: '2px 2px 8px rgba(0,0,0,0.12)' }} /> : <div style={{ width: 68, height: 94, background: b.bg, borderRight: '3px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 6, lineHeight: 1.4, fontFamily: C.font }}>{b.title}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 2, fontFamily: C.font }}>{b.author}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, fontFamily: C.font }}>{b.publisher}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: C.faint, fontFamily: C.mono }}>READ · {b.readDate}</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <button onClick={() => { setNickname(''); setQuotes([{ text: '', page: '' }]); setView('form') }} style={{ ...btnSolid, marginBottom: 8 }}>영수증 발급하기 →</button>
          <button onClick={() => deleteBook(b.id)} style={{ ...btnOutline, fontSize: 12, color: 'rgba(180,50,50,0.7)', borderColor: 'rgba(180,50,50,0.25)' }}>서재에서 삭제</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 14, fontFamily: C.mono }}>발급된 영수증</div>
          {rc === 0 ? <div style={{ fontSize: 14, color: C.muted, textAlign: 'center', padding: '20px 0', fontFamily: C.font }}>아직 없어요</div>
            : b.receipts.map((r, i) => (
              <div key={r.id} onClick={() => { setSelectedReceipt(r); setView('receipt') }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 3, fontFamily: C.font }}>ORDER #{String(i + 1).padStart(4, '0')} · {r.nickname}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font }}>{r.date} · {r.quotes.length}개의 문장</div>
                </div>
                <span style={{ fontSize: 14, color: C.muted }}>→</span>
              </div>
            ))
          }
        </div>
      </div>
    )
  }

  if (view === 'form' && selectedBook) {
    const b = selectedBook
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('detail')} title="영수증 발급" right="" />
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 6, fontFamily: C.mono }}>BOOK</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: C.font }}>{b.title}</div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 8, fontFamily: C.mono }}>CARDHOLDER</div>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임 입력" style={inputStyle} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', fontFamily: C.mono }}>명대사</div>
            <div style={{ fontSize: 12, color: C.faint, fontFamily: C.font }}>{quotes.filter((q) => q.text).length}개 입력됨</div>
          </div>
          {quotes.map((q, i) => (
            <div key={i} style={{ background: '#EDE9E2', padding: 14, borderRadius: 4, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: C.mono }}>#{String(i + 1).padStart(2, '0')}</span>
                {quotes.length > 1 && <span style={{ fontSize: 13, cursor: 'pointer', color: C.muted, fontFamily: C.font }} onClick={() => setQuotes(quotes.filter((_, idx) => idx !== i))}>삭제</span>}
              </div>
              <textarea value={q.text} onChange={(e) => { const u = [...quotes]; u[i].text = e.target.value; setQuotes(u) }} placeholder="명대사를 입력하세요" style={{ ...inputStyle, height: 72, resize: 'none', marginBottom: 8 }} />
              <input value={q.page} onChange={(e) => { const u = [...quotes]; u[i].page = e.target.value; setQuotes(u) }} placeholder="페이지 번호 (예: 42)" style={inputStyle} />
            </div>
          ))}
          <button onClick={() => setQuotes([...quotes, { text: '', page: '' }])} style={{ ...btnOutline, marginBottom: 10 }}>+ 명대사 추가</button>
          <button onClick={generateReceipt} style={btnSolid}>영수증 생성하기 →</button>
        </div>
      </div>
    )
  }

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
          <div ref={receiptRef} style={{ background: '#fff', border: `0.5px solid ${C.border}`, borderRadius: 3, padding: '24px 18px', fontFamily: C.receipt }}>
            <div style={{ textAlign: 'center', fontSize: 15, letterSpacing: '0.3em', color: '#bbb', marginBottom: 14 }}>° ✦ ☆ ✦ °</div>
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{b.title}</div>
            <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', color: '#999', marginBottom: 13 }}>{b.author} · {b.publisher}</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#1A1A1A', marginBottom: 3 }}>ORDER {orderNum} FOR {r.nickname} ☆</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#aaa' }}>{r.date}</div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.08em', color: '#aaa', marginBottom: 10 }}>
              <span>NO</span><span style={{ flex: 1, textAlign: 'left', paddingLeft: 8 }}>SENTENCE</span><span>PAGE</span>
            </div>
            {r.quotes.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.7, color: '#1A1A1A' }}>
                <span style={{ minWidth: 22, color: '#aaa', fontSize: 11, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1 }}>{q.text}</span>
                <span style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>p.{q.page || '—'}</span>
              </div>
            ))}
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, lineHeight: 2.2, color: '#1A1A1A' }}><span>ITEM COUNT</span><span>{r.quotes.length}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}><span>TOTAL</span><span>{r.quotes.length}개의 문장</span></div>
            <Divider />
            <div style={{ fontSize: 12, lineHeight: 2.3, color: '#1A1A1A' }}>
              <div>CARD #: {cardNum}</div>
              <div>AUTH CODE: {authCode}</div>
              <div>CARDHOLDER: {r.nickname} ☆</div>
            </div>
            <Divider />
            <Barcode seed={r.id} />
            <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.18em', color: '#ccc', marginTop: 10 }}>THANK YOU FOR READING!</div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={saveAsImage} style={btnOutline}>이미지로 저장하기 ↓</button>
            <button onClick={() => setView('detail')} style={btnOutline}>서재로 돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
