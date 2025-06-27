import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { forms, users } from '$lib/server/db/schema.js';
import { createGitHubIssue, getInstallationTokenFromFormId } from './gitHubAppAccess.js';

export async function createGithubIssue(formId, title, content, labels = []) {
    try {
        const { token, owner, repo } = await getInstallationTokenFromFormId(formId);

        const issue = await createGitHubIssue(token, owner, repo, { title, body: content, labels });

        return { success: true, issueUrl: issue.html_url, issueNumber: issue.number };
    } catch (error) {
        console.error('GitHub issue creation error:', error);
        throw error;
    }
}

export async function upvoteIssue(formId, issueNumber) {
    try {
        const { token, owner, repo } = await getInstallationTokenFromFormId(formId);

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/reactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: '+1' })
        });

        if (!response.ok) throw new Error(`Failed to upvote issue: ${response.status}`);
        return response.json();
    } catch (error) {
        console.error('Issue upvote error:', error);
        throw error;
    }
}

export async function addCommentToIssue(formId, issueNumber, comment) {
    try {
        const { token, owner, repo } = await getInstallationTokenFromFormId(formId);

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ body: comment })
        });

        if (!response.ok) throw new Error(`Failed to add comment: ${response.status}`);
        return response.json();
    } catch (error) {
        console.error('Comment creation error:', error);
        throw error;
    }
}