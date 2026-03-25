import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Palalate – Výkaz sdílení",
    template: "%s | Palalate",
  },
  description:
    "Bezpečná platforma pro evidenci digitálních předplatných, řízené sdílení přístupů a přehledné vyúčtování nákladů.",
  keywords: ["předplatné", "sdílení", "Netflix", "Spotify", "billing", "subscription"],
  authors: [{ name: "Palalate" }],
  openGraph: {
    title: "Palalate",
    description: "Platforma pro evidenci a řízené sdílení předplatných",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💲</text></svg>" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Palalate" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
