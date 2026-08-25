# StudyNotes AI

📚 StudyNotes AI

Your Notes. Your Knowledge. Your AI Study Partner.

StudyNotes AI is an AI-powered study platform for students to discover, upload, save, and learn from study notes.

✨ Features

- 🔍 Search and filter notes by subject, topic, branch & semester
- 📤 Upload and share study materials
- ⭐ Save/bookmark useful notes
- 📥 View and download notes
- 🤖 AI Study Assistant for study-related questions
- 📝 AI-generated summaries, MCQs, exam answers & viva questions
- 🔐 Secure authentication with Supabase
- 📊 Student dashboard
- 🛡️ Admin & content management

🛠️ Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Supabase
- Database: PostgreSQL
- Storage: Supabase Storage
- Authentication: Supabase Auth
- AI: OpenAI API
- Deployment: Vercel
- Version Control: GitHub

🏗️ Architecture

Student
   ↓
Next.js → Vercel
   ↓
Supabase ─── PostgreSQL
   ├──────── Auth
   └──────── Storage
   ↓
AI API

⚙️ Environment Variables


NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key

⚠️ Never commit ".env.local" or expose secret API keys.

🚀 Run Locally

git clone https://github.com/yourusername/studynotes-ai.git
cd studynotes-ai
npm install
npm run dev

Open "http://localhost:3000".

🔮 Future Plans

- 📄 Ask AI questions about uploaded PDFs
- 🧠 RAG-based learning
- 🎯 AI quizzes & flashcards
- 🔎 Semantic search
- 📊 Personalized learning analytics

👨‍💻 Author

Mukundraj Dhumal
Engineering Student | Developer

GitHub -: https://github.com/dhumalmukundraj-max
LinkedIn -: https://www.linkedin.com/in/mukundraj

---

⭐ Learn smarter. Share knowledge. Ask AI.