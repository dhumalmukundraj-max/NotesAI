-- STUDYNOTES AI - Database Setup & Seeding Script
-- Paste this script directly in the Supabase SQL Editor and run it.

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college TEXT,
  branch TEXT,
  semester TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_text TEXT, -- Stores text extracted from notes for AI context
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  downloads INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, note_id)
);

-- 5. Create Ratings Table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, note_id)
);

-- 6. Create Downloads Table
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create AI Chats Table
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.ai_chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 11. Create Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_branch ON public.notes(branch);
CREATE INDEX IF NOT EXISTS idx_notes_semester ON public.notes(semester);
CREATE INDEX IF NOT EXISTS idx_notes_uploaded_by ON public.notes(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_views ON public.notes(views);
CREATE INDEX IF NOT EXISTS idx_notes_downloads ON public.notes(downloads);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_note_id ON public.bookmarks(note_id);
CREATE INDEX IF NOT EXISTS idx_ratings_note_id ON public.ratings(note_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_id ON public.ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_chat_id ON public.ai_messages(chat_id);

-- 12. RLS Policies

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "System creates profile on sign up" ON public.profiles;
CREATE POLICY "System creates profile on sign up" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subjects Policies
DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON public.subjects;
CREATE POLICY "Subjects are viewable by everyone" ON public.subjects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Notes Policies
DROP POLICY IF EXISTS "Anyone can view approved notes" ON public.notes;
CREATE POLICY "Anyone can view approved notes" ON public.notes
  FOR SELECT USING (status = 'approved' OR uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can upload notes" ON public.notes;
CREATE POLICY "Authenticated users can upload notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can update/delete own notes" ON public.notes;
CREATE POLICY "Users can update/delete own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Admins can manage all notes" ON public.notes;
CREATE POLICY "Admins can manage all notes" ON public.notes
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Bookmarks Policies
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Ratings Policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create/update own ratings" ON public.ratings;
CREATE POLICY "Users can create/update own ratings" ON public.ratings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Downloads Policies
DROP POLICY IF EXISTS "Users can view own downloads" ON public.downloads;
CREATE POLICY "Users can view own downloads" ON public.downloads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert downloads" ON public.downloads;
CREATE POLICY "Users can insert downloads" ON public.downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports Policies
DROP POLICY IF EXISTS "Users can report notes" ON public.reports;
CREATE POLICY "Users can report notes" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports" ON public.reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- AI Chats Policies
DROP POLICY IF EXISTS "Users can view own AI chats" ON public.ai_chats;
CREATE POLICY "Users can view own AI chats" ON public.ai_chats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own AI chats" ON public.ai_chats;
CREATE POLICY "Users can manage own AI chats" ON public.ai_chats
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- AI Messages Policies
DROP POLICY IF EXISTS "Users can view own AI messages" ON public.ai_messages;
CREATE POLICY "Users can view own AI messages" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ai_chats WHERE id = chat_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own AI messages" ON public.ai_messages;
CREATE POLICY "Users can insert own AI messages" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_chats WHERE id = chat_id AND user_id = auth.uid())
  );

-- 13. Profile Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, college, branch, semester, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    new.email,
    new.raw_user_meta_data->>'college',
    new.raw_user_meta_data->>'branch',
    new.raw_user_meta_data->>'semester',
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Seed Subjects Data
INSERT INTO public.subjects (id, name, branch, semester) VALUES
  ('a0b1c2d3-0000-0000-0000-000000000001', 'Python Programming', 'Computer Science & Engineering', '3'),
  ('a0b1c2d3-0000-0000-0000-000000000002', 'Database Management Systems', 'Computer Science & Engineering', '4'),
  ('a0b1c2d3-0000-0000-0000-000000000003', 'Data Structures & Algorithms', 'Computer Science & Engineering', '3'),
  ('a0b1c2d3-0000-0000-0000-000000000004', 'Operating Systems', 'Computer Science & Engineering', '4'),
  ('a0b1c2d3-0000-0000-0000-000000000005', 'Computer Networks', 'Computer Science & Engineering', '5'),
  ('a0b1c2d3-0000-0000-0000-000000000006', 'Engineering Mathematics I', 'Computer Science & Engineering', '1'),
  ('a0b1c2d3-0000-0000-0000-000000000007', 'C Programming Basics', 'Computer Science & Engineering', '1'),
  ('a0b1c2d3-0000-0000-0000-000000000008', 'Web Development', 'Computer Science & Engineering', '2')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  branch = EXCLUDED.branch,
  semester = EXCLUDED.semester;

-- 15. RPC Functions to increment metrics bypassing RLS securely
CREATE OR REPLACE FUNCTION public.increment_views(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notes
  SET views = views + 1
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_downloads(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notes
  SET downloads = downloads + 1
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

