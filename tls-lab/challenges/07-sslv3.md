# Challenge: SSLv3 Enabled (POODLE)

**Port:** 44307  
**Difficulty:** Medium  
**CVE:** CVE-2014-3566  
**OWASP:** A02:2021 – Cryptographic Failures

The server supports SSLv3, which is vulnerable to the POODLE attack.

**Hints:**
1. Force the client to use SSLv3.
2. POODLE exploits CBC padding in SSLv3.

**Solution:**
```bash
openssl s_client -connect localhost:44307 -ssl3
```
Flag: `BHEDA{tls_sslv3_poodle}`
