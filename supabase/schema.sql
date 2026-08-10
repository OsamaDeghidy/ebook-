-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student', -- 'student' or 'admin'
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Books Table (Interactive AI Ebooks, Question Banks, External Links)
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  author_name TEXT DEFAULT 'د. كريم كامل',
  category TEXT DEFAULT 'digital_book', -- 'digital_book', 'training_kit', 'quiz_bank', 'academic_paper'
  tags TEXT[] DEFAULT ARRAY['كتاب_تفاعلي'],
  price NUMERIC DEFAULT 0, -- 0 for free
  is_external BOOLEAN DEFAULT FALSE,
  external_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  thumbnail_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 120,
  chapters JSONB DEFAULT '[]'::jsonb,
  mind_map JSONB DEFAULT '{}'::jsonb,
  question_bank JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published books are viewable by everyone" ON public.books
  FOR SELECT USING (is_published = TRUE OR auth.role() = 'authenticated');

CREATE POLICY "Admins can insert books" ON public.books
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update books" ON public.books
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete books" ON public.books
  FOR DELETE USING (true);

-- 3. Purchases Table (Student Unlocked Content)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert purchase" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Quiz Attempts & Assessment Records Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  answers_log JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can log quiz attempt" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
