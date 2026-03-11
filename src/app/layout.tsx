import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
