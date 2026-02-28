import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PlantCare Pro - Advanced Diagnostics',
  description: 'Upload a photo of your plant leaf to receive instant, AI-driven diagnostics, potential causes, and actionable treatment recommendations. Get healthy plants today.',
  keywords: ['plant care', 'plant disease AI', 'plant disease scanner', 'crop health', 'botany tool', 'farming AI', 'leaf disease detector', 'PlantCare Pro', 'agriculture tech'],
  authors: [{ name: 'Anurag Pathak' }],
  openGraph: {
    title: 'PlantCare Pro',
    description: 'Intelligent AI disease diagnostics for your plants.',
    url: 'https://plantcare-pro.vercel.app',
    siteName: 'PlantCare Pro',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'M06HM4NrzhUhrIQZoPVYeFiQPwO_dzer65lcBR9wm5k',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased selection:bg-brand-500 selection:text-white`}>
        {/* Dynamic Background Blurs */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-300/30 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-300/20 blur-[120px]" />
          <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-green-200/40 blur-[90px]" />
        </div>

        <main className="min-h-screen relative z-10 p-4 md:p-8 flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  );
}
