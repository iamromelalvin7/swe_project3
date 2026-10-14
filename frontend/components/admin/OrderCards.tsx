import Link from "next/link";
import { StatusChip } from "@/components/admin/StatusChip";
import { orderStatusChip, paymentChip } from "@/lib/adminStatus";
import { formatShortDate } from "@/lib/adminDates";
import { formatMoney } from "@/lib/money";
import type { AdminOrderSummary } from "@/lib/types";

/** Mobile & tablet: one card per order. Shared with the dashboard. */
export function OrderCards({ orders }: { orders: AdminOrderSummary[] }) {
  return (
    <ul className="border-t border-rule min-[1100px]:hidden">
      {orders.map((o) => (
        <li key={o.id} className="border-b border-rule">
          <Link href={`/admin/orders/${o.id}`} className="block py-4 hover:bg-hover-light">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-meta">{o.orderNumber}</span>
              <span className="font-mono text-meta tabular-nums">{formatMoney(o.totalPesewas)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{o.customerName}</span>
              <span className="flex-shrink-0 font-mono text-micro uppercase tracking-label text-grey">
                {formatShortDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "piece" : "pieces"}
              </span>
            </div>
            <div className="mt-0.5 text-sm text-grey">{o.zoneName}</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <StatusChip chip={orderStatusChip(o.status)} />
              <StatusChip chip={paymentChip(o.paymentStatus)} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
