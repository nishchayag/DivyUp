import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "DivyUp",
  description: "Team expense and split management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} ${dmSans.className} font-body min-h-screen`}>
        <Providers>
          <div className="min-h-screen flex flex-col relative overflow-x-clip">
            <div className="pointer-events-none absolute -top-40 -left-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="pointer-events-none absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />
            <Navbar />
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-10 fade-rise">
              {children}
            </main>
            <footer className="py-6">
              <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
                © 2026 DivyUp. Split expenses with ease.
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
