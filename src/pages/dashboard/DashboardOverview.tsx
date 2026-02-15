import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, CheckCircle, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ enrolled: 0, completed: 0, totalLessons: 0, completedLessons: 0 });
  const [recentCourse, setRecentCourse] = useState<{ title: string; slug: string; progress: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadOverview();
  }, [user]);

  const loadOverview = async () => {
    const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("user_id", user!.id).eq("status", "active");
    const enrolledCount = enrollments?.length || 0;

    const { data: progress } = await supabase.from("lesson_progress").select("lesson_id, completed").eq("user_id", user!.id);
    const completedLessons = (progress || []).filter((p) => p.completed).length;

    let totalLessons = 0;
    let recent: typeof recentCourse = null;

    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map((e) => e.course_id);
      const { data: courses } = await supabase.from("courses").select("id, title, slug").in("id", courseIds);

      for (const course of courses || []) {
        const { data: mods } = await supabase.from("course_modules").select("id").eq("course_id", course.id);
        if (mods) {
          const modIds = mods.map((m) => m.id);
          const { data: lessons } = await supabase.from("lessons").select("id").in("module_id", modIds);
          const total = lessons?.length || 0;
          totalLessons += total;
          const lessonIds = new Set((lessons || []).map((l) => l.id));
          const done = (progress || []).filter((p) => p.completed && lessonIds.has(p.lesson_id)).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          if (!recent) recent = { title: course.title, slug: course.slug, progress: pct };
        }
      }
    }

    setStats({ enrolled: enrolledCount, completed: 0, totalLessons, completedLessons });
    setRecentCourse(recent);
    setLoading(false);
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Welcome back!</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-display text-2xl font-bold text-foreground">{stats.enrolled}</p>
          <p className="text-sm text-muted-foreground">Enrolled Courses</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="font-display text-2xl font-bold text-foreground">{stats.completedLessons}</p>
          <p className="text-sm text-muted-foreground">Lessons Completed</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <Link2 className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-display text-2xl font-bold text-foreground">{stats.totalLessons}</p>
          <p className="text-sm text-muted-foreground">Total Lessons</p>
        </div>
      </div>

      {recentCourse && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-bold text-foreground mb-2">Continue Learning</h3>
          <p className="text-muted-foreground text-sm mb-3">{recentCourse.title}</p>
          <Progress value={recentCourse.progress} className="h-2 mb-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{recentCourse.progress}% complete</span>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/course")}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {stats.enrolled === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
          <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground">Browse Courses</Button>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
