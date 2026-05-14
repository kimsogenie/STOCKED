import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
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
function getSpineHeight(bookId) {
  const heights = [120, 140, 155, 130, 165, 145, 135, 170, 125, 150]
  return heights[bookId % 10]
}

function getSpineTilt(bookId) {
  const tilts = [0, 1.5, -1, 0, 2, -1.5, 0.5, -2, 1, 0]
  return tilts[bookId % 10]
}

function BookSpine({ b, onClick }) {
  const w = getSpineWidth(b.pages)
  const h = getSpineHeight(b.id)
  const tilt = getSpineTilt(b.id)
  const fp = FONT_PAIRS[b.fp % FONT_PAIRS.length]
  const tc = b.spineText || '#1A1A1A'

  return (
    <div
      onClick={onClick}
      style={{
        width: w,
        height: h,
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
        transform: `rotate(${tilt}deg)`,
        transformOrigin: 'bottom center',
        alignSelf: 'flex-end',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `rotate(${tilt}deg) translateY(-10px)`
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.16)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${tilt}deg)`
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

function ManualBookForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) return alert('제목을 입력해주세요')
    onAdd({ title: title.trim(), authors: author ? [author.trim()] : [], publisher: publisher.trim(), isbn: '', thumbnail: '' })
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ background: 'none', border: `0.5px dashed rgba(0,0,0,0.2)`, width: '100%', padding: '12px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: C.font }}>
      + 직접 입력하기
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="책 제목 *" style={{ width: '100%', padding: '11px 12px', fontSize: 14, border: `0.5px solid rgba(0,0,0,0.2)`, background: 'transparent', fontFamily: C.font, outline: 'none', boxSizing: 'border-box' }} />
      <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="저자 (선택)" style={{ width: '100%', padding: '11px 12px', fontSize: 14, border: `0.5px solid rgba(0,0,0,0.2)`, background: 'transparent', fontFamily: C.font, outline: 'none', boxSizing: 'border-box' }} />
      <input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="출판사 (선택)" style={{ width: '100%', padding: '11px 12px', fontSize: 14, border: `0.5px solid rgba(0,0,0,0.2)`, background: 'transparent', fontFamily: C.font, outline: 'none', boxSizing: 'border-box' }} />
      <button onClick={handleSubmit} style={{ width: '100%', padding: '13px', fontSize: 13, border: 'none', background: C.text, color: C.bg, cursor: 'pointer', fontFamily: C.font }}>
        서재에 추가하기
      </button>
    </div>
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


function BookShelf({ books, onBookClick, onAddClick, sortBy, setSortBy }) {
  const sortOptions = [
    { value: 'default', label: '추가순' },
    { value: 'year', label: '연도별' },
    { value: 'month', label: '월별' },
  ]

  const grouped = (() => {
    if (sortBy === 'default') return [{ label: null, books }]
    const map = {}
    books.forEach(b => {
      const date = b.readDate || ''
      const key = sortBy === 'year' ? date.slice(0, 4) : date.slice(0, 7)
      if (!map[key]) map[key] = []
      map[key].push(b)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([k, v]) => ({ label: k, books: v }))
  })()

  return (
    <div style={{ background: C.bgShelf }}>
      {/* 정렬 탭 */}
      <div style={{ display: 'flex', gap: 0, padding: '10px 16px 0', borderBottom: `0.5px solid ${C.border}` }}>
        {sortOptions.map(o => (
          <button key={o.value} onClick={() => setSortBy(o.value)} style={{
            background: 'none', border: 'none', borderBottom: sortBy === o.value ? `2px solid ${C.text}` : '2px solid transparent',
            padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: C.mono,
            color: sortBy === o.value ? C.text : C.muted, letterSpacing: '0.05em',
          }}>{o.label}</button>
        ))}
      </div>

      {grouped.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div style={{ padding: '14px 16px 6px', fontSize: 10, letterSpacing: '0.12em', color: C.muted, fontFamily: C.mono }}>
              {group.label}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', minHeight: 120, padding: '16px 16px 12px' }}>
            {group.books.map((b) => (
              <BookSpine key={b.id} b={b} onClick={() => onBookClick(b)} />
            ))}
            {gi === grouped.length - 1 && (
              <div onClick={onAddClick} style={{
                width: 32, height: 130,
                border: `1px dashed ${C.borderMid}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                color: C.muted, fontSize: 18,
                alignSelf: 'flex-end',
              }}>+</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}


