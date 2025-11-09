# Copy resources-data.json to ADK agent directory
cp supabase/functions/chat/resources-data.json adk-agent/

# Navigate to ADK directory
cd adk-agent

# Deploy to Google Cloud Run
gcloud run deploy findhaven-adk-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Get the service URL and update ADK_SERVICE_URL secret in Lovable
