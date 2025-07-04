import * as env from "$env/static/public";

export function renderCaptcha(elementId, callback) {
    try {
        window.turnstile.render(elementId, {
            sitekey: env.PUBLIC_CAPTCHA_SITE_KEY,
            callback: callback, // Ensure this callback function is defined globally (window.functionName)
        });
    } catch (error) {
        console.error("Error occured trying to render captcha with Turnstile:", error);
    }
}