import type { Metadata } from "next";
import { Saira } from "next/font/google";
import "./globals.css";

// Brand font: Saira for headings, body and buttons (buttons were Courier Prime until Oct 9, 2026).
const saira = Saira({ subsets: ["latin"], variable: "--font-saira" });

export const metadata: Metadata = {
  title: "ClearMark",
  description: "Your single source of truth shouldn't be a person. Make it visible.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={saira.variable}>
      <body>{children}</body>
    </html>
  );
}
