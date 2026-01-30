import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import TopLoader from "@/components/NavigationLoader";

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
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <Providers>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
              {children}
            </main>
            <footer className="border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                © 2026 DivyUp. Split expenses with ease.
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
