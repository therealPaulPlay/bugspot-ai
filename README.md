# Bugspot
Bugspot uses [Svelte 5](https://svelte.dev) & SvelteKit. For styling, [Tailwind](https://tailwindcss.com) is used together with [Shadcn-svelte](https://www.shadcn-svelte.com).
LLMs are being interfaced with using [OpenRouter](https://openrouter.ai). 

## Developing
First, set the environment variables by creating a `.env` file. Take a look at the `.env.example` file to see which variables need to be provided.

For configuring the database, you'll have to run `npm run db:push` which uses the [Drizzle](https://orm.drizzle.team/) ORM to create all the necessary tables, indexes and keys.

Then, install dependencies with `npm install` (or `pnpm install` or `yarn`) and start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```
