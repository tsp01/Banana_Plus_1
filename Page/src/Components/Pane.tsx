import React from 'react';

interface PaneProps {
  width: number; // percentage
  children: React.ReactNode;
}

const Pane: React.FC<PaneProps> = ({ width, children }) => {
  return (
    <div
      className="pane"
      style={{
        width: `${width}%`,
      }}
    >
      {children}
    </div>
  );
};

export default Pane;
