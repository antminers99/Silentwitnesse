import React, { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, FileWarning, Upload, FileText, Check, AlertTriangle, ArrowRight, Download, Copy, Share2 } from "lucide-react";
import { sha256, formatFileSizeBucket, formatDurationBucket, detectVideoDuration, detectAudioDuration } from "@/lib/crypto";
import { useCreateRecord } from "@workspace/api-client-react";

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
    gpsMetadata?: "present" | "absent" | "unknown";
    exifMetadata?: "present" | "absent" | "unknown";
  };
}

export default function CreateRecord() {
  const { toast } = useToast();
  const createRecord = useCreateRecord();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recordType, setRecordType] = useState<RecordType>("file");
  
  // Step 1 State
  const [files, setFiles] = useState<File[]>([]);
  const [testimony, setTestimony] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileEntries, setFileEntries] = useState<FileHashEntry[]>([]);
  
  // Step 2 State
  const [eventType, setEventType] = useState("");
  const [evidenceType, setEvidenceType] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [noteWarning, setNoteWarning] = useState<string | null>(null);

  // Step 3 State
  const [manifest, setManifest] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(recordType === "package" ? [...files, ...selectedFiles] : [selectedFiles[0]]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const checkNoteSafety = (text: string) => {
    const phoneRegex = /\d[\d\s\-\.]{7,}/;
    const gpsRegex = /\d+\.\d+,\s*\d+\.\d+/;
    const capsWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    
    if (phoneRegex.test(text)) return "Warning: Phone numbers detected in public note.";
    if (gpsRegex.test(text)) return "Warning: GPS coordinates detected in public note.";
    if (capsWords.length > 5) return "Warning: Many capitalized words detected. Ensure no full names are included.";
    
    const violentPhrases = ["go kill", "murder", "assassinate"];
    if (violentPhrases.some(phrase => text.toLowerCase().includes(phrase))) {
      return "Warning: Note contains flagged phrases.";
    }

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
        
        let descriptor: any = {
          fileSizeBucket: formatFileSizeBucket(file.size),
          mediaType: file.type || "unknown"
        };

        if (file.type.startsWith("image/")) {
          try {
            const exifr = await import("exifr");
            const exif = await exifr.parse(file, { gps: true, tiff: true });
            descriptor.gpsMetadata = !!(exif?.latitude || exif?.longitude || exif?.GPSLatitude) ? "present" : "absent";
            descriptor.exifMetadata = "present";
            
            // basic resolution attempt
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
            if (img.width && img.height) {
              descriptor.resolutionBucket = `${img.width}x${img.height}`;
            }
          } catch (e) {
            descriptor.exifMetadata = "unknown";
            descriptor.gpsMetadata = "unknown";
          }
        } else if (file.type.startsWith("video/")) {
          try {
            const duration = await detectVideoDuration(file);
            descriptor.durationBucket = formatDurationBucket(duration);
          } catch (e) {}
        } else if (file.type.startsWith("audio/")) {
          try {
            const duration = await detectAudioDuration(file);
            descriptor.durationBucket = formatDurationBucket(duration);
          } catch (e) {}
        }

        entries.push({
          nameHash,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          sha256: hash,
          safeDescriptor: descriptor
        });
      }
      setFileEntries(entries);
      setStep(2);
    } catch (error) {
      console.error(error);
      toast({ title: "Error processing files", description: "Could not hash files.", variant: "destructive" });
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

      setFileEntries([{
        nameHash: await sha256("testimony.txt"),
        mimeType: "text/plain",
        sizeBytes: new Blob([testimony]).size,
        sha256: hash,
        safeDescriptor: {
          mediaType: "text/plain",
          wordCount: wordCount,
          language: lang
        } as any
      }]);
      setStep(2);
    } catch (error) {
      console.error(error);
      toast({ title: "Error processing testimony", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateManifest = async () => {
    if (noteWarning) {
      toast({ title: "Resolve warnings", description: "Please resolve privacy warnings in your note.", variant: "destructive" });
      return;
    }

    const baseManifest = {
      protocol: "silent-witness-v0.1",
      recordType: recordType === "file" ? "file_hash" : recordType === "testimony" ? "testimony_hash" : "package_hash",
      eventType: eventType || "withheld",
      evidenceType: evidenceType || "withheld",
      privacy: "details_withheld",
      location: {
        country: country || "withheld",
        region: region || "withheld",
        city: city || "withheld"
      },
      safeDescriptor: fileEntries.length === 1 ? fileEntries[0].safeDescriptor : {
        mediaType: "package",
        fileCount: fileEntries.length
      },
      fileHashes: fileEntries,
      createdAtUtc: new Date().toISOString(),
      status: "timestamped_only_not_verified",
      publicWarning: "Original evidence is not shared. This record does not prove guilt or truth.",
      privateNote: publicNote || undefined
    };

    const manifestString = JSON.stringify(baseManifest, null, 2);
    const packageHash = await sha256(manifestString);

    const finalManifest = {
      ...baseManifest,
      packageHash
    };

    setManifest(finalManifest);
    setStep(3);
  };

  const downloadJson = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `witness-record-${manifest.packageHash.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPublicRecord = () => {
    if (!manifest) return;
    const publicManifest = { ...manifest };
    delete publicManifest.privateNote; // Remove private note
    navigator.clipboard.writeText(JSON.stringify(publicManifest, null, 2));
    toast({ title: "Copied", description: "Public record copied to clipboard." });
  };

  const shareToTelegram = () => {
    if (!manifest) return;
    const text = `Silent Witness Record\nEvent: ${manifest.eventType}\nLocation: ${manifest.location.country}\nHash: ${manifest.packageHash}\nStatus: Timestamped only, not publicly verified.\nOriginal evidence is not shared.`;
    const url = `https://t.me/share/url?url=${encodeURIComponent("https://silentwitness.org")}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const submitToRegistry = () => {
    if (!manifest) return;
    const publicManifest = { ...manifest };
    delete publicManifest.privateNote; // IMPORTANT: Do not send private note

    const payload = {
      packageHash: publicManifest.packageHash,
      eventType: publicManifest.eventType,
      evidenceType: publicManifest.evidenceType,
      country: publicManifest.location.country !== "withheld" ? publicManifest.location.country : null,
      region: publicManifest.location.region !== "withheld" ? publicManifest.location.region : null,
      city: publicManifest.location.city !== "withheld" ? publicManifest.location.city : null,
      safeDescriptor: publicManifest.safeDescriptor,
      status: publicManifest.status,
      qualityLevel: recordType === "package" ? "A" : recordType === "file" ? "B" : "C",
      publicWarning: publicManifest.publicWarning,
      createdAtUtc: publicManifest.createdAtUtc
    };

    createRecord.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Submitted", description: "Public fingerprint added to registry." });
      },
      onError: () => {
        toast({ title: "Submission failed", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-primary tracking-tight mb-2">Create Witness Record</h1>
          <p className="text-muted-foreground">Generate a cryptographic fingerprint without exposing the original data.</p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
        </div>

        <Alert className="mb-8 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold">Processing locally. Your file is not uploaded.</AlertTitle>
          <AlertDescription className="text-blue-700/80 dark:text-blue-400/80">
            All cryptographic operations happen in your browser memory.
          </AlertDescription>
        </Alert>

        {step === 1 && (
          <div className="space-y-6 bg-card border border-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold">Step 1: Choose Record Type</h2>
            
            <Tabs value={recordType} onValueChange={(v: string) => setRecordType(v as RecordType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">File Evidence</TabsTrigger>
                <TabsTrigger value="testimony">Written Testimony</TabsTrigger>
                <TabsTrigger value="package">Evidence Package</TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                {(recordType === "file" || recordType === "package") && (
                  <div className="space-y-4">
                    <Label>Select {recordType === "package" ? "multiple files" : "a file"} (Local only)</Label>
                    <Input 
                      type="file" 
                      multiple={recordType === "package"}
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                    
                    {files.length > 0 && (
                      <div className="text-sm text-muted-foreground space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="flex justify-between items-center bg-muted p-2 rounded">
                            <span className="truncate max-w-[200px]">{f.name}</span>
                            <span>{formatFileSizeBucket(f.size)}</span>
                            {recordType === "package" && (
                              <Button variant="ghost" size="sm" onClick={() => removeFile(i)}>Remove</Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button 
                      className="w-full mt-4" 
                      disabled={files.length === 0 || isProcessing}
                      onClick={processFiles}
                    >
                      {isProcessing ? "Processing..." : "Process Fingerprint"}
                      {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                )}

                {recordType === "testimony" && (
                  <div className="space-y-4">
                    <Label>Write testimony</Label>
                    <Textarea 
                      rows={10} 
                      placeholder="Write your account here..."
                      value={testimony}
                      onChange={(e) => setTestimony(e.target.value)}
                      disabled={isProcessing}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      Word count: {testimony.trim().split(/\s+/).filter(Boolean).length}
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      disabled={testimony.trim().length === 0 || isProcessing}
                      onClick={processTestimony}
                    >
                      {isProcessing ? "Processing..." : "Process Fingerprint"}
                      {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 bg-card border border-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold">Step 2: Safe Public Context</h2>
            <p className="text-sm text-muted-foreground">
              Provide general context. Do not include precise locations, names, or contact info. This metadata will be public.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
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

              <div className="space-y-2">
                <Label>Evidence Type</Label>
                <Select value={evidenceType} onValueChange={setEvidenceType}>
                  <SelectTrigger><SelectValue placeholder="Select evidence type" /></SelectTrigger>
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

              <div className="space-y-2">
                <Label>Country (Optional)</Label>
                <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Broad region only" />
              </div>
              <div className="space-y-2">
                <Label>Region/Province (Optional)</Label>
                <Input value={region} onChange={e => setRegion(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>City (Optional)</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Public Note (Optional)</Label>
                <Textarea 
                  value={publicNote} 
                  onChange={handleNoteChange} 
                  placeholder="Describe the context without identifying details..."
                />
                {noteWarning && (
                  <div className="text-destructive text-sm flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-4 h-4" /> {noteWarning}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={generateManifest} className="flex-1" disabled={!!noteWarning}>
                Generate Manifest
              </Button>
            </div>
          </div>
        )}

        {step === 3 && manifest && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-lg text-center space-y-4">
              <Check className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-serif text-primary">Fingerprint Created</h2>
              <p className="text-muted-foreground">Original stays on your device. Fingerprint only.</p>
              
              <div className="bg-muted p-4 rounded text-left overflow-x-auto">
                <Label className="text-muted-foreground mb-1 block">Package Hash</Label>
                <code className="text-lg font-mono">{manifest.packageHash}</code>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1" onClick={downloadJson}>
                <Download className="w-4 h-4" />
                <span className="text-xs">Download Proof Package</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1" onClick={copyPublicRecord}>
                <Copy className="w-4 h-4" />
                <span className="text-xs">Copy Public Record</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1" onClick={shareToTelegram}>
                <Share2 className="w-4 h-4" />
                <span className="text-xs">Share to Telegram</span>
              </Button>
              <Button className="h-16 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={submitToRegistry} disabled={createRecord.isPending}>
                <Upload className="w-4 h-4" />
                <span className="text-xs">{createRecord.isPending ? "Submitting..." : "Submit to Public Registry"}</span>
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground mt-8">
              A fingerprint is not proof that an event happened.
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
