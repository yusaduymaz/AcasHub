-- ============================================================
-- AcasHub — Supabase Database Schema
-- Tables: services, testimonials, contact_messages
-- ============================================================

-- ─── SERVICES TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name   TEXT NOT NULL DEFAULT 'briefcase',
    features    TEXT[] DEFAULT '{}',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.services IS 'Dynamic services displayed on the AcasHub homepage';

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active services" ON public.services
    FOR SELECT USING (is_active = true);
CREATE POLICY "Auth can insert services" ON public.services
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update services" ON public.services
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete services" ON public.services
    FOR DELETE TO authenticated USING (true);


-- ─── TESTIMONIALS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name     TEXT NOT NULL,
    client_title    TEXT NOT NULL,          -- e.g. "CEO, Retail Solutions"
    client_image    TEXT DEFAULT '',        -- URL or path to image
    quote           TEXT NOT NULL,
    rating          INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    service_icon    TEXT DEFAULT 'briefcase',
    service_label   TEXT DEFAULT '',        -- e.g. "Accounting Services"
    testimonial_date TEXT DEFAULT '',       -- e.g. "March 2024"
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.testimonials IS 'Client testimonials/reviews displayed on homepage slider';

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active testimonials" ON public.testimonials
    FOR SELECT USING (is_active = true);
CREATE POLICY "Auth can insert testimonials" ON public.testimonials
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update testimonials" ON public.testimonials
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete testimonials" ON public.testimonials
    FOR DELETE TO authenticated USING (true);


-- ─── CONTACT MESSAGES TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT DEFAULT '',
    subject     TEXT NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.contact_messages IS 'Messages submitted via the website contact form';

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (submit the contact form)
CREATE POLICY "Anyone can submit contact form" ON public.contact_messages
    FOR INSERT WITH CHECK (true);
-- Only authenticated users can read messages
CREATE POLICY "Auth can view messages" ON public.contact_messages
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can update messages" ON public.contact_messages
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete messages" ON public.contact_messages
    FOR DELETE TO authenticated USING (true);


-- ─── AUTO-UPDATE TIMESTAMP TRIGGER ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_services_updated BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_testimonials_updated BEFORE UPDATE ON public.testimonials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── SEED DATA: SERVICES ────────────────────────────────────────
INSERT INTO public.services (title, description, icon_name, features, sort_order) VALUES
('Accounting Services', 'Comprehensive bookkeeping, financial reporting, and general accounting services to keep your finances organized.', 'calculator', ARRAY['Monthly bookkeeping', 'Financial statements', 'Accounts payable/receivable', 'Bank reconciliations'], 1),
('Tax Preparation', 'Expert tax planning and preparation to minimize liabilities and ensure compliance with regulations.', 'file-invoice-dollar', ARRAY['Business tax returns', 'Personal tax planning', 'Tax strategy consulting', 'IRS representation'], 2),
('Financial Consulting', 'Strategic financial advice to help grow your business and improve profitability.', 'chart-line', ARRAY['Business valuation', 'Financial forecasting', 'Cash flow management', 'Investment analysis'], 3),
('Payroll Services', 'Accurate and timely payroll processing with full compliance and reporting.', 'users', ARRAY['Payroll processing', 'Tax filings', 'Direct deposit setup', 'Employee benefits'], 4),
('Software Solutions', 'Custom accounting software and business tools to streamline your operations.', 'laptop-code', ARRAY['Custom accounting software', 'Business process automation', 'Financial dashboards', 'Integration services'], 5),
('Web Solutions', 'Professional web design and development services for accounting firms.', 'globe', ARRAY['Accounting firm websites', 'Client portals', 'SEO optimization', 'Content management'], 6);


-- ─── SEED DATA: TESTIMONIALS ────────────────────────────────────
INSERT INTO public.testimonials (client_name, client_title, client_image, quote, rating, service_icon, service_label, testimonial_date, sort_order) VALUES
('Sarah Johnson', 'CEO, Retail Solutions', 'image/client1.webp', 'AcasHub transformed our financial operations. Their team implemented efficient systems that saved us hours each week and provided insights that helped us grow revenue by 30%.', 5, 'calculator', 'Accounting Services', 'March 2024', 1),
('Michael Chen', 'Founder, TechStart', 'image/client2.webp', 'As a startup, we needed financial guidance we could trust. AcasHub not only handled our accounting but became strategic partners in our growth journey.', 5, 'file-invoice-dollar', 'Tax Consultation', 'January 2024', 2),
('David Wilson', 'CFO, Wilson & Co', 'image/client3.webp', 'Their tax planning services saved us thousands last year. The team is responsive, knowledgeable, and truly cares about our success.', 5, 'chart-line', 'Financial Advisory', 'November 2023', 3);
