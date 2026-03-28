import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://annabellevoyage.com"),
  title: "Annabelle Voyage | Travel Content Creator",
  description:
    "French travel content creator based in Dublin. Hotels, landscapes, drone footage & lifestyle content. Available for collaborations worldwide.",
  keywords: [
    "travel content creator",
    "hotel photography",
    "drone videography",
    "travel influencer",
    "Dublin",
    "French Polynesia",
    "collaboration",
    "Annabelle Cathala",
  ],
  authors: [{ name: "Annabelle Cathala" }],
  alternates: {
    canonical: "https://annabellevoyage.com",
  },
  openGraph: {
    title: "Annabelle Voyage | Travel Content Creator",
    description:
      "French travel content creator based in Dublin. Hotels, landscapes, drone footage & lifestyle content.",
    url: "https://annabellevoyage.com",
    siteName: "Annabelle Voyage",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://annabellevoyage.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Annabelle Voyage - Travel Content Creator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Annabelle Voyage | Travel Content Creator",
    description:
      "French travel content creator based in Dublin. Available for collaborations.",
    images: ["https://annabellevoyage.com/og-image.jpg"],
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Annabelle Cathala",
  alternateName: "Annabelle Voyage",
  url: "https://annabellevoyage.com",
  jobTitle: "Travel Content Creator",
  description:
    "French travel content creator based in Dublin, specializing in hotel and landscape photography and drone videography.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dublin",
    addressCountry: "IE",
  },
  sameAs: [
    "https://www.instagram.com/annabellecathala",
    "https://www.youtube.com/@annabellecathala",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap"
          as="style"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#FDF6F0",
              color: "#3D2C2E",
              border: "1px solid #EDD5CC",
              borderRadius: "12px",
              fontFamily: "DM Sans, sans-serif",
            },
            success: {
              iconTheme: {
                primary: "#C4917B",
                secondary: "#FDF6F0",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
