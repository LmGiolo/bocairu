import type { Metadata } from "next";
import { Instrument_Serif, Work_Sans } from "next/font/google";
import "./globals.css";
import { urlDoSite } from "@/lib/site";

const serif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Metadados do site inteiro. Cada página pode sobrescrever `title` e
// `description`; o `template` monta "Galeria · Bocairú" a partir do título
// da página. `metadataBase` transforma os caminhos relativos (como o da
// imagem de pré-visualização) em URL completa — obrigatório pro Open Graph.
export const metadata: Metadata = {
  metadataBase: urlDoSite(),
  title: {
    default: "Bocairú — Fotografia",
    template: "%s · Bocairú",
  },
  description: "Fotografia autoral de Bocairú — portfólio e sessões de foto sob agendamento.",
  openGraph: {
    siteName: "Bocairú",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}