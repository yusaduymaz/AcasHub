/**
 * contact.js — Contact Form → Supabase
 * 
 * Intercepts the existing contact form submission and saves
 * to the Supabase contact_messages table instead of EmailJS.
 * Preserves the existing success/error UI behavior.
 */

(function () {
    'use strict';

    function init() {
        var form = document.getElementById('contactForm');
        if (!form) return;

        // Remove any existing submit listeners by cloning
        var newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        form = newForm;

        var formSuccess = document.getElementById('formSuccess');
        var newMessageBtn = document.getElementById('newMessageBtn');
        var submitBtn = form.querySelector('.submit-btn');

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Honeypot check
            var honeypot = form.querySelector('input[name="honeypot"]');
            if (honeypot && honeypot.value) return;

            // Validate
            if (!validateForm(form)) return;

            // Check Supabase
            if (!window.AcasHub || !window.AcasHub.supabase) {
                alert('Connection error. Please try again later.');
                return;
            }

            // Disable button
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.querySelector('span').textContent = 'Sending...';
            }

            try {
                var payload = {
                    name: form.querySelector('#name').value.trim(),
                    email: form.querySelector('#email').value.trim(),
                    phone: form.querySelector('#phone') ? form.querySelector('#phone').value.trim() : '',
                    subject: form.querySelector('#subject').value,
                    message: form.querySelector('#message').value.trim()
                };

                var result = await window.AcasHub.supabase
                    .from('contact_messages')
                    .insert(payload);

                if (result.error) {
                    console.error('[AcasHub/Contact] Error:', result.error.message);
                    alert('An error occurred while sending the message. Please try again.');
                    return;
                }

                // Success
                form.style.display = 'none';
                if (formSuccess) formSuccess.classList.add('active');
                console.log('[AcasHub/Contact] Message saved to Supabase.');

            } catch (err) {
                console.error('[AcasHub/Contact] Failed:', err);
                alert('An error occurred. Please try again later.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.querySelector('span').textContent = 'Send Message';
                }
            }
        });

        // New message button
        if (newMessageBtn) {
            newMessageBtn.addEventListener('click', function () {
                if (formSuccess) formSuccess.classList.remove('active');
                form.style.display = 'block';
                form.reset();
            });
        }
    }

    function validateForm(form) {
        var isValid = true;
        var name = form.querySelector('#name');
        var email = form.querySelector('#email');
        var subject = form.querySelector('#subject');
        var message = form.querySelector('#message');

        // Clear errors
        form.querySelectorAll('.error-message').forEach(function (el) { el.textContent = ''; });

        if (!name.value.trim()) {
            document.getElementById('nameError').textContent = 'Please enter your name';
            isValid = false;
        }
        if (!email.value.trim()) {
            document.getElementById('emailError').textContent = 'Please enter your email address';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            document.getElementById('emailError').textContent = 'Please enter a valid email address';
            isValid = false;
        }
        if (!subject.value) {
            document.getElementById('subjectError').textContent = 'Please choose a topic';
            isValid = false;
        }
        if (!message.value.trim()) {
            document.getElementById('messageError').textContent = 'Please write your message';
            isValid = false;
        } else if (message.value.trim().length < 20) {
            document.getElementById('messageError').textContent = 'Your message must be at least 20 characters';
            isValid = false;
        }
        return isValid;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
