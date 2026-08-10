export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface VideoLink {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  description?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // Markdown text
  imageUrl?: string; // Generated visual base64 or URL
  imagePrompt?: string; // Prompt used to generate visual
  audioBase64?: string; // Narrator audio tracking
  videos: VideoLink[];
  quiz: QuizQuestion[];
  mindMap: MindMapNode[];
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  sizeCategory: 'short' | 'medium' | 'long';
  createdAt: string;
  chapters: Chapter[];
}

export interface ConversionResponse {
  success: boolean;
  ebook: Ebook;
  message?: string;
}
