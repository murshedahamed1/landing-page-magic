import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EnrolledCourse {
  enrollment_id: string;
  course_id: string;
  title: string;
  enrolled_at: string;
  status: string;
  progress: number;
  completed: number;
  total: number;
}

const DashboardCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    const { data: enrollments } = await supabase.from("enrollments").select("*").eq("user_id", user!.id);
    if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

    const courseIds = enrollments.map((e) => e.course_id);
    const { data: coursesData } = await supabase.from("courses").select("id, title").in("id", courseIds);
    const courseMap = new Map((coursesData || []).map((c) => [c.id, c.title]));

    const { data: progress } = await supabase.from("lesson_progress").select("lesson_id, completed").eq("user_id", user!.id);

    const result: EnrolledCourse[] = [];
    for (const enrollment of enrollments) {
      const { data: mods } = await supabase.from("course_modules").select("id").eq("course_id", enrollment.course_id);
      let total = 0, completed = 0;
      if (mods) {
        const modIds = mods.map((m) => m.id);
        const { data: lessons } = await supabase.from("lessons").select("id").in("module_id", modIds);
        total = lessons?.length || 0;
        const lessonIds = new Set((lessons || []).map((l) => l.id));
        completed = (progress || []).filter((p) => p.completed && lessonIds.has(p.lesson_id)).length;
      }
      result.push({
        enrollment_id: enrollment.id,
        course_id: enrollment.course_id,
        title: courseMap.get(enrollment.course_id) || "Unknown",
        enrolled_at: enrollment.enrolled_at,
        status: enrollment.status,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total,
      });
    }
    setCourses(result);
    setLoading(false);
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">My Courses</h1>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
          <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground">Browse Courses</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.enrollment_id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg">{course.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant={course.status === "active" ? "default" : "secondary"}>{course.status}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Enrolled {new Date(course.enrolled_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button onClick={() => navigate("/course")} className="gradient-primary text-primary-foreground">Continue</Button>
              </div>
              {course.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{course.completed} / {course.total} lessons completed</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardCourses;
