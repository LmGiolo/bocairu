import 'server-only'

import { revalidatePath } from 'next/cache'

// O site público fica em cache (ver `revalidate` em src/app/(site)/layout.tsx):
// a página é montada uma vez e servida pronta para todo mundo, sem consultar
// o banco a cada visita. O preço é que o cache precisa saber quando o
// conteúdo mudou — é isto aqui.
//
// Toda gravação do admin que muda o que o visitante vê (foto nova, edição,
// exclusão, status, ordem, textos, retratos) chama esta função depois de
// dar certo. Ela joga fora o cache do site INTEIRO: `'/'` com `'layout'`
// invalida o layout raiz e tudo que está embaixo dele. Parece muito, mas o
// site é pequeno, e uma mudança costuma mexer em várias páginas ao mesmo
// tempo (a ordem muda a Home e a Galeria; um texto aparece no rodapé de
// todas). A próxima visita de cada página a monta de novo, já atualizada.
//
// Rotas de API chamam direto. Componentes do admin (que gravam pelo client
// do navegador) não podem: passam pela Server Action de
// src/app/admin/acoes.ts, que confere se quem pede é admin.
export function revalidarSitePublico() {
  revalidatePath('/', 'layout')
}
