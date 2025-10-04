import React from 'react';

interface JournalFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const JournalFilter: React.FC<JournalFilterProps> = ({ searchQuery, onSearchChange }) => (
  <input
    type="text"
    placeholder="Search by title and natural language search"
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    style={{ padding: '8px', marginBottom: '16px', width: '100%' }}
  />
);

export default JournalFilter;
