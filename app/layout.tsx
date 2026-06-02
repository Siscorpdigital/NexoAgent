import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/context/ToastContext";
import ToastContainer from "@/app/components/ui/ToastContainer";
import SkipLinks from "@/app/components/a11y/SkipLinks";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${jakarta.variable} h-full antialiased`}>
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
