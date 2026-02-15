import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Course from "./pages/Course";
import NotFound from "./pages/NotFound";

// Dashboard Layout + Pages
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";
import DashboardCourses from "@/pages/dashboard/DashboardCourses";
import DashboardProfile from "@/pages/dashboard/DashboardProfile";
import DashboardAffiliate from "@/pages/dashboard/DashboardAffiliate";

// Admin Layout + Pages
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminCourseEdit from "@/pages/admin/AdminCourseEdit";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminEnrollments from "@/pages/admin/AdminEnrollments";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAffiliate from "@/pages/admin/AdminAffiliate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Student Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardOverview />} />
              <Route path="courses" element={<DashboardCourses />} />
              <Route path="profile" element={<DashboardProfile />} />
              <Route path="affiliate" element={<DashboardAffiliate />} />
            </Route>

            {/* Course Player */}
            <Route path="/course" element={<ProtectedRoute><Course /></ProtectedRoute>} />

            {/* Admin Dashboard */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/:id/edit" element={<AdminCourseEdit />} />
              <Route path="courses/new" element={<AdminCourseEdit />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="enrollments" element={<AdminEnrollments />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="affiliate" element={<AdminAffiliate />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
