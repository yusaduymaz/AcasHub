/**
 * content.js — Dynamic Site Content Loader
 * Fetches hero and about section content from Supabase site_content table.
 */

(function () {
    'use strict';

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    async function loadSiteContent() {
        if (!window.AcasHub || !window.AcasHub.supabase || !window.AcasHub.config.isConfigured) return;

        try {
            var result = await window.AcasHub.supabase
                .from('site_content')
                .select('*');

            if (result.error) throw result.error;
            if (!result.data || result.data.length === 0) return;

            result.data.forEach(row => {
                var section = row.section;
                var data = row.content;

                if (section === 'hero') {
                    // Update Hero
                    var titleContainer = document.getElementById('hero-heading');
                    if (titleContainer) {
                        titleContainer.innerHTML = `
                            <span class="hero-title-line">${escapeHTML(data.title_line1 || '')}</span>
                            <span class="hero-title-highlight">${escapeHTML(data.title_highlight || '')}</span>
                            <span class="hero-title-line">${escapeHTML(data.title_line2 || '')}</span>
                        `;
                    }
                    var subtitleContainer = document.querySelector('.hero-subtitle');
                    if (subtitleContainer && data.subtitle) {
                        subtitleContainer.textContent = data.subtitle;
                    }
                    var heroImg = document.querySelector('.hero-image .image-container > img');
                    if (heroImg && data.image_url) {
                        heroImg.src = (escapeHTML(data.image_url) -replace '^image/', 'assets/images/');
                    }
                } 
                else if (section === 'about') {
                    // Update About
                    var titleContainer = document.getElementById('about-heading');
                    if (titleContainer) {
                        titleContainer.innerHTML = `${escapeHTML(data.title_normal || '')} <span>${escapeHTML(data.title_highlight || '')}</span>`;
                    }
                    
                    var textContainer = document.querySelector('.about-text');
                    if (textContainer) {
                        // Find paragraphs
                        var paragraphs = textContainer.querySelectorAll('p');
                        if (paragraphs.length >= 2) {
                            paragraphs[0].textContent = data.paragraph1 || '';
                            paragraphs[1].textContent = data.paragraph2 || '';
                        }
                        
                        // Find features list
                        var featuresList = textContainer.querySelector('.about-features');
                        if (featuresList && data.features && Array.isArray(data.features)) {
                            featuresList.innerHTML = data.features.map(f => `
                                <li class="feature-item">
                                    <i class="fas fa-check-circle feature-icon"></i>
                                    <span>${escapeHTML(f)}</span>
                                </li>
                            `).join('');
                        }
                    }

                    var aboutImg = document.querySelector('.about-image > img');
                    if (aboutImg && data.image_url) {
                        aboutImg.src = (escapeHTML(data.image_url) -replace '^image/', 'assets/images/');
                    }
                }
            });

        } catch (err) {
            console.error('[AcasHub/Content] Error:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSiteContent);
    } else {
        loadSiteContent();
    }
})();
