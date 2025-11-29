import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = (
      process.env.DIRECT_URL ?? 
      process.env.DATABASE_URL ?? 
      process.env.SUPABASE_DB_URL ?? 
      process.env.SUPABASE_URL
    )?.replace(/^"|"$/g, '');

    if (!connectionString) {
      throw new Error('Database connection string not found in environment variables');
    }

    super({ adapter: new PrismaPg(new Pool({ connectionString })) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
