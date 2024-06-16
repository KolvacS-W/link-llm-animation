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
  