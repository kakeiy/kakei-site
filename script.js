const header = document.querySelector(".site-header");
const rails = Array.from(document.querySelectorAll("[data-rail]"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollToHashTarget = (hash) => {
  const target = document.querySelector(hash);
  if (!target) return false;

  const headerOffset = header?.getBoundingClientRect().height ?? 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({
    top: Math.max(0, targetTop - headerOffset - 18),
    behavior: prefersReducedMotion ? "auto" : "smooth"
  });

  return true;
};

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    if (!scrollToHashTarget(hash)) return;

    event.preventDefault();
    history.pushState(null, "", hash);
  });
});

window.addEventListener("scroll", () => {
  header?.toggleAttribute("data-scrolled", window.scrollY > 8);
});

window.addEventListener("load", () => {
  if (location.hash) window.setTimeout(() => scrollToHashTarget(location.hash), 0);
});

rails.forEach((rail) => {
  const section = rail.closest("section");
  const prev = section?.querySelector("[data-rail-prev]");
  const next = section?.querySelector("[data-rail-next]");

  const getStep = () => {
    const cards = Array.from(rail.children);
    if (cards.length > 1) return cards[1].offsetLeft - cards[0].offsetLeft;
    return cards[0]?.getBoundingClientRect().width || 320;
  };

  prev?.addEventListener("click", () => {
    rail.scrollBy({ left: -getStep(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  next?.addEventListener("click", () => {
    rail.scrollBy({ left: getStep(), behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
});
