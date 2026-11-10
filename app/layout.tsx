import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PlayerProvider } from '@/lib/player';

export const metadata: Metadata = {
  title: 'Beats | BAGCHASERKASH',
  description: 'License original instrumentals directly from BAGCHASERKASH.',
  metadataBase: new URL('https://bagchaserkash.com'),
  openGraph: {
    title: 'Beats | BAGCHASERKASH',
    description: 'License original instrumentals directly from BAGCHASERKASH.',
    url: 'https://bagchaserkash.com/beats',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
