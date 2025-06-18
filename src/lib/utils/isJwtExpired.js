export function isTokenExpired(token) {
    let expired;
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join(""),
        );

        const { exp } = JSON.parse(jsonPayload);
        expired = Date.now() >= exp * 1000;
    } catch {
        expired = true;
    }
    return expired;
}