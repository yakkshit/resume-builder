import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id?: string;
  };
  type: "user.created" | "user.updated" | "user.deleted";
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes("placeholder")) {
    console.warn("CLERK_WEBHOOK_SECRET is not configured or is a placeholder.");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  // Get the Svix headers for signature verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  // Get the raw body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret);

  let evt: ClerkUserEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as unknown as ClerkUserEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;
  const email = evt.data.email_addresses?.[0]?.email_address || null;

  try {
    if (eventType === "user.created") {
      await db
        .insert(users)
        .values({
          clerkId: id,
          email,
        })
        .onConflictDoNothing();
      console.log(`[Clerk Webhook] Created user in DB: ${id}`);
    } else if (eventType === "user.updated") {
      await db
        .update(users)
        .set({ email })
        .where(eq(users.clerkId, id));
      console.log(`[Clerk Webhook] Updated user in DB: ${id}`);
    } else if (eventType === "user.deleted") {
      await db
        .delete(users)
        .where(eq(users.clerkId, id));
      console.log(`[Clerk Webhook] Deleted user from DB: ${id}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (dbError) {
    console.error("[Clerk Webhook] Database error processing event:", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
