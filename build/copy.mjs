/* All copy the generated assets set, in one place.
 *
 * fonts.mjs subsets the two faces to exactly the characters collected here, so
 * if a string changes this file is the only thing that needs editing — then
 * re-run fonts.mjs. Facts (URLs, descriptions) come from the GitHub API and the
 * projects' own live sites, not from imagination.
 */

export const HEADER = {
  EYEBROW: "B.TECH · AI &amp; DATA SCIENCE",
  EYEBROW_PLAIN: "B.TECH · AI & DATA SCIENCE",
  NAME: "Prince R",
  TAGLINE: "Third-year undergrad. I learn by building — and ship what I learn.",
  CHIPS: ["TypeScript", "React", "Python", "AI / ML"],
  ENGRAVING: "AI · DS",
};

/* accents: each project keeps its own identity, but none of them is the
   coral this README reserves for itself, and none is violet. Where a live
   site declares a theme colour that clashes with that rule (CampusServe's
   site is violet), the accent is lifted to a neighbouring hue. */
export const PROJECTS = [
  {
    slug: "campus-serve",
    name: "Campus Serve",
    kicker: "CAMPUS OPERATIONS",
    desc: "Campus maintenance, procurement and operations — from request to closure.",
    lang: "JavaScript",
    status: "Live",
    live: "https://msec-campusserve.vercel.app",
    repo: "https://github.com/princekumar-dev/Campus-servre--2",
    accent: "#0F766E",
    mark: "building",
    alt: "Campus Serve — campus maintenance, procurement and operations platform",
  },
  {
    slug: "msec-academics",
    name: "MSEC Academics",
    kicker: "ACADEMICS & REPORTS",
    desc: "Modern academic management for marksheets, reports and results.",
    lang: "JavaScript",
    status: "Live",
    live: "https://msec-academics.vercel.app",
    repo: "https://github.com/princekumar-dev/Academics--2",
    accent: "#A96D0C",
    mark: "cap",
    alt: "MSEC Academics — academic management system for marksheets and reports",
  },
  {
    slug: "msec-connect",
    name: "MSEC Connect",
    kicker: "VENUE BOOKING",
    desc: "Discover, explore and book seminar halls and auditoriums at MSEC.",
    lang: "JavaScript",
    status: "Live",
    live: "https://msec-connect.vercel.app/",
    repo: "https://github.com/princekumar-dev/Connect",
    accent: "#2B7FD4",
    mark: "calendar",
    alt: "MSEC Connect — venue booking for seminar halls and auditoriums",
  },
  {
    slug: "msec-notify",
    name: "MSEC Notify",
    kicker: "PARENT ALERTS",
    desc: "Leave and late-attendance alerts reach parents the moment it happens.",
    lang: "JavaScript",
    status: "Live",
    live: "https://msec-notify.vercel.app",
    repo: "https://github.com/princekumar-dev/MSEC-Notify",
    accent: "#334155",
    mark: "bell",
    alt: "MSEC Notify — leave and late-attendance parent alert system",
  },
  {
    slug: "logipilot",
    name: "LogiPilot",
    kicker: "LOGISTICS AI",
    desc: "Predicts shipment delays, optimises routes and tracks fleets live.",
    lang: "TypeScript",
    status: "Source",
    live: "https://github.com/princekumar-dev/Logipilot",
    repo: "https://github.com/princekumar-dev/Logipilot",
    accent: "#0E7490",
    mark: "send",
    alt: "LogiPilot — AI logistics platform for delay prediction and route optimisation",
  },
  {
    slug: "busybot",
    name: "BusyBot",
    kicker: "AI ASSISTANT",
    desc: "Your AI auto-reply assistant — your inbox keeps moving.",
    lang: "TypeScript",
    status: "Live",
    live: "https://busy-bot-eight.vercel.app",
    repo: "https://github.com/princekumar-dev/Busy_Bot",
    accent: "#4D7C0F",
    mark: "bot",
    alt: "BusyBot — AI auto-reply assistant",
  },
];

/** every glyph any generated asset draws — kept separate per face and per
 *  asset, because a subset embedded in six cards multiplies by six. */
export const ALL_TEXT = {
  /* banner: the serif wordmark, plus the sans copy it sets */
  bannerDisplay: HEADER.NAME,
  bannerBody: [
    HEADER.EYEBROW_PLAIN,
    HEADER.TAGLINE,
    HEADER.CHIPS.join(""),
    "0123456789 .,:/&—·↗'",
  ].join(""),
  /* cards: the serif project names only — everything else on a card runs in
     the system stack, which at 10–16px is indistinguishable and an order of
     magnitude cheaper than embedding Inter six times over */
  cardDisplay: PROJECTS.map((p) => p.name).join(""),
};
