import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  let colorClass = "bg-muted text-muted-foreground";

  if (status.toLowerCase().includes("working") && !status.toLowerCase().includes("non")) {
    colorClass = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
  } else if (status.toLowerCase().includes("non") || status.toLowerCase().includes("condemn")) {
    colorClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400";
  } else if (status.toLowerCase().includes("pending") || status.toLowerCase().includes("request")) {
    colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
  } else if (status.toLowerCase().includes("approv")) {
    colorClass = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
  }

  return (
    <Badge variant="outline" className={`${colorClass} font-semibold border`}>
      {status}
    </Badge>
  );
}
