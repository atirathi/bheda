# Challenge: Wildcard Certificate Misuse

**Port:** 44303  
**Difficulty:** Easy  
**CVE:** N/A  
**OWASP:** A05:2021 – Security Misconfiguration

The server uses a wildcard certificate for `*.bheda.lab` but also serves on a hostname where a more restrictive cert should be used.

**Hints:**
1. Inspect the certificate's Subject Alternative Names.
2. The wildcard cert covers subdomains but leaks cross-subdomain trust.

**Solution:**
```bash
echo | openssl s_client -connect localhost:44303 2>/dev/null | openssl x509 -text
```
The flag is returned in the response body.
