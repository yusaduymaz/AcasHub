/**
 * login.js — Admin Panel Login Logic
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async () => {
        if (!window.AcasHub || !window.AcasHub.supabase) {
            console.error('Supabase not loaded');
            return;
        }

        const client = window.AcasHub.supabase;

        // Redirect if already logged in
        const { data } = await client.auth.getSession();
        if (data && data.session) {
            window.location.replace('index.html');
            return;
        }

        // Listen to login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                const errorEl = document.getElementById('loginError');
                const btn = document.getElementById('loginBtn');
                errorEl.classList.remove('visible');

                if (!email || !password) {
                    errorEl.textContent = 'Please enter email and password.';
                    errorEl.classList.add('visible');
                    return;
                }

                btn.disabled = true;
                btn.querySelector('span').textContent = 'Signing in...';

                try {
                    const { error } = await client.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    // Successfully logged in
                    window.location.replace('index.html');
                } catch (err) {
                    errorEl.textContent = err.message || 'Invalid credentials.';
                    errorEl.classList.add('visible');
                    btn.disabled = false;
                    btn.querySelector('span').textContent = 'Sign In';
                }
            });
        }
    });
})();
