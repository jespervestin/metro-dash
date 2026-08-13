#!/usr/bin/env bash
# Pull, rebuild and restart the panel. Run on the Pi: ./update.sh
#
# The server itself runs under systemd (see deploy/metro-dash.service), so it
# survives this script exiting, SSH disconnecting, and the Pi rebooting.
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Hämtar senaste koden"
git pull

echo "==> Installerar beroenden"
npm install

echo "==> Bygger"
npm run build

echo "==> Startar om tjänsten"
sudo systemctl restart metro-dash

# Give it a moment to either come up or fail, so the status below is truthful.
sleep 1
echo
systemctl status metro-dash --no-pager --lines=0 || true

echo
echo "Klart. Panelen når du på http://$(hostname -I | awk '{print $1}'):3000"
