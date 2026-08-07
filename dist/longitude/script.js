(() => {
  const storageKey = "longitude-site-language";
  const toggleButtons = document.querySelectorAll("[data-language-toggle]");
  const zoneData = {
    tokyo: { zone: "Tokyo", time: "09:00–10:00", dayEn: "Tuesday", dayJa: "火曜日" },
    "new-york": { zone: "New York", time: "20:00–21:00", dayEn: "Monday", dayJa: "月曜日" },
    london: { zone: "London", time: "01:00–02:00", dayEn: "Tuesday", dayJa: "火曜日" },
  };

  const updateDemoMeta = () => {
    const demo = document.querySelector("[data-time-demo]");
    if (!demo) return;
    const selected = zoneData[demo.dataset.activeZone || "tokyo"];
    const meta = demo.querySelector("[data-event-meta]");
    if (!selected || !meta) return;
    const japanese = document.documentElement.lang === "ja";
    meta.textContent = `${japanese ? selected.dayJa : selected.dayEn} · ${selected.zone}`;
  };

  const setLanguage = (language) => {
    const next = language === "ja" ? "ja" : "en";
    document.documentElement.lang = next;
    document.querySelectorAll(".lang-en").forEach((element) => {
      element.hidden = next !== "en";
    });
    document.querySelectorAll(".lang-ja").forEach((element) => {
      element.hidden = next !== "ja";
    });
    toggleButtons.forEach((button) => {
      button.textContent = next === "en" ? "日本語" : "English";
      button.setAttribute("aria-label", next === "en" ? "日本語に切り替える" : "Switch to English");
    });
    try {
      localStorage.setItem(storageKey, next);
    } catch (_) {
      // Language selection still works when storage is unavailable.
    }
    updateDemoMeta();
  };

  let initialLanguage = "en";
  try {
    initialLanguage = localStorage.getItem(storageKey) || "en";
  } catch (_) {
    initialLanguage = "en";
  }
  setLanguage(initialLanguage);

  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(document.documentElement.lang === "ja" ? "en" : "ja");
    });
  });

  const demo = document.querySelector("[data-time-demo]");
  if (demo) {
    demo.dataset.activeZone = "tokyo";
    const time = demo.querySelector("[data-event-time]");
    const meta = demo.querySelector("[data-event-meta]");
    demo.querySelectorAll("[data-zone]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = zoneData[button.dataset.zone];
        if (!selected) return;
        demo.dataset.activeZone = button.dataset.zone;
        demo.querySelectorAll("[data-zone]").forEach((candidate) => {
          const active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-pressed", String(active));
        });
        time.textContent = selected.time;
        updateDemoMeta();
        time.animate(
          [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      });
    });
  }
})();
