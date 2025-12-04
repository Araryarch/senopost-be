-- Drop and recreate database schema with CASCADE deletes
-- WARNING: This will DROP ALL TABLES and recreate them!

-- Drop all tables if they exist
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Follow" CASCADE;
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Post" CASCADE;
DROP TABLE IF EXISTS "Community" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop enums if they exist
DROP TYPE IF EXISTS "VoteTargetType" CASCADE;
DROP TYPE IF EXISTS "FollowTargetType" CASCADE;

-- Create enums
CREATE TYPE "VoteTargetType" AS ENUM ('post', 'comment');
CREATE TYPE "FollowTargetType" AS ENUM ('community');

-- Create User table
CREATE TABLE "User" (
    id TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT UNIQUE,
    photo TEXT,
    bio TEXT,
    password TEXT,
    provider TEXT,
    sub TEXT UNIQUE,
    "nsfwEnabled" BOOLEAN NOT NULL DEFAULT false,
    "spoilerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "linkX" TEXT,
    "linkGithub" TEXT,
    "linkWebsite" TEXT,
    "linkInstagram" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "User_pkey" PRIMARY KEY (id),
    CONSTRAINT "User_email_key" UNIQUE (email)
);

-- Create Community table
CREATE TABLE "Community" (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Community_pkey" PRIMARY KEY (id),
    CONSTRAINT "Community_name_key" UNIQUE (name),
    CONSTRAINT "Community_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Post table
CREATE TABLE "Post" (
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    img TEXT,
    "isNsfw" BOOLEAN NOT NULL DEFAULT false,
    "isSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    score INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "Post_pkey" PRIMARY KEY (id),
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Comment table
CREATE TABLE "Comment" (
    id TEXT NOT NULL,
    content TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    score INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "Comment_pkey" PRIMARY KEY (id),
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Vote table
CREATE TABLE "Vote" (
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "VoteTargetType" NOT NULL,
    value INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Vote_pkey" PRIMARY KEY ("userId", "targetId", "targetType"),
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Follow table
CREATE TABLE "Follow" (
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("userId", "targetId", "targetType"),
    CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "Community_authorId_idx" ON "Community"("authorId");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_communityId_idx" ON "Post"("communityId");
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");
CREATE INDEX "Vote_targetId_idx" ON "Vote"("targetId");
CREATE INDEX "Follow_userId_idx" ON "Follow"("userId");
CREATE INDEX "Follow_targetId_idx" ON "Follow"("targetId");
