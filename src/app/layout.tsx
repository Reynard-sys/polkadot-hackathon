import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { AuthSessionProvider } from "@/context/auth-session-context";
import { StellarWalletProvider } from "@/context/stellar-wallet-context";
import { WalletProvider } from "@/context/wallet-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aniverse Nexus",
  description: "Stellar-powered TCG collectibles, marketplace, and crossover practice battles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StellarWalletProvider>
          <AuthSessionProvider>
            <WalletProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1 pb-[calc(76px+env(safe-area-inset-bottom))] pt-3 md:pb-0 md:pt-0">
                  {children}
                </main>
                <Footer />
                <MobileBottomNav />
              </div>
            </WalletProvider>
          </AuthSessionProvider>
        </StellarWalletProvider>
      </body>
    </html>
  );
}
