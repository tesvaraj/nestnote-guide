# FindHaven ADK Agent

Google Agent Development Kit (ADK) agent for FindHaven's chat system. Helps people experiencing homelessness find resources and support in Sacramento, CA.

## Overview

This agent uses Google ADK framework to provide an intelligent chat assistant that can:
- Search local Sacramento resources (shelters, food services, support organizations)
- Provide detailed information about specific resources
- Have warm, empathetic conversations with users
- Match users with appropriate resources based on their needs

## Architecture

- **`agent.py`**: Defines the ADK agent with tools and instructions
- **`service.py`**: HTTP service wrapper that exposes the agent via REST API
- **`main.py`**: Entry point for running the service
- **`resources-data.json`**: Local database of Sacramento resources

## Quick Start

### Prerequisites

- Python 3.9 or later
- Google API Key (Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey))
- Google Cloud SDK (for deployment)

### Local Development

1. **Navigate to the agent directory:**
```bash
cd adk-agent
```

2. **Run the setup script:**
```bash
./run_local.sh
```

Or manually:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export GOOGLE_API_KEY="your_api_key_here"
python main.py
```

3. **Test the service:**
```bash
# In another terminal
curl http://localhost:8080/health
```

The service will be running at `http://localhost:8080`

## Deployment to Google Cloud Run

### Option 1: Using the Deployment Script (Easiest)

```bash
cd adk-agent
export GOOGLE_API_KEY="your_api_key_here"
./deploy.sh
```

### Option 2: Manual Deployment

1. **Authenticate with Google Cloud:**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Enable required APIs:**
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

3. **Deploy to Cloud Run:**
```bash
cd adk-agent
gcloud run deploy findhaven-adk-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your_api_key_here \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

4. **Get the service URL:**
```bash
gcloud run services describe findhaven-adk-agent \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

### Option 3: Using Docker

1. **Build the Docker image:**
```bash
cd adk-agent
docker build -t findhaven-adk-agent .
```

2. **Run the container:**
```bash
docker run -p 8080:8080 \
  -e GOOGLE_API_KEY="your_api_key_here" \
  findhaven-adk-agent
```

## Integration with Supabase

### Step 1: Set Supabase Secret

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Secrets**
3. Add a new secret:
   - **Name**: `ADK_SERVICE_URL`
   - **Value**: Your deployed Cloud Run URL (e.g., `https://findhaven-adk-agent-xxxxx.a.run.app`)

### Step 2: Verify Integration

The Supabase edge function will automatically use the ADK service if `ADK_SERVICE_URL` is set. To verify:

1. Check Supabase function logs
2. You should see: `Using ADK agent service: https://...`

### Step 3: Test End-to-End

1. Send a message through your frontend chat
2. The request should flow: Frontend → Supabase → ADK Service → Gemini API
3. Check logs in both Supabase and Cloud Run to verify

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "FindHaven ADK Agent",
  "resources_loaded": true,
  "resource_categories": 2
}
```

### Query Endpoint
```bash
POST /query
Content-Type: application/json

{
  "message": "I need food",
  "messages": [
    {"role": "user", "content": "I need food"}
  ],
  "session_id": "optional-session-id",
  "stream": true
}
```

Response format (streaming):
- Text chunks: `{"choices": [{"delta": {"content": "text chunk"}}]}`
- Recommendations: `{"choices": [{"delta": {"recommendations": [...]}}]}`
- Done: `[DONE]`

## Testing

### Test Health Endpoint
```bash
curl http://localhost:8080/health
```

### Test Query Endpoint (Non-streaming)
```bash
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{"message": "I need food", "stream": false}'
```

### Test Query Endpoint (Streaming)
```bash
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{"message": "I need a youth shelter", "stream": true}'
```

### Run Test Script
```bash
./test_local.sh
```

## Monitoring

### View Cloud Run Logs
```bash
gcloud run logs read findhaven-adk-agent \
  --project YOUR_PROJECT_ID \
  --region us-central1 \
  --limit 50
```

### View Real-time Logs
```bash
gcloud run logs tail findhaven-adk-agent \
  --project YOUR_PROJECT_ID \
  --region us-central1
```

### Check Service Status
```bash
gcloud run services describe findhaven-adk-agent \
  --platform managed \
  --region us-central1
