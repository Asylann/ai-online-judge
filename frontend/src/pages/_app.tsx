import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-ivory-100 text-slate-900 selection:bg-ivory-400 selection:text-slate-900">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Component {...pageProps} />
        </main>
      </div>
    </AuthProvider>
  );
}
