import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RekaSains',
  description:
    'Ubah barang di sekitar menjadi eksperimen sains: pindai bahan, cek keamanan, pilih eksperimen, dan susun laporan praktikum.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#fafaf9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
