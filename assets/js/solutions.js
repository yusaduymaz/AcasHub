/**
 * solutions.js — Dynamic Solutions Loader
 * Fetches solutions from Supabase and renders them into the existing tabs structure.
 */

(function () {
    'use strict';

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    async function loadSolutions() {
        var tabsNav = document.querySelector('.tabs-nav');
        var tabsContent = document.querySelector('.tabs-content');
        if (!tabsNav || !tabsContent) return;

        if (!window.AcasHub || !window.AcasHub.supabase || !window.AcasHub.config.isConfigured) return;

        try {
            var result = await window.AcasHub.supabase
                .from('solutions')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (result.error) throw result.error;
            if (!result.data || result.data.length === 0) return;

            var navHtml = '';
            var contentHtml = '';

            result.data.forEach((s, index) => {
                var isActive = index === 0;
                var safeId = 'tab-' + s.id;
                
                navHtml += `<button class="tab-button ${isActive ? 'active' : ''}" role="tab" 
                    aria-selected="${isActive}" aria-controls="${safeId}-panel" id="${safeId}" 
                    tabindex="${isActive ? '0' : '-1'}">${escapeHTML(s.tab_label)}</button>`;

                var featuresHtml = (s.features || []).map(f => `<li>${escapeHTML(f)}</li>`).join('');

                contentHtml += `
                    <div id="${safeId}-panel" class="tab-panel ${isActive ? 'active' : ''}" role="tabpanel" 
                        aria-labelledby="${safeId}" tabindex="0" ${isActive ? '' : 'hidden'}>
                        <div class="tab-content">
                            <div class="tab-image">
                                <img src="${(escapeHTML(s.image_url) -replace '^image/', 'assets/images/')}" alt="${escapeHTML(s.title)}" width="500" height="350" loading="lazy">
                            </div>
                            <div class="tab-text">
                                <h3>${escapeHTML(s.title)}</h3>
                                <p>${escapeHTML(s.description)}</p>
                                <ul class="tab-text-ul">
                                    ${featuresHtml}
                                </ul>
                                <a href="#contact" class="btn btn-secondary">Get Started</a>
                            </div>
                        </div>
                    </div>`;
            });

            tabsNav.innerHTML = navHtml;
            tabsContent.innerHTML = contentHtml;

            // Re-bind tab events
            if (typeof initTabs === 'function') {
                initTabs();
            } else {
                // simple tab logic fallback
                var buttons = tabsNav.querySelectorAll('.tab-button');
                var panels = tabsContent.querySelectorAll('.tab-panel');
                buttons.forEach((btn, i) => {
                    btn.addEventListener('click', () => {
                        buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); b.setAttribute('tabindex', '-1'); });
                        panels.forEach(p => { p.classList.remove('active'); p.setAttribute('hidden', ''); });
                        
                        btn.classList.add('active');
                        btn.setAttribute('aria-selected', 'true');
                        btn.setAttribute('tabindex', '0');
                        panels[i].classList.add('active');
                        panels[i].removeAttribute('hidden');
                    });
                });
            }
        } catch (err) {
            console.error('[AcasHub/Solutions] Error:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSolutions);
    } else {
        loadSolutions();
    }
})();
