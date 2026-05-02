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
| `serverReceivedAtUtc` | Server clock at the time of POST | **Authoritative.** The registry received the fingerprint by this time. Cannot be set or overridden by the client. |
| `approvedAtUtc` | Server clock when reviewer approves | **Authoritative.** Set by the server only. |

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
| `gpsMetadataDetected` | `"yes"` only if GPS tags clearly present | Only if confirmed |
| `exifMetadataDetected` | `"yes"` only if EXIF fields clearly present | Only if confirmed |

Fields that are NOT stored: exact GPS coordinates, device model, manufacturer, serial number, codec, frame rate, exact capture time, or any field that could identify the device or its user.

---

## Publication Status

| Status | Visible publicly | Description |
|---|---|---|
| `pending_review` | No | Submitted, awaiting reviewer |
| `public_timestamped_record` | Yes | Approved by reviewer |
| `rejected_for_public_registry` | No | Rejected or hidden |
| `retracted_by_holder` | No | Holder used retraction token |
| `exact_match_published` | Yes | Later file verified as byte-for-byte identical |

---

## Review Process

1. User submits fingerprint → server sets `publication_status = pending_review`
2. Reviewer accesses `/admin/review` with the admin password
3. Reviewer sees only fingerprints and safe metadata — no original files exist
4. Reviewer approves, rejects (with reason), or hides the record
5. All reviewer actions are logged to the `review_actions` table

**Reviewer approval is a safety review only.** It is not an authentication of the event or the file's content.

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

The server computes `sha256("sw-retract:" + token)` and compares it with the stored hash using a timing-safe comparison.

---

## Quality Levels

| Level | Criteria |
|---|---|
| A | Known event type + known evidence type + has descriptor |
| B | Known evidence type or known event type + has descriptor |
| C | Both withheld but has a safe descriptor |
| D | No meaningful descriptor or both withheld with no context — **rejected from public registry** |

---

## Limitations

- A deleted file cannot be recovered from its hash.
- `createdAtLocal` comes from the user's device clock and is not independently verified.
- Exact matching requires the byte-for-byte original file, not a compressed or re-encoded copy.
- The tool does not prove events, guilt, or legal admissibility.
- The public registry shows only records approved by a human reviewer.
