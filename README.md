# SME Bens Físicos - Frontend

Sistema de gestão de bens físicos para a SME.

## Tecnologias

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **React Router v7** - Roteamento
- **TanStack Query** - Gerenciamento de estado do servidor
- **Tailwind CSS v4** - Estilização
- **shadcn/ui** - Componentes UI
- **React Hook Form + Zod** - Formulários e validação

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8000/api
```

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### Build

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

## Padrões de Interface

### Ações de Listagem

Os botões do cabeçalho das telas de listagem seguem a ordem: `Voltar`, `Relatório` ou exportação, ações contextuais de itens selecionados e ação primária de criação. A ação de criação fica sempre mais à direita e usa o ícone `+` antes do texto.

O chevron é exibido no botão `Relatório` somente quando o clique abre um menu para selecionar formatos de exportação.

### Ações de Formulários e Detalhes

Nas telas de detalhe, `Voltar` é o primeiro botão e usa somente o ícone de seta, com nome acessível. A ação `Editar`, quando disponível, usa o ícone de lápis antes do texto.

Nos formulários, `Cancelar` é o primeiro botão e não usa ícone de seta. As ações de negócio ficam em seguida e a ação primária (`Salvar`, `Solicitar` ou equivalente) permanece mais à direita. Quando dois controles executam a mesma saída, apenas `Cancelar` é exibido.
