import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_COLOR } from "@/lib/constants";

export function LeadStatusBadge({ status }: { status: string }) {
  const cls = LEAD_STATUS_COLOR[status] ?? LEAD_STATUS_COLOR.cold;

  return <Badge className={cls}>{status}</Badge>;
}
