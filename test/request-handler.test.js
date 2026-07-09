import { describe, it, mock } from "node:test";
import assert from "node:assert";
import {
    isValidInspectRequest,
    handleInspectRequest,
    handleRequest
} from "../src/request-handler.js";

/**
 * Creates a mock request object for testing
 */
function createMockRequest(url, method = "GET", host = "localhost:3000") {
    return {
        url,
        method,
        headers: { host }
    };
}

/**
 * Creates a mock response object for testing
 */
function createMockResponse() {
    const res = {
        statusCode: null,
        headers: {},
        body: null,
        writeHead: mock.fn((code, headers) => {
            res.statusCode = code;
            res.headers = headers;
        }),
        end: mock.fn((data) => {
            res.body = data;
        })
    };
    return res;
}

describe("isValidInspectRequest", () => {
    it("should return true for GET /inspect", () => {
        assert.strictEqual(isValidInspectRequest("GET", "/inspect"), true);
    });

    it("should return false for POST /inspect", () => {
        assert.strictEqual(isValidInspectRequest("POST", "/inspect"), false);
    });

    it("should return false for GET /other", () => {
        assert.strictEqual(isValidInspectRequest("GET", "/other"), false);
    });

    it("should return false for PUT /inspect", () => {
        assert.strictEqual(isValidInspectRequest("PUT", "/inspect"), false);
    });

    it("should return false for DELETE /inspect", () => {
        assert.strictEqual(isValidInspectRequest("DELETE", "/inspect"), false);
    });

    it("should return false for GET /", () => {
        assert.strictEqual(isValidInspectRequest("GET", "/"), false);
    });
});

describe("handleInspectRequest", () => {
    describe("with invalid host", () => {
        it("should handle request with undefined host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", undefined);
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
            const parsed = JSON.parse(res.body);
            assert.ok(parsed.defindex !== undefined);
        });

        it("should handle request with null host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", null);
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });

        it("should handle request with empty host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", "");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });

        it("should handle request with 'undefined' string host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", "undefined");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });

        it("should handle request with 'null' string host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", "null");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });
    });

    describe("with valid hex parameter", () => {
        it("should decode valid hex and return 200", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
            const parsed = JSON.parse(res.body);
            assert.ok(parsed.defindex !== undefined);
            assert.ok(parsed.paintindex !== undefined);
        });

        it("should ignore url parameter when hex is provided", () => {
            const req = createMockRequest(
                "/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96&url=steam://invalid",
                "GET"
            );
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });
    });

    describe("with valid url parameter", () => {
        it("should decode valid steam URL and return 200", () => {
            const steamUrl = encodeURIComponent(
                "steam://rungame/730/76561202255233023/+csgo_econ_action_preview 00180720DA03280638FBEE88F90340B2026BC03C96"
            );
            const req = createMockRequest(`/inspect?url=${steamUrl}`, "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
            const parsed = JSON.parse(res.body);
            assert.ok(parsed.defindex !== undefined);
        });
    });

    describe("with missing parameters", () => {
        it("should return 400 when no parameters provided", () => {
            const req = createMockRequest("/inspect", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
            const parsed = JSON.parse(res.body);
            assert.ok(parsed.error);
            assert.ok(parsed.params);
        });

        it("should return 400 when query string is empty", () => {
            const req = createMockRequest("/inspect?", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
        });
    });

    describe("with invalid parameters", () => {
        it("should return 400 for invalid hex", () => {
            const req = createMockRequest("/inspect?hex=INVALID", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
            const parsed = JSON.parse(res.body);
            assert.strictEqual(parsed.error, "Failed to decode");
            assert.ok(parsed.message);
        });

        it("should return 400 for malformed hex", () => {
            const req = createMockRequest("/inspect?hex=zzz", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
        });

        it("should return 400 for invalid steam URL format", () => {
            const req = createMockRequest("/inspect?url=invalid://url", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
        });
    });

    describe("edge cases", () => {
        it("should handle empty hex parameter", () => {
            const req = createMockRequest("/inspect?hex=", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
        });

        it("should handle whitespace in hex", () => {
            const req = createMockRequest("/inspect?hex=%20%20%20", "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
        });

        it("should handle very long hex string", () => {
            const longHex = "A".repeat(1000);
            const req = createMockRequest(`/inspect?hex=${longHex}`, "GET");
            const res = createMockResponse();

            handleInspectRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
        });
    });
});

describe("handleRequest", () => {
    describe("routing", () => {
        it("should route /inspect to handleInspectRequest", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET");
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });

        it("should return 404 for unknown paths", () => {
            const req = createMockRequest("/unknown", "GET");
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 404);
            const parsed = JSON.parse(res.body);
            assert.ok(parsed.error);
        });

        it("should return 404 for root path", () => {
            const req = createMockRequest("/", "GET");
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 404);
        });

        it("should return 404 for /inspect with wrong method", () => {
            const req = createMockRequest("/inspect?hex=123", "POST");
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 404);
        });
    });

    describe("with various host values", () => {
        it("should handle undefined host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", undefined);
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });

        it("should handle null host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", null);
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });

        it("should handle empty string host", () => {
            const req = createMockRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96", "GET", "");
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 200);
        });
    });

    describe("error handling", () => {
        it("should handle completely invalid URL", () => {
            const req = {
                url: null,
                method: "GET",
                headers: { host: "localhost" }
            };
            const res = createMockResponse();

            handleRequest(req, res);

            assert.strictEqual(res.statusCode, 400);
            const parsed = JSON.parse(res.body);
            assert.ok(parsed.error);
            assert.ok(parsed.message.includes("Invalid request URL"));
        });
    });
});
