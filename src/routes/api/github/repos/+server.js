import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Get user's GitHub repositories
export async function GET({ request, url }) {
    try {
        // Get GitHub token and pagination params from query
        const githubToken = url.searchParams.get('token');
        const page = parseInt(url.searchParams.get('page')) || 1;
        const perPage = parseInt(url.searchParams.get('per_page')) || 100;

        if (!githubToken) return json({ error: 'GitHub token required', needsAuth: true }, { status: 401 });

        // Fetch user's repositories from GitHub with pagination
        const response = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) return json({ error: 'Invalid or expired GitHub token', needsAuth: true }, { status: 401 });
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();

        // Get pagination info from headers
        const linkHeader = response.headers.get('Link');
        const hasNextPage = linkHeader ? linkHeader.includes('rel="next"') : false;
        const hasPrevPage = page > 1;

        // Filter and format repositories
        const formattedRepos = repos
            .filter(repo => !repo.fork) // Exclude forks
            .map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                language: repo.language,
                updatedAt: repo.updated_at,
                hasIssues: repo.has_issues
            }))
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        return json({
            repos: formattedRepos,
            pagination: {
                currentPage: page,
                hasNextPage,
                hasPrevPage,
                perPage
            }
        });

    } catch (error) {
        console.error('GitHub repos error:', error);
        return json({ error: 'Failed to fetch repositories' }, { status: 500 });
    }
}

// Generate GitHub OAuth URL for repository access
export async function POST({ request }) {
    try {
        const { returnUrl } = await request.json();

        // Generate state for CSRF protection
        const state = crypto.randomUUID();

        // GitHub OAuth URL with repo scope
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo&state=${state}&redirect_uri=${encodeURIComponent(returnUrl || 'http://localhost:3000/dashboard')}`;

        return json({
            authUrl: githubUrl,
            state
        });

    } catch (error) {
        console.error('GitHub auth URL error:', error);
        return json({ error: 'Failed to generate auth URL' }, { status: 500 });
    }
}