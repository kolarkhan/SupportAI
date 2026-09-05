/**
 * Step 3 of the RAG pipeline: split cleaned text into overlapping chunks
 * sized for good embedding quality and precise retrieval.
 */
export interface Chunk {
  content: string;
  index: number;
  tokenCount: number;
}

const CHUNK_SIZE_CHARS = 900; // ~220 tokens
const CHUNK_OVERLAP_CHARS = 150;

export function chunkText(text: string, chunkSize = CHUNK_SIZE_CHARS, overlap = CHUNK_OVERLAP_CHARS): Chunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: Chunk[] = [];
  let buffer = "";

  const pushBuffer = () => {
    const trimmed = buffer.trim();
    if (trimmed.length > 0) {
      chunks.push({ content: trimmed, index: chunks.length, tokenCount: estimateTokens(trimmed) });
    }
    buffer = "";
  };

  for (const para of paragraphs) {
    if (para.length > chunkSize) {
      // Long paragraph: hard-split with overlap.
      pushBuffer();
      let start = 0;
      while (start < para.length) {
        const end = Math.min(start + chunkSize, para.length);
        chunks.push({
          content: para.slice(start, end).trim(),
          index: chunks.length,
          tokenCount: estimateTokens(para.slice(start, end)),
        });
        start += chunkSize - overlap;
      }
      continue;
    }

    if ((buffer + "\n\n" + para).length > chunkSize) {
      pushBuffer();
      buffer = para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  pushBuffer();

  return chunks.filter((c) => c.content.length > 20);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
