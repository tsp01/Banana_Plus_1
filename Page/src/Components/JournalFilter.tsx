// ===============================
// JournalFilter.tsx
// -------------------------------
// A text input component for filtering journals or papers by title or natural language search.
// Updates the parent component's state whenever the user types.
// ===============================

import React from 'react';

/**
 * Props for the JournalFilter component
 * @property searchQuery - Current text in the search input
 * @property onSearchChange - Callback fired whenever the input text changes
 */
interface JournalFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * JournalFilter Component
 * -----------------------
 * Renders a controlled <input> element for searching journals or papers.
 * The parent component manages the state of the search query.
 *
 * Usage:
 * <JournalFilter
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 * />
 */
const JournalFilter: React.FC<JournalFilterProps> = ({ searchQuery, onSearchChange }) => (
  <input
    type="text"
    placeholder="Search by title and natural language search" // Guides user input
    value={searchQuery}                                       // Controlled input
    onChange={(e) => onSearchChange(e.target.value)}          // Updates parent state on change
    style={{ padding: '8px', marginBottom: '16px', width: '100%' }} // Basic styling for spacing and width
  />
);

export default JournalFilter;
