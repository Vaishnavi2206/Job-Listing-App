import type { BadgeVariant } from "./Badge";

export function statusToBadgeVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "active":
      return "green";
    case "inactive":
      return "neutral";
    case "pending":
      return "orange";
    case "rejected":
      return "red";
    default:
      return "neutral";
  }
}
