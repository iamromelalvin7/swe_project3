import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/Toast";
import { BottomNav } from "@/components/BottomNav";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-archivo",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Archive 233",
    template: "%s — Archive 233",
  },
  description: "Curated secondhand and vintage menswear from Accra, Ghana. One-of-one pieces, held for you for ten minutes when you add them to your cart.",
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables live on <html> so the :root-level theme tokens in
    // globals.css can see them.
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}>
      <body className="bg-cream font-sans text-ink antialiased">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              {children}
              <BottomNav />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
