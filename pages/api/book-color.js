export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ bg: null, text: null })

  try {
    const response = await fetch(decodeURIComponent(url))
    if (!response.ok) throw new Error('fetch failed')

    const buffer = Buffer.from(await response.arrayBuffer())
    const sharp = require('sharp')

    const { data, info } = await sharp(buffer)
      .resize(20, 30, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    let r = 0, g = 0, b = 0
    const total = info.width * info.height
    for (let i = 0; i < data.length; i += 3) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }
    r = Math.round(r / total)
    g = Math.round(g / total)
    b = Math.round(b / total)

    // 밝게 올려서 spine 배경색, 어둡게 내려서 텍스트색
    const lerp = (v, t, a) => Math.round(v + (t - v) * a)
    const bg = `rgb(${lerp(r, 230, 0.55)}, ${lerp(g, 220, 0.55)}, ${lerp(b, 210, 0.55)})`
    const text = `rgb(${Math.max(Math.round(r * 0.32), 18)}, ${Math.max(Math.round(g * 0.32), 18)}, ${Math.max(Math.round(b * 0.32), 18)})`

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.json({ bg, text })
  } catch {
    return res.json({ bg: null, text: null })
  }
}
