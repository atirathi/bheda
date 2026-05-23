# Security Policy

## Scope

This security policy applies to the Bheda Web Vulnerability Lab & CTF Platform repository and all associated services. Bheda is an intentionally vulnerable web application lab — the vulnerabilities in challenge endpoints are **by design** and are **not** considered security issues.

### In Scope
- The Bheda platform code (backend, frontend, orchestrator)
- The WAF (ModSecurity) configuration
- Authentication and authorization mechanisms
- Infrastructure code (Terraform, K8s manifests)
- CI/CD pipelines
- Docker configurations
- Any vulnerability **outside** of the intentional challenge endpoints

### Out of Scope
- Vulnerabilities in challenge endpoints (sqli, xss, ssrf, etc.) — these are intentional
- TLS lab misconfigurations — these are intentional
- Rabbit hole endpoints — these are intentional
- Zero-day scenarios — these are intentional
- Missing security headers on challenge routes
- Self-XSS or other non-impactful issues
- Rate limiting on challenge endpoints
- Social engineering attacks against the maintainers
- Physical security attacks
- DoS/DDoS attacks

---

## Reporting a Vulnerability

If you discover a security issue **outside** of the intentional challenge scope, please report it privately.

### How to Report

**Email:** 09prabirmaity@gmail.com

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Affected component and version
- Proof of concept (if applicable)
- Impact assessment
- Suggested fix (optional)

### Response Timeline
- **24 hours:** Initial acknowledgment
- **7 days:** Initial triage and severity assessment
- **30 days:** Fix delivered or detailed remediation plan
- **90 days:** Public disclosure (coordinated)

---

## Responsible Disclosure

We follow a **Coordinated Disclosure** model:

1. Reporter submits vulnerability privately
2. Our security team validates and triages
3. We develop and test a fix
4. Fix is deployed to production
5. Reporter and maintainers coordinate public disclosure
6. CVE assignment if applicable

We kindly ask that you:
- Do not publicly disclose the vulnerability before we have a fix ready
- Do not access or modify production data beyond what is necessary to demonstrate the vulnerability
- Do not use automated scanners against production without prior approval

---

## Hall of Fame

We maintain a **Hall of Fame** to recognize researchers who report valid security issues in the Bheda platform itself (not the challenge labs). This is a free, recognition-based program — no monetary rewards are offered.

---

## Security Features

### Platform Security
- **JWT authentication** with short-lived access tokens and refresh tokens
- **Multi-factor authentication** support (TOTP)
- **Rate limiting** on auth endpoints (5 attempts per minute per IP)
- **CORS** restricted to configured origins
- **Content Security Policy** headers on all frontend pages
- **Encrypted secrets** in production (AWS KMS / Kubernetes Secrets)
- **Audit logging** for all administrative actions
- **Session management** with secure, httpOnly cookies
- **CSRF protection** via double-submit cookie pattern

### Infrastructure Security
- **Network isolation:** Services on private subnets with strict security groups
- **Encryption at rest:** RDS, ElastiCache, DocumentDB, S3 all encrypted
- **Encryption in transit:** TLS 1.2+ for all external connections
- **WAF:** AWS WAF + ModSecurity for defense in depth
- **IAM:** Least-privilege service accounts with IRSA for EKS
- **Secrets management:** No secrets in code, all injected via environment/config
- **Backups:** Automated daily backups with 30-day retention
- **Monitoring:** CloudWatch alarms for anomalous activity

---

## Known Security Considerations

### Challenge-Based Vulnerabilities
Bheda is designed as a vulnerability lab. The challenge endpoints (221 real + 7 boss + 51 rabbit holes + 8 zero-days) contain intentional vulnerabilities. These are:

- Isolated within the vuln-app service
- Cannot affect the backend platform database
- Flag values are scoped per challenge
- Per-team instances in CTF mode prevent cross-team interference

### WAF Bypasses
The WAF contains 5 intentional bypasses (challenge waf-1 through waf-5). These are documented and part of the challenge library.

### Rabbit Holes
51 rabbit hole endpoints are designed to waste attacker time. They return fake data and decoy credentials. Accessing high-detection-risk rabbit holes triggers SIEM alerts.

---

## Version Support

| Version | Status | Supported |
|---------|--------|-----------|
| latest | Active development | Security patches |
| 1.x | Current release | Security patches |

---

## Contact

- **Security:** 09prabirmaity@gmail.com
- **Maintainer:** @atirathi on GitHub
