import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Palalate – Správa sdílených předplatných",
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
      <body>{children}</body>
    </html>
  );
}
