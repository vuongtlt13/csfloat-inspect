import http from "http";
import { URL } from "url";
import { decodeHex, decodeLink } from "@csfloat/cs2-inspect-serializer";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

    if (parsedUrl.pathname !== "/inspect" || req.method !== "GET") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found. Use GET /inspect?hex=<hex_payload> or GET /inspect?url=<inspect_link_with_hex>" }));
        return;
    }

    const hexParam = parsedUrl.searchParams.get("hex");
    const urlParam = parsedUrl.searchParams.get("url");

    if (!hexParam && !urlParam) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Missing query parameter. Provide one of:",
            params: {
                hex: "The raw hex payload, e.g. 00180720DA03...",
                url: "The full inspect link, e.g. steam://rungame/730/.../+csgo_econ_action_preview <HEX>"
            }
        }));
        return;
    }

    try {
        const decoded = hexParam ? decodeHex(hexParam) : decodeLink(urlParam);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(decoded, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
    } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to decode", message: err.message }));
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Usage:`);
    console.log(`  GET /inspect?hex=<hex_payload>`);
    console.log(`  GET /inspect?url=<full_inspect_link_with_hex>`);
});
