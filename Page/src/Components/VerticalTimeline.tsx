// =============================================
// VerticalTimeline.tsx
// =============================================
//
// This component renders a vertical, scrollable timeline
// of research papers, where each node corresponds to a paper
// that matches entries from `timelineTitles` (filtered in App.tsx).
//
// Node spacing and height are calculated dynamically to prevent
// overlapping labels and to scale based on event count.
//
// When the user hovers over a node, a detailed JournalBox appears
// showing the full paper metadata and abstract snippet.
//

import React, { useState, useRef, useEffect } from 'react';
import JournalBox from './JournalBox';
import type { PaperBoxProps } from './JournalBox';
import './VerticalTimeline.css';

//
// -------------------------------------------------
// Type definitions
// -------------------------------------------------
//

// Extends the JournalBox props to include a date and optional citations
export interface TimelineEvent extends PaperBoxProps {
  date: Date;          // Publication or pseudo-date (used for positioning)
  citations?: number;  // Optional: affects node size
}

// Props accepted by the VerticalTimeline component
interface VerticalTimelineProps {
  events: TimelineEvent[]; // Array of timeline events to display
}

//
// -------------------------------------------------
// Component: VerticalTimeline
// -------------------------------------------------
//
const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ events }) => {
  // Track which event is being hovered over (for tooltip display)
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);

  // Reference to the container element for dynamic height control
  const containerRef = useRef<HTMLDivElement>(null);

  // Store the computed vertical positions for each event
  const [topPositions, setTopPositions] = useState<number[]>([]);

  // If there are no events to display, render nothing
  if (events.length === 0) return null;

  //
  // -------------------------------------------------
  // Sort and normalize event data
  // -------------------------------------------------
  //

  // Ensure chronological order (ascending)
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Define time range for proportional vertical spacing
  const firstDate = sortedEvents[0].date.getTime();
  const lastDate = sortedEvents[sortedEvents.length - 1].date.getTime();
  const totalRange = lastDate - firstDate || 1; // prevent divide-by-zero errors

  //
  // -------------------------------------------------
  // Layout constants
  // -------------------------------------------------
  //
  const MIN_SPACING = 40;          // Minimum vertical gap between events (in pixels)
  const BASE_HEIGHT = 1080;        // Minimum total height of the timeline container
  const EXTRA_HEIGHT_PER_NODE = 40;// Additional height per node to reduce crowding

  //
  // -------------------------------------------------
  // Dynamic layout computation
  // -------------------------------------------------
  //
  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically compute the ideal container height
    const idealHeight = Math.max(
      BASE_HEIGHT,
      sortedEvents.length * MIN_SPACING + EXTRA_HEIGHT_PER_NODE * sortedEvents.length
    );

    // Apply computed height to container
    containerRef.current.style.height = `${idealHeight}px`;

    // Calculate top positions for each node, ensuring no overlaps
    let lastTop = -Infinity;
    const positions: number[] = [];

    sortedEvents.forEach((event) => {
      // Calculate proportional position within the container based on date
      let topPx = ((event.date.getTime() - firstDate) / totalRange) * idealHeight;

      // Enforce minimum spacing constraint
      if (topPx - lastTop < MIN_SPACING) topPx = lastTop + MIN_SPACING;

      positions.push(topPx);
      lastTop = topPx;
    });

    // Store computed positions for rendering
    setTopPositions(positions);
  }, [sortedEvents]);

  //
  // -------------------------------------------------
  // Render timeline nodes
  // -------------------------------------------------
  //
  return (
    <div className="vertical-timeline-container" ref={containerRef}>
      {sortedEvents.map((event, index) => {
        const top = topPositions[index] ?? 0; // default to 0 if not yet computed
        const nodeSize = 12 + (event.citations ?? 1) * 2; // scale node size by citations

        return (
          <div
            key={index}
            className="timeline-point-wrapper"
            style={{ top: `${top}px` }}
            onMouseEnter={() => setHoveredEvent(event)}
            onMouseLeave={() => setHoveredEvent(null)}
          >
            {/* Node marker */}
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

            {/* Inline label showing author(s) and year */}
            <div className="timeline-label">
              {event.authors} ({event.date.getFullYear()})
            </div>
          </div>
        );
      })}

      {/* Hover overlay — shows full JournalBox when user hovers a node */}
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
