# Challenge: Expired Certificate

**Port:** 44302  
**Difficulty:** Easy  
**CVE:** N/A  
**OWASP:** A05:2021 – Security Misconfiguration

The server uses an expired TLS certificate. Additionally, the private key is exposed via a backup directory.

**Hints:**
1. Check the certificate validity dates.
2. Explore `/backup/` paths on the server.

**Solution:**
```bash
# Fetch the exposed private key
curl -k https://localhost:44302/backup/server.key
# Decrypt traffic or resign the cert
```
The flag is returned in the response body.
