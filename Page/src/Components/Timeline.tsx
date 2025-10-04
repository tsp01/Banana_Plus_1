import React from "react";
import "./Timeline.css";
import { timelineData } from "../data/TimelineData";

const Timeline: React.FC = () => {
  const sortedData = [...timelineData].sort((a, b) => a.year - b.year);

  const minYear = sortedData[0].year;
  const maxYear = sortedData[sortedData.length - 1].year;
  const yearRange = maxYear - minYear || 1;

  const getNodeSize = (count: number) => Math.min(50, 20 + count * 2);

  // Convert years to initial proportional positions
  const rawPositions = sortedData.map(item => ((item.year - minYear) / yearRange) * 100);

  // Enforce a minimum spacing in percent
  const minSpacingPercent = 12; // adjust this for minimum distance between nodes
  const positions: number[] = [];
  rawPositions.forEach((pos, idx) => {
    if (idx === 0) {
      positions.push(pos);
    } else {
      const prev = positions[idx - 1];
      positions.push(Math.max(pos, prev + minSpacingPercent));
    }
  });

  return (
    <div className="timeline-container">
      <div className="timeline-line"></div>

      {sortedData.map((item, idx) => (
        <div
          key={idx}
          className="timeline-node"
          style={{ left: `${positions[idx]}%`, transform: "translateX(-50%)" }}
        >
          <div
            className="circle"
            style={{
              width: getNodeSize(item.citationCount),
              height: getNodeSize(item.citationCount),
            }}
          >
            {idx + 1}
          </div>
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            <div>{item.title}</div>
            <div>{item.year}</div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default Timeline;