// === Imports ===
import React from 'react';
import './TitleBox.css'; // Styles specific to the TitleBox component

// === Interface Definition ===
// Defines the props that the TitleBox component accepts
interface PaneTitleProps {
  title: string;       // The text to display inside the title box
  className?: string;  // Optional additional CSS class for styling (e.g., color variants)
}

// === Functional Component ===
// Displays a title inside a styled box — used for labeling panes or sections
const TitleBox: React.FC<PaneTitleProps> = ({ title, className = '' }) => {
  return (
    // Combines the default 'pane-title' style with any custom class passed as a prop
    <div className={`pane-title ${className}`}>
      {title} {/* Renders the title text */}
    </div>
  );
};

// === Export ===
// Makes the component available for import in other files
export default TitleBox;
