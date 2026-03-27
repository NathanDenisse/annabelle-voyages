import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Annabelle Voyages — Créatrice de contenu voyage",
  description:
    "Française à Dublin, créatrice de contenu voyage. Partenariats hôtels et marques lifestyle.",
  keywords: ["voyage", "travel", "content creator", "Dublin", "photo", "vidéo", "drone"],
  authors: [{ name: "Annabelle Cathala" }],
  openGraph: {
    title: "Annabelle Voyages",
    description: "Française à Dublin · Créatrice de contenu voyage",
    type: "website",
    locale: "fr_FR",
    siteName: "Annabelle Voyages",
  },
  twitter: {
    card: "summary_large_image",
    title: "Annabelle Voyages",
    description: "Française à Dublin · Créatrice de contenu voyage",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Preconnect to Google Fonts for fast loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload critical fonts to avoid FOUT */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap"
          as="style"
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
