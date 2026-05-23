# Challenge: NULL Cipher Enabled

**Port:** 44309  
**Difficulty:** Medium  
**CVE:** CVE-2004-2220  
**OWASP:** A02:2021 – Cryptographic Failures

The server accepts NULL encryption ciphers, providing no encryption at all.

**Hints:**
1. Force negotiation of a NULL cipher.
2. Traffic is sent in cleartext over the TLS channel.

**Solution:**
```bash
openssl s_client -connect localhost:44309 -cipher NULL
```
Flag: `BHEDA{tls_null_cipher}`
