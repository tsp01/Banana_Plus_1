// src/Components/KeywordFilter.tsx
import React from 'react';

interface KeywordFilterProps {
  keywords: string[];
  selectedKeyword: string;
  onSelectKeyword: (keyword: string) => void;
}

const KeywordFilter: React.FC<KeywordFilterProps> = ({
  keywords,
  selectedKeyword,
  onSelectKeyword,
}) => (
  <select
    value={selectedKeyword}
    onChange={(e) => onSelectKeyword(e.target.value)}
    style={{ padding: '8px', marginBottom: '16px', width: '100%' }}
  >
    <option value="">All keywords</option>
    {keywords.map((kw) => (
      <option key={kw} value={kw}>
        {kw}
      </option>
    ))}
  </select>
);

export default KeywordFilter;
