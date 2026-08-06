import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const AnimatedBackground = dynamic(
  () => import("@/components/AnimatedBackground").then(mod => ({ default: mod.AnimatedBackground })),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>AI Online Judge — Socratic Virtual TA & EDM</title>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <meta name="description" content="AI-Powered Online Judge with Socratic Virtual TA." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen relative flex flex-col bg-ivory-100 text-slate-900 selection:bg-amber-300 selection:text-slate-950">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col flex-1">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      </div>
    </AuthProvider>
  );
}
