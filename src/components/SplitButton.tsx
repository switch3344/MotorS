import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "../config/site.config";

export function SplitButton({
  children,
  compact = false,
  secondary = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
  secondary?: boolean;
}) {
  return (
    <a
      className={`split-button${compact ? " split-button-small" : ""}${secondary ? " split-button-secondary" : ""}`}
      href={siteConfig.telegram}
      target="_blank"
      rel="noreferrer"
    >
      <span>{children}</span>
      <span className="split-button-arrow" aria-hidden="true">
        <ArrowUpRight />
      </span>
    </a>
  );
}
