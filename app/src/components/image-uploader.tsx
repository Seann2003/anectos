"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

type UploadResult = {
  cid: string;
  metadataUri: string;
  gatewayUrl: string;
};

export interface ImageUploaderProps {
  label?: string;
  onUploaded?: (result: UploadResult) => void;
  onError?: (message: string) => void;
  className?: string;
  showDetails?: boolean;
}

export default function ImageUploader({
  label = "Upload Image",
  onUploaded,
  onError,
  className,
  showDetails = true,
}: ImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onImageChange = async (file: File | null) => {
    setResult(null);
    setError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!file) {
      setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImagePreview(url);

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("name", file.name);

      const res = await fetch("/api/pinata/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json && json.error) || res.statusText);

      const cid: string =
        typeof json === "string"
          ? json
          : json?.cid || json?.IpfsHash || json?.hash || json?.data?.cid;
      if (!cid) throw new Error("Missing CID in response");
      const metadataUri: string =
        (typeof json === "object" && json?.metadataUri) || `ipfs://${cid}`;
      const gatewayBase = (typeof window === "undefined" ? null : null) as null; // placeholder to satisfy linter
      const gatewayUrl =
        (typeof json === "object" && json?.gatewayUrl) ||
        `https://gateway.pinata.cloud/ipfs/${cid}`;

      const uploadResult: UploadResult = { cid, metadataUri, gatewayUrl };
      setResult(uploadResult);
      onUploaded?.(uploadResult);
    } catch (e: any) {
      const msg = e?.message || "Failed to upload to Pinata";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 cursor-pointer text-blue-700">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageChange(e.target.files?.[0] || null)}
          />
          <span className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm hover:bg-blue-100">
            <ImagePlus className="h-4 w-4" /> Upload image
          </span>
        </label>
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="h-16 w-16 object-cover rounded-md border"
          />
        )}
        {uploading && (
          <span className="text-sm text-gray-600">Uploading to Pinata...</span>
        )}
      </div>
      {showDetails && (
        <>
          {result?.cid && (
            <div className="mt-2 text-xs text-gray-700 break-all">
              image link:{" "}
              <a
                href={`https://ipfs.io/ipfs/${result.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline hover:text-blue-900"
              >
                {`https://ipfs.io/ipfs/${result.cid}`}
              </a>
            </div>
          )}
          {error && <div className="mt-2 text-xs text-red-700">{error}</div>}
        </>
      )}
    </div>
  );
}
