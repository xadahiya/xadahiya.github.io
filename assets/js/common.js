(function ($) {
    'use strict';

    // --- PRELOADER ---
    $(window).on("load", function () {
        $('body').imagesLoaded({}, function () {
            var preload = $('.preloader');
            preload.addClass('loaded');
            preload.find('.centrize').fadeOut();

            // Init Cursor
            initCursor();

            // Init Scrolla
            $('.elementor-widget-text-editor').attr('data-animate', 'active');
            if ($.fn.scrolla) {
                $('.scroll-animate').scrolla({
                    once: true,
                    mobile: true
                });
            }
        });
    });

    // --- MAIN DOM READY ---
    $(function () {
        // Error Fixes & Browser Extension Compatibility
        (function() {
            'use strict';

            // Suppress SES warnings and errors from browser extensions
            const originalConsoleWarn = console.warn;
            const originalConsoleError = console.error;

            console.warn = function(message) {
                if (typeof message === 'string' && (
                    message.includes('dateTaming') ||
                    message.includes('mathTaming') ||
                    message.includes('SES') ||
                    message.includes('lockdown-install')
                )) {
                    return;
                }
                originalConsoleWarn.apply(console, arguments);
            };

            console.error = function(message) {
                if (typeof message === 'string' && (
                    message.includes('lockdown-install') ||
                    message.includes('moz-extension') ||
                    message.includes('SES_UNCAUGHT_EXCEPTION')
                )) {
                    return;
                }
                originalConsoleError.apply(console, arguments);
            };

            // Handle jQuery easing function errors
            $(document).ready(function() {
                if ($.easing) {
                    if (!$.easing.easeInOutCubic) {
                        $.easing.easeInOutCubic = function(t) {
                            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
                        };
                    }
                    
                    if (!$.easing.easeInOutQuart) {
                        $.easing.easeInOutQuart = function(t) {
                            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
                        };
                    }
                    
                    if (!$.easing.easeOutCubic) {
                        $.easing.easeOutCubic = function(t) {
                            return (--t) * t * t + 1;
                        };
                    }
                }
            });

            window.addEventListener('error', function(event) {
                if (event.filename && (
                    event.filename.includes('moz-extension') ||
                    event.filename.includes('chrome-extension') ||
                    event.filename.includes('lockdown-install')
                )) {
                    event.preventDefault();
                    return false;
                }
            });

            window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.toString().includes('lockdown')) {
                    event.preventDefault();
                    return false;
                }
            });
        })();

        // Modern Interactive Loader
        (function($) {
            'use strict';

            $(document).ready(function() {
                initModernLoader();
            });

            function initModernLoader() {
                const preloader = $('.preloader');
                const logoImg = $('.preloader .spinner-logo img');
                const loadingText = $('.preloader .loading-text');
                
                logoImg.on('click', function() {
                    $(this).css({
                        animation: 'logoPulse 0.5s ease-in-out',
                        transform: 'scale(1.3)'
                    });
                    
                    setTimeout(() => {
                        $(this).css({
                            animation: 'logoPulse 2s ease-in-out infinite',
                            transform: 'scale(1)'
                        });
                    }, 500);
                });

                const loadingTexts = ['LOADING...', 'PREPARING...', 'ALMOST READY...'];
                let textIndex = 0;
                
                setInterval(() => {
                    if (!preloader.hasClass('loaded')) {
                        loadingText.fadeOut(300, function() {
                            $(this).text(loadingTexts[textIndex]).fadeIn(300);
                            textIndex = (textIndex + 1) % loadingTexts.length;
                        });
                    }
                }, 2000);

                $(document).mousemove(function(e) {
                    if (!preloader.hasClass('loaded')) {
                        const mouseX = e.clientX / window.innerWidth;
                        const mouseY = e.clientY / window.innerHeight;
                        
                        $('.spinner-dot').css({
                            transform: `translate(${mouseX * 10}px, ${mouseY * 10}px)`
                        });
                        
                        $('.spinner-line').css({
                            transform: `translate(${-mouseX * 5}px, ${-mouseY * 5}px)`
                        });
                    }
                });

                $(window).on('load', function() {
                    setTimeout(() => {
                        logoImg.css({
                            animation: 'logoPulse 0.3s ease-in-out 3',
                            filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.8))'
                        });
                        
                        loadingText.text('READY!').css({
                            fontSize: '20px',
                            textShadow: '0 0 20px rgba(255,255,255,0.8)'
                        });
                        
                        setTimeout(() => {
                            preloader.addClass('loaded');
                            setTimeout(() => preloader.hide(), 800);
                        }, 500);
                    }, 1000);
                });

                $(document).keydown(function(e) {
                    if (!preloader.hasClass('loaded')) {
                        if (e.keyCode === 32) {
                            e.preventDefault();
                            logoImg.trigger('click');
                        }
                        
                        if (e.keyCode === 13) {
                            e.preventDefault();
                            preloader.addClass('loaded');
                            setTimeout(() => preloader.hide(), 800);
                        }
                    }
                });

                logoImg.on('touchstart', function(e) {
                    e.preventDefault();
                    $(this).trigger('click');
                });

                if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
                    $('.preloader').addClass('low-performance');
                }
            }
        })(jQuery);

        // Modern Animations Enhancement
        (function($) {
            'use strict';

            // Define all functions first
            function initParticleSystem() {
                console.log('Initializing particle system...');
                
                const canvas = $('<canvas id="particle-canvas"></canvas>');
                $('.lui-section-hero').prepend(canvas);
                
                console.log('Canvas created and added to DOM');
                
                const ctx = canvas[0].getContext('2d');
                const particles = [];
                const maxParticles = 30;
                
                function resizeCanvas() {
                    canvas[0].width = window.innerWidth;
                    canvas[0].height = window.innerHeight;
                    console.log('Canvas resized to:', canvas[0].width, 'x', canvas[0].height);
                }
                resizeCanvas();
                $(window).resize(resizeCanvas);
                
                class Particle {
                    constructor() {
                        this.x = Math.random() * canvas[0].width;
                        this.y = Math.random() * canvas[0].height;
                        this.vx = (Math.random() - 0.5) * 1;
                        this.vy = (Math.random() - 0.5) * 1;
                        this.radius = Math.random() * 3 + 2;
                        this.opacity = Math.random() * 0.6 + 0.4;
                        this.originalOpacity = this.opacity;
                    }
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        
                        if (this.x < 0) this.x = canvas[0].width;
                        if (this.x > canvas[0].width) this.x = 0;
                        if (this.y < 0) this.y = canvas[0].height;
                        if (this.y > canvas[0].height) this.y = 0;
                        
                        this.opacity = this.originalOpacity + Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.2;
                    }
                    
                    draw() {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                        ctx.fill();
                    }
                }
                
                for (let i = 0; i < maxParticles; i++) {
                    particles.push(new Particle());
                }
                
                console.log('Created', particles.length, 'particles');
                
                function animate() {
                    ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
                    
                    particles.forEach(particle => {
                        particle.update();
                        particle.draw();
                    });
                    
                    particles.forEach((particle, i) => {
                        particles.slice(i + 1).forEach(otherParticle => {
                            const distance = Math.hypot(particle.x - otherParticle.x, particle.y - otherParticle.y);
                            if (distance < 100) {
                                ctx.beginPath();
                                ctx.moveTo(particle.x, particle.y);
                                ctx.lineTo(otherParticle.x, otherParticle.y);
                                ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - distance / 100)})`;
                                ctx.lineWidth = 1.5;
                                ctx.stroke();
                            }
                        });
                    });
                    
                    requestAnimationFrame(animate);
                }
                
                console.log('Starting animation...');
                animate();
                
                canvas.css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 999,
                    pointerEvents: 'none',
                    opacity: 1,
                });
                
                console.log('Canvas CSS applied');
                canvas.show();
            }

            function initEnhancedScrollAnimations() {
                const animateElements = document.querySelectorAll('.animate-on-scroll');
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('animated');
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '-50px'
                });
                
                $('.skills-item, .history-item, .archive-item, .works-item').each(function() {
                    $(this).addClass('animate-on-scroll');
                    observer.observe(this);
                });
                
                $(window).scroll(function() {
                    const scrolled = $(this).scrollTop();
                    const parallax = $('.parallax-bg');
                    const speed = 0.5;
                    
                    parallax.css('transform', `translateY(${scrolled * speed}px)`);
                });
                
                // Initialize countdown numbers with intersection observer
                $('.num').each(function() {
                    const $this = $(this);
                    const originalText = $this.text();
                    const countTo = parseInt(originalText);
                    
                    // Only animate if it's a valid number
                    if (isNaN(countTo) || countTo <= 0) {
                        return;
                    }
                    
                    // Store the original text to restore it
                    $this.data('original-text', originalText);
                    
                    // Set initial value to 0
                    $this.text('0');
                    
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                // Add a small delay for better visual effect
                                setTimeout(() => {
                                    // Start the countdown animation
                                    $({ countNum: 0 }).animate({
                                        countNum: countTo
                                    }, {
                                        duration: 2000,
                                        easing: 'swing',
                                        step: function() {
                                            $this.text(Math.floor(this.countNum));
                                        },
                                        complete: function() {
                                            $this.text(countTo + '%');
                                        }
                                    });
                                }, 300);
                                
                                // Stop observing after animation starts
                                observer.unobserve(entry.target);
                            }
                        });
                    }, {
                        threshold: 0.5,
                        rootMargin: '0px 0px -50px 0px'
                    });
                    
                    // Observe the parent element (usually .info-list ul li)
                    const parentElement = $this.closest('.info-list ul li, .numbers-item, .skills-item');
                    if (parentElement.length) {
                        observer.observe(parentElement[0]);
                    } else {
                        observer.observe($this[0]);
                    }
                });
            }

            function initInteractiveSkillBars() {
                $('.skills-item .dots .dot').each(function() {
                    const $dot = $(this);
                    const percentage = $dot.css('width');
                    
                    $dot.css('width', '0%');
                    
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                $dot.animate({
                                    width: percentage
                                }, {
                                    duration: 1500,
                                    easing: 'swing'
                                });
                                observer.unobserve(entry.target);
                            }
                        });
                    });
                    
                    observer.observe($dot.closest('.skills-item')[0]);
                });
            }

            function init3DEffects() {
                $('.works-item, .archive-item, .services-item').on('mousemove', function(e) {
                    const card = $(this);
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / centerY * -10;
                    const rotateY = (x - centerX) / centerX * 10;
                    
                    card.css({
                        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
                        transition: 'transform 0.1s ease'
                    });
                }).on('mouseleave', function() {
                    $(this).css({
                        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                        transition: 'transform 0.3s ease'
                    });
                });
            }

            function initMorphingBackground() {
                $('.lui-gradient-center, .lui-gradient-bottom').css({
                    transition: 'background 1s ease'
                });
            }

            function initTypewriterEffect() {
                const texts = [
                    'a Protocol Engineer',
                    'a DeFi Researcher', 
                    'a Blockchain Developer',
                    'an AI Enthusiast',
                    'an Anti-plagiarism researcher',
                    'a Full-stack Developer',
                    'a Web3 Developer',
                    'a Blockchain Nerd',
                    'a Crypto Trader',
                ];
                
                let textIndex = 0;
                let charIndex = 0;
                let isDeleting = false;
                
                function typeWriter() {
                    const currentText = texts[textIndex];
                    const displayText = currentText.substring(0, charIndex);
                    
                    $('.label.lui-subtitle strong').text(displayText);
                    
                    if (!isDeleting && charIndex < currentText.length) {
                        charIndex++;
                        setTimeout(typeWriter, 100);
                    } else if (isDeleting && charIndex > 0) {
                        charIndex--;
                        setTimeout(typeWriter, 50);
                    } else {
                        isDeleting = !isDeleting;
                        if (!isDeleting) {
                            textIndex = (textIndex + 1) % texts.length;
                        }
                        setTimeout(typeWriter, 1000);
                    }
                }
                
                typeWriter();
            }

            function initFloatingElements() {
                $('.circle').each(function(index) {
                    const $circle = $(this);
                    const delay = index * 200;
                    
                    $circle.css({
                        animation: `float 3s ease-in-out infinite ${delay}ms`,
                        animationDirection: index % 2 === 0 ? 'normal' : 'reverse'
                    });
                });
                
                const style = $(`
                    <style>
                        .animate-on-scroll {
                            opacity: 0;
                            transform: translateY(50px);
                            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                        }
                        
                        .animate-on-scroll.animated {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    </style>
                `);
                $('head').append(style);
            }

            function initGlitchEffect() {
                $('.m-title, h1').on('mouseenter', function() {
                    const $this = $(this);
                    $this.addClass('glitch-effect');
                    
                    setTimeout(() => {
                        $this.removeClass('glitch-effect');
                    }, 500);
                });
                
                const glitchStyle = $(`
                    <style>
                        .glitch-effect {
                            position: relative;
                            animation: glitch 0.3s ease-in-out;
                        }
                        
                        .glitch-effect::before,
                        .glitch-effect::after {
                            content: attr(data-text);
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                        }
                        
                        .glitch-effect::before {
                            animation: glitch-1 0.3s ease-in-out;
                            color: #ff00ff;
                            z-index: -1;
                        }
                        
                        .glitch-effect::after {
                            animation: glitch-2 0.3s ease-in-out;
                            color: #00ffff;
                            z-index: -2;
                        }
                        
                        @keyframes glitch {
                            0%, 100% { transform: translate(0); }
                            20% { transform: translate(-2px, 2px); }
                            40% { transform: translate(-2px, -2px); }
                            60% { transform: translate(2px, 2px); }
                            80% { transform: translate(2px, -2px); }
                        }
                    </style>
                `);
                $('head').append(glitchStyle);
            }

            function initModernHoverEffects() {
                $('.btn').each(function() {
                    const $btn = $(this);
                    
                    $btn.on('mouseenter', function() {
                        $(this).css({
                            transform: 'translateY(-3px)',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        });
                    }).on('mouseleave', function() {
                        $(this).css({
                            transform: 'translateY(0)',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        });
                    });
                });
                
                $('.archive-item, .works-item').hover(
                    function() {
                        $(this).find('img').css({
                            transform: 'scale(1.1)',
                            transition: 'transform 0.5s ease'
                        });
                    },
                    function() {
                        $(this).find('img').css({
                            transform: 'scale(1)',
                            transition: 'transform 0.5s ease'
                        });
                    }
                );
            }

            function enhanceButtonInteractions() {
                $('.lui-button, .btn-primary, button').each(function() {
                    const $btn = $(this);
                    
                    $btn.on('mouseenter', function() {
                        if (!$btn.find('.shimmer-effect').length) {
                            $btn.append('<div class="shimmer-effect"></div>');
                            
                            const shimmerCSS = `
                                .shimmer-effect {
                                    position: absolute;
                                    top: 0;
                                    left: -100%;
                                    width: 100%;
                                    height: 100%;
                                    animation: shimmer 0.6s ease-out;
                                }
                                @keyframes shimmer {
                                    from { left: -100%; }
                                    to { left: 100%; }
                                }
                            `;
                            
                            if (!$('#shimmer-styles').length) {
                                $('head').append(`<style id="shimmer-styles">${shimmerCSS}</style>`);
                            }
                        }
                    });
                    
                    $btn.on('animationend', '.shimmer-effect', function() {
                        $(this).remove();
                    });
                });
            }

            function addFocusGlowEffects() {
                $('input, textarea, select').focus(function() {
                    $(this).css({
                        'outline': 'none'
                    });
                }).blur(function() {
                    $(this).css({
                        'box-shadow': '',
                        'border-color': ''
                    });
                });

                $('.nav-link, .navbar-nav a').hover(
                    function() {
                        $(this).css({
                            'text-shadow': '',
                            'color': ''
                        });
                    }
                );
            }

            // Now call all functions after they're defined
            $(document).ready(function() {
                initParticleSystem();
                initEnhancedScrollAnimations();
                initInteractiveSkillBars();
                init3DEffects();
                initMorphingBackground();
                initTypewriterEffect();
                initFloatingElements();
                initGlitchEffect();
                initModernHoverEffects();
                enhanceButtonInteractions();
                addFocusGlowEffects();
            });

        })(jQuery);

        // Enhanced Interactions & UX Features
        (function($) {
            'use strict';

            function initAdvancedNavigation() {
                const sections = $('.lui-section');
                const navLinks = $('.menu-full a[href^="#"]');
                
                $(window).scroll(function() {
                    let currentSection = '';
                    sections.each(function() {
                        const sectionTop = $(this).offset().top;
                        const sectionHeight = $(this).height();
                        if ($(window).scrollTop() >= (sectionTop - 200)) {
                            currentSection = $(this).attr('id');
                        }
                    });
                    
                    navLinks.removeClass('active');
                    navLinks.filter(`[href="#${currentSection}"]`).addClass('active');
                });
                
                navLinks.on('click', function(e) {
                    e.preventDefault();
                    const target = $(this.getAttribute('href'));
                    
                    if (target.length) {
                        $('html, body').animate({
                            scrollTop: target.offset().top - 80
                        }, {
                            duration: 1000,
                            easing: 'swing'
                        });
                    }
                });
                
                const progressBar = $('<div class="scroll-progress"><div class="scroll-progress-bar"></div></div>');
                $('body').prepend(progressBar);
                
                $(window).scroll(function() {
                    const scroll = $(window).scrollTop();
                    const height = $(document).height() - $(window).height();
                    const progress = (scroll / height) * 100;
                    $('.scroll-progress-bar').css('width', progress + '%');
                });
                
                const progressStyle = $(`
                    <style>
                        .scroll-progress {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 3px;
                            z-index: 10000;
                        }
                        .scroll-progress-bar {
                            height: 100%;
                            width: 0%;
                            transition: width 0.1s ease;
                        }
                        .menu-full a.active {
                            color: var(--accent-color) !important;
                            position: relative;
                        }
                        .menu-full a.active::after {
                            content: '';
                            position: absolute;
                            bottom: -5px;
                            left: 0;
                            width: 100%;
                            height: 2px;
                        }
                    </style>
                `);
                $('head').append(progressStyle);
            }

            function initMagneticCursor() {
                // This function is now handled by the main initCursor() function
                // The magnetic effect is integrated into the main cursor system
                console.log('Magnetic cursor initialized - using main cursor system');
            }

            function initSmoothScrolling() {
                $('a[href*="#"]:not([href="#"])').click(function() {
                    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
                        let target = $(this.hash);
                        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                        if (target.length) {
                            $('html, body').animate({
                                scrollTop: target.offset().top - 100
                            }, {
                                duration: 1200,
                                easing: 'swing',
                                complete: function() {
                                    target.addClass('section-focus');
                                    setTimeout(() => {
                                        target.removeClass('section-focus');
                                    }, 1000);
                                }
                            });
                            return false;
                        }
                    }
                });
            }

            function initImageLazyLoading() {
                const images = $('img[src]');
                
                images.each(function() {
                    const img = $(this);
                    const src = img.attr('src');
                    
                    img.css({
                        filter: 'blur(5px)',
                        transition: 'filter 0.5s ease'
                    });
                    
                    const fullImage = new Image();
                    fullImage.onload = function() {
                        img.attr('src', src).css('filter', 'blur(0px)');
                    };
                    fullImage.src = src;
                });
            }

            function initPageTransitions() {
                const overlay = $('<div class="page-transition-overlay"></div>');
                $('body').append(overlay);
                
                $('body').addClass('page-entering');
                
                $('a[href^="http"]').on('click', function(e) {
                    const link = this.href;
                    e.preventDefault();
                    
                    overlay.addClass('active');
                    setTimeout(() => {
                        window.open(link, '_blank');
                        overlay.removeClass('active');
                    }, 300);
                });
            }

            function initPerformanceOptimizations() {
                let scrollTimeout;
                $(window).on('scroll', function() {
                    if (scrollTimeout) {
                        clearTimeout(scrollTimeout);
                    }
                    scrollTimeout = setTimeout(() => {
                        const scrollTop = $(this).scrollTop();
                        $('.parallax-element').css('transform', `translateY(${scrollTop * 0.3}px)`);
                    }, 16);
                });
                
                if (window.innerWidth <= 768) {
                    $('.particle-canvas').remove();
                    $('*').css('animation-duration', '0.5s');
                }
            }

            $(document).ready(function() {
                initAdvancedNavigation();
                initMagneticCursor();
                initSmoothScrolling();
                initImageLazyLoading();
                initPageTransitions();
                initPerformanceOptimizations();
            });

        })(jQuery);

        // Jarallax
        if ($.fn.jarallax) {
            $('.js-parallax').jarallax({
                speed: 0.65,
                type: 'scroll'
            });
        }

        // Block Line
        if ($('.v-line').length) {
            $('.v-line .container').append('<div class="v-line-block"><span></span></div>');
            $('.v-line .hero-started').append('<div class="v-line-block"><span></span></div>');
        }

        // Splitting
        if (typeof Splitting === 'function') {
            Splitting();
        }

        // Skrollr
        if (typeof skrollr !== 'undefined' && $(window).width() > 1200) {
            skrollr.init();
        }

        // Typed
        if ($.fn.typed) {
            $('.subtitle.subtitle-typed').each(function () {
                var subtitleContainer = $(this);
                subtitleContainer.typed({
                    stringsElement: subtitleContainer.find('.typing-title'),
                    backDelay: 3500,
                    typeSpeed: 0,
                    loop: true
                });
            });
        }

        // Header Sticky with Conditional Glass Effect
        if ($('.header').length) {
            var lastScrollY = 0;
            $(window).on('scroll', function () {
                var scrollTop = $(window).scrollTop();
                var scrollThreshold = 50;

                if (scrollTop > 100) {
                    $('.header').addClass('sticky');
                    if (scrollTop > scrollThreshold) {
                        $('.header').addClass('glass-effect');
                    } else {
                        $('.header').removeClass('glass-effect');
                    }
                    if (lastScrollY < scrollTop) {
                        $('.header').addClass('animate-in');
                        $('.header').removeClass('animate-out');
                    } else {
                        if (scrollTop < 200) {
                            $('.header').addClass('animate-out');
                            $('.header').removeClass('animate-in');
                        }
                    }
                } else {
                    $('.header').removeClass('sticky glass-effect animate-in animate-out');
                }
                lastScrollY = scrollTop;
            });
        }

        // Header Switcher Button
        var skin = $.cookie ? $.cookie('skin') : null;
        if (skin === 'light') {
            $('body').removeClass('dark-skin').addClass('light-skin');
        }
        if (skin === 'dark') {
            $('body').removeClass('light-skin').addClass('dark-skin');
        }
        if ($('body').hasClass('dark-skin')) {
            $('.header .switcher-btn').addClass('active');
        }
        $('.header').on('click', '.switcher-btn', function () {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                $('body').removeClass('dark-skin').addClass('light-skin');
                if ($.cookie) $.cookie('skin', 'light', { expires: 7, path: '/' });
            } else {
                $(this).addClass('active');
                $('body').removeClass('light-skin').addClass('dark-skin');
                if ($.cookie) $.cookie('skin', 'dark', { expires: 7, path: '/' });
            }
            return false;
        });

        // Header Menu Button
        $('.header').on('click', '.menu-btn', function () {
            var $btn = $(this);
            if ($btn.hasClass('active')) {
                $btn.removeClass('active').addClass('no-touch');
                $('.menu-overlay').addClass('no-touch');
                $('body').removeClass('no-scroll');
                $('.menu-full-overlay').removeClass('is-open has-scroll animate-active');
                setTimeout(function () {
                    $('.menu-full-overlay').removeClass('visible');
                    $('.menu-btn, .menu-overlay').removeClass('no-touch');
                }, 1000);
            } else {
                $btn.addClass('active no-touch');
                $('.menu-overlay').addClass('no-touch');
                var height = $(window).height();
                $('.menu-full-overlay').css({ 'height': height });
                $('body').addClass('no-scroll');
                $('.menu-full-overlay').addClass('is-open visible');
                setTimeout(function () {
                    $('.menu-full-overlay').addClass('has-scroll animate-active');
                    $('.menu-btn, .menu-overlay').removeClass('no-touch');
                }, 1000);
            }
            return false;
        });
        $('.menu-full-overlay').on('click', '.menu-overlay', function () {
            $('.menu-btn').removeClass('active').addClass('no-touch');
            $('.menu-overlay').addClass('no-touch');
            $('body').removeClass('no-scroll');
            $('.menu-full-overlay').removeClass('is-open has-scroll animate-active');
            setTimeout(function () {
                $('.menu-full-overlay').removeClass('visible');
                $('.menu-btn, .menu-overlay').removeClass('no-touch');
            }, 1000);
            return false;
        });

        // Top Menu
        $('.menu-full').on('click', 'a', function () {
            if (!$(this).parent().hasClass('has-children')) {
                $('.header .menu-btn.active').trigger('click');
            }
        });

        // Header Menu Dropdown
        $('.menu-full .has-children > a').append('<i class="fas fa-chevron-down"></i>');
        $('.menu-full').on('click', '.has-children > a', function () {
            var $li = $(this).closest('li');
            if ($li.hasClass('opened')) {
                $li.removeClass('opened').addClass('closed');
                $li.find('> ul').slideUp();
            } else {
                $li.closest('ul').find('> li').removeClass('closed opened').find('> ul').slideUp();
                $li.addClass('opened').find('> ul').slideDown();
            }
            return false;
        });

        // Carousel Services
        if (typeof Swiper !== 'undefined') {
            new Swiper('.js-services', {
                slidesPerView: 3,
                spaceBetween: 40,
                watchSlidesVisibility: true,
                noSwipingSelector: 'a',
                loop: true,
                speed: 1000,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                },
                pagination: {
                    el: '.swiper-pagination',
                    type: 'bullets',
                    clickable: true,
                },
                navigation: false,
                breakpoints: {
                    0: { slidesPerView: 1, spaceBetween: 20 },
                    767: { slidesPerView: 2, spaceBetween: 30 },
                    1024: { slidesPerView: 3, spaceBetween: 40 }
                }
            });

            // Carousel Testimonials
            new Swiper('.js-testimonials', {
                slidesPerView: 3,
                spaceBetween: 40,
                watchSlidesVisibility: true,
                noSwipingSelector: 'a',
                loop: false,
                speed: 1000,
                pagination: {
                    el: '.swiper-pagination',
                    type: 'bullets',
                    clickable: true,
                },
                navigation: false,
                breakpoints: {
                    0: { slidesPerView: 1, spaceBetween: 20 },
                    767: { slidesPerView: 2, spaceBetween: 30 },
                    1024: { slidesPerView: 3, spaceBetween: 40 }
                }
            });
        }

        // Initialize portfolio items
        var $container = $('.works-items');
        if ($container.length && $.fn.imagesLoaded && $.fn.isotope) {
            $container.imagesLoaded(function () {
                $container.isotope({
                    itemSelector: '.works-col',
                    percentPosition: true,
                });
            });
        }
        var $gal_container = $('.m-gallery');
        if ($gal_container.length && $.fn.imagesLoaded && $.fn.isotope) {
            $gal_container.imagesLoaded(function () {
                $gal_container.isotope({
                    itemSelector: '.col-lg-6',
                    percentPosition: true,
                });
            });
        }

        // Filter items on button click
        $('.filter-links').on('click', 'a', function () {
            var filterValue = $(this).attr('data-href');
            if ($container.length && $container.data('isotope')) {
                $container.isotope({ filter: filterValue });
            }
            $('.filter-links a').removeClass('active');
            $(this).addClass('active');
            if (!$(filterValue).find('.scroll-animate').hasClass('animate__active')) {
                $(filterValue).find('.scroll-animate').addClass('animate__active');
            }
            return false;
        });

        // Magnific Popup - Image
        if ($.fn.magnificPopup) {
            $('.has-popup-image').magnificPopup({
                type: 'image',
                closeOnContentClick: true,
                mainClass: 'mfp-img-mobile',
                image: { verticalFit: true }
            });

            // Video popup
            $('.has-popup-video').magnificPopup({
                disableOn: 700,
                type: 'iframe',
                iframe: {
                    patterns: {
                        youtube_short: {
                            index: 'youtu.be/',
                            id: 'youtu.be/',
                            src: 'https://www.youtube.com/embed/%id%?autoplay=1'
                        }
                    }
                },
                removalDelay: 160,
                preloader: false,
                fixedContentPos: false,
                mainClass: 'mfp-fade',
                callbacks: {
                    markupParse: function (template) {
                        template.find('iframe').attr('allow', 'autoplay');
                    }
                }
            });

            // Music popup
            $('.has-popup-audio').magnificPopup({
                disableOn: 700,
                type: 'iframe',
                removalDelay: 160,
                preloader: false,
                fixedContentPos: false,
                mainClass: 'mfp-fade'
            });
        }

        // Tabs
        $('.tab-menu').on('click', '.tab-btn', function () {
            var tab_bl = $(this).attr('href');
            $(this).closest('.tab-menu').find('li').removeClass('active');
            $(this).closest('li').addClass('active');
            $(this).closest('.tabs').find('> .tab-item').hide();
            $(tab_bl).fadeIn();
            return false;
        });

        // Collapse
        $('.lui-collapse-item').on('click', '.lui-collapse-btn', function () {
            var $item = $(this).closest('.lui-collapse-item');
            if ($item.hasClass('opened')) {
                $item.removeClass('opened');
                $(this).removeClass('active');
            } else {
                $item.addClass('opened');
                $(this).addClass('active');
            }
        });

        // Video
        $('.m-video-large .video').on('click', '.play, .img', function () {
            var $video = $(this).closest('.video');
            $video.addClass('active');
            var iframe = $video.find('.js-video-iframe');
            largeVideoPlay(iframe);
            return false;
        });
        function largeVideoPlay(iframe) {
            var src = iframe.data('src');
            iframe.attr('src', src);
        }

        // Cart Popup
        $('.header .cart-btn .cart-icon').on('click', function () {
            var $btn = $(this).closest('.cart-btn');
            if ($btn.hasClass('opened')) {
                $btn.removeClass('opened').find('.cart-widget').hide();
            } else {
                $btn.addClass('opened').find('.cart-widget').fadeIn();
            }
            return false;
        });
    });

    // --- CURSOR ---
    function initCursor() {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        const cursor = {
            el: $('.cursor'),
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            w: 30,
            h: 30,
            update: function () {
                const l = this.x - this.w / 2;
                const t = this.y - this.h / 2;
                this.el.css({ 'transform': `translate3d(${l}px, ${t}px, 0)` });
            }
        };

        $(window).on('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Enhanced hover effects with magnetic attraction
        $('a, .swiper-pagination, .swiper-button-prev, .swiper-button-next, button, .button, .btn, .lnk, .works-item, .archive-item, .social-links a').hover(
            function () { 
                cursor.el.addClass("cursor-zoom");
                
                // Magnetic effect - attract cursor to element center
                const rect = this.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Calculate offset from current mouse position to element center
                const offsetX = centerX - mouseX;
                const offsetY = centerY - mouseY;
                
                // Apply magnetic attraction with proper positioning
                const magneticX = cursor.x - cursor.w/2 + offsetX * 0.2;
                const magneticY = cursor.y - cursor.h/2 + offsetY * 0.2;
                
                cursor.el.css({
                    'transform': `translate3d(${magneticX}px, ${magneticY}px, 0) scale(1.5)`,
                    'mix-blend-mode': 'difference'
                });
            },
            function () { 
                cursor.el.removeClass("cursor-zoom");
                
                // Reset to normal position
                cursor.el.css({
                    'transform': `translate3d(${cursor.x - cursor.w/2}px, ${cursor.y - cursor.h/2}px, 0) scale(1)`,
                    'mix-blend-mode': 'normal'
                });
            }
        );

        function move() {
            cursor.x = lerp(cursor.x, mouseX, 0.8);
            cursor.y = lerp(cursor.y, mouseY, 0.8);
            
            // Only update transform if not hovering over interactive elements
            if (!cursor.el.hasClass('cursor-zoom')) {
                cursor.update();
            }
            
            requestAnimationFrame(move);
        }
        
        function lerp(start, end, amt) {
            return (1 - amt) * start + amt * end;
        }
        
        move();

        // Contact form validation
        if ($('.contacts-form').length && $.fn.validate) {
            $('#cform').validate({
                rules: {
                    name: { required: true },
                    message: { required: true },
                    email: { required: true, email: true }
                },
                success: 'valid'
            });
        }
    }

    // --- FULL HEIGHT SECTIONS ---
    function setHeightFullSection() {
        const height = $(window).height();
        $('.error-page, .menu-full-overlay, .preloader .centrize').css({ 'height': height });
    }

})(jQuery); 