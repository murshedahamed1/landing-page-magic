import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const AdminCourses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data || []);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Delete this course and all its content?")) return;
    await supabase.from("courses").delete().eq("id", id);
    fetchCourses();
    toast({ title: "Course deleted" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Courses</h1>
        <Button onClick={() => navigate("/admin/courses/new")} className="gradient-primary text-primary-foreground font-semibold gap-1">
          <Plus className="w-4 h-4" /> New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <p className="text-muted-foreground mb-4">No courses yet.</p>
          <Button onClick={() => navigate("/admin/courses/new")} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Create Course
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{course.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">${course.price}</span>
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteCourse(course.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
