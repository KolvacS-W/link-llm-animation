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
    id: string;
    description: string;
    savedDescription: string;
    code: { html: string; css: string; js: string };
    latestCode: { html: string; css: string; js: string };
    keywordTree: KeywordTree[];
    wordselected: string;
    highlightEnabled: boolean;
    loading: boolean;
    piecesToHighlightLevel1: string[];
    piecesToHighlightLevel2: string[];
    showDetails: { [word: string]: boolean };
    latestText: string;
    hiddenInfo: string[];
    initialValue: string;
    specificParamList: string[]; // Add this line
    paramCheckEnabled: boolean;  // Add this line
  }
  
  
  
  