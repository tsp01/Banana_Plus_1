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
  timelineTitles?: string[] | (() => string[]);
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ events, timelineTitles }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Always declare hooks first
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [topPositions, setTopPositions] = useState<number[]>([]);
  const [containerHeight, setContainerHeight] = useState<number>(400);

  // Normalize timeline titles if function
  const titlesArray =
    typeof timelineTitles === 'function' ? timelineTitles() : timelineTitles ?? [];

  // Filter events based on titles if provided
  const filteredEvents = titlesArray.length
    ? events.filter((e) => titlesArray.includes(e.title))
    : events;

  // Calculate positions for timeline points
  useEffect(() => {
    if (!containerRef.current || filteredEvents.length === 0) {
      setTopPositions([]);
      setContainerHeight(400);
      return;
    }

    const MIN_SPACING = 40;
    const BASE_HEIGHT = 400;
    const EXTRA_HEIGHT_PER_NODE = 20;

    const sortedEvents = [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstDate = sortedEvents[0].date.getTime();
    const lastDate = sortedEvents[sortedEvents.length - 1].date.getTime();
    const totalRange = lastDate - firstDate || 1;

    const idealHeight = Math.max(BASE_HEIGHT, sortedEvents.length * (MIN_SPACING + EXTRA_HEIGHT_PER_NODE));
    setContainerHeight(idealHeight);

    let lastTop = -Infinity;
    const positions: number[] = [];

    sortedEvents.forEach((event) => {
      let topPx = ((event.date.getTime() - firstDate) / totalRange) * idealHeight;
      if (topPx - lastTop < MIN_SPACING) topPx = lastTop + MIN_SPACING;
      positions.push(topPx);
      lastTop = topPx;
    });

    setTopPositions(positions);
    containerRef.current.style.height = `${idealHeight}px`;
  }, [filteredEvents]);

  // Sorted events for rendering
  const sortedEvents = [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="vertical-timeline-container" ref={containerRef}>
      {sortedEvents.length === 0 && (
        <div className="timeline-empty">No events available</div>
      )}

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
