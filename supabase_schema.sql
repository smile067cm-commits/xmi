-- =========================================================
-- Supabase Schema for Telegram Content Hub & Bot App
-- Run this in your Supabase Project SQL Editor
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    preview_image TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    scheduled_at TIMESTAMPTZ,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying published & scheduled posts quickly
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 2. FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_post_id ON public.folders(post_id);

-- 3. FILES TABLE
CREATE TABLE IF NOT EXISTS public.files (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    folder_id BIGINT NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,
    channel_message_id BIGINT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    size BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);

-- 4. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    username TEXT NOT NULL DEFAULT 'User',
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);

-- 5. LIKES TABLE (Composite Primary Key prevents duplicate likes per user)
CREATE TABLE IF NOT EXISTS public.likes (
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Disable Row Level Security (RLS) or add public read policy since Cloudflare Worker uses Service Role Key
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role key (bypasses RLS by default, policy ensures safety)
CREATE POLICY "Allow service_role full access to posts" ON public.posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access to folders" ON public.folders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access to files" ON public.files FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access to comments" ON public.comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access to likes" ON public.likes FOR ALL TO service_role USING (true) WITH CHECK (true);
