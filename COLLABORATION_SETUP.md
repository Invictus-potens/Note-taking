# Sistema de Colaboração do Kanban

Este guia explica como implementar um sistema completo de colaboração para o Kanban board, permitindo que múltiplos usuários trabalhem juntos em tempo real.

## 🚀 Funcionalidades

### ✅ **Sistema de Permissões**
- **Owner**: Controle total do board
- **Admin**: Pode gerenciar membros e board, mas não deletar
- **Editor**: Pode adicionar/editar cards e colunas
- **Viewer**: Apenas visualização

### ✅ **Gestão de Membros**
- Convite usuários por email
- Aceitar/rejeitar convites
- Gerenciar roles dos membros
- Remover membros

### ✅ **Boards Colaborativos**
- Múltiplos boards por usuário
- Compartilhamento seguro
- Controle de acesso granular

## 📋 Pré-requisitos

1. **Banco de Dados**: Execute o script SQL em `lib/collaboration-schema.sql`
2. **Supabase**: Configure as políticas RLS (Row Level Security)
3. **Autenticação**: Sistema de login funcionando

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Boards do Kanban
kanban_boards (id, name, description, owner_id, is_public, created_at, updated_at)

-- Membros dos boards
kanban_board_members (id, board_id, user_id, role, invited_by, status, accepted_at)

-- Convites pendentes
kanban_board_invitations (id, board_id, email, role, invited_by, token, status, expires_at)
```

### Relacionamentos
- `kanban_columns` e `kanban_cards` agora têm `board_id`
- Membros são vinculados aos boards através de `kanban_board_members`
- Convites são gerenciados através de `kanban_board_invitations`

## 🔧 Implementação

### 1. Execute o Schema SQL

```bash
# No Supabase SQL Editor, execute:
\i lib/collaboration-schema.sql
```

### 2. Configure as Políticas RLS

O script já inclui as políticas básicas de segurança:

- Usuários só veem boards que possuem ou são membros
- Apenas owners/admins podem gerenciar membros
- Convites são seguros com tokens únicos

### 3. Integre os Componentes

#### Board Selector
```tsx
import BoardSelector from './components/Kanban/BoardSelector';

// No seu componente principal
<BoardSelector
  selectedBoardId={currentBoardId}
  onBoardSelect={setCurrentBoardId}
  isDark={isDark}
/>
```

#### Collaboration Modal
```tsx
import CollaborationModal from './components/Kanban/CollaborationModal';

// No header do Kanban
<button onClick={() => setShowCollaboration(true)}>
  <i className="ri-team-line"></i>
  Collaborate
</button>

<CollaborationModal
  boardId={currentBoardId}
  isOpen={showCollaboration}
  onClose={() => setShowCollaboration(false)}
  isDark={isDark}
/>
```

### 4. Use o Hook de Colaboração

```tsx
import { useCollaboration } from './lib/useCollaboration';

