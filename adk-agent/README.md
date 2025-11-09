# FindHaven ADK Agent

This is the Google Agent Development Kit (ADK) agent for FindHaven's chat system.

## Architecture

The ADK agent provides:
- **Natural conversations** with empathetic responses
- **Local resource search** from resources-data.json
- **Web search fallback** using Google Search grounding
- **Session management** for conversation continuity
- **Tool orchestration** for intelligent decision-making

## Deployment Instructions

### Prerequisites
1. Google Cloud Project with billing enabled
2. Vertex AI API enabled
3. `gcloud` CLI installed and configured

### Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Copy resources data
cp ../supabase/functions/chat/resources-data.json .

# Set environment variable
export GEMINI_API_KEY="your-gemini-api-key"

# Run locally
python main.py
```

Test with:
```bash
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{"message": "I need food", "session_id": "test-123", "stream": false}'
```

### Deploy to Google Cloud Run

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud run deploy findhaven-adk-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=projects/YOUR_PROJECT_ID/secrets/gemini-api-key:latest
```

### Update Lovable Secret

After deployment, copy the Cloud Run URL and update the `ADK_SERVICE_URL` secret in Lovable:

```
https://findhaven-adk-agent-xxxxx.a.run.app
```

## API Endpoints

### POST /query
Main chat endpoint

**Request:**
```json
{
  "message": "I need shelter for my family",
  "session_id": "uuid-v4",
  "stream": true
}
```

**Response (streaming):**
```
data: {"text": "I'd be happy to help..."}

data: {"recommendations": [{...}]}

data: [DONE]
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "FindHaven ADK Agent"
}
```

## How It Works

1. **User sends message** → Edge function receives chat request
2. **Edge function tries ADK** → Calls ADK_SERVICE_URL/query
3. **ADK agent processes** → Uses Gemini 2.5 Flash with tools
4. **Tool selection** → Agent decides to search local DB or web
5. **Local search first** → `search_local_resources()` queries JSON
6. **Web fallback** → If no matches, uses Google Search grounding
7. **Stream response** → SSE format back to edge function
8. **Edge function relays** → Streams to frontend
9. **Frontend displays** → Chat UI shows conversation + resource cards

## Fallback Behavior

If ADK fails (timeout, error, or not configured):
- Edge function automatically falls back to direct Gemini API
- Users experience no interruption
- Logs show "Falling back to direct Gemini API"

## Monitoring

View logs:
```bash
gcloud run logs read findhaven-adk-agent --project YOUR_PROJECT_ID
```

## Cost Optimization

- Uses Gemini 2.5 Flash (fast + cheap)
- Local search tool reduces web API calls
- 5-second timeout prevents hanging requests
- Streaming reduces memory usage

## Security

- API key stored in Google Secret Manager
- Cloud Run service account authentication
- No CORS restrictions (edge function handles CORS)
- Resources data embedded in container
