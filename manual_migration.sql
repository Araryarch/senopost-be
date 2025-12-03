-- Manual Migration: Complete Schema Update
-- Run this in Supabase SQL Editor
-- This script applies ALL schema changes needed for the application

-- 1. Add new enum for follow target type (community only)
DO $$ BEGIN
  CREATE TYPE "FollowTargetType" AS ENUM ('community');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add preference and profile fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "nsfwEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "spoilerEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "linkX" TEXT,
ADD COLUMN IF NOT EXISTS "linkGithub" TEXT,
ADD COLUMN IF NOT EXISTS "linkWebsite" TEXT,
ADD COLUMN IF NOT EXISTS "linkInstagram" TEXT;

-- Add unique constraint to username if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_username_key'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
  END IF;
END 
$$;

-- 3. Add NSFW and spoiler fields to Post table
ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "isNsfw" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isSpoiler" BOOLEAN NOT NULL DEFAULT false;

-- 4. Rename creatorId to authorId in Community table (if not already renamed)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Community' AND column_name = 'creatorId'
  ) THEN
    ALTER TABLE "Community" RENAME COLUMN "creatorId" TO "authorId";
  END IF;
END $$;

-- 5. Create Follow table
CREATE TABLE IF NOT EXISTS "Follow" (
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("userId","targetId","targetType")
);

-- 6. Add foreign key constraint (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Follow_userId_fkey'
  ) THEN
    ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Follow_userId_idx" ON "Follow"("userId");
CREATE INDEX IF NOT EXISTS "Follow_targetId_targetType_idx" ON "Follow"("targetId", "targetType");
