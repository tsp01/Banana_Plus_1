import React, { useState } from 'react';

interface AuthorFilterProps {
  authors: string[];
  selectedAuthors: string[];
  onChange: (authors: string[]) => void;
}

const AuthorFilter: React.FC<AuthorFilterProps> = ({
  authors,
  selectedAuthors,
  onChange,
}) => {
  const [input, setInput] = useState('');

  // Filter suggestions based on input and already selected authors
  const suggestions = authors.filter(
    (a) => a.toLowerCase().includes(input.toLowerCase()) && !selectedAuthors.includes(a)
  );

  const addAuthor = (author: string) => {
    onChange([...selectedAuthors, author]);
    setInput('');
  };

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
              backgroundColor: '#1976d2', // dark blue background
              color: 'white',            // white text
              padding: '4px 8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.9rem',
            }}
          >
            {author}
            <button
              type="button"
              onClick={() => removeAuthor(author)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: 'white', // ensure × is visible
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input box */}
      <input
        type="text"
        placeholder="Search authors..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
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
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ccc',
            maxHeight: '150px',
            overflowY: 'auto',
            zIndex: 10,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {suggestions.map((author) => (
            <li
              key={author}
              onClick={() => addAuthor(author)}
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
