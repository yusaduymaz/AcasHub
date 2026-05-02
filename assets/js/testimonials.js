/**
 * testimonials.js — Dynamic Testimonials Loader
 * 
 * Fetches testimonials from Supabase and renders them into the
 * existing .testimonial-slider, preserving the original structure.
 * Re-initializes the slider after rendering.
 */

(function () {
    'use strict';

    let _staticHTML = null;

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function buildStars(rating) {
        var html = '';
        for (var i = 0; i < 5; i++) {
            html += i < rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        }
        return html;
    }

    function buildTestimonialSlide(t, index) {
        var headingId = 'testimonial' + (index + 1) + '-heading';
        var imgSrc = t.client_image || 'image/client1.webp';
        var serviceIcon = t.service_icon ? 'fas fa-' + t.service_icon : 'fas fa-briefcase';

        return '<div class="testimonial-slide">' +
            '<article class="testimonial-card" aria-labelledby="' + headingId + '">' +
                '<div class="card-header">' +
                    '<div class="client-image">' +
                        '<img src="' + escapeHTML(imgSrc) + '" alt="' + escapeHTML(t.client_name) + '" width="80" height="80" loading="lazy" />' +
                        '<div class="client-badge"><i class="fas fa-check"></i></div>' +
                    '</div>' +
                    '<div class="client-info">' +
                        '<h3 id="' + headingId + '">' + escapeHTML(t.client_name) + '</h3>' +
                        '<p class="client-title">' + escapeHTML(t.client_title) + '</p>' +
                        '<div class="client-rating">' + buildStars(t.rating || 5) + '</div>' +
                    '</div>' +
                '</div>' +
                '<blockquote class="testimonial-quote">' +
                    '<p>"' + escapeHTML(t.quote) + '"</p>' +
                '</blockquote>' +
                '<div class="card-footer">' +
                    '<div class="service-used">' +
                        '<i class="' + serviceIcon + '"></i>' +
                        '<span>' + escapeHTML(t.service_label || '') + '</span>' +
                    '</div>' +
                    '<div class="testimonial-date">' + escapeHTML(t.testimonial_date || '') + '</div>' +
                '</div>' +
            '</article>' +
        '</div>';
    }

    async function loadTestimonials() {
        var slider = document.querySelector('.testimonial-slider');
        if (!slider) return;

        if (!window.AcasHub || !window.AcasHub.supabase || !window.AcasHub.config.isConfigured) {
            return; // Keep static content
        }

        // Cache static HTML
        if (_staticHTML === null) {
            _staticHTML = slider.innerHTML;
        }

        try {
            var result = await window.AcasHub.supabase
                .from('testimonials')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (result.error) {
                console.error('[AcasHub/Testimonials] Error:', result.error.message);
                return;
            }

            if (!result.data || result.data.length === 0) {
                return; // Keep static content
            }

            // Render slides
            var html = '';
            for (var i = 0; i < result.data.length; i++) {
                html += buildTestimonialSlide(result.data[i], i);
            }
            slider.innerHTML = html;

            // Re-initialize the slider from script.js
            if (typeof initTestimonialSlider === 'function') {
                initTestimonialSlider();
            }

            console.log('[AcasHub/Testimonials] Loaded ' + result.data.length + ' testimonials.');

        } catch (err) {
            console.error('[AcasHub/Testimonials] Failed:', err);
        }
    }

    // Expose
    window.AcasHub = window.AcasHub || {};
    window.AcasHub.fetchTestimonials = loadTestimonials;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadTestimonials);
    } else {
        loadTestimonials();
    }
})();
