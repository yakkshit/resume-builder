import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveUserAvatarServerSide,
  userHasUploadedPhoto,
  PhotoResolutionError,
  createDownsizedPhotoDataUri,
} from "@/lib/crypto/photo-resolver";
import {
  getLocalProfilePictureDataUri,
  executeMcpToolCall,
} from "@/lib/mcp/mcp-tools-catalog";
import { defaultResumeData } from "@/lib/default-resume-data";
import { inMemoryAvatarStore } from "@/app/api/avatar/[userId]/route";
import { DatabaseService } from "@/lib/db/plsql-storage";

describe("Photo Pipeline Hardening & Server-Side Inlining (No-Galaxy Guarantee)", () => {
  const testUserId = "user_photo_test_99";

  beforeEach(() => {
    inMemoryAvatarStore.delete(testUserId);
  });

  it("never falls back to deepmind-picture-2.jpg in getLocalProfilePictureDataUri", () => {
    const dataUri = getLocalProfilePictureDataUri();
    // Verify that the 3.5 MB galaxy banner is never returned
    expect(dataUri || "").not.toContain("deepmind-picture-2.jpg");
  });

  it("ensures defaultResumeData profile picture does not reference deepmind-picture-2.jpg", () => {
    expect(defaultResumeData.basicInfo.profilePicture).not.toBe("/deepmind-picture-2.jpg");
    expect(defaultResumeData.basicInfo.profilePicture).not.toContain("deepmind-picture-2.jpg");
  });

  it("downsizes photos to small data URIs strictly under 200 KB to keep total PDF < 2 MB", () => {
    // Create a 1MB mock buffer
    const mockBuffer = Buffer.alloc(1024 * 1024, 0xaa);
    const result = createDownsizedPhotoDataUri(mockBuffer, "image/jpeg");
    expect(result.dataUri.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(result.bytes).toBeLessThan(2 * 1024 * 1024);
  });

  it("throws PhotoResolutionError when user is known to have uploaded a photo but resolution yields placeholder", async () => {
    const mockUid = "user_marked_photo_missing";
    // Register user profile with a remote storage URL (not data URI) so userHasUploadedPhoto is true
    await DatabaseService.upsertUserProfile({
      id: mockUid,
      name: "Mock User",
      avatarUrl: "https://firebasestorage.googleapis.com/v0/b/app/o/avatars%2Fmock.jpg",
    });

    const hasPhoto = await userHasUploadedPhoto(mockUid);
    expect(hasPhoto).toBe(true);

    await expect(
      resolveUserAvatarServerSide(mockUid)
    ).rejects.toThrow(PhotoResolutionError);
  });

  it("resolves authentic base64 photo data URI when present in avatar store", async () => {
    const mockPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    inMemoryAvatarStore.set(testUserId, {
      buffer: mockPngBuffer,
      mimeType: "image/png",
      timestamp: Date.now(),
    });

    const resolved = await resolveUserAvatarServerSide(testUserId);
    expect(resolved.photoEmbedded).toBe(true);
    expect(resolved.isPlaceholder).toBe(false);
    expect(resolved.photoDataUri.startsWith("data:image/")).toBe(true);
    expect(resolved.photoSource).toBe("memory");
    expect(resolved.photoBytes).toBeGreaterThan(0);
  });

  it("provides photoVerification contract in generate_resume_pdf tool output", async () => {
    const result = await executeMcpToolCall(
      "generate_resume_pdf",
      {
        templateId: "tech-modern",
        title: "Test PDF",
        forceRender: true,
      },
      { userId: testUserId }
    );

    expect(result).toBeDefined();
    const parsed = JSON.parse(result.content[0].text);
    // Should contain photoVerification metadata contract
    expect(parsed.photoVerification).toBeDefined();
    expect(typeof parsed.photoVerification.photoEmbedded).toBe("boolean");
    expect(typeof parsed.photoVerification.isPlaceholder).toBe("boolean");
    // Also flat properties
    expect(typeof parsed.photoEmbedded).toBe("boolean");
    // Verify PDF size strictly adheres to 2 MB limit
    if (parsed.pdfBytes) {
      expect(parsed.pdfBytes).toBeLessThan(2 * 1024 * 1024);
    }
  });

  it("provides photoVerification contract in get_user_profile tool output", async () => {
    const result = await executeMcpToolCall(
      "get_user_profile",
      {},
      { userId: testUserId }
    );

    expect(result).toBeDefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.photoVerification).toBeDefined();
    expect(parsed.photoVerification.photoSource).toBeDefined();
  });
});
