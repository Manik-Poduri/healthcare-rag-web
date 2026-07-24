import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type MatchedSection = {
  section_id: string;
  doc_id: string;
  category: string;
  title: string;
  content: string;
  similarity: number;
};

export async function POST(req: NextRequest) {
  try {
    const { query, matchCount = 5 } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "query" field.' },
        { status: 400 }
      );
    }

    // 1. Embed the user's query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Retrieve the most relevant policy sections
    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      'match_policy_sections',
      {
        query_embedding: queryEmbedding,
        match_count: matchCount,
      }
    );

    if (matchError) {
      console.error('Supabase RPC error:', matchError);
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    const sections: MatchedSection[] = matches ?? [];

    if (sections.length === 0) {
      return NextResponse.json({
        query,
        answer: 'No relevant policy sections were found for this question.',
        sources: [],
      });
    }

    // 3. Build a context block from the retrieved sections
    const context = sections
      .map(
        (s, i) =>
          `[${i + 1}] (doc_id: ${s.doc_id}, section_id: ${s.section_id}, category: ${s.category})\nTitle: ${s.title}\nContent: ${s.content}`
      )
      .join('\n\n');

    // 4. Ask the LLM to answer using ONLY the retrieved context
    const systemPrompt = `You are a healthcare policy compliance assistant. Answer the user's question using ONLY the provided policy sections below. 

Rules:
- Cite the section number(s) (e.g. "[1]") that support each part of your answer.
- If different sections give conflicting information (e.g. different policy documents specify different limits for the same topic), explicitly say so and list each value with its doc_id — do NOT pick one arbitrarily.
- If the provided sections do not contain enough information to answer, say so clearly instead of guessing.`;

    const userPrompt = `Policy sections:\n\n${context}\n\nQuestion: ${query}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
    });

    const answer = completion.choices[0]?.message?.content ?? '';

    return NextResponse.json({
      query,
      answer,
      sources: sections,
    });
  } catch (err) {
    console.error('Ask API error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}