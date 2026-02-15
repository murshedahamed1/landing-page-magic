import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, ClipboardList, DollarSign } from "lucide-react";

const AdminOverview = () => {
  const [stats, setStats] = useState({ courses: 0, students: 0, enrollments: 0, testimonials: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [c, s, e, t] = await Promise.all([
      supabase.from("courses").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("enrollments").select("id", { count: "exact", head: true }),
      supabase.from("testimonials").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      courses: c.count || 0,
      students: s.count || 0,
      enrollments: e.count || 0,
      testimonials: t.count || 0,
    });
  };

  const cards = [
    { label: "Courses", value: stats.courses, icon: BookOpen, color: "text-primary" },
    { label: "Students", value: stats.students, icon: Users, color: "text-accent" },
    { label: "Enrollments", value: stats.enrollments, icon: ClipboardList, color: "text-primary" },
    { label: "Testimonials", value: stats.testimonials, icon: DollarSign, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Admin Overview</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5 text-center">
            <c.icon className={`w-8 h-8 ${c.color} mx-auto mb-2`} />
            <p className="font-display text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
