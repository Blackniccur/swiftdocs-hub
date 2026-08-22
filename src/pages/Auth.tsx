import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Car, Briefcase, Bot, BookOpen, Terminal } from "lucide-react";
import heroBg from "@/assets/dark-hero.jpg";


const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data.session) {
      toast({ title: "Welcome to AccelDocs!", description: "Your account is ready." });
      navigate("/dashboard");
    } else {
      toast({ title: "Account created!", description: "You can now sign in." });
    }
  };


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

      <div className="relative border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold tracking-[0.2em] text-primary uppercase">AccelDocs</h1>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Secure Access</h2>
            <p className="text-muted-foreground text-sm">Marketplace for document &amp; account services</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: Car, label: "Driving License" },
              { icon: Briefcase, label: "Outlier" },
              { icon: Bot, label: "Handshake AI" },
              { icon: Briefcase, label: "Mercor AI" },
              { icon: BookOpen, label: "AI Course" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <s.icon className="h-4 w-4 text-primary" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <Card className="border-border/70 bg-card/80 backdrop-blur-md shadow-[var(--shadow-panel)]">

            <Tabs defaultValue="signin">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4">
                    <CardDescription>Sign in to your account to continue.</CardDescription>
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4">
                    <CardDescription>Create an account to get started.</CardDescription>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
