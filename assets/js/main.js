// script.js - Main JavaScript for AcasHub Accounting Website

document.addEventListener('DOMContentLoaded', function () {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.main-nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', function () {
            this.classList.toggle('active');
            nav.classList.toggle('open');
            this.setAttribute('aria-expanded', this.classList.contains('active'));
        });
    }

    // Close mobile menu when clicking on nav links
    const navLinks = document.querySelectorAll('.main-nav__item a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('open')) {
                hamburger.classList.remove('active');
                nav.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Tüm mobil menü linkleri ve butonları için
    document.querySelectorAll('.mobile-nav a, .mobile-cta-button').forEach(item => {
        item.addEventListener('click', function (e) {

            // YENİ EKLENEN KISIM: Eğer bu bir dropdown açıcı link ise (Services vb.), menüyü kapatma işlemini yapma ve fonksiyondan çık.
            if (this.parentElement.classList.contains('mobile-dropdown') && this.classList.contains('mobile-nav-link')) {
                return;
            }

            // Menüyü kapat
            const mobileMenu = document.querySelector('.mobile-nav');
            if (mobileMenu.classList.contains('active')) {
                document.querySelector('.mobile-menu-toggle').classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }

            // Hash link ise scroll et
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    // Tab functionality for Solutions section
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    if (tabButtons.length && tabPanels.length) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                    btn.setAttribute('tabindex', '-1');
                });

                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    panel.setAttribute('hidden', '');
                });

                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
                button.removeAttribute('tabindex');

                const panelId = button.getAttribute('aria-controls');
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.classList.add('active');
                    panel.removeAttribute('hidden');
                    panel.focus();
                }
            });
        });
    }
    // Initialize testimonial slider
    initTestimonialSlider();

    // Testimonials Animation
    function initTestimonials() {
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        const statsCards = document.querySelectorAll('.stats-card');

        // Intersection Observer for testimonial cards
        const testimonialObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, index * 150);
                }
            });
        }, { threshold: 0.1 });

        testimonialCards.forEach(card => testimonialObserver.observe(card));

        // Intersection Observer for stats cards
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, index * 200);
                }
            });
        }, { threshold: 0.1 });

        statsCards.forEach(card => statsObserver.observe(card));
    }

    document.addEventListener('DOMContentLoaded', initTestimonials);


    // Animate stats counter
    const animateStats = () => {
        const statNumbers = document.querySelectorAll('.stat-number');
        if (!statNumbers.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = +entry.target.getAttribute('data-count');
                    const suffix = entry.target.getAttribute('data-suffix') || '';
                    const duration = 2000; // Animation duration in ms
                    const start = 0;
                    const increment = target / (duration / 16); // 60fps

                    let current = start;
                    const counter = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            clearInterval(counter);
                            current = target;
                        }

                        entry.target.textContent = Math.floor(current) + suffix;
                    }, 16);

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(number => {
            observer.observe(number);
        });
    };

    animateStats();

    // Work progress animation
    const animateWorkProgress = () => {
        const workDoneBar = document.querySelector('.skills__bar.work-done-bar');
        const workDoneText = document.querySelector('.skills__percentage.work-done');

        if (workDoneBar && workDoneText) {
            const targetPercentage = 85; // Set your actual percentage here
            let currentPercentage = 0;

            const interval = setInterval(() => {
                if (currentPercentage >= targetPercentage) {
                    clearInterval(interval);
                    return;
                }

                currentPercentage++;
                workDoneBar.style.width = `${currentPercentage}%`;
                workDoneText.textContent = `${currentPercentage}%`;
            }, 30);
        }
    };

    animateWorkProgress();

    // Lazy loading for images
    const lazyLoadImages = () => {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.removeAttribute('loading');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }
    };

    lazyLoadImages();

    // Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX'); // Replace with your GA ID

    // Form validation would go here if you had forms
});

