# Prompts Used

## Prompt 1

Create a basic Transcript Generator using Next.js App Router and Google Gemini (free API).
Requirements:
Frontend:
- Create a page at /app/page.tsx
- Add:
  - Textarea for input text (meeting transcript)
  - "Generate Action Items" button
  - Section to display result
- On button click:
  - Send POST request to /api/transcript
  - Body: { text: inputText }
- Display returned action items in a list or cards
Backend (Next.js API Route):
- Create route: /app/api/transcript/route.ts
- Handle POST request
- Read { text } from request body
Use Google Gemini via @google/genai 
Extract action items from the following meeting transcript. to 
Return ONLY valid JSON array in this format:
[
  {
    "task": "short task description",
    "owner": "person responsible or null",
    "dueDate": "YYYY-MM-DD if mentioned, otherwise null"
  }
]
- Generate content using Gemini
- Get text response
- Remove markdown (```json if present)
- Parse using JSON.parse
Response format:
{
  actions: [
    {
      task: "...",
      owner: "...",
      dueDate: "..."
    }
  ]
}
Basic handling:
- If text is empty → return 400 error
- If JSON parsing fails → return empty array
Focus only on frontend → API → Gemini → structured response.

## Prompt 2

Can you make the home page good it is very dull

## Prompt 3

Add MongoDB persistence to the existing Next.js Gemini action items app.
Requirements:
1. Use MongoDB.
2. Create a connection utility in /lib/mongodb.ts that exports getDB().
Collection: transcripts
Document structure:
{
  text: String,
  actions: [
    {
      task: String,
      owner: String,
      dueDate: String,
      status: "open"
    }
  ],
  createdAt: Date
}
API changes:
POST /api/transcript
- After getting actions from Gemini
- Insert document into "transcripts" collection
- Return saved document
Create new API:
GET /api/history
- Fetch all transcripts
- Sort by createdAt (latest first)
- Return:
{ transcripts: [...] }
Frontend:
- On page load, call /api/history
- Display all transcripts
Keep it simple.
No authentication.
No extra dependencies.
Focus only on save + fetch history.

## Prompt 4

Once a transcript is created, the user should be able to Click on a transcript from the history list to open its details page.
View the full transcript text at the top.
See all action items associated with that transcript listed below the text.
Perform CRUD operations on the action items:
Create/Add a new action item
Edit an existing action item
Delete an action item
Mark an action item as done or open
Filter action items by status:
Show all action items
Show only open items
Show only done items

## Prompt 5

Can you use context and only refetch the transcript if not in context

## Prompt 6

Can you add feature to add tags to each actions like Priority tags: High, Medium, Low

## Prompt 7

Remove this label and classname can easily found through priority_options directly no need too complex

## Prompt 8

Can you also add a status page that shows health of backend, database, and llm connection.