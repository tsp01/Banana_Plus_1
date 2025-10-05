// ===============================
// KeywordFilter.tsx
// -------------------------------
// A dropdown component for selecting a keyword filter in a journal/paper list.
// Allows users to filter content by a specific keyword or show all keywords.
// ===============================

import React from 'react';

/**
 * Props for the KeywordFilter component
 * @property keywords - Array of available keyword strings to populate the dropdown
 * @property selectedKeyword - Currently selected keyword
 * @property onSelectKeyword - Callback fired when a keyword is selected
 */
interface KeywordFilterProps {
  keywords: string[];
  selectedKeyword: string;
  onSelectKeyword: (keyword: string) => void;
}

/**
 * KeywordFilter Component
 * -----------------------
 * Renders a <select> element with options for filtering by keywords.
 * Includes a default "All keywords" option.
 *
 * Usage:
 * <KeywordFilter
 *   keywords={allKeywords}
 *   selectedKeyword={selectedKeyword}
 *   onSelectKeyword={setSelectedKeyword}
 * />
 */
const KeywordFilter: React.FC<KeywordFilterProps> = ({
  keywords,
  selectedKeyword,
  onSelectKeyword,
}) => (
  <select
    value={selectedKeyword}               // Controlled input: value comes from state
    onChange={(e) => onSelectKeyword(e.target.value)} // Updates parent state on change
    style={{ padding: '8px', marginBottom: '16px', width: '100%' }} // Basic inline styling
  >
    {/* Default option to show all papers */}
    <option value="">All keywords</option>

    {/* Render each keyword as an option */}
    {keywords.map((kw) => (
      <option key={kw} value={kw}>
        {kw}
      </option>
    ))}
  </select>
);

export default KeywordFilter;
