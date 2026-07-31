// Server-only text extraction for indexed documents.
// Office formats are OOXML zips (parsed with fflate); PDFs and images are read
// by the Lovable AI vision model so scanned/handwritten content is still indexed.
import { unzipSync, strFromU8 } from "fflate";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function xmlToText(xml: string, blockTags: string[]): string {
  let out = xml;
  for (const tag of blockTags) {
    out = out.replace(new RegExp(`</${tag}>`, "g"), "\n");
  }
  out = out.replace(/<[^>]+>/g, "");
  return out
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unzip(buffer: ArrayBuffer) {
  return unzipSync(new Uint8Array(buffer));
}

function extractDocx(buffer: ArrayBuffer): string {
  const files = unzip(buffer);
  const parts = ["word/document.xml", "word/footnotes.xml", "word/endnotes.xml"]
    .filter((p) => files[p])
    .map((p) => xmlToText(strFromU8(files[p]), ["w:p", "w:tr"]));
  return parts.join("\n\n").trim();
}

function extractPptx(buffer: ArrayBuffer): string {
  const files = unzip(buffer);
  const slides = Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/)![1]);
      const nb = Number(b.match(/slide(\d+)/)![1]);
      return na - nb;
    });
  return slides
    .map((name, i) => {
      const text = xmlToText(strFromU8(files[name]), ["a:p"]);
      return `Slide ${i + 1}\n${text}`;
    })
    .join("\n\n")
    .trim();
}

function extractXlsx(buffer: ArrayBuffer): string {
  const files = unzip(buffer);
  let shared: string[] = [];
  if (files["xl/sharedStrings.xml"]) {
    const xml = strFromU8(files["xl/sharedStrings.xml"]);
    shared = Array.from(xml.matchAll(/<si>([\s\S]*?)<\/si>/g)).map((m) =>
      xmlToText(m[1], ["a:p"]).replace(/\n+/g, " ").trim(),
    );
  }
  const sheets = Object.keys(files)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort();
  const out: string[] = [];
  sheets.forEach((name, i) => {
    const xml = strFromU8(files[name]);
    const rows = Array.from(xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)).map((rowMatch) => {
      const cells = Array.from(rowMatch[1].matchAll(/<c[^>]*?(?:\st="(\w+)")?[^>]*>([\s\S]*?)<\/c>/g)).map((c) => {
        const type = c[1];
        const raw = c[2];
        const v = raw.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        if (type === "s") return shared[Number(v)] ?? "";
        if (type === "inlineStr") return xmlToText(raw, []).trim();
        return v;
      });
      return cells.filter(Boolean).join(" | ");
    });
    const body = rows.filter(Boolean).join("\n");
    if (body) out.push(`Sheet ${i + 1}\n${body}`);
  });
  return out.join("\n\n").trim();
}

async function extractWithVision(
  base64: string,
  mime: string,
  filename: string,
  apiKey: string,
): Promise<string> {
  const isImage = mime.startsWith("image/");
  const content = isImage
    ? [
        {
          type: "text",
          text: "Transcribe every piece of text visible in this image. Then add one short line describing what the image shows. Output plain text only.",
        },
        { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
      ]
    : [
        {
          type: "text",
          text: "Extract the full text of this document, preserving headings and section order. Output plain text only, no commentary.",
        },
        { type: "file", file: { filename, file_data: `data:${mime};base64,${base64}` } },
      ];

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      reasoning_effort: "none",
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached while reading the document. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted — top up to keep indexing documents.");
    throw new Error(`Document reader failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export async function extractDocumentText(opts: {
  buffer: ArrayBuffer;
  mime: string;
  filename: string;
  apiKey: string;
}): Promise<string> {
  const { buffer, mime, filename, apiKey } = opts;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (mime.startsWith("text/") || ["txt", "md", "csv", "json", "rtf"].includes(ext)) {
    return new TextDecoder().decode(buffer).trim();
  }
  if (ext === "docx" || mime.includes("wordprocessingml")) return extractDocx(buffer);
  if (ext === "pptx" || mime.includes("presentationml")) return extractPptx(buffer);
  if (ext === "xlsx" || mime.includes("spreadsheetml")) return extractXlsx(buffer);
  if (ext === "pdf" || mime === "application/pdf" || mime.startsWith("image/")) {
    return extractWithVision(toBase64(buffer), mime || "application/pdf", filename, apiKey);
  }
  // Legacy .doc/.ppt/.xls binaries — salvage readable ASCII runs.
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const runs = decoded.match(/[\x20-\x7E]{6,}/g) ?? [];
  return runs.join(" ").replace(/\s{2,}/g, " ").trim();
}

export function chunkText(text: string, size = 1200, overlap = 150): string[] {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    if (end < clean.length) {
      const breakAt = clean.lastIndexOf("\n", end);
      const sentence = clean.lastIndexOf(". ", end);
      const cut = Math.max(breakAt, sentence);
      if (cut > i + size * 0.5) end = cut + 1;
    }
    const piece = clean.slice(i, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks.slice(0, 120);
}

export async function embedTexts(texts: string[], apiKey: string): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += 50) {
    const batch = texts.slice(i, i + 50);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: "google/gemini-embedding-2", input: batch }),
    });
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted — top up to keep indexing documents.");
      throw new Error(`Embedding failed (${res.status}): ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as { data: { index: number; embedding: number[] }[] };
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    vectors.push(...sorted.map((d) => d.embedding));
  }
  return vectors;
}
