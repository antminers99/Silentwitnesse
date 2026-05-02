import React from "react";
import { Layout } from "@/components/layout";
import { FileText, ShieldAlert } from "lucide-react";

export default function Protocol() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-serif text-primary tracking-tight mb-4 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Silent Witness Protocol
          </h1>
          <p className="text-lg text-muted-foreground">Version 0.1 Draft Specifications</p>
        </div>

        <div className="prose prose-slate max-w-none text-foreground prose-headings:font-serif prose-headings:text-primary">
          <div className="bg-muted border-l-4 border-destructive p-6 mb-8 text-sm">
            <h4 className="flex items-center gap-2 text-destructive mt-0 mb-2 font-semibold">
              <ShieldAlert className="w-5 h-5" />
              Important Warning
            </h4>
            <p className="mb-0 text-muted-foreground">
              Silent Witness does not prove that an event happened. It proves only that a matching file, text, or evidence package existed before a recorded time, if the original is later provided.
            </p>
          </div>

          <h2>What Silent Witness is</h2>
          <p>
            Silent Witness is a cryptographic timestamping mechanism designed to allow individuals in high-risk situations to create an indisputable record of digital evidence without transmitting the actual evidence across a network or storing it on third-party servers.
          </p>

          <h2>What problem it solves</h2>
          <p>
            Uploading sensitive videos, images, or testimonies often puts the uploader at immediate physical or legal risk. However, holding onto the evidence without establishing a timeline can lead to accusations of fabrication after the fact. Silent Witness bridges this gap by proving possession of the data at a specific time without revealing the data itself.
          </p>

          <h2>Design principles</h2>
          <ul>
            <li><strong>Local First:</strong> The evidence never leaves the device. All processing occurs in the browser memory.</li>
            <li><strong>Cryptographic Certainty:</strong> Uses standard SHA-256 hashing to ensure any modification to the original file will result in a completely different fingerprint.</li>
            <li><strong>Minimal Disclosure:</strong> Public records contain only safe metadata (e.g., file sizes, approximate locations, general event types) to protect the identity and exact location of the witness.</li>
          </ul>

          <h2>What a witness record contains</h2>
          <p>
            A witness record (or manifest) is a JSON document containing:
          </p>
          <ul>
            <li>Protocol version identifiers.</li>
            <li>The cryptographic hashes of one or more files.</li>
            <li>A top-level package hash representing the entire manifest.</li>
            <li>Safe descriptor metadata (e.g., duration buckets, size buckets, whether GPS data exists).</li>
            <li>A generalized public context (Country, Region, Event Type).</li>
          </ul>

          <h2>What it proves</h2>
          <p>
            It proves that a specific arrangement of bytes (the digital file) existed on or before the time the fingerprint was submitted to the registry. If someone later presents a file that generates the exact same hash, it is mathematically certain they are the same file.
          </p>

          <h2>What it does not prove</h2>
          <p>
            It does not prove the contents of the file are true, unedited prior to hashing, or correctly described. It only proves the existence of the file at the timestamped moment.
          </p>

          <h2>Privacy rules</h2>
          <p>
            Witnesses are instructed to withhold details that could identify them or the subjects of the evidence unless they intend to publish it fully. Public notes must not contain phone numbers, exact addresses, or full names.
          </p>

          <h2>Geographic safety rules</h2>
          <p>
            Coordinates are intentionally stripped. The system detects if GPS metadata exists but only records a boolean flag ("present") rather than the coordinates themselves.
          </p>

          <h2>Spam and false-claim handling</h2>
          <p>
            Because the registry accepts unverified hashes, spam is possible. The registry relies on investigative journalists and human rights organizations to maintain secondary verified lists of hashes that correspond to actual verified events.
          </p>

          <h2>Safe evidence descriptor</h2>
          <p>
            To assist researchers in matching later leaked files with earlier fingerprints, the protocol attaches bucketed metadata (e.g., "Video, 1-5min, medium file size"). This makes it easier to correlate without revealing too much.
          </p>

          <h2>Verification process</h2>
          <p>
            An investigator holding a raw file can run it through the Verification tool to generate its local hash and compare it against the public registry hashes to find a match.
          </p>

          <h2>Public wording rules</h2>
          <p>
            When citing Silent Witness records, the following terminology must be used:
          </p>
          <ul>
            <li><strong>Use:</strong> "Timestamped fingerprint", "Original evidence not published", "Not publicly verified", "Can be checked later if the original is provided".</li>
            <li><strong>Do not use:</strong> "Verified kidnapping", "Proven crime", "Authenticated by Silent Witness".</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
