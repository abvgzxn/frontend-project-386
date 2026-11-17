# Deployment MCP

The project-level `opencode.jsonc` contains endpoint-only MCP configuration.
It contains no API keys, OAuth tokens, or other credentials.

OpenCode 1.18.34 uses the `mcp` server map written by `opencode mcp add`:

```sh
opencode mcp list
opencode mcp auth render
```

Render uses OAuth by default. Complete the browser flow after `opencode mcp auth
render`; do not disable TLS verification or add a certificate copied from a
failed connection to the trust store. OAuth credentials are stored outside the
repository.

Railway is configured as a disabled fallback. Enable it only when Render is
unavailable and Railway deployment is explicitly selected:

```jsonc
{
  "mcp": {
    "railway": {
      "type": "remote",
      "url": "https://mcp.railway.com/mcp",
    },
  },
}
```

After enabling a provider, restart OpenCode or reconnect the server, then run
`opencode mcp list` and `opencode mcp auth <provider>`. Do not create paid
resources without explicit approval.
