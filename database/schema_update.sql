-- ─── SOLUTIONS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.solutions (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tab_label   TEXT NOT NULL,          -- e.g. "Small Business"
    title       TEXT NOT NULL,          -- e.g. "Small Business Accounting Solutions"
    description TEXT NOT NULL,
    image_url   TEXT NOT NULL,          -- e.g. "image/small-business.webp"
    features    TEXT[] DEFAULT '{}',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.solutions IS 'Dynamic solutions displayed in the tabs section';

ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active solutions" ON public.solutions FOR SELECT USING (is_active = true);
CREATE POLICY "Auth can insert solutions" ON public.solutions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update solutions" ON public.solutions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete solutions" ON public.solutions FOR DELETE TO authenticated USING (true);

CREATE TRIGGER on_solutions_updated BEFORE UPDATE ON public.solutions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- SEED DATA: SOLUTIONS
INSERT INTO public.solutions (tab_label, title, description, image_url, features, sort_order) VALUES
('Small Business', 'Small Business Accounting Solutions', 'We understand the unique challenges small businesses face. Our tailored accounting solutions help you:', 'image/small-business.webp', ARRAY['Streamline bookkeeping and financial reporting', 'Optimize cash flow management', 'Reduce tax liabilities with proactive planning', 'Implement scalable systems for growth'], 1),
('Startups', 'Startup Financial Services', 'From incorporation to funding rounds, we support startups with:', 'image/startup accounting.webp', ARRAY['Entity formation and structuring advice', 'Investor-ready financial models', 'Burn rate analysis and runway planning', 'Equity and cap table management'], 2),
('E-commerce', 'E-commerce Accounting Solutions', 'Specialized services for online businesses including:', 'image/e-commerce accounting.webp', ARRAY['Multi-channel sales reconciliation', 'Inventory and COGS tracking', 'Sales tax compliance across jurisdictions', 'Platform integration and automation'], 3),
('Non-Profit', 'Non-Profit Financial Management', 'Compliance-focused services for non-profits:', 'image/nonprofit solutions.webp', ARRAY['Fund accounting and grant tracking', 'Form 990 preparation', 'Donation receipting and reporting', 'Board financial reporting'], 4);


-- ─── PARTNERS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,
    image_url   TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.partners IS 'Logos displayed in Trusted By Industry Leaders section';

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active partners" ON public.partners FOR SELECT USING (is_active = true);
CREATE POLICY "Auth can insert partners" ON public.partners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update partners" ON public.partners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete partners" ON public.partners FOR DELETE TO authenticated USING (true);

-- SEED DATA: PARTNERS
INSERT INTO public.partners (name, image_url, sort_order) VALUES
('QuickBooks', 'image/Intuit Quickbooks.webp', 1),
('Xero', 'image/xero.webp', 2),
('Thomson Reuters', 'image/thomson reuteres.webp', 3),
('Sage', 'image/sage.webp', 4),
('Gusto', 'image/gusto.webp', 5);


-- ─── TESTIMONIALS TABLE (IF NOT CREATED PREVIOUSLY) ─────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name     TEXT NOT NULL,
    client_title    TEXT NOT NULL,          
    client_image    TEXT DEFAULT '',        
    quote           TEXT NOT NULL,
    rating          INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    service_icon    TEXT DEFAULT 'briefcase',
    service_label   TEXT DEFAULT '',        
    testimonial_date TEXT DEFAULT '',       
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public can view active testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
    CREATE POLICY "Auth can insert testimonials" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Auth can update testimonials" ON public.testimonials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "Auth can delete testimonials" ON public.testimonials FOR DELETE TO authenticated USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if testimonials has data, if not insert seed data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.testimonials LIMIT 1) THEN
        INSERT INTO public.testimonials (client_name, client_title, client_image, quote, rating, service_icon, service_label, testimonial_date, sort_order) VALUES
        ('Sarah Johnson', 'CEO, Retail Solutions', 'image/client1.webp', 'AcasHub transformed our financial operations. Their team implemented efficient systems that saved us hours each week and provided insights that helped us grow revenue by 30%.', 5, 'calculator', 'Accounting Services', 'March 2024', 1),
        ('Michael Chen', 'Founder, TechStart', 'image/client2.webp', 'As a startup, we needed financial guidance we could trust. AcasHub not only handled our accounting but became strategic partners in our growth journey.', 5, 'file-invoice-dollar', 'Tax Consultation', 'January 2024', 2),
        ('David Wilson', 'CFO, Wilson & Co', 'image/client3.webp', 'Their tax planning services saved us thousands last year. The team is responsive, knowledgeable, and truly cares about our success.', 5, 'chart-line', 'Financial Advisory', 'November 2023', 3);
    END IF;
END $$;
