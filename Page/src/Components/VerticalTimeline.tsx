import React, { useState, useRef, useEffect } from 'react';
import JournalBox from './JournalBox';
import type { PaperBoxProps } from './JournalBox';
import './VerticalTimeline.css';

export interface TimelineEvent extends PaperBoxProps {
  date: Date;
  citations?: number;
}

interface VerticalTimelineProps {
  events: TimelineEvent[];
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ events }) => {
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [topPositions, setTopPositions] = useState<number[]>([]);

  if (events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstDate = sortedEvents[0].date.getTime();
  const lastDate = sortedEvents[sortedEvents.length - 1].date.getTime();
  const totalRange = lastDate - firstDate || 1;

  const MIN_SPACING = 40; // pixels
  const BASE_HEIGHT = 400; // minimum container height
  const EXTRA_HEIGHT_PER_NODE = 20; // extra per node if many

  useEffect(() => {
    if (!containerRef.current) return;

    // Compute ideal height (without changing ref inside the loop)
    const idealHeight = Math.max(
      BASE_HEIGHT,
      sortedEvents.length * (MIN_SPACING + EXTRA_HEIGHT_PER_NODE)
    );

    // Compute top positions dynamically
    let lastTop = -Infinity;
    const positions: number[] = [];

    sortedEvents.forEach((event) => {
      let topPx = ((event.date.getTime() - firstDate) / totalRange) * idealHeight;
      if (topPx - lastTop < MIN_SPACING) topPx = lastTop + MIN_SPACING;
      positions.push(topPx);
      lastTop = topPx;
    });

    setTopPositions(positions);

    // Apply height **once**, outside of state update
    containerRef.current.style.height = `${idealHeight}px`;

  }, [events]); // ✅ Only re-run when `events` change

  return (
    <div className="vertical-timeline-container" ref={containerRef}>
      {sortedEvents.map((event, index) => {
        const top = topPositions[index] ?? 0;
        const nodeSize = 12 + (event.citations ?? 1) * 2;

        return (
          <div
            key={index}
            className="timeline-point-wrapper"
            style={{ top: `${top}px` }}
            onMouseEnter={() => setHoveredEvent(event)}
            onMouseLeave={() => setHoveredEvent(null)}
          >
            <div
              className="timeline-point"
              style={{
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
            <div className="timeline-label">
              {event.authors} ({event.date.getFullYear()})
            </div>
          </div>
        );
      })}

      {hoveredEvent && (
        <div className="timeline-hover-box">
          <JournalBox
            title={hoveredEvent.title}
            authors={hoveredEvent.authors}
            keywords={hoveredEvent.keywords}
            abstractSnippet={hoveredEvent.abstractSnippet}
            year={hoveredEvent.year}
            citations={hoveredEvent.citations}
          />
        </div>
      )}
    </div>
  );
};

export default VerticalTimeline;
