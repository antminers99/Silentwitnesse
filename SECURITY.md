# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Silent Witness, **do not open a public GitHub issue**.

Vulnerabilities that could expose witnesses, users, private metadata, retraction tokens, or unpublished records must be reported privately.

**Security contact:** Use [GitHub Security Advisories](https://github.com/antminers99/Silentwitnesse/security/advisories/new) to report vulnerabilities privately.

Please include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact (what could an attacker do?)
- Your suggested fix (optional)

We will acknowledge your report within 72 hours and aim to resolve confirmed issues within 14 days.

---

## What Not to Submit Publicly

Do not open public issues for:
- Exposure of rejected or retracted record metadata
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

2. **No persistent session tracking.** Retraction token brute-force protection is in-memory and resets on server restart.

3. **`createdAtLocal` is not trusted.** It comes from the user's device clock and is displayed with a warning. The server-recorded registry timestamp is `serverReceivedAtUtc`. It proves only that the registry received the fingerprint by that server time.

4. **Server compromise.** If the database or server is fully compromised, record metadata could be exposed. Original files are never stored, so original evidence cannot be leaked from the server.

5. **Automatic policy, not human review.** Records pass or fail safety checks automatically. A sophisticated attacker who understands the policy rules may be able to craft inputs that pass checks despite being unsafe. Future versions will add additional layers.

---

## Scope

In scope for vulnerability reports:
- API endpoints that expose non-public record metadata
- Retraction token bypass or extraction
- Injection vulnerabilities
- CORS misconfiguration allowing cross-origin data access
- Safety policy bypass (submitting records that should be rejected but are not)
- Any finding that could endanger a witness or expose private data

Out of scope:
- Denial of service attacks
- Social engineering
- Physical access attacks
- Theoretical attacks with no practical exploit path
