import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inclusiveSans = localFont({
  src: [
    { path: "./fonts/inclusive-sans-regular.woff2", style: "normal" },
    { path: "./fonts/inclusive-sans-italic.woff2", style: "italic" },
  ],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Hack4Impact",
  description: "Volunteer Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inclusiveSans.variable}>
      <body>{children}</body>
    </html>
  );
}
