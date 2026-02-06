import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, LogOut, ArrowLeft, Save, ChevronDown, ChevronRight } from "lucide-react";

interface Lesson {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number | null;
  sort_order: number;
  is_preview: boolean;
}

interface Module {
  id?: string;
  title: string;
  description: string;
  sort_order: number;
  lessons: Lesson[];
  expanded?: boolean;
}

interface CourseForm {
  id?: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  price: string;
  original_price: string;
  is_published: boolean;
}

const emptyLesson = (): Lesson => ({
  title: "",
  description: "",
  video_url: "",
  duration_minutes: null,
  sort_order: 0,
  is_preview: false,
});

const emptyModule = (): Module => ({
  title: "",
  description: "",
  sort_order: 0,
  lessons: [emptyLesson()],
  expanded: true,
});

const emptyCourse = (): CourseForm => ({
  title: "",
  slug: "",
  description: "",
  short_description: "",
  thumbnail_url: "",
  price: "0",
  original_price: "",
  is_published: false,
});

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseForm | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "edit">("list");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user && !isAdmin) {
      toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
      navigate("/");
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchCourses();
  }, [isAdmin]);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data || []);
  };

  const startNewCourse = () => {
    setEditingCourse(emptyCourse());
    setModules([emptyModule()]);
    setView("edit");
  };

  const editCourse = async (course: any) => {
    setEditingCourse({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description || "",
      short_description: course.short_description || "",
      thumbnail_url: course.thumbnail_url || "",
      price: String(course.price),
      original_price: course.original_price ? String(course.original_price) : "",
      is_published: course.is_published,
    });

    const { data: mods } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", course.id)
      .order("sort_order");

    const modulesWithLessons: Module[] = [];
    for (const mod of mods || []) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", mod.id)
        .order("sort_order");
      modulesWithLessons.push({
        id: mod.id,
        title: mod.title,
        description: mod.description || "",
        sort_order: mod.sort_order,
        lessons: (lessons || []).map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description || "",
          video_url: l.video_url || "",
          duration_minutes: l.duration_minutes,
          sort_order: l.sort_order,
          is_preview: l.is_preview,
        })),
        expanded: false,
      });
    }
    setModules(modulesWithLessons.length ? modulesWithLessons : [emptyModule()]);
    setView("edit");
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const saveCourse = async () => {
    if (!editingCourse || !user) return;
    setSaving(true);
    try {
      const courseData = {
        title: editingCourse.title,
        slug: editingCourse.slug || generateSlug(editingCourse.title),
        description: editingCourse.description,
        short_description: editingCourse.short_description,
        thumbnail_url: editingCourse.thumbnail_url,
        price: parseFloat(editingCourse.price) || 0,
        original_price: editingCourse.original_price ? parseFloat(editingCourse.original_price) : null,
        is_published: editingCourse.is_published,
        created_by: user.id,
      };

      let courseId = editingCourse.id;
      if (courseId) {
        await supabase.from("courses").update(courseData).eq("id", courseId);
      } else {
        const { data } = await supabase.from("courses").insert(courseData).select("id").single();
        courseId = data?.id;
      }

      if (!courseId) throw new Error("Failed to save course");

      // Delete existing modules/lessons and recreate
      if (editingCourse.id) {
        await supabase.from("course_modules").delete().eq("course_id", courseId);
      }

      for (let mi = 0; mi < modules.length; mi++) {
        const mod = modules[mi];
        const { data: savedMod } = await supabase
          .from("course_modules")
          .insert({ course_id: courseId, title: mod.title, description: mod.description, sort_order: mi })
          .select("id")
          .single();

        if (savedMod) {
          for (let li = 0; li < mod.lessons.length; li++) {
            const lesson = mod.lessons[li];
            await supabase.from("lessons").insert({
              module_id: savedMod.id,
              title: lesson.title,
              description: lesson.description,
              video_url: lesson.video_url,
              duration_minutes: lesson.duration_minutes,
              sort_order: li,
              is_preview: lesson.is_preview,
            });
          }
        }
      }

      toast({ title: "Course saved successfully!" });
      fetchCourses();
      setView("list");
    } catch (err: any) {
      toast({ title: "Error saving course", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    await supabase.from("courses").delete().eq("id", id);
    fetchCourses();
    toast({ title: "Course deleted" });
  };

  const updateModule = (index: number, field: string, value: any) => {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const updateLesson = (modIndex: number, lessonIndex: number, field: string, value: any) => {
    setModules((prev) =>
      prev.map((m, mi) =>
        mi === modIndex
          ? { ...m, lessons: m.lessons.map((l, li) => (li === lessonIndex ? { ...l, [field]: value } : l)) }
          : m
      )
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm" style={{ fontFamily: "'Space Grotesk'" }}>X</span>
            </div>
            <h1 className="font-bold text-lg text-foreground" style={{ fontFamily: "'Space Grotesk'" }}>Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Site
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Log Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {view === "list" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk'" }}>Courses</h2>
              <Button onClick={startNewCourse} className="gradient-primary text-primary-foreground font-semibold gap-1">
                <Plus className="w-4 h-4" /> New Course
              </Button>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground mb-4">No courses yet. Create your first course!</p>
                <Button onClick={startNewCourse} className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1" /> Create Course
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${course.price} · {course.is_published ? "Published" : "Draft"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editCourse(course)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCourse(course.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setView("list")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Courses
              </Button>
              <Button onClick={saveCourse} disabled={saving} className="gradient-primary text-primary-foreground font-semibold gap-1">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Course"}
              </Button>
            </div>

            {/* Course Details */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
              <h3 className="font-bold text-lg text-foreground" style={{ fontFamily: "'Space Grotesk'" }}>Course Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editingCourse?.title || ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditingCourse((prev) => prev ? { ...prev, title, slug: generateSlug(title) } : prev);
                    }}
                    placeholder="Course title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editingCourse?.slug || ""}
                    onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, slug: e.target.value } : prev)}
                    placeholder="course-slug"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={editingCourse?.short_description || ""}
                  onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, short_description: e.target.value } : prev)}
                  placeholder="Brief course summary"
                />
              </div>
              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={editingCourse?.description || ""}
                  onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                  placeholder="Detailed course description"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input
                  value={editingCourse?.thumbnail_url || ""}
                  onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, thumbnail_url: e.target.value } : prev)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={editingCourse?.price || ""}
                    onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, price: e.target.value } : prev)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Original Price ($)</Label>
                  <Input
                    type="number"
                    value={editingCourse?.original_price || ""}
                    onChange={(e) => setEditingCourse((prev) => prev ? { ...prev, original_price: e.target.value } : prev)}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={editingCourse?.is_published || false}
                    onCheckedChange={(checked) => setEditingCourse((prev) => prev ? { ...prev, is_published: checked } : prev)}
                  />
                  <Label>Published</Label>
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground" style={{ fontFamily: "'Space Grotesk'" }}>Modules & Lessons</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModules((prev) => [...prev, { ...emptyModule(), sort_order: prev.length }])}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Module
                </Button>
              </div>

              {modules.map((mod, mi) => (
                <div key={mi} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Module header */}
                  <div className="p-4 flex items-center gap-3 border-b border-border bg-muted/30">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <button onClick={() => updateModule(mi, "expanded", !mod.expanded)} className="text-muted-foreground">
                      {mod.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Input
                      value={mod.title}
                      onChange={(e) => updateModule(mi, "title", e.target.value)}
                      placeholder={`Module ${mi + 1} title`}
                      className="flex-1 font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModules((prev) => prev.filter((_, i) => i !== mi))}
                      disabled={modules.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  {mod.expanded && (
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Module Description</Label>
                        <Input
                          value={mod.description}
                          onChange={(e) => updateModule(mi, "description", e.target.value)}
                          placeholder="Module description"
                        />
                      </div>

                      {/* Lessons */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Lessons</Label>
                        {mod.lessons.map((lesson, li) => (
                          <div key={li} className="border border-border rounded-lg p-3 space-y-3 bg-background">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">L{li + 1}</span>
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLesson(mi, li, "title", e.target.value)}
                                placeholder="Lesson title"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setModules((prev) =>
                                    prev.map((m, i) =>
                                      i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m
                                    )
                                  )
                                }
                                disabled={mod.lessons.length <= 1}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2">
                              <Input
                                value={lesson.video_url}
                                onChange={(e) => updateLesson(mi, li, "video_url", e.target.value)}
                                placeholder="Video URL (YouTube/Vimeo)"
                              />
                              <Input
                                type="number"
                                value={lesson.duration_minutes ?? ""}
                                onChange={(e) => updateLesson(mi, li, "duration_minutes", e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Duration (min)"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lesson.is_preview}
                                onCheckedChange={(checked) => updateLesson(mi, li, "is_preview", checked)}
                              />
                              <Label className="text-xs">Free Preview</Label>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setModules((prev) =>
                              prev.map((m, i) =>
                                i === mi
                                  ? { ...m, lessons: [...m.lessons, { ...emptyLesson(), sort_order: m.lessons.length }] }
                                  : m
                              )
                            )
                          }
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Lesson
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
