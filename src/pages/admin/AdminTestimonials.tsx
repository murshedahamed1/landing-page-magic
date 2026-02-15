import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";

interface TestimonialForm {
  id?: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  image_url: string;
  is_visible: boolean;
  sort_order: number;
}

const emptyTestimonial = (): TestimonialForm => ({ name: "", role: "", content: "", rating: 5, image_url: "", is_visible: true, sort_order: 0 });

const AdminTestimonials = () => {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<TestimonialForm[]>([]);
  const [editing, setEditing] = useState<TestimonialForm | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("sort_order");
    setTestimonials((data || []).map((t) => ({ ...t, image_url: t.image_url || "" })));
  };

  const saveTestimonial = async () => {
    if (!editing) return;
    const data = {
      name: editing.name, role: editing.role, content: editing.content,
      rating: editing.rating, image_url: editing.image_url || null,
      is_visible: editing.is_visible, sort_order: editing.sort_order,
    };
    if (editing.id) {
      await supabase.from("testimonials").update(data).eq("id", editing.id);
    } else {
      await supabase.from("testimonials").insert(data);
    }
    toast({ title: "Testimonial saved!" });
    setEditing(null);
    fetchTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    fetchTestimonials();
    toast({ title: "Testimonial deleted" });
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setEditing(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <Button onClick={saveTestimonial} className="gradient-primary text-primary-foreground font-semibold gap-1">
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editing.name} onChange={(e) => setEditing((p) => p ? { ...p, name: e.target.value } : p)} />
            </div>
            <div className="space-y-2">
              <Label>Role / Title</Label>
              <Input value={editing.role} onChange={(e) => setEditing((p) => p ? { ...p, role: e.target.value } : p)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={editing.content} onChange={(e) => setEditing((p) => p ? { ...p, content: e.target.value } : p)} rows={4} />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Rating (1-5)</Label>
              <Input type="number" min={1} max={5} value={editing.rating} onChange={(e) => setEditing((p) => p ? { ...p, rating: parseInt(e.target.value) || 5 } : p)} />
            </div>
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input value={editing.image_url} onChange={(e) => setEditing((p) => p ? { ...p, image_url: e.target.value } : p)} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={editing.sort_order} onChange={(e) => setEditing((p) => p ? { ...p, sort_order: parseInt(e.target.value) || 0 } : p)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={editing.is_visible} onCheckedChange={(checked) => setEditing((p) => p ? { ...p, is_visible: checked } : p)} />
            <Label>Visible on landing page</Label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Testimonials</h1>
        <Button onClick={() => setEditing(emptyTestimonial())} className="gradient-primary text-primary-foreground font-semibold gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>
      {testimonials.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <p className="text-muted-foreground mb-4">No testimonials yet.</p>
          <Button onClick={() => setEditing(emptyTestimonial())} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Add Testimonial
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{t.name}</h3>
                <p className="text-sm text-muted-foreground">{t.role} · {t.is_visible ? "Visible" : "Hidden"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(t)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteTestimonial(t.id!)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
