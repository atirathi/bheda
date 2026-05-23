#!/bin/bash
set -e

CERTS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DAYS_VALID=3650
BITS=2048

mkdir -p "$CERTS_DIR"/{self-signed,expired,wildcard,ca,revoked,rsa512,session}

# CA certificate
openssl genrsa -out "$CERTS_DIR/ca/ca.key" 4096
openssl req -x509 -new -key "$CERTS_DIR/ca/ca.key" -days $DAYS_VALID -sha256 \
  -subj "/CN=Bheda Lab CA/O=Bheda Labs/C=US" \
  -out "$CERTS_DIR/ca/ca.crt"

# Self-signed
openssl req -x509 -newkey rsa:$BITS -keyout "$CERTS_DIR/self-signed/server.key" \
  -out "$CERTS_DIR/self-signed/server.crt" -days $DAYS_VALID -nodes \
  -subj "/CN=Self-Signed/O=Bheda Labs/C=US"

# Expired (1 day validity, backdated)
openssl req -x509 -newkey rsa:$BITS -keyout "$CERTS_DIR/expired/server.key" \
  -out "$CERTS_DIR/expired/server.crt" -days -1 -nodes \
  -subj "/CN=Expired Cert/O=Bheda Labs/C=US"

# Wildcard for *.bheda.lab
openssl req -x509 -newkey rsa:$BITS -keyout "$CERTS_DIR/wildcard/server.key" \
  -out "$CERTS_DIR/wildcard/server.crt" -days $DAYS_VALID -nodes \
  -subj "/CN=*.bheda.lab/O=Bheda Labs/C=US"

# 512-bit RSA (weak)
openssl genrsa -out "$CERTS_DIR/rsa512/server.key" 512
openssl req -x509 -new -key "$CERTS_DIR/rsa512/server.key" \
  -out "$CERTS_DIR/rsa512/server.crt" -days $DAYS_VALID \
  -subj "/CN=RSA512 Weak/O=Bheda Labs/C=US"

# Revoked cert (signed by CA, then added to CRL)
openssl genrsa -out "$CERTS_DIR/revoked/server.key" 2048
openssl req -new -key "$CERTS_DIR/revoked/server.key" \
  -out "$CERTS_DIR/revoked/server.csr" \
  -subj "/CN=Revoked Cert/O=Bheda Labs/C=US"
openssl x509 -req -in "$CERTS_DIR/revoked/server.csr" \
  -CA "$CERTS_DIR/ca/ca.crt" -CAkey "$CERTS_DIR/ca/ca.key" \
  -CAcreateserial -out "$CERTS_DIR/revoked/server.crt" -days $DAYS_VALID

# Generate CRL and revoke the cert
openssl ca -gencrl -keyfile "$CERTS_DIR/ca/ca.key" -cert "$CERTS_DIR/ca/ca.crt" \
  -out "$CERTS_DIR/ca/ca.crl" -config <(printf "[ca]\ndefault_ca=CA_default\n[CA_default]\ndatabase=%s/ca/index.txt\nserial=%s/ca/serial\nnew_certs_dir=%s/ca\n" "$CERTS_DIR" "$CERTS_DIR" "$CERTS_DIR") 2>/dev/null || true

# Session ticket key (fixed, non-rotated)
openssl rand 48 > "$CERTS_DIR/session/ticket.key"

# Client cert for CN verification (04)
openssl req -x509 -newkey rsa:$BITS -keyout "$CERTS_DIR/ca/client.key" \
  -out "$CERTS_DIR/ca/client.crt" -days $DAYS_VALID -nodes \
  -subj "/CN=trusted/O=Bheda Labs/C=US"

echo "All certificates generated in $CERTS_DIR"
