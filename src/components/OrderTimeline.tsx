import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Stage = {
  key: string;
  label: string;
  description: string;
  done: boolean;
  timestamp?: string | null;
};

interface OrderTimelineProps {
  application: Tables<"applications">;
  payments: Tables<"payments">[];
  documents: Tables<"documents">[];
  deliverables: { id: string; created_at: string }[];
}

const statusOrder = ["submitted", "documents_review", "processing", "ready"];

const OrderTimeline = ({ application, payments, documents, deliverables }: OrderTimelineProps) => {
  const rejected = application.status === "rejected";
  const statusIndex = statusOrder.indexOf(application.status);

  const sorted = [...payments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const firstPayment = sorted[0];
  const verifiedPayment = sorted.find((p) => p.status === "verified");
  const firstDoc = [...documents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];
  const firstDeliverable = [...deliverables].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];

  const stages: Stage[] = [
    {
      key: "placed",
      label: "Order Placed",
      description: "Your order was created.",
      done: true,
      timestamp: application.created_at,
    },
    {
      key: "payment_submitted",
      label: "Payment Submitted",
      description: firstPayment
        ? `${firstPayment.payment_method} payment recorded${firstPayment.reference_number ? ` (Ref: ${firstPayment.reference_number})` : ""}.`
        : "Awaiting your payment.",
      done: !!firstPayment,
      timestamp: firstPayment?.created_at,
    },
    {
      key: "payment_verified",
      label: "Payment Verified",
      description: verifiedPayment
        ? "Payment confirmed and balance credited by our team."
        : "Our team will confirm your payment.",
      done: !!verifiedPayment,
      timestamp: verifiedPayment?.updated_at,
    },
    {
      key: "documents_review",
      label: "Documents Review",
      description: firstDoc ? "Your photo/documents are being reviewed." : "Upload your required photo to continue.",
      done: statusIndex >= 1,
      timestamp: statusIndex >= 1 ? firstDoc?.updated_at ?? application.updated_at : null,
    },
    {
      key: "processing",
      label: "Processing",
      description: "We are preparing your order.",
      done: statusIndex >= 2,
      timestamp: statusIndex >= 2 ? application.updated_at : null,
    },
    {
      key: "delivered",
      label: "Delivered",
      description: firstDeliverable
        ? "Your files are available in the Delivery Center."
        : "Delivery targeted within 5 days.",
      done: statusIndex >= 3 || !!firstDeliverable,
      timestamp: firstDeliverable?.created_at ?? (statusIndex >= 3 ? application.updated_at : null),
    },
  ];

  const fmt = (ts?: string | null) => (ts ? new Date(ts).toLocaleString() : null);

  return (
    <ol className="relative space-y-6">
      {stages.map((stage, i) => {
        const isCurrent = !stage.done && (i === 0 || stages[i - 1].done);
        const last = i === stages.length - 1;
        return (
          <li key={stage.key} className="relative flex gap-3">
            {!last && (
              <span
                className={`absolute left-[11px] top-6 h-[calc(100%+0.5rem)] w-px ${
                  stage.done ? "bg-primary" : "bg-border"
                }`}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 mt-0.5 shrink-0">
              {rejected && isCurrent ? (
                <XCircle className="h-6 w-6 text-destructive" />
              ) : stage.done ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : isCurrent ? (
                <Clock className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground/40" />
              )}
            </span>
            <div className="min-w-0 pb-1">
              <p className={`text-sm font-medium ${stage.done ? "text-foreground" : "text-muted-foreground"}`}>
                {stage.label}
              </p>
              <p className="text-xs text-muted-foreground">{stage.description}</p>
              {fmt(stage.timestamp) && (
                <p className="text-xs text-muted-foreground/80 mt-0.5">{fmt(stage.timestamp)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
