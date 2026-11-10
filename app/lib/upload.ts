// Browser helper: uploads a file straight to Cloudflare R2 using a signed URL.
export function putFile(
  url: string,
  file: Blob,
  contentType: string,
  onProgress: (pct: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (code ${xhr.status}).`));
    xhr.onerror = () =>
      reject(new Error('Upload failed. Check your connection and the bucket’s CORS policy.'));
    xhr.send(file);
  });
}
