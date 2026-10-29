-- ==========================================================================
-- СХЕМА БАЗЫ ДАННЫХ SUPABASE: ШКОЛЬНАЯ ПЛАНЁРКА (SCHOOL PLANNER)
-- ==========================================================================
-- Скопируйте и выполните этот скрипт в разделе SQL Editor панели Supabase

-- 1. Таблица профилей и сотрудников
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'head_teacher', 'teacher')),
  role_title TEXT NOT NULL,
  subject TEXT,
  class_leader TEXT,
  phone TEXT,
  login TEXT UNIQUE NOT NULL,
  avatar TEXT
);

-- 2. Таблица поручений и задач
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT NOT NULL,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'submitted', 'completed', 'revision')),
  requires_file BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'Отчетность',
  teacher_comment TEXT,
  review_comment TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ
);

-- 3. Таблица загруженных файлов (сохраненных в GitHub / облаке)
CREATE TABLE IF NOT EXISTS public.task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size TEXT NOT NULL,
  download_url TEXT NOT NULL,
  storage_type TEXT DEFAULT 'github'
);

-- 4. Таблица планёрок и педсоветов
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'planerka' CHECK (type IN ('planerka', 'pedsovet', 'soveshanie', 'shkola')),
  type_label TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TEXT NOT NULL,
  location TEXT NOT NULL,
  leader TEXT NOT NULL,
  agenda JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- 5. Таблица уведомлений
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'task',
  is_read BOOLEAN DEFAULT false
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_files_task ON public.task_files(task_id);

-- Включение Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Публичные политики для школьного портала (чтение и запись авторизованными пользователями)
CREATE POLICY "Разрешить чтение всем сотрудникам" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Разрешить чтение поручений всем сотрудникам" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Разрешить обновление поручений" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Разрешить работу с файлами" ON public.task_files FOR ALL USING (true);
CREATE POLICY "Разрешить чтение планёрок" ON public.meetings FOR ALL USING (true);
CREATE POLICY "Разрешить работу с уведомлениями" ON public.notifications FOR ALL USING (true);
