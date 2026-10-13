// Mensagem de resultado de formulário (salvou / deu erro). Ícone + texto,
// nunca só cor (docs/handoff.md §6). `role` faz o leitor de tela anunciar a
// mensagem assim que ela aparece, sem a pessoa precisar procurar.
export default function Aviso({ tipo, children }: { tipo: 'sucesso' | 'erro'; children: React.ReactNode }) {
  return (
    <p
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex gap-2 text-sm ${tipo === 'erro' ? 'text-[#B8492E]' : 'text-[#2F5233]'}`}
    >
      <span aria-hidden="true">{tipo === 'erro' ? '⚠' : '✔'}</span>
      <span>{children}</span>
    </p>
  )
}
