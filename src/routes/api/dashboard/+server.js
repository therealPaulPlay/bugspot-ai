import { json } from '@sveltejs/kit';
import { eq, and, count } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users, forms, formDomains } from '$lib/server/db/schema';
import { authenticateTokenWithId } from '$lib/server/auth/authenticateTokenWithId';

// Get user's forms
export async function GET({ request, url }) {
    const userId = url.searchParams.get('userId');
    if (!userId) return json({ error: 'User ID is required' }, { status: 400 });

    authenticateTokenWithId(request, userId);

    try {
        const userForms = await db.query.forms.findMany({
            where: eq(forms.userId, userId),
            with: { domains: true }
        });

        const serializedForms = userForms.map(form => ({
            ...form,
            id: form.id,
            userId: form.userId.toString(),
            domains: form.domains.map(domain => ({
                ...domain,
                id: domain.id.toString(),
                formId: domain.formId
            }))
        }));

        return json({ forms: serializedForms });
    } catch (error) {
        console.error('Dashboard error:', error);
        return json({ error: 'Failed to load forms: ' + error }, { status: 500 });
    }
}

// Create new form
export async function POST({ request, locals }) {
    const { userId } = locals.body || {};
    if (!locals.body?.name?.trim()) return json({ error: 'Form name is required' }, { status: 400 });

    authenticateTokenWithId(request, userId);

    try {
        // Check form limit
        const formCount = await db.select({ count: count() }).from(forms).where(eq(forms.userId, userId.toString()));
        if (formCount[0].count >= 50) return json({ error: 'Maximum form limit reached (50 forms)' }, { status: 400 });
        if (locals.body.customPrompt?.length > 3000) throw new Error("Custom prompt is too long!");
        if (locals.body.domains?.length > 20) throw new Error("Please use less than 20 domains per form!");

        const formId = crypto.randomUUID();

        await db.insert(forms).values({
            id: formId,
            userId: userId.toString(),
            name: locals.body.name.trim(),
            githubRepo: locals.body.githubRepo || null,
            discordWebhook: locals.body.discordWebhook?.trim() || null,
            showIssueLink: locals.body.showIssueLink ?? true,
            customPrompt: locals.body.customPrompt?.trim() || null,
            colorScheme: locals.body.colorScheme || null,
            requireEmail: locals.body.requireEmail ?? false,
            requireSteps: locals.body.requireSteps ?? false,
            requireVideo: locals.body.requireVideo ?? false,
            requireScreenshot: locals.body.requireScreenshot ?? false,
            requireExpectedResult: locals.body.requireExpectedResult ?? false,
            requireObservedResult: locals.body.requireObservedResult ?? true
        });

        if (locals.body.domains?.length > 0) {
            const domainRecords = locals.body.domains
                .filter(domain => domain.trim())
                .map(domain => ({ formId, domain: domain.trim() }));

            if (domainRecords.length > 0) await db.insert(formDomains).values(domainRecords);
        }

        return json({ formId, success: true });
    } catch (error) {
        console.error('Form creation error:', error);
        return json({ error: 'Failed to create form: ' + error }, { status: 500 });
    }
}

// Update existing form
export async function PUT({ request, locals }) {
    const { userId, formId } = locals.body || {};
    if (!userId) return json({ error: 'User ID is required' }, { status: 400 });
    if (!formId || !locals.body?.name?.trim()) return json({ error: 'Form ID and name are required' }, { status: 400 });

    authenticateTokenWithId(request, userId);

    try {
        const existingForm = await db.query.forms.findFirst({ where: eq(forms.id, formId) });
        if (!existingForm || existingForm.userId.toString() !== userId.toString()) {
            return json({ error: 'Form not found or not owned by this user' }, { status: 404 });
        }

        await db.update(forms)
            .set({
                name: locals.body.name.trim(),
                githubRepo: locals.body.githubRepo || null,
                discordWebhook: locals.body.discordWebhook?.trim() || null,
                showIssueLink: locals.body.showIssueLink ?? true,
                customPrompt: locals.body.customPrompt?.trim() || null,
                colorScheme: locals.body.colorScheme || null,
                requireEmail: locals.body.requireEmail ?? false,
                requireSteps: locals.body.requireSteps ?? false,
                requireVideo: locals.body.requireVideo ?? false,
                requireScreenshot: locals.body.requireScreenshot ?? false,
                requireExpectedResult: locals.body.requireExpectedResult ?? false,
                requireObservedResult: locals.body.requireObservedResult ?? false
            })
            .where(eq(forms.id, formId));

        await db.delete(formDomains).where(eq(formDomains.formId, formId));

        if (locals.body.domains?.length > 0) {
            const domainRecords = locals.body.domains
                .filter(domain => domain.trim())
                .map(domain => ({ formId, domain: domain.trim() }));

            if (domainRecords.length > 0) await db.insert(formDomains).values(domainRecords);
        }

        return json({ success: true });
    } catch (error) {
        console.error('Form update error:', error);
        return json({ error: 'Failed to update form' }, { status: 500 });
    }
}

// Delete form
export async function DELETE({ request, locals }) {
    const { userId, formId } = locals.body || {};
    if (!userId) return json({ error: 'User ID is required' }, { status: 400 });
    if (!formId) return json({ error: 'Form ID is required' }, { status: 400 });

    authenticateTokenWithId(request, userId);

    try {
        const result = await db.delete(forms)
            .where(and(eq(forms.id, formId), eq(forms.userId, userId.toString())));

        if (result.affectedRows === 0) return json({ error: 'Form not found or access denied' }, { status: 404 });

        return json({ success: true });
    } catch (error) {
        console.error('Form deletion error:', error);
        return json({ error: 'Failed to delete form' }, { status: 500 });
    }
}