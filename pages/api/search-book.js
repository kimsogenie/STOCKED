export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { query } = req.query

  if (!query) {
    return res.status(400).json({ message: '검색어를 입력해주세요' })
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=10`,
      {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('카카오 API 오류')
    }

    const data = await response.json()

    const books = data.documents.map((book) => ({
      title: book.title,
      authors: book.authors,
      publisher: book.publisher,
      thumbnail: book.thumbnail,
      isbn: book.isbn,
      contents: book.contents,
    }))

    return res.status(200).json({ books })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: '검색 중 오류가 발생했습니다' })
  }
}
