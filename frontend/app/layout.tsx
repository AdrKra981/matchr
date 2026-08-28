import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Every response carries a fresh CSP nonce generated in proxy.ts. A statically
 * rendered page would bake one nonce into the HTML at build time and then serve
 * it against a different nonce in the header, so nothing would run.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matchr — AI job matching",
  description:
    "Upload your CV and find the job offers that actually fit it, with an explanation of why.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-surface text-ink min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