// Service Worker Registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Animate stats counter
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!statNumbers.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = +entry.target.getAttribute('data-count');
                const suffix = entry.target.getAttribute('data-suffix') || '';
                const duration = 2000;
                const start = 0;
                const increment = target / (duration / 16);

                let current = start;
                const counter = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        clearInterval(counter);
                        current = target;
                    }

                    entry.target.textContent = Math.floor(current) + suffix;
                }, 16);

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(number => {
        observer.observe(number);
    });
}

// Initialize particles.js if needed
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            // Your particles.js config here
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    animateStats();
    initParticles();
});

document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('.main-header');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileDropdowns = document.querySelectorAll('.mobile-dropdown');

    // Scroll event for header effect
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    mobileToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        mobileNav.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    });

    // Mobile dropdown functionality
    mobileDropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.mobile-nav-link');

        link.addEventListener('click', function (e) {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });
    });

    // Close mobile menu when clicking on a link
    const mobileLinks = document.querySelectorAll('.mobile-nav-link:not(.mobile-dropdown .mobile-nav-link), .mobile-dropdown-item');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function () {
            mobileToggle.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });
    });
});


document.addEventListener('DOMContentLoaded', function () {
    // EmailJS başlatma
    emailjs.init('your public key');

    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const newMessageBtn = document.getElementById('newMessageBtn');
    const submitBtn = contactForm.querySelector('.submit-btn');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Form doğrulama
            if (validateForm()) {
                // Gönderim butonunu güncelle
                submitBtn.innerHTML = '<span>Sending...</span>';
                submitBtn.disabled = true;
                const serviceID = 'YOUR_SERVICE_ID';
                const templateID = 'YOUR_TEMPLATE_ID';

                emailjs.sendForm(serviceID, templateID, this)
                    .then(() => {
                        // Başarılı durumda
                        contactForm.style.display = 'none';
                        formSuccess.classList.add('active');
                    }, (err) => {
                        // Hata durumunda
                        console.error('Hata:', err);
                        alert('An error occurred while sending the message:' + JSON.stringify(err));
                    })
                    .finally(() => {
                        // Her durumda butonu eski haline getir
                        submitBtn.innerHTML = '<span>Send Message</span><svg class="send-icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
                        submitBtn.disabled = false;
                    });
            }
        });
    }

    // Yeni mesaj butonu işlevi
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', function () {
            formSuccess.classList.remove('active');
            contactForm.style.display = 'block';
            contactForm.reset();
        });
    }

    // Form doğrulama fonksiyonu (mevcut koddan)
    function validateForm() {
        let isValid = true;
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const subject = document.getElementById('subject');
        const message = document.getElementById('message');

        // Hata mesajlarını sıfırla
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });

        // İsim doğrulama
        if (name.value.trim() === '') {
            document.getElementById('nameError').textContent = 'Please enter your name';
            isValid = false;
        }

        // Email doğrulama
        if (email.value.trim() === '') {
            document.getElementById('emailError').textContent = 'Please enter your email address';
            isValid = false;
        } else if (!isValidEmail(email.value)) {
            document.getElementById('emailError').textContent = 'Please enter a valid email address';
            isValid = false;
        }

        // Konu doğrulama
        if (subject.value === '') {
            document.getElementById('subjectError').textContent = 'Please choose a topic';
            isValid = false;
        }

        // Mesaj doğrulama
        if (message.value.trim() === '') {
            document.getElementById('messageError').textContent = 'Please write your message';
            isValid = false;
        } else if (message.value.trim().length < 20) {
            document.getElementById('messageError').textContent = 'Your message must be at least 20 characters';
            isValid = false;
        }

        return isValid;
    }

    // Email format kontrolü
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});
let formSubmitTime = 0;
form.addEventListener('submit', function (e) {
    // 3 saniyeden hızlı gönderimleri engelle
    if (Date.now() - formSubmitTime < 3000) return false;
    formSubmitTime = Date.now();

    // Honeypot kontrolü
    if (document.getElementById('bot-check').value) return false;
});

