export async function betterFetch(url, options) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch { }
            throw new Error(errorData?.message || errorData?.error || `Request failed with status: ${response.status}`);
        }

        return response;
    } catch (error) {
        if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) throw new Error("Network error. Please check your connection & the server status.");
        throw error;
    }
}