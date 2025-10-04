import React, { useState } from 'react';
import SplitPane from './Components/SplitPane';
import TitleBox from './Components/TitleBox';
import JournalBox from './Components/JournalBox';
import { papers } from './data/papers';
import Timeline from './Components/Timeline';
import JournalFilter from './Components/JournalFilter';
import KeywordFilter from './Components/KeywordFilter';
import AuthorFilter from './Components/AuthorFilter';
import type { PaperBoxProps } from './Components/JournalBox';

// LeftPanel displays filtered papers
const LeftPanel: React.FC<{ papers: PaperBoxProps[] }> = ({ papers }) => {
  return (
    <div>
      <TitleBox title="Navigation" className="navigation" />
      {papers.map((paper, index) => (
        <JournalBox
          key={index}
          title={paper.title}
          authors={paper.authors}
          keywords={paper.keywords}
          abstractSnippet={paper.abstractSnippet}
        />
      ))}
    </div>
  );
};

// CenterPanel contains all filters stacked vertically
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
    <TitleBox title="Filters" className="sidebar" />

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
  </div>
);

// RightPanel (unchanged)
const RightPanel = () => (
  <div>
    <TitleBox title="AI Timeline/Up-next" className="sidebar" />
    <Timeline />
  </div>
);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  // Generate all unique keywords
  const allKeywords = Array.from(new Set(papers.flatMap((paper) => paper.keywords)));

  // Generate all unique authors
  const allAuthors = Array.from(
    new Set(
      papers
        .flatMap((paper) => paper.authors.split(',').map((a) => a.trim()))
    )
  );

  // Filter papers by title, keyword, and multiple authors
  const filteredPapers = papers.filter((paper) => {
    const matchesTitle = paper.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKeyword = !selectedKeyword || paper.keywords.includes(selectedKeyword);
    const paperAuthors = paper.authors.split(',').map((a) => a.trim());
    const matchesAuthors =
      selectedAuthors.length === 0 ||
      selectedAuthors.every((author) => paperAuthors.includes(author));

    return matchesTitle && matchesKeyword && matchesAuthors;
  });

  return (
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

      <RightPanel />
    </SplitPane>
  );
}

export default App;
