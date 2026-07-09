import { describe, it } from "node:test";
import assert from "node:assert";
import { isValidHost, parseRequestUrl, extractQueryParams } from "../src/url-parser.js";

describe("isValidHost", () => {
    it("should return false for undefined", () => {
        assert.strictEqual(isValidHost(undefined), false);
    });

    it("should return false for null", () => {
        assert.strictEqual(isValidHost(null), false);
    });

    it("should return false for empty string", () => {
        assert.strictEqual(isValidHost(""), false);
    });

    it("should return false for whitespace only", () => {
        assert.strictEqual(isValidHost("   "), false);
    });

    it("should return false for string 'undefined'", () => {
        assert.strictEqual(isValidHost("undefined"), false);
    });

    it("should return false for string 'null'", () => {
        assert.strictEqual(isValidHost("null"), false);
    });

    it("should return false for non-string types", () => {
        assert.strictEqual(isValidHost(123), false);
        assert.strictEqual(isValidHost({}), false);
        assert.strictEqual(isValidHost([]), false);
    });

    it("should return true for valid hostname", () => {
        assert.strictEqual(isValidHost("localhost"), true);
    });

    it("should return true for valid hostname with port", () => {
        assert.strictEqual(isValidHost("localhost:3000"), true);
    });

    it("should return true for valid domain", () => {
        assert.strictEqual(isValidHost("example.com"), true);
    });

    it("should return true for valid IP address", () => {
        assert.strictEqual(isValidHost("127.0.0.1"), true);
    });

    it("should return true for valid IP with port", () => {
        assert.strictEqual(isValidHost("127.0.0.1:8080"), true);
    });
});

