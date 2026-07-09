import { decodeHex, decodeLink } from "@csfloat/cs2-inspect-serializer";
import { parseRequestUrl, extractQueryParams } from "./url-parser.js";
import {
    sendNotFound,
    sendMissingParams,
    sendDecodeError,
    sendSuccess
} from "./response-helpers.js";

/**
 * Validates the request method and pathname
 * @param {string} method - HTTP method
 * @param {string} pathname - URL pathname
 * @returns {boolean}
 */
export function isValidInspectRequest(method, pathname) {
    return pathname === "/inspect" && method === "GET";
}

/**
 * Handles the /inspect endpoint
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
export function handleInspectRequest(req, res) {
    // Parse URL safely with host validation
    let parsedUrl;
    try {
        parsedUrl = parseRequestUrl(req.url, req.headers.host);
    } catch (err) {
        sendDecodeError(res, new Error(`Invalid request URL: ${err.message}`));
        return;
    }

    // Validate request
    if (!isValidInspectRequest(req.method, parsedUrl.pathname)) {
        sendNotFound(res);
        return;
    }

    // Extract parameters
    const { hex: hexParam, url: urlParam } = extractQueryParams(parsedUrl, ['hex', 'url']);

    // Validate at least one parameter is provided
    if (!hexParam && !urlParam) {
        sendMissingParams(res);
        return;
    }

    // Decode and respond
    try {
        const decoded = hexParam ? decodeHex(hexParam) : decodeLink(urlParam);
        sendSuccess(res, decoded);
    } catch (err) {
        sendDecodeError(res, err);
    }
}

/**
 * Main request handler for all routes
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
export function handleRequest(req, res) {
    let parsedUrl;

    try {
        parsedUrl = parseRequestUrl(req.url, req.headers.host);
    } catch (err) {
        sendDecodeError(res, new Error(`Invalid request URL: ${err.message}`));
        return;
    }

    // Route to appropriate handler
    if (parsedUrl.pathname === "/inspect") {
        handleInspectRequest(req, res);
    } else {
        sendNotFound(res);
    }
}
