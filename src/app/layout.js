import "./globals.css";
import { Providers } from "./Providers";
import { Toaster } from "sonner";

export const viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "KingBlox — Premium Digital Marketplace",
  description: "Premium cloud phone & digital products. Fast delivery, secure transactions, 24/7 support.",
  openGraph: {
    title: "KingBlox — Premium Digital Marketplace",
    description: "Premium cloud phone & digital products. Fast delivery, secure transactions, 24/7 support.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            theme="system"
            toastOptions={{
              className: "glass-strong border-border",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
