# AI_NOTES

## AI Usage
- Used **Google Gemini (free API)** via the `@google/genai` library.  
- Extracted **action items** (task, owner, due date) from pasted meeting transcripts.  
- Generated responses in a **structured JSON format** to store in MongoDB.  

## Manual Checks
- Verified that the extracted JSON is valid and correctly parsed.  
- Checked that all tasks have proper task descriptions, owner names, and valid due dates.  
- Implemented filters, CRUD operations, and history display manually.  
- Ensured frontend components display tasks correctly using ShadCN UI.  

## LLM and Provider
- **LLM:** Google Gemini (Free Tier)  
- **Provider:** Google Cloud  
- **Reason:** Provides structured outputs, reliable natural language understanding, and free access for development/testing.  

