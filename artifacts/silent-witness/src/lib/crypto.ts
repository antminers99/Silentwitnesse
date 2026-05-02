export async function sha256(data: ArrayBuffer | string): Promise<string> {
  const buffer = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : new Uint8Array(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatFileSizeBucket(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return 'small (<1MB)';
  if (mb <= 10) return 'medium (1–10MB)';
  return 'large (>10MB)';
}

export function formatDurationBucket(seconds: number): string {
  if (seconds <= 5) return '0–5s';
  if (seconds <= 15) return '5–15s';
  if (seconds <= 60) return '15–60s';
  if (seconds <= 300) return '1–5min';
  return '>5min';
}

export async function detectVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.src = URL.createObjectURL(file);
  });
}

export async function detectAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.src = URL.createObjectURL(file);
  });
}
