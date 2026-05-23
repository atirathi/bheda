# Challenge: TLS Compression Enabled (CRIME)

**Port:** 44312  
**Difficulty:** Hard  
**CVE:** CVE-2012-4929  
**OWASP:** A05:2021 – Security Misconfiguration

TLS-level compression is enabled, making the server vulnerable to the CRIME attack.

**Hints:**
1. TLS compression leaks secrets through compression ratio.
2. CRIME attackers inject controlled plaintext and measure compressed length.
3. Use a tool like `crime-poc` to extract the flag byte by byte.

**Solution:**
```bash
# Send requests with varying prefixes and measure response sizes
# Flag byte extracted by finding shortest compressed length
python3 crime_poc.py https://localhost:44312
```
Flag: `BHEDA{tls_compression_crime}`
