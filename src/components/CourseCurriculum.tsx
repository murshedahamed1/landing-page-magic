import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Play, Lock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface LessonData {
  id: string;
  title: string;
  duration_minutes: number | null;
  is_preview: boolean;
  sort_order: number;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: LessonData[];
}

const CourseCurriculum = () => {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    // Fetch the first published course
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();

    if (!course) {
      setLoading(false);
      return;
    }

    const { data: mods } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", course.id)
      .order("sort_order");

    const modulesWithLessons: ModuleData[] = [];
    for (const mod of mods || []) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, duration_minutes, is_preview, sort_order")
        .eq("module_id", mod.id)
        .order("sort_order");
      modulesWithLessons.push({
        ...mod,
        lessons: lessons || [],
      });
    }

    setModules(modulesWithLessons);
    if (modulesWithLessons.length > 0) {
      setExpandedModules(new Set([modulesWithLessons[0].id]));
    }
    setLoading(false);
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalDuration = modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0),
    0
  );

  if (loading) {
    return (
      <section id="curriculum" className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Loading curriculum...</p>
        </div>
      </section>
    );
  }

  if (modules.length === 0) {
    return null;
  }

  return (
    <section id="curriculum" className="py-16 lg:py-24 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4 text-primary font-medium">Course Curriculum</Badge>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            What's Inside <span className="text-gradient">the Course</span>
          </h2>
          <div className="flex items-center justify-center gap-6 text-muted-foreground">
            <span>{modules.length} Modules</span>
            <span>•</span>
            <span>{totalLessons} Lessons</span>
            {totalDuration > 0 && (
              <>
                <span>•</span>
                <span>{Math.round(totalDuration / 60)}h {totalDuration % 60}m</span>
              </>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {modules.map((mod, mi) => (
            <div key={mod.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedModules.has(mod.id) ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Module {mi + 1}</span>
                    <h3 className="font-display font-bold text-foreground">{mod.title}</h3>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{mod.lessons.length} lessons</span>
              </button>

              {expandedModules.has(mod.id) && (
                <div className="border-t border-border">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                      {lesson.is_preview ? (
                        <Play className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                      <div className="flex items-center gap-2">
                        {lesson.is_preview && (
                          <Badge variant="secondary" className="text-xs text-primary">Free</Badge>
                        )}
                        {lesson.duration_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration_minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseCurriculum;
