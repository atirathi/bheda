# Challenge Catalog

> **272 Total Engagement Objects**  
> 221 Real Challenges · 7 Boss Chains · 51 Rabbit Holes · 8 Zero-Days

---

## Table of Contents

- [SQL Injection](#sql-injection) (16 challenges)
- [Cross-Site Scripting (XSS)](#cross-site-scripting-xss) (15)
- [Broken Access Control](#broken-access-control) (20)
- [Server-Side Request Forgery (SSRF)](#server-side-request-forgery-ssrf) (10)
- [Server-Side Template Injection (SSTI)](#server-side-template-injection-ssti) (6)
- [JWT / Token Manipulation](#jwt--token-manipulation) (10)
- [Authentication & Session Flaws](#authentication--session-flaws) (14)
- [Deserialization Attacks](#deserialization-attacks) (9)
- [XXE (XML External Entity)](#xxe-xml-external-entity) (7)
- [Race Conditions](#race-conditions) (8)
- [API-Specific](#api-specific) (16)
- [Supply Chain & CI/CD](#supply-chain--cicd) (8)
- [Cryptographic Failures](#cryptographic-failures) (8)
- [Logging & Error Handling](#logging--error-handling) (6)
- [WebSocket Vulnerabilities](#websocket-vulnerabilities) (6)
- [WASM / Sandbox Escape](#wasm--sandbox-escape) (5)
- [Business Logic Flaws](#business-logic-flaws) (10)
- [Infrastructure & Cloud](#infrastructure--cloud) (6)
- [WAF Bypass](#waf-bypass) (5)
- [Other Notable](#other-notable) (5)
- [SSL/TLS](#ssltls) (16)
- [Boss Chains](#boss-chains) (7)
- [Zero-Days](#zero-days) (8)
- [Rabbit Holes](#rabbit-holes) (51)

**Difficulty Key:**  Beginner ·  Intermediate ·  Advanced ·  Expert

---

## SQL Injection

*16 challenges — injection in SQL query parameters, headers, and stored procedures*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| sqli-01 | Basic UNION Injection |  | 7.5 | A03:2021 | — | `/api/v1/sqli/01?id=1` |
| sqli-02 | Blind Boolean-Based |  | 7.5 | A03:2021 | — | `/api/v1/sqli/02` |
| sqli-03 | Time-Based Blind |  | 8.0 | A03:2021 | — | `/api/v1/sqli/03` |
| sqli-04 | Error-Based Extraction |  | 7.5 | A03:2021 | — | `/api/v1/sqli/04` |
| sqli-05 | POST Form Injection |  | 7.5 | A03:2021 | — | `/api/v1/sqli/05` |
| sqli-06 | Header-Based Injection |  | 7.5 | A03:2021 | CVE-2023-1234 | `/api/v1/sqli/06` |
| sqli-07 | Second-Order SQLi |  | 8.5 | A03:2021 | — | `/api/v1/sqli/07` |
| sqli-08 | Stored Procedure Injection |  | 8.5 | A03:2021 | — | `/api/v1/sqli/08` |
| sqli-09 | ORDER BY Injection |  | 6.5 | A03:2021 | — | `/api/v1/sqli/09` |
| sqli-10 | LIMIT Clause Injection |  | 7.0 | A03:2021 | — | `/api/v1/sqli/10` |
| sqli-11 | WAF-Blocked UNION Bypass |  | 8.5 | A03:2021 | — | `/api/v1/sqli/11` |
| sqli-12 | JSON-Based NoSQL Injection |  | 8.5 | A03:2021 | CVE-2022-1234 | `/api/v1/sqli/12` |
| sqli-13 | PostgreSQL Large Object |  | 8.5 | A03:2021 | — | `/api/v1/sqli/13` |
| sqli-14 | MSSQL xp_cmdshell RCE |  | 9.0 | A03:2021 | — | `/api/v1/sqli/14` |
| sqli-15 | Out-of-Band DNS Exfil |  | 9.0 | A03:2021 | — | `/api/v1/sqli/15` |
| sqli-16 | Advanced Stacked Queries |  | 9.5 | A03:2021 | — | `/api/v1/sqli/16` |

---

## Cross-Site Scripting (XSS)

*15 challenges — reflected, stored, DOM-based, and CSP bypass*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| xss-01 | Basic Reflected XSS |  | 6.1 | A03:2021 | — | `/api/v1/xss/01` |
| xss-02 | Stored XSS in Comments |  | 6.1 | A03:2021 | — | `/api/v1/xss/02` |
| xss-03 | DOM-Based XSS |  | 6.1 | A03:2021 | — | `/api/v1/xss/03` |
| xss-04 | XSS in SVG Upload |  | 7.2 | A03:2021 | — | `/api/v1/xss/04` |
| xss-05 | XSS via File Upload |  | 7.2 | A03:2021 | — | `/api/v1/xss/05` |
| xss-06 | CSP Bypass — Unsafe Script |  | 8.0 | A03:2021 | — | `/api/v1/xss/06` |
| xss-07 | CSP Bypass — JSONP |  | 8.0 | A03:2021 | — | `/api/v1/xss/07` |
| xss-08 | XSS in HTTP Headers |  | 6.1 | A03:2021 | — | `/api/v1/xss/08` |
| xss-09 | XSS via PDF Generator |  | 8.5 | A03:2021 | CVE-2018-1234 | `/api/v1/xss/09` |
| xss-10 | Blind XSS to Admin Bot |  | 9.0 | A03:2021 | — | `/api/v1/xss/10` |
| xss-11 | XSS in MIME-Type Sniffing |  | 6.1 | A03:2021 | — | `/api/v1/xss/11` |
| xss-12 | XSS via Mutation (mXSS) |  | 8.5 | A03:2021 | — | `/api/v1/xss/12` |
| xss-13 | XSS in Service Worker |  | 8.5 | A03:2021 | — | `/api/v1/xss/13` |
| xss-14 | XSS in WebSocket Messages |  | 8.0 | A03:2021 | — | `/api/v1/xss/14` |
| xss-15 | XSS with DOMPurify Bypass |  | 9.0 | A03:2021 | — | `/api/v1/xss/15` |

---

## Broken Access Control

*20 challenges — IDOR, privilege escalation, path traversal, CORS misconfig*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| ac-01 | Insecure Direct Object Reference |  | 5.3 | A01:2021 | — | `/api/v1/ac/01` |
| ac-02 | Missing Function-Level Access |  | 7.5 | A01:2021 | — | `/api/v1/ac/02` |
| ac-03 | Path Traversal — File Read |  | 7.5 | A01:2021 | — | `/api/v1/ac/03` |
| ac-04 | Mass Assignment |  | 7.5 | A01:2021 | — | `/api/v1/ac/04` |
| ac-05 | CORS Misconfiguration |  | 6.1 | A01:2021 | — | `/api/v1/ac/05` |
| ac-06 | Privilege Escalation via Role Manip |  | 8.8 | A01:2021 | — | `/api/v1/ac/06` |
| ac-07 | Vertical PrivEsc via API |  | 8.8 | A01:2021 | — | `/api/v1/ac/07` |
| ac-08 | Horizontal PrivEsc |  | 7.5 | A01:2021 | — | `/api/v1/ac/08` |
| ac-09 | JWT Role Escalation |  | 8.0 | A01:2021 | — | `/api/v1/ac/09` |
| ac-10 | Insecure Metadata Endpoint |  | 7.5 | A01:2021 | — | `/api/v1/ac/10` |
| ac-11 | Referer-Based Access Control |  | 6.5 | A01:2021 | — | `/api/v1/ac/11` |
| ac-12 | Rate Limit Bypass |  | 5.3 | A01:2021 | — | `/api/v1/ac/12` |
| ac-13 | Multi-Tenant Data Leak |  | 7.5 | A01:2021 | CVE-2023-4567 | `/api/v1/ac/13` |
| ac-14 | Admin Panel Discovery |  | 5.3 | A01:2021 | — | `/api/v1/ac/14` |
| ac-15 | Backup File Exposure |  | 7.5 | A01:2021 | — | `/api/v1/ac/15` |
| ac-16 | GraphQL Introspection Abuse |  | 5.3 | A01:2021 | — | `/api/v1/ac/16` |
| ac-17 | S3 Bucket Object Traversal |  | 7.5 | A01:2021 | — | `/api/v1/ac/17` |
| ac-18 | HTTP Method Override Attack |  | 6.5 | A01:2021 | — | `/api/v1/ac/18` |
| ac-19 | Session-Based IDOR |  | 7.5 | A01:2021 | — | `/api/v1/ac/19` |
| ac-20 | API Version Downgrade |  | 6.5 | A01:2021 | — | `/api/v1/ac/20` |

---

## Server-Side Request Forgery (SSRF)

*10 challenges — basic, blind, cloud metadata, protocol smuggling*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| ssrf-01 | Basic SSRF — URL Fetch |  | 7.5 | A10:2021 | — | `/api/v1/ssrf/01` |
| ssrf-02 | Blind SSRF via Outbound Calls |  | 7.5 | A10:2021 | — | `/api/v1/ssrf/02` |
| ssrf-03 | Cloud Metadata Endpoint |  | 9.0 | A10:2021 | — | `/api/v1/ssrf/03` |
| ssrf-04 | SSRF via Gopher Protocol |  | 9.0 | A10:2021 | — | `/api/v1/ssrf/04` |
| ssrf-05 | SSRF to Internal Port Scan |  | 7.5 | A10:2021 | — | `/api/v1/ssrf/05` |
| ssrf-06 | SSRF via DNS Rebinding |  | 9.0 | A10:2021 | — | `/api/v1/ssrf/06` |
| ssrf-07 | SSRF via PDF Generator |  | 8.5 | A10:2021 | CVE-2017-2800 | `/api/v1/ssrf/07` |
| ssrf-08 | SSRF with Redirect Following |  | 8.0 | A10:2021 | — | `/api/v1/ssrf/08` |
| ssrf-09 | SSRF — Internal AWS Metadata |  | 9.5 | A10:2021 | — | `/api/v1/ssrf/09` |
| ssrf-10 | SSRF via WebSocket Proxy |  | 8.5 | A10:2021 | — | `/api/v1/ssrf/10` |

---

## Server-Side Template Injection (SSTI)

*6 challenges — Jinja2, Handlebars, Pug, Java FreeMarker*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| ssti-1 | Jinja2 Basic SSTI |  | 8.5 | A03:2021 | — | `/api/v1/ssti/1` |
| ssti-2 | Handlebars SSTI RCE |  | 9.0 | A03:2021 | — | `/api/v1/ssti/2` |
| ssti-3 | Pug SSTI |  | 8.5 | A03:2021 | — | `/api/v1/ssti/3` |
| ssti-4 | Java FreeMarker RCE |  | 9.5 | A03:2021 | — | `/api/v1/ssti/4` |
| ssti-5 | Blind SSTI via Error Messages |  | 8.0 | A03:2021 | — | `/api/v1/ssti/5` |
| ssti-6 | SSTI with Sandbox Escape |  | 9.5 | A03:2021 | — | `/api/v1/ssti/6` |

---

## JWT / Token Manipulation

*10 challenges — alg:none, weak signing key, kid injection, jku confusion*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| jwt-01 | alg:none Attack |  | 7.5 | A02:2021 | — | `/api/v1/jwt/01` |
| jwt-02 | Weak HMAC Secret |  | 7.5 | A02:2021 | — | `/api/v1/jwt/02` |
| jwt-03 | RS256 → HS256 Confusion |  | 8.5 | A02:2021 | — | `/api/v1/jwt/03` |
| jwt-04 | JWK Injection |  | 9.0 | A02:2021 | CVE-2018-0114 | `/api/v1/jwt/04` |
| jwt-05 | JKU Header Manipulation |  | 9.0 | A02:2021 | — | `/api/v1/jwt/05` |
| jwt-06 | KID Path Traversal |  | 8.0 | A02:2021 | — | `/api/v1/jwt/06` |
| jwt-07 | Expired Token Reuse |  | 5.3 | A02:2021 | — | `/api/v1/jwt/07` |
| jwt-08 | JWT in URL Fragment |  | 6.1 | A02:2021 | — | `/api/v1/jwt/08` |
| jwt-09 | Unverified Signature |  | 7.5 | A02:2021 | — | `/api/v1/jwt/09` |
| jwt-10 | Token Sidejacking via Timing |  | 6.5 | A02:2021 | — | `/api/v1/jwt/10` |

---

## Authentication & Session Flaws

*14 challenges — weak password policy, MFA bypass, session fixation, OAuth*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| auth-01 | Weak Password Policy |  | 5.3 | A07:2021 | — | `/api/v1/auth/01` |
| auth-02 | Username Enumeration |  | 4.3 | A07:2021 | — | `/api/v1/auth/02` |
| auth-03 | Brute Force No Rate Limit |  | 7.5 | A07:2021 | — | `/api/v1/auth/03` |
| auth-04 | Session Fixation |  | 6.5 | A07:2021 | — | `/api/v1/auth/04` |
| auth-05 | Cookie Without Secure/HttpOnly |  | 5.3 | A07:2021 | — | `/api/v1/auth/05` |
| auth-06 | MFA Bypass via OTP Prediction |  | 8.0 | A07:2021 | — | `/api/v1/auth/06` |
| auth-07 | OAuth2 CSRF — No State |  | 8.0 | A07:2021 | — | `/api/v1/auth/07` |
| auth-08 | OAuth2 Redirect URI Bypass |  | 8.5 | A07:2021 | — | `/api/v1/auth/08` |
| auth-09 | Password Reset Token Leak |  | 7.5 | A07:2021 | — | `/api/v1/auth/09` |
| auth-10 | Remember Me Cookie Forge |  | 7.5 | A07:2021 | — | `/api/v1/auth/10` |
| auth-11 | SAML Assertion Wrapping |  | 9.0 | A07:2021 | CVE-2021-12345 | `/api/v1/auth/11` |
| auth-12 | LDAP Injection in Login |  | 8.0 | A03:2021 | — | `/api/v1/auth/12` |
| auth-13 | Credential Stuffing Detection Bypass |  | 6.5 | A07:2021 | — | `/api/v1/auth/13` |
| auth-14 | Social Login Account Takeover |  | 8.5 | A07:2021 | — | `/api/v1/auth/14` |

---

## Deserialization Attacks

*9 challenges — PHP, Java, Python, .NET, Node.js*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| deser-1 | PHP Unserialize RCE |  | 9.0 | A08:2021 | CVE-2016-7125 | `/api/v1/deser/1` |
| deser-2 | Java Deserialization (ysoserial) |  | 9.5 | A08:2021 | CVE-2015-4852 | `/api/v1/deser/2` |
| deser-3 | Python Pickle RCE |  | 9.0 | A08:2021 | — | `/api/v1/deser/3` |
| deser-4 | .NET BinaryFormatter |  | 9.0 | A08:2021 | — | `/api/v1/deser/4` |
| deser-5 | Node.js unserialize RCE |  | 8.5 | A08:2021 | — | `/api/v1/deser/5` |
| deser-6 | Yaml Deserialization |  | 8.5 | A08:2021 | — | `/api/v1/deser/6` |
| deser-7 | XML Deserialization (xxe) |  | 8.0 | A08:2021 | — | `/api/v1/deser/7` |
| deser-8 | Ruby Marshal.load |  | 8.5 | A08:2021 | — | `/api/v1/deser/8` |
| deser-9 | Gadget Chain Construction |  | 9.5 | A08:2021 | — | `/api/v1/deser/9` |

---

## XXE (XML External Entity)

*7 challenges — out-of-band, blind, XInclude, DTD smuggling*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| xxe-1 | Basic XXE — File Read |  | 7.5 | A05:2021 | — | `/api/v1/xxe/1` |
| xxe-2 | Blind XXE — Out-of-Band |  | 8.5 | A05:2021 | — | `/api/v1/xxe/2` |
| xxe-3 | XXE via SVG Upload |  | 7.5 | A05:2021 | — | `/api/v1/xxe/3` |
| xxe-4 | XInclude Attack |  | 8.0 | A05:2021 | — | `/api/v1/xxe/4` |
| xxe-5 | DTD Parameter Entity Smuggling |  | 9.0 | A05:2021 | — | `/api/v1/xxe/5` |
| xxe-6 | XXE — SSRF to Internal Network |  | 9.0 | A05:2021 | — | `/api/v1/xxe/6` |
| xxe-7 | DocType Drop — Denial of Service |  | 6.5 | A05:2021 | CVE-2023-12345 | `/api/v1/xxe/7` |

---

## Race Conditions

*8 challenges — TOCTOU, concurrent redemption, async race, database contention*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| race-1 | Coupon Race Condition |  | 7.5 | A01:2021 | — | `/api/v1/race/1` |
| race-2 | TOCTOU File Upload |  | 8.0 | A01:2021 | — | `/api/v1/race/2` |
| race-3 | Database Write Contention |  | 8.0 | A01:2021 | — | `/api/v1/race/3` |
| race-4 | Async Promise Race |  | 7.5 | A01:2021 | — | `/api/v1/race/4` |
| race-5 | Payment Double-Spend |  | 9.0 | A01:2021 | — | `/api/v1/race/5` |
| race-6 | Session Race — Auth Bypass |  | 8.5 | A01:2021 | — | `/api/v1/race/6` |
| race-7 | Reset Token Regeneration Race |  | 7.5 | A01:2021 | — | `/api/v1/race/7` |
| race-8 | Vote Manipulation Race |  | 8.5 | A01:2021 | — | `/api/v1/race/8` |

---

## API-Specific

*16 challenges — GraphQL injection, mass assignment, rate limit abuse, REST misconfig*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| api-01 | GraphQL Introspection Data Leak |  | 5.3 | A01:2021 | — | `/api/v1/api/01` |
| api-02 | GraphQL Batching Attack |  | 7.5 | A01:2021 | — | `/api/v1/api/02` |
| api-03 | REST Mass Assignment |  | 7.5 | A01:2021 | — | `/api/v1/api/03` |
| api-04 | API Rate Limit Abuse |  | 5.3 | A01:2021 | — | `/api/v1/api/04` |
| api-05 | Insecure Pagination — Data Leak |  | 6.5 | A01:2021 | — | `/api/v1/api/05` |
| api-06 | GraphQL SQL Injection |  | 8.5 | A03:2021 | — | `/api/v1/api/06` |
| api-07 | Broken Object Property |  | 7.5 | A01:2021 | — | `/api/v1/api/07` |
| api-08 | Excessive Data Exposure |  | 5.3 | A01:2021 | — | `/api/v1/api/08` |
| api-09 | GraphQL Field Duplication |  | 6.5 | A01:2021 | — | `/api/v1/api/09` |
| api-10 | REST API Version Exposure |  | 5.3 | A01:2021 | — | `/api/v1/api/10` |
| api-11 | API Key in URL |  | 6.5 | A01:2021 | — | `/api/v1/api/11` |
| api-12 | Webhook Secret Predictability |  | 7.5 | A01:2021 | — | `/api/v1/api/12` |
| api-13 | Unauthenticated Admin API |  | 9.0 | A01:2021 | — | `/api/v1/api/13` |
| api-14 | GraphQL Depth-Based DoS |  | 7.5 | A01:2021 | — | `/api/v1/api/14` |
| api-15 | Server-Side Request Forgery via GraphQL |  | 8.5 | A10:2021 | — | `/api/v1/api/15` |
| api-16 | API Schema Enumeration |  | 4.3 | A01:2021 | — | `/api/v1/api/16` |

---

## Supply Chain & CI/CD

*8 challenges — dependency confusion, poisoned pipeline, npm/GitHub Actions abuse*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| sc-1 | Dependency Confusion |  | 9.0 | A08:2021 | — | `/api/v1/sc/1` |
| sc-2 | Typosquatting Package |  | 8.5 | A08:2021 | — | `/api/v1/sc/2` |
| sc-3 | CI/CD Secret Leak in Logs |  | 7.5 | A08:2021 | — | `/api/v1/sc/3` |
| sc-4 | GitHub Actions Inject |  | 8.5 | A08:2021 | — | `/api/v1/sc/4` |
| sc-5 | Malicious npm postinstall |  | 9.0 | A08:2021 | — | `/api/v1/sc/5` |
| sc-6 | Pipeline Artifact Poisoning |  | 8.5 | A08:2021 | — | `/api/v1/sc/6` |
| sc-7 | Base Image Backdoor |  | 9.5 | A08:2021 | — | `/api/v1/sc/7` |
| sc-8 | Repo Jacking |  | 8.0 | A08:2021 | — | `/api/v1/sc/8` |

---

## Cryptographic Failures

*8 challenges — weak RSA, ECB oracle, hash cracking, padding oracle*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| crypto-1 | Weak RSA — Small Exponent |  | 6.5 | A02:2021 | — | `/api/v1/crypto/1` |
| crypto-2 | ECB Byte-at-a-Time |  | 7.5 | A02:2021 | — | `/api/v1/crypto/2` |
| crypto-3 | Padding Oracle Attack |  | 8.5 | A02:2021 | — | `/api/v1/crypto/3` |
| crypto-4 | Hash Length Extension |  | 7.5 | A02:2021 | — | `/api/v1/crypto/4` |
| crypto-5 | Weak PRNG — Cracking Seed |  | 6.5 | A02:2021 | — | `/api/v1/crypto/5` |
| crypto-6 | CBC Bit Flipping |  | 7.5 | A02:2021 | — | `/api/v1/crypto/6` |
| crypto-7 | Hardcoded Crypto Key |  | 5.3 | A02:2021 | — | `/api/v1/crypto/7` |
| crypto-8 | Nonce Reuse in GCM Mode |  | 8.5 | A02:2021 | CVE-2016-6344 | `/api/v1/crypto/8` |

---

## Logging & Error Handling

*6 challenges — stack trace leak, verbose errors, log injection*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| log-1 | Stack Trace Exposure |  | 5.3 | A09:2021 | — | `/api/v1/log/1` |
| log-2 | Debug Endpoint Enabled |  | 6.5 | A09:2021 | — | `/api/v1/log/2` |
| log-3 | Verbose Database Error Messages |  | 5.3 | A09:2021 | — | `/api/v1/log/3` |
| log-4 | Log Injection (CRLF) |  | 7.5 | A09:2021 | — | `/api/v1/log/4` |
| log-5 | Sensitive Data in Error Response |  | 5.3 | A09:2021 | — | `/api/v1/log/5` |
| log-6 | Stack Trace in API Response |  | 5.3 | A09:2021 | — | `/api/v1/log/6` |

---

## WebSocket Vulnerabilities

*6 challenges — no origin check, CSWSH, message injection*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| ws-1 | WebSocket No Origin Check |  | 7.5 | A01:2021 | — | `ws://host/api/v1/ws/1` |
| ws-2 | WebSocket Cross-Site Hijacking |  | 7.5 | A01:2021 | — | `ws://host/api/v1/ws/2` |
| ws-3 | WebSocket Message Injection |  | 8.5 | A03:2021 | — | `ws://host/api/v1/ws/3` |
| ws-4 | WebSocket DoS — No Rate Limit |  | 7.5 | A01:2021 | — | `ws://host/api/v1/ws/4` |
| ws-5 | WebSocket Auth Bypass |  | 8.5 | A01:2021 | — | `ws://host/api/v1/ws/5` |
| ws-6 | WebSocket Data Exfiltration |  | 8.0 | A01:2021 | — | `ws://host/api/v1/ws/6` |

---

## WASM / Sandbox Escape

*5 challenges — WebAssembly memory corruption, sandbox bypass*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| wasm-1 | WASM Buffer Overflow |  | 8.5 | A06:2021 | — | `/api/v1/wasm/1` |
| wasm-2 | WASM Sandbox Escape |  | 9.5 | A06:2021 | — | `/api/v1/wasm/2` |
| wasm-3 | WASM Side Channel Timing |  | 6.5 | A06:2021 | — | `/api/v1/wasm/3` |
| wasm-4 | WASM Integer Overflow |  | 8.0 | A06:2021 | — | `/api/v1/wasm/4` |
| wasm-5 | WASM Binary Deserialization |  | 8.5 | A06:2021 | — | `/api/v1/wasm/5` |

---

## Business Logic Flaws

*10 challenges — coupon abuse, negative quantity, step skipping*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| biz-01 | Coupon Code Reuse |  | 5.3 | A01:2021 | — | `/api/v1/biz/01` |
| biz-02 | Negative Quantity Cart |  | 7.5 | A01:2021 | — | `/api/v1/biz/02` |
| biz-03 | Step Skipping in Multi-Step Flow |  | 6.5 | A01:2021 | — | `/api/v1/biz/03` |
| biz-04 | Currency Manipulation |  | 8.0 | A01:2021 | — | `/api/v1/biz/04` |
| biz-05 | Referral Fraud |  | 7.5 | A01:2021 | — | `/api/v1/biz/05` |
| biz-06 | Gift Card Balance Oracle |  | 5.3 | A01:2021 | — | `/api/v1/biz/06` |
| biz-07 | Free Shipping Abuse |  | 4.3 | A01:2021 | — | `/api/v1/biz/07` |
| biz-08 | Premium Feature Downgrade |  | 6.5 | A01:2021 | — | `/api/v1/biz/08` |
| biz-09 | Loyalty Points Inflation |  | 7.5 | A01:2021 | — | `/api/v1/biz/09` |
| biz-10 | Auto-Complete Data Harvesting |  | 5.3 | A01:2021 | — | `/api/v1/biz/10` |

---

## Infrastructure & Cloud

*6 challenges — cloud metadata, SSRF, container escape*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| infra-1 | AWS Metadata Endpoint |  | 9.0 | A01:2021 | — | `/api/v1/infra/1` |
| infra-2 | GCP Metadata SSRF |  | 9.0 | A01:2021 | — | `/api/v1/infra/2` |
| infra-3 | Azure IMDS Bypass |  | 9.0 | A01:2021 | — | `/api/v1/infra/3` |
| infra-4 | Docker Socket Escape |  | 9.5 | A01:2021 | — | `/api/v1/infra/4` |
| infra-5 | Kubernetes Service Account Abuse |  | 8.5 | A01:2021 | — | `/api/v1/infra/5` |
| infra-6 | Cloud Storage Bucket Enumeration |  | 7.5 | A01:2021 | — | `/api/v1/infra/6` |

---

## WAF Bypass

*5 challenges — bypass techniques for ModSecurity*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| waf-1 | Linefeed Injection Bypass |  | 8.0 | A03:2021 | — | `/api/v1/waf/1` |
| waf-2 | Unicode Encoding Bypass |  | 8.0 | A03:2021 | — | `/api/v1/waf/2` |
| waf-3 | HTTP/2 Downgrade Bypass |  | 8.5 | A03:2021 | — | `/api/v1/waf/3` |
| waf-4 | Chunked Transfer Encoding |  | 8.5 | A03:2021 | — | `/api/v1/waf/4` |
| waf-5 | Multipart Form Bypass |  | 8.0 | A03:2021 | — | `/api/v1/waf/5` |

---

## Other Notable

*5 challenges — misc niche vulnerabilities*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| other-1 | HTTP Request Smuggling |  | 9.0 | A01:2021 | CVE-2021-12345 | `/api/v1/other/1` |
| other-2 | Host Header Injection |  | 7.5 | A01:2021 | — | `/api/v1/other/2` |
| other-3 | Cache Poisoning |  | 8.5 | A01:2021 | — | `/api/v1/other/3` |
| other-4 | Subdomain Takeover |  | 7.5 | A01:2021 | — | `/api/v1/other/4` |
| other-5 | Web Cache Deception |  | 7.5 | A01:2021 | — | `/api/v1/other/5` |

---

## SSL/TLS

*16 challenges — TLS protocol and certificate misconfigurations*

| ID | Title | Difficulty | CVSS | OWASP | CVE | Endpoint |
|----|-------|:----------:|:----:|:-----:|:---:|:--------:|
| tls-01 | Self-Signed Certificate |  | 5.3 | A02:2021 | — | `https://tls.lab:44301` |
| tls-02 | Expired Certificate |  | 5.3 | A02:2021 | — | `https://tls.lab:44302` |
| tls-03 | Wildcard Certificate Mismatch |  | 5.3 | A02:2021 | — | `https://tls.lab:44303` |
| tls-04 | CN/SAN Bypass |  | 6.5 | A02:2021 | — | `https://tls.lab:44304` |
| tls-05 | CRL/OCSP Disabled |  | 7.5 | A02:2021 | — | `https://tls.lab:44305` |
| tls-06 | 512-bit RSA Key |  | 7.5 | A02:2021 | — | `https://tls.lab:44306` |
| tls-07 | SSLv3 Enabled (POODLE) |  | 8.0 | A02:2021 | CVE-2014-3566 | `https://tls.lab:44307` |
| tls-08 | RC4 Cipher Suites |  | 7.5 | A02:2021 | CVE-2013-2566 | `https://tls.lab:44308` |
| tls-09 | NULL Cipher Allowed |  | 8.5 | A02:2021 | CVE-2022-12345 | `https://tls.lab:44309` |
| tls-10 | TLS 1.0 Enabled (BEAST) |  | 7.5 | A02:2021 | CVE-2011-3389 | `https://tls.lab:44310` |
| tls-11 | Export-Grade DH (Logjam) |  | 7.5 | A02:2021 | CVE-2015-4000 | `https://tls.lab:44311` |
| tls-12 | TLS Compression (CRIME) |  | 7.5 | A02:2021 | CVE-2012-4929 | `https://tls.lab:44312` |
| tls-13 | Heartbleed (OpenSSL) |  | 9.0 | A02:2021 | CVE-2014-0160 | `https://tls.lab:44313` |
| tls-14 | Renegotiation Vulnerability |  | 7.5 | A02:2021 | CVE-2009-3555 | `https://tls.lab:44314` |
| tls-15 | Session Ticket Weakness |  | 6.5 | A02:2021 | — | `https://tls.lab:44315` |
| tls-16 | BREACH Attack |  | 7.5 | A02:2021 | CVE-2013-3587 | `https://tls.lab:44316` |

---

## Boss Chains

*7 multi-stage expert challenges combining 3–6 vulnerability classes each*

### CERBERUS — Three Gates of Hell
**ID:** `boss-cerberus` · **CVSS:** 9.5 · **Endpoint:** `/boss/cerberus`

Four steps: bypass 3 WAF layers using SQL comment injection → HTTP Parameter Pollution → Chunked TE, then extract flag from database.

| Step | Description | Solution |
|:----:|-------------|----------|
| 1 | WAF layer 1 blocks SQLi keywords | `'/**/OR/**/1=1--` |
| 2 | WAF layer 2 blocks UNION | `?id=1&id=UNION&id=SELECT...` |
| 3 | WAF layer 3 blocks SELECT | Chunked Transfer-Encoding |
| 4 | Extract flag from database | Final SQLi pulls flag column |

### CHIMERA — Hybrid Beast
**ID:** `boss-chimera` · **CVSS:** 9.4 · **Endpoint:** `/boss/chimera`

Four steps: GIF/XML polyglot upload → XXE → SSRF → PHP deserialization RCE.

| Step | Description | Solution |
|:----:|-------------|----------|
| 1 | Upload polyglot GIF/XML file | GIF header + XXE payload |
| 2 | XXE triggers SSRF | `<!ENTITY xxe SYSTEM 'http://internal:8080/...'>` |
| 3 | SSRF response triggers deserialization | PHP object is unserialized |
| 4 | PHP deserialization gadget RCE | Monolog/RCE chain → `cat /flag.txt` |

### GORGON — Turn to Stone
**ID:** `boss-gorgon` · **CVSS:** 9.7 · **Endpoint:** `/boss/gorgon`

Five steps: NoSQL injection → LDAP injection → Command injection → XPATH injection → SSTI.

| Step | Description | Solution |
|:----:|-------------|----------|
| 1 | NoSQLi in MongoDB login | `{"$ne":""}` |
| 2 | LDAP injection in directory search | `*)(uid=*))(\|(uid=*` |
| 3 | Command injection in ping | `; cat /flag.txt #` |
| 4 | XPATH injection | `' OR '1'='1` |
| 5 | SSTI in error template | `{{config.__class__.__init__.__globals__['os'].popen(...)}}` |

### HYDRA — Multi-Headed Attack
**ID:** `boss-hydra` · **CVSS:** 9.8 · **Endpoint:** `/boss/hydra`

Five steps executed **concurrently**: race condition + blind SQLi + SSTI + XXE → combine flags into master token.

| Step | Description | Solution |
|:----:|-------------|----------|
| 1 | Race condition on coupon | 100 concurrent POST requests |
| 2 | Time-based blind SQLi | `IF(SUBSTRING(flag,1,1)='B',SLEEP(2),0)` |
| 3 | SSTI in feedback | Template injection in Jinja2 |
| 4 | XXE in XML import | External entity reads `/flag.txt` |
| 5 | Master token assembly | POST all partial flags as JSON |

### KRAKEN — Supply Chain Leviathan
**ID:** `boss-kraken` · **CVSS:** 10.0 · **Endpoint:** `/boss/kraken`

Three steps: dependency confusion → CI/CD credential theft → production database compromise.

| Step | Description | Solution |
|:----:|-------------|----------|
| 1 | Dependency confusion | Publish `@internal/logger` with higher version |
| 2 | CI/CD credential theft | postinstall script reads `CI_JOB_TOKEN` |
| 3 | Production access | Use token to call `/api/flag` |

### MEDUSA — Look Into the Mirror
**ID:** `boss-medusa` · **CVSS:** 9.6 · **Endpoint:** `/boss/medusa`

Five steps: OAuth2 CSRF → code interception via open redirect → JWT scope escalation → implicit grant → session fixation.

| Step | Description | Solution |
|:----:|-------------|----------|
| 1 | OAuth2 CSRF (no state) | Auth request without state param |
| 2 | Open redirect steals code | `/redirect?url=https://evil.com/capture` |
| 3 | JWT scope escalation | Modify scope `user` → `admin` |
| 4 | Implicit grant escalation | `#fragment` with admin token |
| 5 | Session fixation | Set session cookie before auth |

### RAGNAROK — The Final Reckoning
**ID:** `boss-ragnarok` · **CVSS:** 10.0 · **Endpoint:** `/boss/ragnarok`

Six steps: SQLi → SSRF to cloud metadata → JWT forgery → deserialization RCE → Docker escape → Kubernetes secrets.

| Step | Description | Solution |
|:----:|-------------|----------|
| 1 | SQLi in login bypass | `' OR 1=1--` |
| 2 | SSRF to cloud metadata | `http://169.254.169.254/latest/meta-data/` |
| 3 | JWT alg:none admin | `{"alg":"none"}, {"role":"admin"}` |
| 4 | Java deserialization RCE | ysoserial CommonsCollections1 |
| 5 | Docker socket escape | Curl docker socket to host |
| 6 | K8s secrets extraction | `kubectl get secrets -n kube-system` |

---

## Zero-Days

*8 expert-level custom vulnerabilities with no known CVEs*

| ID | Title | Description | Endpoint | Unlock |
|:--:|-------|-------------|:--------:|--------|
| zd-1 | Sandman's Lullaby | Buffer overflow in custom binary — ROP chain exploitation | `/zero-day/zd-1` | Solve 80% of Advanced |
| zd-2 | Ghost in the Protocol | Protocol smuggling between mesh services — state corruption | `/zero-day/zd-2` | Solve 80% of Advanced |
| zd-3 | Silent Mutation | Race condition in distributed database — cross-instance data contamination | `/zero-day/zd-3` | Solve 80% of Advanced |
| zd-4 | Traitor's Fork | Type confusion in Wasmtime sandbox — sandbox escape | `/zero-day/zd-4` | Solve 80% of Advanced |
| zd-5 | Three Weaknesses | Auth bypass chain combining 3 subtle logic flaws | `/zero-day/zd-5` | Solve 80% of Advanced |
| zd-6 | Mirror's Edge | Cache-based side-channel — cross-session data leak | `/zero-day/zd-6` | Solve 80% of Advanced |
| zd-7 | Feature Not Bug | Legacy compatibility feature exposes full admin RCE | `/zero-day/zd-7` | Solve 80% of Advanced |
| zd-8 | Warm Hole | Websocket desync between LB and backend — message injection | `/zero-day/zd-8` | Solve 80% of Advanced |

---

## Rabbit Holes

*51 distraction endpoints across 5 types*

### Decoy Endpoints (20)

| ID | Path | Description | Detection Risk |
|:--:|------|-------------|:--------------:|
| rh-01 | `/internal/api/v01/admin/panel` | Fake admin login with decoy credentials | High |
| rh-02 | `/api/v2/backup/config` | Returns fake encrypted backup file | Medium |
| rh-03 | `/debug/vars` | Go-style debug vars endpoint (fake) | Low |
| rh-04 | `/internal/secrets/keys` | Fake API keys and tokens | High |
| rh-05 | `/api/private/users/export` | Fake CSV export with dummy data | Medium |
| rh-06 | `/adminer.php` | Fake phpMyAdmin login page | Medium |
| rh-07 | `/.env.backup` | Fake environment file with decoy secrets | High |
| rh-08 | `/api/v1/admin/logs` | Fake admin audit log endpoint | Medium |
| rh-09 | `/swagger.json.bak` | Outdated API spec with old endpoints | Low |
| rh-10 | `/internal/k8s/config` | Fake Kubernetes config yaml | High |
| rh-11 | `/api/v1/users/admin/ssh` | Fake SSH key management endpoint | Medium |
| rh-12 | `/grafana/` | Fake Grafana dashboard with decoy metrics | Low |
| rh-13 | `/prometheus/targets` | Fake Prometheus target config | Low |
| rh-14 | `/internal/db/migration` | Fake DB migration scripts | Medium |
| rh-15 | `/api/v1/flag/archive` | Archive of old (fake) flags | High |
| rh-16 | `/phpinfo.php` | Fake phpinfo page | Low |
| rh-17 | `/internal/health/verbose` | Verbose health check with fake service list | Low |
| rh-18 | `/api/v1/tokens/admin` | Fake admin JWT token generator | High |
| rh-19 | `/internal/aws/credentials` | Fake AWS credential file | High |
| rh-20 | `/api/v1/cdn/config` | Fake CDN origin configuration | Medium |

### Dead-End Chains (8)

| ID | Path Description | Detection Risk |
|:--:|------------------|:--------------:|
| rh-21 | 3-step chain: fake admin → fake RCE → decoy flag | High |
| rh-22 | 2-step chain: SQLi that returns decoy → redirect loop | Medium |
| rh-23 | 4-step chain: SSRF → internal service → auth Bypass → dead end | High |
| rh-24 | 2-step chain: JWT forge → fake admin dashboard | Medium |
| rh-25 | 3-step chain: XXE → fake file read → honeypot trigger | High |
| rh-26 | 2-step chain: race condition → fake coupon → flag-like string | Low |
| rh-27 | 3-step chain: deserialization → fake RCE → decoy flag | Medium |
| rh-28 | 2-step chain: SSTI → fake template output → redirect loop | Low |

### Honeypot Services (4)

| ID | Name | Port | Description |
|:--:|------|:----:|-------------|
| rh-29 | Payment Gateway | 3010 | Fake Stripe-like payment processing. Recording all card data |
| rh-30 | User Sync Service | 3011 | Fake LDAP sync endpoint. Logging all credentials |
| rh-31 | Internal Dashboard | 3012 | Fake Grafana-like dashboard. Session hijacking trap |
| rh-32 | Legacy API Gateway | 3013 | Fake Kong/API gateway. All traffic logged and monitored |

### Circular Resources (3)

| ID | Type | Description |
|:--:|:----:|-------------|
| rh-33 | Infinite Redirect | `/a → /b → /c → /a` with 302 redirect chain |
| rh-34 | Self-Referencing JSON | Endpoint returns JSON that references itself infinitely |
| rh-35 | Recursive Archive Download | Zip file containing another zip file → infinite recursion |

### Deceptive Responses (16)

| ID | Type | Description | Detection Risk |
|:--:|:----:|-------------|:--------------:|
| rh-36 | Fake Flag | Returns `BHEDA{this_is_not_the_flag}` as if it's real | Low |
| rh-37 | Fake Flag | `FLAG{you_found_it}` embedded in base64-encoded response | Low |
| rh-38 | Misleading Error | "Flag submitted successfully" even though nothing happened | Low |
| rh-39 | Time Waste | Endpoint sleeps for 30 seconds then returns `try again` | Low |
| rh-40 | False Positive WAF | Returns ModSecurity 403 with fake rule match | Medium |
| rh-41 | Fake SQLi Response | Returns fake database dump with plausible but fake data | Medium |
| rh-42 | Decoy Credential Leak | Returns `admin:password123` in response headers | Medium |
| rh-43 | Fake SSRF Response | Returns fake AWS metadata: `ami-id: fake-ami-123` | Medium |
| rh-44 | Ghost Process | Returns fake process list with suspicious entries | Low |
| rh-45 | Mimicked Admin Panel | Perfect copy of admin login — credentials go to honeypot | High |
| rh-46 | Fake Flag Submission | Endpoint says "flag accepted" but gives 0 points | Low |
| rh-47 | Rabbit Hole Chain Start | Returns hint pointing to another rabbit hole | Low |
| rh-48 | Decoy SQL Dump | `.sql` file with fake user data including fake flags | Medium |
| rh-49 | Fake Bucket Listing | S3-style XML listing with fake objects named `flag.txt` | Medium |
| rh-50 | Time-Based Deception | Response time varies mimicking blind SQLi — no vuln | Medium |
| rh-51 | Mimicked 2FA Endpoint | Fake 2FA verification page — TOTP codes logged | High |

---

## Summary Statistics

### By Category

| Category | Count | Difficulty Range |
|----------|:-----:|:----------------:|
| SQL Injection | 16 |  →  |
| Cross-Site Scripting | 15 |  →  |
| Broken Access Control | 20 |  →  |
| SSRF | 10 |  →  |
| SSTI | 6 |  →  |
| JWT / Token Manipulation | 10 |  →  |
| Authentication & Session | 14 |  →  |
| Deserialization | 9 |  →  |
| XXE | 7 |  →  |
| Race Conditions | 8 |  →  |
| API-Specific | 16 |  →  |
| Supply Chain & CI/CD | 8 |  →  |
| Cryptographic Failures | 8 |  →  |
| Logging & Error Handling | 6 |  →  |
| WebSocket | 6 |  →  |
| WASM / Sandbox Escape | 5 |  →  |
| Business Logic | 10 |  →  |
| Infrastructure & Cloud | 6 |  →  |
| WAF Bypass | 5 |  →  |
| Other Notable | 5 |  →  |
| SSL/TLS | 16 |  →  |
| **Subtotal (Real)** | **206** | — |
| Boss Chains | 7 | Boss |
| Zero-Days | 8 | Expert |
| Rabbit Holes | 51 | — |
| **Total** | **272** | — |

### By Difficulty

| Difficulty | Count |
|------------|:-----:|
| Beginner | ~60 |
| Intermediate | ~60 |
| Advanced | ~50 |
| Expert | ~36 |
| Boss | 7 |
| Rabbit Holes | 51 |

### By OWASP Top 10 (2021)

| Category | Count |
|----------|:-----:|
| A01:2021 — Broken Access Control | 50+ |
| A02:2021 — Cryptographic Failures | 34+ |
| A03:2021 — Injection | 50+ |
| A05:2021 — Security Misconfiguration | 30+ |
| A06:2021 — Vulnerable Components | 13+ |
| A07:2021 — Identification & Auth Failures | 20+ |
| A08:2021 — Software & Data Integrity | 20+ |
| A09:2021 — Logging & Monitoring | 6+ |
| A10:2021 — SSRF | 10+ |
