document.addEventListener("DOMContentLoaded", () => {
  const partnerMarquee = document.querySelector(".partner-splide");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!partnerMarquee || typeof Splide === "undefined") {
    return;
  }

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
});
