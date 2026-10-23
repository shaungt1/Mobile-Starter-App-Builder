/**
 * Feature switches. Set one to false to turn that feature off without removing its code:
 * its service stays inert even when its keys are in .env, and its screens and gates step aside.
 * Change these with `bash start.sh feature off <id>` / `feature on <id>`, or edit by hand.
 * To delete a feature's code and native packages entirely, use the builder:
 * `bash start.sh expo feature remove <id> <this app folder>` (see docs/FEATURES.md).
 */
export const features: Record<"auth" | "payments" | "analytics" | "notifications", boolean> = {
  auth: true,
  payments: true,
  analytics: true,
  notifications: true,
};
