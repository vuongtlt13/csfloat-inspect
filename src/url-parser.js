import { URL } from "url";

/**
 * Validates if a host header value is valid
 * @param {string|undefined|null} host - The host header value
 * @returns {boolean}
 */
export function isValidHost(host) {
    if (!host) return false;
    if (typeof host !== 'string') return false;

    const trimmed = host.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
        return false;
    }

    return true;
}

/**
 * Safely parses a request URL with host validation
 * @param {string} reqUrl - The request URL (can be relative or absolute)
 * @param {string|undefined|null} host - The host header from the request
 * @param {string} [defaultHost='localhost'] - Fallback host if validation fails
 * @returns {URL} Parsed URL object
 * @throws {Error} If URL is invalid and no fallback is possible
 */
export function parseRequestUrl(reqUrl, host, defaultHost = 'localhost') {
    if (!reqUrl) {
        throw new Error('Request URL is required');
    }

    // If reqUrl is already absolute, parse it directly (host is ignored)
    if (reqUrl.startsWith('http://') || reqUrl.startsWith('https://')) {
        return new URL(reqUrl);
    }

    // For relative URLs, we need a valid host
    const effectiveHost = isValidHost(host) ? host : defaultHost;

    try {
        return new URL(reqUrl, `http://${effectiveHost}`);
    } catch (err) {
        throw new Error(`Failed to parse URL: ${err.message}`);
    }
}

/**
 * Extracts query parameters from a parsed URL
 * @param {URL} parsedUrl - The parsed URL object
 * @param {string[]} paramNames - Array of parameter names to extract
 * @returns {Object.<string, string|null>} Object with parameter values
 */
export function extractQueryParams(parsedUrl, paramNames) {
    const result = {};

    for (const name of paramNames) {
        result[name] = parsedUrl.searchParams.get(name);
    }

    return result;
}
