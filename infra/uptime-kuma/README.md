# Uptime Kuma

[Uptime Kuma](https://github.com/louislam/uptime-kuma) is a self-hosted, open-source uptime monitoring tool. It monitors the status of your services and sends notifications when they go down.

## Deployment

### Prerequisites

- A server (VPS, dedicated, or cloud instance) with Docker and Docker Compose installed
- Domain `status.chessperiment.app` pointing to the server's IP (A/AAAA record)
- Ports 80 (HTTP) and 443 (HTTPS) open on the firewall

### Quick Start

```bash
# Navigate to this directory
cd infra/uptime-kuma

# Start Uptime Kuma and Caddy reverse proxy
docker compose up -d

# Check logs
docker compose logs -f
```

### DNS Setup

Create a DNS A/AAAA record:

| Type  | Name     | Value        |
|-------|----------|--------------|
| A     | status   | <server-ip>  |
| AAAA  | status   | <server-ipv6> |

Caddy will automatically provision a Let's Encrypt TLS certificate for `status.chessperiment.app`.

### First Login

1. Open `https://status.chessperiment.app` in your browser
2. Create an admin account
3. Start adding monitors for your services

### Custom Domain

Replace `status.chessperiment.app` in `caddy/Caddyfile` with your actual domain, then restart:

```bash
docker compose restart caddy
```

### Notifications

Uptime Kuma supports many notification channels:
- Email (SMTP)
- Discord, Slack, Telegram
- Pushover, Gotify
- Webhooks
- and many more

Configure notifications in the Uptime Kuma web UI under Settings > Notifications.

### Updating

```bash
docker compose pull
docker compose up -d
```

### Backup

The monitoring data is stored in the `uptime-kuma-data` Docker volume:

```bash
docker run --rm -v uptime-kuma-data:/data -v $(pwd):/backup alpine tar czf /backup/uptime-kuma-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Troubleshooting

```bash
# View logs
docker compose logs -f uptime-kuma
docker compose logs -f caddy

# Check Caddy config
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile

# Restart services
docker compose restart
```
