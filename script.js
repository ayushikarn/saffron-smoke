/**
 * ═══════════════════════════════════════════════════════════════
 *  SAFFRON & SMOKE — Premium Fine-Dining Restaurant
 *  Main JavaScript Module
 * ═══════════════════════════════════════════════════════════════
 *  Creates a cinematic, luxury-grade interactive experience.
 *  All features are isolated and wrapped in try-catch blocks
 *  so a single failure never breaks the entire page.
 * ═══════════════════════════════════════════════════════════════
 */

;(() => {
    'use strict';

    // ──────────────────────────────────────────────
    //  1. HELPER FUNCTIONS
    // ──────────────────────────────────────────────

    /** Linear interpolation — smoothly blend between two values */
    const lerp = (start, end, factor) => start + (end - start) * factor;

    /** Clamp a value within a min/max range */
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    /** Debounce — delay execution until calls stop for `wait` ms */
    const debounce = (fn, wait) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    };

    /** Random float between min (inclusive) and max (exclusive) */
    const getRandomFloat = (min, max) => Math.random() * (max - min) + min;

    /** Random integer between min and max (both inclusive) */
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    /** True if the current device supports touch */
    const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    /** True if viewport is wider than the given breakpoint */
    const isDesktop = (breakpoint = 1024) => window.innerWidth > breakpoint;


    // ──────────────────────────────────────────────
    //  2. PRELOADER
    // ──────────────────────────────────────────────

    const initPreloader = () => {
        const preloader = document.querySelector('.preloader');
        if (!preloader) return;

        // Lock scroll while loading
        document.body.style.overflow = 'hidden';

        window.addEventListener('load', () => {
            // Give the page a moment to settle, then fade out
            setTimeout(() => {
                preloader.classList.add('loaded');

                // After the CSS fade-out transition completes, hide entirely
                setTimeout(() => {
                    preloader.style.display = 'none';
                    document.body.style.overflow = '';
                }, 800);
            }, 1500);
        });
    };


    // ──────────────────────────────────────────────
    //  3. CUSTOM CURSOR
    // ──────────────────────────────────────────────

    const initCustomCursor = () => {
        if (isTouchDevice()) return; // no custom cursor on mobile / tablet

        // Create cursor elements
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';

        const follower = document.createElement('div');
        follower.className = 'cursor-follower';

        document.body.appendChild(cursor);
        document.body.appendChild(follower);

        // State
        let mouseX = 0;
        let mouseY = 0;
        let followerX = 0;
        let followerY = 0;
        let cursorVisible = true;

        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // The main dot follows instantly
            cursor.style.left = `${mouseX}px`;
            cursor.style.top = `${mouseY}px`;

            if (!cursorVisible) {
                cursor.style.opacity = '1';
                follower.style.opacity = '1';
                cursorVisible = true;
            }
        }, { passive: true });

        // Hide cursor when leaving the viewport
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            follower.style.opacity = '0';
            cursorVisible = false;
        });

        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
            follower.style.opacity = '1';
            cursorVisible = true;
        });

        // Follower lerp loop — gives the trailing, luxury feel
        const animateFollower = () => {
            followerX = lerp(followerX, mouseX, 0.12);
            followerY = lerp(followerY, mouseY, 0.12);
            follower.style.left = `${followerX}px`;
            follower.style.top = `${followerY}px`;
            requestAnimationFrame(animateFollower);
        };
        requestAnimationFrame(animateFollower);

        // Hover expansion on interactive elements
        const interactiveSelector = 'a, button, .btn, input, textarea, .nav-reserve, .menu-toggle, [data-cursor]';

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactiveSelector)) {
                cursor.classList.add('hover');
                follower.classList.add('hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactiveSelector)) {
                cursor.classList.remove('hover');
                follower.classList.remove('hover');
            }
        });
    };


    // ──────────────────────────────────────────────
    //  4. NAVBAR — scroll effect & active link tracking
    // ──────────────────────────────────────────────

    const initNavbar = () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        // --- Scroll class (throttled via rAF) ---
        let ticking = false;

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    if (window.scrollY > 80) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        // Run once on load in case user refreshed mid-page
        onScroll();

        // --- Active link tracking via IntersectionObserver ---
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');

        if (sections.length && navLinks.length) {
            const observerOptions = { threshold: 0.3 };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        navLinks.forEach((link) => {
                            const href = link.getAttribute('href');
                            // Handle cross-page links and same-page links
                            const isActive = href === `#${id}` || href === `index.html#${id}`;
                            // Don't auto-remove active from links pointing to current page if we are on menu.html
                            if (window.location.pathname.endsWith('menu.html') && href === '#menu-page') {
                                link.classList.add('active');
                            } else {
                                link.classList.toggle('active', isActive);
                            }
                        });
                    }
                });
            }, observerOptions);

            sections.forEach((section) => observer.observe(section));
        }
    };


    // ──────────────────────────────────────────────
    //  5. MOBILE MENU
    // ──────────────────────────────────────────────

    const initMobileMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        if (!menuToggle || !navLinks) return;

        const toggleMenu = (forceClose = false) => {
            const shouldClose = forceClose || menuToggle.classList.contains('active');

            menuToggle.classList.toggle('active', !shouldClose);
            navLinks.classList.toggle('active', !shouldClose);
            document.body.style.overflow = shouldClose ? '' : 'hidden';
        };

        // Hamburger click
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close when clicking a nav link
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => toggleMenu(true));
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (
                navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) &&
                !menuToggle.contains(e.target)
            ) {
                toggleMenu(true);
            }
        });
    };


    // ──────────────────────────────────────────────
    //  6. SMOOTH SCROLL
    // ──────────────────────────────────────────────

    const initSmoothScroll = () => {
        const NAVBAR_OFFSET = 80;

        document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                const isCrossPage = href.startsWith('index.html#');

                // If it's a cross-page link and we are not on index.html, let the browser handle it
                if (isCrossPage && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                    return;
                }

                // Get the ID target string
                const targetId = isCrossPage ? href.replace('index.html', '') : href;

                if (targetId === '#' || targetId.length < 2) return;

                const target = document.querySelector(targetId);
                if (!target) return;

                e.preventDefault();

                const targetPosition = target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                });
            });
        });
    };


    // ──────────────────────────────────────────────
    //  7. SCROLL REVEAL (IntersectionObserver)
    // ──────────────────────────────────────────────

    const initScrollReveal = () => {
        const revealElements = document.querySelectorAll('.reveal, .reveal-item, .reveal-scale');
        if (!revealElements.length) return;

        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px',
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');

                    // For staggered children — activate parent so CSS delays work
                    if (entry.target.classList.contains('stagger') && entry.target.parentElement) {
                        entry.target.parentElement.classList.add('active');
                    }

                    obs.unobserve(entry.target); // trigger only once
                }
            });
        }, observerOptions);

        revealElements.forEach((el) => observer.observe(el));
    };


    // ──────────────────────────────────────────────
    //  8. PARALLAX — scroll-based, desktop only
    // ──────────────────────────────────────────────

    const initParallax = () => {
        if (!isDesktop()) return;

        const heroBgImg = document.querySelector('.hero-bg img');
        const heroDish = document.querySelector('.hero-dish-wrapper');
        const parallaxBgElements = document.querySelectorAll('[data-parallax]');
        let parallaxTicking = false;

        const updateParallax = () => {
            const scrollY = window.scrollY;

            if (heroBgImg) {
                const bgOffset = clamp(scrollY * 0.3, 0, 300);
                heroBgImg.style.transform = `translateY(${bgOffset}px) scale(1.15)`;
            }

            if (heroDish) {
                const dishOffset = clamp(scrollY * -0.1, -100, 0);
                heroDish.style.transform = `translateY(${dishOffset}px)`;
            }

            // Generic parallax for menu backgrounds
            parallaxBgElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Check if element is in viewport
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    // Calculate a subtle offset based on position relative to center of screen
                    const offset = (rect.top - (window.innerHeight / 2)) * 0.15;
                    el.style.backgroundPositionY = `calc(50% + ${offset}px)`;
                }
            });

            parallaxTicking = false;
        };

        window.addEventListener('scroll', () => {
            if (!parallaxTicking) {
                requestAnimationFrame(updateParallax);
                parallaxTicking = true;
            }
        }, { passive: true });

        // Recalculate on resize — disable if user resizes to mobile
        window.addEventListener('resize', debounce(() => {
            if (!isDesktop()) {
                if (heroBgImg) heroBgImg.style.transform = '';
                if (heroDish) heroDish.style.transform = '';
                parallaxBgElements.forEach(el => el.style.backgroundPositionY = '');
            }
        }, 250));
    };


    // ──────────────────────────────────────────────
    //  9. MOUSE PARALLAX — hero section, desktop only
    // ──────────────────────────────────────────────

    const initMouseParallax = () => {
        if (!isDesktop() || isTouchDevice()) return;

        const hero = document.querySelector('.hero');
        if (!hero) return;

        const heroText = hero.querySelector('.hero-text');
        const heroDish = hero.querySelector('.hero-dish-wrapper');
        if (!heroText && !heroDish) return;

        // Current and target positions for smooth interpolation
        const state = {
            textX: 0, textY: 0,
            textTargetX: 0, textTargetY: 0,
            dishX: 0, dishY: 0,
            dishTargetX: 0, dishTargetY: 0,
        };

        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            // Normalise mouse position to -1…1 relative to hero center
            const normalX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const normalY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

            // Dish moves opposite to mouse (depth illusion)
            state.dishTargetX = -normalX * 15;
            state.dishTargetY = -normalY * 15;

            // Text moves slightly *with* the mouse
            state.textTargetX = normalX * 8;
            state.textTargetY = normalY * 8;
        }, { passive: true });

        // Reset targets when cursor leaves hero
        hero.addEventListener('mouseleave', () => {
            state.dishTargetX = 0;
            state.dishTargetY = 0;
            state.textTargetX = 0;
            state.textTargetY = 0;
        });

        const animateMouseParallax = () => {
            state.dishX = lerp(state.dishX, state.dishTargetX, 0.08);
            state.dishY = lerp(state.dishY, state.dishTargetY, 0.08);
            state.textX = lerp(state.textX, state.textTargetX, 0.08);
            state.textY = lerp(state.textY, state.textTargetY, 0.08);

            if (heroDish) {
                heroDish.style.transform = `translate(${state.dishX}px, ${state.dishY}px)`;
            }
            if (heroText) {
                heroText.style.transform = `translate(${state.textX}px, ${state.textY}px)`;
            }

            requestAnimationFrame(animateMouseParallax);
        };
        requestAnimationFrame(animateMouseParallax);
    };


    // ──────────────────────────────────────────────
    //  10. STEAM EFFECT — animated particles over dish
    // ──────────────────────────────────────────────

    const initSteamEffect = () => {
        const container = document.querySelector('.steam-container');
        if (!container) return;

        const PARTICLE_COUNT = 18;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const steam = document.createElement('div');
            steam.className = 'steam';

            const size = getRandomInt(4, 10);
            const leftPos = getRandomFloat(20, 80);      // 20%–80% within container
            const duration = getRandomFloat(3, 6);        // 3s–6s
            const delay = getRandomFloat(0, 5);           // 0s–5s stagger
            const sway = getRandomFloat(5, 20);           // sway amplitude
            const swayEnd = getRandomFloat(-15, 15);      // drift at top

            steam.style.width = `${size}px`;
            steam.style.height = `${size}px`;
            steam.style.left = `${leftPos}%`;
            steam.style.setProperty('--duration', `${duration}s`);
            steam.style.setProperty('--delay', `${delay}s`);
            steam.style.setProperty('--sway', `${sway}px`);
            steam.style.setProperty('--sway-end', `${swayEnd}px`);

            container.appendChild(steam);
        }
    };


    // ──────────────────────────────────────────────
    //  11. FLOATING PARTICLES — ambient gold specks
    // ──────────────────────────────────────────────

    const initFloatingParticles = () => {
        const container = document.createElement('div');
        container.className = 'particles-container';
        document.body.appendChild(container);

        const PARTICLE_COUNT = 35;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = getRandomFloat(1, 3);
            const top = getRandomFloat(0, 100);
            const left = getRandomFloat(0, 100);
            const opacity = getRandomFloat(0.1, 0.3);
            const floatDuration = getRandomFloat(12, 25);
            const floatDelay = getRandomFloat(0, 10);

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.top = `${top}vh`;
            particle.style.left = `${left}vw`;
            particle.style.opacity = opacity;
            particle.style.background = 'var(--clr-gold, #C8A96A)';
            particle.style.setProperty('--float-duration', `${floatDuration}s`);
            particle.style.setProperty('--float-delay', `${floatDelay}s`);

            container.appendChild(particle);
        }
    };


    // ──────────────────────────────────────────────
    //  12. COUNTER ANIMATION — chef stats
    // ──────────────────────────────────────────────

    const initCounterAnimation = () => {
        const counters = document.querySelectorAll('.counter[data-target]');
        if (!counters.length) return;

        /** EaseOutExpo curve — fast start, elegant deceleration */
        const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const DURATION = 2000; // ms

        const animateCounter = (el) => {
            const rawTarget = el.getAttribute('data-target');
            const hasSuffix = rawTarget.endsWith('+');
            const target = parseInt(rawTarget, 10);
            const startTime = performance.now();

            const step = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / DURATION, 1);
                const easedProgress = easeOutExpo(progress);
                const current = Math.floor(easedProgress * target);

                el.textContent = current + (hasSuffix ? '+' : '');

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target + (hasSuffix ? '+' : '');
                }
            };

            requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach((counter) => observer.observe(counter));
    };


    // ──────────────────────────────────────────────
    //  13. MAGNETIC BUTTON EFFECT
    // ──────────────────────────────────────────────

    const initMagneticButtons = () => {
        if (isTouchDevice()) return;

        const buttons = document.querySelectorAll('.magnetic-btn');
        if (!buttons.length) return;

        const MAGNETIC_RANGE = 100; // px — activation radius
        const MAX_OFFSET = 8;       // px — maximum pull distance

        buttons.forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const distX = e.clientX - centerX;
                const distY = e.clientY - centerY;
                const distance = Math.sqrt(distX * distX + distY * distY);

                if (distance < MAGNETIC_RANGE) {
                    const strength = (MAGNETIC_RANGE - distance) / MAGNETIC_RANGE;
                    const offsetX = clamp(distX * strength * 0.3, -MAX_OFFSET, MAX_OFFSET);
                    const offsetY = clamp(distY * strength * 0.3, -MAX_OFFSET, MAX_OFFSET);

                    btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                    btn.style.transition = 'transform 0.15s ease-out';
                }
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
                btn.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
        });
    };


    // ──────────────────────────────────────────────
    //  14. IMAGE REVEAL ON SCROLL
    // ──────────────────────────────────────────────

    const initImageReveal = () => {
        const images = document.querySelectorAll('.img-reveal');
        if (!images.length) return;

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2, rootMargin: '0px 0px -60px 0px' }
        );

        images.forEach((img) => observer.observe(img));
    };


    // ──────────────────────────────────────────────
    //  15. PAGE VISIBILITY API — pause animations when hidden
    // ──────────────────────────────────────────────

    const initPageVisibility = () => {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('paused');
            } else {
                document.body.classList.remove('paused');
            }
        });
    };


    // ──────────────────────────────────────────────
    //  16. TEXT SPLIT ANIMATION — luxury letter reveals
    // ──────────────────────────────────────────────

    const initTextSplit = () => {
        const splitElements = document.querySelectorAll('[data-split]');
        if (!splitElements.length) return;

        splitElements.forEach((el) => {
            const text = el.textContent;
            el.textContent = '';
            el.setAttribute('aria-label', text);

            [...text].forEach((char, i) => {
                const span = document.createElement('span');
                span.className = 'split-char';
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.transitionDelay = `${i * 0.04}s`;
                el.appendChild(span);
            });
        });
    };


    // ──────────────────────────────────────────────
    //  17. SCROLL PROGRESS INDICATOR
    // ──────────────────────────────────────────────

    const initScrollProgress = () => {
        const indicator = document.querySelector('.scroll-indicator');
        if (!indicator) return;

        // Fade out scroll indicator after user scrolls past hero
        let scrollIndicatorTicking = false;

        window.addEventListener('scroll', () => {
            if (!scrollIndicatorTicking) {
                requestAnimationFrame(() => {
                    const opacity = clamp(1 - window.scrollY / 400, 0, 1);
                    indicator.style.opacity = opacity;
                    indicator.style.pointerEvents = opacity < 0.1 ? 'none' : '';
                    scrollIndicatorTicking = false;
                });
                scrollIndicatorTicking = true;
            }
        }, { passive: true });
    };


    // ──────────────────────────────────────────────
    //  18. HOVER TILT — subtle 3D tilt on cards
    // ──────────────────────────────────────────────

    const initHoverTilt = () => {
        if (isTouchDevice()) return;

        const tiltElements = document.querySelectorAll('[data-tilt]');
        if (!tiltElements.length) return;

        tiltElements.forEach((el) => {
            const maxTilt = parseFloat(el.getAttribute('data-tilt')) || 6;

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                el.style.transform = `perspective(600px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
                el.style.transition = 'transform 0.5s ease-out';
            });

            el.addEventListener('mouseenter', () => {
                el.style.transition = 'transform 0.15s ease-out';
            });
        });
    };


    // ──────────────────────────────────────────────
    //  18b. GALLERY CAROUSEL
    // ──────────────────────────────────────────────

    const initGalleryCarousel = () => {
        const track = document.querySelector('.gallery-track');
        if (!track) return;

        const slides = Array.from(track.querySelectorAll('.gallery-slide'));
        const nextBtn = document.querySelector('.gallery-next');
        const prevBtn = document.querySelector('.gallery-prev');
        const dots = Array.from(document.querySelectorAll('.gallery-dot'));
        const carouselWrapper = document.querySelector('.gallery-carousel-wrapper');

        if (!slides.length || !nextBtn || !prevBtn || !dots.length) return;

        let currentIndex = 1; // 1 because 0 is clone of last
        let isAnimating = false;
        let autoPlayInterval;
        const totalOriginalSlides = slides.length - 2;

        const updateDots = (index) => {
            dots.forEach(dot => dot.classList.remove('active'));
            let activeDotIndex = index - 1;
            if (activeDotIndex < 0) activeDotIndex = totalOriginalSlides - 1;
            if (activeDotIndex >= totalOriginalSlides) activeDotIndex = 0;
            if (dots[activeDotIndex]) dots[activeDotIndex].classList.add('active');
        };

        const updateActiveSlide = (index) => {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');

            // Fix glitch: add active to the corresponding original/clone slide to prevent re-animation on jump
            if (index === 0) {
                slides[totalOriginalSlides].classList.add('active');
            } else if (index === slides.length - 1) {
                slides[1].classList.add('active');
            } else if (index === 1) {
                slides[slides.length - 1].classList.add('active');
            } else if (index === totalOriginalSlides) {
                slides[0].classList.add('active');
            }
        };

        const moveToSlide = (index, smooth = true) => {
            if (isAnimating && smooth) return;
            isAnimating = smooth;

            currentIndex = index;
            track.style.transition = smooth ? 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
            track.style.transform = `translateX(-${currentIndex * 100}%)`;

            updateDots(currentIndex);
            updateActiveSlide(currentIndex);

            if (smooth) {
                setTimeout(() => {
                    if (currentIndex === 0) {
                        moveToSlide(totalOriginalSlides, false);
                    } else if (currentIndex === slides.length - 1) {
                        moveToSlide(1, false);
                    }
                    isAnimating = false;
                }, 800);
            } else {
                isAnimating = false;
            }
        };

        const nextSlide = () => {
            if (isAnimating) return;
            moveToSlide(currentIndex + 1);
        };

        const prevSlide = () => {
            if (isAnimating) return;
            moveToSlide(currentIndex - 1);
        };

        const startAutoPlay = () => {
            stopAutoPlay();
            autoPlayInterval = setInterval(nextSlide, 5000); // 5 seconds
        };

        const stopAutoPlay = () => {
            clearInterval(autoPlayInterval);
        };

        nextBtn.addEventListener('click', () => {
            nextSlide();
            // Don't restart autoplay if we are hovered over the gallery
            if (!carouselWrapper.matches(':hover')) {
                startAutoPlay();
            }
        });

        prevBtn.addEventListener('click', () => {
            prevSlide();
            // Don't restart autoplay if we are hovered over the gallery
            if (!carouselWrapper.matches(':hover')) {
                startAutoPlay();
            }
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (isAnimating) return;
                moveToSlide(index + 1);
                startAutoPlay();
            });
        });

        // Pause on hover
        carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
        carouselWrapper.addEventListener('mouseleave', startAutoPlay);

        // Initial setup
        track.style.transform = `translateX(-100%)`;
        startAutoPlay();
    };

    // ══════════════════════════════════════════════
    //  MASTER INITIALISATION
    // ══════════════════════════════════════════════

    /**
     * Safely run an initialisation function.
     * Logs a warning on failure but never breaks the page.
     */
    const safeInit = (name, fn) => {
        try {
            fn();
        } catch (err) {
            console.warn(`[Saffron & Smoke] "${name}" initialisation failed:`, err);
        }
    };

    const init = () => {
        safeInit('Preloader',           initPreloader);
        safeInit('Custom Cursor',       initCustomCursor);
        safeInit('Navbar',              initNavbar);
        safeInit('Mobile Menu',         initMobileMenu);
        safeInit('Smooth Scroll',       initSmoothScroll);
        safeInit('Scroll Reveal',       initScrollReveal);
        safeInit('Parallax',            initParallax);
        safeInit('Mouse Parallax',      initMouseParallax);
        safeInit('Steam Effect',        initSteamEffect);
        safeInit('Floating Particles',  initFloatingParticles);
        safeInit('Counter Animation',   initCounterAnimation);
        safeInit('Magnetic Buttons',    initMagneticButtons);
        safeInit('Image Reveal',        initImageReveal);
        safeInit('Page Visibility',     initPageVisibility);
        safeInit('Text Split',          initTextSplit);
        safeInit('Scroll Progress',     initScrollProgress);
        safeInit('Hover Tilt',          initHoverTilt);
        safeInit('Gallery Carousel',    initGalleryCarousel);
    };

    // Kick everything off once the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already parsed (script loaded with defer/async or at bottom)
        init();
    }

})();
