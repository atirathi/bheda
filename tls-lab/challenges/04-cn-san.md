# Challenge: CN-Only Verification

**Port:** 44304  
**Difficulty:** Medium  
**CVE:** N/A  
**OWASP:** A07:2021 – Identification and Authentication Failures

The server verifies client certificates but only checks the Common Name (CN) field, ignoring SANs and full chain validation.

**Hints:**
1. Generate a client cert with `CN=trusted`.
2. The server skips full CA chain validation.

**Solution:**
```bash
openssl req -x509 -newkey rsa:2048 -keyout client.key -out client.crt -nodes -subj "/CN=trusted"
curl -k --cert client.crt --key client.key https://localhost:44304
```
Flag: `BHEDA{tls_cn_only_verification}`
