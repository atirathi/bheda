# Challenge: Self-Signed Certificate

**Port:** 44301  
**Difficulty:** Easy  
**CVE:** N/A  
**OWASP:** A05:2021 – Security Misconfiguration

The server uses a self-signed certificate not trusted by any CA.

**Hints:**
1. Check the certificate chain presented by the server.
2. Use `openssl s_client` to examine the cert.

**Solution:**
```bash
echo | openssl s_client -connect localhost:44301 2>/dev/null | openssl x509 -text
```
The flag is returned directly in the response body.
