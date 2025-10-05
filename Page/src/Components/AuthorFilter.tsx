// ===============================
// AuthorFilter.tsx
// -------------------------------
// Component for selecting one or more authors from a list.
// Allows searching by typing, shows suggestions, and manages selected authors as removable tags.
// ===============================

import React, { useState } from 'react';

/**
 * Props for the AuthorFilter component
 * @property authors - Full list of available authors for suggestions
 * @property selectedAuthors - Array of currently selected authors
 * @property onChange - Callback fired when selected authors change
 */
interface AuthorFilterProps {
  authors: string[];
  selectedAuthors: string[];
  onChange: (authors: string[]) => void;
}

/**
 * AuthorFilter Component
 * ---------------------
 * Renders a multi-select input with autocomplete functionality for authors.
 * Selected authors are displayed as removable tags.
 *
 * Usage:
 * <AuthorFilter
 *   authors={allAuthors}
 *   selectedAuthors={selectedAuthors}
 *   onChange={setSelectedAuthors}
 * />
 */
const AuthorFilter: React.FC<AuthorFilterProps> = ({
  authors,
  selectedAuthors,
  onChange,
}) => {
  const [input, setInput] = useState(''); // Local state for current input text

  // Filter suggestions based on input text and exclude already selected authors
  const suggestions = authors.filter(
    (a) => a.toLowerCase().includes(input.toLowerCase()) && !selectedAuthors.includes(a)
  );

  // Add an author to the selectedAuthors array
  const addAuthor = (author: string) => {
    onChange([...selectedAuthors, author]); // Notify parent
    setInput('');                            // Clear input
  };

  // Remove an author from the selectedAuthors array
  const removeAuthor = (author: string) => {
    onChange(selectedAuthors.filter((a) => a !== author));
  };

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      {/* Selected author tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
        {selectedAuthors.map((author) => (
          <div
            key={author}
            style={{
              backgroundColor: '#1976d2', // Dark blue background
              color: 'white',             // White text for contrast
              padding: '4px 8px',
              borderRadius: '12px',       // Rounded tag
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.9rem',
            }}
          >
            {author}
            {/* Remove button for each selected author */}
            <button
              type="button"
              onClick={() => removeAuthor(author)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: 'white', // Ensure × is visible
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input box for typing author names */}
      <input
        type="text"
        placeholder="Search authors..."
        value={input}                    // Controlled input
        onChange={(e) => setInput(e.target.value)} // Update local input state
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />

      {/* Suggestions dropdown */}
      {input && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',    // Positioned below input
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ccc',
            maxHeight: '150px',      // Limit dropdown height
            overflowY: 'auto',       // Scroll if content exceeds height
            zIndex: 10,              // Ensure it appears above other elements
            listStyle: 'none',       // Remove bullets
            margin: 0,
            padding: 0,
          }}
        >
          {suggestions.map((author) => (
            <li
              key={author}
              onClick={() => addAuthor(author)} // Add author on click
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#333',
              }}
            >
              {author}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AuthorFilter;
