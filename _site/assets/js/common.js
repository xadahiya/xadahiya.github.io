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
        // Sections full height
        setHeightFullSection();
        $(window).on('resize', setHeightFullSection);

        // Parallax
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

        $('a, .swiper-pagination, .swiper-button-prev, .swiper-button-next, button, .button, .btn, .lnk').hover(
            function () { cursor.el.addClass("cursor-zoom"); },
            function () { cursor.el.removeClass("cursor-zoom"); }
        );

        function move() {
            cursor.x = lerp(cursor.x, mouseX, 0.9);
            cursor.y = lerp(cursor.y, mouseY, 0.9);
            cursor.update();
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
