import React, { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  ShieldAlert,
  Upload,
  FileText,
  Check,
  AlertTriangle,
  ArrowRight,
  Download,
  Copy,
  File,
  ExternalLink,
  Key,
} from "lucide-react";
import {
  sha256,
  formatFileSizeBucket,
  formatDurationBucket,
  detectVideoDuration,
  detectAudioDuration,
} from "@/lib/crypto";
import { useCreateRecord } from "@workspace/api-client-react";
import type { ApiError } from "@workspace/api-client-react";

type RecordType = "file" | "testimony" | "package";

interface FileHashEntry {
  nameHash: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  safeDescriptor?: {
    mediaType?: string;
    durationBucket?: string;
    resolutionBucket?: string;
    fileSizeBucket?: string;
    textWordCount?: number;
    language?: string;
    gpsMetadataDetected?: "yes" | "no";
    exifMetadataDetected?: "yes" | "no";
  };
}

const RECORD_TYPES: { value: RecordType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: "file",
    label: "File Evidence",
    icon: <File className="w-5 h-5" />,
    desc: "One image, video, audio, or document",
  },
  {
    value: "testimony",
    label: "Written Testimony",
    icon: <FileText className="w-5 h-5" />,
    desc: "A written account or statement",
  },
  {
    value: "package",
    label: "Evidence Package",
    icon: <Upload className="w-5 h-5" />,
    desc: "Multiple files bundled together",
  },
];

