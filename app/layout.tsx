import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "rankd", template: "%s · rankd" },
  description: "A personal ranking engine. Drag things into the order they deserve.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans antialiased`}>
        <MotionProvider>
          <header className="border-b border-line/70">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
              <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                rankd<span className="text-accent">.</span>
              </Link>
              <span className="text-xs text-faint">personal ranking engine</span>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:px-6">{children}</main>
        </MotionProvider>
      </body>
    </html>
  );
}
