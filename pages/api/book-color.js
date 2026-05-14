export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ bg: null, text: null })

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!response.ok) throw new Error('fetch failed')

    const buffer = Buffer.from(await response.arrayBuffer())

    let sharp
    try { sharp = require('sharp') } catch { throw new Error('sharp not available') }

    const { data, info } = await sharp(buffer)
      .resize(16, 24, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    let r = 0, g = 0, b = 0
    const total = info.width * info.height
    for (let i = 0; i < data.length; i += 3) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]
    }
    r = Math.round(r / total)
    g = Math.round(g / total)
    b = Math.round(b / total)

    const mix = (v, t, a) => Math.round(v + (t - v) * a)
    const bgR = mix(r, 240, 0.55)
    const bgG = mix(g, 235, 0.55)
    const bgB = mix(b, 225, 0.55)
    const bg = `rgb(${bgR},${bgG},${bgB})`

    const tR = Math.max(Math.round(r * 0.3), 15)
    const tG = Math.max(Math.round(g * 0.3), 15)
    const tB = Math.max(Math.round(b * 0.3), 15)
    const text = `rgb(${tR},${tG},${tB})`

    const brightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000
    if (brightness > 235) throw new Error('too bright')

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.json({ bg, text })
  } catch {
    return res.json({ bg: null, text: null })
  }
}
