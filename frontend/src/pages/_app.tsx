import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>AI Online Judge — Socratic Virtual TA & EDM</title>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <meta name="description" content="AI-Powered Online Judge with Socratic Virtual TA & Effort-Based Educational Data Mining for Prof. Yutaka Watanobe's Lab." />
      </Head>
      <div className="min-h-screen flex flex-col bg-ivory-100 text-slate-900 selection:bg-amber-300 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Component {...pageProps} />
        </main>
      </div>
    </AuthProvider>
  );
}
