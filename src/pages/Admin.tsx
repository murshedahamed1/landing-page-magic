import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, LogOut, ArrowLeft, Save, ChevronDown, ChevronRight, Users, BookOpen, Star, Settings, UserPlus } from "lucide-react";

// ---- Types ----
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

const emptyLesson = (): Lesson => ({ title: "", description: "", video_url: "", duration_minutes: null, sort_order: 0, is_preview: false });
const emptyModule = (): Module => ({ title: "", description: "", sort_order: 0, lessons: [emptyLesson()], expanded: true });
const emptyCourse = (): CourseForm => ({ title: "", slug: "", description: "", short_description: "", thumbnail_url: "", price: "0", original_price: "", is_published: false });
const emptyTestimonial = (): TestimonialForm => ({ name: "", role: "", content: "", rating: 5, image_url: "", is_visible: true, sort_order: 0 });

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"courses" | "students" | "testimonials" | "settings">("courses");

  // Course state
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseForm | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "edit">("list");

  // Students state
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState("");

  // Testimonials state
  const [testimonials, setTestimonials] = useState<TestimonialForm[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialForm | null>(null);

  // Settings state
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user && !isAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      navigate("/");
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCourses();
      fetchStudents();
      fetchTestimonials();
      fetchSettings();
    }
  }, [isAdmin]);

  // ---- Fetch functions ----
  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data || []);
  };

  const fetchStudents = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setStudents(profiles || []);
    const { data: enr } = await supabase.from("enrollments").select("*").order("enrolled_at", { ascending: false });
    setEnrollments(enr || []);
  };

  const fetchTestimonials = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("sort_order");
    setTestimonials((data || []).map((t) => ({ ...t, image_url: t.image_url || "" })));
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    const map: Record<string, string> = {};
    (data || []).forEach((s) => (map[s.key] = s.value));
    setSiteSettings(map);
  };

  // ---- Course functions ----
  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const startNewCourse = () => {
    setEditingCourse(emptyCourse());
    setModules([emptyModule()]);
    setView("edit");
  };

  const editCourse = async (course: any) => {
    setEditingCourse({
      id: course.id, title: course.title, slug: course.slug,
      description: course.description || "", short_description: course.short_description || "",
      thumbnail_url: course.thumbnail_url || "", price: String(course.price),
      original_price: course.original_price ? String(course.original_price) : "", is_published: course.is_published,
    });

    const { data: mods } = await supabase.from("course_modules").select("*").eq("course_id", course.id).order("sort_order");
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
    setView("edit");
  };

  const saveCourse = async () => {
    if (!editingCourse || !user) return;
    setSaving(true);
    try {
      const courseData = {
        title: editingCourse.title, slug: editingCourse.slug || generateSlug(editingCourse.title),
        description: editingCourse.description, short_description: editingCourse.short_description,
        thumbnail_url: editingCourse.thumbnail_url, price: parseFloat(editingCourse.price) || 0,
        original_price: editingCourse.original_price ? parseFloat(editingCourse.original_price) : null,
        is_published: editingCourse.is_published, created_by: user.id,
      };

      let courseId = editingCourse.id;
      if (courseId) {
        await supabase.from("courses").update(courseData).eq("id", courseId);
      } else {
        const { data } = await supabase.from("courses").insert(courseData).select("id").single();
        courseId = data?.id;
      }
      if (!courseId) throw new Error("Failed to save course");

      if (editingCourse.id) {
        await supabase.from("course_modules").delete().eq("course_id", courseId);
      }

      for (let mi = 0; mi < modules.length; mi++) {
        const mod = modules[mi];
        const { data: savedMod } = await supabase.from("course_modules").insert({ course_id: courseId, title: mod.title, description: mod.description, sort_order: mi }).select("id").single();
        if (savedMod) {
          for (let li = 0; li < mod.lessons.length; li++) {
            const lesson = mod.lessons[li];
            await supabase.from("lessons").insert({ module_id: savedMod.id, title: lesson.title, description: lesson.description, video_url: lesson.video_url, duration_minutes: lesson.duration_minutes, sort_order: li, is_preview: lesson.is_preview });
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
    if (!confirm("Delete this course?")) return;
    await supabase.from("courses").delete().eq("id", id);
    fetchCourses();
    toast({ title: "Course deleted" });
  };

  const updateModule = (index: number, field: string, value: any) => {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const updateLesson = (modIndex: number, lessonIndex: number, field: string, value: any) => {
    setModules((prev) => prev.map((m, mi) => mi === modIndex ? { ...m, lessons: m.lessons.map((l, li) => (li === lessonIndex ? { ...l, [field]: value } : l)) } : m));
  };

  // ---- Student/Enrollment functions ----
  const manualEnroll = async () => {
    if (!enrollEmail || !enrollCourseId) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    // Find user by email from profiles - we need to match
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("full_name", enrollEmail).maybeSingle();
    
    // Try finding by iterating students
    const matchedStudent = students.find((s) => s.full_name?.toLowerCase() === enrollEmail.toLowerCase());
    const userId = matchedStudent?.user_id;
    
    if (!userId) {
      toast({ title: "Student not found", description: "Enter the exact full name of a registered student.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("enrollments").insert({ user_id: userId, course_id: enrollCourseId, status: "active" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student enrolled!" });
      setEnrollEmail("");
      fetchStudents();
    }
  };

  // ---- Testimonial functions ----
  const saveTestimonial = async () => {
    if (!editingTestimonial) return;
    const data = {
      name: editingTestimonial.name, role: editingTestimonial.role, content: editingTestimonial.content,
      rating: editingTestimonial.rating, image_url: editingTestimonial.image_url || null,
      is_visible: editingTestimonial.is_visible, sort_order: editingTestimonial.sort_order,
    };

    if (editingTestimonial.id) {
      await supabase.from("testimonials").update(data).eq("id", editingTestimonial.id);
    } else {
      await supabase.from("testimonials").insert(data);
    }
    toast({ title: "Testimonial saved!" });
    setEditingTestimonial(null);
    fetchTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    fetchTestimonials();
    toast({ title: "Testimonial deleted" });
  };

  // ---- Settings functions ----
  const saveSetting = async (key: string, value: string) => {
    await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    toast({ title: `Setting "${key}" saved!` });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">X</span>
            </div>
            <h1 className="font-display font-bold text-lg text-foreground">Admin Panel</h1>
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

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { id: "courses" as const, label: "Courses", icon: BookOpen },
            { id: "students" as const, label: "Students", icon: Users },
            { id: "testimonials" as const, label: "Testimonials", icon: Star },
            { id: "settings" as const, label: "Settings", icon: Settings },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setView("list"); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* ============ COURSES TAB ============ */}
        {activeTab === "courses" && view === "list" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Courses</h2>
              <Button onClick={startNewCourse} className="gradient-primary text-primary-foreground font-semibold gap-1">
                <Plus className="w-4 h-4" /> New Course
              </Button>
            </div>
            {courses.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground mb-4">No courses yet.</p>
                <Button onClick={startNewCourse} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Create Course</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">${course.price} · {course.is_published ? "Published" : "Draft"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editCourse(course)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCourse(course.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "courses" && view === "edit" && editingCourse && (
          <>
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setView("list")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              <Button onClick={saveCourse} disabled={saving} className="gradient-primary text-primary-foreground font-semibold gap-1">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Course"}
              </Button>
            </div>

            {/* Course Details */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
              <h3 className="font-display font-bold text-lg text-foreground">Course Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editingCourse.title} onChange={(e) => { const title = e.target.value; setEditingCourse((p) => p ? { ...p, title, slug: generateSlug(title) } : p); }} placeholder="Course title" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={editingCourse.slug} onChange={(e) => setEditingCourse((p) => p ? { ...p, slug: e.target.value } : p)} placeholder="course-slug" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input value={editingCourse.short_description} onChange={(e) => setEditingCourse((p) => p ? { ...p, short_description: e.target.value } : p)} placeholder="Brief summary" />
              </div>
              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea value={editingCourse.description} onChange={(e) => setEditingCourse((p) => p ? { ...p, description: e.target.value } : p)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={editingCourse.thumbnail_url} onChange={(e) => setEditingCourse((p) => p ? { ...p, thumbnail_url: e.target.value } : p)} placeholder="https://..." />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input type="number" value={editingCourse.price} onChange={(e) => setEditingCourse((p) => p ? { ...p, price: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>Original Price ($)</Label>
                  <Input type="number" value={editingCourse.original_price} onChange={(e) => setEditingCourse((p) => p ? { ...p, original_price: e.target.value } : p)} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={editingCourse.is_published} onCheckedChange={(checked) => setEditingCourse((p) => p ? { ...p, is_published: checked } : p)} />
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
          </>
        )}

        {/* ============ STUDENTS TAB ============ */}
        {activeTab === "students" && (
          <>
            {/* Manual Enroll */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Manual Enrollment
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Student Full Name</Label>
                  <Input value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} placeholder="Exact full name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Course</Label>
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={manualEnroll} className="gradient-primary text-primary-foreground w-full">Enroll</Button>
                </div>
              </div>
            </div>

            {/* Students List */}
            <h3 className="font-display font-bold text-lg text-foreground mb-4">Registered Students ({students.length})</h3>
            <div className="space-y-2">
              {students.map((s) => {
                const studentEnrollments = enrollments.filter((e) => e.user_id === s.user_id);
                return (
                  <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{s.full_name || "No name"}</p>
                        <p className="text-xs text-muted-foreground">Joined {new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        {studentEnrollments.length > 0 ? (
                          studentEnrollments.map((e) => (
                            <Badge key={e.id} variant={e.status === "active" ? "default" : "secondary"} className="text-xs">
                              Enrolled
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
          </>
        )}

        {/* ============ TESTIMONIALS TAB ============ */}
        {activeTab === "testimonials" && !editingTestimonial && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Testimonials</h2>
              <Button onClick={() => setEditingTestimonial(emptyTestimonial())} className="gradient-primary text-primary-foreground font-semibold gap-1">
                <Plus className="w-4 h-4" /> Add Testimonial
              </Button>
            </div>
            {testimonials.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground mb-4">No testimonials yet.</p>
                <Button onClick={() => setEditingTestimonial(emptyTestimonial())} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add Testimonial</Button>
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
                      <Button size="sm" variant="outline" onClick={() => setEditingTestimonial(t)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteTestimonial(t.id!)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "testimonials" && editingTestimonial && (
          <>
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setEditingTestimonial(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              <Button onClick={saveTestimonial} className="gradient-primary text-primary-foreground font-semibold gap-1">
                <Save className="w-4 h-4" /> Save Testimonial
              </Button>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editingTestimonial.name} onChange={(e) => setEditingTestimonial((p) => p ? { ...p, name: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>Role / Title</Label>
                  <Input value={editingTestimonial.role} onChange={(e) => setEditingTestimonial((p) => p ? { ...p, role: e.target.value } : p)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Testimonial Content</Label>
                <Textarea value={editingTestimonial.content} onChange={(e) => setEditingTestimonial((p) => p ? { ...p, content: e.target.value } : p)} rows={4} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input type="number" min={1} max={5} value={editingTestimonial.rating} onChange={(e) => setEditingTestimonial((p) => p ? { ...p, rating: parseInt(e.target.value) || 5 } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input value={editingTestimonial.image_url} onChange={(e) => setEditingTestimonial((p) => p ? { ...p, image_url: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={editingTestimonial.sort_order} onChange={(e) => setEditingTestimonial((p) => p ? { ...p, sort_order: parseInt(e.target.value) || 0 } : p)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editingTestimonial.is_visible} onCheckedChange={(checked) => setEditingTestimonial((p) => p ? { ...p, is_visible: checked } : p)} />
                <Label>Visible on landing page</Label>
              </div>
            </div>
          </>
        )}

        {/* ============ SETTINGS TAB ============ */}
        {activeTab === "settings" && (
          <>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Site Settings</h2>
            <div className="space-y-4">
              {[
                { key: "hero_video_url", label: "Hero Video URL (YouTube)", placeholder: "https://youtube.com/watch?v=..." },
                { key: "hero_title", label: "Hero Title", placeholder: "AI DigiProfit Income Engine" },
                { key: "hero_subtitle", label: "Hero Subtitle", placeholder: "Course description..." },
                { key: "course_price", label: "Course Price ($)", placeholder: "497" },
                { key: "course_original_price", label: "Original Price ($)", placeholder: "997" },
              ].map((setting) => (
                <div key={setting.key} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <Label>{setting.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={siteSettings[setting.key] || ""}
                      onChange={(e) => setSiteSettings((p) => ({ ...p, [setting.key]: e.target.value }))}
                      placeholder={setting.placeholder}
                    />
                    <Button variant="outline" onClick={() => saveSetting(setting.key, siteSettings[setting.key] || "")}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
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
