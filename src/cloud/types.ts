export type UploadDataProps = {
  fileName?: string;
  fileType?: string;
  uploadId?: string;
  projectId?: string;
  parts?: Array<{ PartNumber: number; ETag: string }>;
  totalParts?: number;
  chunkSize?: number;
  partNumber?: number;
  fileUrl?: string;
  cdnUrl?: string;
  fileHash?: string;
};
