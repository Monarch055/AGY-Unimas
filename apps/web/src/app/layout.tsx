import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  title: 'RekaSains — AI-Native STEM Lab, AR Inventory & Academic Lab Report PDF (ID & MY)',
  description:
    'AI-Native STEM Lab & Physical-to-Digital Inventory Mapping platform based on Kurikulum Merdeka (Indonesia) & KSSR/KSSM (Malaysia) with 6-Sub-Agent Google ADK.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
