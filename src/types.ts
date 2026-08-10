export type UserRole = 'admin' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
}

export type BookCategory = 'all' | 'digital_book' | 'training_kit' | 'quiz_bank' | 'academic_paper';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  questionType?: 'mcq' | 'true_false' | 'case_study';
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
  category?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // Markdown text (fallback)
  originalContent?: string; // Original parsed text from the document
  summary?: string; // Chapter summary
  concepts?: { concept: string; explanation: string }[]; // Concepts and their explanations
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
  author_name?: string;
  category?: BookCategory;
  tags?: string[];
  price?: number; // 0 = Free
  is_external?: boolean;
  external_url?: string;
  is_published?: boolean;
  thumbnail_url?: string;
  rating?: number;
  reviews_count?: number;
  sizeCategory?: 'short' | 'medium' | 'long';
  createdAt?: string;
  chapters: Chapter[];
  mind_map?: MindMapNode[];
  question_bank?: QuizQuestion[];
}

export interface MarketplaceBook extends Ebook {
  id: string;
  title: string;
  description: string;
  author_name: string;
  category: BookCategory;
  tags: string[];
  price: number;
  is_external: boolean;
  external_url?: string;
  is_published: boolean;
  thumbnail_url: string;
  rating: number;
  reviews_count: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  book_id: string;
  score: number;
  total_questions: number;
  answers_log: { questionId: string; selectedOption: number; isCorrect: boolean }[];
  completed_at: string;
}

export interface ConversionResponse {
  success: boolean;
  ebook: Ebook;
  message?: string;
}
