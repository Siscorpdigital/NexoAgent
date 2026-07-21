import type { Metadata } from "next";
// Tipografías del sistema Previsión Familiar (mismas variables --font-sora /
// --font-jakarta que usa la app; ahora resuelven a las fuentes del cotizador):
//   - Títulos: Cormorant Garamond (serif institucional)
//   - Cuerpo:  Inter
import { Cormorant_Garamond, Inter, Roboto } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/context/ToastContext";
import ToastContainer from "@/app/components/ui/ToastContainer";
import SkipLinks from "@/app/components/a11y/SkipLinks";

const sora = Cormorant_Garamond({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Inter({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Roboto: para mostrar números (teléfonos) con máxima legibilidad.
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "NexoAgent — Tu Empleado Virtual para WhatsApp",
  description: "Plataforma de agentes conversacionales inteligentes para WhatsApp. Atiende, Agenda, Vende, Recuerda y Crece con IA",
  keywords: ["NexoAgent", "WhatsApp", "IA", "Asistente Virtual", "Automatización", "CRM", "Agenda"],
  authors: [{ name: "NexoAgent" }],
  openGraph: {
    title: "NexoAgent — Tu Empleado Virtual para WhatsApp",
    description: "Atiende, Agenda, Vende, Recuerda y Crece con IA",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexoAgent — Tu Empleado Virtual para WhatsApp",
    description: "Atiende, Agenda, Vende, Recuerda y Crece con IA",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon-pf.png",
    shortcut: "/favicon-pf.png",
    apple: "/favicon-pf.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${jakarta.variable} ${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-jakarta">
        <ToastProvider>
          <SkipLinks />
          <main id="main-content">{children}</main>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
