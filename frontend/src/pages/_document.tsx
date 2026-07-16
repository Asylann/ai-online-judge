import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="shortcut icon" href="/logo.svg" />
        <meta name="theme-color" content="#0f172a" />
      </Head>
      <body className="bg-ivory-100 text-slate-900 antialiased selection:bg-amber-300 selection:text-slate-950">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
