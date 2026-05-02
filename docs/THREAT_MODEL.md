# Silent Witness Threat Model

This document describes what Silent Witness protects against, what it does not protect against, and the assumptions behind its design.

---

## Protected Users

- Witnesses documenting events in conflict zones or high-risk environments
- Journalists preserving evidence before publication
- Local observers who cannot safely upload files to public platforms
- Documentation teams building timestamped archives of evidence

---

## Core Assumption

The browser is trusted. The server is partially trusted. The network is not trusted.

---

## What the Tool Protects Against

### 1. Retroactive denial of evidence existence

**Threat:** An actor claims that evidence was fabricated or edited after an event.

**Mitigation:** The `serverReceivedAtUtc` timestamp proves the fingerprint was submitted to the registry by that time. If the original file is later presented and its SHA-256 matches, the record supports a claim that the file existed before that timestamp.

---

### 2. Dangerous publication of original files

**Threat:** Publishing an original image or video exposes faces, GPS metadata, or identifying information that endangers the witness, victim, or their family.

**Mitigation:** Silent Witness never receives or stores the original file. Only a SHA-256 fingerprint and limited safe metadata are submitted.

---

### 3. Accidental metadata leakage in submissions

**Threat:** A user accidentally includes a phone number, GPS coordinate, or full name in submitted metadata.

**Mitigation:** Server-side validation rejects fields containing phone numbers, GPS coordinate patterns, and violent or inciting language. Public note maximum is 200 characters.

---

### 4. Spam or fabricated records polluting the registry

**Threat:** A bad actor submits large volumes of fake records to discredit the registry.

**Mitigation:** All records enter `pending_review` before appearing publicly. Rate limiting (10 submissions/IP/hour) and honeypot field reduce automated spam. Quality D records are rejected outright.

---

### 5. Unauthorized public record modification

**Threat:** Someone removes or modifies a public record without the holder's consent.

**Mitigation:** Records can only be retracted by the holder using the retraction token generated at proof package creation. The server stores only the SHA-256 of the token; the raw token is never transmitted after creation.

---

## What the Tool Does NOT Protect Against

### 1. Compromised server

**Risk:** If the server or database is fully compromised, an attacker could see pending record metadata, including event type, evidence type, and country, for records that have not yet been approved.

**Mitigation in design:** Original files are never stored. The worst-case leak is pending metadata (not files, not exact locations, not names).

---

### 2. Coerced or malicious reviewer

**Risk:** A reviewer with the admin password can see all pending records before approval. A malicious reviewer could leak metadata or approve unsafe records.

**Mitigation in design:** All reviewer actions are logged. Reviewer approval is a safety review, not an authentication step.

---

### 3. Network-level interception of the submission

**Risk:** An adversary who monitors network traffic could see the submission request, which includes the fingerprint hash and safe metadata (but not the original file).

**Mitigation in design:** HTTPS in production. The submission contains no original file or identifying information beyond what the user explicitly submits.

---

### 4. Unsafe metadata submitted by the user

**Risk:** A user who submits a precise city name, a recognizable event description, or other identifying context can inadvertently expose themselves.

**Mitigation in design:** The tool warns users to use general context only and provides "withheld" options. Server-side validation catches some unsafe patterns, but cannot catch all user-supplied context.

---

### 5. Device seizure before download

**Risk:** If the user's device is seized before they download the proof package, the retraction token is lost.

**Mitigation in design:** None. Users must download and securely store the proof package immediately.

---

### 6. Browser or device compromise

**Risk:** Malware on the device could intercept the file before or during hashing, or exfiltrate the proof package.

**Mitigation in design:** Silent Witness cannot protect against a compromised browser or device. Users in high-risk environments should use a trusted device.

---

### 7. Compression-broken verification

**Risk:** If the original file was sent through a platform that recompresses media, the SHA-256 of the platform copy will not match the registered hash.

**Mitigation in design:** The verification page shows a clear compression warning when no match is found. Users should preserve the original file, not a platform-downloaded copy.

---

## Metadata Risks

Even without original files, the following metadata in a submission could carry risk:

- **Country + event type combination** — in some contexts this is enough to narrow down an event
- **`createdAtLocal` timestamp** — could place the user near an event at a specific time
- **Evidence type + duration bucket** — narrows down what kind of media was recorded
- **Region or city field** — broad but potentially identifying in small conflict areas

**Recommendation for high-risk users:** Use "withheld" for location fields. Use general event types. Do not include timestamps if the timing itself is sensitive.

---

## Operational Recommendations

For users in high-risk environments:

1. Use the tool on a device not linked to your identity.
2. Use a VPN or Tor before submitting to the public registry.
3. Download and store the proof package in a secure encrypted location immediately.
4. Do not store the proof package on the same device used for submission.
5. Do not share the retraction token.
6. Use "withheld" for location fields if precise location is sensitive.
7. Consider whether the event type and evidence type alone could identify you.

For organizations deploying a self-hosted instance:

1. Keep the admin password long, random, and known to as few people as possible.
2. Rotate the admin password if a reviewer leaves.
3. Use IP allowlisting for the admin endpoint in production.
4. Review pending records promptly to minimize the window during which metadata is accessible to a compromised server.
5. Consider external security review before deploying for high-risk use cases.

---

## Server Compromise Assumptions

If the server is fully compromised, an attacker can access:
- All pending, approved, rejected, and retracted record metadata
- Retraction token hashes (not raw tokens)
- Review action logs

An attacker **cannot** access:
- Original files (never stored)
- Raw retraction tokens (never stored server-side)
- Private notes (never sent to server)
- IP addresses (only truncated salted hashes used for rate limiting)
- File content of any kind
