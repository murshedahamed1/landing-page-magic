import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, DollarSign, Users } from "lucide-react";

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
}

const DashboardAffiliate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: aff } = await supabase.from("affiliates").select("*").eq("user_id", user!.id).maybeSingle();
    if (aff) {
      setAffiliate(aff);
      const { data: refs } = await supabase.from("affiliate_referrals").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false });
      setReferrals(refs || []);
      const { data: pays } = await supabase.from("payout_requests").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false });
      setPayouts(pays || []);
    }
    setLoading(false);
  };

  const joinAffiliate = async () => {
    const code = `XEN-${user!.id.substring(0, 8).toUpperCase()}`;
    const { data, error } = await supabase.from("affiliates").insert({ user_id: user!.id, affiliate_code: code }).select().single();
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
      affiliate_id: affiliate.id, amount, payment_method: payoutMethod, payment_details: payoutDetails,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout request submitted!" });
      setPayoutAmount(""); setPayoutMethod(""); setPayoutDetails("");
      loadData();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Affiliate Program</h1>

      {!affiliate ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-bold text-xl text-foreground mb-2">Join Our Affiliate Program</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Earn commissions by referring new students. Get your unique affiliate link and start earning.
          </p>
          <Button onClick={joinAffiliate} className="gradient-primary text-primary-foreground">Join Now</Button>
        </div>
      ) : (
        <>
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

          <div className="bg-card border border-border rounded-xl p-5">
            <Label className="text-sm font-semibold mb-2 block">Your Affiliate Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={`${window.location.origin}/?ref=${affiliate.affiliate_code}`} className="bg-muted" />
              <Button variant="outline" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Commission rate: {affiliate.commission_rate}%</p>
          </div>

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
  );
};

export default DashboardAffiliate;
