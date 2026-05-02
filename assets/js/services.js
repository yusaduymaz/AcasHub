/**
 * services.js — Dynamic Services Loader
 * 
 * Fetches services from Supabase `services` table and renders them
 * into the existing .services-grid container, preserving the original
 * HTML structure and CSS classes exactly.
 * 
 * Public API (exposed on window.AcasHub):
 *   - renderServices(services)  → render an array of service objects
 *   - fetchServices()           → fetch from Supabase + render
 *   - refreshServices()         → alias for fetchServices (convenience)
 * 
 * Graceful degradation: if Supabase is not configured or fetch fails,
 * the original static HTML cards remain untouched.
 */

(function () {
    'use strict';

    // ─── Constants ──────────────────────────────────────────────────
    const GRID_SELECTOR = '.services-grid';
    const DROPDOWN_SELECTOR = '.dropdown-menu-dark';
    const MOBILE_DROPDOWN_SELECTOR = '.mobile-dropdown-menu';

    // Maps icon_name values from the database to Font Awesome classes
    const ICON_MAP = {
        'calculator': 'fas fa-calculator',
        'file-invoice-dollar': 'fas fa-file-invoice-dollar',
        'chart-line': 'fas fa-chart-line',
        'users': 'fas fa-users',
        'laptop-code': 'fas fa-laptop-code',
        'globe': 'fas fa-globe',
        'balance-scale': 'fas fa-balance-scale',
        'hand-holding-usd': 'fas fa-hand-holding-usd',
        'cogs': 'fas fa-cogs',
        'shield-alt': 'fas fa-shield-alt',
        'briefcase': 'fas fa-briefcase',
    };

    // Store original static HTML for fallback restoration
    let _staticHTML = null;

    // ─── Utility Functions ──────────────────────────────────────────

    /**
     * Escape HTML to prevent XSS when rendering database content.
     * @param {string} str - Raw string from database
     * @returns {string} Safe HTML-escaped string
     */
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /**
     * Resolve a Font Awesome class string from a database icon_name.
     * Falls back to `fas fa-{iconName}` and ultimately `fas fa-briefcase`.
     * @param {string} iconName - Icon identifier from database
     * @returns {string} Full Font Awesome class string
     */
    function resolveIcon(iconName) {
        if (!iconName) return 'fas fa-briefcase';
        return ICON_MAP[iconName] || `fas fa-${iconName}`;
    }

    // ─── Rendering Functions ────────────────────────────────────────

    /**
     * Build a single service card HTML string.
     * Mirrors the exact DOM structure from the original static HTML:
     *   <article class="service-card">
     *     <div class="service-icon"><i class="fas fa-..."></i></div>
     *     <h3 id="serviceN-heading">Title</h3>
     *     <p>Description</p>
     *     <ul class="service-features"><li>...</li></ul>
     *   </article>
     *
     * @param {Object} service - Service object from Supabase
     * @param {number} index - Zero-based index for heading ID generation
     * @returns {string} HTML string for a single card
     */
    function buildServiceCard(service, index) {
        const iconClass = resolveIcon(service.icon_name);
        const headingId = `service${index + 1}-heading`;

        // Build feature list items (features is a TEXT[] in Postgres)
        let featuresHTML = '';
        if (Array.isArray(service.features) && service.features.length > 0) {
            const items = service.features
                .map(f => `<li>${escapeHTML(f)}</li>`)
                .join('\n                            ');
            featuresHTML = `
                        <ul class="service-features">
                            ${items}
                        </ul>`;
        }

        return `
                    <article class="service-card" aria-labelledby="${headingId}">
                        <div class="service-icon">
                            <i class="${iconClass}" aria-hidden="true"></i>
                        </div>
                        <h3 id="${headingId}">${escapeHTML(service.title)}</h3>
                        <p>${escapeHTML(service.description)}</p>${featuresHTML}
                    </article>`;
    }

    /**
     * Build an empty state message when no services are available.
     * Uses existing CSS classes to blend with the dark glass theme.
     * @returns {string} HTML for the empty state
     */
    function buildEmptyState() {
        return `
                    <div class="services-empty-state" style="
                        grid-column: 1 / -1;
                        text-align: center;
                        padding: 4rem 2rem;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 1.25rem;
                        border: 1px dashed rgba(255, 255, 255, 0.15);
                    ">
                        <div class="service-icon" style="font-size: 3rem; margin-bottom: 1.5rem;">
                            <i class="fas fa-inbox" aria-hidden="true" style="color: #94a3b8;"></i>
                        </div>
                        <h3 style="color: #f9fafb; margin-bottom: 0.75rem;">No Services Available</h3>
                        <p style="color: #94a3b8; max-width: 400px; margin: 0 auto;">
                            Our services are being updated. Please check back soon or 
                            <a href="#contact" style="color: #accecf; text-decoration: underline;">contact us</a> 
                            for more information.
                        </p>
                    </div>`;
    }

    /**
     * Build loading skeleton placeholders that match the card layout.
     * @param {number} count - Number of skeleton cards to show
     * @returns {string} HTML for loading skeletons
     */
    function buildLoadingSkeleton(count) {
        const shimmerStyle = `
            background: linear-gradient(
                90deg,
                rgba(255,255,255,0.03) 25%,
                rgba(255,255,255,0.08) 50%,
                rgba(255,255,255,0.03) 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
            border-radius: 0.5rem;
        `;

        let cards = '';
        for (let i = 0; i < count; i++) {
            cards += `
                    <article class="service-card" aria-hidden="true" style="pointer-events: none;">
                        <div class="service-icon">
                            <div style="width: 48px; height: 48px; border-radius: 50%; ${shimmerStyle}"></div>
                        </div>
                        <div style="height: 1.5rem; width: 70%; margin-bottom: 0.75rem; ${shimmerStyle}"></div>
                        <div style="height: 0.9rem; width: 100%; margin-bottom: 0.4rem; ${shimmerStyle}"></div>
                        <div style="height: 0.9rem; width: 90%; margin-bottom: 1.4rem; ${shimmerStyle}"></div>
                        <div style="height: 0.85rem; width: 60%; margin-bottom: 0.45rem; ${shimmerStyle}"></div>
                        <div style="height: 0.85rem; width: 55%; margin-bottom: 0.45rem; ${shimmerStyle}"></div>
                        <div style="height: 0.85rem; width: 65%; margin-bottom: 0.45rem; ${shimmerStyle}"></div>
                    </article>`;
        }
        return cards;
    }

    /**
     * Inject the shimmer keyframe animation into the document (once).
     */
    function injectShimmerCSS() {
        if (document.getElementById('acashub-shimmer-css')) return;
        const style = document.createElement('style');
        style.id = 'acashub-shimmer-css';
        style.textContent = `
            @keyframes shimmer {
                0%   { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ─── Core Render Function (Reusable) ────────────────────────────

    /**
     * Render an array of service objects into the .services-grid.
     * This is the reusable rendering function — it does NOT fetch data.
     * 
     * @param {Array<Object>} services - Array of service objects with shape:
     *   { title, description, icon_name, features: string[] }
     * @param {Object} [options] - Rendering options
     * @param {boolean} [options.showEmpty=true] - Show empty state if array is empty
     * @param {boolean} [options.updateNav=true] - Update dropdown nav links
     * @returns {boolean} true if rendered successfully, false otherwise
     */
    function renderServices(services, options) {
        const opts = Object.assign({ showEmpty: true, updateNav: true }, options);
        const grid = document.querySelector(GRID_SELECTOR);
        if (!grid) {
            console.warn('[AcasHub/Services] .services-grid element not found in DOM.');
            return false;
        }

        // Cache original static HTML on first call (for fallback)
        if (_staticHTML === null) {
            _staticHTML = grid.innerHTML;
        }

        // ─── Empty state ────────────────────────────────────────────
        if (!Array.isArray(services) || services.length === 0) {
            if (opts.showEmpty) {
                grid.innerHTML = buildEmptyState();
                console.log('[AcasHub/Services] Rendered empty state (0 services).');
            } else {
                console.log('[AcasHub/Services] No services to render — keeping current content.');
            }
            return true;
        }

        // ─── Render cards ───────────────────────────────────────────
        const cardsHTML = services.map((s, i) => buildServiceCard(s, i)).join('\n');
        grid.innerHTML = cardsHTML;

        // ─── Update navigation ──────────────────────────────────────
        if (opts.updateNav) {
            updateDropdownNav(services);
            updateMobileDropdownNav(services);
        }

        console.log(`[AcasHub/Services] Rendered ${services.length} service card(s).`);
        return true;
    }

    /**
     * Restore the original static HTML content (fallback).
     */
    function restoreStaticContent() {
        const grid = document.querySelector(GRID_SELECTOR);
        if (grid && _staticHTML !== null) {
            grid.innerHTML = _staticHTML;
            console.log('[AcasHub/Services] Restored static content.');
        }
    }

    // ─── Navigation Updates ─────────────────────────────────────────

    /**
     * Update the desktop header dropdown to reflect dynamic service titles.
     * @param {Array<Object>} services
     */
    function updateDropdownNav(services) {
        const dropdown = document.querySelector(DROPDOWN_SELECTOR);
        if (!dropdown || !services.length) return;

        dropdown.innerHTML = services
            .map((s, i) => {
                const headingId = `service${i + 1}-heading`;
                return `<a href="#${headingId}" class="dropdown-item">${escapeHTML(s.title)}</a>`;
            })
            .join('\n                                ');
    }

    /**
     * Update the mobile dropdown to reflect dynamic service titles.
     * @param {Array<Object>} services
     */
    function updateMobileDropdownNav(services) {
        const dropdown = document.querySelector(MOBILE_DROPDOWN_SELECTOR);
        if (!dropdown || !services.length) return;

        dropdown.innerHTML = services
            .map((s, i) => {
                const headingId = `service${i + 1}-heading`;
                return `<a href="#${headingId}" class="mobile-dropdown-item">${escapeHTML(s.title)}</a>`;
            })
            .join('\n                            ');
    }

    // ─── Fetch + Render (Supabase Integration) ──────────────────────

    /**
     * Show loading state in the grid.
     */
    function showLoading() {
        const grid = document.querySelector(GRID_SELECTOR);
        if (!grid) return;

        // Cache static HTML before overwriting
        if (_staticHTML === null) {
            _staticHTML = grid.innerHTML;
        }

        injectShimmerCSS();
        grid.innerHTML = buildLoadingSkeleton(6);
    }

    /**
     * Fetch services from Supabase and render them.
     * Shows loading skeleton while fetching.
     * Falls back to static content on any error.
     * 
     * @returns {Promise<Array<Object>|null>} Fetched services or null on failure
     */
    async function fetchServices() {
        const grid = document.querySelector(GRID_SELECTOR);
        if (!grid) return null;

        // Guard: check if Supabase is available and configured
        if (!window.AcasHub || !window.AcasHub.supabase || !window.AcasHub.config.isConfigured) {
            console.log('[AcasHub/Services] Supabase not configured — keeping static content.');
            return null;
        }

        // ─── Show loading skeleton ──────────────────────────────────
        showLoading();

        try {
            const { data: services, error } = await window.AcasHub.supabase
                .from('services')
                .select('id, title, description, icon_name, features, sort_order')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) {
                console.error('[AcasHub/Services] Supabase query error:', error.message);
                restoreStaticContent();
                return null;
            }

            if (!services || services.length === 0) {
                // Show proper empty state instead of static content
                renderServices([], { showEmpty: true, updateNav: false });
                return [];
            }

            // ─── Render dynamic cards ───────────────────────────────
            renderServices(services);
            return services;

        } catch (err) {
            console.error('[AcasHub/Services] Failed to load services:', err);
            restoreStaticContent();
            return null;
        }
    }

    // ─── Expose Public API ──────────────────────────────────────────
    window.AcasHub = window.AcasHub || {};
    window.AcasHub.renderServices = renderServices;
    window.AcasHub.fetchServices = fetchServices;
    window.AcasHub.refreshServices = fetchServices; // convenience alias

    // ─── Initialize on DOM ready ────────────────────────────────────
    function init() {
        fetchServices();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
