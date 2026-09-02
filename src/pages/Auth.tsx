import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, LockKeyhole, Terminal } from "lucide-react";
import heroBg from "@/assets/dark-hero.jpg";


const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
      <div className="market-grid absolute inset-0 opacity-30" />

      <header className="relative border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="AccelDocs home">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <span className="text-base font-bold uppercase tracking-[0.16em] text-foreground">Accel<span className="text-primary">Docs</span></span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Marketplace</Link>
          </Button>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_440px]">
          <div className="hidden lg:block">
            <p className="mb-4 font-mono text-xs uppercase text-primary">Member access</p>
            <h1 className="max-w-lg text-5xl font-extrabold leading-[1.08] text-foreground">Your marketplace,<br />all in one place.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">Purchase services, submit payment details, follow progress, and securely receive your deliverables.</p>
            <div className="mt-8 space-y-3">
              {["Real-time order tracking", "Secure account balance", "Direct support with Melissa and our team"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" /> {item}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md justify-self-center lg:max-w-none">
            <div className="mb-6 lg:hidden">
              <p className="mb-2 font-mono text-xs uppercase text-primary">Member access</p>
              <h1 className="text-3xl font-bold text-foreground">Welcome to AccelDocs</h1>
            </div>
          <Card className="border-border bg-card/90 shadow-[var(--shadow-panel)] backdrop-blur-xl">
            <Tabs defaultValue={initialMode}>
              <CardHeader className="space-y-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold text-foreground">Secure access</p>
                    <p className="text-xs text-muted-foreground">Sign in or create your account</p>
                  </div>
                </div>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>
              </CardHeader>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4">
                    <CardDescription>Enter your details to open your dashboard.</CardDescription>
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
                    <CardDescription>Create your account instantly. No email verification is required.</CardDescription>
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
          <p className="mt-5 text-center text-xs text-muted-foreground">Protected access · Secure transactions · Private delivery</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
