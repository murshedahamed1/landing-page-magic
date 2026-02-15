import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const DashboardProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setFullName(data.full_name || "");
    });
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!" });
      setNewPassword("");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-display font-bold text-foreground">Personal Information</h3>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <Button onClick={updateProfile} disabled={saving} className="gradient-primary text-primary-foreground">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-display font-bold text-foreground">Change Password</h3>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button onClick={updatePassword} disabled={saving} variant="outline">
          Update Password
        </Button>
      </div>
    </div>
  );
};

export default DashboardProfile;
