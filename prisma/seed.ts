import 'dotenv/config';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

function load<T = any>(file: string): T[] {
  const p = path.join(__dirname, 'seed-data', file);
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T[];
}

async function main() {
  console.log('Running seed (pg runner)...');

  const url = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL ?? process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('No DATABASE_URL or SUPABASE_DB_URL found in environment');
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  // Prevent unhandled driver errors from bubbling and crashing the process
  client.on('error', (err) => {
    console.warn('Postgres client error (non-fatal):', err && err.message ? err.message : err);
  });

  try {
    const users = load('users.json');
    for (const u of users) {
      const pwd = u.password ? await bcrypt.hash(u.password, 10) : null;
      await client.query(
        `INSERT INTO "User" (id, email, username, photo, password, provider, sub, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.email, u.username ?? null, u.photo ?? null, pwd, null, null]
      );
    }

    const communities = load('communities.json');
    for (const c of communities) {
      await client.query(
        `INSERT INTO "Community" (id, name, description, "creatorId", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.description ?? null, c.creatorId]
      );
    }

    const posts = load('posts.json');
    for (const p of posts) {
      await client.query(
        `INSERT INTO "Post" (id, title, content, img, "authorId", "communityId", "createdAt", "updatedAt", score) VALUES ($1,$2,$3,$4,$5,$6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0) ON CONFLICT (id) DO NOTHING`,
        [p.id, p.title, p.content ?? null, p.img ?? null, p.authorId, p.communityId]
      );
    }

    const comments = load('comments.json');
    for (const c of comments) {
      await client.query(
        `INSERT INTO "Comment" (id, content, "authorId", "postId", "parentId", "createdAt", "updatedAt", score) VALUES ($1,$2,$3,$4,$5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.content, c.authorId, c.postId, c.parentId ?? null]
      );
    }

    const votes = load('votes.json');
    for (const v of votes) {
      await client.query(
        `INSERT INTO "Vote" ("userId","targetId","targetType",value,"createdAt","updatedAt") VALUES ($1,$2,$3,$4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("userId","targetId","targetType") DO NOTHING`,
        [v.userId, v.targetId, v.targetType, v.value]
      );
    }

    // Recalculate scores
    await client.query(`UPDATE "Post" SET score = COALESCE(sub.sum,0) FROM (SELECT "targetId", SUM(value) as sum FROM "Vote" WHERE "targetType"='post' GROUP BY "targetId") sub WHERE "Post".id = sub."targetId"`);
    await client.query(`UPDATE "Comment" SET score = COALESCE(sub.sum,0) FROM (SELECT "targetId", SUM(value) as sum FROM "Vote" WHERE "targetType"='comment' GROUP BY "targetId") sub WHERE "Comment".id = sub."targetId"`);

    console.log('Seed completed');
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Some Postgres servers (e.g. Supabase) may close the connection abruptly
      // after we finish; ignore shutdown-related errors when closing.
      console.warn('Error while closing Postgres client (ignored):', e && e.message ? e.message : e);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
