import React, { useState, useRef } from 'react';
import Pane from './Pane';
import Splitter from './Splitter';
import './SplitPane.css';

const SplitPane: React.FC<{ children: React.ReactNode[] }> = ({ children }) => {
  if (children.length !== 3) {
    throw new Error('SplitPane requires exactly 3 children');
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [paneWidths, setPaneWidths] = useState<[number, number, number]>([33.33, 33.33, 33.33]);

  const createSplitterHandler = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const containerWidth = containerRef.current!.offsetWidth;
    const startWidths = [...paneWidths];

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = ((e.clientX - startX) / containerWidth) * 100;

      const newWidths = [...startWidths] as [number, number, number];
      newWidths[index] = Math.max(0, Math.min(90, startWidths[index] + deltaX));
      newWidths[index + 1] = Math.max(0, Math.min(90, startWidths[index + 1] - deltaX));

      // Normalize if total > 100%
      const total = newWidths[0] + newWidths[1] + newWidths[2];
      setPaneWidths(newWidths.map(w => (w / total) * 100) as [number, number, number]);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

return (
  <div className="split-pane-container" ref={containerRef}>
    <Pane width={paneWidths[0]}>{children[0]}</Pane>
    <Splitter onMouseDown={createSplitterHandler(0)} label="Saved/Bookmark" />
    <Pane width={paneWidths[1]}>{children[1]}</Pane>
    <Splitter onMouseDown={createSplitterHandler(1)} label="Timeline/Up-next" />
    <Pane width={paneWidths[2]}>{children[2]}</Pane>
  </div>
);

};

export default SplitPane;