const MyComponent = ({ boardId }) => {
  const {
    board,
    members,
    permissions,
    inviteUser,
    removeMember,
    updateMemberRole,
    loading,
    error
  } = useCollaboration(boardId);

  // Use as permissões para controlar a UI
  if (!permissions.canView) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {permissions.canInviteUsers && (
        <button onClick={() => inviteUser({ email: 'user@example.com', role: 'editor' })}>
          Invite User
        </button>
      )}
    </div>
  );
};
```

## 🎯 Fluxo de Trabalho

### 1. Criar um Board
```tsx
const { createBoard } = useCollaboration();
const newBoard = await createBoard({
  name: "Projeto Colaborativo",
  description: "Board para trabalho em equipe"
});
```

### 2. Convidar Usuários
```tsx
const { inviteUser } = useCollaboration(boardId);
await inviteUser({
  email: "colaborador@exemplo.com",
  role: "editor",
  message: "Venha trabalhar conosco!"
});
```

### 3. Aceitar Convite
```tsx
const { acceptInvitation } = useCollaboration();
await acceptInvitation(token); // token do email
```

### 4. Gerenciar Permissões
```tsx
const { updateMemberRole, removeMember } = useCollaboration(boardId);
await updateMemberRole(memberId, "admin");
await removeMember(memberId);
```

## 🔒 Segurança

### Políticas RLS Implementadas
- **Boards**: Apenas owners e membros podem ver
- **Membros**: Apenas membros podem ver lista de membros
- **Convites**: Apenas admins podem criar convites
- **Colunas/Cards**: Apenas membros do board podem acessar

### Tokens de Convite
- Tokens únicos e seguros
- Expiração automática (7 dias)
- Validação de status

## 📧 Sistema de Emails (TODO)

Para completar o sistema, implemente o envio de emails:

```tsx
// Em useCollaboration.ts, após criar o convite:
const sendInvitationEmail = async (invitation) => {
  const inviteUrl = `${window.location.origin}/invite/${invitation.token}`;
  
  // Integre com seu serviço de email (SendGrid, AWS SES, etc.)
  await emailService.send({
    to: invitation.email,
    subject: `Convite para ${board.name}`,
    template: 'invitation',
    data: {
      boardName: board.name,
      inviterName: user.full_name,
      inviteUrl,
      role: invitation.role
    }
  });
};
```

## 🎨 Personalização

### Temas
Todos os componentes suportam modo claro/escuro:
```tsx
<CollaborationModal isDark={isDark} />
<BoardSelector isDark={isDark} />
```

### Estilos
Use Tailwind CSS para personalizar:
```css
.collaboration-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg;
}
```

## 🚀 Próximos Passos

1. **Tempo Real**: Implemente Supabase Realtime para atualizações em tempo real
2. **Notificações**: Sistema de notificações para mudanças
3. **Atividade**: Log de atividades do board
4. **Comentários**: Sistema de comentários nos cards
5. **Anexos**: Upload de arquivos para cards

## 📝 Exemplo de Uso Completo

```tsx
import React, { useState } from 'react';
import BoardSelector from './components/Kanban/BoardSelector';
import CollaborationModal from './components/Kanban/CollaborationModal';
import KanbanBoard from './components/Kanban/KanbanBoard';
import { useCollaboration } from './lib/useCollaboration';

const KanbanPage = () => {
  const [currentBoardId, setCurrentBoardId] = useState<string>();
  const [showCollaboration, setShowCollaboration] = useState(false);
  const { permissions } = useCollaboration(currentBoardId);

  return (
    <div className="h-screen flex">
      {/* Sidebar com seleção de boards */}
      <div className="w-80 p-4 border-r">
        <BoardSelector
          selectedBoardId={currentBoardId}
          onBoardSelect={setCurrentBoardId}
        />
      </div>

      {/* Área principal do Kanban */}
      <div className="flex-1 flex flex-col">
        {/* Header com botão de colaboração */}
        <div className="p-4 border-b flex justify-between items-center">
          <h1>Kanban Board</h1>
          {permissions.canInviteUsers && (
            <button
              onClick={() => setShowCollaboration(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <i className="ri-team-line mr-2"></i>
              Collaborate
            </button>
          )}
        </div>

        {/* Board do Kanban */}
        {currentBoardId && (
          <KanbanBoard
            boardId={currentBoardId}
            permissions={permissions}
          />
        )}
      </div>

      {/* Modal de colaboração */}
      <CollaborationModal
        boardId={currentBoardId}
        isOpen={showCollaboration}
        onClose={() => setShowCollaboration(false)}
      />
    </div>
  );
};
```

## 🎉 Resultado

Com esta implementação, você terá um sistema completo de colaboração que permite:

- ✅ Múltiplos usuários trabalhando no mesmo board
- ✅ Controle granular de permissões
- ✅ Sistema seguro de convites
- ✅ Interface intuitiva para gerenciar membros
- ✅ Suporte a múltiplos boards
- ✅ Design responsivo e acessível

O sistema está pronto para uso e pode ser facilmente expandido com funcionalidades adicionais conforme necessário! 