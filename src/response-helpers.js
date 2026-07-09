/**
 * Sends a JSON response
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {object} data - Data to send as JSON
 */
export function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
}

/**
 * Sends a 404 Not Found response
 * @param {import('http').ServerResponse} res - HTTP response object
 */
export function sendNotFound(res) {
    sendJson(res, 404, {
        error: "Not found. Use GET /inspect?hex=<hex_payload> or GET /inspect?url=<inspect_link_with_hex>"
    });
}

/**
 * Sends a 400 Bad Request for missing parameters
 * @param {import('http').ServerResponse} res - HTTP response object
 */
export function sendMissingParams(res) {
    sendJson(res, 400, {
        error: "Missing query parameter. Provide one of:",
        params: {
            hex: "The raw hex payload, e.g. 00180720DA03...",
            url: "The full inspect link, e.g. steam://rungame/730/.../+csgo_econ_action_preview <HEX>"
        }
    });
}

/**
 * Sends a 400 Bad Request for decode failures
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {Error} error - The error that occurred
 */
export function sendDecodeError(res, error) {
    sendJson(res, 400, {
        error: "Failed to decode",
        message: error.message
    });
}

/**
 * Sends a successful decode response
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {object} decoded - The decoded item data
 */
export function sendSuccess(res, decoded) {
    sendJson(res, 200, decoded);
}
