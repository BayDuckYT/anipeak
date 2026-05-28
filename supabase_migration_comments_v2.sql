-- ═══════════════════════════════════════════════════════════
-- MahoraPeak Comment System v2 — Instagram-style Migration
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run
-- ═══════════════════════════════════════════════════════════

-- 1. Add parent_id to comments for reply threading (BIGINT to match id column)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE;

-- 2. Create comment_likes table for toggle like/unlike
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_user_id UUID,
  from_username TEXT,
  type TEXT NOT NULL DEFAULT 'reply',
  comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  series_id BIGINT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for comment_likes
DROP POLICY IF EXISTS "comment_likes_select" ON comment_likes;
DROP POLICY IF EXISTS "comment_likes_insert" ON comment_likes;
DROP POLICY IF EXISTS "comment_likes_delete" ON comment_likes;
CREATE POLICY "comment_likes_select" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "comment_likes_insert" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_likes_delete" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policies for notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- 8. Allow users to delete their own comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comments_delete_own') THEN
    CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
