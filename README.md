# Meeting Transcript Action Items Generator

Transform meeting transcripts into structured action items automatically.

## 🚀 Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RatnadeepRoy01/Transcript-Notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Add MongoDB URI**
   - Get your URI from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Add to `.env`:
     ```
     MONGODB_URI=your_mongodb_uri
     ```

5. **Add Gemini API Key**
   - Get your key from [Google AI Studio](https://aistudio.google.com/apikey)
   - Add to `.env`:
     ```
     GEMINI_API_KEY=your_api_key
     ```

6. **Run the app**
   ```bash
   npm run dev
   ```

Access the app at `http://localhost:3000`

## 📋 How to Use

1. **Paste Transcript** - Copy your meeting transcript and paste it into the text box.

2. **Generate Action Items** - Click "Extract Action Items" to process using AI and extract tasks.

3. **View Action Items** - See all tasks with owner, due date, and status information.

4. **Edit / Add / Delete Tasks** - Modify tasks as needed or add new ones manually.

5. **Filter Tasks** - Use filters to view all, open, or completed tasks.

6. **Check History** - Access the transcripts you've previously processed.

## ✅ Features Done

- Paste a meeting transcript and generate structured action items
- Extracted action items include: Task, Owner, Due date, Status (open/done)
- Store transcripts and action items in MongoDB
- View last transcripts (history)
- Edit, add, delete action items
- Filter action items: Open / Done
- Add tags based on priority

## ❌ Features Not Done

- Advanced editor