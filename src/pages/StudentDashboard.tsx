import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, LogOut, Link2, DollarSign, Copy, Users, Clock } from "lucide-react";

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  course_title?: string;
}

interface Affiliate {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_earnings: number;
  available_balance: number;
  is_active: boolean;
}

interface Referral {
  id: string;
  referred_user_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  processed_at: string | null;
}

const StudentDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<"courses" | "affiliate">("courses");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, { completed: number; total: number }>>({});
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    // Load enrollments
    const { data: enrollData } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user!.id);

    if (enrollData && enrollData.length > 0) {
      // Get course titles
      const courseIds = enrollData.map((e) => e.course_id);
      const { data: courses } = await supabase.from("courses").select("id, title").in("id", courseIds);
      const courseMap = new Map((courses || []).map((c) => [c.id, c.title]));

      const enriched = enrollData.map((e) => ({ ...e, course_title: courseMap.get(e.course_id) || "Unknown" }));
      setEnrollments(enriched);

      // Load progress for each course
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user!.id);

      // Get all lessons for enrolled courses
      for (const enrollment of enriched) {
        const { data: modules } = await supabase
          .from("course_modules")
          .select("id")
          .eq("course_id", enrollment.course_id);

        if (modules) {
          const moduleIds = modules.map((m) => m.id);
          const { data: lessons } = await supabase
            .from("lessons")
            .select("id")
            .in("module_id", moduleIds);

          const total = lessons?.length || 0;
          const lessonIds = new Set((lessons || []).map((l) => l.id));
          const completed = (progress || []).filter((p) => p.completed && lessonIds.has(p.lesson_id)).length;

          setProgressMap((prev) => ({ ...prev, [enrollment.course_id]: { completed, total } }));
        }
      }
    }

    // Load affiliate data
    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (aff) {
      setAffiliate(aff);
      const { data: refs } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false });
      setReferrals(refs || []);

      const { data: pays } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false });
      setPayouts(pays || []);
    }

    setLoading(false);
  };

  const joinAffiliate = async () => {
    const code = `XEN-${user!.id.substring(0, 8).toUpperCase()}`;
    const { data, error } = await supabase
      .from("affiliates")
      .insert({ user_id: user!.id, affiliate_code: code })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAffiliate(data);
      toast({ title: "Welcome to the affiliate program!" });
    }
  };

  const copyLink = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${affiliate.affiliate_code}`);
    toast({ title: "Affiliate link copied!" });
  };

  const requestPayout = async () => {
    if (!affiliate || !payoutAmount || !payoutMethod) return;
    const amount = parseFloat(payoutAmount);
    if (amount <= 0 || amount > affiliate.available_balance) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("payout_requests").insert({
      affiliate_id: affiliate.id,
      amount,
      payment_method: payoutMethod,
      payment_details: payoutDetails,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout request submitted!" });
      setPayoutAmount("");
      setPayoutMethod("");
      setPayoutDetails("");
      loadData();
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Home
            </Button>
            <h1 className="font-display font-bold text-lg text-foreground">My Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" /> Log Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Button variant={tab === "courses" ? "default" : "outline"} onClick={() => setTab("courses")} className={tab === "courses" ? "gradient-primary text-primary-foreground" : ""}>
            <BookOpen className="w-4 h-4 mr-2" /> My Courses
          </Button>
          <Button variant={tab === "affiliate" ? "default" : "outline"} onClick={() => setTab("affiliate")} className={tab === "affiliate" ? "gradient-primary text-primary-foreground" : ""}>
            <Link2 className="w-4 h-4 mr-2" /> Affiliate
          </Button>
        </div>

        {tab === "courses" && (
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
                <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground">
                  Browse Courses
                </Button>
              </div>
            ) : (
              enrollments.map((enrollment) => {
                const prog = progressMap[enrollment.course_id];
                const percent = prog ? Math.round((prog.completed / prog.total) * 100) : 0;
                return (
                  <div key={enrollment.id} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-display font-bold text-foreground text-lg">{enrollment.course_title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                            {enrollment.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button onClick={() => navigate("/course")} className="gradient-primary text-primary-foreground">
                        Continue
                      </Button>
                    </div>
                    {prog && prog.total > 0 && (
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>{prog.completed} / {prog.total} lessons completed</span>
                          <span>{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "affiliate" && (
          <div className="space-y-6">
            {!affiliate ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl text-foreground mb-2">Join Our Affiliate Program</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Earn commissions by referring new students. Get your unique affiliate link and start earning.
                </p>
                <Button onClick={joinAffiliate} className="gradient-primary text-primary-foreground">
                  Join Now
                </Button>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-xl p-5 text-center">
                    <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-display text-2xl font-bold text-foreground">${affiliate.total_earnings.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5 text-center">
                    <DollarSign className="w-8 h-8 text-accent mx-auto mb-2" />
                    <p className="font-display text-2xl font-bold text-foreground">${affiliate.available_balance.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5 text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-display text-2xl font-bold text-foreground">{referrals.length}</p>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                  </div>
                </div>

                {/* Affiliate Link */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <Label className="text-sm font-semibold mb-2 block">Your Affiliate Link</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={`${window.location.origin}/?ref=${affiliate.affiliate_code}`} className="bg-muted" />
                    <Button variant="outline" onClick={copyLink}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Commission rate: {affiliate.commission_rate}%</p>
                </div>

                {/* Request Payout */}
                {affiliate.available_balance > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                    <h4 className="font-display font-bold text-foreground">Request Payout</h4>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Amount ($)</Label>
                        <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Payment Method</Label>
                        <Input value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} placeholder="PayPal, Bank, etc." />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Payment Details</Label>
                        <Input value={payoutDetails} onChange={(e) => setPayoutDetails(e.target.value)} placeholder="Email or account info" />
                      </div>
                    </div>
                    <Button onClick={requestPayout} className="gradient-primary text-primary-foreground">Submit Request</Button>
                  </div>
                )}

                {/* Payout History */}
                {payouts.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h4 className="font-display font-bold text-foreground mb-3">Payout History</h4>
                    <div className="space-y-2">
                      {payouts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <span className="font-medium text-foreground">${p.amount.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground ml-2">{p.payment_method}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referrals List */}
                {referrals.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h4 className="font-display font-bold text-foreground mb-3">Recent Referrals</h4>
                    <div className="space-y-2">
                      {referrals.map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">${r.commission_amount.toFixed(2)}</span>
                            <Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
