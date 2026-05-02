-- ─── SITE CONTENT TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_content (
    section     VARCHAR(50) PRIMARY KEY,
    content     JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.site_content IS 'Dynamic content for Hero, About, and other static sections';

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view site content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Auth can insert site content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update site content" ON public.site_content FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- SEED DATA: SITE CONTENT
INSERT INTO public.site_content (section, content) VALUES
('hero', '{
  "title_line1": "Transform Your",
  "title_highlight": "Financial Future",
  "title_line2": "With Expert Guidance",
  "subtitle": "Precision accounting solutions tailored to fuel your business growth and maximize profitability.",
  "image_url": "image/hero-image 2.webp"
}'::jsonb),
('about', '{
  "title_normal": "About",
  "title_highlight": "AcasHub",
  "paragraph1": "AcasHub is a leading provider of professional accounting and financial consulting services. Our team of certified professionals is dedicated to helping businesses of all sizes achieve financial clarity and success.",
  "paragraph2": "With years of experience across various industries, we offer tailored solutions that address your unique financial challenges and goals.",
  "features": [
    "Certified accounting professionals",
    "Personalized financial strategies",
    "Cutting-edge financial technology",
    "Proactive tax planning"
  ],
  "image_url": "image/about-image.webp"
}'::jsonb)
ON CONFLICT (section) DO NOTHING;
