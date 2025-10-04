// src/data/papers.ts

export interface Paper {
  title: string;
  authors: string;
  keywords: string[];
  abstractSnippet: string;
} 

export const papers: Paper[] = [
  {
    title: 'HELP ME',
    authors: 'Alice, Bob',
    keywords: ['Quantum', 'Physics'],
    abstractSnippet:
      'This paper studies the behavior of quantum particles under extreme conditions. This paper studies the behavior of quantum particles under extreme conditions. ',
  },
  {
    title: 'Paper 2: Machine Learning',
    authors: 'Carol, Dave',
    keywords: ['AI', 'Neural Networks'],
    abstractSnippet:
      'We explore a new architecture for deep neural networks that improves accuracy...',
  },
];
