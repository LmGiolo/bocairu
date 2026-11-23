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
};

export default nextConfig;
