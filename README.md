Here's the whole thing in a single fenced block — copy everything between the triple-backtick lines (not including the backtick lines themselves), and it should preserve all line breaks correctly this time:

```
# 🏥 Healthcare Policy Compliance Assistant

> *"According to Policy A, you have 30 days. According to Policy B, you have 2. Most AI systems would just pick one and move on. This one won't."*

A retrieval-augmented generation (RAG) system that doesn't just answer healthcare policy questions — it **catches contradictions** across documents and refuses to sweep them under the rug.

🔗 **[Live Demo →](https://healthcare-rag-web-nine.vercel.app)**

---

## ⚡ The Problem

Healthcare policy documents are messy. The same question — *"what's the timely filing limit for claims?"* — can get five different answers depending on which document you pull from:

```
📄 POL-CLA-1584  →  30 days
📄 POL-CLA-1394  →  60 days
📄 POL-CLA-1415  →  2 days   ⚠️
📄 POL-CLA-1011  →  45 days
📄 POL-CLA-1234  →  3 days   ⚠️
```

A naive chatbot retrieves the top match and answers with false confidence. In a compliance context, that's not a bug — that's a liability. 🚨

This system is built to do the opposite: **surface the conflict, cite every source, let the human decide.**

---

## 🔄 How It Flows

```
   📁 Policy Corpus (2,500 sections)
          │
          ▼
   🧠 Embed with text-embedding-3-small
          │
          ▼
   🗄️  Store in Supabase (pgvector)
          │
   ┌──────┴──────┐
   │   ❓ User    │
   │   Question   │
   └──────┬──────┘
          ▼
   🧠 Embed the question
          │
          ▼
   🔍 Vector similarity search  →  top-N matching sections
          │
          ▼
   🤖 gpt-4o-mini  (temp = 0)
      "cite your sources, flag conflicts, don't guess"
          │
          ▼
   💬 Answer + [1][2][3] citations
          │
          ▼
   📋 Sources panel — title, category, similarity, content
```

---

## 🛠️ Built With

| Layer | Tech |
|---|---|
| 🎨 Frontend/Backend | Next.js (App Router) + TypeScript + Tailwind |
| 🗄️ Vector Store | Supabase (Postgres + pgvector) |
| 🧠 Embeddings | OpenAI `text-embedding-3-small` |
| 💬 Generation | OpenAI `gpt-4o-mini` |
| ☁️ Deployment | Vercel |

---

## 💬 See It In Action

**Q:** *What is the timely filing limit for claims?*

**A:**
> The timely filing limits for claims vary across different policy sections:
> - 30 calendar days (POL-CLA-1584) [1]
> - 60 calendar days (POL-CLA-1394) [2]
> - 2 calendar days (POL-CLA-1415) [3]
> - 45 calendar days (POL-CLA-1011) [4]
> - 3 calendar days (POL-CLA-1234) [5]
>
> ⚠️ **There is conflicting information regarding the timely filing limits for claims.**

No guessing. No cherry-picking. Just the truth, however inconvenient. ✅

---

## 🚀 Run It Locally

```bash
git clone https://github.com/Manik-Poduri/healthcare-rag-web.git
cd healthcare-rag-web
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

Ingest the corpus, then launch:
```bash
npm run ingest
npm run dev
```

Open **http://localhost:3000** and start asking questions. 🎉

---

## 📂 Project Structure

```
src/
 ┣ 📂 app/
 ┃ ┣ 📄 page.tsx              → UI: question box, examples, answer + sources
 ┃ ┗ 📂 api/
 ┃   ┣ 📄 ask/route.ts        → full RAG: embed → retrieve → generate
 ┃   ┗ 📄 search/route.ts     → retrieval only
 ┗ 📂 lib/
   ┗ 📄 supabase.ts           → Supabase clients (anon + service role)
scripts/
 ┗ 📄 ingest.ts                → embeds + loads the corpus
data/
 ┗ 📄 policy_corpus.jsonl      → 2,500 policy sections
```

---

⭐ *If nothing else, remember: the interesting part of this project isn't the retrieval — it's what it does when the retrieved answers disagree.*
```