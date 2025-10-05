// =============================================
// papers.ts
// =============================================
//
// This file defines the data model and dataset
// for all academic papers used in the application.
//
// Each paper record is typed using the `Paper` interface
// and is displayed in the left panel (`JournalBox`),
// filtered via the center panel, and optionally shown
// as a node in the right panel timeline.
//

// -------------------------------------------------
// Interface: Paper
// -------------------------------------------------
//
// Defines the structure of each paper entry.
// This ensures consistent data typing throughout
// the app (e.g., filtering, timeline events, display).
//
export interface Paper {
  title: string;          // Paper title (must be unique for filtering/timeline)
  authors: string;        // Comma-separated list of author names
  year: number;           // Publication year
  keywords: string[];     // Topical tags used for filtering
  citations?: number;     // Optional: number of citations (can affect node size or emphasis in timeline)
  abstractSnippet: string; // Short preview of the paper's abstract for display in JournalBox
}

// -------------------------------------------------
// Dataset: papers
// -------------------------------------------------
//
// Example dataset containing multiple paper entries.
// In production, this could be replaced with data fetched
// from a backend API or research database.
//

export const papers: Paper[] = [
  {
    title: 'HELP ME',
    authors: 'Alice, Bob',
    year: 1990,
    keywords: ['Quantum', 'Physics'],
    citations: 12, // Used for scaling timeline node size or relevance
    abstractSnippet:
      'This paper studies the behavior of quantum particles under extreme conditions. This paper studies the behavior of quantum particles under extreme conditions.',
  },
  {
    title: 'HELP ME2',
    authors: 'Alice, Bob',
    year: 1990,
    keywords: ['Quantum', 'Physics'],
    citations: 12,
    abstractSnippet:
      'This paper studies the behavior of quantum particles under extreme conditions. This paper studies the behavior of quantum particles under extreme conditions.',
  },
  {
    title: 'HELP ME3',
    authors: 'Alice, Bob',
    year: 1990,
    keywords: ['Quantum', 'Physics'],
    citations: 12,
    abstractSnippet:
      'This paper studies the behavior of quantum particles under extreme conditions. This paper studies the behavior of quantum particles under extreme conditions.',
  },
  {
    title: 'Paper 2: Machine Learning',
    authors: 'Carol, Dave',
    year: 1990,
    keywords: ['AI', 'Neural Networks'],
    citations: 7,
    abstractSnippet:
      'We explore a new architecture for deep neural networks that improves accuracy...',
  },
  {
    title: 'Paper 3: Example',
    authors: 'Eve, Frank',
    year: 2005,
    keywords: ['Biology', 'Genetics'],
    citations: 25,
    abstractSnippet:
      'A study on genetic variation across populations.',
  },
];
