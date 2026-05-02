/**
 * partners.js — Dynamic Partners Loader
 * Fetches partner logos from Supabase and renders them into the existing .partners-grid.
 */

(function () {
    'use strict';

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    async function loadPartners() {
        var grid = document.querySelector('.partners-grid');
        if (!grid) return;

        if (!window.AcasHub || !window.AcasHub.supabase || !window.AcasHub.config.isConfigured) return;

        try {
            var result = await window.AcasHub.supabase
                .from('partners')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (result.error) throw result.error;
            if (!result.data || result.data.length === 0) return;

            var html = '';
            result.data.forEach(p => {
                html += `
                <div class="partner-item">
                    <img src="${(escapeHTML(p.image_url) -replace '^image/', 'assets/images/')}" alt="${escapeHTML(p.name)}" width="150" height="60" loading="lazy">
                </div>`;
            });

            grid.innerHTML = html;
            
            // Re-bind partners infinite scroll animation if needed
            if (typeof initPartnersAnimation === 'function') {
                initPartnersAnimation();
            }

        } catch (err) {
            console.error('[AcasHub/Partners] Error:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPartners);
    } else {
        loadPartners();
    }
})();
