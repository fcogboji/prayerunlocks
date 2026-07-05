import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbfcf8",
};

export const metadata: Metadata = {
  title: "PrayerUnlocks — Pray Your Way Through Any Situation",
  description:
    "Describe your situation. Get Bible verses, prayer guidance, and AI explanations. Stay consistent with God daily.",
  openGraph: {
    title: "PrayerUnlocks — Scripture & Prayer for Every Situation",
    description: "Pray your way through any situation with Scripture and guided prayer.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-[100dvh] overflow-x-hidden font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
