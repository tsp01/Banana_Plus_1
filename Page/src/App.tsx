import React, { useState } from 'react';
import SplitPane from './Components/SplitPane';
import TitleBox from './Components/TitleBox';
import JournalBox from './Components/JournalBox';
import { papers } from './data/papers';
import Timeline from './Components/Timeline';
import JournalFilter from './Components/JournalFilter';
import type { PaperBoxProps } from './Components/JournalBox';

// ✅ LeftPanel now takes a papers prop
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

// ✅ CenterPanel only handles the search bar
const CenterPanel: React.FC<{
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}> = ({ searchQuery, setSearchQuery }) => (
  <div>
    <TitleBox title="Search" className="sidebar" />
    <JournalFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} />
  </div>
);

const RightPanel = () => (
  <div>
    <TitleBox title="AI Timeline/Up-next" className="sidebar" />
    <Timeline />
  </div>
);

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Filtering logic lives here (shared between panels)
  const filteredPapers = papers.filter((paper) =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SplitPane>
      {/* LeftPanel receives filtered papers */}
      <LeftPanel papers={filteredPapers} />

      {/* CenterPanel controls search input */}
      <CenterPanel searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <RightPanel />
    </SplitPane>
  );
}

export default App;
