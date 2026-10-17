import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RekaSains — AI-Native STEM Lab, AR Inventory & Academic Lab Report PDF (ID & MY)',
  description:
    'Platform AI-Native STEM Lab & Physical-to-Digital Inventory Mapping berbasis Kurikulum Merdeka (Indonesia) & KSSR/KSSM (Malaysia) dengan 6-Sub-Agent Google ADK.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
