// src/types.ts

export interface KeywordNode {
    keyword: string;
    children: KeywordNode[];
    subKeywords: string[];
    codeBlock: string; // Add codeBlock to store the code block for this keyword
    parentKeyword: string | null; // Add parentKeyword to trace the parent keyword
  }
  
  export interface KeywordTree {
    level: number;
    keywords: KeywordNode[];
  }

  export interface Version {
    id: string; // Custom names for version IDs
    description: string;
    savedDescription: string;
    code: { html: string; css: string; js: string };
    latestCode: { html: string; css: string; js: string };
    keywordTree: KeywordTree[];
    wordselected: string;
    highlightEnabled: boolean; // To control if highlighting is enabled
    loading: boolean; // To indicate loading state
    piecesToHighlightLevel1: string[]; // Level 1 highlight pieces
    piecesToHighlightLevel2: string[]; // Level 2 highlight pieces
    showDetails: { [key: string]: boolean }; // To manage showing details for words
    latestText: string; // To store the latest text
    hiddenInfo: string[]; // To manage hidden information details
    initialValue: string;
  }
  
  
  