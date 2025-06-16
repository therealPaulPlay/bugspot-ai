import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DB_HOST) throw new Error('DB_HOST is not set');

const client = mysql.createPool(env.DB_HOST);
export const db = drizzle(client, { schema, mode: 'default' });
