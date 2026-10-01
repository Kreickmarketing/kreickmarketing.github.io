import type { Metadata } from "next";
import { Saira, Courier_Prime } from "next/font/google";
import "./globals.css";

// Brand fonts: Saira for headings and body, Courier Prime for buttons.
const saira = Saira({ subsets: ["latin"], variable: "--font-saira" });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-courier-prime" });

export const metadata: Metadata = {
  title: "ClearMark",
  description: "Your single source of truth shouldn't be a person. Make it visible.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${saira.variable} ${courierPrime.variable}`}>
      <body>{children}</body>
    </html>
  );
}
