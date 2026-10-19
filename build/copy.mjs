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
    kicker: "CAMPUS SERVICE",
    desc: "Campus maintenance, procurement and operations — from request to closure.",
    lang: "JavaScript",
    status: "Live",
    live: "https://msec-campusserve.vercel.app",
    repo: "https://github.com/princekumar-dev/Campus-servre--2",
    accent: "#0F766E",
    mark: "building",
    /* MSEC products carry the college crest rather than a monoline glyph —
       it separates the institution's software from the personal builds. */
    logo: true,
    alt: "Campus Serve — campus maintenance, procurement and operations platform",
  },
  {
    slug: "msec-academics",
    name: "MSEC Academics",
    kicker: "ACADEMICS",
    desc: "Modern academic management for marksheets, reports and results.",
    lang: "JavaScript",
    status: "Live",
    live: "https://msec-academics.vercel.app",
    repo: "https://github.com/princekumar-dev/Academics--2",
    accent: "#A96D0C",
    mark: "cap",
    logo: true,
    alt: "MSEC Academics — academic management system for marksheets and reports",
  },
  {
    slug: "msec-connect",
    name: "MSEC Connect",
    kicker: "CONNECT",
    desc: "Discover, explore and book seminar halls and auditoriums at MSEC.",
    lang: "JavaScript",
    status: "Live",
    live: "https://msec-connect.vercel.app/",
    repo: "https://github.com/princekumar-dev/Connect",
    accent: "#2B7FD4",
    mark: "calendar",
    logo: true,
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
    /* lightened off the slate it used to wear: the other five cards are all
       light-forward, and this one read as the odd dark one out */
    accent: "#4E9AD9",
    mark: "bell",
    logo: true,
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
    /* rose, as the project presents itself — deliberately a red-ward coral
       rather than the README's own terracotta #CC785C, which is warmer and
       already carries the page chrome */
    accent: "#C0483F",
    mark: "shield",
    icon: { from: "#FCE8E4", to: "#F6C6BE", mark: "#DD5F55" },
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
    /* emerald, matching the app icon, replacing the olive it used to wear */
    accent: "#2F8F4E",
    mark: "bot",
    icon: { from: "#7FE39B", to: "#2BB65C", mark: "#0E1F16" },
    alt: "BusyBot — AI auto-reply assistant",
  },
];

/* The tech stack card. Icons are full-colour brand marks, so this card is the
   one place where the accent stays out of the way: coral mark and kicker,
   muted group labels, and the logos carry the colour. */
export const STACK = {
  title: "Tech Stack",
  kicker: "WHAT I SHIP WITH",
  count: "12 TOOLS",
  groups: [
    {
      label: "LANGUAGES",
      items: [
        { slug: "typescript", name: "TypeScript" },
        { slug: "javascript", name: "JavaScript" },
        { slug: "python", name: "Python" },
        { slug: "java", name: "Java" },
      ],
    },
    {
      label: "FRONTEND",
      items: [
        { slug: "react", name: "React" },
        { slug: "nextjs", name: "Next.js" },
        { slug: "tailwindcss", name: "Tailwind CSS" },
        { slug: "html5", name: "HTML5" },
        { slug: "css3", name: "CSS3" },
      ],
    },
    {
      label: "BACKEND & DATA",
      items: [
        { slug: "nodejs", name: "Node.js" },
        { slug: "flask", name: "Flask" },
        { slug: "mongodb", name: "MongoDB" },
      ],
    },
  ],
};

/* Numbers read off the live APIs when this card was built (2026-10-17).
 * They are baked in rather than fetched at render time: a README cannot run
 * code, so anything live would have to be an external image — which is exactly
 * what this card replaces. Re-run analytics.mjs to refresh them.
 *
 * `months` is the last twelve, oldest first, and only counts days GitHub
 * recorded a contribution on; `activeDays` is why the streak reads the way it
 * does — the work is concentrated, not daily. */
export const ANALYTICS = {
  title: "GitHub Analytics",
  kicker: "CONTRIBUTION LOG",
  count: "SINCE 2024",
  asOf: "17 OCT 2026",
  stats: [
    { label: "CONTRIBUTIONS", value: "833", sub: "98 active days" },
    { label: "COMMITS", value: "717", sub: "13 PRs · 1 issue" },
    { label: "REPOSITORIES", value: "47", sub: "7 stars · 3 followers" },
  ],
  months: [
    { label: "NOV", value: 0 },
    { label: "DEC", value: 7 },
    { label: "JAN", value: 20 },
    { label: "FEB", value: 12 },
    { label: "MAR", value: 32 },
    { label: "APR", value: 148 },
    { label: "MAY", value: 31 },
    { label: "JUN", value: 86 },
    { label: "JUL", value: 105 },
    { label: "AUG", value: 179 },
    { label: "SEP", value: 99 },
    { label: "OCT", value: 21 },
  ],
  languages: [
    { name: "JavaScript", value: 15 },
    { name: "TypeScript", value: 14 },
    { name: "Python", value: 7 },
    { name: "HTML", value: 3 },
    { name: "CSS", value: 3 },
  ],
  alt:
    "GitHub analytics — 833 contributions across 98 active days, 717 commits, " +
    "47 repositories, and the last twelve months of activity peaking in August",
};

/* Profile views are the one figure that cannot simply be baked in: komarev
   counts them, and a frozen counter is worse than none. analytics.mjs re-reads
   this on every build — this value is only the fallback if that request fails.
   It lives here rather than in the README as an <img> because komarev answers
   a direct fetch but fails through GitHub's camo proxy, which is the same
   problem the other external cards in this section had. */
export const VIEWS_FALLBACK = "566";

/* The About block. Written as data so the section can be typeset rather than
 * left to markdown — GitHub strips <style> and inline styles, so the only way
 * to get a real face into prose is to draw it. `lead` runs in the display
 * serif; the two lists run in the system sans, with ** ** marking the runs
 * that should sit up in semibold. */
export const ABOUT = {
  lead: "I’m Prince R — third-year B.Tech, Artificial Intelligence & Data Science.",
  body:
    "I build full-stack web apps end to end, and increasingly wire LLMs and real data " +
    "into things people can actually use. Most of what’s below started as coursework " +
    "or a hackathon build — and refused to stay a demo.",
  groups: [
    {
      label: "OFF THE CLOCK",
      items: [
        "**Hackathons** — repeat competitor, occasional winner",
        "**Open source** — tinkerer, PR-when-I-can",
        "**Always up for** — web dev, data, or whatever shipped this week in AI",
      ],
    },
    {
      label: "CURRENTLY",
      items: [
        "Studying **machine learning** alongside data structures and algorithms",
        "Shipping **full-stack web apps** end to end",
        "Wiring **LLMs** into products people actually use",
        "Learning **system design** and cloud fundamentals",
      ],
    },
  ],
};

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
  cardDisplay:
    PROJECTS.map((p) => p.name).join("") +
    STACK.title +
    ANALYTICS.title +
    ABOUT.lead +
    "0123456789",
};
