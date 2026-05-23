# Challenge: Export-Grade Diffie-Hellman

**Port:** 44311  
**Difficulty:** Hard  
**CVE:** CVE-2015-4000  
**OWASP:** A02:2021 – Cryptographic Failures

The server allows export-grade Diffie-Hellman key exchange (512-bit), which can be broken by pre-computing the discrete log.

**Hints:**
1. Force export-strength DHE ciphers.
2. The Logjam attack allows downgrading to 512-bit DH.
3. Pre-compute discrete logs for the standardized DH group.

**Solution:**
```bash
openssl s_client -connect localhost:44311 -cipher EXPORT
```
Flag: `BHEDA{tls_export_cipher}`
