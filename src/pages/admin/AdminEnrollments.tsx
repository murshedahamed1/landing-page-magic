import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2 } from "lucide-react";

const AdminEnrollments = () => {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [e, c, p] = await Promise.all([
      supabase.from("enrollments").select("*").order("enrolled_at", { ascending: false }),
      supabase.from("courses").select("id, title"),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);
    setEnrollments(e.data || []);
    setCourses(c.data || []);
    setProfiles(p.data || []);
  };

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  const manualEnroll = async () => {
    if (!enrollEmail || !enrollCourseId) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    // Find user by email
    const matched = profiles.find((p) => (p.email || "").toLowerCase() === enrollEmail.toLowerCase());
    if (!matched) {
      toast({ title: "Student not found", description: "No student with that email address.", variant: "destructive" });
      return;
    }

    // Check if already enrolled
    const existing = enrollments.find((e) => e.user_id === matched.user_id && e.course_id === enrollCourseId);
    if (existing) {
      toast({ title: "Already enrolled", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("enrollments").insert({ user_id: matched.user_id, course_id: enrollCourseId, status: "active" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student enrolled!" });
      setEnrollEmail("");
      loadData();
    }
  };

  const removeEnrollment = async (id: string) => {
    if (!confirm("Remove this enrollment?")) return;
    await supabase.from("enrollments").delete().eq("id", id);
    toast({ title: "Enrollment removed" });
    loadData();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Enrollments</h1>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> Manual Enrollment
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Student Email</Label>
            <Input value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} placeholder="student@email.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Course</Label>
            <select value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={manualEnroll} className="gradient-primary text-primary-foreground w-full">Enroll</Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {enrollments.map((e) => {
          const profile = profileMap.get(e.user_id);
          return (
            <div key={e.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{profile?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  {courseMap.get(e.course_id) || "Unknown Course"} · {new Date(e.enrolled_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
                <Button size="sm" variant="destructive" onClick={() => removeEnrollment(e.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminEnrollments;
