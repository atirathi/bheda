# Challenge: Fixed Session Ticket Key

**Port:** 44315  
**Difficulty:** Hard  
**CVE:** CVE-2024-0794  
**OWASP:** A02:2021 – Cryptographic Failures

The server uses a static, non-rotated session ticket key. If an attacker obtains the key, they can decrypt all sessions.

**Hints:**
1. Session tickets are encrypted with a fixed key.
2. Obtain the session ticket key from the server.
3. Decrypt captured session tickets offline.

**Solution:**
```bash
# Capture a session ticket
openssl s_client -connect localhost:44315 -sess_out session.pem
# Extract and decrypt the ticket using the fixed key
```
Flag: `BHEDA{tls_session_ticket_fixed}`
