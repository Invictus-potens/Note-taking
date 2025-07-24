# 📝 Scribe - Aplicativo de Notas Inteligente

Scribe é um aplicativo completo de gerenciamento de notas com funcionalidades avançadas como Kanban, calendário integrado, IA assistente e sistema de autenticação robusto.

![Scribe App](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 Funcionalidades Principais

### 📝 **Sistema de Notas**
- **Editor Rich Text**: Editor Quill com formatação completa
- **Organização por Pastas**: Crie e organize notas em pastas personalizadas
- **Sistema de Tags**: Marque notas com tags coloridas para fácil categorização
- **Busca Inteligente**: Pesquise por título, conteúdo ou tags
- **Fixar Notas**: Destaque notas importantes no topo da lista
- **Visualização Dividida**: Compare duas notas lado a lado
- **Drag & Drop**: Reorganize notas arrastando entre pastas

### 🏆 **Sistema Kanban**
- **Múltiplos Boards**: Crie e gerencie diferentes boards de tarefas
- **Colunas Personalizáveis**: Adicione, edite e remova colunas
- **Cards de Notas**: Transforme notas em cards do Kanban
- **Drag & Drop**: Mova cards entre colunas
- **Menu Integrado**: Acesso rápido aos boards via menu dropdown
- **Interface Intuitiva**: Design limpo e responsivo

### 📅 **Calendário Integrado**
- **Sincronização Outlook**: Integração completa com Microsoft Outlook
- **Eventos Personalizados**: Crie eventos com lembretes
- **Visualização Mensal**: Calendário interativo com navegação
- **Gestão de Eventos**: Edite, delete e configure lembretes
- **Autenticação OAuth**: Login seguro via Microsoft

### 🤖 **Assistente de IA**
- **Chat Inteligente**: Converse com IA para gerar conteúdo
- **Histórico de Conversas**: Mantenha histórico das interações
- **Integração com Notas**: Adicione respostas da IA diretamente às notas
- **Interface Flutuante**: Botão flutuante para acesso rápido
- **Respostas Contextuais**: IA entende o contexto das suas notas

### 🔐 **Sistema de Autenticação**
- **Registro Seguro**: Cadastro com confirmação por email
- **Login/Logout**: Autenticação via Supabase Auth
- **Recuperação de Senha**: Sistema de reset de senha
- **Proteção de Rotas**: Acesso restrito a usuários autenticados
- **Sessões Persistentes**: Mantenha-se logado entre sessões

### 🎨 **Interface e UX**
- **Tema Escuro/Claro**: Alternância entre temas
- **Design Responsivo**: Funciona em desktop e mobile
- **Animações Suaves**: Transições e micro-interações
- **Ícones Minimalistas**: Interface limpa e moderna
- **Acessibilidade**: Suporte a navegação por teclado

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para código mais seguro
- **Tailwind CSS**: Framework CSS utilitário
- **React Beautiful DnD**: Drag and drop para Kanban
- **React Quill**: Editor de texto rico
- **Lucide React**: Biblioteca de ícones
- **React Trello**: Componente Kanban

### **Backend & Banco de Dados**
- **Supabase**: Backend-as-a-Service
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Storage para arquivos
- **Supabase Auth**: Sistema de autenticação
- **Edge Functions**: Funções serverless

### **Integrações**

- **OpenAI API**: Assistente de IA
- **Remini Icons**: Ícones personalizados

### **Ferramentas de Desenvolvimento**
- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **PostCSS**: Processamento CSS
- **Autoprefixer**: Prefixos CSS automáticos

## 📦 Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+ 
- npm, yarn ou pnpm
- Conta Supabase
- Conta Microsoft Azure (para calendário)
- Chave OpenAI (para IA)

### **1. Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/scribe.git
cd scribe
```

### **2. Instale as Dependências**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### **3. Configure as Variáveis de Ambiente**
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-supabase

# Microsoft Outlook Calendar Integration
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=seu-client-id-microsoft
MICROSOFT_CLIENT_SECRET=seu-client-secret-microsoft
NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook-auth/callback

# OpenAI Configuration (Opcional)
OPENAI_API_KEY=sua-chave-openai
```

### **4. Configure o Supabase**

#### **Criar Projeto**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e chave anônima

#### **Configurar Banco de Dados**
Execute o script SQL em `lib/collaboration-schema.sql` no SQL Editor do Supabase:

```sql
-- Tabelas principais
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  folder TEXT DEFAULT 'all',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas Kanban
CREATE TABLE public.kanban_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.kanban_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  board_id UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  column_id UUID REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  board_id UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de Segurança (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas similares para outras tabelas...
```

### **5. Configure Microsoft Azure (Calendário)**

#### **Criar Aplicação Azure**
1. Acesse [Azure Portal](https://portal.azure.com)
2. Vá para Azure Active Directory > App registrations
3. Crie uma nova aplicação
4. Configure as URLs de redirecionamento:
   - `http://localhost:3000/api/outlook-auth/callback` (desenvolvimento)
   - `https://seu-dominio.com/api/outlook-auth/callback` (produção)
5. Solicite as permissões:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `Calendars.Read.Shared`
   - `User.Read`
6. Gere um Client Secret

### **6. Execute o Projeto**
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🎯 Como Usar

### **📝 Criando e Gerenciando Notas**

1. **Nova Nota**: Clique no botão "Nova Nota" na sidebar
2. **Editar**: Clique em qualquer nota para abrir o editor
3. **Organizar**: Use pastas e tags para organizar
4. **Buscar**: Use a barra de pesquisa para encontrar notas
5. **Fixar**: Clique no ícone de pin para destacar notas importantes

### **🏆 Usando o Kanban**

1. **Acessar**: Clique no botão 🏆 na barra superior
2. **Selecionar Board**: Use o menu dropdown para escolher um board
3. **Criar Colunas**: Adicione colunas como "A Fazer", "Em Progresso", "Concluído"
4. **Adicionar Cards**: Transforme notas em cards do Kanban
5. **Mover Cards**: Arraste cards entre colunas

### **📅 Gerenciando Calendário**

1. **Conectar**: Clique no botão de calendário para conectar com Outlook
2. **Criar Eventos**: Clique em qualquer data para criar um evento
3. **Configurar Lembretes**: Defina lembretes para seus eventos
4. **Editar/Deletar**: Clique em eventos para gerenciá-los

### **🤖 Usando o Assistente de IA**

1. **Abrir**: Clique no botão flutuante do assistente
2. **Fazer Perguntas**: Digite suas perguntas ou solicitações
3. **Adicionar às Notas**: Use o botão para adicionar respostas às notas
4. **Histórico**: Acesse conversas anteriores

## 🏗️ Estrutura do Projeto

```
scribe/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── AI/               # Componentes do assistente de IA
│   ├── Auth/             # Componentes de autenticação
│   ├── Calendar/         # Componentes do calendário
│   ├── Kanban/           # Componentes do Kanban
│   ├── Layout/           # Componentes de layout
│   ├── Notes/            # Componentes de notas
│   └── ui/               # Componentes de UI reutilizáveis
├── lib/                  # Utilitários e configurações
│   ├── authContext.tsx   # Contexto de autenticação
│   ├── supabaseClient.ts # Cliente Supabase
│   └── useCollaboration.ts # Hook de colaboração
├── types/                # Definições de tipos TypeScript
└── public/               # Arquivos estáticos
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
```

## 🚀 Deploy

### **Vercel (Recomendado)**
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### **Railway**
1. Conecte ao Railway
2. Configure as variáveis de ambiente
3. Deploy automático

### **Outros**
- Netlify
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues**: Reporte bugs e solicite features no GitHub
- **Documentação**: Consulte este README e os comentários no código
- **Comunidade**: Participe das discussões no GitHub

## 🔮 Roadmap

- [ ] **Sincronização Offline**: Funcionalidade offline com sincronização
- [ ] **Templates de Notas**: Templates pré-definidos para diferentes tipos de notas
- [ ] **Exportação**: Exportar notas em PDF, Markdown, etc.
- [ ] **Backup Automático**: Backup automático para Google Drive/Dropbox
- [ ] **Notas Colaborativas**: Compartilhamento e edição colaborativa
- [ ] **Integração com APIs**: Mais integrações (Slack, Trello, etc.)
- [ ] **Mobile App**: Aplicativo nativo para iOS/Android
- [ ] **Plugins**: Sistema de plugins para extensibilidade

---

**Desenvolvido com ❤️ usando Next.js, Supabase e TypeScript**