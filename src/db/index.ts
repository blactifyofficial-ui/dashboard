import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';
// For HTTP serverless queries (neon()), bypass PgBouncer pooler suffix if present,
// since neon() handles its own serverless pooling and endpoints may have pooling disabled.
const dbUrl = rawUrl.replace(/-pooler\./, '.');

const sql = neon(dbUrl);
export const db = drizzle(sql, { schema });

