import { getInstallationTokenFromFormId } from "./gitHubAppAccess";

export async function getIssuesTitles(formId) {
    const { token, owner, repo } = await getInstallationTokenFromFormId(formId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) throw new Error(`Failed to fetch issues: ${response.status}`);
    const issues = await response.json();

    // Filter out pull requests - PRs have a pull_request property
    return issues
        .filter(issue => !issue.pull_request)
        .map(issue => ({ id: issue.number, title: issue.title }));
}

export async function getIssueContent(formId, issueNumber) {
    const { token, owner, repo } = await getInstallationTokenFromFormId(formId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) throw new Error(`Failed to fetch issue: ${response.status}`);

    const issue = await response.json();
    return { id: issue.number, title: issue.title, body: issue.body };
}