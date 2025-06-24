import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Get user's GitHub repositories with installation status
export async function GET({ request, url }) {
    try {
        const githubToken = url.searchParams.get('token');
        const page = parseInt(url.searchParams.get('page')) || 1;
        const perPage = parseInt(url.searchParams.get('per_page')) || 100;

        if (!githubToken) return json({ error: 'GitHub token required', needsAuth: true }, { status: 401 });

        // Get user's repositories and installations in parallel
        const [reposResponse, installationsResponse] = await Promise.all([
            fetch(`https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`, {
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }),
            fetch('https://api.github.com/user/installations', {
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
        ]);

        if (!reposResponse.ok) {
            if (reposResponse.status === 401) return json({ error: 'Invalid or expired GitHub token', needsAuth: true }, { status: 401 });
            throw new Error(`GitHub API error: ${reposResponse.status}`);
        }

        const repos = await reposResponse.json();
        const installations = installationsResponse.ok ? await installationsResponse.json() : { installations: [] };

        // Filter to only our GitHub App installations
        const ourInstallations = installations.installations?.filter(inst => {
            return inst.app_id === parseInt(env.GITHUB_APP_ID);
        }) || [];

        // Get accessible repositories for our app installations only
        let accessibleRepos = new Set();

        for (const installation of ourInstallations) {
            try {
                const repoResponse = await fetch(`https://api.github.com/user/installations/${installation.id}/repositories`, {
                    headers: {
                        'Authorization': `Bearer ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (repoResponse.ok) {
                    const installationRepos = await repoResponse.json();
                    for (const repo of installationRepos.repositories || []) {
                        accessibleRepos.add(repo.full_name);
                    }
                }
            } catch (error) {
                console.error(`Error fetching repos for installation ${installation.id}:`, error);
            }
        }

        const linkHeader = reposResponse.headers.get('Link');
        const hasNextPage = linkHeader ? linkHeader.includes('rel="next"') : false;
        const hasPrevPage = page > 1;

        const formattedRepos = repos
            .map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                language: repo.language,
                updatedAt: repo.updated_at,
                hasIssues: repo.has_issues,
                appInstalled: accessibleRepos.has(repo.full_name) // Display if app is installed
            }))
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        return json({
            repos: formattedRepos,
            pagination: { currentPage: page, hasNextPage, hasPrevPage, perPage }
        });

    } catch (error) {
        console.error('GitHub repos error:', error);
        return json({ error: 'Failed to fetch repositories' }, { status: 500 });
    }
}