"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { authFetch } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { AdminDashboard } from "@/lib/types";

export default function AdminDashboardPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    if (ready && (!user || user.role !== "ADMIN")) {
      router.push("/login?redirect=/admin/dashboard");
      return;
    }
    if (user?.role === "ADMIN") {
      authFetch<AdminDashboard>("/api/admin/dashboard", user.token).then(setData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  if (!data) {
    return (
      <AdminShell>
        <div className="py-24 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Loading…</div>
      </AdminShell>
    );
  }

  const metrics = [
    { label: "Total revenue", value: formatMoney(data.totalRevenuePesewas) },
    { label: "Orders", value: String(data.orderCount) },
    { label: "Items sold", value: String(data.itemsSold) },
    { label: "Live stock", value: String(data.liveStockUnits) },
  ];

  return (
    <AdminShell>
      <div>
        <h1 className="mb-8 font-serif text-[56px] max-[640px]:text-[38px]">Overview</h1>

        <div className="grid grid-cols-2 border-y border-rule min-[900px]:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {metrics.map((m, i) => (
            <div key={m.label} className={`py-6 pl-4 min-[900px]:py-[26px] min-[900px]:pl-6 ${i > 0 ? "border-l border-rule" : ""}`}>
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey">{m.label}</div>
              <div className="mt-3 whitespace-nowrap font-mono text-2xl tracking-[-0.01em] min-[900px]:text-[32px]">{m.value}</div>
            </div>
          ))}
        </div>

        <h2 className="mb-6 mt-14 font-serif text-[28px] min-[900px]:text-[36px]">Awaiting action</h2>

        {data.awaitingAction.length === 0 && (
          <div className="border-t border-rule py-16 text-center text-sm text-grey">Nothing needs attention right now.</div>
        )}

        {data.awaitingAction.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[110px_150px_130px_130px_70px_130px_100px_130px] gap-4 border-b border-rule pb-3.5">
                {["Order", "Customer", "Phone", "Zone", "Items", "Total", "Payment", "Status"].map((h, i) => (
                  <div key={h} className={`font-mono text-[11px] uppercase tracking-[0.1em] text-grey ${i >= 5 ? "text-right" : ""}`}>
                    {h}
                  </div>
                ))}
              </div>
              {data.awaitingAction.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="grid grid-cols-[110px_150px_130px_130px_70px_130px_100px_130px] items-center gap-4 border-b border-rule py-[18px] hover:bg-hover-light"
                >
                  <div className="font-mono text-[13px]">{o.orderNumber}</div>
                  <div className="text-sm">{o.customerName}</div>
                  <div className="font-mono text-[13px] text-grey">{o.customerPhone}</div>
                  <div className="text-sm">{o.zoneName}</div>
                  <div className="font-mono text-[13px] text-grey">{o.itemCount}</div>
                  <div className="text-right font-mono text-[13px]">{formatMoney(o.totalPesewas)}</div>
                  <div className={`text-right font-mono text-[11px] uppercase tracking-[0.1em] ${o.paymentStatus === "PAID" ? "text-ink" : "text-signal"}`}>
                    {o.paymentStatus}
                  </div>
                  <div className="text-right font-mono text-[11px] uppercase tracking-[0.1em]">{o.status.replace(/_/g, " ")}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
