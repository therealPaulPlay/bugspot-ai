import { json } from '@sveltejs/kit';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { forms, users, submittedReports } from '$lib/server/db/schema.js';
import { createGitHubIssue, addReactionToIssue, addCommentToIssue } from '$lib/utils/createGitHubIssue.js';
import { getIssuesTitles, getIssueContent } from '$lib/utils/getGitHubIssue.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { spacesClient, getBaseURL } from '$lib/server/s3/index.js';
import { validateCaptcha } from '$lib/utils/validateCaptcha.js';
import * as env from '$env/static/private';
import { get } from 'svelte/store';
import { tiers } from '$lib/stores/tiers.js';

const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
const pendingReports = new Map();

async function makeAIRequest(messages) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages,
            max_tokens: 3000
        })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        throw new Error(`AI request failed (${response.status} ${response.statusText}): ${errorText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

async function checkReportRateLimit(ip) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentReports = await db.select().from(submittedReports)
        .where(and(eq(submittedReports.reporterIp, ip), sql`${submittedReports.createdAt} > ${sixHoursAgo}`));
    return recentReports.length >= 5; // Limit to 5 per 6 hour period
}

function getS3KeyFromUrl(url) {
    if (!url) return null;
    const baseURL = getBaseURL();
    return url.startsWith(baseURL) ? url.replace(baseURL + '/', '') : null;
}

async function saveSubmittedReport(formId, issueNumber, email, screenshotUrl, videoUrl, reporterIp, isClosed = false) {
    const reportId = crypto.randomUUID();
    await db.insert(submittedReports).values({
        id: reportId,
        formId,
        issueNumber,
        email,
        screenshotKey: getS3KeyFromUrl(screenshotUrl),
        videoKey: getS3KeyFromUrl(videoUrl),
        reporterIp,
        isClosed
    });
}

async function deleteFile(url) {
    if (!url) return;
    try {
        const baseURL = getBaseURL();
        if (!url.startsWith(baseURL)) return;

        const key = url.replace(baseURL + '/', '');
        await spacesClient.send(new DeleteObjectCommand({
            Bucket: env.SPACES_BUCKET_NAME,
            Key: key
        }));
    } catch (error) {
        console.error('File deletion error:', error);
    }
}

async function processReport(title, description, expectedResult, observedResult, steps, email, userAgent, customData, screenshotUrl, videoUrl, customPrompt, questionAnswerHistory) {

    // Limit custom data to max. 10,000 characters
    if (customData) customData = customData.slice(0, 5000);

    const messages = [{
        role: 'system',
        content: `You are a bug report processor. Based on the information provided, choose ONE action:

1. ASK_QUESTION - If more information is needed
2. CLOSE_REPORT - If this is spam, user environment issue, not actually a bug or you were told to close this type of report in the guidelines
3. SUBMIT_REPORT - If this is a valid bug that should be submitted to GitHub

${customPrompt ? `Additional guidelines: ${customPrompt}` : ''}

---- CONTENT FORMAT (Markdown):
## Description
(Detailed & concise description here)

## Behavior
**Expected:** ${expectedResult ? '(Expected result)' : 'Not provided.'}
**Observed:** ${observedResult ? '(Observed result)' : 'Not provided.'}

## Steps to reproduce
${steps ? '1. (Step one – and so on)' : 'Not provided.'}

## Media
**Screenshot**: ${screenshotUrl ? '(Screenshot URL as clickable link)' : 'Not provided.'}
**Video**: ${videoUrl ? '(Video URL as clickable link)' : 'Not provided.'}

## Environment details
${userAgent ? `<details>\n<summary>User agent</summary>\n(User agent)\n</details>` : ''}
${customData ? `<details>\n<summary>Custom data</summary>\n(Custom data)\n</details>` : ''}
${(!customData && !userAgent) ? 'No environment information.' : ''}

## Contact
Email: ${email ? '[' + email + '](mailto:' + email + '?subject=Your%20bug%20report)' : 'Not provided.'}
---- END OF CONTENT FORMAT

DO NOT alter, rephrase, or correct URLs, Custom data, User agent data and email addresses.
DO NOT remove content sections even if no data is provided.
DO NOT ask the user to provide any of the 'Not provided' fields unless crucial to the report.
DO NOT capitalize random words in the title of the report; follow English grammar rules. 
DO NOT use markdown or other special formatting when closing a report or asking a question.
DO NOT use filler words; always keep it concise.
DO correct grammar & spelling mistakes, ensure that steps start with a capital letter and end with a period, and enhance the readability of the description, behavior, and steps.

ONLY respond with this JSON format:
{
  "action": "ASK_QUESTION|CLOSE_REPORT|SUBMIT_REPORT",
  "message": "Your response text",
  "title": "Clean title (for SUBMIT_REPORT only)",
  "content": "GitHub issue content in the content format (for SUBMIT_REPORT only)",
  "priority": "P1|P2|P3|P4 (for SUBMIT_REPORT only)"
}`
    }];

    let userContent = `TITLE: ${title}
DESCRIPTION: ${description}
EXPECTED: ${expectedResult || 'Not provided.'}
OBSERVED: ${observedResult || 'Not provided.'}
STEPS: ${steps?.filter(s => s.trim()).join(', ') || 'Not provided.'}
EMAIL: ${email || 'Not provided.'}
USER_AGENT: ${userAgent || 'Not provided.'}
CUSTOM_DATA: ${customData || "Not provided."}`;

    if (screenshotUrl) userContent += `\nSCREENSHOT: User has provided a screenshot – you do not have the capability to view images. Include the URL in reports: ${screenshotUrl}`;
    if (videoUrl) userContent += `\nVIDEO: User has provided a video – you do not have the capability to watch videos. Include the URL in reports: ${videoUrl}`;
    if (questionAnswerHistory) userContent += `\n\nQUESTION/ANSWER HISTORY:\n${questionAnswerHistory}`;
    if (userContent.length > 10000) throw new Error('Input too large!');

    messages.push({ role: 'user', content: userContent });

    try {
        const response = await makeAIRequest(messages);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON malformatted!');

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed || typeof parsed !== 'object' || !parsed.action) throw new Error('Invalid structure!');

        return parsed;
    } catch (error) {
        throw new Error("Error processing report: " + error);
    }
}

async function checkForDuplicates(title, formId) {
    try {
        const issues = await getIssuesTitles(formId);
        if (!issues.length) return null;

        const aiResponse = await makeAIRequest([{
            role: 'user',
            content: `Given this bug report title: "${title}"

And these existing issue titles:
${issues.map(issue => `${issue.id}: ${issue.title}`).join('\n')}

Find up to 3 potential duplicates. Only include issues that are very likely to be the same bug.

Respond with JSON format:
{
  "duplicates": [1, 2, 3]
}`
        }]);

        const duplicateMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!duplicateMatch) throw new Error('JSON malformatted!');

        const parsed = JSON.parse(duplicateMatch[0]);
        if (!parsed.duplicates?.length) return null;

        const duplicateIssues = await Promise.all(
            parsed.duplicates.slice(0, 3).map(async id => {
                const issue = await getIssueContent(formId, id);
                if (issue.body) issue.body = issue.body.replace(/\[.*?@.*?\]\(mailto:.*?\)/g, '(email hidden to preserve privacy)'); // Censor email
                return issue;
            })
        );

        return duplicateIssues;
    } catch (error) {
        console.error('Failed to check for duplicates:', error.message);
        return null;
    }
}

async function checkDuplicateForNewInfo(originalIssue, newTitle, newContent) {
    try {
        const aiResponse = await makeAIRequest([{
            role: 'user',
            content: `Compare this original issue with a new report to see if the new report contains crucial additional information. 
If the new report contains additional media (video and/or screenshot URLs), include these as clickable links in your comment.
If you choose to add a comment, keep it concise and start with 'An additional report...'.

ORIGINAL ISSUE:
Title: ${originalIssue.title}
Content: ${originalIssue.body}

NEW REPORT:
Title: ${newTitle}
Content: ${newContent}

Respond with JSON:
{
  "hasNewInfo": true/false,
  "comment": "Additional information to add as a comment (if hasNewInfo is true)"
}`
        }]);

        const match = aiResponse.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('JSON malformatted!');
        return JSON.parse(match[0]);

    } catch (error) {
        console.error("Failed to check duplicate for new information:", error.message);
        return null;
    }
}

async function incrementReportCount(userId) {
    await db.update(users)
        .set({ reportAmount: sql`${users.reportAmount} + 1` })
        .where(eq(users.id, userId));
}

export async function POST({ request, locals, getClientAddress }) {
    try {
        const captchaToken = request.headers.get('cf-turnstile-response');
        await validateCaptcha(captchaToken, getClientAddress());
        if (await checkReportRateLimit(getClientAddress())) return json({ error: 'Too many report submissions.' }, { status: 429 });

        const { formId, title, description, expectedResult, observedResult, steps, email, userAgent, customData, screenshotUrl, videoUrl, questionAnswerHistory, demo } = locals.body;
        if (!formId || !title || !description) return json({ error: 'Missing required fields id, title and description.' }, { status: 400 });
        if (screenshotUrl && !screenshotUrl.startsWith(getBaseURL())) return json({ error: 'Invalid screenshot URL.' }, { status: 400 });
        if (videoUrl && !videoUrl.startsWith(getBaseURL())) return json({ error: 'Invalid video URL.' }, { status: 400 });

        // Get form with user data
        const formData = await db
            .select({ form: forms, user: users })
            .from(forms)
            .innerJoin(users, eq(forms.userId, users.id))
            .where(eq(forms.id, formId))
            .limit(1);

        if (!formData.length) return json({ error: 'Form not found' }, { status: 404 });

        const { form, user } = formData[0];

        // Check monthly report limit
        const limit = get(tiers)?.[user.subscriptionTier]?.reportLimit;
        if (user.reportAmount >= limit) return json({ error: "This form's account has surpassed the monthly report limit." }, { status: 429 });

        const aiResult = await processReport(title, description, expectedResult, observedResult, steps, email, userAgent, customData, screenshotUrl, videoUrl, form.customPrompt, questionAnswerHistory);

        if (aiResult.action === 'ASK_QUESTION') return json({ action: 'question', message: aiResult.message });

        if (aiResult.action === 'CLOSE_REPORT') {
            if (!demo) await incrementReportCount(user.id);
            await saveSubmittedReport(formId, -1, email, screenshotUrl, videoUrl, getClientAddress(), true);

            // Delete uploaded files
            await Promise.all([deleteFile(screenshotUrl), deleteFile(videoUrl)]);
            return json({ action: 'closed', message: aiResult.message });
        }

        if (aiResult.action === 'SUBMIT_REPORT') {
            const duplicates = await checkForDuplicates(aiResult.title, formId);

            if (duplicates) {
                const reportId = crypto.randomUUID();
                const reportData = { formId, title: aiResult.title, content: aiResult.content, priority: aiResult.priority };
                pendingReports.set(reportId, reportData);
                setTimeout(() => pendingReports.delete(reportId), 30 * 60 * 1000);
                return json({ action: 'duplicates', reportId, duplicates });
            } else {
                if (!demo) await incrementReportCount(user.id);
                const issueResult = await createGitHubIssue(formId, aiResult.title, aiResult.content, ['bug', aiResult.priority]);
                await saveSubmittedReport(formId, issueResult.issueNumber, email, screenshotUrl, videoUrl, getClientAddress());
                return json({ action: 'submitted', message: aiResult.message, issueUrl: issueResult.issueUrl });
            }
        }

        return json({ error: 'Invalid AI response.' }, { status: 500 });

    } catch (error) {
        console.error('Processing error:', error);
        return json({ error: 'Report processing failed: ' + (error.message || "Please refer to the logs.") }, { status: 500 });
    }
}

export async function PUT({ request, locals, getClientAddress }) {
    try {
        const { reportId, duplicateIssueId, demo } = locals.body;
        if (!reportId || !pendingReports.has(reportId)) return json({ error: 'Invalid or expired report.' }, { status: 400 });

        const reportData = pendingReports.get(reportId);
        pendingReports.delete(reportId);

        // Get user for report counting
        const formData = await db
            .select({ form: forms, user: users })
            .from(forms)
            .innerJoin(users, eq(forms.userId, users.id))
            .where(eq(forms.id, reportData.formId))
            .limit(1);

        if (!formData.length) return json({ error: 'Form not found' }, { status: 404 });

        const { form, user } = formData[0];

        if (duplicateIssueId) {
            const originalIssue = await getIssueContent(reportData.formId, duplicateIssueId);
            const newInfoCheck = await checkDuplicateForNewInfo(originalIssue, reportData.title, reportData.content);

            if (!demo) await incrementReportCount(user.id);
            await addReactionToIssue(reportData.formId, duplicateIssueId);
            if (newInfoCheck?.hasNewInfo) await addCommentToIssue(reportData.formId, duplicateIssueId, newInfoCheck.comment);
            await saveSubmittedReport(reportData.formId, duplicateIssueId, reportData.email, reportData.screenshotUrl, reportData.videoUrl, getClientAddress());

            const [owner, repo] = form.githubRepo.split('/');
            return json({ action: 'duplicate_handled', issueUrl: `https://github.com/${owner}/${repo}/issues/${duplicateIssueId}` });
        } else {
            if (!demo) await incrementReportCount(user.id);
            const issueResult = await createGitHubIssue(reportData.formId, reportData.title, reportData.content, ['bug', reportData.priority]);
            await saveSubmittedReport(reportData.formId, issueResult.issueNumber, reportData.email, reportData.screenshotUrl, reportData.videoUrl, getClientAddress());
            return json({ action: 'submitted', issueUrl: issueResult.issueUrl });
        }
    } catch (error) {
        console.error('Duplicate handling error:', error);
        return json({ error: 'Report processing failed for potential duplicate: ' + (error.message || "Please refer to the logs.") }, { status: 500 });
    }
}