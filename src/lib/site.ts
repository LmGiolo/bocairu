// Endereço público do site, usado onde é obrigatório ter URL completa (as
// tags de pré-visualização de link — Open Graph — exigem "https://..."; o
// WhatsApp e o Instagram ignoram caminho relativo).
//
// Ordem de preferência:
// 1. NEXT_PUBLIC_SITE_URL — defina quando houver domínio próprio
//    (ex.: https://bocairu.com.br) nas variáveis da Vercel;
// 2. VERCEL_PROJECT_PRODUCTION_URL — a Vercel preenche sozinha com o
//    domínio de produção do projeto (sem "https://", por isso o prefixo);
// 3. localhost — desenvolvimento na sua máquina.
export function urlDoSite(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) return new URL(process.env.NEXT_PUBLIC_SITE_URL)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  }
  return new URL('http://localhost:3000')
}
