# 🗄️ Backend & Agent Code

This folder contains all backend and AI agent logic for NestNote.

## Structure

```
supabase/
├── functions/         # Edge Functions (serverless backend)
│   └── chat/         # 🤖 AI Agent chat endpoint
├── migrations/       # 🗄️ Database schema changes
└── config.toml       # Backend configuration
```

## For Backend Developers

### Database Work
- Create new tables and migrations in `migrations/` folder
- Use SQL to define schema, RLS policies, triggers
- Test with sample data in Cloud tab

### Edge Functions
- Add new serverless functions in `functions/` folder
- Each function has its own folder with `index.ts`
- Deployed automatically on save
- Logs available in Cloud tab

### Environment Variables
- Secrets managed in Cloud → Settings → Secrets
- Access in functions: `Deno.env.get('SECRET_NAME')`

## For Agent/AI Developers

### Chat Agent
- Main logic: `functions/chat/index.ts`
- Uses Google Gemini 2.5 Flash
- Streaming SSE responses
- System prompts and safety settings configured here

### Future Agent Features
- Add function calling/tools for database queries
- Implement RAG with vector search
- Add grounding with external APIs
- Multi-agent coordination

## Key Files

- `functions/chat/index.ts` - 🤖 Main AI agent endpoint
- `config.toml` - Function configuration and JWT settings

## Resources

- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)
- [Edge Functions Guide](https://docs.lovable.dev/features/cloud#edge-functions)
- [Google Gemini API](https://ai.google.dev/docs)
