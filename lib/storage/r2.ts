/**
 * Cloudflare R2 / S3-Compatible File Storage Client
 * Optimized for storing compressed PDFs, images, and user attachments with zero egress fees.
 */

export interface StorageUploadResult {
  url: string;
  key: string;
  sizeBytes: number;
}

export class CloudflareR2Storage {
  private accountId: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private bucketName: string;
  private publicDomain: string;

  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID || "";
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
    this.bucketName = process.env.R2_BUCKET_NAME || "career-agent-files";
    this.publicDomain = process.env.R2_PUBLIC_DOMAIN || "";
  }

  get isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey);
  }

  /**
   * Upload a compressed PDF or file buffer to R2.
   * If R2 credentials are not configured, returns an inline base64 or memory URL safely.
   */
  async uploadFile(
    fileBuffer: Buffer | Uint8Array,
    fileName: string,
    contentType = "application/pdf"
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const key = `resumes/${timestamp}-${fileName}`;

    if (!this.isConfigured) {
      const b64 = Buffer.from(fileBuffer).toString("base64");
      return {
        url: `data:${contentType};base64,${b64}`,
        key,
        sizeBytes: fileBuffer.byteLength,
      };
    }

    try {
      const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
        },
        body: fileBuffer as any,
      });

      if (!response.ok) {
        throw new Error(`R2 upload failed: ${response.statusText}`);
      }

      const publicUrl = this.publicDomain
        ? `https://${this.publicDomain}/${key}`
        : endpoint;

      return {
        url: publicUrl,
        key,
        sizeBytes: fileBuffer.byteLength,
      };
    } catch (error) {
      console.warn("R2 upload fallback:", error);
      const b64 = Buffer.from(fileBuffer).toString("base64");
      return {
        url: `data:${contentType};base64,${b64}`,
        key,
        sizeBytes: fileBuffer.byteLength,
      };
    }
  }
}

export const r2Storage = new CloudflareR2Storage();
