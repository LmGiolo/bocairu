import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Liga a integração do Next com o <ViewTransition> do React: cada
  // navegação vira uma "view transition" do navegador, o que permite a foto
  // passar da galeria para a Página da Obra. Navegador sem suporte navega
  // normalmente, só sem a animação.
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
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
