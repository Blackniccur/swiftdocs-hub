import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users } from "lucide-react";

const Referral = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const code = (user?.id || "guest").replace(/-/g, "").slice(0, 8).toUpperCase();
  const link = `${window.location.origin}/auth?ref=${code}`;

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} copied` });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Referral</h1>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Earn 5% on every referred order</CardTitle>
            <CardDescription>
              Share your link. When a friend signs up and completes an order, credit is added to your balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Your referral code</p>
              <div className="flex gap-2">
                <Input readOnly value={code} />
                <Button variant="outline" size="icon" onClick={() => copy(code, "Code")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Your referral link</p>
              <div className="flex gap-2">
                <Input readOnly value={link} />
                <Button variant="outline" size="icon" onClick={() => copy(link, "Link")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Referrals joined</p>
              <p className="text-xs text-muted-foreground">Referral rewards are credited after admin verification.</p>
            </div>
            <span className="ml-auto text-2xl font-bold text-foreground">0</span>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Referral;
