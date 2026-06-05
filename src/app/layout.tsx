import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inclusiveSans = localFont({
  src: [
    { path: "./fonts/inclusive-sans-regular.woff2", style: "normal" },
    { path: "./fonts/inclusive-sans-italic.woff2", style: "italic" },
  ],
  display: "swap",
  variable: "--font-inclusive-sans",
});

const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader.woff2", weight: "200 800", style: "normal" },
    {
      path: "./fonts/newsreader-italic.woff2",
      weight: "200 800",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-newsreader",
});

const paperMono = localFont({
  src: [
    {
      path: "./fonts/paper-mono-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-paper-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Hack4Impact",
    template: "%s | Hack4Impact",
  },
  description: "Volunteer Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Hack4Impact",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inclusiveSans.variable} ${newsreader.variable} ${paperMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
