# Challenge: Insecure Renegotiation

**Port:** 44314  
**Difficulty:** Medium  
**CVE:** CVE-2009-3555  
**OWASP:** A05:2021 – Security Misconfiguration

The server allows insecure TLS renegotiation, enabling a man-in-the-middle to inject plaintext into the session.

**Hints:**
1. Initiate a TLS renegotiation.
2. Insecure renegotiation allows prefix injection attacks.
3. The server does not cryptographically bind the renegotiated handshake.

**Solution:**
```bash
openssl s_client -connect localhost:44314
# In the interactive session, send R to renegotiate
```
Flag: `BHEDA{tls_renegotiation_attack}`
