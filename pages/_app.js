import '../styles/globals.css'
import Head from 'next/head'
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>STOCKED</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="나의 책장과 명대사 영수증" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://cdn.jsdelivr.net/npm/neodgm-webfont@1.0.1/neodgm.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Space+Mono:wght@700&family=DM+Serif+Display&family=Bebas+Neue&display=swap" rel="stylesheet" />
      </Head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-ZQ901D3963" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-ZQ901D3963');
      `}</Script>
      <Component {...pageProps} />
    </>
  )
}
