// src/App.tsx
import React, { useState } from 'react';
import SplitPane from './Components/SplitPane';
import TitleBox from './Components/TitleBox';
import JournalBox from './Components/JournalBox';
import { papers } from './data/papers';
import { useTimelineTitles, setTimelineTitles } from './data/TimelineData';
import JournalFilter from './Components/JournalFilter';
import KeywordFilter from './Components/KeywordFilter';
import AuthorFilter from './Components/AuthorFilter';
import type { PaperBoxProps } from './Components/JournalBox';
import VerticalTimeline from './Components/VerticalTimeline';
import type { TimelineEvent } from './Components/VerticalTimeline';
import Summary from './Components/Summary';
import './global.css';

// ------------------ LEFT PANEL ------------------
const LeftPanel: React.FC<{ papers: PaperBoxProps[] }> = ({ papers }) => (
  <div className="panel-content">
    <TitleBox title="Navigation" className="navigation" />
    {papers.map((paper, index) => (
      <JournalBox
        key={index}
        title={paper.title}
        authors={paper.authors}
        keywords={paper.keywords}
        abstractSnippet={paper.abstractSnippet}
        year={paper.year}
      />
    ))}
  </div>
);

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
  const [visibleLength, setVisibleLength] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

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
      setTimelineTitles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const summaryText = `1970s (Skylab era): First clear evidence that astronauts lose bone in weight-bearing sites in space—roughly ~1–2% per month at the hip/heel—along with negative calcium balance. Early photon absorptiometry on Skylab crews and metabolic studies tied calcium loss to bone demineralization. 

1980s–1990s (Salyut/Mir & ground analogs): With longer missions, losses scaled with duration; Mir DXA studies quantified ~1–1.5%/month at the hip and ~1%/month at the spine. Head-down tilt bed rest emerged as a validated Earth analog reproducing spaceflight-like bone loss. 

2000s (early ISS): Broadly, 2–9% total loss across skeletal sites after long missions; post-flight recovery is slow and often incomplete. QCT revealed that trabecular (spongy) architecture is hit harder than cortical bone. Calcium/bone metabolism work consolidated understanding of high resorption + low formation during flight. 

Late 2000s–2010s (countermeasures mature): Heavy resistive exercise (ARED) reduced losses; adding bisphosphonates (e.g., alendronate) to exercise often prevented clinically meaningful loss during 4–6-month ISS missions. 

2010s–2020s (mechanisms & imaging): Meta-analyses quantified the biology: bone resorption markers jump within ~11 days in flight; formation lags. QCT studies showed incomplete trabecular recovery even a year after return. Mechanistic work highlights osteocyte signaling (↑ sclerostin, ↑ RANKL) driving resorption under unloading. 2020s–mid-2020s (what we know now): Best-practice countermeasures = daily high-load resistive exercise ± antiresorptive drugs; still, site-specific losses and individual variability persist, and some astronauts don’t fully recover bone strength/architecture. Emerging avenues: targeting sclerostin/Wnt, novel osteo-anabolic compounds, and short-radius artificial gravity, with recent bed-rest data suggesting AG may protect bone and marrow fat. 

Bottom line: Since the 1970s we’ve moved from recognizing rapid, unloading-driven bone loss to partially controlling it with exercise and pharmacology. Today’s challenge is preserving microarchitecture and strength (not just DXA BMD), ensuring durable recovery, and developing next-gen countermeasures (targeted drugs and/or artificial gravity) for missions longer than typical ISS stays`;

  const startTyping = () => {
    if (isTyping || visibleLength === summaryText.length) return;
    setIsTyping(true);

    const interval = setInterval(() => {
      setVisibleLength((prev) => {
        if (prev >= summaryText.length) {
          clearInterval(interval);
          setIsTyping(false);
          return prev;
        }
        return prev + 1;
      });
    }, 20);
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
        Get a Timeline
      </button>

      <button
        onClick={startTyping}
        style={{
          marginTop: '8px',
          marginLeft: '8px',
          padding: '8px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Show Summary
      </button>

      <Summary text={summaryText.slice(0, visibleLength)} />
    </div>
  );
};

// ------------------ RIGHT PANEL ------------------
const RightPanel: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div className="panel-content" style={{ height: '100%', position: 'relative' }}>
    <TitleBox title="AI Timeline" className="sidebar" />
    <VerticalTimeline events={events} />
  </div>
);

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
  const liveTimelineTitles = useTimelineTitles();
  const timelineEvents: TimelineEvent[] = filteredPapers
    .filter((paper) => liveTimelineTitles.includes(paper.title))
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
        <RightPanel events={timelineEvents} />
      </SplitPane>
    </div>
  );
}

export default App;
