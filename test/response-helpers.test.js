import { describe, it, mock } from "node:test";
import assert from "node:assert";
import {
    sendJson,
    sendNotFound,
    sendMissingParams,
    sendDecodeError,
    sendSuccess
} from "../src/response-helpers.js";

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

describe("sendJson", () => {
    it("should send JSON with correct status code and headers", () => {
        const res = createMockResponse();
        const data = { message: "test" };

        sendJson(res, 200, data);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers["Content-Type"], "application/json");
        assert.strictEqual(res.writeHead.mock.calls.length, 1);
        assert.strictEqual(res.end.mock.calls.length, 1);
    });

    it("should stringify data with proper formatting", () => {
        const res = createMockResponse();
        const data = { key: "value", nested: { a: 1 } };

        sendJson(res, 200, data);

        const parsed = JSON.parse(res.body);
        assert.deepStrictEqual(parsed, data);
    });

    it("should handle bigint values", () => {
        const res = createMockResponse();
        const data = { bigValue: BigInt(9007199254740991) };

        sendJson(res, 200, data);

        const parsed = JSON.parse(res.body);
        assert.strictEqual(parsed.bigValue, "9007199254740991");
    });

    it("should handle empty objects", () => {
        const res = createMockResponse();
        sendJson(res, 200, {});

        assert.strictEqual(res.body, "{}");
    });

    it("should handle arrays", () => {
        const res = createMockResponse();
        const data = [1, 2, 3];

        sendJson(res, 200, data);

        const parsed = JSON.parse(res.body);
        assert.deepStrictEqual(parsed, data);
    });
});

describe("sendNotFound", () => {
    it("should send 404 with correct error message", () => {
        const res = createMockResponse();

        sendNotFound(res);

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.headers["Content-Type"], "application/json");

        const parsed = JSON.parse(res.body);
        assert.ok(parsed.error);
        assert.ok(parsed.error.includes("Not found"));
    });
});

describe("sendMissingParams", () => {
    it("should send 400 with parameter info", () => {
        const res = createMockResponse();

        sendMissingParams(res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.headers["Content-Type"], "application/json");

        const parsed = JSON.parse(res.body);
        assert.ok(parsed.error);
        assert.ok(parsed.params);
        assert.ok(parsed.params.hex);
        assert.ok(parsed.params.url);
    });

    it("should include descriptions for both parameters", () => {
        const res = createMockResponse();

        sendMissingParams(res);

        const parsed = JSON.parse(res.body);
        assert.ok(parsed.params.hex.includes("hex"));
        assert.ok(parsed.params.url.includes("steam://"));
    });
});

describe("sendDecodeError", () => {
    it("should send 400 with error message", () => {
        const res = createMockResponse();
        const error = new Error("Invalid hex format");

        sendDecodeError(res, error);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.headers["Content-Type"], "application/json");

        const parsed = JSON.parse(res.body);
        assert.strictEqual(parsed.error, "Failed to decode");
        assert.strictEqual(parsed.message, "Invalid hex format");
    });

    it("should handle error with empty message", () => {
        const res = createMockResponse();
        const error = new Error("");

        sendDecodeError(res, error);

        const parsed = JSON.parse(res.body);
        assert.strictEqual(parsed.message, "");
    });

    it("should handle error objects without message property", () => {
        const res = createMockResponse();
        const error = { toString: () => "Custom error" };

        sendDecodeError(res, error);

        const parsed = JSON.parse(res.body);
        assert.ok(parsed.error);
    });
});

describe("sendSuccess", () => {
    it("should send 200 with decoded data", () => {
        const res = createMockResponse();
        const decoded = {
            defindex: 7,
            paintindex: 474,
            paintwear: 0.633,
            paintseed: 306
        };

        sendSuccess(res, decoded);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers["Content-Type"], "application/json");

        const parsed = JSON.parse(res.body);
        assert.deepStrictEqual(parsed, decoded);
    });

    it("should handle complex nested structures", () => {
        const res = createMockResponse();
        const decoded = {
            defindex: 7,
            stickers: [
                { slot: 0, stickerId: 123 },
                { slot: 1, stickerId: 456 }
            ],
            keychains: []
        };

        sendSuccess(res, decoded);

        const parsed = JSON.parse(res.body);
        assert.deepStrictEqual(parsed, decoded);
        assert.strictEqual(parsed.stickers.length, 2);
    });

    it("should handle bigint values in decoded data", () => {
        const res = createMockResponse();
        const decoded = {
            itemId: BigInt("76561198012345678"),
            defindex: 7
        };

        sendSuccess(res, decoded);

        const parsed = JSON.parse(res.body);
        assert.strictEqual(parsed.itemId, "76561198012345678");
        assert.strictEqual(parsed.defindex, 7);
    });
});
