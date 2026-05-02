# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Silent Witness, **do not open a public GitHub issue**.

Vulnerabilities that could expose witnesses, users, private metadata, retraction tokens, or unpublished records must be reported privately.

**Security contact:** [add contact email]

Please include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact (what could an attacker do?)
- Your suggested fix (optional)

We will acknowledge your report within 72 hours and aim to resolve confirmed issues within 14 days.

---

## What Not to Submit Publicly

Do not open public issues for:
- Authentication bypass or admin access vulnerabilities
- Exposure of pending, rejected, or retracted record metadata
- Retraction token extraction or bypass
- Server-side injection vulnerabilities
- Any finding that could be used to identify or endanger a witness

---

## Sensitive Data Warning

This tool is used by people in high-risk situations. A vulnerability that exposes metadata — even without original files — could endanger users. Please treat all security reports with appropriate care and discretion.

Do not include real evidence, real metadata, or real personal information in any issue or pull request.

---

## Current Security Limitations

These are known limitations of the current MVP. They are documented here for transparency, not as an invitation to exploit them.

1. **Rate limiting is in-memory.** It resets on server restart. This makes it easier to submit spam records after a restart.

2. **Admin authentication is a single shared password with brute-force protection.** It is not a session-based or hardware-backed credential. IP-based lockout is in memory.

3. **Reviewer trust.** A reviewer with the admin password can see pending record metadata before public approval. This is by design (review is required before publication) but requires trusting the reviewer.

4. **Server compromise.** If the database or server is fully compromised, pending record metadata could be exposed. Original files are never stored, so original evidence cannot be leaked from the server.

5. **`createdAtLocal` is not trusted.** It comes from the user's device clock and is displayed with a warning. The authoritative timestamp is `serverReceivedAtUtc`.

---

## Scope

In scope for vulnerability reports:
- API endpoints that expose non-public record metadata
- Authentication bypass
- Injection vulnerabilities
- CORS misconfiguration allowing cross-origin data access
- Any finding that could endanger a witness or expose private data

Out of scope:
- Denial of service attacks
- Social engineering
- Physical access attacks
- Theoretical attacks with no practical exploit path
