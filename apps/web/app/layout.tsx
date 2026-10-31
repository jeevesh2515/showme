import type { Metadata } from "next";
import localFont from "next/font/local";
import A11yControls from "../components/A11yControls";
import "./globals.css";

// Self-hosted (PRIV-8): the woff2 ships in this repo, so browsers never call
// Google. Variable font, 400 to 800 (docs/DESIGN.md §2). Licence: fonts/OFL.txt.
const atkinson = localFont({
  src: "../fonts/atkinson-hyperlegible-next-latin.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  variable: "--font-atkinson",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "ShowMe",
  description:
    "Add a screenshot, say what you want to do, and see exactly where to press.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={atkinson.variable}>
      <body>
        <A11yControls />
        {children}
      </body>
    </html>
  );
}
