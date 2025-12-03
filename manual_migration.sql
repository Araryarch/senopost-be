-- Manual Migration: Add preferences and follows
-- Run this in Supabase SQL Editor

-- Add new enum for follow target type
CREATE TYPE "FollowTargetType" AS ENUM ('user', 'community');

-- Add preference fields to User table
ALTER TABLE "User" 
ADD COLUMN "nsfwEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "spoilerEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add NSFW and spoiler fields to Post table
ALTER TABLE "Post"
ADD COLUMN "isNsfw" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isSpoiler" BOOLEAN NOT NULL DEFAULT false;

-- Create Follow table
CREATE TABLE "Follow" (
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("userId","targetId","targetType")
);

-- Add foreign key constraint
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX "Follow_userId_idx" ON "Follow"("userId");
CREATE INDEX "Follow_targetId_targetType_idx" ON "Follow"("targetId", "targetType");
