import React from 'react';
import './JournalBox.css';

export interface PaperBoxProps {
  title: string;
  authors: string;
  keywords: string[];
  abstractSnippet: string;
  onBookmark?: () => void;
}

const JournalBox: React.FC<PaperBoxProps> = ({ title, authors, keywords, abstractSnippet }) => {
    const truncateWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '…';
  };

  return (
    <div className="paper-box">
      <h3 className="paper-title">{title}</h3>
      <p className="paper-authors"><strong>Authors:</strong> {authors}</p>
      <p className="paper-keywords"><strong>Keywords:</strong> {keywords.join(', ')}</p>
      <p className="paper-abstract">{truncateWords(abstractSnippet, 15)}</p>
    </div>
  );
};

export default JournalBox;
