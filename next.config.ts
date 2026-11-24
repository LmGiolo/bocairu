import type { NextConfig } from "next";

// Endereço do NOSSO projeto Supabase (ex.: abcd1234.supabase.co), lido da
// mesma variável que os clients usam. É o único domínio de onde o
// otimizador de imagens aceita buscar foto.
//
// Antes era "*.supabase.co", ou seja, qualquer projeto Supabase do mundo:
// alguém podia criar um projeto grátis, subir um arquivo preparado e pedir
// ao NOSSO servidor para processá-lo em /_next/image — gastando a nossa
// cota de otimização e expondo o servidor a falhas do processador de
// imagens. Com o domínio exato, só as fotos do nosso bucket passam.
function dominioSupabase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definida (o next.config.ts precisa dela para liberar as fotos).");
  }
  return new URL(url).hostname;
}

// Cabeçalhos de segurança enviados em TODA resposta (site e admin).
const CABECALHOS_SEGURANCA = [
  // Proíbe outro site de abrir o nosso dentro de um <iframe>. Sem isso, uma
  // página maliciosa poderia carregar o /admin invisível por cima de um
  // botão qualquer e fazer a artista clicar em "Excluir" sem perceber
  // (o ataque se chama clickjacking). `frame-ancestors` é a forma moderna;
  // `X-Frame-Options` cobre navegadores antigos.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  // O navegador respeita o Content-Type que mandamos e não tenta
  // "adivinhar" o tipo do arquivo pelo conteúdo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ao sair do site por um link (WhatsApp, Instagram), o destino fica
  // sabendo só o domínio de origem, não a página exata.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // A passagem da foto da galeria para a Página da Obra (<ViewTransition>
  // do React) não precisa mais de flag: desde o Next 16.3 funciona sem
  // configuração. A antiga `experimental.viewTransition` foi removida.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: dominioSupabase(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_SEGURANCA }];
  },
  async redirects() {
    return [
      // Link antigo da Galeria filtrada por série (`/galeria?serie=X`): a
      // série tem endereço próprio, `/colecoes/X`. A Galeria parou de ler
      // a URL para poder ficar em cache (src/app/(site)/layout.tsx); este
      // redirect mantém funcionando os links que já foram compartilhados.
      {
        source: "/galeria",
        has: [{ type: "query", key: "serie", value: "(?<serie>.+)" }],
        destination: "/colecoes/:serie",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
