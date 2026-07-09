import http from "http";
import { handleRequest } from "./src/request-handler.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Usage:`);
    console.log(`  GET /inspect?hex=<hex_payload>`);
    console.log(`  GET /inspect?url=<full_inspect_link_with_hex>`);
});
