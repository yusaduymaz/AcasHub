/**
 * admin.js — Complete Admin Panel Logic
 * Handles Authentication, Navigation, and CRUD for 3 sections:
 * - Services
 * - Testimonials
 * - Messages
 */

(function () {
    'use strict';

    let sb = null;
    function getClient() {
        if (sb) return sb;
        if (window.AcasHub && window.AcasHub.supabase) {
            sb = window.AcasHub.supabase;
            return sb;
        }
        return null;
    }

    // ─── UTILS ──────────────────────────────────────────────────────
    function showToast(message, type) {
        type = type || 'success';
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${escapeHTML(message)}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // ─── NAVIGATION ─────────────────────────────────────────────────
    function initNavigation() {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Update active state in nav
                document.querySelectorAll('.sidebar-nav .nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Show target section
                const target = item.getAttribute('data-section');
                document.querySelectorAll('.admin-section').forEach(sec => {
                    sec.style.display = sec.id === `section-${target}` ? 'block' : 'none';
                });

                // Load data based on section
                if (target === 'services') loadServices();
                if (target === 'solutions') loadSolutions();
                if (target === 'partners') loadPartners();
                if (target === 'testimonials') loadTestimonials();
                if (target === 'content') loadSiteContent();
                if (target === 'messages') loadMessages();
                
                // Close mobile sidebar
                document.getElementById('sidebar').classList.remove('open');
            });
        });

        // Add minimal CSS dynamically for section toggling since we changed class structure a bit
        const style = document.createElement('style');
        style.innerHTML = `.admin-section { display: none; } .admin-section.active { display: block; }`;
        document.head.appendChild(style);
        
        // Ensure default section is visible
        document.getElementById('section-services').style.display = 'block';
    }

    // ─── AUTHENTICATION ─────────────────────────────────────────────
    async function checkSession() {
        const client = getClient();
        if (!client) return;
        
        // Setup listener for auth state changes (like logout from another tab)
        client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                window.location.replace('login.html');
            }
        });

        const { data, error } = await client.auth.getSession();
        if (error || !data || !data.session) {
            window.location.replace('login.html');
            return;
        }
        
        showDashboard(data.session.user);
    }

    async function handleLogout() {
        const client = getClient();
        if (client) {
            await client.auth.signOut();
            window.location.replace('login.html');
        }
    }

    function showDashboard(user) {
        // Just setup the dashboard since we're guaranteed to be logged in
        if (user && user.email) document.getElementById('userEmail').textContent = user.email;
        loadServices();
        checkUnreadMessages();
    }

    // ─── SERVICES ───────────────────────────────────────────────────
    async function loadServices() {
        const client = getClient();
        const tbody = document.getElementById('servicesTableBody');
        tbody.innerHTML = '<tr><td colspan="7" class="table-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        
        try {
            const { data, error } = await client.from('services').select('*').order('sort_order', { ascending: true });
            if (error) throw error;
            
            const activeCount = data.filter(s => s.is_active).length;
            document.getElementById('totalServices').textContent = data.length;
            document.getElementById('activeServices').textContent = activeCount;
            document.getElementById('inactiveServices').textContent = data.length - activeCount;

            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No services found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(s => {
                const fHTML = (s.features || []).slice(0, 2).map(f => `<span class="feature-tag">${escapeHTML(f)}</span>`).join('') + 
                              (s.features?.length > 2 ? `<span class="feature-tag">+${s.features.length - 2}</span>` : '');
                return `<tr>
                    <td>${s.sort_order}</td>
                    <td><div class="cell-icon"><i class="fas fa-${s.icon_name || 'briefcase'}"></i></div></td>
                    <td class="cell-title">${escapeHTML(s.title)}</td>
                    <td class="cell-desc">${escapeHTML(s.description)}</td>
                    <td><div class="cell-features">${fHTML}</div></td>
                    <td><span class="status-badge ${s.is_active ? 'active' : 'inactive'}"><i class="fas fa-circle"></i> ${s.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><div class="action-buttons">
                        <button class="btn-icon" onclick="AdminPanel.editService('${s.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn-icon danger" onclick="AdminPanel.deleteItem('services', '${s.id}', '${escapeHTML(s.title).replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                    </div></td>
                </tr>`;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error: ${escapeHTML(err.message)}</td></tr>`;
        }
    }

    async function handleServiceSave(e) {
        e.preventDefault();
        const client = getClient();
        const id = document.getElementById('serviceId').value;
        const featuresRaw = document.getElementById('serviceFeatures').value.trim();
        
        const payload = {
            title: document.getElementById('serviceTitle').value.trim(),
            icon_name: document.getElementById('serviceIcon').value.trim(),
            description: document.getElementById('serviceDescription').value.trim(),
            features: featuresRaw ? featuresRaw.split('\\n').map(f => f.trim()).filter(Boolean) : [],
            sort_order: parseInt(document.getElementById('serviceSortOrder').value) || 0,
            is_active: document.getElementById('serviceActive').checked
        };

        try {
            const { error } = id ? await client.from('services').update(payload).eq('id', id) 
                                 : await client.from('services').insert(payload);
            if (error) throw error;
            
            AdminPanel.closeModal('serviceModal');
            showToast('Service saved.');
            loadServices();
        } catch (err) {
            document.getElementById('serviceFormError').textContent = err.message;
            document.getElementById('serviceFormError').classList.add('visible');
        }
    }

    // ─── SOLUTIONS ──────────────────────────────────────────────────
    async function loadSolutions() {
        const client = getClient();
        const tbody = document.getElementById('solutionsTableBody');
        tbody.innerHTML = '<tr><td colspan="6" class="table-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        
        try {
            const { data, error } = await client.from('solutions').select('*').order('sort_order', { ascending: true });
            if (error) throw error;
            
            document.getElementById('totalSolutions').textContent = data.length;
            document.getElementById('activeSolutions').textContent = data.filter(s => s.is_active).length;

            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No solutions found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(s => `<tr>
                <td>${s.sort_order}</td>
                <td class="font-bold">${escapeHTML(s.tab_label)}</td>
                <td class="cell-title">${escapeHTML(s.title)}</td>
                <td><img src="${escapeHTML(s.image_url)}" height="40" style="border-radius:4px"></td>
                <td><span class="status-badge ${s.is_active ? 'active' : 'inactive'}"><i class="fas fa-circle"></i> ${s.is_active ? 'Active' : 'Inactive'}</span></td>
                <td><div class="action-buttons">
                    <button class="btn-icon" onclick="AdminPanel.editSolution('${s.id}')"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon danger" onclick="AdminPanel.deleteItem('solutions', '${s.id}', '${escapeHTML(s.tab_label).replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>`).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Error: ${escapeHTML(err.message)}</td></tr>`;
        }
    }

    async function handleSolutionSave(e) {
        e.preventDefault();
        const client = getClient();
        const id = document.getElementById('solutionId').value;
        const featuresRaw = document.getElementById('solFeatures').value.trim();
        
        const payload = {
            tab_label: document.getElementById('solTabLabel').value.trim(),
            title: document.getElementById('solTitle').value.trim(),
            description: document.getElementById('solDescription').value.trim(),
            image_url: document.getElementById('solImage').value.trim(),
            features: featuresRaw ? featuresRaw.split('\\n').map(f => f.trim()).filter(Boolean) : [],
            sort_order: parseInt(document.getElementById('solSortOrder').value) || 0,
            is_active: document.getElementById('solActive').checked
        };

        try {
            const { error } = id ? await client.from('solutions').update(payload).eq('id', id) 
                                 : await client.from('solutions').insert(payload);
            if (error) throw error;
            AdminPanel.closeModal('solutionModal');
            showToast('Solution saved.');
            loadSolutions();
        } catch (err) {
            document.getElementById('solutionFormError').textContent = err.message;
            document.getElementById('solutionFormError').classList.add('visible');
        }
    }

    // ─── PARTNERS ───────────────────────────────────────────────────
    async function loadPartners() {
        const client = getClient();
        const tbody = document.getElementById('partnersTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="table-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        
        try {
            const { data, error } = await client.from('partners').select('*').order('sort_order', { ascending: true });
            if (error) throw error;
            
            document.getElementById('totalPartners').textContent = data.length;
            document.getElementById('activePartners').textContent = data.filter(p => p.is_active).length;

            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No partners found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(p => `<tr>
                <td>${p.sort_order}</td>
                <td class="font-bold">${escapeHTML(p.name)}</td>
                <td><img src="${escapeHTML(p.image_url)}" height="40" style="border-radius:4px"></td>
                <td><span class="status-badge ${p.is_active ? 'active' : 'inactive'}"><i class="fas fa-circle"></i> ${p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td><div class="action-buttons">
                    <button class="btn-icon" onclick="AdminPanel.editPartner('${p.id}')"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon danger" onclick="AdminPanel.deleteItem('partners', '${p.id}', '${escapeHTML(p.name).replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>`).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Error: ${escapeHTML(err.message)}</td></tr>`;
        }
    }

    async function handlePartnerSave(e) {
        e.preventDefault();
        const client = getClient();
        const id = document.getElementById('partnerId').value;
        
        const payload = {
            name: document.getElementById('pName').value.trim(),
            image_url: document.getElementById('pImage').value.trim(),
            sort_order: parseInt(document.getElementById('pSortOrder').value) || 0,
            is_active: document.getElementById('pActive').checked
        };

        try {
            const { error } = id ? await client.from('partners').update(payload).eq('id', id) 
                                 : await client.from('partners').insert(payload);
            if (error) throw error;
            AdminPanel.closeModal('partnerModal');
            showToast('Partner saved.');
            loadPartners();
        } catch (err) {
            document.getElementById('partnerFormError').textContent = err.message;
            document.getElementById('partnerFormError').classList.add('visible');
        }
    }

    // ─── SITE CONTENT ───────────────────────────────────────────────
    async function loadSiteContent() {
        const client = getClient();
        try {
            const { data, error } = await client.from('site_content').select('*');
            if (error) throw error;
            
            data.forEach(row => {
                const sec = row.section;
                const c = row.content || {};
                
                if (sec === 'hero') {
                    document.getElementById('heroTitle1').value = c.title_line1 || '';
                    document.getElementById('heroTitle2').value = c.title_highlight || '';
                    document.getElementById('heroTitle3').value = c.title_line2 || '';
                    document.getElementById('heroSubtitle').value = c.subtitle || '';
                    document.getElementById('heroImage').value = c.image_url || '';
                } else if (sec === 'about') {
                    document.getElementById('aboutTitle1').value = c.title_normal || '';
                    document.getElementById('aboutTitle2').value = c.title_highlight || '';
                    document.getElementById('aboutP1').value = c.paragraph1 || '';
                    document.getElementById('aboutP2').value = c.paragraph2 || '';
                    document.getElementById('aboutFeatures').value = (c.features || []).join('\n');
                    document.getElementById('aboutImage').value = c.image_url || '';
                }
            });
        } catch (err) {
            showToast('Failed to load site content.', 'error');
            console.error(err);
        }
    }

    async function handleSiteContentSave() {
        const client = getClient();
        const errEl = document.getElementById('contentFormError');
        errEl.classList.remove('visible');

        const heroContent = {
            title_line1: document.getElementById('heroTitle1').value.trim(),
            title_highlight: document.getElementById('heroTitle2').value.trim(),
            title_line2: document.getElementById('heroTitle3').value.trim(),
            subtitle: document.getElementById('heroSubtitle').value.trim(),
            image_url: document.getElementById('heroImage').value.trim()
        };

        const featuresRaw = document.getElementById('aboutFeatures').value.trim();
        const aboutContent = {
            title_normal: document.getElementById('aboutTitle1').value.trim(),
            title_highlight: document.getElementById('aboutTitle2').value.trim(),
            paragraph1: document.getElementById('aboutP1').value.trim(),
            paragraph2: document.getElementById('aboutP2').value.trim(),
            features: featuresRaw ? featuresRaw.split('\n').map(f => f.trim()).filter(Boolean) : [],
            image_url: document.getElementById('aboutImage').value.trim()
        };

        try {
            const { error: err1 } = await client.from('site_content').upsert({ section: 'hero', content: heroContent });
            if (err1) throw err1;

            const { error: err2 } = await client.from('site_content').upsert({ section: 'about', content: aboutContent });
            if (err2) throw err2;

            showToast('Site content saved successfully!');
        } catch (err) {
            errEl.textContent = err.message;
            errEl.classList.add('visible');
        }
    }

    // ─── TESTIMONIALS ───────────────────────────────────────────────
    async function loadTestimonials() {
        const client = getClient();
        const tbody = document.getElementById('testimonialsTableBody');
        tbody.innerHTML = '<tr><td colspan="7" class="table-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        
        try {
            const { data, error } = await client.from('testimonials').select('*').order('sort_order', { ascending: true });
            if (error) throw error;
            
            document.getElementById('totalTestimonials').textContent = data.length;
            document.getElementById('activeTestimonials').textContent = data.filter(t => t.is_active).length;

            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No testimonials found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(t => {
                return `<tr>
                    <td>${t.sort_order}</td>
                    <td class="cell-title">${escapeHTML(t.client_name)}<br><small class="text-muted">${escapeHTML(t.client_title)}</small></td>
                    <td class="cell-desc">${escapeHTML(t.quote)}</td>
                    <td>${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</td>
                    <td><span class="status-badge ${t.is_active ? 'active' : 'inactive'}"><i class="fas fa-circle"></i> ${t.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><div class="action-buttons">
                        <button class="btn-icon" onclick="AdminPanel.editTestimonial('${t.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn-icon danger" onclick="AdminPanel.deleteItem('testimonials', '${t.id}', '${escapeHTML(t.client_name).replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                    </div></td>
                </tr>`;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error: ${escapeHTML(err.message)}</td></tr>`;
        }
    }

    async function handleTestimonialSave(e) {
        e.preventDefault();
        const client = getClient();
        const id = document.getElementById('testimonialId').value;
        
        const payload = {
            client_name: document.getElementById('tClientName').value.trim(),
            client_title: document.getElementById('tClientTitle').value.trim(),
            client_image: document.getElementById('tClientImage').value.trim(),
            quote: document.getElementById('tQuote').value.trim(),
            rating: parseInt(document.getElementById('tRating').value),
            service_icon: document.getElementById('tServiceIcon').value.trim(),
            service_label: document.getElementById('tServiceLabel').value.trim(),
            testimonial_date: document.getElementById('tDate').value.trim(),
            sort_order: parseInt(document.getElementById('tSortOrder').value) || 0,
            is_active: document.getElementById('tActive').checked
        };

        try {
            const { error } = id ? await client.from('testimonials').update(payload).eq('id', id) 
                                 : await client.from('testimonials').insert(payload);
            if (error) throw error;
            
            AdminPanel.closeModal('testimonialModal');
            showToast('Testimonial saved.');
            loadTestimonials();
        } catch (err) {
            document.getElementById('testimonialFormError').textContent = err.message;
            document.getElementById('testimonialFormError').classList.add('visible');
        }
    }

    // ─── MESSAGES ───────────────────────────────────────────────────
    async function loadMessages() {
        const client = getClient();
        const tbody = document.getElementById('messagesTableBody');
        tbody.innerHTML = '<tr><td colspan="7" class="table-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        
        try {
            const { data, error } = await client.from('contact_messages').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            
            const readCount = data.filter(m => m.is_read).length;
            const unreadCount = data.length - readCount;
            document.getElementById('totalMessages').textContent = data.length;
            document.getElementById('readMessages').textContent = readCount;
            document.getElementById('unreadMessages').textContent = unreadCount;

            // Update badge
            const badge = document.getElementById('unreadBadge');
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';

            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No messages found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(m => {
                return `<tr class="${m.is_read ? '' : 'font-bold'}" style="${m.is_read ? '' : 'background: rgba(255,255,255,0.05);'}">
                    <td style="white-space:nowrap">${formatDate(m.created_at)}</td>
                    <td class="cell-title">${escapeHTML(m.name)}</td>
                    <td>${escapeHTML(m.email)}</td>
                    <td>${escapeHTML(m.subject)}</td>
                    <td class="cell-desc">${escapeHTML(m.message)}</td>
                    <td><span class="status-badge ${m.is_read ? 'inactive' : 'active'}">${m.is_read ? 'Read' : 'Unread'}</span></td>
                    <td><div class="action-buttons">
                        <button class="btn-icon" onclick="AdminPanel.viewMessage('${m.id}')" title="View"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon danger" onclick="AdminPanel.deleteItem('contact_messages', '${m.id}', 'message from ${escapeHTML(m.name).replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
                    </div></td>
                </tr>`;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error: ${escapeHTML(err.message)}</td></tr>`;
        }
    }

    async function checkUnreadMessages() {
        const client = getClient();
        if(!client) return;
        const { count } = await client.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false);
        const badge = document.getElementById('unreadBadge');
        if (badge) {
            badge.textContent = count || 0;
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
            // Simple styling for the badge
            badge.style.background = 'var(--danger)';
            badge.style.color = '#fff';
            badge.style.fontSize = '0.7rem';
            badge.style.padding = '0.1rem 0.4rem';
            badge.style.borderRadius = '1rem';
            badge.style.marginLeft = 'auto';
        }
    }

    async function viewMessage(id) {
        const client = getClient();
        try {
            const { data, error } = await client.from('contact_messages').select('*').eq('id', id).single();
            if (error) throw error;
            
            // Mark as read if not already
            if (!data.is_read) {
                await client.from('contact_messages').update({ is_read: true }).eq('id', id);
                loadMessages(); // refresh table
                checkUnreadMessages();
            }

            const body = document.getElementById('messageDetailBody');
            body.innerHTML = `
                <div style="margin-bottom:1rem">
                    <strong>From:</strong> ${escapeHTML(data.name)} &lt;${escapeHTML(data.email)}&gt;<br>
                    <strong>Phone:</strong> ${escapeHTML(data.phone || 'N/A')}<br>
                    <strong>Date:</strong> ${formatDate(data.created_at)}
                </div>
                <div style="margin-bottom:1rem; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-sm);">
                    <strong style="display:block; margin-bottom:0.5rem">Subject: ${escapeHTML(data.subject)}</strong>
                    <div style="white-space: pre-wrap;">${escapeHTML(data.message)}</div>
                </div>
            `;
            
            document.getElementById('deleteMessageBtn').onclick = () => {
                AdminPanel.closeModal('messageModal');
                AdminPanel.deleteItem('contact_messages', id, 'message from ' + data.name);
            };

            document.getElementById('messageModal').style.display = 'flex';
        } catch (err) {
            showToast('Failed to load message.', 'error');
        }
    }

    // ─── DELETE ITEM (GENERIC) ──────────────────────────────────────
    let pendingDelete = null;
    function openDeleteModal(table, id, name) {
        pendingDelete = { table, id };
        document.getElementById('deleteItemName').textContent = name;
        document.getElementById('deleteModal').style.display = 'flex';
    }

    async function confirmDelete() {
        if (!pendingDelete) return;
        const btn = document.getElementById('deleteConfirmBtn');
        btn.disabled = true;
        try {
            const { error } = await getClient().from(pendingDelete.table).delete().eq('id', pendingDelete.id);
            if (error) throw error;
            
            AdminPanel.closeModal('deleteModal');
            showToast('Item deleted.');
            
            // Reload active section
            if (pendingDelete.table === 'services') loadServices();
            if (pendingDelete.table === 'solutions') loadSolutions();
            if (pendingDelete.table === 'partners') loadPartners();
            if (pendingDelete.table === 'testimonials') loadTestimonials();
            if (pendingDelete.table === 'contact_messages') loadMessages();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    // ─── INITIALIZATION ─────────────────────────────────────────────
    function bindEvents() {
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        
        document.getElementById('serviceForm').addEventListener('submit', handleServiceSave);
        document.getElementById('solutionForm').addEventListener('submit', handleSolutionSave);
        document.getElementById('partnerForm').addEventListener('submit', handlePartnerSave);
        document.getElementById('testimonialForm').addEventListener('submit', handleTestimonialSave);
        document.getElementById('deleteConfirmBtn').addEventListener('click', confirmDelete);

        // Active toggle listeners
        document.getElementById('serviceActive').addEventListener('change', function() { document.getElementById('serviceToggleLabel').textContent = this.checked ? 'Active' : 'Inactive'; });
        document.getElementById('solActive').addEventListener('change', function() { document.getElementById('solToggleLabel').textContent = this.checked ? 'Active' : 'Inactive'; });
        document.getElementById('pActive').addEventListener('change', function() { document.getElementById('pToggleLabel').textContent = this.checked ? 'Active' : 'Inactive'; });
        document.getElementById('tActive').addEventListener('change', function() { document.getElementById('tToggleLabel').textContent = this.checked ? 'Active' : 'Inactive'; });

        // Close on esc/click
        document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); });
        document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; }));
    }

    window.AdminPanel = {
        closeModal: id => document.getElementById(id).style.display = 'none',
        deleteItem: openDeleteModal,
        viewMessage: viewMessage,
        saveSiteContent: handleSiteContentSave,
        
        openServiceModal: () => {
            document.getElementById('serviceForm').reset();
            document.getElementById('serviceId').value = '';
            document.getElementById('serviceFormError').classList.remove('visible');
            document.getElementById('serviceModalTitle').textContent = 'Add Service';
            document.getElementById('serviceModal').style.display = 'flex';
        },
        editService: async (id) => {
            const { data } = await getClient().from('services').select('*').eq('id', id).single();
            if (!data) return;
            document.getElementById('serviceId').value = data.id;
            document.getElementById('serviceTitle').value = data.title;
            document.getElementById('serviceIcon').value = data.icon_name;
            document.getElementById('serviceDescription').value = data.description;
            document.getElementById('serviceFeatures').value = (data.features || []).join('\n');
            document.getElementById('serviceSortOrder').value = data.sort_order;
            document.getElementById('serviceActive').checked = data.is_active;
            document.getElementById('serviceToggleLabel').textContent = data.is_active ? 'Active' : 'Inactive';
            document.getElementById('serviceModalTitle').textContent = 'Edit Service';
            document.getElementById('serviceModal').style.display = 'flex';
        },

        openSolutionModal: () => {
            document.getElementById('solutionForm').reset();
            document.getElementById('solutionId').value = '';
            document.getElementById('solutionFormError').classList.remove('visible');
            document.getElementById('solutionModalTitle').textContent = 'Add Solution';
            document.getElementById('solutionModal').style.display = 'flex';
        },
        editSolution: async (id) => {
            const { data } = await getClient().from('solutions').select('*').eq('id', id).single();
            if (!data) return;
            document.getElementById('solutionId').value = data.id;
            document.getElementById('solTabLabel').value = data.tab_label;
            document.getElementById('solTitle').value = data.title;
            document.getElementById('solImage').value = data.image_url;
            document.getElementById('solDescription').value = data.description;
            document.getElementById('solFeatures').value = (data.features || []).join('\n');
            document.getElementById('solSortOrder').value = data.sort_order;
            document.getElementById('solActive').checked = data.is_active;
            document.getElementById('solToggleLabel').textContent = data.is_active ? 'Active' : 'Inactive';
            document.getElementById('solutionModalTitle').textContent = 'Edit Solution';
            document.getElementById('solutionModal').style.display = 'flex';
        },

        openPartnerModal: () => {
            document.getElementById('partnerForm').reset();
            document.getElementById('partnerId').value = '';
            document.getElementById('partnerFormError').classList.remove('visible');
            document.getElementById('partnerModalTitle').textContent = 'Add Partner';
            document.getElementById('partnerModal').style.display = 'flex';
        },
        editPartner: async (id) => {
            const { data } = await getClient().from('partners').select('*').eq('id', id).single();
            if (!data) return;
            document.getElementById('partnerId').value = data.id;
            document.getElementById('pName').value = data.name;
            document.getElementById('pImage').value = data.image_url;
            document.getElementById('pSortOrder').value = data.sort_order;
            document.getElementById('pActive').checked = data.is_active;
            document.getElementById('pToggleLabel').textContent = data.is_active ? 'Active' : 'Inactive';
            document.getElementById('partnerModalTitle').textContent = 'Edit Partner';
            document.getElementById('partnerModal').style.display = 'flex';
        },

        openTestimonialModal: () => {
            document.getElementById('testimonialForm').reset();
            document.getElementById('testimonialId').value = '';
            document.getElementById('testimonialFormError').classList.remove('visible');
            document.getElementById('testimonialModalTitle').textContent = 'Add Testimonial';
            document.getElementById('testimonialModal').style.display = 'flex';
        },
        editTestimonial: async (id) => {
            const { data } = await getClient().from('testimonials').select('*').eq('id', id).single();
            if (!data) return;
            document.getElementById('testimonialId').value = data.id;
            document.getElementById('tClientName').value = data.client_name;
            document.getElementById('tClientTitle').value = data.client_title;
            document.getElementById('tClientImage').value = data.client_image;
            document.getElementById('tQuote').value = data.quote;
            document.getElementById('tRating').value = data.rating;
            document.getElementById('tServiceIcon').value = data.service_icon;
            document.getElementById('tServiceLabel').value = data.service_label;
            document.getElementById('tDate').value = data.testimonial_date;
            document.getElementById('tSortOrder').value = data.sort_order;
            document.getElementById('tActive').checked = data.is_active;
            document.getElementById('tToggleLabel').textContent = data.is_active ? 'Active' : 'Inactive';
            document.getElementById('testimonialModalTitle').textContent = 'Edit Testimonial';
            document.getElementById('testimonialModal').style.display = 'flex';
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        initNavigation();
        bindEvents();
        checkSession();
    });
})();
