
-- ================================================
-- 1. FIX ALL RESTRICTIVE POLICIES → PERMISSIVE
-- ================================================

-- affiliate_referrals
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.affiliate_referrals;
CREATE POLICY "Affiliates can view own referrals" ON public.affiliate_referrals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_referrals.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Admins can manage referrals" ON public.affiliate_referrals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- affiliates
DROP POLICY IF EXISTS "Users can view own affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Users can create own affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
CREATE POLICY "Users can view own affiliate" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own affiliate" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage affiliates" ON public.affiliates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- course_modules
DROP POLICY IF EXISTS "Admins can manage modules" ON public.course_modules;
DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON public.course_modules;
CREATE POLICY "Anyone can view modules of published courses" ON public.course_modules FOR SELECT USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.is_published = true));
CREATE POLICY "Admins can manage modules" ON public.course_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- course_reviews
DROP POLICY IF EXISTS "Users can create own reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.course_reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.course_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create own reviews" ON public.course_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.course_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews" ON public.course_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- courses
DROP POLICY IF EXISTS "Admins can do everything with courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can do everything with courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- lesson_progress
DROP POLICY IF EXISTS "Users can manage own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.lesson_progress;
CREATE POLICY "Users can manage own progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.lesson_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view preview lessons" ON public.lessons;
DROP POLICY IF EXISTS "Enrolled students can view all lessons" ON public.lessons;
CREATE POLICY "Anyone can view preview lessons" ON public.lessons FOR SELECT USING (is_preview = true AND EXISTS (SELECT 1 FROM course_modules m JOIN courses c ON c.id = m.course_id WHERE m.id = lessons.module_id AND c.is_published = true));
CREATE POLICY "Enrolled students can view all lessons" ON public.lessons FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM course_modules m JOIN enrollments e ON e.course_id = m.course_id WHERE m.id = lessons.module_id AND e.user_id = auth.uid() AND e.status = 'active'));
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- payout_requests
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "Affiliates can create own payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can manage payouts" ON public.payout_requests;
CREATE POLICY "Affiliates can view own payouts" ON public.payout_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = payout_requests.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Affiliates can create own payouts" ON public.payout_requests FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = payout_requests.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Admins can manage payouts" ON public.payout_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- site_settings
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- testimonials
DROP POLICY IF EXISTS "Anyone can view visible testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view visible testimonials" ON public.testimonials FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ================================================
-- 2. CREATE LESSON_RESOURCES TABLE
-- ================================================
CREATE TABLE public.lesson_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size_bytes BIGINT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lesson resources" ON public.lesson_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled students can view lesson resources" ON public.lesson_resources FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN course_modules m ON m.id = l.module_id
    JOIN enrollments e ON e.course_id = m.course_id
    WHERE l.id = lesson_resources.lesson_id AND e.user_id = auth.uid() AND e.status = 'active'
  )
);

-- ================================================
-- 3. CREATE HANDLE_NEW_USER TRIGGER
-- ================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 4. CREATE STORAGE BUCKETS
-- ================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-resources', 'lesson-resources', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonial-images', 'testimonial-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for lesson-resources
CREATE POLICY "Anyone can view lesson resources files" ON storage.objects FOR SELECT USING (bucket_id = 'lesson-resources');
CREATE POLICY "Admins can upload lesson resources" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lesson-resources' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update lesson resources" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'lesson-resources' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete lesson resources" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lesson-resources' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for testimonial-images
CREATE POLICY "Anyone can view testimonial images" ON storage.objects FOR SELECT USING (bucket_id = 'testimonial-images');
CREATE POLICY "Admins can upload testimonial images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update testimonial images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete testimonial images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Add email column to profiles for admin search
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
