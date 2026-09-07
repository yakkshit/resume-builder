export function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  return Boolean(
    publishableKey &&
    !publishableKey.includes("placeholder") &&
    !publishableKey.includes("your_clerk") &&
    (publishableKey.startsWith("pk_test_") || publishableKey.startsWith("pk_live_")) &&
    publishableKey.length > 20
  );
}

export function getClerkPublishableKey(): string {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
}
