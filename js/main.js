// Mobile menu
const toggle = document.querySelector(".nav__toggle");
const menu = document.querySelector(".nav__menu");

const behindMenu = document.querySelectorAll("main, footer");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Menu");
  menu.classList.toggle("is-open", open);
  document.body.style.overflow = open ? "hidden" : "";
  behindMenu.forEach((element) => {
    element.inert = open;
  });
}

// Widening past the mobile layout closes the menu
matchMedia("(max-width: 860px)").addEventListener("change", (event) => {
  if (!event.matches) setMenu(false);
});

toggle.addEventListener("click", () => {
  setMenu(toggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.classList.contains("is-open")) {
    setMenu(false);
    toggle.focus();
  }
});

// Hero torch: the pointer lights up the crumpled paper
const hero = document.querySelector(".hero");
const lit = document.querySelector(".hero__lit");
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canHover && !calm) {
  const target = { x: 0, y: 0 };
  const light = { x: 0, y: 0 };
  let frame = null;

  function follow() {
    light.x += (target.x - light.x) * 0.12;
    light.y += (target.y - light.y) * 0.12;
    lit.style.setProperty("--mx", `${light.x}px`);
    lit.style.setProperty("--my", `${light.y}px`);
    const settled = Math.abs(target.x - light.x) < 0.5 && Math.abs(target.y - light.y) < 0.5;
    frame = settled ? null : requestAnimationFrame(follow);
  }

  light.x = innerWidth * 0.72;
  light.y = innerHeight * 0.3;

  hero.addEventListener("pointermove", (event) => {
    const box = lit.getBoundingClientRect();
    target.x = event.clientX - box.left;
    target.y = event.clientY - box.top;
    frame ??= requestAnimationFrame(follow);
  });
}

// Hero intro, after Nick's motion logo: a whip zoom into the logo, then the dog pops in
const root = document.documentElement;

if (root.classList.contains("intro")) {
  const logo = document.querySelector(".hero__logo img");
  const dog = logo.cloneNode();
  dog.className = "hero__dog";
  dog.alt = "";
  logo.after(dog);

  let end;

  function finish() {
    clearTimeout(end);
    skips.forEach((type) => removeEventListener(type, finish));
    root.classList.add("intro-played");
    root.classList.remove("intro", "intro-whip");
    dog.remove();
  }

  // Anyone in a hurry can skip it
  const skips = ["pointerdown", "keydown", "wheel", "touchstart"];
  skips.forEach((type) => addEventListener(type, finish, { passive: true }));

  // Start once the logo can actually be drawn. A timer ends it, so it still finishes in a background tab
  const start = () => {
    if (!root.classList.contains("intro")) return;
    root.classList.add("intro-whip");
    end = setTimeout(finish, 1900);
  };
  logo.decode().then(start, start);
}

// YouTube videos load only when someone presses play
document.querySelectorAll(".player[data-yt]").forEach((player) => {
  player.addEventListener("click", (event) => {
    event.preventDefault();
    const { yt, start } = player.dataset;
    const holder = document.createElement("div");
    holder.className = player.className;

    const frame = document.createElement("iframe");
    const from = start ? `&start=${start}` : "";
    frame.src = `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0${from}`;
    frame.title = player.getAttribute("aria-label").replace(/^Play /, "");
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    holder.append(frame);

    player.replaceWith(holder);
    frame.focus();
  });
});

// Pause the hero's effects while it's off screen
new IntersectionObserver(([entry]) => {
  hero.classList.toggle("is-away", !entry.isIntersecting);
}).observe(hero);

// Scroll reveals
if (!calm && "IntersectionObserver" in window) {
  // "That's it." is split into letters, with the whole phrase kept for screen readers
  const end = document.querySelector(".foot__end");
  const phrase = end.textContent;
  const letters = document.createElement("span");
  letters.setAttribute("aria-hidden", "true");
  [...phrase].forEach((character, index) => {
    const letter = document.createElement("span");
    letter.className = index === phrase.length - 1 ? "letter letter--last" : "letter";
    letter.style.setProperty("--i", index);
    letter.textContent = character === " " ? "\u00a0" : character;
    letters.append(letter);
  });
  const spoken = document.createElement("span");
  spoken.className = "sr-only";
  spoken.textContent = phrase;
  end.replaceChildren(spoken, letters);

  const stagger = (selector, step) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.style.setProperty("--delay", `${index * step}s`);
    });
  };

  document.querySelectorAll(".player").forEach((player) => {
    player.dataset.reveal = "wipe";
    player.addEventListener("transitionend", (event) => {
      if (event.target === player && event.propertyName === "clip-path") {
        player.classList.add("done"); // Lets the shadow show again
      }
    });
  });
  document
    .querySelectorAll(".clients img, .heading, .flush__copy p, .editorial .action, .wall figure, .close > div, .foot__base")
    .forEach((element) => {
      element.dataset.reveal = "rise";
    });
  document.querySelectorAll(".wall__posters figure").forEach((poster, index) => {
    poster.style.setProperty("--delay", `${(index % 3) * 0.1}s`);
  });
  stagger(".close > div", 0.12);
  document.querySelectorAll(".reel").forEach((reel, index) => {
    reel.querySelectorAll("[data-reveal]").forEach((element) => {
      element.style.setProperty("--delay", `${index * 0.12}s`);
    });
  });

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          reveal.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );

  document.documentElement.classList.add("anim");
  document.querySelectorAll("[data-reveal], .foot__end").forEach((element) => reveal.observe(element));
}
