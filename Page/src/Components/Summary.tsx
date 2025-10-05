// src/Components/Summary.tsx
import React from 'react';
import './JournalBox.css';

interface SummaryProps {
  text: string;
  style?: React.CSSProperties; // ✅ add optional style prop
}

const Summary: React.FC<SummaryProps> = ({ text, style }) => {
  return <p className="paper-title" style={style}>{text}</p>;
};

export default Summary;
