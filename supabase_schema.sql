-- =========================================================
-- Supabase Schema for Telegram Content Hub & Bot App
-- (Single Database: Users, Posts, Folders, Files, Comments, Likes, Views, File Logs)
-- Paste and run this script in your Supabase SQL Editor
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Stores user profiles, activity & interaction counts)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT DEFAULT 'en',
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    interactions BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_users_last_activity ON public.users(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 2. POSTS TABLE (Includes direct links and promotion/featuring)
CREATE TABLE IF NOT EXISTS public.posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    preview_image TEXT,
    direct_link TEXT,
    direct_link_title TEXT,
    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    scheduled_at TIMESTAMPTZ,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema upgrades for existing posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS direct_link TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS direct_link_title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_is_promoted ON public.posts(is_promoted DESC);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 3. FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_post_id ON public.folders(post_id);

-- 4. FILES TABLE (Supports both uploaded Telegram files & external download links)
CREATE TABLE IF NOT EXISTS public.files (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    folder_id BIGINT NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,
    channel_message_id BIGINT,
    file_name TEXT,
    mime_type TEXT,
    size BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.files ALTER COLUMN channel_message_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);

-- 5. COMMENTS TABLE (Includes is_hidden for Admin Moderation)
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    username TEXT NOT NULL DEFAULT 'User',
    text TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);

-- 6. LIKES TABLE (Composite Primary Key prevents duplicate likes per user)
CREATE TABLE IF NOT EXISTS public.likes (
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- 7. POST VIEWS TABLE (Tracks which users viewed each post)
CREATE TABLE IF NOT EXISTS public.post_views (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    username TEXT,
    first_name TEXT,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at DESC);

-- 8. FILE ACCESS LOGS (Tracks which users downloaded/got files or links)
CREATE TABLE IF NOT EXISTS public.file_access_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    folder_id BIGINT REFERENCES public.folders(id) ON DELETE CASCADE,
    file_id TEXT,
    item_name TEXT NOT NULL,
    user_id BIGINT NOT NULL,
    username TEXT,
    first_name TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_access_post_id ON public.file_access_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_file_access_user_id ON public.file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_at ON public.file_access_logs(accessed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role key (Drop first if exists to prevent 42710 error)
DROP POLICY IF EXISTS "Allow service_role full access to users" ON public.users;
CREATE POLICY "Allow service_role full access to users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to posts" ON public.posts;
CREATE POLICY "Allow service_role full access to posts" ON public.posts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to folders" ON public.folders;
CREATE POLICY "Allow service_role full access to folders" ON public.folders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to files" ON public.files;
CREATE POLICY "Allow service_role full access to files" ON public.files FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to comments" ON public.comments;
CREATE POLICY "Allow service_role full access to comments" ON public.comments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to likes" ON public.likes;
CREATE POLICY "Allow service_role full access to likes" ON public.likes FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to post_views" ON public.post_views;
CREATE POLICY "Allow service_role full access to post_views" ON public.post_views FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to file_access_logs" ON public.file_access_logs;
CREATE POLICY "Allow service_role full access to file_access_logs" ON public.file_access_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
