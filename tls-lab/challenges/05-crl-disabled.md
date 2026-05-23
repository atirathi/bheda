# Challenge: CRL Disabled

**Port:** 44305  
**Difficulty:** Medium  
**CVE:** N/A  
**OWASP:** A05:2021 – Security Misconfiguration

The server accepts revoked certificates because Certificate Revocation List checking is disabled and OCSP stapling is off.

**Hints:**
1. The server presents a revoked certificate.
2. No CRL or OCSP verification is performed.
3. Connect without verifying the cert chain.

**Solution:**
```bash
curl -k https://localhost:44305
```
The flag is returned in the response body.
