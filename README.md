# CS2 Inspect Link API

A lightweight HTTP server that decodes CS2 (Counter-Strike 2) item inspect links and returns item info as JSON.

It uses [`@csfloat/cs2-inspect-serializer`](https://github.com/csfloat/cs2-inspect-serializer) under the hood to decode protobuf-encoded item data from inspect links or raw hex payloads.

---

## Requirements

- Node.js >= 18
- yarn or npm

---

## Installation

```bash
yarn install
# or
npm install
```

---

## Running

```bash
node index.js
```

The server starts on port `3000` by default. Override with the `PORT` environment variable:

```bash
PORT=8080 node index.js
```

---

## API

### `GET /inspect`

Decodes a CS2 item inspect link or hex payload and returns the item info as JSON.

#### Query Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `hex`     | string | Raw hex payload from a CS2 inspect link |
| `url`     | string | Full inspect link in the format `steam://rungame/730/76561202255233023/+csgo_econ_action_preview <HEX>` |

> One of `hex` or `url` is required. If both are provided, `hex` takes precedence.

---

#### Using `hex`

```
GET /inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96
```

**curl:**
```bash
curl "http://localhost:3000/inspect?hex=00180720DA03280638FBEE88F90340B2026BC03C96"
```

---

#### Using `url`

The `url` parameter must be the full Steam inspect link (URL-encoded when passed as a query parameter).

Raw link format:
```
steam://rungame/730/76561202255233023/+csgo_econ_action_preview 00180720DA03280638FBEE88F90340B2026BC03C96
```

**curl:**
```bash
curl --get "http://localhost:3000/inspect" \
  --data-urlencode "url=steam://rungame/730/76561202255233023/+csgo_econ_action_preview 00180720DA03280638FBEE88F90340B2026BC03C96"
```

---

#### Response

```json
{
  "stickers": [],
  "keychains": [],
  "variations": [],
  "defindex": 7,
  "paintindex": 474,
  "rarity": 6,
  "paintwear": 0.6336590647697449,
  "paintseed": 306
}
```

| Field        | Type    | Description |
|--------------|---------|-------------|
| `defindex`   | number  | Item definition index (weapon type) |
| `paintindex` | number  | Skin paint index |
| `paintwear`  | number  | Float value (0.0 – 1.0) |
| `paintseed`  | number  | Pattern seed |
| `rarity`     | number  | Item rarity |
| `quality`    | number  | Item quality (if present) |
| `stickers`   | array   | List of applied stickers |
| `keychains`  | array   | List of keychains |
| `variations` | array   | List of variations |

---

#### Error Responses

**400 – Missing parameter:**
```json
{
  "error": "Missing query parameter. Provide one of:",
  "params": {
    "hex": "The raw hex payload, e.g. 00180720DA03...",
    "url": "The full inspect link, e.g. steam://rungame/730/.../+csgo_econ_action_preview <HEX>"
  }
}
```

**400 – Invalid payload:**
```json
{
  "error": "Failed to decode",
  "message": "..."
}
```

**404 – Wrong path:**
```json
{
  "error": "Not found. Use GET /inspect?hex=<hex_payload> or GET /inspect?url=<inspect_link_with_hex>"
}
```

---

## Integration Examples

### JavaScript / fetch

```js
const hex = "00180720DA03280638FBEE88F90340B2026BC03C96";
const res = await fetch(`http://localhost:3000/inspect?hex=${hex}`);
const item = await res.json();
console.log(item);
```

### Python / requests

```python
import requests

# Using hex
r = requests.get("http://localhost:3000/inspect", params={
    "hex": "00180720DA03280638FBEE88F90340B2026BC03C96"
})
print(r.json())

# Using url
r = requests.get("http://localhost:3000/inspect", params={
    "url": "steam://rungame/730/76561202255233023/+csgo_econ_action_preview 00180720DA03280638FBEE88F90340B2026BC03C96"
})
print(r.json())
```

### PHP / Guzzle

```php
$client = new \GuzzleHttp\Client();
$response = $client->get('http://localhost:3000/inspect', [
    'query' => [
        'hex' => '00180720DA03280638FBEE88F90340B2026BC03C96'
    ]
]);
$item = json_decode($response->getBody(), true);
```

---

## Docker

Build and run with Docker:

```bash
docker build -t cs2-inspect-api .
docker run -p 3000:3000 cs2-inspect-api
```

Override the port:

```bash
docker run -p 8080:8080 -e PORT=8080 cs2-inspect-api
```

---

## Notes

- This API decodes **hex-based** CS2 inspect links (protobuf encoded), not the legacy `S...A...D...` format used in CSGO market links. The `S/A/D` format requires querying the Steam Game Coordinator directly.
- `paintwear` is returned as a float. Multiply by known ranges to get the condition (Factory New, Minimal Wear, etc.).