describe("parseRequestUrl", () => {
    describe("with invalid host", () => {
        it("should use default host when host is undefined", () => {
            const url = parseRequestUrl("/inspect?hex=123", undefined);
            assert.strictEqual(url.hostname, "localhost");
            assert.strictEqual(url.pathname, "/inspect");
        });

        it("should use default host when host is null", () => {
            const url = parseRequestUrl("/inspect?hex=123", null);
            assert.strictEqual(url.hostname, "localhost");
            assert.strictEqual(url.pathname, "/inspect");
        });

        it("should use default host when host is empty string", () => {
            const url = parseRequestUrl("/inspect?hex=123", "");
            assert.strictEqual(url.hostname, "localhost");
            assert.strictEqual(url.pathname, "/inspect");
        });

        it("should use default host when host is 'undefined' string", () => {
            const url = parseRequestUrl("/inspect?hex=123", "undefined");
            assert.strictEqual(url.hostname, "localhost");
            assert.strictEqual(url.pathname, "/inspect");
        });

        it("should use default host when host is 'null' string", () => {
            const url = parseRequestUrl("/inspect?hex=123", "null");
            assert.strictEqual(url.hostname, "localhost");
            assert.strictEqual(url.pathname, "/inspect");
        });

        it("should use custom default host when provided", () => {
            const url = parseRequestUrl("/inspect?hex=123", undefined, "example.com");
            assert.strictEqual(url.hostname, "example.com");
        });
    });

    describe("with valid host", () => {
        it("should use provided host", () => {
            const url = parseRequestUrl("/inspect?hex=123", "example.com");
            assert.strictEqual(url.hostname, "example.com");
            assert.strictEqual(url.pathname, "/inspect");
        });

        it("should preserve host with port", () => {
            const url = parseRequestUrl("/inspect?hex=123", "localhost:8080");
            assert.strictEqual(url.hostname, "localhost");
            assert.strictEqual(url.port, "8080");
        });

        it("should parse query parameters correctly", () => {
            const url = parseRequestUrl("/inspect?hex=ABC123&other=value", "localhost");
            assert.strictEqual(url.searchParams.get("hex"), "ABC123");
            assert.strictEqual(url.searchParams.get("other"), "value");
        });
    });

    describe("with absolute URLs", () => {
        it("should ignore host parameter for http:// URLs", () => {
            const url = parseRequestUrl("http://external.com/path", undefined);
            assert.strictEqual(url.hostname, "external.com");
            assert.strictEqual(url.pathname, "/path");
        });

        it("should ignore host parameter for https:// URLs", () => {
            const url = parseRequestUrl("https://external.com/path", "localhost");
            assert.strictEqual(url.hostname, "external.com");
            assert.strictEqual(url.pathname, "/path");
        });

        it("should parse query params from absolute URL", () => {
            const url = parseRequestUrl("http://external.com/path?key=value", undefined);
            assert.strictEqual(url.searchParams.get("key"), "value");
        });
    });

    describe("error cases", () => {
        it("should throw error when reqUrl is missing", () => {
            assert.throws(
                () => parseRequestUrl(null, "localhost"),
                /Request URL is required/
            );
        });

        it("should throw error when reqUrl is undefined", () => {
            assert.throws(
                () => parseRequestUrl(undefined, "localhost"),
                /Request URL is required/
            );
        });

        it("should throw error when reqUrl is empty string", () => {
            assert.throws(
                () => parseRequestUrl("", "localhost"),
                /Request URL is required/
            );
        });
    });

    describe("edge cases", () => {
        it("should handle URL with no query params", () => {
            const url = parseRequestUrl("/inspect", "localhost");
            assert.strictEqual(url.pathname, "/inspect");
            assert.strictEqual(url.search, "");
        });

        it("should handle URL with multiple query params", () => {
            const url = parseRequestUrl("/inspect?a=1&b=2&c=3", "localhost");
            assert.strictEqual(url.searchParams.get("a"), "1");
            assert.strictEqual(url.searchParams.get("b"), "2");
            assert.strictEqual(url.searchParams.get("c"), "3");
        });

        it("should handle URL with special characters in query", () => {
            const encoded = encodeURIComponent("steam://rungame/730/76561202255233023/+csgo_econ_action_preview ABC");
            const url = parseRequestUrl(`/inspect?url=${encoded}`, "localhost");
            const decoded = decodeURIComponent(url.searchParams.get("url"));
            assert.ok(decoded.includes("steam://rungame"));
        });

        it("should handle root path", () => {
            const url = parseRequestUrl("/", "localhost");
            assert.strictEqual(url.pathname, "/");
        });

        it("should handle path with fragments", () => {
            const url = parseRequestUrl("/inspect#section", "localhost");
            assert.strictEqual(url.pathname, "/inspect");
            assert.strictEqual(url.hash, "#section");
        });
    });
});

describe("extractQueryParams", () => {
    it("should extract single parameter", () => {
        const url = new URL("http://localhost/test?hex=ABC123");
        const params = extractQueryParams(url, ["hex"]);
        assert.deepStrictEqual(params, { hex: "ABC123" });
    });

    it("should extract multiple parameters", () => {
        const url = new URL("http://localhost/test?hex=ABC&url=steam://test");
        const params = extractQueryParams(url, ["hex", "url"]);
        assert.strictEqual(params.hex, "ABC");
        assert.strictEqual(params.url, "steam://test");
    });

    it("should return null for missing parameters", () => {
        const url = new URL("http://localhost/test?hex=ABC");
        const params = extractQueryParams(url, ["hex", "url"]);
        assert.strictEqual(params.hex, "ABC");
        assert.strictEqual(params.url, null);
    });

    it("should handle empty parameter list", () => {
        const url = new URL("http://localhost/test?hex=ABC");
        const params = extractQueryParams(url, []);
        assert.deepStrictEqual(params, {});
    });

    it("should handle parameters with empty values", () => {
        const url = new URL("http://localhost/test?hex=");
        const params = extractQueryParams(url, ["hex"]);
        assert.strictEqual(params.hex, "");
    });

    it("should handle URL-encoded parameter values", () => {
        const encoded = encodeURIComponent("hello world");
        const url = new URL(`http://localhost/test?msg=${encoded}`);
        const params = extractQueryParams(url, ["msg"]);
        assert.strictEqual(params.msg, "hello world");
    });
});
