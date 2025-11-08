# 📦 Features

This folder organizes code by feature/domain, making it easier for teams to work together.

## Structure

```
features/
├── chat/           # 🤖 AI Agent & Chat
├── resources/      # 📋 Resource Management
└── navigation/     # 🧭 Navigation Components
```

## For Frontend Developers

### UI Components
- All feature UI lives in `<feature>/components/`
- Shared UI components in `src/components/ui/`
- Use design system tokens from `index.css`

### State Management
- Feature-level hooks in `<feature>/hooks/`
- Shared hooks in `src/hooks/`

### Types
- Feature types in `<feature>/types.ts`
- Import from other features when needed

## For Agent/AI Developers

### Chat Feature (`chat/`)
- Frontend chat UI in `chat/components/ChatPanel.tsx`
- Backend agent logic in `supabase/functions/chat/index.ts`
- Message types and streaming logic here

### Adding Agent Capabilities
- Update types in `chat/types.ts`
- Add tools/functions in backend edge function
- Update UI to handle new response types

## For Backend Developers

### Integration Points
- Supabase client: `src/integrations/supabase/`
- Types auto-generated from database schema
- Edge functions in `supabase/functions/`

### Data Flow
1. Frontend calls edge function
2. Edge function queries database or AI
3. Response streams back to frontend
4. UI updates with new data

## Key Principles

- **Feature isolation**: Each feature is self-contained
- **Type safety**: TypeScript types for all data
- **Shared code**: Common UI/utils in `src/components/` and `src/lib/`
- **Clear boundaries**: Frontend → Backend → Agent clearly separated
