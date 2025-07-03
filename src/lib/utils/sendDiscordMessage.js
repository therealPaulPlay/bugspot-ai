export async function sendDiscordMessage(webhookUrl, title, issueUrl, githubRepo) {
    if (!webhookUrl) return;

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "New bug report!",
                    description: `**${title}**\n\n[View on GitHub](${issueUrl})`,
                    color: 0xff6b35, // Orange color
                    fields: [{
                        name: "Repository",
                        value: githubRepo,
                        inline: true
                    }],
                    timestamp: new Date().toISOString()
                }]
            })
        });
    } catch (error) {
        // Don't throw - Discord failure shouldn't break issue creation
        console.error('Discord webhook error:', error);
    }
}