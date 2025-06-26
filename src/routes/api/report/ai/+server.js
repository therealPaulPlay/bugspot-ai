import { json } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { forms, users } from '$lib/server/db/schema.js';
import { createGithubIssue } from '$lib/utils/createGithubIssue.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { spacesClient, getBaseURL } from '$lib/server/s3/index.js';
import { validateCaptcha } from '$lib/utils/validateCaptcha.js';
import { env } from '$env/dynamic/private';

const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
const TIER_LIMITS = { 0: 35, 1: 500, 2: 2500 };

async function makeAIRequest(messages) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash-preview-05-20',
            messages,
            max_tokens: 2000
        })
    });

    if (!response.ok) throw new Error('AI request failed');

    const data = await response.json();
    return data.choices[0].message.content;
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
**Screenshot**: ${screenshotUrl ? '(Screenshot URL)' : 'Not provided.'}
**Video**: ${videoUrl ? '(Video URL)' : 'Not provided.'}

## Environment details
${userAgent ? `<details>\n<summary>User agent</summary>\n(User agent)\n</details>` : ''}
${customData ? `<details>\n<summary>Custom data</summary>\n(Custom data)\n</details>` : ''}
${(!customData && !userAgent) ? 'No environment information.' : ''}

### Contact
Email: ${email ? '(Email here)' : 'Not provided.'}
---- END OF CONTENT FORMAT

DO NOT alter, rephrase, or correct URLs, Custom data, User agent data and Emails.
DO NOT capitalize random words in the title of the report and follow the rules of English grammar. 
DO NOT use markdown or any other special formatting when closing a report or simply asking a question.

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

    // Handle media files with descriptive text instead of URLs
    if (screenshotUrl) userContent += `\nSCREENSHOT: User has provided a screenshot – you do not have the capability to view images. Include the URL in reports: ${screenshotUrl}`;
    if (videoUrl) userContent += `\nVIDEO: User has provided a video – you do not have the capability to watch videos. Include the URL in reports: ${videoUrl}`;

    // Add question/answer history if present
    if (questionAnswerHistory) userContent += `\n\nQUESTION/ANSWER HISTORY:\n${questionAnswerHistory}`;

    if (userContent.length > 10000) throw new Error('Input too large!');

    messages.push({ role: 'user', content: userContent });

    const response = await makeAIRequest(messages);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed || typeof parsed !== 'object' || !parsed.action) throw new Error('Invalid structure');

        return parsed;
    } catch (error) {
        throw new Error("AI processing error: " + error);
    }
}

async function incrementReportCount(userId) {
    await db.update(users)
        .set({ reportAmount: sql`${users.reportAmount} + 1` })
        .where(eq(users.id, userId));
}

export async function POST({ request, locals, getClientAddress }) {
    try {
        // Validate captcha
        const captchaToken = request.headers.get('cf-turnstile-response');
        await validateCaptcha(captchaToken, getClientAddress());

        const {
            formId, title, description, expectedResult, observedResult, steps,
            email, userAgent, customData, screenshotUrl, videoUrl, questionAnswerHistory
        } = locals.body;

        if (!formId || !title || !description) return json({ error: 'Missing required fields id, title and description.' }, { status: 400 });

        // Get form with user data
        const formData = await db
            .select({ form: forms, user: users })
            .from(forms)
            .innerJoin(users, eq(forms.userId, users.id))
            .where(eq(forms.id, formId))
            .limit(1);

        if (!formData.length) return json({ error: 'Form not found' }, { status: 404 });

        const { form, user } = formData[0];

        // Check report limit
        const limit = TIER_LIMITS[user.subscriptionTier];
        if (user.reportAmount >= limit) return json({ error: 'Monthly report limit reached. Please upgrade your plan.' }, { status: 429 });

        // Process with AI
        const aiResult = await processReport(
            title, description, expectedResult, observedResult,
            steps, email, userAgent, customData, screenshotUrl, videoUrl, form.customPrompt,
            questionAnswerHistory
        );

        if (aiResult.action === 'ASK_QUESTION') {
            return json({ action: 'question', message: aiResult.message });
        }

        if (aiResult.action === 'CLOSE_REPORT') {
            await incrementReportCount(user.id);
            // Delete uploaded files
            await Promise.all([deleteFile(screenshotUrl), deleteFile(videoUrl)]);
            return json({ action: 'closed', message: aiResult.message });
        }

        if (aiResult.action === 'SUBMIT_REPORT') {
            await incrementReportCount(user.id);

            // Create GitHub issue
            const labels = ['bug', aiResult.priority];
            const issueResult = await createGithubIssue(formId, aiResult.title, aiResult.content, labels);

            return json({
                action: 'submitted',
                message: aiResult.message,
                issueUrl: issueResult.issueUrl
            });
        }

        return json({ error: 'Invalid AI response.' }, { status: 500 });

    } catch (error) {
        console.error('AI processing error:', error);
        return json({ error: 'AI processing failed.' }, { status: 500 });
    }
}