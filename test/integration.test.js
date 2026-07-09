import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import http from "http";
import { handleRequest } from "../src/request-handler.js";

const TEST_PORT = 3999;
let server;

/**
 * Makes an HTTP request to the test server
 */
function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                hostname: "localhost",
                port: TEST_PORT,
                path,
                method: options.method || "GET",
                ...options
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data,
                        json: () => JSON.parse(data)
                    });
                });
            }
        );

        req.on("error", reject);
        req.end();
    });
}

describe("Integration Tests", () => {
    before(() => {
        return new Promise((resolve) => {
            server = http.createServer(handleRequest);
            server.listen(TEST_PORT, resolve);
        });
    });

    after(() => {
        return new Promise((resolve) => {
            server.close(resolve);
        });
    });

    describe("GET /inspect with hex parameter", () => {
        it("should successfully decode valid hex", async () => {
            const res = await makeRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96");

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.headers["content-type"], "application/json");

            const data = res.json();
            assert.ok(data.defindex !== undefined);
            assert.ok(data.paintindex !== undefined);
            assert.ok(data.paintwear !== undefined);
            assert.ok(data.paintseed !== undefined);
        });

        it("should handle URL-encoded hex", async () => {
            const hex = encodeURIComponent("00180720DA03280638FBEE88F90340B2026BC03C96");
            const res = await makeRequest(`/inspect?hex=${hex}`);

            assert.strictEqual(res.statusCode, 200);
            const data = res.json();
            assert.ok(data.defindex !== undefined);
        });

        it("should return 400 for invalid hex", async () => {
            const res = await makeRequest("/inspect?hex=INVALID");

            assert.strictEqual(res.statusCode, 400);
            const data = res.json();
            assert.strictEqual(data.error, "Failed to decode");
            assert.ok(data.message);
        });

        it("should return 400 for empty hex", async () => {
            const res = await makeRequest("/inspect?hex=");

            assert.strictEqual(res.statusCode, 400);
        });
    });

    describe("GET /inspect with url parameter", () => {
        it("should successfully decode valid steam URL", async () => {
            const steamUrl = encodeURIComponent(
                "steam://rungame/730/76561202255233023/+csgo_econ_action_preview 00180720DA03280638FBEE88F90340B2026BC03C96"
            );
            const res = await makeRequest(`/inspect?url=${steamUrl}`);

            assert.strictEqual(res.statusCode, 200);
            const data = res.json();
            assert.ok(data.defindex !== undefined);
            assert.ok(data.paintindex !== undefined);
        });

        it("should prioritize hex over url when both provided", async () => {
            const steamUrl = encodeURIComponent("steam://invalid");
            const res = await makeRequest(
                `/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96&url=${steamUrl}`
            );

            assert.strictEqual(res.statusCode, 200);
            const data = res.json();
            assert.ok(data.defindex !== undefined);
        });

        it("should return 400 for invalid steam URL", async () => {
            const res = await makeRequest("/inspect?url=invalid");

            assert.strictEqual(res.statusCode, 400);
        });
    });

    describe("GET /inspect without parameters", () => {
        it("should return 400 with parameter info", async () => {
            const res = await makeRequest("/inspect");

            assert.strictEqual(res.statusCode, 400);
            const data = res.json();
            assert.ok(data.error);
            assert.ok(data.params);
            assert.ok(data.params.hex);
            assert.ok(data.params.url);
        });
    });

    describe("Invalid routes", () => {
        it("should return 404 for root path", async () => {
            const res = await makeRequest("/");

            assert.strictEqual(res.statusCode, 404);
            const data = res.json();
            assert.ok(data.error);
        });

        it("should return 404 for unknown paths", async () => {
            const res = await makeRequest("/unknown");

            assert.strictEqual(res.statusCode, 404);
        });

        it("should return 404 for /inspect with POST method", async () => {
            const res = await makeRequest("/inspect?hex=123", { method: "POST" });

            assert.strictEqual(res.statusCode, 404);
        });

        it("should return 404 for /inspect with PUT method", async () => {
            const res = await makeRequest("/inspect?hex=123", { method: "PUT" });

            assert.strictEqual(res.statusCode, 404);
        });
    });

    describe("Response format", () => {
        it("should return properly formatted JSON", async () => {
            const res = await makeRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96");

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.headers["content-type"], "application/json");

            const data = res.json();
            assert.ok(typeof data === "object");
            assert.ok(!Array.isArray(data));
        });

        it("should handle bigint values in response", async () => {
            const res = await makeRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96");

            assert.strictEqual(res.statusCode, 200);

            // Should not throw when parsing
            const data = res.json();
            assert.ok(data);
        });

        it("should include arrays in response", async () => {
            const res = await makeRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96");

            assert.strictEqual(res.statusCode, 200);
            const data = res.json();
            assert.ok(Array.isArray(data.stickers));
            assert.ok(Array.isArray(data.keychains));
        });
    });

    describe("Concurrent requests", () => {
        it("should handle multiple concurrent requests", async () => {
            const requests = Array.from({ length: 10 }, () =>
                makeRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96")
            );

            const results = await Promise.all(requests);

            results.forEach((res) => {
                assert.strictEqual(res.statusCode, 200);
                const data = res.json();
                assert.ok(data.defindex !== undefined);
            });
        });

        it("should handle mix of valid and invalid requests concurrently", async () => {
            const requests = [
                makeRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96"),
                makeRequest("/inspect?hex=INVALID"),
                makeRequest("/inspect"),
                makeRequest("/unknown"),
                makeRequest("/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96")
            ];

            const results = await Promise.all(requests);

            assert.strictEqual(results[0].statusCode, 200);
            assert.strictEqual(results[1].statusCode, 400);
            assert.strictEqual(results[2].statusCode, 400);
            assert.strictEqual(results[3].statusCode, 404);
            assert.strictEqual(results[4].statusCode, 200);
        });
    });

    describe("Edge cases", () => {
        it("should handle very long query strings", async () => {
            const longParam = "A".repeat(1000);
            const res = await makeRequest(`/inspect?hex=${longParam}`);

            assert.strictEqual(res.statusCode, 400);
        });

        it("should handle special characters in query", async () => {
            const res = await makeRequest("/inspect?hex=test%20value");

            assert.strictEqual(res.statusCode, 400);
        });

        it("should handle multiple query parameters", async () => {
            const res = await makeRequest(
                "/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96&extra=value&another=param"
            );

            assert.strictEqual(res.statusCode, 200);
        });
    });
});
