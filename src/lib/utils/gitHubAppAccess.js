import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

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

export async function getInstallationToken(installationId) {
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

export async function createGitHubIssue(token, owner, repo, issueData) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(issueData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Issue creation failed: ${error.message || response.status}`);
  }
  
  return response.json();
}