-- Production Database Diagnostic Script
-- Run this in Supabase SQL Editor to check database state

-- Check if all required columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('User', 'Post', 'Community', 'Follow')
ORDER BY table_name, ordinal_position;

-- Check if Follow table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'Follow'
) AS follow_table_exists;

-- Check if FollowTargetType enum exists
SELECT EXISTS (
  SELECT FROM pg_type 
  WHERE typname = 'FollowTargetType'
) AS follow_enum_exists;

-- Check if username unique constraint exists
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conname = 'User_username_key';

-- Count records in each table
SELECT 'User' AS table_name, COUNT(*) AS record_count FROM "User"
UNION ALL
SELECT 'Community', COUNT(*) FROM "Community"
UNION ALL
SELECT 'Post', COUNT(*) FROM "Post"
UNION ALL
SELECT 'Comment', COUNT(*) FROM "Comment"
UNION ALL
SELECT 'Follow', COUNT(*) FROM "Follow";