const ONBOARDING_STEPS = [
  { emoji: '📚', title: '책 추가하기', desc: '+ 버튼을 눌러 읽은 책을 검색하고 내 서재에 꽂아보세요.' },
  { emoji: '✏️', title: '날짜·페이지 수 수정', desc: '책을 클릭하면 읽은 날짜와 페이지 수를 직접 수정할 수 있어요. 페이지 수는 spine 두께에 바로 반영돼요.' },
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
  const [receiptBg, setReceiptBg] = useState('#ffffff')
  const [receiptText, setReceiptText] = useState('#1A1A1A')
  const [receiptDeco, setReceiptDeco] = useState('default')

  const RECEIPT_DECOS = [
    { value: 'default',  label: '✦☆✦',  display: '° ✦ ☆ ✦ °' },
    { value: 'dot',      label: '·✦·',   display: '✦ · · · ✦' },
    { value: 'music',    label: '♩♫♩',   display: '♩ ♪ ♫ ♪ ♩' },
    { value: 'flower',   label: '✿·✿',   display: '✿ · · · ✿' },
    { value: 'diamond',  label: '◇◆◇',   display: '◇ · ◆ · ◇' },
    { value: 'star',     label: '＊˚＊',  display: '＊ ˚ · ˚ ＊' },
    { value: 'wave',     label: '～·～',  display: '～ · · · ～' },
    { value: 'cross',    label: '†✦†',   display: '† · ✦ · †' },
    { value: 'arc',      label: '⌒·⌒',   display: '⌒ · · · ⌒' },
    { value: 'ref',      label: '※·※',   display: '※ · · · ※' },
    { value: 'dots',     label: '∴·∴',   display: '∴ · · · ∴' },
    { value: 'quote',    label: '❝·❞',   display: '❝ · · · ❞' },
  ]

  const RECEIPT_THEMES = [
    { name: '클래식', bg: '#ffffff', text: '#1A1A1A' },
    { name: '크림', bg: '#FDF8F0', text: '#3D2B1F' },
    { name: '다크', bg: '#1C1C1E', text: '#F5F5F0' },
    { name: '민트', bg: '#E8F5F2', text: '#1A3D35' },
    { name: '로즈', bg: '#FDF0F0', text: '#5C1A1A' },
    { name: '인디고', bg: '#EEF0F8', text: '#1A1E5C' },
    { name: '세이지', bg: '#EFF3EC', text: '#1E3320' },
    { name: '샌드', bg: '#F5EFE6', text: '#3D2E1A' },
  ]
  const [isAddingBook, setIsAddingBook] = useState(false)
  const [imgPreview, setImgPreview] = useState(null)
  const [errorModal, setErrorModal] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [errorSending, setErrorSending] = useState(false)
  const [notes, setNotes] = useState([])
  const [showNotes, setShowNotes] = useState(false)
  const [noteModal, setNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteNick, setNoteNick] = useState('')
  const [noteSending, setNoteSending] = useState(false)
  const [sortBy, setSortBy] = useState('default') // default | year | month
  const [quotes, setQuotes] = useState([{ text: '', page: '' }])
  const [editingField, setEditingField] = useState(null)
  const receiptRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadBooks(session.user.id); checkOnboarding() }
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const isNew = !user
        setUser(session.user); setIsGuest(false); loadBooks(session.user.id); checkOnboarding()
        if (isNew && typeof gtag !== 'undefined') {
          gtag('event', _event === 'SIGNED_IN' ? 'login' : 'sign_up', { method: 'Google' })
        }
      }
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
      status: b.status || 'read', rating: b.rating || 0,
    })))
    setLoading(false)
  }

  const saveBooks = async (updated) => {
    setBooks(updated)
    if (isGuest) {
      localStorage.setItem('stocked_books', JSON.stringify(updated))
    }
  }

  const insertBook = async (newBook) => {
    if (!isGuest) {
      await supabase.from('books').insert({
        id: newBook.id, user_id: user.id, title: newBook.title, author: newBook.author,
        publisher: newBook.publisher, thumbnail: newBook.thumbnail, read_date: newBook.readDate,
        pages: newBook.pages, h: newBook.h, bg: newBook.bg, spine_text: newBook.spineText,
        fp: newBook.fp, receipts: newBook.receipts, status: newBook.status || 'read', rating: 0,
      })
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
    if (typeof gtag !== 'undefined') gtag('event', 'guest_mode')
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
    if (isAddingBook) return
    setIsAddingBook(true)
    try {
    // 1. 페이지 수: Google Books ISBN → title fallback
    let pages = 250
    const isbn = (kakaoBook.isbn || '').split(' ').find(s => s.length >= 10)
    try {
      if (isbn) {
        const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`)
        const d = await r.json()
        const p = d.items?.[0]?.volumeInfo?.pageCount
        if (p > 0) pages = p
      }
      if (pages === 250 && kakaoBook.title) {
        const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(kakaoBook.title)}&maxResults=1`)
        const d = await r.json()
        const p = d.items?.[0]?.volumeInfo?.pageCount
        if (p > 0) pages = p
      }
    } catch {}

    // 2. 표지 컬러 추출 → 타이틀 해시 기반 고유 파스텔 컬러
    const colorSet = (() => {
      const str = (kakaoBook.title || '') + (kakaoBook.authors?.[0] || '')
      let hash = 0
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
      const h = Math.abs(hash) % 360
      const s = 30 + (Math.abs(hash >> 8) % 20)
      const l = 78 + (Math.abs(hash >> 16) % 10)
      const hslToRgb = (h, s, l) => {
        s /= 100; l /= 100
        const k = n => (n + h / 30) % 12
        const a = s * Math.min(l, 1 - l)
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
        return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)]
      }
      const [r, g, b] = hslToRgb(h, s, l)
      const tl = 22 + (Math.abs(hash >> 4) % 15)
      const [tr, tg, tb] = hslToRgb(h, 45, tl)
      return { bg: `rgb(${r},${g},${b})`, text: `rgb(${tr},${tg},${tb})` }
    })()

    const newBook = {
      id: Date.now(), title: kakaoBook.title, author: kakaoBook.authors?.join(', ') || '',
      publisher: kakaoBook.publisher || '', thumbnail: kakaoBook.thumbnail || '',
      isbn: isbn || '',
      readDate: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1),
      pages, h: SPINE_H,
      bg: colorSet.bg, spineText: colorSet.text,
      fp: books.length % FONT_PAIRS.length, receipts: [],
    }
    if (isGuest) {
      const updated = [...books, newBook]
      setBooks(updated)
      localStorage.setItem('stocked_books', JSON.stringify(updated))
    } else {
      await supabase.from('books').insert({
        id: newBook.id, user_id: user.id, title: newBook.title, author: newBook.author,
        publisher: newBook.publisher, thumbnail: newBook.thumbnail, read_date: newBook.readDate,
        pages: newBook.pages, h: newBook.h, bg: newBook.bg, spine_text: newBook.spineText,
        fp: newBook.fp, receipts: newBook.receipts,
      })
      await loadBooks(user.id)
    }
    setView('library')
    setSearchQuery('')
    setSearchResults([])
    if (typeof gtag !== 'undefined') gtag('event', 'add_book', { book_title: kakaoBook.title })
    } finally {
      setIsAddingBook(false)
    }
  }

  const generateReceipt = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요')
    localStorage.setItem('stocked_nickname', nickname.trim())
    const valid = quotes.filter((q) => q.text.trim())
    if (!valid.length) return alert('명대사를 하나 이상 입력해주세요')
    const d = new Date()
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    const newReceipt = { id: Date.now(), date: dateStr, nickname, quotes: valid, bg: receiptBg, textColor: receiptText, deco: receiptDeco }
    const updatedReceipts = [...selectedBook.receipts, newReceipt]
    const updated = books.map((b) => b.id === selectedBook.id ? { ...b, receipts: updatedReceipts } : b)
    setBooks(updated)
    if (!isGuest) {
      await supabase.from('books').update({ receipts: updatedReceipts }).eq('id', selectedBook.id)
    } else {
      localStorage.setItem('stocked_books', JSON.stringify(updated))
    }
    setSelectedBook(updated.find((b) => b.id === selectedBook.id))
    setSelectedReceipt(newReceipt)
    if (typeof gtag !== 'undefined') gtag('event', 'generate_receipt')
    setView('receipt')
  }

  const updateBook = async (bookId, field, value) => {
    const updated = books.map((b) => b.id === bookId ? { ...b, [field]: value } : b)
    setBooks(updated)
    const b = updated.find((x) => x.id === bookId)
    setSelectedBook(b)
    if (!isGuest) {
      const fieldMap = { readDate: 'read_date', pages: 'pages' }
      await supabase.from('books').update({ [fieldMap[field] || field]: value }).eq('id', bookId)
    } else {
      localStorage.setItem('stocked_books', JSON.stringify(updated))
    }
    setEditingField(null)
  }

  const deleteReceipt = async (receiptId) => {
    if (!window.confirm('이 영수증을 삭제할까요?')) return
    const updatedReceipts = selectedBook.receipts.filter((r) => r.id !== receiptId)
    const updated = books.map((b) => b.id === selectedBook.id ? { ...b, receipts: updatedReceipts } : b)
    setBooks(updated)
    if (!isGuest) {
      await supabase.from('books').update({ receipts: updatedReceipts }).eq('id', selectedBook.id)
    } else {
      localStorage.setItem('stocked_books', JSON.stringify(updated))
    }
    setSelectedBook(updated.find((b) => b.id === selectedBook.id))
  }

  const loadNotes = async (title) => {
    if (!title) return
    const { data, error } = await supabase.from('notes').select('*').eq('book_key', title).order('created_at', { ascending: false })
    if (!error && data) setNotes(data)
  }

  const submitNote = async () => {
    if (!noteText.trim()) return
    setNoteSending(true)
    const key = selectedBook?.title
    const nick = noteNick.trim() || '익명'
    const { error } = await supabase.from('notes').insert({
      book_key: key,
      book_title: selectedBook?.title,
      content: noteText.trim(),
      nickname: nick,
    })
    if (error) { alert('저장 실패: ' + error.message); setNoteSending(false); return }
    setNoteText('')
    setNoteNick('')
    setNoteModal(false)
    setNoteSending(false)
    await loadNotes(selectedBook?.title)
  }

  const addNoteReaction = async (noteId, emoji) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const reactions = note.reactions || {}
    reactions[emoji] = (reactions[emoji] || 0) + 1
    await supabase.from('notes').update({ reactions }).eq('id', noteId)
    setNotes(notes.map(n => n.id === noteId ? { ...n, reactions } : n))
  }

  const saveAsImage = async () => {
    if (!receiptRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const dataUrl = canvas.toDataURL('image/png')
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        setImgPreview(dataUrl)
      } else {
        const link = document.createElement('a')
        link.download = `stocked_${selectedBook.title}_${selectedReceipt.date}.png`
        link.href = dataUrl
        link.click()
      }
    } catch { alert('이미지 저장 중 오류가 발생했습니다') }
  }

  const inputStyle = {
    width: '100%', padding: '11px 12px', fontSize: 15,
    border: `0.5px solid ${C.borderMid}`, background: 'transparent', color: C.text,
    fontFamily: C.font, outline: 'none', WebkitAppearance: 'none', borderRadius: 0,
    boxSizing: 'border-box',
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
    // 미니 영수증 프리뷰 컴포넌트
    const PreviewReceipt = () => (
      <div style={{ background: '#fff', border: `0.5px solid rgba(0,0,0,0.1)`, borderRadius: 3, padding: '16px 14px', fontFamily: C.receipt, width: '100%', boxSizing: 'border-box', transform: 'rotate(-1.5deg)', boxShadow: '2px 4px 16px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.25em', color: '#ccc', marginBottom: 8 }}>° ✦ ☆ ✦ °</div>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>채식주의자</div>
        <div style={{ textAlign: 'center', fontSize: 9, color: '#aaa', marginBottom: 10, letterSpacing: '0.05em' }}>한강 · 창비</div>
        <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', margin: '8px 0' }} />
        <div style={{ fontSize: 10, color: '#1A1A1A', lineHeight: 1.7, marginBottom: 4 }}>
          <span style={{ color: '#aaa', marginRight: 6 }}>01</span>
          나는 아무도 해치고 싶지 않아요. 그게 다예요.
        </div>
        <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#1A1A1A' }}>
          <span>TOTAL</span><span>1개의 문장</span>
        </div>
        <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>CARDHOLDER: sow ☆</div>
      </div>
    )

    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '52px 32px 40px' }}>
          {/* 헤더 */}
          <div style={{ marginBottom: 36 }}>
            <img src="/logo.png" alt="STOCKED" style={{ height: 32, marginBottom: 12, objectFit: 'contain' }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: C.font, lineHeight: 1.35, marginBottom: 8 }}>
              읽은 책을 서재에 꽂고<br />명대사를 영수증으로
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: C.font, lineHeight: 1.7 }}>
              책 spine이 쌓이는 나만의 서재를 만들고,<br />기억하고 싶은 문장을 영수증으로 저장하세요.
            </div>
          </div>

          {/* 영수증 미리보기 */}
          <div style={{ marginBottom: 40, padding: '0 12px' }}>
            <PreviewReceipt />
          </div>

          {/* 버튼 */}
          <div style={{ width: '100%', marginBottom: 10 }}>
            <button onClick={loginWithGoogle} style={{ ...btnOutline, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              Google로 로그인
            </button>
          </div>
          <div style={{ width: '100%', marginBottom: 24 }}>
            <button onClick={enterAsGuest} style={btnSolid}>로그인 없이 이용하기</button>
          </div>
          <div style={{ fontSize: 11, color: C.faint, textAlign: 'center', fontFamily: C.font, lineHeight: 1.9 }}>
            로그인하면 어느 기기에서든 내 서재를 볼 수 있어요
          </div>
        </div>
      </div>
    )
  }

  const submitError = async () => {
    if (!errorText.trim()) return
    setErrorSending(true)
    try {
      await fetch('https://formspree.io/f/mojrwzjo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: errorText,
          user: user?.email || '게스트',
          page: view,
          ua: navigator.userAgent,
        }),
      })
      setErrorText('')
      setErrorModal(false)
      alert('신고가 접수됐어요. 감사합니다!')
    } catch {
      alert('전송 실패. 다시 시도해주세요.')
    } finally {
      setErrorSending(false)
    }
  }

  if (noteModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
        <div style={{ background: '#FFFDF5', width: '100%', maxWidth: 400, padding: 24, borderRadius: 2, boxShadow: '2px 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.font, marginBottom: 4 }}>익명 쪽지 남기기</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font, marginBottom: 16 }}>{selectedBook?.title}</div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="이 책을 읽고 느낀 점을 자유롭게 남겨주세요"
            rows={4}
            style={{ ...inputStyle, resize: 'none', display: 'block', marginBottom: 8, background: 'transparent' }}
          />
          <input
            value={noteNick}
            onChange={(e) => setNoteNick(e.target.value)}
            placeholder="닉네임 (비워두면 익명)"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setNoteModal(false); setNoteText(''); setNoteNick('') }} style={{ ...btnOutline, flex: 1 }}>취소</button>
            <button onClick={submitNote} disabled={noteSending} style={{ ...btnSolid, flex: 1, opacity: noteSending ? 0.6 : 1 }}>
              {noteSending ? '전송 중...' : '남기기 ✉'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (errorModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
        <div style={{ background: C.bg, width: '100%', maxWidth: 400, padding: 24, borderRadius: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.font, marginBottom: 6 }}>오류 신고</div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font, marginBottom: 16 }}>어떤 오류가 발생했는지 알려주세요. 빠르게 확인할게요.</div>
          <textarea
            value={errorText}
            onChange={(e) => setErrorText(e.target.value)}
            placeholder="예: 책 추가 후 목록에 두 권이 나와요"
            rows={5}
            style={{ ...inputStyle, resize: 'none', display: 'block', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setErrorModal(false); setErrorText('') }} style={{ ...btnOutline, flex: 1 }}>취소</button>
            <button onClick={submitError} disabled={errorSending} style={{ ...btnSolid, flex: 1, opacity: errorSending ? 0.6 : 1 }}>
              {errorSending ? '전송 중...' : '제출하기'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (imgPreview) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
        <div style={{ fontSize: 13, color: '#fff', marginBottom: 14, fontFamily: C.mono, letterSpacing: '0.05em', textAlign: 'center' }}>
          이미지를 <strong>길게 눌러</strong> 사진 앱에 저장하세요
        </div>
        <img src={imgPreview} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }} />
        <button onClick={() => setImgPreview(null)} style={{ marginTop: 20, background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '10px 28px', fontSize: 13, cursor: 'pointer', fontFamily: C.mono, borderRadius: 2 }}>닫기</button>
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
        <Head>
          <title>STOCKED — 나의 책장과 명대사 영수증</title>
          <meta name="description" content="읽은 책을 책장에 꽂고, 명대사를 영수증으로 만들어 저장하세요." />
          <meta property="og:title" content="STOCKED — 나의 책장과 명대사 영수증" />
          <meta property="og:description" content="읽은 책을 책장에 꽂고, 명대사를 영수증으로 만들어 저장하세요." />
          <meta property="og:image" content="https://stocked-phi.vercel.app/logo.png" />
          <meta property="og:url" content="https://stocked-phi.vercel.app" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="STOCKED — 나의 책장과 명대사 영수증" />
          <meta name="twitter:description" content="읽은 책을 책장에 꽂고, 명대사를 영수증으로 만들어 저장하세요." />
          <link rel="apple-touch-icon" href="/logo.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="STOCKED" />
        </Head>
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
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 14, lineHeight: 2, fontFamily: C.font }}>
            <div>아직 책이 없어요</div>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>+ 를 눌러 첫 번째 책을 추가해보세요</div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 20px 8px', fontSize: 13, color: C.muted, fontFamily: C.mono, letterSpacing: '0.08em' }}>
          © kimsogenie · v.1.1.4
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <button onClick={() => setErrorModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.faint, fontFamily: C.mono, letterSpacing: '0.06em', textDecoration: 'underline' }}>
            오류 신고하기
          </button>
        </div>
      </div>
    )
  }

  if (view === 'search') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('library')} title="책 추가" right="" />
        {isAddingBook && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(245,242,236,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: C.mono, letterSpacing: '0.1em' }}>서재에 꽂는 중...</div>
          </div>
        )}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="책 제목 또는 저자..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleSearch} style={{ ...btnSolid, width: 'auto', padding: '0 18px' }}>{searching ? '...' : '검색'}</button>
          </div>
          {searchResults.map((book, i) => (
            <div key={i} onClick={() => addBook(book)} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: `0.5px solid ${C.border}`, cursor: isAddingBook ? 'default' : 'pointer', opacity: isAddingBook ? 0.4 : 1 }}>
              {book.thumbnail ? <img src={book.thumbnail} alt={book.title} style={{ width: 48, height: 66, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 48, height: 66, background: '#E8E4DC', flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 5, lineHeight: 1.4, fontFamily: C.font }}>{book.title}</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font }}>{book.authors?.join(', ')} · {book.publisher}</div>
              </div>
            </div>
          ))}
          {/* 직접 입력 */}
          <div style={{ marginTop: 24, borderTop: `0.5px solid ${C.border}`, paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: '0.08em', marginBottom: 14 }}>검색이 안 된다면 직접 입력해보세요</div>
            <ManualBookForm onAdd={addBook} />
          </div>
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
            {/* 읽은 날짜 수정 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.08em', color: C.faint, fontFamily: C.mono }}>READ ·</span>
              {editingField === 'readDate' ? (
                <input
                  defaultValue={b.readDate}
                  autoFocus
                  onBlur={(e) => updateBook(b.id, 'readDate', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateBook(b.id, 'readDate', e.target.value)}
                  style={{ fontSize: 10, fontFamily: C.mono, border: `0.5px solid ${C.borderMid}`, background: 'transparent', color: C.text, padding: '2px 4px', width: 90 }}
                />
              ) : (
                <span
                  onClick={() => setEditingField('readDate')}
                  style={{ fontSize: 10, letterSpacing: '0.08em', color: C.faint, fontFamily: C.mono, cursor: 'pointer', borderBottom: `0.5px dashed ${C.faint}` }}
                >{b.readDate} ✎</span>
              )}
            </div>
            {/* 페이지 수 수정 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.08em', color: C.faint, fontFamily: C.mono }}>PAGES ·</span>
              {editingField === 'pages' ? (
                <input
                  defaultValue={b.pages}
                  autoFocus
                  type="number"
                  onBlur={(e) => updateBook(b.id, 'pages', Number(e.target.value) || 250)}
                  onKeyDown={(e) => e.key === 'Enter' && updateBook(b.id, 'pages', Number(e.target.value) || 250)}
                  style={{ fontSize: 10, fontFamily: C.mono, border: `0.5px solid ${C.borderMid}`, background: 'transparent', color: C.text, padding: '2px 4px', width: 60 }}
                />
              ) : (
                <span
                  onClick={() => setEditingField('pages')}
                  style={{ fontSize: 10, letterSpacing: '0.08em', color: C.faint, fontFamily: C.mono, cursor: 'pointer', borderBottom: `0.5px dashed ${C.faint}` }}
                >{b.pages}p ✎</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          {/* 상태 태그 + 별점 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {[
              { value: 'reading', label: '📖 읽는 중' },
              { value: 'read', label: '✅ 읽음' },
              { value: 'want', label: '🔖 읽고 싶어요' },
            ].map(s => (
              <button key={s.value} onClick={() => updateBook(b.id, 'status', s.value)} style={{
                background: b.status === s.value ? C.text : 'transparent',
                color: b.status === s.value ? C.bg : C.muted,
                border: `0.5px solid ${b.status === s.value ? C.text : C.borderMid}`,
                borderRadius: 20, padding: '4px 10px', fontSize: 11,
                cursor: 'pointer', fontFamily: C.font,
              }}>{s.label}</button>
            ))}
          </div>
          {/* 별점 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            {[1,2,3,4,5].map(star => (
              <span key={star} onClick={() => updateBook(b.id, 'rating', b.rating === star ? 0 : star)}
                style={{ fontSize: 22, cursor: 'pointer', color: star <= (b.rating || 0) ? '#E8A020' : C.faint, lineHeight: 1 }}>
                {star <= (b.rating || 0) ? '★' : '☆'}
              </span>
            ))}
            {b.rating > 0 && <span style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, marginLeft: 4 }}>{b.rating}.0</span>}
          </div>
          <button onClick={() => {
            const saved = localStorage.getItem('stocked_nickname') || ''
            setNickname(saved)
            setReceiptBg('#ffffff')
            setReceiptText('#1A1A1A')
            setReceiptDeco('default')
            setQuotes([{ text: '', page: '' }])
            setView('form')
          }} style={{ ...btnSolid, marginBottom: 8 }}>영수증 발급하기 →</button>
          <button onClick={() => {
            const url = `${window.location.origin}/shelf/${user?.id || 'guest'}`
            if (navigator.share) {
              navigator.share({ title: 'STOCKED — 나의 서재', url })
            } else {
              navigator.clipboard.writeText(url)
              alert('서재 링크가 복사됐어요!')
            }
          }} style={{ ...btnOutline, marginBottom: 8 }}>내 서재 공유하기 🔗</button>
          <button onClick={() => deleteBook(b.id)} style={{ ...btnOutline, fontSize: 12, color: 'rgba(180,50,50,0.7)', borderColor: 'rgba(180,50,50,0.25)' }}>서재에서 삭제</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 14, fontFamily: C.mono }}>발급된 영수증</div>
          {rc === 0 ? <div style={{ fontSize: 14, color: C.muted, textAlign: 'center', padding: '20px 0', fontFamily: C.font }}>아직 없어요</div>
            : b.receipts.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `0.5px solid ${C.border}` }}>
                <div onClick={() => { setSelectedReceipt(r); setView('receipt') }} style={{ flex: 1, cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 3, fontFamily: C.font }}>ORDER #{String(i + 1).padStart(4, '0')} · {r.nickname}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font }}>{r.date} · {r.quotes.length}개의 문장</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span onClick={() => { setSelectedReceipt(r); setView('receipt') }} style={{ fontSize: 14, color: C.muted, cursor: 'pointer' }}>→</span>
                  <span onClick={() => deleteReceipt(r.id)} style={{ fontSize: 14, color: 'rgba(180,50,50,0.5)', cursor: 'pointer' }}>×</span>
                </div>
              </div>
            ))
          }
        </div>
        {/* 이 책의 익명 쪽지 */}
        <div style={{ padding: 20, borderTop: `0.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', fontFamily: C.mono }}>이 책의 익명 쪽지</div>
            <button onClick={async () => {
              if (!showNotes) await loadNotes(b.title)
              setShowNotes(!showNotes)
            }} style={{ background: 'none', border: `0.5px solid ${C.borderMid}`, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: C.mono, color: C.muted }}>
              {showNotes ? '접기 ∧' : '펼치기 ∨'}
            </button>
          </div>
          {showNotes && (
            <div>
              {notes.length === 0 ? (
                <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '16px 0', fontFamily: C.font }}>아직 쪽지가 없어요. 첫 번째로 남겨보세요 ✉</div>
              ) : notes.map(n => (
                <div key={n.id} style={{ background: '#FFFDF5', border: `0.5px solid rgba(0,0,0,0.08)`, padding: '14px', marginBottom: 10, borderRadius: 2, boxShadow: '1px 2px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 13, color: C.text, fontFamily: C.font, lineHeight: 1.7, marginBottom: 8 }}>{n.content}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: C.faint, fontFamily: C.mono }}>{n.nickname} · {n.created_at?.slice(0, 10)}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['🥹', '💙', '🫂', '😮', '🌿'].map(e => (
                        <button key={e} onClick={() => addNoteReaction(n.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>
                          {e}{n.reactions?.[e] ? <span style={{ fontSize: 9, color: C.muted }}>{n.reactions[e]}</span> : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setNoteModal(true)} style={{ ...btnOutline, marginTop: 4, fontSize: 12 }}>✉ 나도 쪽지 남기기</button>
            </div>
          )}
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
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase', marginBottom: 12, fontFamily: C.mono }}>영수증 테마</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {RECEIPT_THEMES.map((t) => (
              <div key={t.name} onClick={() => { setReceiptBg(t.bg); setReceiptText(t.text) }}
                style={{ background: t.bg, color: t.text, border: receiptBg === t.bg && receiptText === t.text ? `2px solid ${t.text}` : `1px solid rgba(0,0,0,0.1)`, borderRadius: 3, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: C.mono }}>
                {t.name}
              </div>
            ))}
          </div>
          {/* 장식 선택 */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>상단 장식</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {RECEIPT_DECOS.map(d => (
                <button key={d.value} onClick={() => setReceiptDeco(d.value)} style={{
                  background: receiptDeco === d.value ? C.text : 'transparent',
                  color: receiptDeco === d.value ? C.bg : C.text,
                  border: `0.5px solid ${receiptDeco === d.value ? C.text : C.borderMid}`,
                  borderRadius: 3, padding: '5px 10px', fontSize: 14,
                  cursor: 'pointer', lineHeight: 1,
                }}>{d.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>배경</span>
              <input type="color" value={receiptBg} onChange={(e) => setReceiptBg(e.target.value)} style={{ width: 32, height: 28, border: `0.5px solid ${C.borderMid}`, padding: 2, cursor: 'pointer', background: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>글자</span>
              <input type="color" value={receiptText} onChange={(e) => setReceiptText(e.target.value)} style={{ width: 32, height: 28, border: `0.5px solid ${C.borderMid}`, padding: 2, cursor: 'pointer', background: 'none' }} />
            </div>
            <div style={{ flex: 1, background: receiptBg, color: receiptText, border: `0.5px solid rgba(0,0,0,0.08)`, borderRadius: 3, padding: '6px 10px', fontSize: 11, fontFamily: C.receipt, textAlign: 'center' }}>
              미리보기 ☆
            </div>
          </div>
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
    const rBg = r.bg || '#ffffff'
    const rText = r.textColor || '#1A1A1A'
    const rMuted = rText + '99'
    const decoDisplay = RECEIPT_DECOS.find(d => d.value === r.deco)?.display || '° ✦ ☆ ✦ °'
    const idx = b.receipts.findIndex((x) => x.id === r.id)
    const orderNum = `#${String(idx + 1).padStart(4, '0')}`
    const cardNum = `**** **** **** ${1000 + (r.id % 9000)}`
    const authCode = String(100000 + (r.id * 7) % 900000)
    const hasPrev = idx > 0
    const hasNext = idx < b.receipts.length - 1
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
        <NavBar onBack={() => setView('detail')} title="RECEIPT" right="" />
        {/* 이전/다음 네비게이션 */}
        {b.receipts.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', borderBottom: `0.5px solid ${C.border}` }}>
            <button
              onClick={() => hasPrev && setSelectedReceipt(b.receipts[idx - 1])}
              style={{ background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default', color: hasPrev ? C.text : C.faint, fontFamily: C.mono, fontSize: 12, padding: 0 }}
            >← 이전</button>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>{idx + 1} / {b.receipts.length}</span>
            <button
              onClick={() => hasNext && setSelectedReceipt(b.receipts[idx + 1])}
              style={{ background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default', color: hasNext ? C.text : C.faint, fontFamily: C.mono, fontSize: 12, padding: 0 }}
            >다음 →</button>
          </div>
        )}
        <div style={{ padding: 20 }}>
          <div ref={receiptRef} style={{ background: rBg, border: `0.5px solid rgba(0,0,0,0.08)`, borderRadius: 3, padding: '28px 20px', fontFamily: C.receipt }}>
            {/* 상단 장식 */}
            <div style={{ textAlign: 'center', fontSize: 13, letterSpacing: '0.3em', color: rMuted, marginBottom: 18 }}>{decoDisplay}</div>
            {/* 책 제목 크게 */}
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: rText, marginBottom: 4, lineHeight: 1.3 }}>{b.title}</div>
            <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.12em', color: rMuted, marginBottom: 18 }}>{b.author} · {b.publisher}</div>
            {/* ORDER 정보 */}
            <div style={{ background: rText + '11', borderRadius: 2, padding: '8px 12px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.1em', color: rText, fontWeight: 700 }}>ORDER {orderNum}</span>
              <span style={{ fontSize: 10, color: rMuted }}>{r.date}</span>
            </div>
            {/* 명대사 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: '0.1em', color: rMuted, marginBottom: 10, borderBottom: `1px dashed ${rText}22`, paddingBottom: 6 }}>
              <span>NO</span><span style={{ flex: 1, textAlign: 'left', paddingLeft: 10 }}>SENTENCE</span><span>PAGE</span>
            </div>
            {/* 명대사 목록 */}
            {r.quotes.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start', paddingBottom: 12, borderBottom: i < r.quotes.length - 1 ? `1px dashed ${rText}15` : 'none' }}>
                <span style={{ minWidth: 20, color: rMuted, fontSize: 10, flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, fontSize: 13, lineHeight: 1.8, color: rText }}>{q.text}</span>
                <span style={{ fontSize: 10, color: rMuted, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>p.{q.page || '—'}</span>
              </div>
            ))}
            {/* 합계 */}
            <div style={{ borderTop: `1px dashed ${rText}33`, paddingTop: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, lineHeight: 2, color: rMuted }}><span>ITEM COUNT</span><span>{r.quotes.length}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: rText }}><span>TOTAL</span><span>{r.quotes.length}개의 문장</span></div>
            </div>
            {/* 카드 정보 */}
            <div style={{ borderTop: `1px dashed ${rText}33`, marginTop: 12, paddingTop: 12, fontSize: 11, lineHeight: 2.2, color: rMuted }}>
              <div>CARD #: {cardNum}</div>
              <div>AUTH CODE: {authCode}</div>
              <div style={{ color: rText, fontWeight: 700 }}>CARDHOLDER: {r.nickname} ☆</div>
            </div>
            {/* 바코드 */}
            <div style={{ borderTop: `1px dashed ${rText}33`, marginTop: 12, paddingTop: 16 }}>
              <Barcode seed={r.id} />
              <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.2em', color: rMuted, marginTop: 10 }}>THANK YOU FOR READING!</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={saveAsImage} style={btnSolid}>이미지로 저장하기 ↓</button>
            <button onClick={() => setView('detail')} style={btnOutline}>영수증 목록으로</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
