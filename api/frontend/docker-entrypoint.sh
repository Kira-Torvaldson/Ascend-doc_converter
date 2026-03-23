#!/bin/sh
set -e
SSL_DIR="/etc/nginx/ssl"
CERT="$SSL_DIR/cert.pem"
KEY="$SSL_DIR/key.pem"

# Générer un certificat auto-signé si absent (pour https://IP)
if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  echo "[entrypoint] Generating self-signed certificate in $SSL_DIR"
  mkdir -p "$SSL_DIR"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY" -out "$CERT" \
    -subj "/CN=localhost/O=Ascend"
fi

exec nginx -g "daemon off;"
