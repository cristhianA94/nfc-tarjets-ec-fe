import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "NFC · Tarjetas", template: "%s | NFC" },
  description: "Administración de tarjetas NFC para reseñas de Google.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
