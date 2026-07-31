// AI Document Search — indexing + semantic retrieval server functions.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface IndexedDocument {
  id: string;
  title: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: string;
  student_name: string | null;
  author_name: string | null;
  uploaded_by: string;
  uploader_name: string | null;
  index_status: "pending" | "indexing" | "ready" | "failed";
  index_error: string | null;
  chunk_count: number;
  text_preview: string | null;
  created_at: string;
}

export interface SearchHit {
  document: IndexedDocument;
  score: number;
  bestChunkIndex: number;
  bestSectionLabel: string | null;
  snippet: string;
  supporting: { chunkIndex: number; snippet: string; score: number }[];
}

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IndexedDocument[]> => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as IndexedDocument[];
  });

const RegisterInput = z.object({
  title: z.string().min(1).max(240),
  storage_path: z.string().min(1),
  mime_type: z.string().max(160).optional(),
  size_bytes: z.number().int().nonnegative().optional(),
  category: z.string().max(80).optional(),
  student_name: z.string().max(120).optional(),
  author_name: z.string().max(120).optional(),
  uploader_name: z.string().max(120).optional(),
});

/** Registers an uploaded file so it appears immediately, then it is indexed. */
export const registerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegisterInput.parse(input))
  .handler(async ({ data, context }): Promise<IndexedDocument> => {
    const { data: row, error } = await (context.supabase as any)
      .from("documents")
      .insert({
        title: data.title,
        storage_path: data.storage_path,
        mime_type: data.mime_type ?? null,
        size_bytes: data.size_bytes ?? null,
        category: data.category ?? "General",
        student_name: data.student_name || null,
        author_name: data.author_name || null,
        uploader_name: data.uploader_name || null,
        uploaded_by: context.userId,
        index_status: "pending",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as IndexedDocument;
  });

/** Downloads the stored file, extracts text, chunks and embeds it. */
export const indexDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; chunks: number }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured for this workspace.");

    const { data: doc, error: docErr } = await context.supabase
      .from("documents")
      .select("*")
      .eq("id", data.id)
      .single();
    if (docErr || !doc) throw new Error(docErr?.message ?? "Document not found");
    const document = doc as unknown as IndexedDocument;

    await context.supabase.from("documents").update({ index_status: "indexing", index_error: null }).eq("id", data.id);

    try {
      const { data: file, error: dlErr } = await context.supabase.storage
        .from("documents")
        .download(document.storage_path);
      if (dlErr || !file) throw new Error(dlErr?.message ?? "Could not read the stored file.");

      const { extractDocumentText, chunkText, embedTexts } = await import("./doc-extract.server");
      const buffer = await file.arrayBuffer();
      const text = await extractDocumentText({
        buffer,
        mime: document.mime_type ?? file.type ?? "",
        filename: document.title,
        apiKey,
      });

      const metaChunk = [
        `Document: ${document.title}`,
        `Category: ${document.category}`,
        document.student_name ? `Student: ${document.student_name}` : "",
        document.author_name ? `Written by: ${document.author_name}` : "",
        document.uploader_name ? `Uploaded by: ${document.uploader_name}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const bodyChunks = chunkText(text);
      const chunks = [metaChunk, ...bodyChunks];
      const embeddings = await embedTexts(chunks, apiKey);

      await context.supabase.from("document_chunks").delete().eq("document_id", data.id);
      const rows = chunks.map((content, i) => ({
        document_id: data.id,
        chunk_index: i,
        content,
        section_label: i === 0 ? "Document summary" : `Section ${i}`,
        embedding: JSON.stringify(embeddings[i]),
      }));
      for (let i = 0; i < rows.length; i += 40) {
        const { error: insErr } = await (context.supabase as any)
          .from("document_chunks")
          .insert(rows.slice(i, i + 40));
        if (insErr) throw new Error(insErr.message);
      }

      await (context.supabase as any)
        .from("documents")
        .update({
          index_status: "ready",
          chunk_count: rows.length,
          text_preview: text.slice(0, 400),
          index_error: null,
        })
        .eq("id", data.id);

      return { ok: true, chunks: rows.length };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Indexing failed";
      await (context.supabase as any)
        .from("documents")
        .update({ index_status: "failed", index_error: message.slice(0, 400) })
        .eq("id", data.id);
      throw new Error(message);
    }
  });

function lexicalBoost(query: string, doc: IndexedDocument): number {
  const tokens = query.toLowerCase().match(/[a-z0-9']{3,}/g) ?? [];
  if (!tokens.length) return 0;
  const haystack = [doc.title, doc.category, doc.student_name, doc.author_name, doc.uploader_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hits = tokens.filter((t) => haystack.includes(t)).length;
  return Math.min(0.12, hits * 0.04);
}

export const searchDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(400) }).parse(input))
  .handler(async ({ data, context }): Promise<SearchHit[]> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured for this workspace.");

    const { embedTexts } = await import("./doc-extract.server");
    const [queryVector] = await embedTexts([data.query], apiKey);

    const { data: matches, error } = await (context.supabase as any).rpc("match_document_chunks", {
      query_embedding: JSON.stringify(queryVector),
      match_count: 40,
    });
    if (error) throw new Error(error.message);

    const rows = (matches ?? []) as {
      chunk_id: string;
      document_id: string;
      chunk_index: number;
      content: string;
      section_label: string | null;
      similarity: number;
    }[];
    if (!rows.length) return [];

    const ids = Array.from(new Set(rows.map((r) => r.document_id)));
    const { data: docs, error: docErr } = await context.supabase.from("documents").select("*").in("id", ids);
    if (docErr) throw new Error(docErr.message);
    const byId = new Map((docs ?? []).map((d: any) => [d.id as string, d as IndexedDocument]));

    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = grouped.get(row.document_id) ?? [];
      list.push(row);
      grouped.set(row.document_id, list);
    }

    const hits: SearchHit[] = [];
    for (const [docId, chunkRows] of grouped) {
      const document = byId.get(docId);
      if (!document) continue;
      const sorted = [...chunkRows].sort((a, b) => b.similarity - a.similarity);
      const best = sorted[0];
      hits.push({
        document,
        score: Math.min(1, best.similarity + lexicalBoost(data.query, document)),
        bestChunkIndex: best.chunk_index,
        bestSectionLabel: best.section_label,
        snippet: best.content.slice(0, 420),
        supporting: sorted.slice(1, 3).map((r) => ({
          chunkIndex: r.chunk_index,
          snippet: r.content.slice(0, 220),
          score: r.similarity,
        })),
      });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, 15);
  });

export const getDocumentChunks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("document_chunks")
      .select("chunk_index, content, section_label")
      .eq("document_id", data.id)
      .order("chunk_index", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as { chunk_index: number; content: string; section_label: string | null }[];
  });

export const signDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("documents")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error: sErr } = await context.supabase.storage.from("documents").remove([data.path]);
    if (sErr && !sErr.message.toLowerCase().includes("not found")) throw new Error(sErr.message);
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
