
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- courses
DROP POLICY IF EXISTS "Admins can do everything with courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;

CREATE POLICY "Admins can do everything with courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true);

-- course_modules
DROP POLICY IF EXISTS "Admins can manage modules" ON public.course_modules;
DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON public.course_modules;

CREATE POLICY "Admins can manage modules" ON public.course_modules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view modules of published courses" ON public.course_modules FOR SELECT USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.is_published = true));

-- lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view preview lessons" ON public.lessons;
DROP POLICY IF EXISTS "Enrolled students can view all lessons" ON public.lessons;

CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view preview lessons" ON public.lessons FOR SELECT USING (is_preview = true AND EXISTS (SELECT 1 FROM course_modules m JOIN courses c ON c.id = m.course_id WHERE m.id = lessons.module_id AND c.is_published = true));
CREATE POLICY "Enrolled students can view all lessons" ON public.lessons FOR SELECT USING (EXISTS (SELECT 1 FROM course_modules m JOIN enrollments e ON e.course_id = m.course_id WHERE m.id = lessons.module_id AND e.user_id = auth.uid() AND e.status = 'active'));

-- enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;

CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);

-- course_reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.course_reviews;

CREATE POLICY "Admins can manage reviews" ON public.course_reviews FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view approved reviews" ON public.course_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create own reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.course_reviews FOR UPDATE USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
