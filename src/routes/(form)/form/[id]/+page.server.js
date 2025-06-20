// src/routes/form/[id]/+page.server.js
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { forms } from '$lib/server/db/schema';

export async function load({ params }) {
    const formId = params.id;

    try {
        const form = await db.query.forms.findFirst({
            where: eq(forms.id, formId),
            with: { domains: true }
        });

        if (!form) throw error(404, 'Form not found');

        // Remove sensitive/private fields
        const { createdAt, userId, githubRepo, githubToken, customPrompt, ...publicForm } = form;

        // Clean up domains
        const cleanedForm = {
            ...publicForm,
            domains: form.domains.map(domain => ({
                id: domain.id.toString(),
                domain: domain.domain
            }))
        };

        return { form: cleanedForm };

    } catch (err) {
        if (err.status) throw err;
        console.error('Form load error:', err);
        throw error(500, 'Failed to load form');
    }
}