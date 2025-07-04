import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { forms, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const GITHUB_APP_ID = env.GITHUB_APP_ID;
const GITHUB_APP_PRIVATE_KEY = env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'); // Parse escaped newlines

function generateAppJWT() {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({
    iat: now - 60,
    exp: now + (10 * 60),
    iss: GITHUB_APP_ID
  }, GITHUB_APP_PRIVATE_KEY, { algorithm: 'RS256' });
}

async function getInstallationToken(installationId) {
  const appJWT = generateAppJWT();

  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${appJWT}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) throw new Error(`Token fetch failed: ${response.status}`);

  const data = await response.json();
  return data.token;
}

export async function getInstallationTokenFromFormId(formId) {
  const formData = await db
    .select({ form: forms, user: users })
    .from(forms)
    .innerJoin(users, eq(forms.userId, users.id))
    .where(eq(forms.id, formId))
    .limit(1);

  if (!formData.length) throw new Error('Form not found');

  const { form, user } = formData[0];
  if (!form.githubRepo) throw new Error('No GitHub repository configured');
  if (!user.githubInstallationId) throw new Error('GitHub App not installed');

  const [owner, repo] = form.githubRepo.split('/');
  const token = await getInstallationToken(user.githubInstallationId);
  return { token, owner, repo };
}