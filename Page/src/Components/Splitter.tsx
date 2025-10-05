import React from 'react';

/**
 * Props for the Splitter component.
 * @property onMouseDown - Callback fired when the user clicks and holds the splitter (used to start dragging/resizing).
 * @property label - Optional text displayed inside the splitter for clarity or accessibility.
 */
interface SplitterProps {
  onMouseDown: (e: React.MouseEvent) => void;
  label?: string;
}

/**
 * Splitter Component
 * ------------------
 * A thin draggable divider used to resize adjacent panes or panels in a layout.
 * When clicked and dragged, it triggers the `onMouseDown` handler from the parent.
 *
 * Example usage:
 * <Splitter onMouseDown={handleResizeStart} label="Resize" />
 */
const Splitter: React.FC<SplitterProps> = ({ onMouseDown, label }) => {
  return (
    <div className="splitter" onMouseDown={onMouseDown}>
      {/* Optional label — displayed only if provided */}
      {label && <span className="splitter-label">{label}</span>}
    </div>
  );
};

export default Splitter;
