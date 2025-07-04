import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '$env/static/private';

if (!DB_HOST) throw new Error('DB_HOST is not set');

const client = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true // Connection limit and queue limit are 10 / 0 by default
});

export const db = drizzle(client, { schema, mode: 'default' });