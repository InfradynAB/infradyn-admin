import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketDetail } from "@/components/admin/support/ticket-detail";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <TicketDetail ticketId={ticketId} />
    </Suspense>
  );
}
