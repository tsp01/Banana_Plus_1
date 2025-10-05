// generatePapers.ts
// Node.js script to generate papers.ts from studies and studies_abstracts

import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Database } = sqlite3.verbose();

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paper interface
interface Paper {
  title: string;          // Paper title (must be unique for filtering/timeline)
  authors: string;        // Comma-separated list of author names
  year: number;           // Publication year
  keywords: string[];     // Topical tags used for filtering
  citations?: number;     // Optional: number of citations
  abstractSnippet: string; // Short preview of the abstract
}

// Helper: run a query and get all rows
function allAsync(db: sqlite3.Database, query: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// Convert a merged row to a Paper
function rowToPaper(study: any, abstract: any): Paper {
  let year = 0;
  if (study.date) {
    const match = study.date.match(/\b(19|20)\d{2}\b/);
    if (match) year = parseInt(match[0]);
  }

  return {
    title: study.title || abstract?.title || "Unknown Title",
    authors: study.author || "Unknown Author",
    year,
    keywords: [],
    citations: study.citations || undefined,
    abstractSnippet: abstract?.abstract ? abstract.abstract.slice(0, 200) + "..." : "",
  };
}

// Main function
async function generateFile() {
  const allPapers: Paper[] = [];

  // Load studies.db
  const studiesDB = new Database(path.join(__dirname, "../../../studies.db"));
  const studiesRows = await allAsync(
    studiesDB,
    "SELECT id, title, authors, date, citation_count FROM studies"
  );
  studiesDB.close();

  // Load studies_abstracts.db
  const abstractsDB = new Database(path.join(__dirname, "../../../studies_abstracts.db"));
  const abstractsRows = await allAsync(
    abstractsDB,
    "SELECT id, title, abstract FROM studies_abstracts"
  );
  abstractsDB.close();

  // Build lookup table for abstracts by primary key
  const abstractLookup: Record<number, any> = {};
  for (const a of abstractsRows) {
    abstractLookup[a.id] = a;
  }

  // Merge each study with its abstract (if it exists)
  for (const s of studiesRows) {
    const abs = abstractLookup[s.id];
    allPapers.push(rowToPaper(s, abs));
  }

  // Write to papers.ts
  const outputFile = path.join(__dirname, "papers.ts");
  const fileContent =
    "// This file is auto-generated. Do not edit manually.\n\n" +
    "export interface Paper {\n" +
    "  title: string;\n" +
    "  authors: string;\n" +
    "  year: number;\n" +
    "  keywords: string[];\n" +
    "  citations?: number;\n" +
    "  abstractSnippet: string;\n" +
    "}\n\n" +
    "export const papers: Paper[] = " +
    JSON.stringify(allPapers, null, 2) +
    ";\n";

  fs.writeFileSync(outputFile, fileContent, "utf-8");
  console.log(`✅ Generated papers.ts with ${allPapers.length} papers`);
}

// Run the script
generateFile().catch((err) => console.error(err));
