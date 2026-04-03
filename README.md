# Industrial Wireless I/O

Starlight-based documentation site for `industrialwirelessio.com`.

## Focus

- Remote telemetry and industrial wireless architecture
- Protocol, topology, and hardware reference material
- Reliability-oriented guidance for field deployments

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

Use Cloudflare Pages with:

- Build command: `npm run build`
- Output directory: `dist`

Do not use `wrangler deploy` for this repository.