```

## Troubleshooting

### Service Status Check

If you see logs showing Gunicorn starting successfully but want to verify the service is working:

1. **Check the health endpoint:**
   ```bash
   curl https://your-service-url/health
   ```

2. **Use the diagnostic script:**
   ```bash
   ./check_service.sh https://your-service-url
   ```

3. **Check Cloud Run logs for errors:**
   ```bash
   gcloud run logs read findhaven-adk-agent --limit 100
   ```

### Common Issues

#### Service Starts But Returns Errors

**Symptoms:** Gunicorn starts, health check passes, but queries fail

**Solutions:**
1. Check if agent loaded successfully:
   ```bash
   curl https://your-service-url/health
   # Look for "agent_loaded": true
   ```

2. Verify API key is set:
   ```bash
   gcloud run services describe findhaven-adk-agent \
     --format="value(spec.template.spec.containers[0].env)"
   ```

3. Check if resources-data.json is present:
   ```bash
   # The file should be in the container
   # Verify it's not in .gcloudignore
   ```

#### Service Won't Start

1. **Check Python version:**
   ```bash
   python --version  # Should be 3.9+
   ```

2. **Check dependencies:**
   ```bash
   pip list | grep -E "google-adk|google-genai|flask"
   ```

3. **Check API key:**
   ```bash
   echo $GOOGLE_API_KEY
   ```

#### Function Calls Not Working

1. Check tool definitions in `agent.py`
2. Verify `resources-data.json` exists
3. Check logs for errors
4. Verify agent loaded: check `/health` endpoint response

#### CORS Issues

- Verify `flask-cors` is installed
- Check CORS headers in service response
- Verify Supabase allows the ADK service URL

#### Timeout Issues

Increase Cloud Run timeout:
```bash
gcloud run services update findhaven-adk-agent \
  --timeout 300 \
  --region us-central1
```

#### Memory Issues

If you see memory limit exceeded errors (e.g., "exceeded its allocated memory limit, using 601 MiB when only 512 MiB was available"):

1. **Update memory allocation:**
   ```bash
   gcloud run services update findhaven-adk-agent \
     --memory 1Gi \
     --cpu 1 \
     --region us-central1
   ```

2. **The code has been optimized to:**
   - Use lazy loading for resources data
   - Reduce Gunicorn workers from 4 to 2
   - Stream responses without storing all chunks in memory
   - Use thread-safe client initialization

3. **Check current memory usage:**
   ```bash
   gcloud run services describe findhaven-adk-agent \
     --format="value(spec.template.spec.containers[0].resources.limits.memory)"
   ```

#### Agent Not Loading

If the health endpoint shows `"agent_loaded": false`:

1. Check Cloud Run logs for import errors
2. Verify all dependencies are installed
3. Check if `resources-data.json` exists in the container
4. Verify `agent.py` imports correctly

### Debugging Steps

1. **Check service health:**
   ```bash
   curl https://your-service-url/health | jq
   ```

2. **Test a simple query:**
   ```bash
   curl -X POST https://your-service-url/query \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "stream": false}' | jq
   ```

3. **View real-time logs:**
   ```bash
   gcloud run logs tail findhaven-adk-agent
   ```

4. **Check service configuration:**
   ```bash
   gcloud run services describe findhaven-adk-agent
   ```

## Tools

The agent has two main tools:

1. **search_local_resources**: Searches the local Sacramento resources database
   - Parameters: `service_category`, `user_filters` (optional)
   - Returns: List of matching organizations with recommendations

2. **get_resource_details**: Gets detailed information about a specific resource
   - Parameters: `resource_uuid`
   - Returns: Detailed organization information

## Environment Variables

### Required
- `GOOGLE_API_KEY` or `GEMINI_API_KEY`: Your Google API key

### Optional
- `PORT`: Port to run on (default: 8080)
- `DEBUG`: Enable debug mode (default: False)

## Cost Optimization

### Cloud Run Settings
```bash
# Set min instances to 0 (pay only when in use)
gcloud run services update findhaven-adk-agent \
  --min-instances 0 \
  --max-instances 10 \
  --region us-central1

# Use appropriate memory (512Mi is usually sufficient)
gcloud run services update findhaven-adk-agent \
  --memory 512Mi \
  --region us-central1
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for API keys
3. **Use Google Cloud Secret Manager** for production (recommended):
   ```bash
   # Create secret
   echo -n "your-api-key" | gcloud secrets create google-api-key --data-file=-
   
   # Deploy with secret
   gcloud run deploy findhaven-adk-agent \
     --update-secrets=GOOGLE_API_KEY=google-api-key:latest
   ```

## Resources Data

The `resources-data.json` file contains Sacramento area resources organized by service category:
- Homeless Youth Shelters
- Soup Kitchens
- (More categories can be added)

## Notes

- The agent uses Google ADK framework for structure but calls Gemini API directly for execution
- This hybrid approach provides ADK compatibility while maintaining production readiness
- For full ADK runtime features (sessions, memory, etc.), consider deploying to Vertex AI Agent Engine Runtime using `adk deploy`

## License

Copyright 2025 FindHaven
