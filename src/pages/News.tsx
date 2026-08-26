import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper } from "lucide-react";

const posts = [
  {
    tag: "Platform",
    title: "Escrow protection is now standard on every order",
    date: "Aug 2026",
    body: "All marketplace payments are held in escrow and released only after your deliverables are uploaded and marked ready.",
  },
  {
    tag: "New listing",
    title: "Outlier UK and Philippines profiles available",
    date: "Aug 2026",
    body: "Two new regional Outlier profiles joined the catalog with verified onboarding and hourly rates listed on each product.",
  },
  {
    tag: "Payments",
    title: "Faster deposit verification",
    date: "Jul 2026",
    body: "Binance proof-of-payment submissions are now reviewed within a few hours on business days.",
  },
  {
    tag: "Support",
    title: "Melissa handles chat when admins are offline",
    date: "Jul 2026",
    body: "Our assistant answers order and pricing questions instantly, and hands you over to a human as soon as one is online.",
  },
];

const News = () => (
  <DashboardLayout>
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Newspaper className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">News &amp; Announcements</h1>
      </div>

      <div className="space-y-4">
        {posts.map((p) => (
          <Card key={p.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">{p.tag}</Badge>
                <span className="text-xs text-muted-foreground">{p.date}</span>
              </div>
              <CardTitle className="text-base">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default News;
