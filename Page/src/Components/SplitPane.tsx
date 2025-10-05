import React, { useState, useRef } from 'react';
import Pane from './Pane';
import Splitter from './Splitter';
import './SplitPane.css';

/**
 * SplitPane Component
 * -------------------
 * A horizontal layout container that splits its content into three resizable panes.
 * Users can drag the Splitters between panes to adjust their relative widths.
 *
 * Requirements:
 * - Exactly 3 child elements must be provided.
 *
 * Usage:
 * <SplitPane>
 *   <LeftPanel />
 *   <CenterPanel />
 *   <RightPanel />
 * </SplitPane>
 */
const SplitPane: React.FC<{ children: React.ReactNode[] }> = ({ children }) => {
  // Validate that exactly 3 children are passed
  if (children.length !== 3) {
    throw new Error('SplitPane requires exactly 3 children');
  }

  // Ref to the container DOM element for calculating widths
  const containerRef = useRef<HTMLDivElement>(null);

  // State: percentages of container width allocated to each pane
  const [paneWidths, setPaneWidths] = useState<[number, number, number]>([33.33, 33.33, 33.33]);

  /**
   * Generates a mouse down handler for a splitter at the given index
   * @param index Index of the splitter (0 = between pane 0 and 1, 1 = between pane 1 and 2)
   */
  const createSplitterHandler = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const containerWidth = containerRef.current!.offsetWidth;
    const startWidths = [...paneWidths];

    // Handle mouse movement while dragging the splitter
    const onMouseMove = (e: MouseEvent) => {
      const deltaX = ((e.clientX - startX) / containerWidth) * 100;

      // Update widths for the two panes adjacent to the splitter
      const newWidths = [...startWidths] as [number, number, number];
      newWidths[index] = Math.max(0, Math.min(90, startWidths[index] + deltaX));
      newWidths[index + 1] = Math.max(0, Math.min(90, startWidths[index + 1] - deltaX));

      // Normalize widths so total is exactly 100%
      const total = newWidths[0] + newWidths[1] + newWidths[2];
      setPaneWidths(newWidths.map(w => (w / total) * 100) as [number, number, number]);
    };

    // Cleanup: remove listeners when mouse is released
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    // Attach global listeners to handle drag outside the container
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="split-pane-container" ref={containerRef}>
      {/* Left pane */}
      <Pane width={paneWidths[0]}>{children[0]}</Pane>

      {/* Splitter between left and center panes */}
      <Splitter onMouseDown={createSplitterHandler(0)} label="Filters" />

      {/* Center pane */}
      <Pane width={paneWidths[1]}>{children[1]}</Pane>

      {/* Splitter between center and right panes */}
      <Splitter onMouseDown={createSplitterHandler(1)} label="AI Timeline" />

      {/* Right pane */}
      <Pane width={paneWidths[2]}>{children[2]}</Pane>
    </div>
  );
};

export default SplitPane;
