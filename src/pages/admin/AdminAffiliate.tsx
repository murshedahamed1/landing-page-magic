import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Users, Check } from "lucide-react";

const AdminAffiliate = () => {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [a, p, pr] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("payout_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);
    setAffiliates(a.data || []);
    setPayouts(p.data || []);
    setProfiles(pr.data || []);
  };

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
  const affiliateMap = new Map((affiliates || []).map((a) => [a.id, a]));

  const markPaid = async (id: string) => {
    await supabase.from("payout_requests").update({ status: "paid", processed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Payout marked as paid" });
    loadData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("affiliates").update({ is_active: !current }).eq("id", id);
    toast({ title: `Affiliate ${current ? "disabled" : "enabled"}` });
    loadData();
  };

  const totalEarnings = affiliates.reduce((s, a) => s + (a.total_earnings || 0), 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Affiliate Management</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <Users className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-display text-2xl font-bold text-foreground">{affiliates.length}</p>
          <p className="text-sm text-muted-foreground">Total Affiliates</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <DollarSign className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="font-display text-2xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total Commissions</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <DollarSign className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="font-display text-2xl font-bold text-foreground">{pendingPayouts.length}</p>
          <p className="text-sm text-muted-foreground">Pending Payouts</p>
        </div>
      </div>

      {/* Pending Payouts */}
      {pendingPayouts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-bold text-foreground mb-3">Pending Payout Requests</h3>
          <div className="space-y-2">
            {pendingPayouts.map((p) => {
              const aff = affiliateMap.get(p.affiliate_id);
              const profile = aff ? profileMap.get(aff.user_id) : null;
              return (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{profile?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">${p.amount.toFixed(2)} via {p.payment_method} · {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" onClick={() => markPaid(p.id)} className="gradient-primary text-primary-foreground gap-1">
                    <Check className="w-3 h-3" /> Mark Paid
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Affiliates List */}
      <div>
        <h3 className="font-display font-bold text-foreground mb-3">All Affiliates</h3>
        <div className="space-y-2">
          {affiliates.map((a) => {
            const profile = profileMap.get(a.user_id);
            return (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{profile?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    Code: {a.affiliate_code} · Earned: ${a.total_earnings.toFixed(2)} · Balance: ${a.available_balance.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.is_active ? "default" : "secondary"}>{a.is_active ? "Active" : "Disabled"}</Badge>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(a.id, a.is_active)}>
                    {a.is_active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminAffiliate;
