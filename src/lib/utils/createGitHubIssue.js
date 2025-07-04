import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { forms, users } from '$lib/server/db/schema.js';
import { getInstallationTokenFromFormId } from './gitHubAppAccess.js';
import { sendDiscordMessage } from './sendDiscordMessage.js';

async function createIssueRequest(token, owner, repo, issueData) {
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

export async function createGitHubIssue(formId, title, content, labels = []) {
    try {
        const { token, owner, repo } = await getInstallationTokenFromFormId(formId);
        const issue = await createIssueRequest(token, owner, repo, { title, body: content, labels });

        // Send Discord notification if configured
        const formData = await db.select({ discordWebhook: forms.discordWebhook, githubRepo: forms.githubRepo })
            .from(forms)
            .where(eq(forms.id, formId))
            .limit(1);

        if (formData.length && formData[0].discordWebhook) {
            await sendDiscordMessage(
                formData[0].discordWebhook,
                title,
                issue.html_url,
                formData[0].githubRepo
            );
        }

        return { success: true, issueUrl: issue.html_url, issueNumber: issue.number };
    } catch (error) {
        console.error('GitHub issue creation error:', error);
        throw error;
    }
}

const REACTIONS = ['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'];

export async function addReactionToIssue(formId, issueNumber) {
    try {
        const { token, owner, repo } = await getInstallationTokenFromFormId(formId);
        const randomReaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/reactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: randomReaction })
        });

        if (!response.ok && response.status != 422) throw new Error(`Failed to add reaction: ${response.status}`); // 422 just means that this reaction has already been added – which is okay

    } catch (error) {
        console.error('Issue reaction add error:', error);
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
    } catch (error) {
        console.error('Comment creation error:', error);
        throw error;
    }
}