import React from 'react';

interface SplitterProps {
  onMouseDown: (e: React.MouseEvent) => void;
  label?: string;
}

const Splitter: React.FC<SplitterProps> = ({ onMouseDown, label }) => {
  return (
    <div className="splitter" onMouseDown={onMouseDown}>
      {label && <span className="splitter-label">{label}</span>}
    </div>
  );
};

export default Splitter;
