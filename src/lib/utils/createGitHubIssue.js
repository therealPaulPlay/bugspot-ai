import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { forms, users } from '$lib/server/db/schema.js';
import { getInstallationToken, createGitHubIssue } from './gitHubAppAccess.js';

export async function createGithubIssue(formId, title, content, labels = ['Bugspot']) {
    try {
        // Get form with user data
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

        const issue = await createGitHubIssue(token, owner, repo, {
            title,
            body: content,
            labels
        });

        return {
            success: true,
            issueUrl: issue.html_url,
            issueNumber: issue.number
        };

    } catch (error) {
        console.error('GitHub issue creation error:', error);
        throw error;
    }
}