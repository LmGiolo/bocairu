import type { Metadata } from "next";
import { Instrument_Serif, Work_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { urlDoSite } from "@/lib/site";
import { SCRIPT_ANIMACAO } from "@/lib/animacao";

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
  // `suppressHydrationWarning`: o script abaixo põe `data-js` no <html>
  // antes de o React chegar, então o HTML do navegador fica diferente do que
  // o servidor mandou — de propósito. Sem isso, o React reclamaria da
  // diferença ao hidratar. Vale só para os atributos do próprio <html>.
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        {/* beforeInteractive: roda antes da página aparecer, para o estado
            "antes de entrar" das animações já valer no primeiro quadro. */}
        <Script id="animacao" strategy="beforeInteractive">
          {SCRIPT_ANIMACAO}
        </Script>
        {children}
      </body>
    </html>
  );
}