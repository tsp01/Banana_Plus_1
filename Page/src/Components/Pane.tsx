import React from 'react';

/**
 * Props for the Pane component
 * @property width - Width of the pane as a percentage of the container
 * @property children - Content to render inside the pane
 */
interface PaneProps {
  width: number;         // Percentage width of the pane (0–100)
  children: React.ReactNode; // Elements or components to render inside the pane
}

/**
 * Pane Component
 * --------------
 * A flexible container used within a SplitPane layout.
 * The width of the pane is controlled dynamically via props.
 *
 * Usage:
 * <Pane width={50}>Left content</Pane>
 */
const Pane: React.FC<PaneProps> = ({ width, children }) => {
  return (
    <div
      className="pane"
      style={{
        width: `${width}%`, // Dynamically set width based on parent state
      }}
    >
      {children} {/* Render the content passed as children */}
    </div>
  );
};

export default Pane;
