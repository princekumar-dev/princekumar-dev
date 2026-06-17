<style>
  * { box-sizing: border-box; }
  a { text-decoration: none !important; }

  /* === ANIMATED LINK UNDERLINE === */
  a.animated-link {
    position: relative;
    display: inline-block;
    color: #93c5fd;
    font-weight: 600;
    transition: color 0.3s ease;
  }
  a.animated-link::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0;
    width: 0; height: 2px;
    background: linear-gradient(90deg, #7c3aed, #3b82f6, #10b981);
    border-radius: 2px;
    transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  a.animated-link:hover::after { width: 100%; }
  a.animated-link:hover { color: #c4b5fd; }

  /* === NOISE TEXTURE === */
  .noise::before {
    content: '';
    position: absolute; inset: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 128px;
    pointer-events: none; z-index: 1;
  }

  /* === HERO WRAPPER (ANIMATED BORDER) === */
  .hero-wrapper {
    position: relative;
    margin: 20px 0;
    border-radius: 24px;
    padding: 3px;
    background: conic-gradient(from var(--angle, 0deg), #7c3aed, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444, #ec4899, #7c3aed);
    animation: rotateBorder 4s linear infinite;
  }
  @property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
  @keyframes rotateBorder { to { --angle: 360deg; } }

  .hero-card {
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    border-radius: 22px;
    padding: 50px 30px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  /* === GLOWING ORBS === */
  .hero-card .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none; z-index: 0;
  }
  .orb-1 { width: 300px; height: 300px; background: rgba(124,58,237,0.18); top: -80px; left: -60px; animation: orbFloat 8s ease-in-out infinite; }
  .orb-2 { width: 250px; height: 250px; background: rgba(59,130,246,0.15); bottom: -60px; right: -40px; animation: orbFloat 10s ease-in-out infinite reverse; }
  .orb-3 { width: 200px; height: 200px; background: rgba(16,185,129,0.1); top: 40%; left: 50%; animation: orbFloat 12s ease-in-out infinite 2s; }
  @keyframes orbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.1); }
    66% { transform: translate(-20px, 15px) scale(0.9); }
  }

  /* === ANIMATED GRADIENT TEXT === */
  .hero-card h1 {
    font-size: 2.6em; font-weight: 800;
    background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399, #fbbf24, #a78bfa);
    background-size: 300% 300%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: gradientShift 4s ease infinite;
    margin: 0 0 8px 0;
    position: relative; z-index: 2;
    letter-spacing: -0.5px;
  }
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* === TYPING TAGLINE === */
  .tagline-wrap {
    display: flex; justify-content: center;
    margin: 0 0 24px 0;
    position: relative; z-index: 2;
  }
  .tagline {
    font-size: 1.15em;
    color: #94a3b8;
    overflow: hidden;
    white-space: nowrap;
    border-right: 3px solid #7c3aed;
    width: 0;
    animation: typing 3.5s steps(50, end) 0.5s forwards, blink 0.8s step-end infinite;
  }
  @keyframes typing { from { width: 0; } to { width: 100%; } }
  @keyframes blink { 50% { border-color: transparent; } }

  /* === PULSING STATUS BADGE === */
  .status-badge {
    display: inline-flex;
    align-items: center; gap: 8px;
    padding: 6px 18px;
    border-radius: 50px;
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.25);
    color: #6ee7b7;
    font-size: 0.82em; font-weight: 600;
    margin-bottom: 20px;
    position: relative; z-index: 2;
  }
  .status-dot {
    width: 8px; height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: statusPulse 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(16,185,129,0.6);
  }
  @keyframes statusPulse {
    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(16,185,129,0.6); }
    50% { opacity: 0.6; transform: scale(1.3); box-shadow: 0 0 16px rgba(16,185,129,0.8); }
  }

  .hero-card .gif-wrap {
    position: relative; margin: 20px auto;
    border-radius: 16px; overflow: hidden;
    border: 2px solid rgba(255,255,255,0.06);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    width: fit-content; z-index: 2;
  }

  /* === SOCIAL ICONS === */
  .hero-card .social-links {
    position: relative; display: flex;
    justify-content: center; gap: 16px;
    margin-top: 20px; z-index: 2;
  }
  .social-icon {
    display: inline-flex;
    align-items: center; justify-content: center;
    width: 48px; height: 48px;
    border-radius: 14px;
    transition: all 0.3s ease;
  }
  .social-icon:hover { transform: translateY(-4px); }
  .social-icon svg { width: 22px; height: 22px; }
  .si-linkedin  { background: linear-gradient(135deg, #0a66c2, #004182); box-shadow: 0 4px 15px rgba(10,102,194,0.3); }
  .si-linkedin:hover { box-shadow: 0 8px 25px rgba(10,102,194,0.5); }
  .si-instagram { background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); box-shadow: 0 4px 15px rgba(220,39,67,0.3); }
  .si-instagram:hover { box-shadow: 0 8px 25px rgba(220,39,67,0.5); }
  .si-github    { background: linear-gradient(135deg, #333, #24292e); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
  .si-github:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.5); }

  /* === COUNTER BADGES === */
  .counter-row {
    display: flex; justify-content: center;
    gap: 14px; flex-wrap: wrap;
    margin: 24px 0 0;
    position: relative; z-index: 2;
  }
  .counter-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 18px;
    border-radius: 50px;
    font-size: 0.82em; font-weight: 700;
    letter-spacing: 0.3px;
    border: 1px solid transparent;
    transition: all 0.3s ease;
  }
  .counter-pill:hover { transform: translateY(-2px); }
  .counter-pill svg { width: 16px; height: 16px; }
  .cp-repos     { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.25); color: #a78bfa; }
  .cp-followers { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.25); color: #93c5fd; }
  .cp-stars     { background: rgba(234,179,8,0.12); border-color: rgba(234,179,8,0.25); color: #fde68a; }
  .cp-commits   { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.25); color: #6ee7b7; }

  /* === SECTION HEADERS === */
  .section-header {
    display: flex; align-items: center; gap: 12px;
    margin: 0 0 24px 0;
    font-size: 1.6em; font-weight: 700;
    color: #e2e8f0;
  }
  .section-header .icon-box {
    display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px;
    border-radius: 10px; flex-shrink: 0;
  }
  .section-header .icon-box svg { width: 22px; height: 22px; }
  .ib-purple { background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2)); }
  .ib-blue   { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.2)); }
  .ib-green  { background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.2)); }
  .ib-orange { background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,179,8,0.2)); }
  .ib-pink   { background: linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,114,182,0.2)); }
  .ib-yellow { background: linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.2)); }
  .ib-cyan   { background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(34,211,238,0.2)); }

  /* === WAVE DIVIDER === */
  .wave-divider {
    width: 100%; height: 40px;
    margin: 10px 0;
    position: relative; overflow: hidden;
  }
  .wave-divider svg {
    position: absolute; bottom: 0;
    width: 200%; height: 100%;
    animation: waveScroll 6s linear infinite;
  }
  @keyframes waveScroll { to { transform: translateX(-50%); } }

  /* === CARD BASE === */
  .card-base {
    border-radius: 18px;
    padding: 35px 40px;
    margin: 30px 0;
    position: relative; overflow: hidden;
    box-shadow: 0 15px 50px rgba(0,0,0,0.4);
  }
  .card-base::after {
    content: ''; position: absolute;
    top: 0; left: 0;
    width: 100%; height: 3px;
  }

  /* === ABOUT CARD === */
  .about-card {
    background: linear-gradient(145deg, #1e1b4b, #1e293b);
    border: 1px solid rgba(139,92,246,0.2);
  }
  .about-card::after { background: linear-gradient(90deg, #7c3aed, #3b82f6, #10b981); }
  .about-card ul { list-style: none; padding: 0; margin: 0; }
  .about-card li {
    color: #cbd5e1;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 1.02em; line-height: 1.6;
    display: flex; align-items: flex-start; gap: 12px;
    transition: all 0.25s ease;
  }
  .about-card li:last-child { border-bottom: none; }
  .about-card li:hover { color: #f1f5f9; padding-left: 8px; }
  .about-card li strong { color: #a78bfa; }
  .about-card li .li-icon {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    border-radius: 8px; flex-shrink: 0; margin-top: 2px;
  }
  .about-card li .li-icon svg { width: 18px; height: 18px; }
  .lic-green  { background: rgba(16,185,129,0.12); color: #6ee7b7; }
  .lic-purple { background: rgba(139,92,246,0.12); color: #a78bfa; }
  .lic-blue   { background: rgba(59,130,246,0.12); color: #93c5fd; }
  .lic-cyan   { background: rgba(6,182,212,0.12); color: #67e8f9; }
  .lic-yellow { background: rgba(234,179,8,0.12); color: #fde68a; }
  .lic-pink   { background: rgba(236,72,153,0.12); color: #f9a8d4; }
  .lic-orange { background: rgba(249,115,22,0.12); color: #fdba74; }

  /* === SKILLS CARD === */
  .skills-card {
    background: linear-gradient(145deg, #0f172a, #1e1b4b);
    border: 1px solid rgba(99,102,241,0.15);
  }
  .skills-card::after { background: linear-gradient(90deg, #f59e0b, #ef4444, #ec4899); }
  .skill-row {
    display: flex; flex-wrap: wrap; gap: 10px;
    justify-content: center; margin: 16px 0;
  }
  .skill-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px;
    border-radius: 12px;
    font-size: 0.88em; font-weight: 600;
    letter-spacing: 0.3px;
    transition: all 0.3s ease;
    cursor: default;
    border: 1px solid transparent;
  }
  .skill-badge:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
  .skill-badge svg { width: 18px; height: 18px; flex-shrink: 0; }
  .s-python    { background: linear-gradient(135deg, #1a2744, #1e3a5f); border-color: #3776ab40; color: #93c5fd; }
  .s-js        { background: linear-gradient(135deg, #3b2f00, #4a3800); border-color: #f7df1e30; color: #fde68a; }
  .s-ts        { background: linear-gradient(135deg, #1a2744, #1e3a5f); border-color: #3178c640; color: #93c5fd; }
  .s-react     { background: linear-gradient(135deg, #0a2a2a, #0d3b3b); border-color: #61dafb30; color: #67e8f9; }
  .s-node      { background: linear-gradient(135deg, #0a2a1a, #0d3b25); border-color: #33993340; color: #86efac; }
  .s-flask     { background: linear-gradient(135deg, #1a1a2e, #252547); border-color: #ffffff20; color: #d1d5db; }
  .s-html      { background: linear-gradient(135deg, #3b1a00, #4a2200); border-color: #e34f2630; color: #fdba74; }
  .s-css       { background: linear-gradient(135deg, #0a1a3b, #0d254f); border-color: #1572b640; color: #93c5fd; }
  .s-tailwind  { background: linear-gradient(135deg, #0a2a2a, #0d3b3b); border-color: #06b6d440; color: #67e8f9; }
  .s-mongo     { background: linear-gradient(135deg, #0a2a1a, #0d3b25); border-color: #47a24840; color: #86efac; }
  .s-mysql     { background: linear-gradient(135deg, #0a1a3b, #0d254f); border-color: #4479a140; color: #93c5fd; }
  .s-git       { background: linear-gradient(135deg, #3b1a0a, #4a220d); border-color: #f0503230; color: #fca5a5; }
  .s-github    { background: linear-gradient(135deg, #1a1a2e, #252547); border-color: #ffffff20; color: #d1d5db; }
  .s-vscode    { background: linear-gradient(135deg, #0a1a3b, #0d254f); border-color: #007acc40; color: #93c5fd; }
  .s-linux     { background: linear-gradient(135deg, #2a2a00, #3b3b00); border-color: #fcc62440; color: #fde68a; }
  .s-java      { background: linear-gradient(135deg, #3b1a0a, #4a220d); border-color: #f8982030; color: #fca5a5; }
  .s-nextjs    { background: linear-gradient(135deg, #1a1a2e, #252547); border-color: #ffffff20; color: #d1d5db; }
  .s-figma     { background: linear-gradient(135deg, #2a1a2e, #3b2539); border-color: #f24e1e30; color: #fca5a5; }

  /* === MARQUEE === */
  .marquee-wrap {
    margin-top: 20px;
    overflow: hidden; border-radius: 12px;
    background: rgba(0,0,0,0.2);
    padding: 10px 0;
    position: relative;
  }
  .marquee-wrap::before, .marquee-wrap::after {
    content: ''; position: absolute;
    top: 0; width: 60px; height: 100%;
    z-index: 2;
  }
  .marquee-wrap::before { left: 0; background: linear-gradient(90deg, #0f172a, transparent); }
  .marquee-wrap::after  { right: 0; background: linear-gradient(-90deg, #1e1b4b, transparent); }
  .marquee-track {
    display: flex; gap: 40px;
    animation: marqueeScroll 20s linear infinite;
    width: max-content;
  }
  .marquee-track span {
    color: #64748b; font-size: 0.85em; font-weight: 600;
    white-space: nowrap;
    display: flex; align-items: center; gap: 8px;
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .marquee-track span svg { width: 16px; height: 16px; color: #7c3aed; }
  @keyframes marqueeScroll { to { transform: translateX(-50%); } }

  /* === PROJECT CARDS === */
  .project-card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px; margin: 20px 0;
  }
  .project-card {
    background: linear-gradient(145deg, #1e1b4b, #0f172a);
    border: 1px solid rgba(139,92,246,0.12);
    border-radius: 16px; padding: 28px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative; overflow: hidden;
    transform-style: preserve-3d;
    perspective: 800px;
  }
  .project-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(59,130,246,0.06));
    opacity: 0; transition: opacity 0.4s ease; z-index: 0;
  }
  .project-card:hover {
    transform: translateY(-6px) rotateX(2deg) rotateY(-2deg);
    border-color: rgba(139,92,246,0.35);
    box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.1);
  }
  .project-card:hover::before { opacity: 1; }
  .project-card .p-icon-wrap {
    display: flex; align-items: center; justify-content: center;
    width: 52px; height: 52px;
    border-radius: 14px; margin-bottom: 16px;
    position: relative; z-index: 1;
  }
  .project-card .p-icon-wrap svg { width: 26px; height: 26px; }
  .pic-purple { background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15)); color: #a78bfa; }
  .pic-blue   { background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.15)); color: #93c5fd; }
  .pic-green  { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.15)); color: #6ee7b7; }
  .pic-pink   { background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(244,114,182,0.15)); color: #f9a8d4; }
  .pic-cyan   { background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(34,211,238,0.15)); color: #67e8f9; }
  .pic-yellow { background: linear-gradient(135deg, rgba(234,179,8,0.15), rgba(245,158,11,0.15)); color: #fde68a; }
  .project-card h3 {
    color: #f1f5f9; font-size: 1.2em; font-weight: 700;
    margin: 0 0 10px 0; position: relative; z-index: 1;
  }
  .project-card p {
    color: #94a3b8; font-size: 0.92em; line-height: 1.65;
    margin: 0 0 16px 0; position: relative; z-index: 1;
  }
  .project-card .tags {
    display: flex; flex-wrap: wrap; gap: 6px;
    position: relative; z-index: 1;
  }
  .project-card .tag {
    padding: 4px 12px; border-radius: 20px;
    font-size: 0.75em; font-weight: 600;
  }
  .tag-purple { background: rgba(139,92,246,0.15); color: #a78bfa; }
  .tag-blue   { background: rgba(59,130,246,0.15); color: #93c5fd; }
  .tag-green  { background: rgba(16,185,129,0.15); color: #6ee7b7; }
  .tag-orange { background: rgba(249,115,22,0.15); color: #fdba74; }
  .tag-pink   { background: rgba(236,72,153,0.15); color: #f9a8d4; }
  .tag-cyan   { background: rgba(6,182,212,0.15); color: #67e8f9; }
  .tag-yellow { background: rgba(234,179,8,0.15); color: #fde68a; }
  .project-card .view-btn {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 16px; padding: 10px 22px;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    color: #fff !important;
    border-radius: 10px;
    font-size: 0.85em; font-weight: 600;
    transition: all 0.3s ease;
    position: relative; z-index: 1;
  }
  .project-card .view-btn svg { width: 16px; height: 16px; }
  .project-card .view-btn:hover {
    background: linear-gradient(135deg, #6d28d9, #4f46e5);
    box-shadow: 0 6px 20px rgba(124,58,237,0.4);
    transform: translateY(-2px);
  }

  /* === STATS CARD === */
  .stats-card {
    background: linear-gradient(145deg, #1e1b4b, #0f172a);
    border: 1px solid rgba(139,92,246,0.12);
    border-radius: 18px;
    padding: 35px 40px; margin: 30px 0;
    box-shadow: 0 15px 50px rgba(0,0,0,0.4);
    position: relative; overflow: hidden;
  }
  .stats-card::after {
    content: ''; position: absolute;
    top: 0; left: 0; width: 100%; height: 3px;
    background: linear-gradient(90deg, #8b5cf6, #3b82f6);
  }

  /* === ACHIEVE CARD === */
  .achieve-card {
    background: linear-gradient(145deg, #1e1b4b, #0f172a);
    border: 1px solid rgba(234,179,8,0.15);
    border-radius: 18px;
    padding: 30px 40px; margin: 30px 0;
    text-align: center;
    box-shadow: 0 15px 50px rgba(0,0,0,0.4);
    position: relative; overflow: hidden;
  }
  .achieve-card::after {
    content: ''; position: absolute;
    top: 0; left: 0; width: 100%; height: 3px;
    background: linear-gradient(90deg, #f59e0b, #ef4444, #ec4899);
  }
  .achieve-item {
    display: inline-block; margin: 10px 16px;
    text-align: center;
    transition: transform 0.3s ease;
  }
  .achieve-item:hover { transform: scale(1.1) rotate(3deg); }
  .achieve-item img { border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
  .achieve-item span { display: block; color: #94a3b8; font-size: 0.8em; margin-top: 6px; font-weight: 500; }

  /* === QUOTE CARD === */
  .quote-card {
    background: linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b);
    border: 1px solid rgba(139,92,246,0.2);
    border-radius: 18px;
    padding: 35px 50px; margin: 30px 0;
    text-align: center;
    position: relative; overflow: hidden;
    box-shadow: 0 15px 50px rgba(0,0,0,0.4);
  }
  .quote-card::before {
    content: '\201C';
    position: absolute; top: 10px; left: 20px;
    font-size: 5em;
    color: rgba(139,92,246,0.15);
    font-family: Georgia, serif; line-height: 1;
  }
  .quote-card p {
    color: #c4b5fd; font-size: 1.2em;
    font-style: italic; font-weight: 500;
    margin: 0; position: relative;
  }

  /* === FOOTER === */
  .footer-wave {
    width: 100%; overflow: hidden;
    line-height: 0; margin-top: 10px;
  }
  .footer-wave svg {
    display: block; width: 100%; height: 50px;
  }
  .footer-card {
    background: linear-gradient(135deg, #0f0c29, #302b63);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 0 0 18px 18px;
    padding: 30px; margin-top: -1px;
    text-align: center; position: relative;
  }
  .footer-card p { color: #64748b; margin: 0; font-size: 0.95em; }
  .footer-card a { color: #a78bfa; font-weight: 600; }
  .footer-card a:hover { color: #c4b5fd; }
  .footer-card svg { width: 16px; height: 16px; vertical-align: middle; }
  .footer-socials {
    display: flex; justify-content: center;
    gap: 12px; margin-top: 14px;
  }
  .footer-socials a {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  .footer-socials a:hover { transform: translateY(-2px); }
  .footer-socials a svg { width: 18px; height: 18px; }
  .fs-linkedin  { background: rgba(10,102,194,0.15); color: #60a5fa; }
  .fs-instagram { background: rgba(220,39,67,0.15); color: #f472b6; }
  .fs-github    { background: rgba(255,255,255,0.08); color: #94a3b8; }

  @media (max-width: 768px) {
    .project-card-grid { grid-template-columns: 1fr; }
    .hero-card h1 { font-size: 1.8em; }
    .card-base, .skills-card, .stats-card, .achieve-card, .quote-card { padding: 25px; }
    .counter-row { gap: 8px; }
  }
</style>

<!-- ==================== HERO ==================== -->
<div class="hero-wrapper">
  <div class="hero-card noise">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="status-badge">
      <span class="status-dot"></span>
      Available for opportunities
    </div>

    <h1>Hey there, I'm Prince R</h1>

    <div class="tagline-wrap">
      <div class="tagline">Student Developer | Full-Stack Enthusiast | Building things that matter</div>
    </div>

    <div class="gif-wrap">
      <img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" width="300" alt="Coding GIF" />
    </div>

    <div class="counter-row">
      <span class="counter-pill cp-repos">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        33+ Repos
      </span>
      <span class="counter-pill cp-followers">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        5 Followers
      </span>
      <span class="counter-pill cp-stars">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        9 Stars
      </span>
      <span class="counter-pill cp-commits">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/></svg>
        100+ Commits
      </span>
    </div>

    <div class="social-links">
      <a class="social-icon si-linkedin" href="https://www.linkedin.com/in/prince-r-b9685130b/" target="_blank" title="LinkedIn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
      </a>
      <a class="social-icon si-instagram" href="https://www.instagram.com/prince_r_94" target="_blank" title="Instagram">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
      </a>
      <a class="social-icon si-github" href="https://github.com/princekumar-dev" target="_blank" title="GitHub">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
      </a>
    </div>
  </div>
</div>

<!-- WAVE DIVIDER -->
<div class="wave-divider">
  <svg viewBox="0 0 1200 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,20 C150,35 350,0 600,20 C850,40 1050,5 1200,20 L1200,40 L0,40 Z" fill="rgba(139,92,246,0.06)"/>
    <path d="M0,25 C200,10 400,40 600,20 C800,0 1000,35 1200,25 L1200,40 L0,40 Z" fill="rgba(59,130,246,0.04)"/>
  </svg>
</div>

<!-- ==================== ABOUT ==================== -->
<div class="about-card card-base noise">
  <div class="section-header">
    <span class="icon-box ib-purple">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </span>
    About Me
  </div>
  <ul>
    <li>
      <span class="li-icon lic-green"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg></span>
      Student developer passionate about crafting <strong>impactful software</strong>
    </li>
    <li>
      <span class="li-icon lic-purple"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg></span>
      I work with <strong>Python, JavaScript, TypeScript, React, Node.js, and Flask</strong>
    </li>
    <li>
      <span class="li-icon lic-blue"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
      Currently building <strong>full-stack projects</strong> and sharpening my dev skills
    </li>
    <li>
      <span class="li-icon lic-cyan"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
      Exploring <strong>cloud technologies</strong>, <strong>AI/ML</strong>, and <strong>system design</strong>
    </li>
    <li>
      <span class="li-icon lic-yellow"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span>
      Hackathon participant &amp; open-source contributor
    </li>
    <li>
      <span class="li-icon lic-pink"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg></span>
      Ask me about <strong>web development, Python scripting, or anything tech!</strong>
    </li>
    <li>
      <span class="li-icon lic-orange"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
      Reach me on <a class="animated-link" href="https://www.linkedin.com/in/prince-r-b9685130b/">LinkedIn</a> or <a class="animated-link" href="https://www.instagram.com/prince_r_94" style="color:#f9a8d4;">Instagram</a>
    </li>
  </ul>
</div>

<!-- ==================== TECH STACK ==================== -->
<div class="skills-card card-base noise">
  <div class="section-header">
    <span class="icon-box ib-orange">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    </span>
    Tech Stack
  </div>
  <div class="skill-row">
    <span class="skill-badge s-python"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg> Python</span>
    <span class="skill-badge s-js"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> JavaScript</span>
    <span class="skill-badge s-ts"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg> TypeScript</span>
    <span class="skill-badge s-java"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg> Java</span>
    <span class="skill-badge s-html"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> HTML5</span>
    <span class="skill-badge s-css"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m7 8 5 5-5 5"/><line x1="13" x2="17" y1="8" y2="18"/></svg> CSS3</span>
  </div>
  <div class="skill-row">
    <span class="skill-badge s-react"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 0-10 10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 0 10-10"/><path d="M12 22a10 10 0 0 1-10-10"/></svg> React</span>
    <span class="skill-badge s-nextjs"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Next.js</span>
    <span class="skill-badge s-node"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> Node.js</span>
    <span class="skill-badge s-flask"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/></svg> Flask</span>
    <span class="skill-badge s-tailwind"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.6 1.2-.7 2.5-.1 3.7 1.2.6 2.4.6 3.6 0A3.6 3.6 0 0 0 10 19.7c1-.6 1.7-1.8 1.7-3s-.7-2.4-1.7-3c.6-1.2.7-2.5.1-3.7A3.6 3.6 0 0 0 12 3z"/></svg> Tailwind</span>
  </div>
  <div class="skill-row">
    <span class="skill-badge s-mongo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4-4 8-7.5 8-12a8 8 0 0 0-16 0c0 4.5 4 8 8 12z"/><circle cx="12" cy="10" r="3"/></svg> MongoDB</span>
    <span class="skill-badge s-mysql"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> MySQL</span>
    <span class="skill-badge s-git"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/></svg> Git</span>
    <span class="skill-badge s-github"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> GitHub</span>
    <span class="skill-badge s-vscode"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg> VS Code</span>
    <span class="skill-badge s-linux"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg> Linux</span>
    <span class="skill-badge s-figma"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/></svg> Figma</span>
  </div>

  <!-- Marquee -->
  <div class="marquee-wrap">
    <div class="marquee-track">
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Always Learning</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Building Fast</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Shipping Secure</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 0-10 10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 0 10-10"/><path d="M12 22a10 10 0 0 1-10-10"/></svg> Full-Stack Focus</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> Open Source</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg> Clean Code</span>
      <!-- Duplicate for seamless loop -->
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Always Learning</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Building Fast</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Shipping Secure</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 0-10 10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 0 10-10"/><path d="M12 22a10 10 0 0 1-10-10"/></svg> Full-Stack Focus</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> Open Source</span>
      <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg> Clean Code</span>
    </div>
  </div>
</div>

<!-- WAVE DIVIDER -->
<div class="wave-divider">
  <svg viewBox="0 0 1200 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,30 C200,5 400,35 600,15 C800,-5 1000,30 1200,10 L1200,40 L0,40 Z" fill="rgba(236,72,153,0.05)"/>
    <path d="M0,20 C300,40 600,5 900,25 C1050,35 1150,15 1200,20 L1200,40 L0,40 Z" fill="rgba(139,92,246,0.04)"/>
  </svg>
</div>

<!-- ==================== GITHUB STATS ==================== -->
<div class="stats-card noise">
  <div class="section-header" style="justify-content:center;">
    <span class="icon-box ib-cyan">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    </span>
    <span style="color:#e2e8f0;">GitHub Stats</span>
  </div>
  <p align="center">
    <img width="48%" src="https://github-readme-stats.vercel.app/api?username=princekumar-dev&show_icons=true&theme=radical&count_private=true&hide_border=true" alt="GitHub Stats" />
    <img width="48%" src="https://github-readme-stats.vercel.app/api/top-langs/?username=princekumar-dev&layout=compact&theme=radical&hide_border=true" alt="Top Languages" />
  </p>
  <p align="center">
    <img src="https://github-readme-streak-stats.herokuapp.com/?user=princekumar-dev&theme=radical&hide_border=true" alt="GitHub Streak" />
  </p>
  <p align="center">
    <img src="https://github-readme-activity-graph.vercel.app/graph?username=princekumar-dev&theme=react-dark&hide_border=true" alt="Contributions Graph" width="100%" />
  </p>
</div>

<!-- ==================== PROJECTS ==================== -->
<div class="skills-card card-base noise">
  <div class="section-header">
    <span class="icon-box ib-green">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
    </span>
    Featured Projects
  </div>
  <div class="project-card-grid">
    <div class="project-card">
      <div class="p-icon-wrap pic-purple">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      </div>
      <h3>Smart Classroom & TimeTable Scheduler</h3>
      <p>An intelligent system to automate classroom and timetable management using constraint-based optimization.</p>
      <div class="tags"><span class="tag tag-purple">TypeScript</span><span class="tag tag-cyan">React</span><span class="tag tag-green">Node.js</span></div>
      <a class="view-btn" href="https://github.com/princekumar-dev/Smart_Classroom_And_TimeTable_Scheduler"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> View Project</a>
    </div>
    <div class="project-card">
      <div class="p-icon-wrap pic-blue">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      </div>
      <h3>LogiPilot AI</h3>
      <p>AI-powered logistics platform that predicts shipment delays, optimizes delivery routes, and monitors fleets in real-time.</p>
      <div class="tags"><span class="tag tag-purple">TypeScript</span><span class="tag tag-pink">AI/ML</span><span class="tag tag-cyan">Real-Time</span></div>
      <a class="view-btn" href="https://github.com/princekumar-dev/Logipilot"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> View Project</a>
    </div>
    <div class="project-card">
      <div class="p-icon-wrap pic-green">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
      </div>
      <h3>EnergySage</h3>
      <p>AI-powered platform for monitoring, forecasting, and optimizing energy use for households and industries.</p>
      <div class="tags"><span class="tag tag-purple">TypeScript</span><span class="tag tag-pink">AI</span><span class="tag tag-blue">Data Viz</span></div>
      <a class="view-btn" href="https://github.com/princekumar-dev/EnergySage"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> View Project</a>
    </div>
    <div class="project-card">
      <div class="p-icon-wrap pic-yellow">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
      </div>
      <h3>GPA Calculator</h3>
      <p>A sleek, web-based GPA Calculator built with Flask — real-time accuracy, responsive UI, and robust error handling.</p>
      <div class="tags"><span class="tag tag-yellow">JavaScript</span><span class="tag tag-green">Flask</span><span class="tag tag-blue">Python</span></div>
      <a class="view-btn" href="https://github.com/princekumar-dev/GPA---Calculator-"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> View Project</a>
    </div>
    <div class="project-card">
      <div class="p-icon-wrap pic-pink">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
      </div>
      <h3>Netflix Homepage Clone</h3>
      <p>A clean, visually striking static clone of the Netflix homepage with responsive design.</p>
      <div class="tags"><span class="tag tag-orange">HTML</span><span class="tag tag-blue">CSS</span><span class="tag tag-green">Responsive</span></div>
      <a class="view-btn" href="https://github.com/princekumar-dev/Netfly---Homepage-Clone-Of-NETFLIX"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> View Project</a>
    </div>
    <div class="project-card">
      <div class="p-icon-wrap pic-cyan">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <h3>MSEC Connect</h3>
      <p>Full-stack venue booking platform for seminar halls and auditoriums at MSEC.</p>
      <div class="tags"><span class="tag tag-yellow">JavaScript</span><span class="tag tag-cyan">Full-Stack</span><span class="tag tag-purple">Booking</span></div>
      <a class="view-btn" href="https://github.com/princekumar-dev/Connect"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> View Project</a>
    </div>
  </div>
</div>

<!-- WAVE DIVIDER -->
<div class="wave-divider">
  <svg viewBox="0 0 1200 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,10 C150,35 350,0 600,20 C850,40 1050,5 1200,25 L1200,40 L0,40 Z" fill="rgba(234,179,8,0.05)"/>
    <path d="M0,25 C200,10 400,40 600,20 C800,0 1000,35 1200,15 L1200,40 L0,40 Z" fill="rgba(16,185,129,0.04)"/>
  </svg>
</div>

<!-- ==================== ACHIEVEMENTS ==================== -->
<div class="achieve-card noise">
  <div class="section-header" style="justify-content:center;">
    <span class="icon-box ib-yellow">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
    </span>
    <span style="color:#e2e8f0;">Achievements</span>
  </div>
  <div class="achieve-item">
    <img src="https://github.githubassets.com/assets/quickdraw-default-39c6aec8ff89.png" width="90" alt="Quickdraw" />
    <span>Quickdraw</span>
  </div>
  <div class="achieve-item">
    <img src="https://github.githubassets.com/assets/pull-shark-default-498c279a747d.png" width="90" alt="Pull Shark" />
    <span>Pull Shark</span>
  </div>
  <div class="achieve-item">
    <img src="https://github.githubassets.com/assets/pair-extraordinaire-default-579438a20e01.png" width="90" alt="Pair Extraordinaire" />
    <span>Pair Extraordinaire</span>
  </div>
</div>

<!-- ==================== QUOTE ==================== -->
<div class="quote-card">
  <p>Passionate about building impactful software — one commit at a time.</p>
</div>

<!-- ==================== FOOTER ==================== -->
<div class="footer-wave">
  <svg viewBox="0 0 1200 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,40 C200,10 400,50 600,30 C800,10 1000,50 1200,20 L1200,60 L0,60 Z" fill="rgba(15,12,41,0.8)"/>
    <path d="M0,50 C300,20 600,55 900,35 C1050,25 1150,45 1200,30 L1200,60 L0,60 Z" fill="#0f0c29"/>
  </svg>
</div>

<div class="footer-card">
  <p>
    Built with
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    by <a href="https://github.com/princekumar-dev">princekumar-dev</a>
  </p>
  <div class="footer-socials">
    <a class="fs-linkedin" href="https://www.linkedin.com/in/prince-r-b9685130b/" target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
    </a>
    <a class="fs-instagram" href="https://www.instagram.com/prince_r_94" target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
    </a>
    <a class="fs-github" href="https://github.com/princekumar-dev" target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
    </a>
  </div>
</div>
