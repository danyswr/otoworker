import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'My Google AI Studio App',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} bg-background`}>
      <body suppressHydrationWarning className="font-sans text-foreground bg-background antialiased overflow-hidden selection:bg-primary/40 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
