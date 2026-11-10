import { ArrowDownRight } from "lucide-react";
import { siteConfig } from "../config/site.config";

export function SplitButton({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <a
      className={`split-button${compact ? " split-button-small" : ""}`}
      href={siteConfig.telegram}
      target="_blank"
      rel="noreferrer"
    >
      <span>{children}</span>
      <span className="split-button-arrow" aria-hidden="true">
        <ArrowDownRight />
      </span>
    </a>
  );
}
