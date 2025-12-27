import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://manga-trans.vercel.app'),
  title: {
    default: "MangaTrans - แปลมังงะอัตโนมัติ | แปลมังฮวา การ์ตูน",
    template: "%s | MangaTrans"
  },
  description: "แปลมังงะ มังฮวา การ์ตูนอัตโนมัติ รองรับภาษาเกาหลี ญี่ปุ่น จีน อังกฤษ แปลเป็นไทยใน 1 นาที ใช้งานง่าย ฟรี!",
  keywords: [
    "แปลมังงะ",
    "แปลมังฮวา",
    "แปลการ์ตูน",
    "แปลเว็บตูน",
    "manga translator",
    "manhwa translator",
    "webtoon translator",
    "แปลเกาหลี",
    "แปลญี่ปุ่น",
    "AI translation",
    "OCR manga",
    "อ่านมังงะ",
    "อ่านมังฮวา"
  ],
  authors: [{ name: "MangaTrans Team" }],
  creator: "MangaTrans",
  publisher: "MangaTrans",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "/",
    siteName: "MangaTrans",
    title: "MangaTrans - แปลมังงะอัตโนมัติ",
    description: "แปลมังงะ มังฮวา การ์ตูนอัตโนมัติ รองรับภาษาเกาหลี ญี่ปุ่น จีน อังกฤษ แปลเป็นไทยใน 1 นาที",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MangaTrans - แปลมังงะอัตโนมัติ",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MangaTrans - แปลมังงะอัตโนมัติ",
    description: "แปลมังงะ มังฮวา การ์ตูนอัตโนมัติ รองรับภาษาเกาหลี ญี่ปุ่น จีน",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "MangaTrans",
  description: "แปลมังงะ มังฮวา การ์ตูนอัตโนมัติ รองรับหลายภาษา",
  url: "https://mangatrans.app",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1250"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${notoSansThai.variable} font-sans antialiased bg-gray-950 text-white min-h-screen`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