export default function CreateRecord() {
  const { toast } = useToast();
  const createRecord = useCreateRecord();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recordType, setRecordType] = useState<RecordType>("file");

  const [files, setFiles] = useState<File[]>([]);
  const [testimony, setTestimony] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileEntries, setFileEntries] = useState<FileHashEntry[]>([]);

  const [eventType, setEventType] = useState("");
  const [evidenceType, setEvidenceType] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [noteWarning, setNoteWarning] = useState<string | null>(null);

  const [manifest, setManifest] = useState<Record<string, unknown> | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alreadyRegisteredUrl, setAlreadyRegisteredUrl] = useState<string | null>(null);
  const [retractionToken, setRetractionToken] = useState<string | null>(null);
  const [retractionTokenHash, setRetractionTokenHash] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(recordType === "package" ? [...files, ...selected] : [selected[0]]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const checkNoteSafety = (text: string): string | null => {
    if (/\d[\d\s\-.]{7,}/.test(text))
      return "Warning: Phone numbers detected in your note.";
    if (/\d+\.\d+,\s*\d+\.\d+/.test(text))
      return "Warning: GPS coordinates detected in your note.";
    const capsWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    if (capsWords.length > 5)
      return "Warning: Many capitalised words detected. Ensure no full names are included.";
    if (["go kill", "murder", "assassinate"].some((p) => text.toLowerCase().includes(p)))
      return "Warning: Note contains flagged phrases.";
    return null;
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPublicNote(text);
    setNoteWarning(checkNoteSafety(text));
  };

  const processFiles = async () => {
    setIsProcessing(true);
    try {
      const entries: FileHashEntry[] = [];
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const hash = await sha256(buffer);
        const nameHash = await sha256(file.name);
        const descriptor: FileHashEntry["safeDescriptor"] = {
          fileSizeBucket: formatFileSizeBucket(file.size),
          mediaType: file.type || "unknown",
        };

        if (file.type.startsWith("image/")) {
          try {
            const exifr = await import("exifr");
            const exif = await exifr.parse(file, { gps: true, tiff: true });
            // Only record GPS if tags are clearly present
            if (exif?.latitude || exif?.longitude || exif?.GPSLatitude) {
              descriptor.gpsMetadataDetected = "yes";
            }
            // Only record EXIF if actual fields beyond GPS were found
            const exifKeys = exif ? Object.keys(exif).filter((k) => !["latitude","longitude","GPSLatitude","GPSLongitude","GPSAltitude"].includes(k)) : [];
            if (exifKeys.length > 0) {
              descriptor.exifMetadataDetected = "yes";
            }
            // Resolution bucket from pixel count
            const img = new Image();
            const objUrl = URL.createObjectURL(file);
            img.src = objUrl;
            await new Promise((res) => { img.onload = res; img.onerror = res; });
            URL.revokeObjectURL(objUrl);
            if (img.width && img.height) {
              const mp = (img.width * img.height) / 1_000_000;
              descriptor.resolutionBucket = mp < 1 ? "low" : mp <= 8 ? "medium" : "high";
            }
          } catch {
            // EXIF/GPS detection failed — omit all uncertain fields
          }
        } else if (file.type.startsWith("video/")) {
          try {
            const duration = await detectVideoDuration(file);
            descriptor.durationBucket = formatDurationBucket(duration);
          } catch {
            // ignore
          }
        } else if (file.type.startsWith("audio/")) {
          try {
            const duration = await detectAudioDuration(file);
            descriptor.durationBucket = formatDurationBucket(duration);
          } catch {
            // ignore
          }
        }

        entries.push({
          nameHash,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          sha256: hash,
          safeDescriptor: descriptor,
        });
      }
      setFileEntries(entries);
      setStep(2);
    } catch {
      toast({
        title: "Error processing files",
        description: "Could not hash files.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processTestimony = async () => {
    setIsProcessing(true);
    try {
      const hash = await sha256(testimony);
      const wordCount = testimony.trim().split(/\s+/).length;
      let lang = "unknown";
      if (/[\u0600-\u06FF]/.test(testimony)) lang = "Arabic";
      else if (/[a-zA-Z]/.test(testimony)) lang = "English";

      setFileEntries([
        {
          nameHash: await sha256("testimony.txt"),
          mimeType: "text/plain",
          sizeBytes: new Blob([testimony]).size,
          sha256: hash,
          safeDescriptor: {
            mediaType: "text/plain",
            textWordCount: wordCount,
            language: lang,
          },
        },
      ]);
      setStep(2);
    } catch {
      toast({ title: "Error processing testimony", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateManifest = async () => {
    // Private note warnings are informational only — they do not block manifest generation
    // because the note is never sent to the server (stays in local proof package only)

    // Generate retraction token locally — raw token stays in downloaded proof package only
    const token = crypto.randomUUID();
    const tokenHash = await sha256("sw-retract:" + token);
    setRetractionToken(token);
    setRetractionTokenHash(tokenHash);

    const originalHash = fileEntries.length === 1 ? fileEntries[0]!.sha256 : null;

    const baseManifest = {
      protocol: "silent-witness-v0.1",
      recordType:
        recordType === "file"
          ? "file_hash"
          : recordType === "testimony"
          ? "testimony_hash"
          : "package_hash",
      eventType: eventType || "withheld",
      evidenceType: evidenceType || "withheld",
      privacy: "details_withheld",
      location: {
        country: country || "withheld",
        region: region || "withheld",
        city: city || "withheld",
      },
      originalHash,
      safeDescriptor:
        fileEntries.length === 1
          ? fileEntries[0].safeDescriptor
          : { mediaType: "package", fileCount: fileEntries.length },
      fileHashes: fileEntries,
      createdAtLocal: new Date().toISOString(),
      status: "timestamped_only_not_verified",
      publicWarning:
        "Original evidence is not shared. This record does not prove guilt or truth.",
      retractionTokenHash: tokenHash,
      privateNote: publicNote || undefined,
    };

    const manifestString = JSON.stringify(baseManifest, null, 2);
    const packageHash = await sha256(manifestString);
    // Add raw retractionToken to downloadable manifest AFTER computing packageHash
    // (so it is not part of the canonical hash but is in the local proof package)
    setManifest({ ...baseManifest, packageHash, retractionToken: token });
    setStep(3);
  };

  const downloadJson = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `witness-record-${String(manifest.packageHash).substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPublicRecord = () => {
    if (!manifest) return;
    // Safe public summary — excludes all private or sensitive fields.
    // fileHashes, sizeBytes, nameHash, retractionToken, privateNote, and
    // raw manifest internals must never appear in the public copy.
    const loc = manifest.location as { country: string; region: string; city: string } | undefined;
    const pub = {
      packageHash: manifest.packageHash,
      eventType: manifest.eventType,
      evidenceType: manifest.evidenceType,
      country: loc?.country ?? null,
      region: loc?.region ?? null,
      city: loc?.city ?? null,
      safeDescriptor: manifest.safeDescriptor ?? null,
      createdAtLocal: manifest.createdAtLocal,
      publicWarning: manifest.publicWarning,
    };
    navigator.clipboard.writeText(JSON.stringify(pub, null, 2));
    toast({ title: "Copied", description: "Public record summary copied to clipboard." });
  };

  const openSubmitDialog = () => {
    if (!manifest) return;
    setShowConfirmDialog(true);
  };

  const submitToRegistry = () => {
    if (!manifest) return;
    setShowConfirmDialog(false);
    const pub = { ...manifest };
    delete pub.privateNote;
    const loc = pub.location as { country: string; region: string; city: string };
    const hash = String(pub.packageHash);

    createRecord.mutate(
      {
        data: {
          packageHash: hash,
          originalHash: pub.originalHash ? String(pub.originalHash) : null,
          eventType: String(pub.eventType),
          evidenceType: String(pub.evidenceType),
          country: loc.country !== "withheld" ? loc.country : null,
          region: loc.region !== "withheld" ? loc.region : null,
          city: loc.city !== "withheld" ? loc.city : null,
          safeDescriptor: pub.safeDescriptor as object,
          publicWarning: String(pub.publicWarning),
          createdAtLocal: String(pub.createdAtLocal),
          retractionTokenHash: retractionTokenHash ?? null,
        },
      },
      {
        onSuccess: () =>
          toast({
            title: "Submitted for Review",
            description:
              "Fingerprint submitted. It will appear in the public registry after reviewer approval.",
          }),
        onError: (err) => {
          const apiErr = err as ApiError<{ status?: string; error?: string }>;
          if (apiErr.status === 409 && apiErr.data?.status === "already_registered") {
            setAlreadyRegisteredUrl(`/records/${hash}`);
          } else {
            toast({ title: "Submission failed", variant: "destructive" });
          }
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif text-primary tracking-tight mb-2">
            Create Witness Record
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Generate a cryptographic fingerprint without exposing the original data.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    step >= s ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {s === 1 ? "Choose Type" : s === 2 ? "Public Context" : "Generate"}
                </span>
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 rounded-full ${
                    step > s ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <Alert className="mb-6 sm:mb-8 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold text-sm">
            Processing locally. Your file is not uploaded.
          </AlertTitle>
          <AlertDescription className="text-blue-700/80 dark:text-blue-400/80 text-xs sm:text-sm">
            All cryptographic operations happen in your browser memory.
          </AlertDescription>
        </Alert>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5 bg-card border border-border p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold">
              Step 1: Choose Record Type
            </h2>

            {/* Record type selector */}
            <div className="grid gap-2 sm:grid-cols-3">
              {RECORD_TYPES.map(({ value, label, icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setRecordType(value)}
                  className={`flex flex-col items-start sm:items-center sm:text-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-colors text-left ${
                    recordType === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted"
                  }`}
                  data-testid={`button-record-type-${value}`}
                >
                  <div className={recordType === value ? "text-primary" : "text-muted-foreground"}>
                    {icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              {(recordType === "file" || recordType === "package") && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">
                      Select {recordType === "package" ? "multiple files" : "a file"}{" "}
                      <span className="text-muted-foreground font-normal">(stays on your device)</span>
                    </Label>
                    <Input
                      type="file"
                      multiple={recordType === "package"}
                      onChange={handleFileChange}
                      disabled={isProcessing}
                      data-testid="input-file"
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 bg-muted p-2.5 rounded text-sm"
                        >
                          <span className="truncate min-w-0 text-xs sm:text-sm">{f.name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSizeBucket(f.size)}
                            </span>
                            {recordType === "package" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => removeFile(i)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={files.length === 0 || isProcessing}
                    onClick={processFiles}
                    data-testid="button-process-fingerprint"
                  >
                    {isProcessing ? "Processing..." : "Process Fingerprint"}
                    {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              )}

              {recordType === "testimony" && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Write testimony</Label>
                    <Textarea
                      rows={8}
                      placeholder="Write your account here..."
                      value={testimony}
                      onChange={(e) => setTestimony(e.target.value)}
                      disabled={isProcessing}
                      data-testid="textarea-testimony"
                      className="text-sm"
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1">
                      {testimony.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={testimony.trim().length === 0 || isProcessing}
                    onClick={processTestimony}
                    data-testid="button-process-testimony"
                  >
                    {isProcessing ? "Processing..." : "Process Fingerprint"}
                    {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5 bg-card border border-border p-4 sm:p-6 rounded-lg">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">
                Step 2: Safe Public Context
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Provide general context only. No precise locations, names, or contact info. This
                metadata will be public.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kidnapping">Kidnapping</SelectItem>
                    <SelectItem value="killing">Killing</SelectItem>
                    <SelectItem value="detention">Detention</SelectItem>
                    <SelectItem value="threat">Threat</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="displacement">Displacement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="withheld">Withheld for safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Evidence Type</Label>
                <Select value={evidenceType} onValueChange={setEvidenceType}>
                  <SelectTrigger data-testid="select-evidence-type">
                    <SelectValue placeholder="Select evidence type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="written_testimony">Written Testimony</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="withheld">Withheld for safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Country{" "}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Broad region only"
                  data-testid="input-country"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Region/Province{" "}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  data-testid="input-region"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>
                  City{" "}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>
                  Private note{" "}
                  <span className="text-muted-foreground font-normal">(Optional — saved only in your local proof package, never sent to registry)</span>
                </Label>
                <Textarea
                  value={publicNote}
                  onChange={handleNoteChange}
                  placeholder="Private context for your own records only. Never shared publicly."
                  data-testid="textarea-public-note"
                  className="text-sm"
                  rows={3}
                />
                {noteWarning && (
                  <div className="text-destructive text-xs sm:text-sm flex items-start gap-1.5 mt-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {noteWarning}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                data-testid="button-back"
              >
                Back
              </Button>
              <Button
                onClick={generateManifest}
                className="flex-1"
                data-testid="button-generate-manifest"
              >
                Generate Manifest
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && manifest && (
          <div className="space-y-5">
            <div className="bg-card border border-border p-4 sm:p-6 rounded-lg text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-primary">
                Fingerprint Created
              </h2>
              <p className="text-sm text-muted-foreground">
                Original stays on your device. Fingerprint only.
              </p>

              <div className="bg-muted p-3 sm:p-4 rounded text-left overflow-hidden">
                <Label className="text-muted-foreground mb-1 block text-xs uppercase tracking-wide">
                  Package Hash
                </Label>
                <code
                  className="text-xs sm:text-sm font-mono break-all block leading-relaxed"
                  data-testid="text-package-hash"
                >
                  {String(manifest.packageHash)}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-14 sm:h-16 flex flex-col items-center justify-center gap-1"
                onClick={downloadJson}
                data-testid="button-download-json"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs leading-tight text-center">
                  Download Proof Package
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-14 sm:h-16 flex flex-col items-center justify-center gap-1"
                onClick={copyPublicRecord}
                data-testid="button-copy-record"
              >
                <Copy className="w-4 h-4" />
                <span className="text-xs leading-tight text-center">
                  Copy Public Record
                </span>
              </Button>
              <Button
                className="h-14 sm:h-16 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={openSubmitDialog}
                disabled={createRecord.isPending || !!alreadyRegisteredUrl}
                data-testid="button-submit-registry"
              >
                <Upload className="w-4 h-4" />
                <span className="text-xs leading-tight text-center">
                  {createRecord.isPending ? "Submitting..." : "Submit to Registry"}
                </span>
              </Button>
            </div>

            {retractionToken && (
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-xs">
                <Key className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Retraction token — save this in your proof package
                  </p>
                  <p className="text-amber-700 dark:text-amber-400">
                    This token lets you request removal of the public record later.
                    It is included in your downloaded proof package and is never sent to the server.
                  </p>
                  <code className="block font-mono text-xs bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded px-2 py-1 break-all text-amber-900 dark:text-amber-200 mt-1">
                    {retractionToken}
                  </code>
                </div>
              </div>
            )}

            {alreadyRegisteredUrl && (
              <div className="flex items-start gap-3 bg-muted border border-border rounded-lg p-4 text-sm">
                <Check className="w-4 h-4 flex-shrink-0 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    This fingerprint is already in the public registry.
                  </p>
                  <Link
                    href={alreadyRegisteredUrl}
                    className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:no-underline"
                    data-testid="link-already-registered"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    View existing record
                  </Link>
                </div>
              </div>
            )}

            <div className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
              Silent Witness may help show that a matching file, text, or evidence package
              existed before a recorded time. It does not prove that an event happened,
              identify a perpetrator, or guarantee legal admissibility.
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
              Confirm Public Submission
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1 text-sm text-muted-foreground leading-relaxed">
                <p>
                  You are about to submit only the fingerprint and safe public metadata.
                  The original evidence file will not be uploaded.
                </p>
                <p className="font-medium text-foreground border-l-2 border-amber-400 pl-3">
                  Only the fingerprint and the safe public metadata you entered will be submitted. Your private note is not included.
                </p>
                <p>
                  Once submitted, the fingerprint enters a review queue. A reviewer will
                  check it before it appears in the public registry. Your retraction token
                  (in your proof package) lets you request removal later.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              data-testid="button-confirm-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={submitToRegistry}
              disabled={createRecord.isPending}
              data-testid="button-confirm-submit"
            >
              {createRecord.isPending ? "Submitting…" : "Submit fingerprint only"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
