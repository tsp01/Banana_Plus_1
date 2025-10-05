// src/Components/VerticalTimeline.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  const [topPositions, setTopPositions] = useState<number[]>([]);
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

  // Always run hooks first
  useEffect(() => {
    if (!events.length) {
      setTopPositions([]);
      setContainerHeight(400);
      return;
    }

    const sortedEvents = [...events].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const firstDate = sortedEvents[0].date.getTime();
    const lastDate = sortedEvents[sortedEvents.length - 1].date.getTime();
    const totalRange = lastDate - firstDate || 1;

    const MIN_SPACING = 40;
    const BASE_HEIGHT = 400;
    const EXTRA_HEIGHT_PER_NODE = 20;

    const idealHeight = Math.max(
      BASE_HEIGHT,
      sortedEvents.length * (MIN_SPACING + EXTRA_HEIGHT_PER_NODE)
    );

    let lastTop = -Infinity;
    const positions: number[] = [];

    sortedEvents.forEach((event) => {
      let topPx = ((event.date.getTime() - firstDate) / totalRange) * idealHeight;
      if (topPx - lastTop < MIN_SPACING) topPx = lastTop + MIN_SPACING;
      positions.push(topPx);
      lastTop = topPx;
    });

    setTopPositions(positions);
    setContainerHeight(idealHeight);
  }, [events]);

  if (!events.length) return (
    <div className="vertical-timeline-container empty" style={{ height: containerHeight }}>
      No timeline events
    </div>
  );

  const sortedEvents = [...events].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return (
    <div
      className="vertical-timeline-container"
      ref={containerRef}
      style={{ height: containerHeight }}
    >
      {sortedEvents.map((event, index) => {
        const top = topPositions[index] ?? 0;
        const nodeSize = Math.min(12 + (event.citations ?? 1) * 2, 40);

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
              }}
            />
            <div
              className="timeline-label"
              style={{ marginTop: `${nodeSize / 2 + 4}px` }}
            >
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
