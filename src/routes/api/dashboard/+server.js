import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { users, forms, formDomains } from '$lib/server/db/schema';
import { authenticateTokenWithId } from '$lib/server/auth/authenticateTokenWithId';

// Get user's forms
export async function GET({ request, url }) {
    try {
        const userId = url.searchParams.get('userId');
        if (!userId) return json({ error: 'User ID is required' }, { status: 400 });

        // Authenticate user
        authenticateTokenWithId(request, userId);

        // Get user with forms
        const userForms = await db.query.users.findFirst({
            where: eq(users.id, userId),
            with: {
                forms: {
                    with: {
                        domains: true
                    }
                }
            }
        });

        if (!userForms) return json({ error: 'User not found' }, { status: 404 });

        // Convert BigInts to strings for JSON serialization
        const serializedUser = {
            ...userForms,
            id: userForms.id.toString(),
            forms: userForms.forms.map(form => ({
                ...form,
                id: form.id,
                userId: form.userId.toString(),
                domains: form.domains.map(domain => ({
                    ...domain,
                    id: domain.id.toString(),
                    formId: domain.formId
                }))
            }))
        };

        return json({
            user: serializedUser,
            forms: serializedUser.forms
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        return json({ error: 'Failed to load dashboard' }, { status: 500 });
    }
}

// Create new form
export async function POST({ request }) {
    try {
        const {
            userId,
            name,
            description,
            githubRepo,
            githubToken,
            customPrompt,
            domains,
            requireEmail,
            requireSteps,
            requireVideo,
            requireScreenshot,
            requireExpectedResult,
            requireObservedResult
        } = await request.json();

        if (!userId) return json({ error: 'User ID is required' }, { status: 400 });
        if (!name?.trim()) return json({ error: 'Form name is required' }, { status: 400 });

        // Authenticate user
        authenticateTokenWithId(request, userId);

        // Generate form ID
        const formId = crypto.randomUUID();

        // Create form
        await db.insert(forms).values({
            id: formId,
            userId: userId.toString(),
            name: name.trim(),
            description: description?.trim() || null,
            githubRepo: githubRepo || null,
            githubToken: githubToken || null,
            customPrompt: customPrompt?.trim() || null,
            requireEmail: requireEmail ?? true,
            requireSteps: requireSteps ?? true,
            requireVideo: requireVideo ?? false,
            requireScreenshot: requireScreenshot ?? false,
            requireExpectedResult: requireExpectedResult ?? true,
            requireObservedResult: requireObservedResult ?? true
        });

        // Add domains if provided
        if (domains && domains.length > 0) {
            const domainRecords = domains
                .filter(domain => domain.trim())
                .map(domain => ({
                    formId,
                    domain: domain.trim()
                }));

            if (domainRecords.length > 0) await db.insert(formDomains).values(domainRecords);
        }

        return json({ formId, success: true });

    } catch (error) {
        console.error('Form creation error:', error);
        return json({ error: 'Failed to create form' }, { status: 500 });
    }
}

// Update existing form
export async function PUT({ request }) {
    try {
        const {
            userId,
            formId,
            name,
            description,
            githubRepo,
            githubToken,
            customPrompt,
            domains,
            requireEmail,
            requireSteps,
            requireVideo,
            requireScreenshot,
            requireExpectedResult,
            requireObservedResult
        } = await request.json();

        if (!userId) return json({ error: 'User ID is required' }, { status: 400 });
        if (!formId || !name?.trim()) return json({ error: 'Form ID and name are required' }, { status: 400 });

        // Authenticate user
        authenticateTokenWithId(request, userId);

        // Verify form belongs to user
        const existingForm = await db.query.forms.findFirst({
            where: eq(forms.id, formId)
        });

        if (!existingForm || existingForm.userId.toString() !== userId.toString()) {
            return json({ error: 'Form not found or access denied' }, { status: 404 });
        }

        // Update form
        await db.update(forms)
            .set({
                name: name.trim(),
                description: description?.trim() || null,
                githubRepo: githubRepo || null,
                githubToken: githubToken || null,
                customPrompt: customPrompt?.trim() || null,
                requireEmail: requireEmail ?? true,
                requireSteps: requireSteps ?? true,
                requireVideo: requireVideo ?? false,
                requireScreenshot: requireScreenshot ?? false,
                requireExpectedResult: requireExpectedResult ?? true,
                requireObservedResult: requireObservedResult ?? true
            })
            .where(eq(forms.id, formId));

        // Update domains - delete old ones and insert new ones
        await db.delete(formDomains).where(eq(formDomains.formId, formId));

        if (domains && domains.length > 0) {
            const domainRecords = domains
                .filter(domain => domain.trim())
                .map(domain => ({
                    formId,
                    domain: domain.trim()
                }));

            if (domainRecords.length > 0) await db.insert(formDomains).values(domainRecords);
        }

        return json({ success: true });

    } catch (error) {
        console.error('Form update error:', error);
        return json({ error: 'Failed to update form' }, { status: 500 });
    }
}

// Delete form
export async function DELETE({ request }) {
    try {
        const { userId, formId } = await request.json();

        if (!userId) return json({ error: 'User ID is required' }, { status: 400 });
        if (!formId) return json({ error: 'Form ID is required' }, { status: 400 });

        // Authenticate user
        authenticateTokenWithId(request, userId);

        // Verify form belongs to user and delete
        const result = await db.delete(forms)
            .where(and(
                eq(forms.id, formId),
                eq(forms.userId, userId.toString())
            ));

        if (result.affectedRows === 0) return json({ error: 'Form not found or access denied' }, { status: 404 });

        return json({ success: true });

    } catch (error) {
        console.error('Form deletion error:', error);
        return json({ error: 'Failed to delete form' }, { status: 500 });
    }
}