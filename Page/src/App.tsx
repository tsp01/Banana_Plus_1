// src/App.tsx
import React, { useState } from 'react';
import SplitPane from './Components/SplitPane';
import TitleBox from './Components/TitleBox';
import JournalBox from './Components/JournalBox';
import { papers } from './data/papers';
import { timelineTitles } from './data/TimelineData';
import JournalFilter from './Components/JournalFilter';
import KeywordFilter from './Components/KeywordFilter';
import AuthorFilter from './Components/AuthorFilter';
import type { PaperBoxProps } from './Components/JournalBox';
import VerticalTimeline from './Components/VerticalTimeline';
import type { TimelineEvent } from './Components/VerticalTimeline';
import './global.css';

// ------------------ LEFT PANEL ------------------
const LeftPanel: React.FC<{ papers: PaperBoxProps[] }> = ({ papers }) => {
  // hooks can go here safely if needed in future
  return (
    <div className="panel-content">
      <TitleBox title="Navigation" className="navigation" />
      {papers.length === 0 ? (
        <div>No papers available</div>
      ) : (
        papers.map((paper, index) => (
          <JournalBox
            key={index}
            title={paper.title}
            authors={paper.authors}
            keywords={paper.keywords}
            abstractSnippet={paper.abstractSnippet}
            year={paper.year}
          />
        ))
      )}
    </div>
  );
};

// ------------------ CENTER PANEL ------------------
const CenterPanel: React.FC<{
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedKeyword: string;
  setSelectedKeyword: (kw: string) => void;
  selectedAuthors: string[];
  setSelectedAuthors: (authors: string[]) => void;
  allKeywords: string[];
  allAuthors: string[];
}> = ({
  searchQuery,
  setSearchQuery,
  selectedKeyword,
  setSelectedKeyword,
  selectedAuthors,
  setSelectedAuthors,
  allKeywords,
  allAuthors,
}) => {
  // hooks safe here
  const sendFiltersToServer = async () => {
    const filters = { searchQuery };
    console.log('Sending filters:', filters);
    try {
      const response = await fetch('http://localhost:8453/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('Server response:', data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="panel-content">
      <TitleBox title="Filters" className="main" />
      <JournalFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <KeywordFilter
        keywords={allKeywords}
        selectedKeyword={selectedKeyword}
        onSelectKeyword={setSelectedKeyword}
      />
      <AuthorFilter
        authors={allAuthors}
        selectedAuthors={selectedAuthors}
        onChange={setSelectedAuthors}
      />
      <button
        onClick={sendFiltersToServer}
        style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Send Filters
      </button>
    </div>
  );
};

// ------------------ RIGHT PANEL ------------------
const RightPanel: React.FC<{ events: TimelineEvent[]; timelineTitles: string[] }> = ({
  events,
  timelineTitles,
}) => {
  // hooks safe here
  return (
    <div className="panel-content" style={{ height: '100%', position: 'relative' }}>
      <TitleBox title="AI Timeline" className="sidebar" />
      {events.length === 0 ? (
        <div>No events to display</div>
      ) : (
        <VerticalTimeline events={events} timelineTitles={timelineTitles} />
      )}
    </div>
  );
};

// ------------------ MAIN APP ------------------
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  const allKeywords = Array.from(new Set(papers.flatMap((p) => p.keywords)));
  const allAuthors = Array.from(
    new Set(papers.flatMap((p) => p.authors.split(',').map((a) => a.trim())))
  );

  const filteredPapers = papers.filter((paper) => {
    const matchesTitle = paper.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKeyword = !selectedKeyword || paper.keywords.includes(selectedKeyword);
    const paperAuthors = paper.authors.split(',').map((a) => a.trim());
    const matchesAuthors =
      selectedAuthors.length === 0 || selectedAuthors.every((a) => paperAuthors.includes(a));
    return matchesTitle && matchesKeyword && matchesAuthors;
  });

  const timelineEvents: TimelineEvent[] = filteredPapers
    .filter((paper) => timelineTitles().includes(paper.title))
    .map((paper, index) => ({
      ...paper,
      date: paper.year ? new Date(paper.year, 0, 1) : new Date(2023, index, 1),
    }));

  return (
    <div className="app">
      <SplitPane>
        <LeftPanel papers={filteredPapers} />
        <CenterPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedKeyword={selectedKeyword}
          setSelectedKeyword={setSelectedKeyword}
          selectedAuthors={selectedAuthors}
          setSelectedAuthors={setSelectedAuthors}
          allKeywords={allKeywords}
          allAuthors={allAuthors}
        />
        <RightPanel events={timelineEvents} timelineTitles={timelineTitles()} />
      </SplitPane>
    </div>
  );
}

export default App;
