import { env } from '$env/dynamic/private';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './JS/schema.js',
    dialect: 'mysql',
    out: './drizzle',
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
	strict: true
});