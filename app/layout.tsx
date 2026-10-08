import type { Metadata } from "next";
import "./globals.css";
import Fonts from "./fonts";

export const metadata: Metadata = {
  title: "AirDesk · Job management",
  description: "Air conditioning jobs, customers, photos and schedules in one place.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><Fonts/>{children}</body>
    </html>
  );
}
