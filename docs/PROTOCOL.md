# Silent Witness Protocol v0.1

This document describes the technical protocol used by Silent Witness to create, store, and verify evidence fingerprints.

---

## Purpose

Silent Witness creates a verifiable record that a specific file or testimony existed at a recorded time, without ever uploading the original content. It does not prove authenticity, guilt, or legal admissibility.

---

## Record Types

| Type | `recordType` value | Description |
|---|---|---|
| Single file | `file_hash` | One image, video, audio, or document |
| Written testimony | `testimony_hash` | Text written directly in the browser |
| Evidence package | `package_hash` | Multiple files bundled together |

---

## Manifest Structure

The canonical proof package manifest is a JSON object with the following fields:

```json
{
  "protocol": "silent-witness-v0.1",
  "recordType": "file_hash",
  "eventType": "killing",
  "evidenceType": "video",
  "privacy": "details_withheld",
  "location": {
    "country": "Syria",
    "region": "Aleppo",
    "city": "withheld"
  },
  "originalHash": "<sha256 of original file>",
  "safeDescriptor": {
    "mediaType": "video/mp4",
    "fileSizeBucket": "100MB+",
    "durationBucket": "1-5min"
  },
  "fileHashes": [
    {
      "nameHash": "<sha256 of filename>",
      "mimeType": "video/mp4",
      "sizeBytes": 157286400,
      "sha256": "<sha256 of file content>"
    }
  ],
  "createdAtLocal": "2026-01-15T14:32:00.000Z",
  "status": "timestamped_only_not_verified",
  "publicWarning": "Original evidence is not shared. This record does not prove guilt or truth.",
  "retractionTokenHash": "<sha256 of retraction token>",
  "privateNote": "optional private note — never sent to server",
  "packageHash": "<sha256 of this manifest without retractionToken and privateNote>",
  "retractionToken": "<raw UUID — only in local download, never sent to server>"
}
```

### packageHash Computation

The `packageHash` is the SHA-256 of the canonical manifest JSON string, computed **before** adding `retractionToken` (raw) to the downloadable file. The retraction token is appended after the hash is computed so it does not affect the hash.

---

## Timestamps

| Field | Source | Trust level |
|---|---|---|
| `createdAtLocal` | User's browser clock | **Not independently verified.** Comes from the device. Displayed with a warning to viewers. |
| `serverReceivedAtUtc` | Server clock at the time of POST | **Server-recorded registry timestamp.** Proves only that the registry received the fingerprint by this server time. Cannot be set or overridden by the client. |

---

## Safe Descriptor

Only metadata fields that can be extracted with confidence are stored. Uncertain fields are omitted entirely.

| Field | Description | Stored? |
|---|---|---|
| `mediaType` | MIME type | Yes, if known |
| `fileSizeBucket` | Size range, not exact | Yes |
| `durationBucket` | Duration range (video/audio) | Only if reliably detected |
| `resolutionBucket` | `low` / `medium` / `high` by megapixel count | Only if reliably detected |
| `textWordCount` | Word count (testimony) | Yes |
| `language` | `Arabic` / `English` / `unknown` | Yes |
| `gpsMetadataDetected` | Stored only as `"yes"` if GPS tags clearly detected; otherwise omitted entirely | Only if confirmed |
| `exifMetadataDetected` | Stored only as `"yes"` if EXIF fields clearly detected; otherwise omitted entirely | Only if confirmed |

Fields that are NOT stored: exact GPS coordinates, device model, manufacturer, serial number, codec, frame rate, exact capture time, or any field that could identify the device or its user.

---

## Publication Status

| Status | Visible publicly | Description |
|---|---|---|
| `accepted_public` | Yes | Passed all automatic policy checks — immediately visible in registry |
| `rejected_by_policy` | No | Failed safety or quality checks — never stored or shown publicly |
| `retracted_by_holder` | No | Holder used retraction token to remove record |
| `exact_match_published` | Yes | A later file was verified as byte-for-byte identical |

---

## Automatic Publication Process

Records are published automatically on submission with no human review step:

1. Client submits fingerprint → server validates format and runs policy checks
2. **Policy checks:** quality level (must be A/B/C), location field safety (no PII patterns), rate limit (10/IP/hour), duplicate detection
3. **Pass:** `publication_status = accepted_public` — immediately visible in public registry
4. **Fail:** HTTP 400 with `status: rejected_by_policy` and a reason — record is not stored

There is no manual reviewer, no admin dashboard, and no pending state.

---

## Verification Process

1. User visits `/verify`
2. User selects their original local file (it is not uploaded)
3. Browser recomputes SHA-256 locally
4. The hash is looked up in the registry
5. If a match is found, the record metadata is shown
6. If no match is found, a compression warning is shown

### Compression Warning

Files sent through messaging platforms or social media are often recompressed, changing their SHA-256. A non-matching hash does not mean the file is fake.

---

## Retraction Token

When a user creates a proof package:

1. A UUID is generated locally in the browser
2. The SHA-256 of `"sw-retract:" + token` is computed
3. Only the hash is sent to the server and stored
4. The raw UUID token is placed in the downloaded proof package only

To retract a public record:
```
POST /api/retract
{ "packageHash": "...", "retractionToken": "<raw UUID from proof package>" }
```

The server computes `sha256("sw-retract:" + token)` and compares it with the stored hash using a timing-safe comparison (`crypto.timingSafeEqual`). Retraction attempts are rate-limited to 5 per package hash per 15 minutes.

---

## Quality Levels

| Level | Criteria |
|---|---|
| A | Known event type + known evidence type + has descriptor |
| B | Known evidence type or known event type + has descriptor |
| C | Both withheld but has a safe descriptor |
| D | No meaningful descriptor or both withheld with no context — **automatically rejected** |

---

## Limitations

- A deleted file cannot be recovered from its hash.
- `createdAtLocal` comes from the user's device clock and is not independently verified.
- Exact matching requires the byte-for-byte original file, not a compressed or re-encoded copy.
- The tool does not prove events, guilt, or legal admissibility.
- The public registry shows only records that passed automatic policy checks. No human authentication is performed.
