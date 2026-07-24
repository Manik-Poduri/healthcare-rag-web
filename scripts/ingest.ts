import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import readline from 'readline';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PolicySection = {
  doc_id: string;
  section_id: string;
  category: string;
  title: string;
  text: string;
};

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 20; // how many sections to embed per OpenAI call

async function readCorpus(filePath: string): Promise<PolicySection[]> {
  const sections: PolicySection[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      sections.push(JSON.parse(line));
    }
  }
  return sections;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

async function main() {
  const filePath = 'data/policy_corpus.jsonl';
  console.log(`Reading corpus from ${filePath}...`);
let sections = await readCorpus(filePath);
  console.log(`Loaded ${sections.length} sections.`);

  // TEMPORARY: limit to a small batch for testing
  //sections = sections.slice(0, 5);
  //console.log(`Testing with first ${sections.length} sections.`);

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);
    const texts = batch.map((s) => s.text);

    console.log(
      `Embedding batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
        sections.length / BATCH_SIZE
      )}...`
    );
    const embeddings = await embedBatch(texts);

    const rows = batch.map((section, idx) => ({
      doc_id: section.doc_id,
      section_id: section.section_id,
      category: section.category,
      title: section.title,
      content: section.text,
      embedding: embeddings[idx],
    }));

    const { error } = await supabaseAdmin
      .from('policy_sections')
      .upsert(rows, { onConflict: 'section_id' });

    if (error) {
      console.error('Error inserting batch:', error);
      process.exit(1);
    }
  }

  console.log('Ingestion complete!');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});