/* ==========================================================================
   RoleColorFinder · concept "blend" · main.js
   Plain script (works from file:// and http). Every module is page-agnostic:
   it looks for its root element and quietly does nothing if it is absent.
   --------------------------------------------------------------------------
   RC            RoleColor engine: profiles, pairings, formulas (same as product)
   util          small helpers (easing, tickers, in-view)
   modules       Header, Menu, Reveal, SplitText, Counters, Hero, Story,
                 Profiles, FrictionEngine, TeamBuilder, Features, Stages,
                 Faq, Finale, Horizon
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var REDUCE = reduceMQ.matches;

  /* ------------------------------------------------------------------------
     RC · the RoleColor engine (data and formulas from the live product)
     ------------------------------------------------------------------------ */
  var RC = (function () {
    var PROFILES = {
      Yellow: { label: 'Executor', focus: 'clear priorities, ownership, and delivery', contribution: 'follow-through, sequencing, and accountability', blindSpot: 'speed can outrun context', preferredCadence: 'clear handoffs and rapid execution loops' },
      Red: { label: 'Motivator', focus: 'people momentum, alignment, and visible energy', contribution: 'social energy, urgency, and buy-in', blindSpot: 'optimism can outrun structure', preferredCadence: 'live discussion and fast relational feedback' },
      Green: { label: 'Architect', focus: 'logic, quality, and durable systems', contribution: 'rigor, precision, and thoughtful tradeoffs', blindSpot: 'analysis can delay commitment', preferredCadence: 'time to think, validate, and refine' },
      Blue: { label: 'Visionary', focus: 'possibility, pattern recognition, and innovation', contribution: 'new angles, reframing, and future-state thinking', blindSpot: 'ideas can drift without a landing zone', preferredCadence: 'wide exploration before narrowing' }
    };
    var ORDER = ['Yellow', 'Red', 'Green', 'Blue'];
    var PAIRS = {
      'Blue-Green': { name: 'Abstraction trap', risk: 'medium',
        summary: 'Both people can stay in concepts too long, which delays concrete handoffs and visible progress.',
        why: 'Blue pushes for possibility while Green pushes for rigor. Without a forcing function, the team keeps refining the model instead of shipping the next move.',
        strengths: ['This pair sees blind spots before they become expensive.', 'They are strong at design reviews, roadmap quality, and long-range problem framing.', 'They can produce thoughtful solutions that feel both original and well-structured.'],
        watchouts: ['Meetings can feel productive without producing ownership or deadlines.', 'Teammates may hear a lot of nuance but not know what happens next.', 'Execution partners can feel blocked waiting for a final answer.'],
        actions: ['End every planning conversation with one named owner and one dated deliverable.', 'Split ideation time from decision time so exploration does not consume the whole meeting.', 'Use a lightweight definition of done before the conversation begins.'] },
      'Blue-Red': { name: 'Authority clash', risk: 'high',
        summary: 'Both people tend to drive the room. One leads with vision and reframing, the other with relational energy and influence.',
        why: 'Blue wants room to reshape the direction. Red wants to move people into alignment quickly. When ownership is fuzzy, both can feel they are carrying the conversation.',
        strengths: ['The pair can energize a room and get people to care about the work.', 'They are powerful in ambiguity when the team needs momentum and imagination.', 'Together they can reframe stale problems into compelling action.'],
        watchouts: ['Meetings can become a contest over whose framing sets the agenda.', 'Other teammates may stop contributing because the room feels crowded.', 'Execution details get lost once the emotional and strategic energy rises.'],
        actions: ['Set a clear decision owner before the meeting starts.', 'Use one person to generate options and the other to land stakeholder alignment, not both at once.', 'Capture decisions in writing before leaving the room.'] },
      'Blue-Yellow': { name: 'Direction trap', risk: 'high',
        summary: 'Blue keeps expanding the horizon while Yellow wants a stable target and a sequence to execute.',
        why: 'Blue often improves the idea while Yellow is already trying to ship it. Each person experiences the other as either premature closure or endless drift.',
        strengths: ['This pair can turn bold ideas into real execution when handoffs are explicit.', 'Blue helps Yellow avoid narrow thinking; Yellow helps Blue avoid vapor.', 'They are strong in zero-to-one work that still needs disciplined delivery.'],
        watchouts: ['Priorities can keep changing once Yellow has already committed resources.', 'Blue may feel constrained too early, while Yellow feels rework piling up.', 'Trust drops when promise dates move without a shared reset.'],
        actions: ['Separate idea generation from execution commitment in the workflow.', 'Agree on the version that is shipping now versus ideas parked for later.', 'Use written change logs when scope shifts.'] },
      'Green-Red': { name: 'Speed trap', risk: 'high',
        summary: 'Red wants to move now and Green wants to understand the system before committing.',
        why: 'Red experiences rigor as delay. Green experiences speed as unforced error. Without a shared operating rhythm, both people believe they are protecting the team from the other.',
        strengths: ['This pair combines stakeholder sensitivity with strong judgment when they trust each other.', 'Red keeps the work human and moving; Green keeps it coherent and durable.', 'They can balance urgency with quality in high-stakes decisions.'],
        watchouts: ['Red may over-interpret Green as negative or resistant.', 'Green may over-interpret Red as shallow or politically driven.', 'Escalations happen when decisions are pushed before Green sees enough evidence.'],
        actions: ['Create a short discovery window, then a hard decision window.', 'Ask Green to define the minimum evidence needed before commitment.', 'Ask Red to frame the cost of delay so tradeoffs are visible.'] },
      'Green-Yellow': { name: 'Precision trap', risk: 'medium',
        summary: 'Yellow optimizes for movement and completion while Green optimizes for soundness and long-term quality.',
        why: 'Yellow wants enough clarity to move. Green wants enough clarity to avoid preventable rework. The tension usually comes from different thresholds, not bad intent.',
        strengths: ['This pair can produce reliable execution with fewer surprises.', 'Yellow pushes the team to convert plans into output.', 'Green protects the team from quality debt and fragile decisions.'],
        watchouts: ['Yellow can feel slowed down by open questions that Green still sees as material.', 'Green can feel ignored when delivery pressure starts dominating the conversation.', 'Small quality issues become recurring friction if they are never named explicitly.'],
        actions: ['Define what must be perfect and what can be iterated later.', 'Use pre-agreed quality checks rather than debating standards each time.', 'Review post-launch issues together so future tradeoffs improve.'] },
      'Red-Yellow': { name: 'Pace trap', risk: 'medium',
        summary: 'Red pushes urgency through people and energy while Yellow pushes urgency through tasks and sequence.',
        why: 'Both want movement, but they create it differently. Red leans on shared momentum and responsiveness; Yellow leans on clarity, scope, and ownership.',
        strengths: ['This pair can create serious momentum once the plan is clear.', 'Red keeps engagement high while Yellow keeps execution moving.', 'They are strong in launches, sprints, and deadline-driven work.'],
        watchouts: ["Red can unintentionally create last-minute pivots that break Yellow's plan.", 'Yellow can sound overly blunt when Red is trying to preserve morale.', 'The team can confuse movement with alignment if the pair does not pause to check understanding.'],
        actions: ['Agree on which decisions are still fluid and which are now fixed.', 'Let Red handle stakeholder temperature while Yellow runs the execution checklist.', 'Use short weekly resets to surface surprises before they become pressure.'] }
    };
    function pairKey(a, b) { return [a, b].sort().join('-'); }
    function pairRisk(a, b) { var p = PAIRS[pairKey(a, b)]; return p ? p.risk : 'low'; }
    function mirrorPair(color) {
      var p = PROFILES[color];
      return {
        name: p.label + ' mirror pair', risk: 'low',
        why: 'Both people prioritize ' + p.focus + '. That usually creates fast rapport, but it can also amplify the same blind spot if nobody introduces a counterweight.',
        strengths: ['They share a natural language around ' + p.focus + '.', 'Trust usually builds quickly because both people value ' + p.preferredCadence + '.', 'This pair can move with confidence once priorities are clear.'],
        watchouts: ['The same blind spot can compound because both people tend to believe the same signals: ' + p.blindSpot + '.', 'Opposing viewpoints can arrive too late because the pair feels aligned early.', 'The team may miss complementary styles if these two dominate the working rhythm.'],
        actions: ['Invite one teammate with a contrasting style into major decisions before locking them.', 'Use a brief pre-mortem to challenge assumptions you both share.', 'Document next steps immediately so alignment turns into visible execution.']
      };
    }
    function getPair(a, b) { return a === b ? mirrorPair(a) : PAIRS[pairKey(a, b)]; }
    function total(counts) { return ORDER.reduce(function (s, c) { return s + (counts[c] || 0); }, 0); }
    function balanceScore(counts) {
      var vals = ORDER.map(function (c) { return counts[c] || 0; });
      var t = vals.reduce(function (a, b) { return a + b; }, 0);
      if (t === 0) return 0;
      var n = t / 4;
      var dev = vals.reduce(function (s, v) { return s + Math.abs(v - n); }, 0);
      var max = 2 * (t - n);
      return max <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((1 - dev / max) * 100)));
    }
    function people(counts) {
      var out = [];
      ORDER.forEach(function (c) { for (var i = 0; i < (counts[c] || 0); i++) out.push(c); });
      return out;
    }
    function highFrictionPairs(counts) {
      var ps = people(counts), n = 0;
      for (var i = 0; i < ps.length; i++) for (var j = i + 1; j < ps.length; j++) if (pairRisk(ps[i], ps[j]) === 'high') n++;
      return n;
    }
    /* which high-friction pairings, and how many of each */
    function highFrictionBreakdown(counts) {
      var out = [];
      Object.keys(PAIRS).forEach(function (k) {
        if (PAIRS[k].risk !== 'high') return;
        var cs = k.split('-'), n = (counts[cs[0]] || 0) * (counts[cs[1]] || 0);
        if (n > 0) out.push({ key: k, name: PAIRS[k].name, count: n, a: cs[0], b: cs[1] });
      });
      return out.sort(function (x, y) { return y.count - x.count; });
    }
    var DOMINANT = {
      Yellow: { title: 'Execution-heavy', detail: 'This group will move fast and close things out, but is likely to commit before the problem is fully framed and to under-invest in the structure that keeps it from recurring.', mitigation: 'Add Architect (Green) capability, or make one person accountable for the problem statement before work starts.' },
      Red: { title: 'Energy-heavy', detail: 'Buy-in and morale will be strong, and optimism will regularly outrun the evidence. Plans get committed to on conviction rather than analysis.', mitigation: 'Add Architect (Green) capability, and require one piece of hard evidence before the team commits.' },
      Green: { title: 'Planning-heavy', detail: 'Work will be well-structured and defensible, but the group will tend to over-analyse, delay commitment, and ship late.', mitigation: 'Add Executor (Yellow) capability, and set a decision deadline with an explicit "80% confidence is enough" rule.' },
      Blue: { title: 'Ideas-heavy', detail: 'Plenty of original direction, but a real risk of reopening settled decisions and starting more than the group finishes.', mitigation: 'Add Executor (Yellow) capability, and close the option set at a fixed point.' }
    };
    var MISSING = {
      Yellow: { title: 'No Executor', detail: 'Nobody here is naturally driven by shipping. Work is likely to be well-considered and late.', mitigation: 'Hire or move in a Yellow, or give one person explicit ownership of delivery pace.' },
      Red: { title: 'No Motivator', detail: 'Nobody is naturally working on belief and morale. This team will be efficient and quietly disengaged under pressure.', mitigation: 'Hire or move in a Red, or make morale an explicit part of someone’s remit.' },
      Green: { title: 'No Architect', detail: 'Nobody is naturally building structure. Expect repeated problems, tribal knowledge, and quality that depends on individuals.', mitigation: 'Hire or move in a Green, or assign process ownership deliberately.' },
      Blue: { title: 'No Visionary', detail: 'Nobody is naturally questioning the framing. This team will execute the plan it was given, including when the plan is wrong.', mitigation: 'Hire or move in a Blue, or bring an outside perspective into planning.' }
    };
    function pct(counts, c) { var t = total(counts); return t ? Math.round((counts[c] || 0) / t * 100) : 0; }
    function summaryLine(counts) {
      var t = total(counts);
      if (t === 0) return 'No one on this team has been assessed yet.';
      if (t < 3) return 'Too few people assessed to read a team shape.';
      var dom = ORDER.filter(function (c) { return pct(counts, c) > 50; })[0];
      if (dom) return pct(counts, dom) + '% ' + PROFILES[dom].label + ': ' + DOMINANT[dom].title.toLowerCase() + '. ' + DOMINANT[dom].detail;
      if (balanceScore(counts) >= 75) return 'Well balanced across all four styles. This team can cover framing, structure, delivery and buy-in without borrowing capability.';
      var top = ORDER.slice().sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0); })[0];
      return 'Tilted toward ' + PROFILES[top].label + ' (' + pct(counts, top) + '%), with the other styles represented but thin.';
    }
    /* "One hire from now": delta per color */
    function deltas(counts) {
      var base = balanceScore(counts), out = {};
      ORDER.forEach(function (c) {
        var next = Object.assign({}, counts); next[c] = (next[c] || 0) + 1;
        out[c] = balanceScore(next) - base;
      });
      return out;
    }
    /* Best next hire = largest delta. Ties go to the color the team has fewer of
       (matches the live product: 4/2/1/0 recommends Visionary over Architect). */
    function bestNextHire(counts) {
      var d = deltas(counts);
      var best = ORDER.slice().sort(function (a, b) {
        return (d[b] - d[a]) || ((counts[a] || 0) - (counts[b] || 0)) || (ORDER.indexOf(b) - ORDER.indexOf(a));
      })[0];
      return { color: best, delta: d[best], text: PROFILES[best].label + ' (' + PROFILES[best].contribution + ')' };
    }
    /* "What this costs you" */
    function insights(counts) {
      var t = total(counts), out = [];
      if (t >= 3) {
        var dom = ORDER.filter(function (c) { return pct(counts, c) > 50; })[0];
        if (dom) out.push({ kind: 'dominant', color: dom, level: pct(counts, dom) >= 70 ? 'high' : 'watch', title: DOMINANT[dom].title + ' (' + pct(counts, dom) + '% ' + PROFILES[dom].label + ')', detail: DOMINANT[dom].detail, mitigation: DOMINANT[dom].mitigation });
      }
      if (t >= 4) ORDER.forEach(function (c) {
        if (!(counts[c] || 0)) out.push({ kind: 'missing', color: c, level: 'gap', title: MISSING[c].title, detail: MISSING[c].detail, mitigation: MISSING[c].mitigation });
      });
      var hf = highFrictionPairs(counts);
      if (hf > 0) {
        var list = highFrictionBreakdown(counts).map(function (p) { return p.name + ' ×' + p.count; }).join(', ');
        out.push({ kind: 'friction', level: hf >= 3 ? 'high' : 'watch', title: hf + ' high-friction ' + (hf === 1 ? 'pair' : 'pairs'), detail: 'Some people on this team have working styles that reliably grind against each other on shared work: ' + list + '.', mitigation: 'Open each pairing in the friction engine and agree on its fix before the next deadline.' });
      }
      return out;
    }
    return { PROFILES: PROFILES, ORDER: ORDER, PAIRS: PAIRS, pairKey: pairKey, pairRisk: pairRisk, mirrorPair: mirrorPair, getPair: getPair,
      total: total, balanceScore: balanceScore, highFrictionPairs: highFrictionPairs, highFrictionBreakdown: highFrictionBreakdown,
      summaryLine: summaryLine, deltas: deltas, bestNextHire: bestNextHire, insights: insights, pct: pct, DOMINANT: DOMINANT, MISSING: MISSING };
  })();
  window.RoleColorEngine = RC;

  /* ------------------------------------------------------------------------
     util
     ------------------------------------------------------------------------ */
  var HEX = { Yellow: [255, 207, 58], Red: [255, 91, 76], Green: [34, 181, 115], Blue: [59, 123, 255] };
  var CLS = { Yellow: 'fill-y', Red: 'fill-r', Green: 'fill-g', Blue: 'fill-b' };
  var INITIAL = { Yellow: 'Y', Red: 'R', Green: 'G', Blue: 'B' };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function multiply(a, b) { return [0, 1, 2].map(function (i) { return Math.round(HEX[a][i] * HEX[b][i] / 255); }); }
  function toHex(rgb) { return '#' + rgb.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('').toUpperCase(); }
  function luminance(rgb) {
    var c = rgb.map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var el = document.createElementNS(SVGNS, tag); for (var k in attrs) el.setAttribute(k, attrs[k]); return el; }
  function fmtDelta(d) { return d > 0 ? '+' + d : d < 0 ? '−' + Math.abs(d) : '0'; }

  /* animate a number inside el from `from` to `to` */
  function ticker(el, from, to, dur) {
    if (el._tick) cancelAnimationFrame(el._tick);
    if (REDUCE || from === to) { el.textContent = to; return; }
    var t0 = performance.now();
    (function step(now) {
      var t = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(lerp(from, to, easeOutCubic(t)));
      if (t < 1) el._tick = requestAnimationFrame(step);
    })(t0);
  }
  /* run cb once when el scrolls into view */
  function inView(el, cb, opts) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(); } });
    }, opts || { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    io.observe(el);
  }
  /* keep a rAF loop alive only while el is on screen and the tab is visible */
  function visibleLoop(el, frame) {
    var on = false, raf = 0, visible = false;
    function tick(now) { frame(now); raf = requestAnimationFrame(tick); }
    function sync() {
      var should = visible && !document.hidden;
      if (should && !on) { on = true; raf = requestAnimationFrame(tick); }
      if (!should && on) { on = false; cancelAnimationFrame(raf); }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { rootMargin: '120px' }).observe(el);
    } else { visible = true; }
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  /* ------------------------------------------------------------------------
     Header: hairline once the page moves
     ------------------------------------------------------------------------ */
  function Header() {
    var h = $('[data-header]'); if (!h) return;
    var on = false;
    function check() { var s = window.scrollY > 8; if (s !== on) { on = s; h.classList.toggle('is-scrolled', s); } }
    window.addEventListener('scroll', check, { passive: true }); check();
  }

  /* ------------------------------------------------------------------------
     Menu: a disc grows out of the toggle and becomes the menu
     ------------------------------------------------------------------------ */
  function Menu() {
    var btn = $('[data-menu-toggle]'), menu = $('[data-menu]'), header = $('[data-header]');
    if (!btn || !menu) return;
    var label = $('[data-menu-label]', btn), open = false, closeTimer;
    function place() {
      var r = btn.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      menu.style.setProperty('--mx', x + 'px'); menu.style.setProperty('--my', y + 'px');
      menu.style.setProperty('--mr', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 10 + 'px');
    }
    function set(next) {
      if (next === open) return;
      open = next; clearTimeout(closeTimer);
      btn.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Close' : 'Menu';
      if (open) {
        place();
        menu.hidden = false;
        void menu.offsetWidth;
        menu.classList.add('is-open');
        header.classList.add('menu-open');
        root.style.overflow = 'hidden';
        setTimeout(function () { var first = $('a', menu); if (first) first.focus({ preventScroll: true }); }, REDUCE ? 0 : 350);
      } else {
        menu.classList.remove('is-open');
        root.style.overflow = '';
        closeTimer = setTimeout(function () { menu.hidden = true; header.classList.remove('menu-open'); }, REDUCE ? 0 : 700);
      }
    }
    btn.addEventListener('click', function () { set(!open); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { set(false); btn.focus(); }
      if (e.key === 'Tab') { /* keep focus inside the menu + toggle */
        var f = [btn].concat($$('a', menu)), i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  }

  /* ------------------------------------------------------------------------
     SplitText: headings reveal word by word through a mask
     ------------------------------------------------------------------------ */
  function SplitText() {
    $$('[data-split]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
      el.innerHTML = words.map(function (w, i) {
        return '<span class="w" aria-hidden="true"><span class="w__i" style="--i:' + i + '">' + w + '</span></span>';
      }).join(' ');
    });
  }

  /* ------------------------------------------------------------------------
     Reveal: fade-rise on scroll (and word masks)
     ------------------------------------------------------------------------ */
  function Reveal() {
    var els = $$('.reveal, [data-split]');
    if (REDUCE || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    // stagger siblings that reveal together
    $$('.hero__facts, .quotes, .finale__paths, .engine-section .section-head, .hero__copy').forEach(function (g) {
      $$('.reveal', g).forEach(function (e, i) { e.style.setProperty('--d', (i * 0.08) + 's'); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ------------------------------------------------------------------------
     Counters: numbers tick up when they appear
     ------------------------------------------------------------------------ */
  function Counters() {
    $$('[data-count-to]').forEach(function (el) {
      var to = +el.getAttribute('data-count-to');
      if (REDUCE) return;
      el.textContent = '0';
      inView(el, function () { setTimeout(function () { ticker(el, 0, to, 1400); }, 500); });
    });
  }

  /* ------------------------------------------------------------------------
     Hero: four profiles in slow orbit. Overlaps mix (multiply), the cursor
     pushes the paint around, and the engine names whichever pair overlaps.
     ------------------------------------------------------------------------ */
  function Hero() {
    var stage = $('[data-hero]'); if (!stage) return;
    var svg = $('.hero__svg', stage), labelsEl = $('[data-hero-labels]', stage), leaders = $('[data-hero-leaders]', stage);
    var discs = $$('[data-hd]', stage).map(function (el, i) {
      var cfg = [
        { r: 172, a: Math.PI * 1.22, R: 172, w: 0.07, wob: 30, ww: 0.21, ph: 0.0 },
        { r: 160, a: Math.PI * 1.74, R: 178, w: 0.07, wob: 34, ww: 0.17, ph: 1.9 },
        { r: 156, a: Math.PI * 0.26, R: 168, w: 0.07, wob: 28, ww: 0.24, ph: 3.1 },
        { r: 166, a: Math.PI * 0.76, R: 174, w: 0.07, wob: 32, ww: 0.19, ph: 4.4 }
      ][i];
      return Object.assign({ el: el, color: el.getAttribute('data-hd'), x: 400, y: 400, ox: 0, oy: 0, tx: 0, ty: 0, drift: (i % 2 ? 1 : -1) * 0.018 }, cfg);
    });
    var C = { x: 440, y: 405 };
    var pointer = null;
    var CROSS = [['Yellow', 'Blue'], ['Red', 'Green'], ['Red', 'Blue'], ['Yellow', 'Red'], ['Yellow', 'Green'], ['Green', 'Blue']];

    // two label slots that crossfade
    labelsEl.innerHTML = '';
    function makeTag() {
      var t = document.createElement('div'); t.className = 'pair-tag'; t.style.opacity = 0;
      t.innerHTML = '<span class="pair-tag__name"></span><span class="pair-tag__meta"></span>';
      labelsEl.appendChild(t);
      var g = svgEl('g', { opacity: 0 });
      var line = svgEl('line', {}), dot = svgEl('circle', { r: 5 });
      g.appendChild(line); g.appendChild(dot); leaders.appendChild(g);
      return { el: t, g: g, line: line, dot: dot, pair: null, alpha: 0, target: 0, lx: 0, ly: 0, init: false };
    }
    var slots = [makeTag(), makeTag()];
    var active = 0, featuredIdx = 0, lastSwitch = -1e9;

    function setTag(slot, pair) {
      var p = RC.getPair(pair[0], pair[1]);
      slot.pair = pair;
      slot.el.children[0].textContent = p.name;
      slot.el.children[1].textContent = RC.PROFILES[pair[0]].label + ' × ' + RC.PROFILES[pair[1]].label + ' · ' + (p.risk === 'high' ? 'High friction' : p.risk === 'medium' ? 'Watch closely' : 'Low friction');
      slot.init = false;
    }
    function byColor(c) { for (var i = 0; i < discs.length; i++) if (discs[i].color === c) return discs[i]; }
    function lens(a, b) {
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      var t = (d * d + a.r * a.r - b.r * b.r) / (2 * d);
      var px = a.x + dx / d * t, py = a.y + dy / d * t;
      // push the label outward, perpendicular to the pair's axis, away from the group centre
      var nx = -dy / d, ny = dx / d;
      if ((px - C.x) * nx + (py - C.y) * ny < 0) { nx = -nx; ny = -ny; }
      return { x: px, y: py, nx: nx, ny: ny, depth: a.r + b.r - d };
    }

    var t0 = performance.now(), intro = REDUCE ? 1 : 0;
    function frame(now) {
      var t = (now - t0) / 1000;
      var ip = REDUCE ? 1 : easeOutCubic(clamp((now - t0 - 150) / 1900, 0, 1));
      // orbit positions
      discs.forEach(function (d) {
        var ang = d.a + d.w * t + Math.sin(t * d.drift * 6 + d.ph) * 0.35;
        var rad = d.R + Math.sin(t * d.ww + d.ph) * d.wob;
        d.bx = C.x + Math.cos(ang) * rad * (1 + (1 - ip) * 0.9);
        d.by = C.y + Math.sin(ang) * rad * 0.92 * (1 + (1 - ip) * 0.9);
        // cursor: gently push paint away from the pointer
        var tx = 0, ty = 0;
        if (pointer) {
          var vx = d.bx - pointer.x, vy = d.by - pointer.y, dist = Math.hypot(vx, vy) || 1;
          var f = Math.pow(clamp(1 - dist / 460, 0, 1), 2) * 86;
          tx = vx / dist * f + (pointer.x - C.x) * 0.03; ty = vy / dist * f + (pointer.y - C.y) * 0.03;
        }
        d.ox += (tx - d.ox) * 0.06; d.oy += (ty - d.oy) * 0.06;
        d.x = d.bx + d.ox; d.y = d.by + d.oy;
        d.rr = d.r * (0.55 + 0.45 * ip);
      });
      discs.forEach(function (d) {
        d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1)); d.el.setAttribute('r', d.rr.toFixed(1));
        d.el.style.opacity = ip;
      });

      // pick a pairing to name: rotate through overlapping cross pairs every few seconds
      if (ip > 0.9 && now - lastSwitch > (REDUCE ? 1e12 : 4200)) {
        var tries = 0, pick = null;
        while (tries < CROSS.length) {
          featuredIdx = (featuredIdx + 1) % CROSS.length; tries++;
          var pa = CROSS[featuredIdx], L = lens(byColor(pa[0]), byColor(pa[1]));
          if (L.depth > 60) { pick = pa; break; }
        }
        if (pick) {
          var cur = slots[active]; cur.target = 0;
          active = 1 - active; setTag(slots[active], pick); slots[active].target = 1;
          lastSwitch = now;
        }
      }
      var box = svg.getBoundingClientRect(), sc = box.width / 800 || 1;
      slots.forEach(function (s) {
        s.alpha += (s.target - s.alpha) * (REDUCE ? 1 : 0.08);
        if (!s.pair) return;
        var L = lens(byColor(s.pair[0]), byColor(s.pair[1]));
        var reach = 150;
        // keep the whole tag inside the stage (and the viewport) whatever the stage's size
        var hw = (s.el.offsetWidth / 2 + 10) / sc, hh = (s.el.offsetHeight / 2 + 8) / sc;
        var minX = Math.max(hw, (-box.left + 12) / sc + hw), maxX = Math.min(800 - hw, (innerWidth - box.left - 12) / sc - hw);
        var lx = clamp(L.x + L.nx * reach, minX, Math.max(minX, maxX)), ly = clamp(L.y + L.ny * reach, Math.max(70, hh), Math.min(710, 800 - hh));
        if (!s.init) { s.lx = lx; s.ly = ly; s.init = true; }
        s.lx += (lx - s.lx) * 0.12; s.ly += (ly - s.ly) * 0.12;
        s.el.style.left = (s.lx / 8) + '%'; s.el.style.top = (s.ly / 8) + '%';
        s.el.style.opacity = s.alpha.toFixed(3);
        s.g.setAttribute('opacity', s.alpha.toFixed(3));
        s.line.setAttribute('x1', L.x.toFixed(1)); s.line.setAttribute('y1', L.y.toFixed(1));
        s.line.setAttribute('x2', s.lx.toFixed(1)); s.line.setAttribute('y2', s.ly.toFixed(1));
        s.dot.setAttribute('cx', L.x.toFixed(1)); s.dot.setAttribute('cy', L.y.toFixed(1));
        s.dot.setAttribute('r', (5 / Math.max(sc, .4)).toFixed(2));
      });
    }

    if (!REDUCE) {
      stage.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = svg.getBoundingClientRect();
        pointer = { x: (e.clientX - r.left) / r.width * 800, y: (e.clientY - r.top) / r.height * 800 };
      });
      stage.addEventListener('pointerleave', function () { pointer = null; });
      document.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = svg.getBoundingClientRect();
        if (e.clientY > r.bottom + 100) return;
        pointer = { x: (e.clientX - r.left) / r.width * 800, y: (e.clientY - r.top) / r.height * 800 };
      }, { passive: true });
      visibleLoop(stage, frame);
    } else {
      // reduced motion: one composed, still frame with a named pair
      t0 = performance.now() - 12000; lastSwitch = -1e9;
      frame(performance.now()); frame(performance.now());
    }
  }

  /* ------------------------------------------------------------------------
     Story: scroll-linked choreography. One person, a pair, a whole team.
     ------------------------------------------------------------------------ */
  function Story() {
    var sec = $('[data-story]'); if (!sec) return;
    var steps = $$('[data-story-step]', sec), stage = $('[data-story-stage]', sec);
    var ds = $$('[data-sd]', stage).map(function (g) { return { f: $('.sd__f', g), r: $('.sd__r', g) }; });
    var labels = [0, 1, 2].map(function (k) { return $$('.sl--' + k, stage); });
    // [x, y, r, fillOpacity, ringOpacity] per disc, per state
    var S = [
      [[250, 240, 160, 1, 0], [300, 480, 40, 1, 0], [420, 480, 30, 1, 0], [540, 480, 22, 0, 1], [250, 240, 0, 0, 0], [250, 240, 0, 0, 0], [250, 240, 0, 0, 0], [300, 480, 0, 0, 0]],
      [[215, 290, 140, 1, 0], [300, 480, 0, 0, 0], [420, 480, 0, 0, 0], [385, 290, 140, 1, 0], [215, 290, 0, 0, 0], [215, 290, 0, 0, 0], [215, 290, 0, 0, 0], [300, 400, 0, 0, 0]],
      [[200, 245, 64, 1, 0], [400, 245, 64, 1, 0], [450, 332, 64, 1, 0], [300, 436, 64, 0, 1], [300, 245, 64, 1, 0], [150, 332, 64, 1, 0], [250, 332, 64, 1, 0], [350, 332, 64, 1, 0]]
    ];
    var last = -1;
    function render(f) {
      var i = Math.min(Math.floor(f), 1), t = f - i;
      var A = S[i], B = S[Math.min(i + 1, 2)];
      ds.forEach(function (d, k) {
        var e = easeInOutCubic(t);
        // stagger the team members slightly so the cluster assembles, not teleports
        if (i === 1 && k >= 4) e = easeInOutCubic(clamp((t - (k - 4) * 0.06) / 0.76, 0, 1));
        var x = lerp(A[k][0], B[k][0], e), y = lerp(A[k][1], B[k][1], e), r = Math.max(0, lerp(A[k][2], B[k][2], e));
        var fo = lerp(A[k][3], B[k][3], e), ro = lerp(A[k][4], B[k][4], e);
        [d.f, d.r].forEach(function (c) { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', r.toFixed(1)); });
        d.f.style.fillOpacity = fo.toFixed(3); d.r.style.strokeOpacity = ro.toFixed(3);
      });
      labels.forEach(function (ls, k) {
        var o = clamp(1 - Math.abs(f - k) * 2.6, 0, 1);
        ls.forEach(function (l) { l.style.opacity = o.toFixed(3); l.style.transform = l.style.transform; });
      });
      var cur = Math.round(f);
      if (cur !== last) { steps.forEach(function (s, k) { s.classList.toggle('is-active', k === cur); }); last = cur; }
    }
    function measure() {
      var vh = window.innerHeight, mobile = window.innerWidth <= 900;
      // phones: the stage is pinned on top, so a step is "current" when its heading sits just below the stage
      var focus = mobile ? stage.getBoundingClientRect().bottom + 40 : vh * 0.52;
      var cs = steps.map(function (s) {
        var r = s.getBoundingClientRect();
        return mobile ? r.top : r.top + r.height / 2;
      });
      var f;
      if (focus <= cs[0]) f = 0;
      else if (focus >= cs[cs.length - 1]) f = cs.length - 1;
      else {
        for (var i = 0; i < cs.length - 1; i++) if (focus >= cs[i] && focus < cs[i + 1]) { f = i + (focus - cs[i]) / (cs[i + 1] - cs[i]); break; }
      }
      var base = Math.floor(f), frac = f - base;
      f = base + smoothstep(0.28, 0.72, frac);
      return REDUCE ? Math.round(f) : f;
    }
    var ticking = false;
    function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; render(measure()); }); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    render(measure());
  }

  /* ------------------------------------------------------------------------
     Profiles: the four discs slide together as the row scrolls in
     ------------------------------------------------------------------------ */
  function Profiles() {
    var row = $('[data-profiles]'); if (!row) return;
    if (REDUCE) { row.style.setProperty('--p', 1); return; }
    var ticking = false;
    function update() {
      ticking = false;
      var r = row.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh * 0.95 - r.top) / (vh * 0.55), 0, 1);
      row.style.setProperty('--p', easeOutCubic(p).toFixed(3));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------------
     FrictionEngine: pick two profiles, the discs merge, touch or repel
     ------------------------------------------------------------------------ */
  function FrictionEngine() {
    var box = $('[data-engine]'); if (!box) return;
    var stage = $('[data-engine-stage]', box);
    var discA = $('[data-disc="a"]', box), discB = $('[data-disc="b"]', box), ring = $('[data-lens-ring]', box);
    var tension = $('[data-tension]', box);
    var chip = $('[data-chip]', box), copy = $('[data-engine-copy]', box), live = $('[data-engine-live]', box);
    var chart = $('[data-mixchart]', box);
    var R = 108, CY = 150, MID = 280;
    var GAP = { low: 96, medium: 200, high: 264 };
    var ENC = {
      high: 'They repel. Under pressure, a tension gap opens between them.',
      medium: 'They touch. The friction lives at the edges, so watch the handoffs.',
      low: 'They merge. Fast rapport, and a blind spot they share.'
    };
    var RISK_TEXT = { high: 'High friction', medium: 'Watch closely', low: 'Low friction' };
    var state = { a: 'Yellow', b: 'Blue' };
    var pos = { a: MID - GAP.high / 2, b: MID + GAP.high / 2, va: 0, vb: 0 }, target = { a: pos.a, b: pos.b };
    var raf = 0, shakeT = -1;

    // build the ten-pairing chart (upper triangle, rows = first person)
    var cells = [];
    if (chart) {
      var frag = document.createDocumentFragment();
      var corner = document.createElement('span'); corner.className = 'mc-axis'; frag.appendChild(corner);
      RC.ORDER.forEach(function (c) { var s = document.createElement('span'); s.className = 'mc-axis'; s.textContent = RC.PROFILES[c].label.charAt(0); s.title = RC.PROFILES[c].label; s.setAttribute('aria-hidden', 'true'); frag.appendChild(s); });
      RC.ORDER.forEach(function (row, ri) {
        var lab = document.createElement('span'); lab.className = 'mc-axis mc-axis--row'; lab.textContent = RC.PROFILES[row].label.charAt(0); lab.setAttribute('aria-hidden', 'true'); frag.appendChild(lab);
        RC.ORDER.forEach(function (col, ci) {
          if (ci < ri) { var e = document.createElement('span'); e.className = 'mc-empty'; frag.appendChild(e); return; }
          var p = RC.getPair(row, col);
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'mc-cell';
          b.setAttribute('aria-label', RC.PROFILES[row].label + ' with ' + RC.PROFILES[col].label + ': ' + p.name + ', ' + RISK_TEXT[p.risk].toLowerCase());
          b.setAttribute('aria-pressed', 'false');
          b.title = p.name;
          var gap = { low: 8, medium: 18, high: 24 }[p.risk];
          var sv = svgEl('svg', { viewBox: '0 0 40 20', 'aria-hidden': 'true' });
          sv.appendChild(svgEl('circle', { cx: 20 - gap / 2, cy: 10, r: 9, class: CLS[row] }));
          sv.appendChild(svgEl('circle', { cx: 20 + gap / 2, cy: 10, r: 9, class: CLS[col] }));
          b.appendChild(sv);
          b.addEventListener('click', function () { select(row, col, true); });
          cells.push({ el: b, key: row === col ? row + '=' : RC.pairKey(row, col) });
          frag.appendChild(b);
        });
      });
      chart.appendChild(frag);
      var key = document.createElement('p'); key.className = 'mixchart__key'; key.setAttribute('aria-hidden', 'true');
      key.innerHTML = '<span><span class="enc-glyph enc-glyph--low"></span>merge · low</span><span><span class="enc-glyph enc-glyph--medium"></span>touch · watch</span><span><span class="enc-glyph enc-glyph--high"></span>repel · high</span>';
      chart.parentNode.appendChild(key);
    }

    function animate() {
      cancelAnimationFrame(raf);
      if (REDUCE) { pos.a = target.a; pos.b = target.b; draw(0); return; }
      var t0 = performance.now();
      (function step(now) {
        var k = 0.075, damp = 0.76;
        pos.va = (pos.va + (target.a - pos.a) * k) * damp; pos.a += pos.va;
        pos.vb = (pos.vb + (target.b - pos.b) * k) * damp; pos.b += pos.vb;
        var settled = Math.abs(target.a - pos.a) < .05 && Math.abs(pos.va) < .05 && Math.abs(target.b - pos.b) < .05 && Math.abs(pos.vb) < .05;
        var shake = 0;
        if (shakeT >= 0) { var st = (now - shakeT) / 1000; if (st > 0.25 && st < 1.25) shake = Math.sin(st * 60) * 3.2 * (1 - (st - .25)); }
        draw(shake);
        if (!settled || (shakeT >= 0 && now - shakeT < 1300)) raf = requestAnimationFrame(step);
      })(t0);
    }
    function draw(shake) {
      discA.setAttribute('cx', (pos.a - shake).toFixed(2)); discB.setAttribute('cx', (pos.b + shake).toFixed(2));
      var d = pos.b - pos.a, over = 2 * R - d;
      if (over > 0 && ring) {
        var h = Math.sqrt(Math.max(0, R * R - (d / 2) * (d / 2)));
        ring.setAttribute('cx', ((pos.a + pos.b) / 2).toFixed(1)); ring.setAttribute('cy', CY);
        ring.setAttribute('r', (Math.max(h, over / 2) + 8).toFixed(1));
      }
      if (tension) tension.setAttribute('transform', 'translate(' + (((pos.a + pos.b) / 2) - MID).toFixed(1) + ' 0)');
    }
    function select(a, b, fromChart) {
      state.a = a; state.b = b;
      if (fromChart) {
        var ia = $('input[name="pa"][value="' + a + '"]', box), ib = $('input[name="pb"][value="' + b + '"]', box);
        if (ia) ia.checked = true; if (ib) ib.checked = true;
      }
      var p = RC.getPair(a, b);
      stage.setAttribute('data-risk', p.risk);
      box.setAttribute('data-risk', p.risk);
      discA.setAttribute('class', 'engine__disc ' + CLS[a]);
      discB.setAttribute('class', 'engine__disc ' + CLS[b]);
      target.a = MID - GAP[p.risk] / 2; target.b = MID + GAP[p.risk] / 2;
      shakeT = p.risk === 'high' && !REDUCE ? performance.now() : -1;
      animate();

      var enc = $('[data-encoding]', box);
      $('.enc-glyph', enc).className = 'enc-glyph enc-glyph--' + p.risk;
      $('[data-encoding-text]', enc).textContent = ENC[p.risk];

      // the paint chip takes the literal mix of the two colors
      var mix = a === b ? multiply(a, a) : multiply(a, b);
      var inkOn = luminance(mix) > 0.18;
      chip.style.setProperty('--chip', toHex(mix));
      chip.style.setProperty('--chip-ink', inkOn ? '#0E1014' : '#FFFFFF');
      $('[data-pair-label]', chip).textContent = RC.PROFILES[a].label + ' × ' + RC.PROFILES[b].label;
      $('[data-pair-name]', chip).textContent = p.name;
      var tag = $('[data-risk-tag]', chip); tag.className = 'risk risk--' + p.risk;
      $('[data-risk-text]', chip).textContent = RISK_TEXT[p.risk];
      $('[data-chip-code]', chip).textContent = INITIAL[a] + ' × ' + INITIAL[b];
      $('[data-chip-hex]', chip).textContent = toHex(mix);

      function fill() {
        $('[data-summary]', copy).textContent = p.summary || p.why;
        var why = $('[data-why]', copy); why.textContent = p.summary ? p.why : ''; why.hidden = !p.summary;
        [['[data-strengths]', p.strengths], ['[data-watchouts]', p.watchouts], ['[data-actions]', p.actions]].forEach(function (pair) {
          var list = $(pair[0], copy); list.innerHTML = '';
          pair[1].forEach(function (t) { var li = document.createElement('li'); li.textContent = t; list.appendChild(li); });
        });
      }
      if (REDUCE) fill();
      else { copy.classList.add('is-swapping'); clearTimeout(copy._t); copy._t = setTimeout(function () { fill(); copy.classList.remove('is-swapping'); }, 170); }

      if (live) live.textContent = RC.PROFILES[a].label + ' and ' + RC.PROFILES[b].label + ': ' + p.name + ', ' + RISK_TEXT[p.risk].toLowerCase() + '.';
      var k = a === b ? a + '=' : RC.pairKey(a, b);
      cells.forEach(function (c) { c.el.setAttribute('aria-pressed', String(c.key === k)); });
    }
    $$('input[type="radio"]', box).forEach(function (inp) {
      inp.addEventListener('change', function () {
        var a = $('input[name="pa"]:checked', box).value, b = $('input[name="pb"]:checked', box).value;
        select(a, b, false);
      });
    });
    select(state.a, state.b, true);
    live.textContent = '';
    box._select = select;
  }

  /* ------------------------------------------------------------------------
     TeamBuilder: steppers per profile, a packed cluster of discs, live score
     ------------------------------------------------------------------------ */
  function TeamBuilder() {
    var box = $('[data-builder]'); if (!box) return;
    var MAX = 12;
    var counts = { Yellow: 4, Red: 2, Green: 1, Blue: 0 };
    var el = {
      total: $('[data-total]', box), score: $('[data-score]', box), meter: $('[data-meter]', box),
      friction: $('[data-friction]', box), frictionList: $('[data-friction-list]', box), summary: $('[data-summary]', box),
      best: $('[data-best]', box), insights: $('[data-insights]', box), live: $('[data-builder-live]', box),
      svg: $('[data-cluster]', box), discsG: $('[data-cluster-discs]', box), gapsG: $('[data-cluster-gaps]', box),
      stage: $('.builder__stage', box), bar: $('.composition__bar', box)
    };
    var prevScore = RC.balanceScore(counts), prevFriction = RC.highFrictionPairs(counts);

    /* ---- cluster simulation ---- */
    var W = 520, H = 400, CX = W / 2, CY = H / 2 + 4;
    var DIR = { Yellow: -135, Red: -45, Green: 45, Blue: 135 };
    Object.keys(DIR).forEach(function (k) { var a = DIR[k] * Math.PI / 180; DIR[k] = [Math.cos(a), Math.sin(a)]; });
    var nodes = [], gaps = {}, gapLabels = {}, simRaf = 0, uid = 0;
    el.discsG.innerHTML = '';
    function radius(n) { return clamp(Math.sqrt(44000 / Math.max(n, 1)) / 1.7, 17, 46); }
    function addNode(color, instant) {
      var n = nodes.length + 1, r = radius(n), d = DIR[color];
      var from = gaps[color] && gaps[color].shown ? { x: gaps[color].x, y: gaps[color].y } : { x: CX + d[0] * 260, y: CY + d[1] * 220 };
      var c = svgEl('circle', { class: CLS[color], cx: from.x, cy: from.y, r: 0 });
      el.discsG.appendChild(c);
      nodes.push({ id: uid++, color: color, x: from.x + (Math.random() - .5) * 6, y: from.y + (Math.random() - .5) * 6, vx: 0, vy: 0, r: instant ? r : 0, el: c, dying: false });
    }
    function removeNode(color) {
      for (var i = nodes.length - 1; i >= 0; i--) if (nodes[i].color === color && !nodes[i].dying) { nodes[i].dying = true; return; }
    }
    function targetR() { return radius(nodes.filter(function (n) { return !n.dying; }).length); }
    function step() {
      var R = targetR(), live = nodes.filter(function (n) { return !n.dying; });
      var Rc = Math.sqrt(live.length) * R * 0.95;
      var energy = 0;
      nodes.forEach(function (n) {
        var goal = n.dying ? 0 : R;
        n.r += (goal - n.r) * 0.16;
        if (n.dying) return;
        var d = DIR[n.color];
        var ax = CX + d[0] * Rc * 0.42, ay = CY + d[1] * Rc * 0.42;
        n.vx += (ax - n.x) * 0.010 + (CX - n.x) * 0.004;
        n.vy += (ay - n.y) * 0.010 + (CY - n.y) * 0.004;
      });
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i]; if (a.dying) continue;
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j]; if (b.dying) continue;
          var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 0.01;
          var min = (a.r + b.r) * 0.84;
          if (dist < min) {
            var push = (min - dist) / dist * 0.22;
            a.vx -= dx * push; a.vy -= dy * push; b.vx += dx * push; b.vy += dy * push;
          }
        }
      }
      nodes.forEach(function (n) {
        n.vx *= 0.8; n.vy *= 0.8; n.x += n.vx; n.y += n.vy;
        energy += Math.abs(n.vx) + Math.abs(n.vy);
      });
      // drop the ones that have faded out
      nodes = nodes.filter(function (n) { if (n.dying && n.r < 0.6) { n.el.remove(); return false; } return true; });
      // gap discs sit on the cluster edge in their color's direction
      var tot = live.length;
      RC.ORDER.forEach(function (c) {
        var g = gaps[c]; if (!g) return;
        var show = tot >= 1 && !counts[c];
        var d = DIR[c], ext = 0;
        live.forEach(function (n) { ext = Math.max(ext, (n.x - CX) * d[0] + (n.y - CY) * d[1]); });
        var gx = clamp(CX + d[0] * (ext + R * 1.9), R + 8, W - R - 8), gy = clamp(CY + d[1] * (ext + R * 1.9), R + 8, H - R - 30);
        if (!g.init) { g.x = gx; g.y = gy; g.init = true; }
        g.x += (gx - g.x) * 0.15; g.y += (gy - g.y) * 0.15; g.r += ((show ? R : 0) - g.r) * 0.15;
        g.shown = show;
        g.el.setAttribute('cx', g.x.toFixed(1)); g.el.setAttribute('cy', g.y.toFixed(1)); g.el.setAttribute('r', Math.max(0, g.r).toFixed(1));
        g.plus.setAttribute('transform', 'translate(' + g.x.toFixed(1) + ' ' + g.y.toFixed(1) + ') scale(' + (Math.max(0, g.r) / 40).toFixed(3) + ')');
        g.el.style.display = g.r < 1 ? 'none' : '';
        var lab = gapLabels[c];
        lab.style.left = (g.x / W * 100) + '%'; lab.style.top = ((g.y + g.r + 14) / H * 100) + '%';
        lab.style.opacity = show && g.r > R * 0.7 ? 1 : 0;
        energy += Math.abs(gx - g.x) + Math.abs((show ? R : 0) - g.r);
      });
      return energy + nodes.reduce(function (s, n) { return s + Math.abs((n.dying ? 0 : R) - n.r); }, 0);
    }
    function render() { nodes.forEach(function (n) { n.el.setAttribute('cx', n.x.toFixed(1)); n.el.setAttribute('cy', n.y.toFixed(1)); n.el.setAttribute('r', Math.max(0, n.r).toFixed(1)); }); }
    function run() {
      if (REDUCE) { for (var i = 0; i < 500; i++) step(); nodes.forEach(function (n) { n.r = n.dying ? 0 : targetR(); }); step(); render(); return; }
      cancelAnimationFrame(simRaf);
      var frames = 0;
      (function loop() {
        var e = step(); render(); frames++;
        if (e > 0.08 && frames < 900) simRaf = requestAnimationFrame(loop);
      })();
    }
    // gap discs: dashed outlines you can click to fill the gap
    RC.ORDER.forEach(function (c) {
      var ge = svgEl('circle', { class: 'gap', cx: CX, cy: CY, r: 0 });
      var plus = svgEl('path', { class: 'gap-plus', d: 'M-9 0H9M0 -9V9' });
      ge.addEventListener('click', function () { change(c, 1); });
      el.gapsG.appendChild(ge); el.gapsG.appendChild(plus);
      gaps[c] = { el: ge, plus: plus, x: CX, y: CY, r: 0, init: false, shown: false };
      var lab = document.createElement('span'); lab.className = 'cluster-label'; lab.textContent = 'Gap: ' + RC.PROFILES[c].label; lab.style.opacity = 0;
      el.stage.appendChild(lab); gapLabels[c] = lab;
    });
    RC.ORDER.forEach(function (c) { for (var i = 0; i < counts[c]; i++) addNode(c, true); });
    // settle the starting cluster instantly
    for (var s = 0; s < 400; s++) step();
    render();

    /* ---- readouts ---- */
    function renderInsights() {
      var list = RC.insights(counts);
      el.insights.innerHTML = '';
      if (!list.length) {
        var t = RC.total(counts);
        var li0 = document.createElement('li'); li0.className = 'insight insight--empty';
        li0.innerHTML = '<p class="insight__level">Nothing flagged</p><h4 class="insight__title"></h4><p class="insight__detail"></p>';
        $('.insight__title', li0).textContent = t < 3 ? 'Add a few more people' : 'No structural gaps at this size';
        $('.insight__detail', li0).textContent = t < 3 ? 'A team shape needs at least three assessed people before it can be read.' : 'Every style is represented and no pairing type dominates. Keep an eye on individual pairings in the friction engine.';
        el.insights.appendChild(li0);
        return;
      }
      list.forEach(function (it, i) {
        var li = document.createElement('li');
        li.className = 'insight' + (it.level === 'high' ? ' insight--high' : '');
        li.style.setProperty('--i', i);
        li.innerHTML = '<p class="insight__level"></p><h4 class="insight__title"></h4><p class="insight__detail"></p><p class="insight__fix"><b>Fix</b><span></span></p>';
        $('.insight__level', li).textContent = it.level === 'high' ? 'High' : it.level === 'gap' ? 'Gap' : 'Watch';
        $('.insight__title', li).textContent = it.title;
        $('.insight__detail', li).textContent = it.detail;
        $('.insight__fix span', li).textContent = it.mitigation;
        el.insights.appendChild(li);
      });
    }
    function update(changed, dir) {
      var t = RC.total(counts), score = RC.balanceScore(counts), hf = RC.highFrictionPairs(counts);
      el.total.textContent = t;
      ticker(el.score, prevScore, score, 900);
      el.meter.style.setProperty('--v', (score / 100).toFixed(3));
      ticker(el.friction, prevFriction, hf, 700);
      var br = RC.highFrictionBreakdown(counts);
      el.frictionList.textContent = br.length ? br.map(function (p) { return p.name + ' ×' + p.count; }).join(' · ') : 'None on this team';
      el.summary.textContent = RC.summaryLine(counts);
      // composition
      $$('span', el.bar).forEach(function (s, i) { s.style.flexGrow = counts[RC.ORDER[i]]; });
      RC.ORDER.forEach(function (c) { var p = $('[data-pct="' + c + '"]', box); if (p) p.textContent = RC.pct(counts, c) + '%'; });
      // steppers
      $$('.stepper', box).forEach(function (row) {
        var c = row.getAttribute('data-color'), out = $('[data-count]', row);
        out.textContent = counts[c];
        $('[data-delta="-1"]', row).disabled = counts[c] <= 0;
        $('[data-delta="1"]', row).disabled = counts[c] >= MAX;
        if (c === changed && !REDUCE) { out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
      });
      // one hire from now
      var d = RC.deltas(counts), best = RC.bestNextHire(counts);
      $$('[data-add]', box).forEach(function (b) {
        var c = b.getAttribute('data-add'), v = $('[data-dv]', b);
        v.textContent = fmtDelta(d[c]);
        v.className = 'delta__v ' + (d[c] > 0 ? 'is-up' : d[c] < 0 ? 'is-down' : 'is-flat');
        b.classList.toggle('is-best', c === best.color && t > 0);
        b.disabled = counts[c] >= MAX;
        b.setAttribute('aria-label', 'Add one ' + RC.PROFILES[c].label + ': balance score ' + (d[c] >= 0 ? 'plus ' : 'minus ') + Math.abs(d[c]));
      });
      el.best.innerHTML = t > 0 ? 'Best next hire: <strong></strong> <span></span>' : 'Add people to see who to hire next.';
      if (t > 0) { $('strong', el.best).textContent = RC.PROFILES[best.color].label; $('span', el.best).textContent = '(' + RC.PROFILES[best.color].contribution + ').'; }
      renderInsights();
      if (changed) {
        var diff = score - prevScore;
        el.live.textContent = t + ' people. Balance score ' + score + ' out of 100' + (diff ? ', ' + (diff > 0 ? 'up ' : 'down ') + Math.abs(diff) : '') + '. ' + hf + ' high-friction ' + (hf === 1 ? 'pair' : 'pairs') + '.';
      }
      prevScore = score; prevFriction = hf;
    }
    function change(c, delta) {
      var next = clamp(counts[c] + delta, 0, MAX);
      if (next === counts[c]) return;
      counts[c] = next;
      if (delta > 0) addNode(c, REDUCE); else removeNode(c);
      update(c, delta);
      run();
    }
    $$('.stepper', box).forEach(function (row) {
      var c = row.getAttribute('data-color');
      $$('[data-delta]', row).forEach(function (b) { b.addEventListener('click', function () { change(c, +b.getAttribute('data-delta')); }); });
    });
    $$('[data-add]', box).forEach(function (b) { b.addEventListener('click', function () { change(b.getAttribute('data-add'), 1); }); });
    update(null);
    run();
    box._counts = counts; box._change = change;
  }

  /* ------------------------------------------------------------------------
     Features: an index that drives one product stage (desktop), a swipeable
     row of cards (tablet and phone)
     ------------------------------------------------------------------------ */
  function Features() {
    var wrap = $('[data-features]'); if (!wrap) return;
    var items = $$('[data-feature]', wrap), list = $('.features__list', wrap);
    var mq = window.matchMedia('(min-width: 1081px)');
    var current = 0, autoTimer = 0, userTook = false, inViewNow = false, mode = '';
    var AUTO = 7000;

    function typeIn(item) {
      var t = $('[data-type]', item); if (!t || REDUCE) return;
      var full = t.getAttribute('data-type'), i = 0;
      clearInterval(t._iv); t.textContent = ''; t.classList.add('is-typing');
      t._iv = setInterval(function () { i++; t.textContent = full.slice(0, i); if (i >= full.length) { clearInterval(t._iv); setTimeout(function () { t.classList.remove('is-typing'); }, 900); } }, 34);
    }
    function activate(i, fromUser) {
      if (fromUser) { userTook = true; stopAuto(); }
      current = i;
      items.forEach(function (it, k) {
        var on = k === i;
        it.classList.toggle('is-active', on);
        $('[data-feature-btn]', it).setAttribute('aria-expanded', String(on));
      });
      typeIn(items[i]);
      if (!userTook) scheduleAuto();
    }
    function stopAuto() { clearTimeout(autoTimer); wrap.classList.remove('is-auto'); }
    function scheduleAuto() {
      clearTimeout(autoTimer);
      if (REDUCE || userTook || !inViewNow || mode !== 'tabs') { wrap.classList.remove('is-auto'); return; }
      wrap.style.setProperty('--auto', AUTO + 'ms');
      wrap.classList.remove('is-auto'); void wrap.offsetWidth; wrap.classList.add('is-auto');
      autoTimer = setTimeout(function () { activate((current + 1) % items.length, false); }, AUTO);
    }
    items.forEach(function (it, i) {
      var b = $('[data-feature-btn]', it);
      b.addEventListener('click', function () { if (mode === 'tabs') activate(i, true); });
      b.addEventListener('keydown', function (e) {
        if (mode !== 'tabs') return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var n = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          $('[data-feature-btn]', items[n]).focus(); activate(n, true);
        }
      });
      var hoverT;
      b.addEventListener('pointerenter', function (e) { if (mode !== 'tabs' || e.pointerType === 'touch') return; hoverT = setTimeout(function () { activate(i, true); }, 140); });
      b.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
    });
    wrap.addEventListener('focusin', function () { if (mode === 'tabs') { userTook = true; stopAuto(); } });

    // carousel mode: cards animate as they scroll into view, dots track position
    var dots = document.createElement('div'); dots.className = 'features__dots'; dots.setAttribute('aria-hidden', 'true');
    items.forEach(function () { dots.appendChild(document.createElement('span')); });
    wrap.appendChild(dots);
    var cardIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      if (mode !== 'carousel') return;
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-active'); if (!e.target._typed) { e.target._typed = true; typeIn(e.target); } } });
    }, { root: list, threshold: 0.6 }) : null;
    function syncDots() {
      if (mode !== 'carousel') return;
      var w = items[0].getBoundingClientRect().width + 12;
      var i = clamp(Math.round(list.scrollLeft / w), 0, items.length - 1);
      $$('span', dots).forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    }
    list.addEventListener('scroll', function () { requestAnimationFrame(syncDots); }, { passive: true });

    function setMode() {
      var next = mq.matches ? 'tabs' : 'carousel';
      if (next === mode) return;
      mode = next;
      items.forEach(function (it) {
        var b = $('[data-feature-btn]', it);
        if (mode === 'carousel') { b.setAttribute('tabindex', '-1'); b.removeAttribute('aria-expanded'); it.classList.remove('is-active'); if (cardIO) cardIO.observe(it); else it.classList.add('is-active'); }
        else { b.removeAttribute('tabindex'); if (cardIO) cardIO.unobserve(it); }
      });
      if (mode === 'tabs') activate(current, false); else { stopAuto(); syncDots(); }
    }
    mq.addEventListener('change', setMode);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inViewNow = es[0].isIntersecting; if (inViewNow) scheduleAuto(); else stopAuto(); }, { threshold: 0.35 }).observe(wrap);
    }
    setMode();
  }

  /* ------------------------------------------------------------------------
     Stages: Tuckman's five stages rearrange the four discs
     ------------------------------------------------------------------------ */
  function Stages() {
    var ol = $('[data-stages]'); if (!ol) return;
    $$('.stage', ol).forEach(function (s, i) { $$('circle', s).forEach(function (c) { c.style.setProperty('--i', i); }); });
    if (REDUCE) { ol.classList.add('is-in'); return; }
    inView(ol, function () { ol.classList.add('is-in'); }, { rootMargin: '0px 0px -20% 0px' });
  }

  /* ------------------------------------------------------------------------
     FAQ: native <details>, with a smooth height animation layered on top
     ------------------------------------------------------------------------ */
  function Faq() {
    $$('[data-faq] details').forEach(function (d) {
      var sum = $('summary', d), body = $('.qa__a', d);
      sum.addEventListener('click', function (e) {
        if (REDUCE || !body.animate) return;
        e.preventDefault();
        if (d._anim) d._anim.cancel();
        if (!d.open) {
          d.open = true;
          var h = body.scrollHeight;
          d._anim = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
        } else {
          var h2 = body.scrollHeight;
          d._anim = body.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.65,0,.35,1)' });
          d._anim.onfinish = function () { d.open = false; };
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Finale: the same four discs on ink, mixing to light (screen blend)
     ------------------------------------------------------------------------ */
  function Finale() {
    var panel = $('[data-finale]'); if (!panel || REDUCE) return;
    var cs = $$('[data-fd]', panel).map(function (c, i) {
      return { el: c, a: i * Math.PI / 2 + Math.PI * 1.25, R: 72 };
    });
    var t0 = performance.now(), px = 0, py = 0, tx = 0, ty = 0;
    panel.addEventListener('pointermove', function (e) {
      var r = panel.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 40; ty = ((e.clientY - r.top) / r.height - .5) * 40;
    });
    panel.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
    visibleLoop(panel, function (now) {
      var t = (now - t0) / 1000;
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      cs.forEach(function (c, i) {
        var ang = c.a + t * 0.12;
        var rad = c.R + Math.sin(t * 0.35 + i * 1.7) * 34;
        c.el.setAttribute('cx', (300 + Math.cos(ang) * rad + px * (i % 2 ? 1 : -.6)).toFixed(1));
        c.el.setAttribute('cy', (300 + Math.sin(ang) * rad + py * (i < 2 ? 1 : -.6)).toFixed(1));
      });
    });
  }

  /* ------------------------------------------------------------------------
     Horizon: footer discs rise into view
     ------------------------------------------------------------------------ */
  function Horizon() {
    var h = $('.footer__horizon'); if (!h) return;
    if (REDUCE) { h.classList.add('is-in'); return; }
    inView(h, function () { h.classList.add('is-in'); }, { threshold: 0.01 });
  }

  /* ------------------------------------------------------------------------
     boot
     ------------------------------------------------------------------------ */
  [Header, Menu, SplitText, Reveal, Counters, Hero, Story, Profiles, FrictionEngine, TeamBuilder, Features, Stages, Faq, Finale, Horizon].forEach(function (m) {
    try { m(); } catch (err) { if (window.console) console.warn('[blend] ' + (m.name || 'module') + ' failed:', err); root.classList.add('reveal-all'); }
  });
  function loaded() { requestAnimationFrame(function () { root.classList.add('is-loaded'); }); }
  if (document.fonts && document.fonts.ready) {
    var done = false, go = function () { if (!done) { done = true; loaded(); } };
    document.fonts.ready.then(go); setTimeout(go, 900);
  } else loaded();
  reduceMQ.addEventListener && reduceMQ.addEventListener('change', function () { location.reload(); });
  window.__blendReady = true;
})();
