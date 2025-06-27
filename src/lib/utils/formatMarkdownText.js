export function formatMarkdownText(text) {
    if (!text) return '';
    return text
        .replace(/### (.*?)\n/g, '<h3 style="font-size: 1.05em; font-weight: 500; margin: 0.5em 0; opacity: 0.75;">$1</h3>')
        .replace(/## (.*?)\n/g, '<h2 style="font-size: 1.15em; font-weight: 600; margin: 0.5em 0; opacity: 0.75;">$1</h2>')
        .replace(/# (.*?)\n/g, '<h1 style="font-size: 1.25em; font-weight: 600; margin: 0.5em 0; opacity: 0.75;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background-color: #ececec; padding: 2px 4px; border-radius: 3px;">$1</code>')
        .replace(/\n/g, '<br>');
}