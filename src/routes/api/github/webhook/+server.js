import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { submittedReports, forms, users } from '$lib/server/db/schema.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { spacesClient } from '$lib/server/s3/index.js';
import { sendMail } from '$lib/utils/sendMail.js';
import crypto from "crypto";
import * as env from '$env/static/private';

async function deleteS3File(key) {
    if (!key) return;
    try {
        await spacesClient.send(new DeleteObjectCommand({
            Bucket: env.SPACES_BUCKET_NAME,
            Key: key
        }));
    } catch (error) {
        console.error('S3 deletion error:', error);
    }
}

async function cleanupReport(reportData, repoName, issueNumber, showIssueLink, sendEmail) {
    if (reportData.email && sendEmail) {
        try {
            await sendMail({
                from: env.EMAIL_USER,
                to: reportData.email,
                subject: `Issue #${issueNumber} – ${repoName}`,
                html: `
                    <h3>Your bug report has been closed.</h3>
                    <p><strong>Repository:</strong> ${repoName}</p>
                    <p><strong>Issue:</strong> #${issueNumber}</p>
                    <p>${showIssueLink
                        ? `View the issue page for more details: <a href="https://github.com/${repoName}/issues/${issueNumber}">https://github.com/${repoName}/issues/${issueNumber}</a>`
                        : "The issue page link is not shown for this form."
                    }</p>
                    <p>Thank you for your help!</p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #888;">This automated email was sent out by Bugspot.</p>
                `
            });
        } catch (error) {
            console.error('Email sending error:', error);
        }
    }

    await Promise.all([
        deleteS3File(reportData.screenshotKey),
        deleteS3File(reportData.videoKey),
        db.update(submittedReports).set({ isClosed: true }).where(eq(submittedReports.id, reportData.id))
    ]);
}

async function processReportsForCleanup(repoFullName, issueNumber = null, isDeleted = false) {
    const reports = await db
        .select()
        .from(submittedReports)
        .innerJoin(forms, eq(submittedReports.formId, forms.id))
        .where(and(
            eq(forms.githubRepo, repoFullName),
            eq(submittedReports.isClosed, false),
            ...(issueNumber ? [eq(submittedReports.issueNumber, issueNumber)] : [])
        ));

    if (!reports.length) return;

    // Go through the fetched submitted reports
    for (const report of reports) {
        const reportData = report.submitted_reports;
        const formData = report.forms;
        await cleanupReport(reportData, repoFullName, reportData.issueNumber, formData.showIssueLink, !isDeleted);
    }
}

// Capture when issues are being closed or deleted (or the repo), to notify the reporters + clean up uploaded media
export async function POST({ request, locals }) {
    try {
        // Verify webhook signature
        const signature = request.headers.get('x-hub-signature-256');
        if (env.GITHUB_WEBHOOK_SECRET && signature) {
            const body = JSON.stringify(locals.body);
            const expectedSignature = 'sha256=' + crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET).update(body).digest('hex');
            if (signature !== expectedSignature) return json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = locals.body;
        const event = request.headers.get('x-github-event');

        if (event === 'issues' && (payload.action === 'closed' || payload.action === 'deleted')) {
            await processReportsForCleanup(payload.repository.full_name, payload.issue?.number || -1, payload.action === 'deleted');

        } else if (event === 'repository' && payload.action === 'renamed') {
            const oldName = payload.changes?.repository?.name?.from;
            const newName = payload.repository.name;
            const owner = payload.repository.owner.login;

            if (oldName && newName) {
                const oldFullName = `${owner}/${oldName}`;
                const newFullName = `${owner}/${newName}`;

                const updateResult = await db.update(forms)
                    .set({ githubRepo: newFullName })
                    .where(eq(forms.githubRepo, oldFullName));

                console.log(`User renamed repository from ${oldFullName} to ${newFullName}, updated ${updateResult.rowsAffected || 0} forms.`);
            }

        } else if (event === 'repository' && payload.action === 'deleted') {
            await processReportsForCleanup(payload.repository.full_name, null, true);

        } else if (event === 'installation' && payload.action === 'created') {
            const installationId = payload.installation?.id;
            const installerId = payload.sender?.id; // GitHub user ID who installed the app

            if (installationId && installerId) {
                // Find user by GitHub user ID and set installation ID
                const userData = await db
                    .select()
                    .from(users)
                    .where(eq(users.githubId, installerId.toString()))
                    .limit(1);

                if (userData.length > 0) {
                    await db.update(users)
                        .set({ githubInstallationId: installationId.toString() })
                        .where(eq(users.id, userData[0].id));

                    console.log(`User installed App, set installation ID for user ${userData[0].id}.`);
                }
            }

        } else if (event === 'installation' && payload.action === 'deleted') {
            const userId = payload.sender?.id; // GitHub user ID

            // Find user by GitHub user ID and clear installation
            const userData = await db
                .select()
                .from(users)
                .where(eq(users.githubId, userId.toString()))
                .limit(1);

            if (userData.length > 0) {
                await db.update(users)
                    .set({ githubInstallationId: null })
                    .where(eq(users.id, userData[0].id));

                console.log(`User uninstalled the GitHub app, cleared installation ID for user ${userData[0].id}.`);
            }

            return json({ success: true });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}