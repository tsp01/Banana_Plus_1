import React from 'react';
import './TitleBox.css';

interface PaneTitleProps {
  title: string;
  className?: string; // optional for custom color classes
}

const TitleBox: React.FC<PaneTitleProps> = ({ title, className = '' }) => {
  return <div className={`pane-title ${className}`}>{title}</div>;
};

export default TitleBox;
