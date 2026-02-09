import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Play, Lock, CheckCircle, ArrowLeft, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
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

const Course = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadCourse();
  }, [user]);

  const loadCourse = async () => {
    // Get the first published course
    const { data: course } = await supabase
      .from("courses")
      .select("id, title")
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();

    if (!course) {
      setLoading(false);
      return;
    }

    setCourseId(course.id);
    setCourseTitle(course.title);

    // Check enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", course.id)
      .eq("user_id", user!.id)
      .eq("status", "active")
      .maybeSingle();

    setIsEnrolled(!!enrollment);

    // Fetch modules
    const { data: mods } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", course.id)
      .order("sort_order");

    const modulesWithLessons: ModuleData[] = [];
    for (const mod of mods || []) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("*")
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
      // Auto-select first lesson
      if (modulesWithLessons[0].lessons.length > 0) {
        setActiveLesson(modulesWithLessons[0].lessons[0]);
      }
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

  const selectLesson = (lesson: LessonData) => {
    if (!isEnrolled && !lesson.is_preview) {
      toast({ title: "Enrollment required", description: "Please enroll to access this lesson.", variant: "destructive" });
      return;
    }
    setActiveLesson(lesson);
  };

  const getVideoEmbed = (url: string) => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="font-display font-bold text-foreground truncate">{courseTitle}</h1>
          </div>
          {!isEnrolled && (
            <Button className="gradient-primary text-primary-foreground font-semibold" onClick={() => toast({ title: "Coming soon", description: "Payment integration will be added soon." })}>
              Enroll — $497
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        {/* Video Area */}
        <div className="flex-1 bg-foreground/5">
          {activeLesson ? (
            <div>
              {activeLesson.video_url ? (
                <div className="aspect-video w-full bg-foreground">
                  <iframe
                    src={getVideoEmbed(activeLesson.video_url) || ""}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No video available for this lesson</p>
                </div>
              )}
              <div className="p-6">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">{activeLesson.title}</h2>
                {activeLesson.description && (
                  <p className="text-muted-foreground">{activeLesson.description}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </div>
          )}
        </div>

        {/* Sidebar - Curriculum */}
        <div className="w-full lg:w-96 border-l border-border bg-card overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-bold text-foreground">Course Content</h3>
          </div>
          {modules.map((mod, mi) => (
            <div key={mod.id} className="border-b border-border">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {expandedModules.has(mod.id) ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <span className="text-xs text-muted-foreground">Module {mi + 1}</span>
                    <p className="font-semibold text-sm text-foreground">{mod.title}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{mod.lessons.length} lessons</span>
              </button>
              {expandedModules.has(mod.id) && (
                <div>
                  {mod.lessons.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const canAccess = isEnrolled || lesson.is_preview;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson)}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                          isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/30"
                        } ${!canAccess ? "opacity-50" : ""}`}
                      >
                        {canAccess ? (
                          <Play className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{lesson.title}</p>
                          {lesson.duration_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {lesson.duration_minutes}m
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Course;
