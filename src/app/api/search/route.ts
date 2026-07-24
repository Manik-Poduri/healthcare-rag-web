import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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

    // 2. Search Supabase for the most similar policy sections
    const { data, error } = await supabaseAdmin.rpc('match_policy_sections', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ query, results: data });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}