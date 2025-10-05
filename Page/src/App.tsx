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

//
// ===========================
//   PANEL COMPONENTS
// ===========================
//

// LeftPanel — displays all journal papers matching the active filters
const LeftPanel: React.FC<{ papers: PaperBoxProps[] }> = ({ papers }) => (
  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {/* Section title */}
    <TitleBox title="Navigation" className="navigation" />

    {/* Map each filtered paper to a JournalBox card */}
    {papers.map((paper, index) => (
      <JournalBox
        key={index}
        title={paper.title}
        authors={paper.authors}
        keywords={paper.keywords}
        abstractSnippet={paper.abstractSnippet}
        year={paper.year} // Optional year display
      />
    ))}
  </div>
);

//
// CenterPanel — contains the search and filter controls
//
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
}) => (
  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <TitleBox title="Filters" className="main" />

    {/* Free text search bar (title-based) */}
    <JournalFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} />

    {/* Keyword selector (single-choice) */}
    <KeywordFilter
      keywords={allKeywords}
      selectedKeyword={selectedKeyword}
      onSelectKeyword={setSelectedKeyword}
    />

    {/* Author selector (multi-choice) */}
    <AuthorFilter
      authors={allAuthors}
      selectedAuthors={selectedAuthors}
      onChange={setSelectedAuthors}
    />
  </div>
);

//
// RightPanel — shows the AI research timeline visualization
//
const RightPanel: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div style={{ padding: '16px', height: '100%', position: 'relative' }}>
    <TitleBox title="AI Timeline" className="sidebar" />
    {/* Vertical timeline visualization */}
    <VerticalTimeline events={events} />
  </div>
);

//
// ===========================
//   MAIN APP COMPONENT
// ===========================
//

function App() {
  // Search/filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  //
  // Precompute filter options
  //

  // Extract all unique keywords from the paper dataset
  const allKeywords = Array.from(new Set(papers.flatMap((paper) => paper.keywords)));

  // Extract all unique authors (split comma-separated strings, trim spacing)
  const allAuthors = Array.from(
    new Set(
      papers.flatMap((paper) => paper.authors.split(',').map((a) => a.trim()))
    )
  );

  //
  // Apply active filters to papers
  //
  const filteredPapers = papers.filter((paper) => {
    // Title match (case-insensitive)
    const matchesTitle = paper.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Keyword match (optional — passes if no keyword selected)
    const matchesKeyword = !selectedKeyword || paper.keywords.includes(selectedKeyword);

    // Author match — each selected author must be present in the paper’s author list
    const paperAuthors = paper.authors.split(',').map((a) => a.trim());
    const matchesAuthors =
      selectedAuthors.length === 0 ||
      selectedAuthors.every((author) => paperAuthors.includes(author));

    // Only include papers matching all criteria
    return matchesTitle && matchesKeyword && matchesAuthors;
  });

  console.log('Filtered Papers:', filteredPapers);

  //
  // Convert filtered papers into timeline events
  // Only include papers that appear in the timelineTitles dataset
  //
  const timelineEvents: TimelineEvent[] = filteredPapers
    .filter((paper) => timelineTitles.includes(paper.title))
    .map((paper, index) => ({
      ...paper,
      // Use actual year if available; otherwise assign pseudo-dates for ordering
      date: paper.year
        ? new Date(paper.year, 0, 1)
        : new Date(2023, index, 1),
    }));

  console.log('Timeline Events:', timelineEvents);

  //
  // Layout rendering — SplitPane divides Left, Center, and Right panels
  //
  return (
    <SplitPane>
      {/* Left panel: paper list */}
      <LeftPanel papers={filteredPapers} />

      {/* Center panel: search and filter controls */}
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

      {/* Right panel: timeline visualization */}
      <RightPanel events={timelineEvents} />
    </SplitPane>
  );
}

export default App;
