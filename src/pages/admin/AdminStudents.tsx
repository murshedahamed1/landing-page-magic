import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const AdminStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [s, e, c] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*"),
      supabase.from("courses").select("id, title"),
    ]);
    setStudents(s.data || []);
    setEnrollments(e.data || []);
    setCourses(c.data || []);
  };

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));
  const filtered = students.filter((s) =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Students ({students.length})</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-10" />
      </div>

      <div className="space-y-2">
        {filtered.map((s) => {
          const studentEnrollments = enrollments.filter((e) => e.user_id === s.user_id);
          return (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{s.full_name || "No name"}</p>
                  <p className="text-xs text-muted-foreground">{s.email || "No email"} · Joined {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {studentEnrollments.length > 0 ? (
                    studentEnrollments.map((e) => (
                      <Badge key={e.id} variant="default" className="text-xs">
                        {courseMap.get(e.course_id) || "Course"}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs">Not Enrolled</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminStudents;
