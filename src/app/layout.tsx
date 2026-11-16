import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "NexTap · Gestión de tarjetas", template: "%s | NexTap" },
  applicationName: "NexTap",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  description: "Administra clientes, tarjetas NFC y sus destinos con NexTap.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  themeColor: "#062b50",
  colorScheme: "light",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Tolerate externally injected root attributes; keep descendant checks enabled.
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
