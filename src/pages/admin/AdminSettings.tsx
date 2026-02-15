import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const settingsConfig = [
  { key: "hero_video_url", label: "Hero Video URL (YouTube)", placeholder: "https://youtube.com/watch?v=..." },
  { key: "hero_title", label: "Hero Title", placeholder: "AI DigiProfit Income Engine" },
  { key: "hero_subtitle", label: "Hero Subtitle", placeholder: "Course description..." },
  { key: "course_price", label: "Course Price ($)", placeholder: "497" },
  { key: "course_original_price", label: "Original Price ($)", placeholder: "997" },
];

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("site_settings").select("*").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s) => (map[s.key] = s.value));
      setSettings(map);
    });
  }, []);

  const saveSetting = async (key: string) => {
    await supabase.from("site_settings").upsert({ key, value: settings[key] || "", updated_at: new Date().toISOString() });
    toast({ title: `Setting "${key}" saved!` });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Site Settings</h1>
      <div className="space-y-4">
        {settingsConfig.map((s) => (
          <div key={s.key} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Label>{s.label}</Label>
            <div className="flex gap-2">
              <Input
                value={settings[s.key] || ""}
                onChange={(e) => setSettings((p) => ({ ...p, [s.key]: e.target.value }))}
                placeholder={s.placeholder}
              />
              <Button variant="outline" onClick={() => saveSetting(s.key)}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
