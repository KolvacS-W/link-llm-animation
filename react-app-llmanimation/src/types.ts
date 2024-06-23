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
    id: string; // Change id to string to store custom names
    description: string;
    savedDescription: string;
    code: { html: string; css: string; js: string };
    latestCode: { html: string; css: string; js: string };
    keywordTree: KeywordTree[];
    wordselected: string;
    highlightEnabled: boolean; // Add highlightEnabled
    loading: boolean; // Add loading
    piecesToHighlightLevel1: string[]; // Add piecesToHighlightLevel1
    piecesToHighlightLevel2: string[]; // Add piecesToHighlightLevel2
  }
  
  