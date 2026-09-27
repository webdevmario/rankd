import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { MotionProvider } from "@/components/motion-provider";
import { Toaster } from "@/components/ui/sonner";
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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans antialiased`}>
        <MotionProvider>
          <header className="border-b border-border/70">
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="inline-flex flex-col">
                <span className="text-lg leading-tight font-semibold tracking-tight">
                  rankd<span className="text-primary">.</span>
                </span>
                <span className="text-xs text-faint">rank anything</span>
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6 lg:px-8">{children}</main>
          <Toaster position="bottom-center" />
        </MotionProvider>
      </body>
    </html>
  );
}
