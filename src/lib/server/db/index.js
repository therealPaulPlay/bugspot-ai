import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import * as env from '$env/static/private';

if (!env.DB_HOST) throw new Error('DB_HOST is not set');

const client = mysql.createPool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true // Connection limit and queue limit are 10 / 0 by default
});

export const db = drizzle(client, { schema, mode: 'default' });