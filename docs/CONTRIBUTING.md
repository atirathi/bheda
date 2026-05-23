# Contributing to Bheda

Thank you for your interest in contributing to Bheda! This document covers the process for adding new challenges, fixing bugs, and improving the platform.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [How to Add a New Challenge](#how-to-add-a-new-challenge)
3. [Code Style](#code-style)
4. [Testing](#testing)
5. [Pull Request Process](#pull-request-process)

---

## Code of Conduct

By participating, you agree to maintain a respectful, inclusive environment. Harassment, trolling, and personal attacks will not be tolerated.

---

## How to Add a New Challenge

### 1. Create the YAML Definition

All challenges are defined in `/challenges/`. Choose the appropriate category directory:

```
challenges/
├── web/
│   ├── sqli/
│   ├── xss/
│   ├── access-control/
│   ├── ssrf/
│   ├── jwt/
│   ├── ssti/
│   ├── xxe/
│   ├── deser/
│   ├── race/
│   ├── ws/
│   ├── wasm/
│   ├── crypto/
│   ├── api/
│   ├── auth/
│   ├── biz/
│   ├── logging/
│   ├── infra/
│   ├── supply-chain/
│   ├── waf/
│   └── other/
├── tls/
├── zero-day/
└── boss/
```

Create a new YAML file with the following structure:

```yaml
id: sqli-17
title: "SQL Injection — Advanced Blind"
category: web
difficulty: advanced
cvss: 8.5
owasp: A03:2021 – Injection
cve: CVE-XXXX-XXXX  # Optional, real CVE reference
endpoint: /api/v1/sqli/17
description: "Time-based blind SQL injection in the password reset token endpoint."
hints:
  - "The token parameter is vulnerable to time-based injection."
  - "Use IF() and SLEEP() to extract data bit by bit."
  - "The flag is 32 characters in the users.flag column."
flag: "BHEDA{custom_flag_value}"
flag_location: "Database column: users.flag"
solution_summary: "Time-based blind SQLi using IF(SUBSTRING(...),SLEEP(n),0) payloads to extract flag character by character."
```

### 2. Create the Route Handler

Add your challenge endpoint in the vuln-app service:

```typescript
// vuln-app/src/routes/sqli/sqli-17.ts
import { Router, Request, Response } from 'express';
import { challengeCheck } from '../../middleware/state_checker';

const router = Router();

router.get('/17', challengeCheck('sqli-17'), async (req: Request, res: Response) => {
  const { id } = req.query;

  // Intentionally vulnerable query
  const query = `SELECT * FROM users WHERE id = ${id}`;

  try {
    const result = await pool.query(query);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### 3. Register the Route

Add your route to the category index file:

```typescript
// vuln-app/src/routes/sqli/index.ts
import sqli01 from './sqli-01';
import sqli02 from './sqli-02';
// ...
import sqli17 from './sqli-17';

router.use('/sqli/01', sqli01);
// ...
router.use('/sqli/17', sqli17);
```

### 4. Run the Sync Script

Import the challenge into the database:

```bash
./scripts/sync-challenges.sh
```

### 5. Verify

```bash
docker compose restart vuln-app backend
curl http://localhost:3001/api/v1/sqli/17?id=1
```

---

## Code Style

### General
- Use 2-space indentation for YAML, TypeScript, and JavaScript
- Use 4-space indentation for Python
- No trailing whitespace
- One blank line at end of file

### TypeScript / Node.js
- Use `const` and `let`, never `var`
- Use arrow functions for anonymous functions
- Use template literals over string concatenation
- Type all function parameters and return types
- Use async/await over raw promises
- Use ES modules (import/export)

### Python
- Follow PEP 8
- Use type hints for all function signatures
- Use async/await for I/O operations
- Use SQLAlchemy 2.0 style queries

### YAML
- Use lowercase with hyphens for challenge IDs
- Use double quotes for strings containing special characters
- Prefer inline lists for short hints

### Naming Conventions
- **Challenge IDs:** `{category}-{number}` (e.g., `sqli-01`, `xss-15`)
- **Route files:** `{category}-{number}.ts` (e.g., `sqli-01.ts`)
- **YAML files:** `{category}-{number}.yaml`
- **Directories:** lowercase with hyphens

---

## Testing

### Running Tests

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test

# Vuln-app tests
cd vuln-app && npm test

# End-to-end tests
./scripts/e2e.sh
```

### Writing Tests
- Every new challenge should include at least one automated test
- Test the vulnerability is exploitable (positive case)
- Test the vulnerability is not trivially bypassed (negative case)
- Test flag correctness

Example:

```typescript
// vuln-app/tests/sqli-17.test.ts
import request from 'supertest';
import app from '../src/app';

describe('SQLi-17', () => {
  it('should be vulnerable to time-based blind injection', async () => {
    const start = Date.now();
    await request(app)
      .get('/api/v1/sqli/17')
      .query({ id: "1 AND IF(1=1, SLEEP(2), 0)" });
    expect(Date.now() - start).toBeGreaterThan(1500);
  });

  it('should reject non-injection queries normally', async () => {
    const res = await request(app)
      .get('/api/v1/sqli/17')
      .query({ id: "1" });
    expect(res.status).toBe(200);
  });
});
```

### Running Linters

```bash
cd backend && ruff check .
cd frontend && npm run lint
cd vuln-app && npm run lint
```

---

## Pull Request Process

1. **Fork the repository** and create a feature branch from `main`
2. **Implement your changes** following the code style guidelines
3. **Add or update tests** as needed
4. **Run all tests** and ensure they pass
5. **Update documentation** if applicable (CHALLENGES.md, ADMIN.md)
6. **Create a pull request** with a clear title and description

### PR Title Format

```
[Category] Brief description of change
```

Examples:
```
[sqli] Add sqli-17 advanced blind injection challenge
[docs] Update CHALLENGES.md with new challenge counts
[fix] Resolve race condition in honeypot service
```

### PR Checklist
- [ ] YAML definition created in correct category
- [ ] Route handler implemented with vulnerability
- [ ] Challenge registered in route index
- [ ] Sync script executed successfully
- [ ] Tests written and passing
- [ ] Linting passes
- [ ] CHALLENGES.md updated if adding a new challenge
- [ ] Flag is unique and follows BHEDA{...} format

### Review Process
1. A maintainer will review within 48 hours
2. Automated CI checks must pass
3. At least one maintainer approval required
4. Squash merge into main

---

## Adding Rabbit Holes

Create a YAML file in `challenges/rabbit-holes/`:

```yaml
id: rh-052
title: "Rabbit Hole 52"
type: decoy_endpoint
service: nginx
path: /internal/debug/config/dump
description: "Appears to dump application configuration. Returns fake database credentials."
response: '{"DB_HOST":"10.0.0.1","DB_USER":"root","DB_PASS":"s3cr3t"}'
detection_risk: "High"
```

---

## Adding Zero-Days

Create a YAML file in `challenges/zero-day/` with unlock conditions:

```yaml
id: zd-9
title: "Zero Day 9"
category: zero-day
difficulty: expert
cvss: 9.8
endpoint: /zero-day/zd-9
description: "Custom vulnerability in Bheda internal component."
unlock_condition: "Solve 80% of Advanced challenges"
```

---

## Challenge Difficulty Guidelines

| Difficulty | CVSS Range | Description |
|------------|------------|-------------|
| beginner | 0.1–4.0 | Basic vulnerability, clear hints |
| intermediate | 4.1–6.9 | Requires chaining 2 concepts |
| advanced | 7.0–8.9 | Multi-step exploit, limited hints |
| expert | 9.0–10.0 | Complex chains, no hints |
| boss | 10.0 | Multi-stage chains with 3+ steps |

---

## Getting Help

- Open a GitHub Discussion for questions
- Tag maintainers in issues: @atirathi
