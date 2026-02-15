import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(1, "Name is required").max(100),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const parsed = loginSchema.parse({ email, password });
        const { error } = await signIn(parsed.email, parsed.password);
        if (error) {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
        }
      } else {
        const parsed = signupSchema.parse({ email, password, fullName });
        const { error } = await signUp(parsed.email, parsed.password, parsed.fullName);
        if (error) {
          const msg = error.message?.includes("already registered")
            ? "This email is already registered. Please log in instead."
            : error.message;
          toast({ title: "Signup failed", description: msg, variant: "destructive" });
        } else {
          toast({ title: "Check your email", description: "We sent you a confirmation link." });
        }
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast({ title: "Validation error", description: err.errors[0].message, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>X</span>
            </div>
            <span className="font-bold text-xl text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Xenlogy</span>
          </a>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLogin ? "Log in to access your courses" : "Start your learning journey today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-card">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={submitting}>
            {submitting ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
