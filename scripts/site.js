document.addEventListener("DOMContentLoaded", () => {
  const partnerMarquee = document.querySelector(".partner-splide");
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canAnimate = !prefersReducedMotion.matches && typeof window.gsap !== "undefined";
  const supportsCursorGlow =
    cursorDot &&
    cursorRing &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !prefersReducedMotion.matches;

  if (supportsCursorGlow) {
    document.body.classList.add("cursor-enhanced");

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let ringX = cursorX;
    let ringY = cursorY;

    const updateCursor = () => {
      ringX += (cursorX - ringX) * 0.18;
      ringY += (cursorY - ringY) * 0.18;
      cursorDot.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(updateCursor);
    };

    document.addEventListener("pointermove", (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
      cursorDot.classList.add("is-visible");
      cursorRing.classList.add("is-visible");
    });

    document.addEventListener("pointerleave", () => {
      document.body.style.setProperty("--cursor-x", "-999px");
      document.body.style.setProperty("--cursor-y", "-999px");
      cursorDot.classList.remove("is-visible");
      cursorRing.classList.remove("is-visible");
    });

    document.querySelectorAll("a, button, .button, .work-card, .service-card, .hero-pill").forEach((node) => {
      node.addEventListener("pointerenter", () => {
        cursorRing.classList.add("is-hovering");
      });

      node.addEventListener("pointerleave", () => {
        cursorRing.classList.remove("is-hovering");
      });
    });

    window.requestAnimationFrame(updateCursor);
  }

  const interactiveBorderSelector =
    ".work-card, .service-card, .hero-pill, .partner-row .splide__slide span, .button, .social-links a, .site-header, .site-footer";

  let activeBorderSurface = null;

  const updateInteractiveBorder = (surface, event) => {
    const rect = surface.getBoundingClientRect();
    surface.style.setProperty("--cursor-local-x", `${event.clientX - rect.left}px`);
    surface.style.setProperty("--cursor-local-y", `${event.clientY - rect.top}px`);
    surface.classList.add("is-pointer-active");
  };

  document.addEventListener("pointermove", (event) => {
    const surface = event.target.closest(interactiveBorderSelector);

    if (activeBorderSurface && activeBorderSurface !== surface) {
      activeBorderSurface.classList.remove("is-pointer-active");
    }

    if (!surface) {
      activeBorderSurface = null;
      return;
    }

    updateInteractiveBorder(surface, event);
    activeBorderSurface = surface;
  });

  document.addEventListener("pointerleave", () => {
    if (activeBorderSurface) {
      activeBorderSurface.classList.remove("is-pointer-active");
      activeBorderSurface = null;
    }
  });

  if (partnerMarquee && typeof Splide !== "undefined") {
    const splide = new Splide(partnerMarquee, {
      type: "loop",
      drag: false,
      arrows: false,
      pagination: false,
      autoWidth: true,
      gap: "18px",
      clones: 6,
      focus: "center",
      trimSpace: false,
      autoScroll: {
        speed: prefersReducedMotion.matches ? 0 : 0.8,
        autoStart: !prefersReducedMotion.matches,
        pauseOnHover: true,
        pauseOnFocus: true,
      },
      breakpoints: {
        640: {
          gap: "12px",
        },
      },
    });

    splide.mount(window.splide.Extensions);

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const autoScroll = splide.Components.AutoScroll;
          if (!autoScroll) {
            return;
          }

          if (entry.isIntersecting && !prefersReducedMotion.matches) {
            autoScroll.play();
          } else {
            autoScroll.pause();
          }
        },
        { threshold: 0.1 },
      );

      observer.observe(partnerMarquee);
    }
  }

  if (canAnimate && typeof window.ScrollTrigger !== "undefined") {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTimeline
      .from(".site-header", { y: -18, opacity: 0, duration: 0.7 })
      .from(".eyebrow", { y: 20, opacity: 0, duration: 0.5 }, "-=0.25")
      .from(
        ".hero-content h1",
        { y: 36, opacity: 0, duration: 0.9 },
        "-=0.15",
      )
      .from(".hero-copy", { y: 20, opacity: 0, duration: 0.55 }, "-=0.45")
      .from(
        ".hero-proof span",
        { y: 16, opacity: 0, duration: 0.4, stagger: 0.08 },
        "-=0.25",
      )
      .from(
        ".hero-actions > *",
        { y: 16, opacity: 0, duration: 0.45, stagger: 0.08, clearProps: "transform,opacity" },
        "-=0.18",
      )
      .from(
        ".hero-pill",
        { y: 28, opacity: 0, duration: 0.5, stagger: 0.1, clearProps: "transform,opacity" },
        "-=0.12",
      );

    gsap.to(".hero-video-wrap", {
      yPercent: 8,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: 1.1,
      },
    });

    gsap.utils.toArray(".section-heading").forEach((heading) => {
      gsap.from(heading.children, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 82%",
          once: true,
        },
      });
    });

    gsap.from(".partner-row", {
      y: 26,
      opacity: 0,
      duration: 0.75,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".partner-row",
        start: "top 85%",
        once: true,
      },
    });

    gsap.from(".work-card", {
      y: 42,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".work-grid",
        start: "top 78%",
        once: true,
      },
    });

    gsap.from(".service-card", {
      y: 34,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".services-grid",
        start: "top 82%",
        once: true,
      },
    });
  }
});
