import { redirect } from 'next/navigation'

// O painel abre direto na lista de Obras (decisão de 2026-11-23: sem
// Dashboard — com as vendas paradas, não há número que mude alguma decisão).
// O cadastro de obra, que morava aqui, virou a janela "+ Nova obra" de
// /admin/obras. Esta rota continua existindo porque o /entrar manda pra
// /admin depois do login.
export default function Admin() {
  redirect('/admin/obras')
}