// EmailJS with Advanced Bot Protection
document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    // Honeypot kontrolü
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'honeypot';
    honeypot.style.display = 'none';
    honeypot.tabIndex = -1;
    contactForm.appendChild(honeypot);

    // reCAPTCHA yüklendi mi kontrolü
    window.recaptchaLoaded = function () {
        console.log('reCAPTCHA ready');
    };

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Honeypot kontrolü
        if (honeypot.value) {
            console.log('Bot detected (honeypot)');
            return;
        }

        // reCAPTCHA token al
        let token;
        try {
            token = await new Promise((resolve, reject) => {
                grecaptcha.ready(() => {
                    grecaptcha.execute('YOUR_SITE_KEY', { action: 'submit' })
                        .then(resolve)
                        .catch(reject);
                });
            });
            document.getElementById('g-recaptcha-response').value = token;
        } catch (err) {
            console.error('reCAPTCHA error:', err);
            alert('Güvenlik doğrulaması başarısız. Lütfen sayfayı yenileyin.');
            return;
        }

        // Form doğrulama
        if (!validateForm()) return;

        // Gönderim butonunu güncelle
        const submitBtn = contactForm.querySelector('.submit-btn');
        submitBtn.innerHTML = '<span>Gönderiliyor...</span>';
        submitBtn.disabled = true;

        // EmailJS gönderim
        try {
            const response = await emailjs.sendForm(
                'default_service',
                'template_xsgpiai',
                this
            );

            contactForm.style.display = 'none';
            document.getElementById('formSuccess').classList.add('active');
        } catch (err) {
            console.error('Gönderim hatası:', err);
            alert('Mesaj gönderilirken bir hata oluştu: ' + err.text);
        } finally {
            submitBtn.innerHTML = '<span>Mesaj Gönder</span><svg class="send-icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
            submitBtn.disabled = false;
        }
    });
});

/* 
Alternative: Using Fetch API to your own backend
fetch('your-backend-endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => {
    contactForm.style.display = 'none';
    formSuccess.classList.add('active');
})
.catch((error) => {
    console.error('Error:', error);
    alert('There was an error sending your message. Please try again later.');
})
.finally(() => {
    submitBtn.innerHTML = '<span>Send Message</span><svg class="send-icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
    submitBtn.disabled = false;
});
*/

function initTestimonialSlider() {
    const slider = document.querySelector('.testimonial-slider');
    const slides = slider ? slider.querySelectorAll('.testimonial-slide') : null;
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const dotsContainer = document.querySelector('.slider-dots');

    if (!slider || !slides || !slides.length || !prevBtn || !nextBtn || !dotsContainer) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    function createDots() {
        dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const isActive = index === 0 ? 'active' : '';
            dotsContainer.insertAdjacentHTML(
                'beforeend',
                `<button class="slider-dot ${isActive}" data-slide="${index}"></button>`
            );
        });
    }

    function updateActiveSlide(slideIndex) {
        slider.style.transform = `translateX(-${slideIndex * 100}%)`;
        document.querySelectorAll('.slider-dot').forEach((dot) => dot.classList.remove('active'));
        const activeDot = document.querySelector(`.slider-dot[data-slide="${slideIndex}"]`);
        if (activeDot) activeDot.classList.add('active');
        currentSlide = slideIndex;
    }

    function nextSlide() {
        const next = (currentSlide + 1) % totalSlides;
        updateActiveSlide(next);
    }

    function prevSlide() {
        const prev = (currentSlide - 1 + totalSlides) % totalSlides;
        updateActiveSlide(prev);
    }

    function goToSlide(e) {
        if (!e.target.classList.contains('slider-dot')) return;
        const slideIndex = parseInt(e.target.dataset.slide, 10);
        if (!Number.isNaN(slideIndex)) updateActiveSlide(slideIndex);
    }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    dotsContainer.addEventListener('click', goToSlide);

    createDots();
    updateActiveSlide(0);

    // Auto-play
    let slideInterval = setInterval(nextSlide, 5000);

    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });

    // Basic touch/swipe support
    let startX = 0;
    let isDragging = false;

    slider.addEventListener(
        'touchstart',
        (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
        },
        { passive: true }
    );

    slider.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diff = endX - startX;
        if (Math.abs(diff) > 50) {
            if (diff < 0) nextSlide();
            else prevSlide();
        }
        isDragging = false;
    });
}
