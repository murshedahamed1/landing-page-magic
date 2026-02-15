import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

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

const emptyLesson = (): Lesson => ({ title: "", description: "", video_url: "", duration_minutes: null, sort_order: 0, is_preview: false });
const emptyModule = (): Module => ({ title: "", description: "", sort_order: 0, lessons: [emptyLesson()], expanded: true });
const emptyCourse = (): CourseForm => ({ title: "", slug: "", description: "", short_description: "", thumbnail_url: "", price: "0", original_price: "", is_published: false });

const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const AdminCourseEdit = () => {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<CourseForm>(emptyCourse());
  const [modules, setModules] = useState<Module[]>([emptyModule()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && id) loadCourse(id);
  }, [id]);

  const loadCourse = async (courseId: string) => {
    const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).single();
    if (!c) { navigate("/admin/courses"); return; }
    setCourse({
      id: c.id, title: c.title, slug: c.slug,
      description: c.description || "", short_description: c.short_description || "",
      thumbnail_url: c.thumbnail_url || "", price: String(c.price),
      original_price: c.original_price ? String(c.original_price) : "", is_published: c.is_published,
    });
    const { data: mods } = await supabase.from("course_modules").select("*").eq("course_id", courseId).order("sort_order");
    const modulesWithLessons: Module[] = [];
    for (const mod of mods || []) {
      const { data: lessons } = await supabase.from("lessons").select("*").eq("module_id", mod.id).order("sort_order");
      modulesWithLessons.push({
        id: mod.id, title: mod.title, description: mod.description || "", sort_order: mod.sort_order,
        lessons: (lessons || []).map((l) => ({ id: l.id, title: l.title, description: l.description || "", video_url: l.video_url || "", duration_minutes: l.duration_minutes, sort_order: l.sort_order, is_preview: l.is_preview })),
        expanded: false,
      });
    }
    setModules(modulesWithLessons.length ? modulesWithLessons : [emptyModule()]);
    setLoading(false);
  };

  const saveCourse = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const courseData = {
        title: course.title, slug: course.slug || generateSlug(course.title),
        description: course.description, short_description: course.short_description,
        thumbnail_url: course.thumbnail_url, price: parseFloat(course.price) || 0,
        original_price: course.original_price ? parseFloat(course.original_price) : null,
        is_published: course.is_published, created_by: user.id,
      };

      let courseId = course.id;
      if (courseId) {
        await supabase.from("courses").update(courseData).eq("id", courseId);
      } else {
        const { data } = await supabase.from("courses").insert(courseData).select("id").single();
        courseId = data?.id;
      }
      if (!courseId) throw new Error("Failed to save course");

      // Delete old modules (cascade deletes lessons)
      if (course.id) {
        await supabase.from("course_modules").delete().eq("course_id", courseId);
      }

      for (let mi = 0; mi < modules.length; mi++) {
        const mod = modules[mi];
        const { data: savedMod } = await supabase.from("course_modules").insert({
          course_id: courseId, title: mod.title, description: mod.description, sort_order: mi,
        }).select("id").single();
        if (savedMod) {
          for (let li = 0; li < mod.lessons.length; li++) {
            const lesson = mod.lessons[li];
            await supabase.from("lessons").insert({
              module_id: savedMod.id, title: lesson.title, description: lesson.description,
              video_url: lesson.video_url, duration_minutes: lesson.duration_minutes,
              sort_order: li, is_preview: lesson.is_preview,
            });
          }
        }
      }

      toast({ title: "Course saved successfully!" });
      navigate("/admin/courses");
    } catch (err: any) {
      toast({ title: "Error saving course", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateModule = (index: number, field: string, value: any) => {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const updateLesson = (mi: number, li: number, field: string, value: any) => {
    setModules((prev) => prev.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, [field]: value } : l)) } : m));
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/admin/courses")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <Button onClick={saveCourse} disabled={saving} className="gradient-primary text-primary-foreground font-semibold gap-1">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Course"}
        </Button>
      </div>

      {/* Course Details */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-display font-bold text-lg text-foreground">Course Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={course.title} onChange={(e) => { const title = e.target.value; setCourse((p) => ({ ...p, title, slug: generateSlug(title) })); }} placeholder="Course title" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={course.slug} onChange={(e) => setCourse((p) => ({ ...p, slug: e.target.value }))} placeholder="course-slug" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Short Description</Label>
          <Input value={course.short_description} onChange={(e) => setCourse((p) => ({ ...p, short_description: e.target.value }))} placeholder="Brief summary" />
        </div>
        <div className="space-y-2">
          <Label>Full Description</Label>
          <Textarea value={course.description} onChange={(e) => setCourse((p) => ({ ...p, description: e.target.value }))} rows={4} />
        </div>
        <div className="space-y-2">
          <Label>Thumbnail URL</Label>
          <Input value={course.thumbnail_url} onChange={(e) => setCourse((p) => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Price ($)</Label>
            <Input type="number" value={course.price} onChange={(e) => setCourse((p) => ({ ...p, price: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Original Price ($)</Label>
            <Input type="number" value={course.original_price} onChange={(e) => setCourse((p) => ({ ...p, original_price: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={course.is_published} onCheckedChange={(checked) => setCourse((p) => ({ ...p, is_published: checked }))} />
            <Label>Published</Label>
          </div>
        </div>
      </div>

      {/* Modules & Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-foreground">Modules & Lessons</h3>
          <Button variant="outline" size="sm" onClick={() => setModules((prev) => [...prev, { ...emptyModule(), sort_order: prev.length }])}>
            <Plus className="w-4 h-4 mr-1" /> Add Module
          </Button>
        </div>

        {modules.map((mod, mi) => (
          <div key={mi} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-border bg-muted/30">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <button onClick={() => updateModule(mi, "expanded", !mod.expanded)} className="text-muted-foreground">
                {mod.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <Input value={mod.title} onChange={(e) => updateModule(mi, "title", e.target.value)} placeholder={`Module ${mi + 1} title`} className="flex-1 font-medium" />
              <Button variant="ghost" size="sm" onClick={() => setModules((prev) => prev.filter((_, i) => i !== mi))} disabled={modules.length <= 1}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            {mod.expanded && (
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Module Description</Label>
                  <Input value={mod.description} onChange={(e) => updateModule(mi, "description", e.target.value)} placeholder="Module description" />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Lessons</Label>
                  {mod.lessons.map((lesson, li) => (
                    <div key={li} className="border border-border rounded-lg p-3 space-y-3 bg-background">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">L{li + 1}</span>
                        <Input value={lesson.title} onChange={(e) => updateLesson(mi, li, "title", e.target.value)} placeholder="Lesson title" className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => setModules((prev) => prev.map((m, i) => i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m))} disabled={mod.lessons.length <= 1}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2">
                        <Input value={lesson.video_url} onChange={(e) => updateLesson(mi, li, "video_url", e.target.value)} placeholder="Video URL (YouTube/Vimeo)" />
                        <Input type="number" value={lesson.duration_minutes ?? ""} onChange={(e) => updateLesson(mi, li, "duration_minutes", e.target.value ? parseInt(e.target.value) : null)} placeholder="Duration (min)" />
                      </div>
                      <Textarea value={lesson.description} onChange={(e) => updateLesson(mi, li, "description", e.target.value)} placeholder="Lesson description / text content" rows={2} />
                      <div className="flex items-center gap-2">
                        <Switch checked={lesson.is_preview} onCheckedChange={(checked) => updateLesson(mi, li, "is_preview", checked)} />
                        <Label className="text-xs">Free Preview</Label>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setModules((prev) => prev.map((m, i) => i === mi ? { ...m, lessons: [...m.lessons, { ...emptyLesson(), sort_order: m.lessons.length }] } : m))}>
                    <Plus className="w-3 h-3 mr-1" /> Add Lesson
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCourseEdit;
