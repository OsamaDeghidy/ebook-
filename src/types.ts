export type UserRole = 'admin' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
}

export type BookCategory = 'all' | 'digital_book' | 'training_kit' | 'quiz_bank' | 'academic_paper' | 'self_help' | 'business' | 'technology' | 'classics';

export type BookTrack = 'academic' | 'self_help' | 'business_finance' | 'programming_tech' | 'science_math' | 'languages' | 'general_literature';

export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'case_study';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  questionType?: QuestionType;
  difficulty?: 'easy' | 'medium' | 'hard';
  topicTag?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  chapterTitle?: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  lastReviewed?: string;
  intervalDays?: number;
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
  audioUrl?: string; // Supabase CDN audio URL
  podcastAudioUrl?: string; // Supabase CDN podcast episode URL
  videos: VideoLink[];
  quiz: QuizQuestion[];
  flashcards?: Flashcard[];
  mindMap: MindMapNode[];
}

export interface FeatureToggles {
  show_podcast?: boolean;
  show_flashcards?: boolean;
  show_sandbox?: boolean;
  show_quiz?: boolean;
  show_mindmap?: boolean;
  show_videos?: boolean;
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  author_name?: string;
  category?: BookCategory;
  track?: BookTrack;
  subcategory?: string;
  grade_level?: string;
  semester?: string;
  academic_year?: string;
  source_file_name?: string;
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
  created_at?: string;
  chapters: Chapter[];
  mind_map?: MindMapNode[];
  question_bank?: QuizQuestion[];
  flashcards?: Flashcard[];
  feature_toggles?: FeatureToggles;
  pregeneration_status?: 'idle' | 'processing' | 'ready';
  pregeneration_percent?: number;
}

export interface MarketplaceBook extends Ebook {
  id: string;
  title: string;
  description: string;
  author_name: string;
  category: BookCategory;
  track?: BookTrack;
  subcategory?: string;
  grade_level?: string;
  semester?: string;
  academic_year?: string;
  source_file_name?: string;
  tags: string[];
  price: number;
  is_external: boolean;
  external_url?: string;
  is_published: boolean;
  thumbnail_url: string;
  rating: number;
  reviews_count: number;
  feature_toggles?: FeatureToggles;
  pregeneration_status?: 'idle' | 'processing' | 'ready';
  pregeneration_percent?: number;
}

export interface ConversionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  progressStep: string;
  resultEbook?: Ebook;
  error?: string;
  createdAt: string;
}
