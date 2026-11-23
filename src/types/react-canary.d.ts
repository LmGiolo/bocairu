// O Next 16 roda o App Router com a versão "canary" do React, que já traz o
// componente <ViewTransition> (usado na passagem da foto da galeria para a
// Página da Obra). Os tipos dele moram num arquivo à parte do @types/react;
// esta linha os inclui no projeto. Sem ela, `import { ViewTransition } from
// 'react'` não compila.
/// <reference types="react/canary" />
