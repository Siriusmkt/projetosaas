interface AICreditsDisplayProps {
  credits: number;
}

export function AICreditsDisplay({ credits }: AICreditsDisplayProps) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {credits.toLocaleString()}
    </span>
  );
}