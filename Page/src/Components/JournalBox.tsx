// ===============================
// JournalBox.tsx
// -------------------------------
// Component to display a single paper/journal entry.
// Shows title, authors, year, citations, keywords, and a truncated abstract.
// ===============================

import React from 'react';
import './JournalBox.css';

/**
 * Props for the JournalBox component
 * @property title - Paper title
 * @property authors - Comma-separated author names
 * @property keywords - Array of keywords
 * @property year - Optional publication year
 * @property citations - Optional citation count
 * @property abstractSnippet - Short excerpt from the abstract
 * @property onBookmark - Optional callback for bookmarking the paper
 */
export interface PaperBoxProps {
  title: string;
  authors: string;
  keywords: string[];
  year?: number;
  citations?: number;
  abstractSnippet: string;
  onBookmark?: () => void;
}

/**
 * JournalBox Component
 * --------------------
 * Renders a styled container showing key metadata about a paper.
 * The abstract is truncated to a limited number of words for brevity.
 *
 * Usage:
 * <JournalBox
 *   title="Paper Title"
 *   authors="Alice, Bob"
 *   keywords={['Physics', 'Quantum']}
 *   abstractSnippet="Long abstract text..."
 *   year={1990}
 *   citations={12}
 * />
 */
const JournalBox: React.FC<PaperBoxProps> = ({
  title,
  authors,
  keywords,
  abstractSnippet,
  year,
  citations
}) => {

  /**
   * Truncate a string to a given number of words
   * @param text Full text to truncate
   * @param wordLimit Maximum number of words
   * @returns Truncated text with ellipsis if limit exceeded
   */
  const truncateWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '…';
  };

  return (
    <div className="paper-box">
      <h3 className="paper-title">{title}</h3>

      {/* Authors */}
      <p className="paper-authors"><strong>Authors:</strong> {authors}</p>

      {/* Optional Year */}
      {year && <p className="paper-year"><strong>Year:</strong> {year}</p>}

      {/* Optional Citations */}
      {citations !== undefined && (
        <p className="paper-citations"><strong>Citations:</strong> {citations}</p>
      )}

      {/* Keywords */}
      <p className="paper-keywords"><strong>Keywords:</strong> {keywords.join(', ')}</p>

      {/* Truncated Abstract */}
      <p className="paper-abstract">{truncateWords(abstractSnippet, 15)}</p>
    </div>
  );
};

export default JournalBox;
