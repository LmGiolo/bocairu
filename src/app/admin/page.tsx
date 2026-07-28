import FormularioObra from '@/components/admin/FormularioObra'

// Os dois portões (sessão + perfis.papel === 'admin') agora vivem em
// admin/layout.tsx, que roda pra toda rota /admin/* — não só esta.
export default function Admin() {
  return (
    <div>
      <h1>Painel da Artista</h1>
      <p>Você está logada como admin. 🎉</p>
      <FormularioObra />
    </div>
  )
}