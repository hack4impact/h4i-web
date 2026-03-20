import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inclusiveSans = localFont({
  src: [
    {
      path: "./fonts/inclusive-sans-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/inclusive-sans-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hack for Impact",
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
