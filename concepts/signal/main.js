/* ==========================================================================
   RoleColorFinder · "Signal" · main.js
   Page-agnostic modules. Each initialiser looks for its own hooks
   (data-* attributes) and does nothing when they are absent.

   Engine        product data + formulas (same engine as the product)
   Nav           scroll state, hide-on-scroll, progress, mobile menu
   Reveal        IntersectionObserver entrances
   Hero          headline entrance, counters, NetworkScan (canvas)
   Friction      pick-two pairing lookup
   Builder       team builder + TeamGraph (canvas)
   Platform      who-to-hire typer, AI regenerate, meeting wave, map scan
   Profiles      signal traces
   Accordion     animated <details>
   ========================================================================== */
(function () {
  'use strict';

  window.__signalReady = true;
  var root = document.documentElement;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var REDUCED = mqReduce.matches;
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', function (e) { REDUCED = e.matches; });

  /* ---------- tiny utils ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = {
    out3: function (t) { return 1 - Math.pow(1 - t, 3); },
    outExpo: function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    inOut: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  };
  function tween(from, to, dur, fn, easing) {
    var start = performance.now(), raf = 0, e = easing || ease.out3;
    if (REDUCED || dur <= 0) { fn(to, 1); return function () {}; }
    (function frame(now) {
      var p = clamp((now - start) / dur, 0, 1);
      fn(from + (to - from) * e(p), p);
      if (p < 1) raf = requestAnimationFrame(frame);
    })(start);
    return function () { cancelAnimationFrame(raf); };
  }
  function watchVisible(el, cb, margin) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { cb(en.isIntersecting); });
    }, { rootMargin: margin || '0px' }).observe(el);
  }

  /* ======================================================================
     ENGINE: data and formulas mirror the product's team-composition engine
     ====================================================================== */
  var Engine = (function () {
    var PROFILES = {
      Yellow: { label: 'Executor', letter: 'E', hex: '#FFC940', focus: 'clear priorities, ownership, and delivery', contribution: 'follow-through, sequencing, and accountability', blindSpot: 'speed can outrun context', preferredCadence: 'clear handoffs and rapid execution loops' },
      Red: { label: 'Motivator', letter: 'M', hex: '#FF5A4A', focus: 'people momentum, alignment, and visible energy', contribution: 'social energy, urgency, and buy-in', blindSpot: 'optimism can outrun structure', preferredCadence: 'live discussion and fast relational feedback' },
      Green: { label: 'Architect', letter: 'A', hex: '#37D67A', focus: 'logic, quality, and durable systems', contribution: 'rigor, precision, and thoughtful tradeoffs', blindSpot: 'analysis can delay commitment', preferredCadence: 'time to think, validate, and refine' },
      Blue: { label: 'Visionary', letter: 'V', hex: '#4D8DFF', focus: 'possibility, pattern recognition, and innovation', contribution: 'new angles, reframing, and future-state thinking', blindSpot: 'ideas can drift without a landing zone', preferredCadence: 'wide exploration before narrowing' }
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
    var pairKey = function (a, b) { return [a, b].sort().join('-'); };
    var pairRisk = function (a, b) { var p = PAIRS[pairKey(a, b)]; return p ? p.risk : 'low'; };

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

    function highFrictionPairs(counts) {
      var people = [];
      ORDER.forEach(function (c) { for (var i = 0; i < (counts[c] || 0); i++) people.push(c); });
      var n = 0;
      for (var i = 0; i < people.length; i++) for (var j = i + 1; j < people.length; j++) if (pairRisk(people[i], people[j]) === 'high') n++;
      return n;
    }
    // which high-risk pairings make up that number, most frequent first
    function highPairBreakdown(counts) {
      var out = [];
      Object.keys(PAIRS).forEach(function (k) {
        if (PAIRS[k].risk !== 'high') return;
        var cs = k.split('-'); var n = (counts[cs[0]] || 0) * (counts[cs[1]] || 0);
        if (n) out.push({ key: k, n: n, pair: PAIRS[k] });
      });
      return out.sort(function (a, b) { return b.n - a.n; });
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
    function dominant(counts) { return ORDER.filter(function (c) { return pct(counts, c) > 50; })[0]; }

    function summaryLine(counts) {
      var t = total(counts);
      if (t === 0) return 'No one on this team has been assessed yet.';
      if (t < 3) return 'Too few people assessed to read a team shape.';
      var dom = dominant(counts);
      if (dom) return pct(counts, dom) + '% ' + PROFILES[dom].label + ': ' + DOMINANT[dom].title.toLowerCase() + '. ' + DOMINANT[dom].detail;
      if (balanceScore(counts) >= 75) return 'Well balanced across all four styles. This team can cover framing, structure, delivery and buy-in without borrowing capability.';
      var top = ORDER.slice().sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0); })[0];
      return 'Tilted toward ' + PROFILES[top].label + ' (' + pct(counts, top) + '%), with the other styles represented but thin.';
    }

    // "What this costs you": dominant (t>=3; high when >=70%), each missing color (t>=4), high-friction pairs (high when >=3)
    function insights(counts) {
      var t = total(counts), out = [];
      if (t >= 3) {
        var dom = dominant(counts);
        if (dom) out.push({ id: 'dom-' + dom, level: pct(counts, dom) >= 70 ? 'high' : 'medium', title: DOMINANT[dom].title, detail: DOMINANT[dom].detail, mitigation: DOMINANT[dom].mitigation });
      }
      if (t >= 4) ORDER.forEach(function (c) {
        if (!counts[c]) out.push({ id: 'miss-' + c, level: 'medium', title: MISSING[c].title, detail: MISSING[c].detail, mitigation: MISSING[c].mitigation });
      });
      var hp = highFrictionPairs(counts);
      if (hp > 0) {
        var br = highPairBreakdown(counts);
        out.push({
          id: 'pairs', level: hp >= 3 ? 'high' : 'medium',
          title: hp + ' high-friction pair' + (hp === 1 ? '' : 's'),
          detail: br.map(function (b) { return b.pair.name + ' × ' + b.n; }).join(' · ') + '. ' + br[0].pair.summary,
          mitigation: br[0].pair.actions[0]
        });
      }
      return out;
    }

    // "One hire from now": delta per color; best = largest delta, ties go to the thinner color, then ORDER
    function oneHire(counts) {
      var base = balanceScore(counts);
      var rows = ORDER.map(function (c) {
        var next = Object.assign({}, counts); next[c] = (next[c] || 0) + 1;
        var s = balanceScore(next);
        return { color: c, score: s, delta: s - base };
      });
      var best = rows.slice().sort(function (a, b) {
        return (b.delta - a.delta) || ((counts[a.color] || 0) - (counts[b.color] || 0)) || (ORDER.indexOf(a.color) - ORDER.indexOf(b.color));
      })[0];
      return { base: base, rows: rows, best: best.color };
    }

    return { PROFILES: PROFILES, ORDER: ORDER, PAIRS: PAIRS, pairKey: pairKey, pairRisk: pairRisk, mirrorPair: mirrorPair, getPair: getPair,
      total: total, balanceScore: balanceScore, highFrictionPairs: highFrictionPairs, highPairBreakdown: highPairBreakdown,
      DOMINANT: DOMINANT, MISSING: MISSING, summaryLine: summaryLine, insights: insights, oneHire: oneHire };
  })();
  window.RoleColorEngine = Engine;

  var RISK_LABEL = { high: 'High friction', medium: 'Watch closely', low: 'Low friction' };
  var RISK_HEX = { high: '#FF4D3D', medium: '#FFA62B', low: '#3A3F48' };

  /* ======================================================================
     NAV
     ====================================================================== */
  function initNav() {
    var nav = $('[data-nav]'); if (!nav) return;
    var toggle = $('[data-menu-toggle]', nav), menu = $('[data-menu]', nav);
    var prog = document.createElement('span');
    prog.className = 'nav__progress'; prog.setAttribute('aria-hidden', 'true'); nav.appendChild(prog);

    var lastY = window.scrollY, queued = false;
    function onScroll() {
      if (queued) return; queued = true;
      requestAnimationFrame(function () {
        queued = false;
        var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
        nav.classList.toggle('is-scrolled', y > 8);
        if (!root.classList.contains('menu-open')) {
          var down = y > lastY + 2, up = y < lastY - 2;
          if (down && y > 520 && !nav.contains(document.activeElement)) nav.classList.add('is-hidden');
          else if (up || y < 520) nav.classList.remove('is-hidden');
        }
        lastY = y;
        prog.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });

    if (!toggle || !menu) return;
    $$('.menu__links a', menu).forEach(function (a, i) { a.style.setProperty('--mi', i); });
    menu.inert = true;
    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      menu.inert = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        nav.classList.remove('is-hidden');
        setTimeout(function () { var a = $('a', menu); if (a) a.focus({ preventScroll: true }); }, 280);
      }
    }
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setOpen(false); toggle.focus(); return; }
      if (e.key === 'Tab') { // keep focus inside the open menu (toggle + menu items)
        var f = [toggle].concat($$('a, button', menu));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    if (window.matchMedia) window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) { if (e.matches) setOpen(false); });
  }

  /* ======================================================================
     REVEAL: batch entrances with a short stagger, then hand the element
     back to its own component transitions.
     ====================================================================== */
  function initReveal() {
    var els = $$('[data-reveal], [data-stages], [data-draw]');
    function finish(el) {
      setTimeout(function () { el.removeAttribute('data-reveal'); el.style.removeProperty('--rd'); }, 1700);
    }
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); finish(el); });
      return;
    }
    var batch = [], raf = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { batch.push(en.target); io.unobserve(en.target); } });
      if (!raf && batch.length) raf = requestAnimationFrame(function () {
        batch.sort(function (a, b) {
          var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return (ra.top - rb.top) || (ra.left - rb.left);
        });
        batch.forEach(function (el, i) {
          el.style.setProperty('--rd', Math.min(i, 5) * 80 + 'ms');
          el.classList.add('is-in');
          if (el.hasAttribute('data-reveal')) finish(el);
        });
        batch = []; raf = 0;
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ======================================================================
     HERO
     ====================================================================== */
  function countTo(el, to, dur, pad) {
    var fmt = function (v) { var s = String(Math.round(v)); return pad ? s.padStart(pad, '0') : s; };
    return tween(0, to, dur, function (v) { el.textContent = fmt(v); }, ease.outExpo);
  }

  function initHero() {
    var hero = $('.hero'); if (!hero) return;
    var started = false;
    function go() {
      if (started) return; started = true;
      hero.classList.add('is-loaded');
      $$('.specs [data-count]', hero).forEach(function (el, i) {
        setTimeout(function () { countTo(el, +el.dataset.count, 1300, +(el.dataset.pad || 0)); }, 750 + i * 80);
      });
    }
    var fig = $('[data-scan]', hero);
    if (fig) {
      try { new NetworkScan(fig); } catch (err) { console.error(err); }
    }
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { requestAnimationFrame(go); });
    setTimeout(go, 1400);
  }

  /* ---------- NetworkScan: a live force layout of a sample 14-person team ---------- */
  // Composition 5 Executors, 3 Motivators, 4 Architects, 2 Visionaries. Edges are the
  // pairs who actually work together (not everyone against everyone).
  var SAMPLE = {
    nodes: ['Yellow', 'Blue', 'Red', 'Green', 'Yellow', 'Yellow', 'Green', 'Green', 'Red', 'Red', 'Yellow', 'Blue', 'Yellow', 'Green'],
    edges: [[0, 1], [1, 2], [2, 3], [8, 11], [10, 11],
      [0, 2], [0, 3], [1, 3], [4, 6], [5, 7], [9, 10], [12, 13], [8, 10],
      [4, 5], [6, 7], [8, 9], [0, 10], [5, 12], [7, 13], [3, 6], [0, 4], [1, 11]],
    // flagged pairs (indexes into edges), shown three at a time (one on narrow screens)
    flags: [0, 3, 2, 4, 1, 11]
  };

  function NetworkScan(fig) {
    var self = this;
    this.fig = fig;
    this.stage = $('[data-scan-stage]', fig);
    this.canvas = $('canvas', this.stage);
    this.ctx = this.canvas.getContext('2d');
    this.status = $('[data-scan-status]', fig);
    this.calloutLayer = $('[data-scan-callouts]', fig);
    var dds = $$('.readout dd', fig);
    this.read = { people: dds[0], mapped: dds[1], high: dds[2], medium: dds[3], balance: dds[4] && $('span', dds[4]) };
    this.stage._scan = this;

    var rnd = mulberry(7);
    this.nodes = SAMPLE.nodes.map(function (c, i) {
      return { i: i, color: c, hex: Engine.PROFILES[c].hex, letter: Engine.PROFILES[c].letter, x: 0, y: 0, vx: 0, vy: 0, a: 0, born: 80 + i * 45, ph: rnd() * 6.283, fr: .6 + rnd() * .6, deg: 0, highDeg: 0 };
    });
    this.edges = SAMPLE.edges.map(function (e, k) {
      var A = self.nodes[e[0]], B = self.nodes[e[1]];
      var risk = Engine.pairRisk(A.color, B.color);
      A.deg++; B.deg++; if (risk === 'high') { A.highDeg++; B.highDeg++; }
      return { a: e[0], b: e[1], risk: risk, name: Engine.getPair(A.color, B.color).name, p: 0, born: 520 + k * 26, cls: false, flash: 0, off: rnd() };
    });
    this.counts = { Yellow: 0, Red: 0, Green: 0, Blue: 0 };
    this.nodes.forEach(function (n) { self.counts[n.color]++; });
    this.t = 0; this.last = 0; this.visible = true; this.running = false;
    this.scanX = null; this.cycle = -1; this.phaseStart = 0; this.phase = 'intro';
    this.pointer = null; this.hover = null;
    this.callouts = [];
    this.flagSet = null;

    this.tip = document.createElement('div'); this.tip.className = 'scan__tip'; this.tip.setAttribute('aria-hidden', 'true');
    this.stage.appendChild(this.tip);

    this.resize(true);
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(false); }).observe(this.stage);
    else window.addEventListener('resize', function () { self.resize(false); });

    this.stage.addEventListener('pointermove', function (e) {
      var r = self.stage.getBoundingClientRect();
      self.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (REDUCED) { self.pickHover(); self.draw(); }
    });
    this.stage.addEventListener('pointerleave', function () { self.pointer = null; self.hover = null; self.tip.classList.remove('is-on'); if (REDUCED) self.draw(); });

    fig.classList.add('is-live');

    if (REDUCED) { this.settle(); return; }

    this.setReadout(0, 0, 0, 0, 0);
    watchVisible(fig, function (v) { self.visible = v; self.kick(); });
    document.addEventListener('visibilitychange', function () { self.kick(); });
    this.kick();
  }

  NetworkScan.prototype.resize = function (first) {
    var r = this.stage.getBoundingClientRect(), small = r.width < 80 || r.height < 80;
    if (small && this.W) return; // ignore degenerate sizes once we have a real one
    var W = small ? 640 : r.width, H = small ? 460 : r.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var self = this;
    if (first || !this.W) {
      var cx = W * .5, cy = H * .47;
      this.nodes.forEach(function (n, i) {
        var ang = i / self.nodes.length * Math.PI * 2;
        n.x = cx + Math.cos(ang) * 30; n.y = cy + Math.sin(ang) * 30;
      });
    } else {
      var sx = W / this.W, sy = H / this.H;
      this.nodes.forEach(function (n) { n.x *= sx; n.y *= sy; });
    }
    this.W = W; this.H = H;
    this.L = clamp(Math.min(W, H * 1.3) * .2, 64, 118);
    this.R = W < 520 ? 8 : 10;
    if (REDUCED || !this.running) this.draw();
  };

  NetworkScan.prototype.kick = function () {
    var self = this;
    var should = this.visible && !document.hidden && !REDUCED;
    if (should && !this.running) {
      this.running = true; this.last = performance.now();
      requestAnimationFrame(function loop(now) {
        if (!self.running) return;
        var dt = Math.min(50, now - self.last); self.last = now;
        self.update(dt);
        self.draw();
        if (self.visible && !document.hidden && !REDUCED) requestAnimationFrame(loop);
        else self.running = false;
      });
    }
  };

  NetworkScan.prototype.physics = function (k, wander) {
    var N = this.nodes, E = this.edges, L = this.L, W = this.W, H = this.H;
    var cx = W * .52, cy = H * .47, rep = L * L * 1.25, t = this.t, i, j;
    for (i = 0; i < N.length; i++) { N[i].fx = 0; N[i].fy = 0; }
    for (i = 0; i < N.length; i++) for (j = i + 1; j < N.length; j++) {
      var A = N[i], B = N[j], dx = A.x - B.x, dy = A.y - B.y, d2 = Math.max(dx * dx + dy * dy, 80), d = Math.sqrt(d2);
      var f = rep / d2; var fx = dx / d * f, fy = dy / d * f;
      A.fx += fx; A.fy += fy; B.fx -= fx; B.fy -= fy;
    }
    for (i = 0; i < E.length; i++) {
      var e = E[i], P = N[e.a], Q = N[e.b], ex = Q.x - P.x, ey = Q.y - P.y, ed = Math.sqrt(ex * ex + ey * ey) || 1;
      var s = (ed - L) * .018; var sx = ex / ed * s, sy = ey / ed * s;
      P.fx += sx; P.fy += sy; Q.fx -= sx; Q.fy -= sy;
    }
    var pr = this.pointer, m = 34;
    for (i = 0; i < N.length; i++) {
      var n = N[i];
      n.fx += (cx - n.x) * .0045; n.fy += (cy - n.y) * .006;
      if (wander) {
        n.fx += Math.cos(t * .00042 * n.fr + n.ph) * .05;
        n.fy += Math.sin(t * .00051 * n.fr + n.ph * 1.3) * .05;
      }
      if (pr) {
        var px = n.x - pr.x, py = n.y - pr.y, pd = Math.sqrt(px * px + py * py);
        if (pd < 110 && pd > .1) { var pf = (1 - pd / 110) * 1.1; n.fx += px / pd * pf; n.fy += py / pd * pf; }
      }
      if (n.x < m) n.fx += (m - n.x) * .06; if (n.x > W - m) n.fx -= (n.x - (W - m)) * .06;
      if (n.y < m) n.fy += (m - n.y) * .06; if (n.y > H - m - 30) n.fy -= (n.y - (H - m - 30)) * .06;
      n.vx = (n.vx + n.fx * k) * .86; n.vy = (n.vy + n.fy * k) * .86;
      n.x += n.vx * k; n.y += n.vy * k;
    }
  };

  NetworkScan.prototype.settle = function () {
    for (var s = 0; s < 700; s++) { this.t += 16; this.physics(1, false); }
    this.nodes.forEach(function (n) { n.a = 1; });
    this.edges.forEach(function (e) { e.p = 1; e.cls = true; });
    this.showFlags(0, true);
    this.placeCallouts(true);
    this.draw();
  };

  NetworkScan.prototype.setReadout = function (people, mapped, high, medium, balance) {
    var r = this.read;
    if (r.people) r.people.textContent = people;
    if (r.mapped) r.mapped.textContent = mapped;
    if (r.high) r.high.textContent = high;
    if (r.medium) r.medium.textContent = medium;
    if (r.balance && balance != null) r.balance.textContent = balance;
  };

  NetworkScan.prototype.update = function (dt) {
    var self = this, k = dt / 16.67;
    this.t += dt;
    var t = this.t;
    this.physics(k, true);
    this.nodes.forEach(function (n) { if (t > n.born) n.a = Math.min(1, n.a + dt / 450); });
    this.edges.forEach(function (e) { if (t > e.born) e.p = Math.min(1, e.p + dt / 520); if (e.flash > 0) e.flash = Math.max(0, e.flash - dt / 500); });

    // timeline: intro -> sweep -> hold (callouts) -> gap -> sweep ...
    var SWEEP = 2300, HOLD = 5600, GAP = 600;
    if (this.phase === 'intro' && t > 1500) { this.phase = 'sweep'; this.phaseStart = t; this.cycle++; }
    if (this.phase === 'sweep') {
      var p = clamp((t - this.phaseStart) / SWEEP, 0, 1);
      this.scanX = lerp(-60, this.W + 60, ease.inOut(p));
      this.edges.forEach(function (e) {
        var A = self.nodes[e.a], B = self.nodes[e.b], mx = (A.x + B.x) / 2;
        if (self.scanX >= mx && e.swept !== self.cycle) { e.swept = self.cycle; e.flash = 1; e.cls = true; }
      });
      var done = this.edges.filter(function (e) { return e.cls; });
      if (this.cycle === 0) {
        var hi = done.filter(function (e) { return e.risk === 'high'; }).length, md = done.filter(function (e) { return e.risk === 'medium'; }).length;
        var ppl = this.nodes.filter(function (n) { return n.a > .5; }).length;
        this.setReadout(ppl, done.length, hi, md, null);
        this.setStatus('Scanning pairs ' + String(done.length).padStart(2, '0') + '/' + this.edges.length);
      } else {
        this.setStatus('Re-ranking ' + this.edges.length + ' pairs');
      }
      if (p >= 1) {
        this.phase = 'hold'; this.phaseStart = t; this.scanX = null;
        this.setStatus('5 high-friction pairs flagged');
        if (this.cycle === 0) {
          this.setReadout(14, 22, 5, 8, null);
          countTo(this.read.balance, Engine.balanceScore(this.counts), 1100);
        }
        this.showFlags(this.cycle, false);
      }
    } else if (this.phase === 'intro') {
      var ppl2 = this.nodes.filter(function (n) { return n.a > .5; }).length;
      if (this.read.people) this.read.people.textContent = ppl2;
      this.setStatus('Mapping working pairs');
    } else if (this.phase === 'hold' && t - this.phaseStart > HOLD) {
      this.phase = 'gap'; this.phaseStart = t; this.hideFlags();
    } else if (this.phase === 'gap' && t - this.phaseStart > GAP) {
      this.phase = 'sweep'; this.phaseStart = t; this.cycle++;
    }
    this.pickHover();
    this.placeCallouts(false);
  };

  NetworkScan.prototype.setStatus = function (s) {
    if (this._status !== s && this.status) { this.status.textContent = s; this._status = s; }
  };

  NetworkScan.prototype.pickHover = function () {
    var pr = this.pointer, best = null, bd = 22;
    if (pr) this.nodes.forEach(function (n) { var d = Math.hypot(n.x - pr.x, n.y - pr.y); if (d < bd) { bd = d; best = n; } });
    this.hover = best;
    if (best) {
      var P = Engine.PROFILES[best.color];
      this.tip.textContent = P.label + ' · ' + best.deg + ' pairs · ' + best.highDeg + ' high';
      var tw = this.tip.offsetWidth;
      var x = clamp(best.x + 16, 8, this.W - tw - 8), y = clamp(best.y - 38, 8, this.H - 40);
      this.tip.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      this.tip.classList.add('is-on');
    } else this.tip.classList.remove('is-on');
  };

  NetworkScan.prototype.showFlags = function (cycle, instant) {
    var self = this, F = SAMPLE.flags, per = this.W < 560 ? 1 : 3;
    var start = (cycle * per) % F.length, pick = F.slice(start, start + per);
    this.hideFlags(true);
    this.flagSet = pick.map(function (ei, k) {
      var e = self.edges[ei], A = self.nodes[e.a], B = self.nodes[e.b];
      var el = document.createElement('div');
      el.className = 'callout' + (e.risk === 'medium' ? ' callout--medium' : '');
      el.innerHTML = '<b>' + e.name + '</b><span>' + Engine.PROFILES[A.color].label + ' × ' + Engine.PROFILES[B.color].label + ' · ' + (e.risk === 'high' ? 'high friction' : 'watch closely') + '</span>';
      self.calloutLayer.appendChild(el);
      var c = { el: el, edge: e, w: el.offsetWidth, h: el.offsetHeight, x: null, y: null, vis: instant ? 1 : 0, on: false };
      if (instant) { el.classList.add('is-on'); c.on = true; }
      else setTimeout(function () { el.classList.add('is-on'); c.on = true; }, 120 + k * 220);
      return c;
    });
  };
  NetworkScan.prototype.hideFlags = function (now) {
    if (!this.flagSet) return;
    this.flagSet.forEach(function (c) {
      c.el.classList.remove('is-on'); c.on = false;
      var el = c.el; setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, now ? 0 : 500);
    });
    this.flagSet = null;
  };

  // Place each callout where it covers the fewest nodes and other callouts, close to its
  // edge, with a little hysteresis so labels do not hop between spots.
  var CANDIDATES = (function () {
    var out = [];
    [42, 78].forEach(function (d) { for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2; out.push({ c: Math.cos(a), s: Math.sin(a), d: d }); } });
    return out;
  })();
  NetworkScan.prototype.placeCallouts = function (instant) {
    if (!this.flagSet) return;
    var self = this, W = this.W, H = this.H, N = this.nodes, placed = [], pad = 12, bottom = H - 40;
    this.flagSet.forEach(function (c) {
      var A = N[c.edge.a], B = N[c.edge.b];
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, best = null, bestCost = Infinity;
      CANDIDATES.forEach(function (k) {
        var ax = mx + k.c * k.d, ay = my + k.s * k.d;
        var x = k.c > .35 ? ax : k.c < -.35 ? ax - c.w : ax - c.w / 2;
        var y = k.s > .35 ? ay : k.s < -.35 ? ay - c.h : ay - c.h / 2;
        var cost = k.d * .6;
        // out of bounds
        var ox = Math.max(0, pad - x) + Math.max(0, x + c.w - (W - pad)), oy = Math.max(0, pad - y) + Math.max(0, y + c.h - bottom);
        cost += (ox + oy) * 40;
        // nodes underneath
        for (var i = 0; i < N.length; i++) {
          var n = N[i], nx = clamp(n.x, x - 10, x + c.w + 10), ny = clamp(n.y, y - 10, y + c.h + 10);
          if (nx === n.x && ny === n.y) cost += 900;
        }
        // other callouts
        placed.forEach(function (o) {
          var ix = Math.min(x + c.w, o.x + o.w) - Math.max(x, o.x) + 8, iy = Math.min(y + c.h, o.y + o.h) - Math.max(y, o.y) + 8;
          if (ix > 0 && iy > 0) cost += 3000 + ix * iy;
        });
        // the pair's own edge running through the box
        var sx = clamp(mx, x, x + c.w), sy = clamp(my, y, y + c.h);
        if (sx === mx && sy === my) cost += 600;
        // hysteresis
        if (c.tx != null) cost += Math.hypot(x - c.tx, y - c.ty) * .9;
        if (cost < bestCost) { bestCost = cost; best = { x: x, y: y }; }
      });
      best.x = clamp(best.x, pad, W - c.w - pad); best.y = clamp(best.y, pad, bottom - c.h);
      c.tx = best.x; c.ty = best.y;
      placed.push({ x: best.x, y: best.y, w: c.w, h: c.h });
      if (c.x == null || instant) { c.x = best.x; c.y = best.y; }
      c.x = lerp(c.x, best.x, .1); c.y = lerp(c.y, best.y, .1);
      c.mx = mx; c.my = my;
      c.el.style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,0)';
    });
  };

  NetworkScan.prototype.draw = function () {
    var ctx = this.ctx, W = this.W, H = this.H, N = this.nodes, E = this.edges, t = this.t, self = this;
    if (W < 80 || H < 80) return;
    ctx.clearRect(0, 0, W, H);
    var hv = this.hover;

    // scan band
    if (this.scanX != null) {
      var sx = this.scanX;
      var g = ctx.createLinearGradient(sx - 140, 0, sx, 0);
      g.addColorStop(0, 'rgba(233,233,236,0)'); g.addColorStop(1, 'rgba(233,233,236,.07)');
      ctx.fillStyle = g; ctx.fillRect(sx - 140, 0, 140, H);
      ctx.fillStyle = 'rgba(233,233,236,.7)'; ctx.fillRect(sx, 0, 1, H);
      ctx.font = '500 10px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(233,233,236,.75)';
      ctx.fillText('SCAN', sx + 6, 22);
    }

    // edges
    ctx.lineCap = 'round';
    E.forEach(function (e) {
      if (e.p <= 0) return;
      var A = N[e.a], B = N[e.b];
      var x2 = A.x + (B.x - A.x) * e.p, y2 = A.y + (B.y - A.y) * e.p;
      var al = Math.min(A.a, B.a);
      if (hv) al *= (e.a === hv.i || e.b === hv.i) ? 1 : .16;
      ctx.globalAlpha = al;
      ctx.setLineDash([]);
      if (!e.cls) { ctx.strokeStyle = '#2C3038'; ctx.lineWidth = 1; }
      else if (e.risk === 'high') {
        ctx.strokeStyle = 'rgba(255,77,61,.13)'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = '#FF4D3D'; ctx.lineWidth = 1.8;
      } else if (e.risk === 'medium') {
        ctx.strokeStyle = 'rgba(255,166,43,.85)'; ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 5]); ctx.lineDashOffset = -t * .012;
      } else { ctx.strokeStyle = '#3A3F48'; ctx.lineWidth = 1; }
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x2, y2); ctx.stroke();
      if (e.flash > 0) {
        ctx.setLineDash([]); ctx.globalAlpha = al * e.flash * .8; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // signal pulse travelling along hot edges
      if (e.cls && e.risk === 'high' && e.p >= 1 && !REDUCED) {
        var u = (t * .00055 + e.off) % 1, v = u < .5 ? u * 2 : 2 - u * 2;
        ctx.globalAlpha = al; ctx.fillStyle = '#FFD9D4';
        ctx.beginPath(); ctx.arc(A.x + (B.x - A.x) * v, A.y + (B.y - A.y) * v, 2.2, 0, 6.283); ctx.fill();
      }
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    // callout leader lines
    if (this.flagSet) this.flagSet.forEach(function (c) {
      c.vis = lerp(c.vis, c.on ? 1 : 0, REDUCED ? 1 : .12);
      if (c.vis < .02 || c.x == null) return;
      var bx = clamp(c.mx, c.x, c.x + c.w), by = clamp(c.my, c.y, c.y + c.h);
      var col = c.edge.risk === 'high' ? '255,77,61' : '255,166,43';
      ctx.strokeStyle = 'rgba(' + col + ',' + (.8 * c.vis) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c.mx, c.my); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = 'rgba(' + col + ',' + c.vis + ')';
      ctx.fillRect(c.mx - 3, c.my - 3, 6, 6);
    });

    // nodes
    var flagged = {};
    if (this.flagSet) this.flagSet.forEach(function (c) { if (c.on) { flagged[c.edge.a] = c.edge.risk; flagged[c.edge.b] = c.edge.risk; } });
    var R = this.R;
    N.forEach(function (n) {
      if (n.a <= 0) return;
      var s = ease.out3(n.a), r = R * (hv === n ? 1.25 : 1) * (.4 + .6 * s);
      ctx.globalAlpha = n.a * (hv && hv !== n && !isNeighbour(self, hv, n) ? .45 : 1);
      if (flagged[n.i]) {
        var pr = r + 5 + (REDUCED ? 0 : Math.sin(t * .004 + n.i) * 1.2);
        ctx.strokeStyle = flagged[n.i] === 'high' ? 'rgba(255,77,61,.7)' : 'rgba(255,166,43,.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, pr, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = '#0D0F12'; ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, 6.283); ctx.fill();
      ctx.fillStyle = n.hex; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
      if (hv === n) { ctx.strokeStyle = '#E9E9EC'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, 6.283); ctx.stroke(); }
      if (r >= 7) {
        ctx.fillStyle = '#0A0B0D'; ctx.font = '700 ' + Math.round(r * .95) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.letter, n.x, n.y + .5);
      }
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  };

  function isNeighbour(scan, a, b) {
    return scan.edges.some(function (e) { return (e.a === a.i && e.b === b.i) || (e.b === a.i && e.a === b.i); });
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ======================================================================
     FRICTION ENGINE: pick any two
     ====================================================================== */
  function decode(el, text) {
    if (el._decode) cancelAnimationFrame(el._decode);
    if (REDUCED) { el.textContent = text; return; }
    var up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', low = 'abcdefghijklmnopqrstuvwxyz', start = performance.now(), dur = 520;
    (function frame(now) {
      var p = clamp((now - start) / dur, 0, 1), n = Math.floor(ease.out3(p) * text.length), out = '';
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (i < n || ch === ' ' || ch === '.') out += ch;
        else out += (ch === ch.toUpperCase() ? up : low)[Math.floor(Math.random() * 26)];
      }
      el.textContent = out;
      if (p < 1) el._decode = requestAnimationFrame(frame); else { el.textContent = text; el._decode = 0; }
    })(start);
  }

  function initFriction() {
    var box = $('[data-fe]'); if (!box) return;
    var P = Engine.PROFILES;
    var out = $('[data-fe-out]', box), svg = $('[data-fe-graph]', box);
    var el = {
      pair: $('[data-fe-pairlabel]', box), code: $('[data-fe-code]', box), name: $('[data-fe-name]', box),
      risk: $('[data-fe-risk]', box), riskLabel: $('[data-fe-risklabel]', box), summary: $('[data-fe-summary]', box),
      why: $('[data-fe-why]', box), live: $('[data-fe-live]', box),
      strengths: $('[data-fe-list="strengths"]', box), watchouts: $('[data-fe-list="watchouts"]', box), actions: $('[data-fe-list="actions"]', box)
    };
    var edges = $$('.fe-edge', svg), nodes = $$('.fe-node', svg);
    var pulse = $('[data-fe-pulse]', svg);
    var state = { a: 'Yellow', b: 'Blue', last: 'b' };

    function current(name) { var r = $('input[name="' + name + '"]:checked', box); return r ? r.value : null; }
    state.a = current('fe-a') || state.a; state.b = current('fe-b') || state.b;

    function fill(list, items) {
      list.innerHTML = '';
      items.forEach(function (txt, i) { var li = document.createElement('li'); li.textContent = txt; li.style.setProperty('--k-i', i + (list === el.strengths ? 0 : list === el.watchouts ? 1 : 2)); list.appendChild(li); });
    }

    function render(animate) {
      var a = state.a, b = state.b, pair = Engine.getPair(a, b);
      var key = a === b ? a + '-' + a : Engine.pairKey(a, b);
      var label = P[a].label + ' × ' + P[b].label;
      el.pair.textContent = label; if (el.code) el.code.textContent = label;
      if (animate) decode(el.name, pair.name); else el.name.textContent = pair.name;
      el.risk.setAttribute('data-risk', pair.risk);
      el.riskLabel.textContent = RISK_LABEL[pair.risk];
      if (pair.summary) { el.summary.textContent = pair.summary; el.why.textContent = pair.why; }
      else { // mirror pairs have no summary: lead with the first sentence of the why
        var cut = pair.why.indexOf('. ');
        el.summary.textContent = pair.why.slice(0, cut + 1); el.why.textContent = pair.why.slice(cut + 2);
      }
      if (animate) out.classList.add('is-swapping');
      fill(el.strengths, pair.strengths); fill(el.watchouts, pair.watchouts); fill(el.actions, pair.actions);
      if (animate) { void out.offsetWidth; requestAnimationFrame(function () { out.classList.remove('is-swapping'); }); }
      edges.forEach(function (e) { e.classList.toggle('is-on', e.getAttribute('data-pair') === key); });
      nodes.forEach(function (n) { var c = n.getAttribute('data-node'); n.classList.toggle('is-on', c === a || c === b); });
      if (el.live && animate) el.live.textContent = label + ': ' + pair.name + ', ' + RISK_LABEL[pair.risk].toLowerCase() + '.';
      box.setAttribute('data-pair', key);
      box.setAttribute('data-risk', pair.risk);
      box.setAttribute('data-name', pair.name);
      activeEdge = edges.filter(function (e) { return e.getAttribute('data-pair') === key; })[0];
    }

    function setSlot(slot, color) {
      state[slot] = color; state.last = slot;
      var r = $('input[name="fe-' + slot + '"][value="' + color + '"]', box); if (r) r.checked = true;
    }
    $$('input[type="radio"]', box).forEach(function (r) {
      r.addEventListener('change', function () {
        var slot = r.name === 'fe-a' ? 'a' : 'b'; state[slot] = r.value; state.last = slot; render(true);
      });
    });
    // shortcuts: click an edge to load that pair, click a node to swap it into the older slot
    edges.forEach(function (e) {
      e.classList.add('is-hit');
      e.addEventListener('click', function () {
        var cs = e.getAttribute('data-pair').split('-'); setSlot('a', cs[0]); setSlot('b', cs[1]); render(true);
      });
    });
    nodes.forEach(function (n) {
      n.addEventListener('click', function () { setSlot(state.last === 'a' ? 'b' : 'a', n.getAttribute('data-node')); render(true); });
    });

    // pulse travelling along the selected edge
    var activeEdge = null, visible = false, raf = 0, t0 = performance.now();
    function tick(now) {
      raf = 0;
      if (!visible || REDUCED || !activeEdge) { pulse.parentNode.classList.remove('is-on'); return; }
      pulse.parentNode.classList.add('is-on');
      var u = ((now - t0) / 1500) % 1, v = u < .5 ? u * 2 : 2 - u * 2; v = ease.inOut(v);
      var x, y;
      if (activeEdge.tagName.toLowerCase() === 'line') {
        var x1 = +activeEdge.getAttribute('x1'), y1 = +activeEdge.getAttribute('y1'), x2 = +activeEdge.getAttribute('x2'), y2 = +activeEdge.getAttribute('y2');
        x = x1 + (x2 - x1) * v; y = y1 + (y2 - y1) * v;
      } else {
        var len = activeEdge.getTotalLength(), pt = activeEdge.getPointAtLength(len * ((now - t0) / 1500 % 1));
        x = pt.x; y = pt.y;
      }
      pulse.setAttribute('cx', x.toFixed(1)); pulse.setAttribute('cy', y.toFixed(1));
      raf = requestAnimationFrame(tick);
    }
    watchVisible(box, function (v) { visible = v; if (v && !raf) raf = requestAnimationFrame(tick); });
    render(false);
  }

  /* ======================================================================
     TEAM BUILDER: hire the gap
     ====================================================================== */
  function TeamGraph(canvas) {
    var self = this;
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.nodes = new Map(); this.running = false;
    this.resize();
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(); self.layout(); self.kick(); }).observe(canvas);
  }
  TeamGraph.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var small = r.width < 80 || r.height < 80;
    if (small && this.W) return;
    this.W = small ? 480 : r.width; this.H = small ? 300 : r.height;
    this.c.width = Math.round(this.W * dpr); this.c.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  TeamGraph.prototype.set = function (counts, added) {
    var self = this, keys = [];
    Engine.ORDER.forEach(function (c) { for (var i = 0; i < (counts[c] || 0); i++) keys.push(c + ':' + i); });
    this.keys = keys;
    this.nodes.forEach(function (n) { n.alive = false; });
    keys.forEach(function (key) {
      var n = self.nodes.get(key);
      if (!n) {
        var c = key.split(':')[0];
        n = { key: key, color: c, hex: Engine.PROFILES[c].hex, letter: Engine.PROFILES[c].letter, x: self.W / 2, y: self.H / 2, a: 0, s: 0, pulse: added === c ? 1 : 0 };
        self.nodes.set(key, n);
      }
      n.alive = true;
    });
    this.layout(true);
    this.kick();
  };
  TeamGraph.prototype.layout = function (fromSet) {
    var self = this, keys = this.keys || [], t = keys.length;
    var cx = this.W / 2, cy = this.H / 2, R = Math.min(this.W, this.H) / 2 - 26;
    this.r = t <= 8 ? 11 : Math.max(5, 11 - (t - 8) * .2);
    keys.forEach(function (key, i) {
      var n = self.nodes.get(key), ang = -Math.PI / 2 + (i / t) * Math.PI * 2;
      n.tx = t === 1 ? cx : cx + Math.cos(ang) * R; n.ty = t === 1 ? cy : cy + Math.sin(ang) * R;
      if (n.a === 0 && n.s === 0) { n.x = n.tx; n.y = n.ty; }
    });
    if (!fromSet) this.nodes.forEach(function (n) { if (!n.alive) return; });
  };
  TeamGraph.prototype.kick = function () {
    var self = this;
    if (REDUCED) { this.step(1); this.draw(); return; }
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(function loop() {
      var moving = self.step(.16);
      self.draw();
      if (moving) requestAnimationFrame(loop); else self.running = false;
    });
  };
  TeamGraph.prototype.step = function (k) {
    var moving = false, self = this;
    this.nodes.forEach(function (n, key) {
      var ta = n.alive ? 1 : 0;
      if (n.tx != null) { n.x = lerp(n.x, n.tx, k); n.y = lerp(n.y, n.ty, k); }
      n.a = lerp(n.a, ta, k * 1.2); n.s = lerp(n.s, ta, k);
      if (n.pulse > 0) n.pulse = Math.max(0, n.pulse - k * .09);
      if (Math.abs(n.x - n.tx) > .3 || Math.abs(n.y - n.ty) > .3 || Math.abs(n.a - ta) > .01 || Math.abs(n.s - ta) > .01 || n.pulse > 0) moving = true;
      else { n.a = ta; n.s = ta; }
      if (!n.alive && n.a < .02) self.nodes.delete(key);
    });
    return moving;
  };
  TeamGraph.prototype.draw = function () {
    var ctx = this.ctx, W = this.W, H = this.H, arr = Array.from(this.nodes.values()), r = this.r || 10;
    if (W < 80 || H < 80) return; // not laid out (hidden or mid-resize)
    ctx.clearRect(0, 0, W, H);
    // guide ring
    ctx.strokeStyle = 'rgba(233,233,236,.06)'; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
    ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.min(W, H) / 2 - 26, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    if (!arr.length) {
      ctx.fillStyle = '#8A8F99'; ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText('NO ONE ON THIS TEAM YET', W / 2, H / 2 + 4); ctx.textAlign = 'start';
      return;
    }
    var i, j, A, B, al;
    for (i = 0; i < arr.length; i++) for (j = i + 1; j < arr.length; j++) {
      A = arr[i]; B = arr[j]; al = Math.min(A.a, B.a); if (al <= .01) continue;
      if (Engine.pairRisk(A.color, B.color) !== 'high') {
        ctx.globalAlpha = al; ctx.strokeStyle = 'rgba(233,233,236,.08)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
    }
    for (i = 0; i < arr.length; i++) for (j = i + 1; j < arr.length; j++) {
      A = arr[i]; B = arr[j]; al = Math.min(A.a, B.a); if (al <= .01) continue;
      if (Engine.pairRisk(A.color, B.color) === 'high') {
        ctx.globalAlpha = al * .75; ctx.strokeStyle = '#FF4D3D'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
    }
    arr.forEach(function (n) {
      var rr = r * ease.out3(clamp(n.s, 0, 1));
      if (rr <= .2) return;
      ctx.globalAlpha = n.a;
      if (n.pulse > 0) {
        ctx.strokeStyle = n.hex; ctx.globalAlpha = n.pulse * .8; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, rr + 4 + (1 - n.pulse) * 16, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = n.a;
      }
      ctx.fillStyle = '#121419'; ctx.beginPath(); ctx.arc(n.x, n.y, rr + 3, 0, 6.283); ctx.fill();
      ctx.fillStyle = n.hex; ctx.beginPath(); ctx.arc(n.x, n.y, rr, 0, 6.283); ctx.fill();
      if (rr >= 7.5) {
        ctx.fillStyle = '#0A0B0D'; ctx.font = '700 ' + Math.round(rr * .95) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.letter, n.x, n.y + .5);
      }
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  };

  function initBuilder() {
    var box = $('[data-tb]'); if (!box) return;
    var P = Engine.PROFILES, ORDER = Engine.ORDER, MAX = 10;
    var DEFAULTS = { Yellow: 4, Red: 2, Green: 1, Blue: 0 };
    var counts = Object.assign({}, DEFAULTS);
    var steppers = {};
    $$('.stepper', box).forEach(function (s) {
      var c = s.getAttribute('data-color');
      steppers[c] = { el: s, val: $('[data-tb-val]', s), minus: $('[data-step="-1"]', s), plus: $('[data-step="1"]', s) };
      counts[c] = parseInt(steppers[c].val.textContent, 10) || 0;
      $$('[data-step]', s).forEach(function (b) {
        b.addEventListener('click', function () {
          var d = +b.getAttribute('data-step'), next = clamp(counts[c] + d, 0, MAX);
          if (next === counts[c]) return;
          counts[c] = next; update(d > 0 ? c : null, c);
          var v = steppers[c].val; v.classList.remove('is-bump'); void v.offsetWidth; v.classList.add('is-bump');
        });
      });
    });
    var el = {
      score: $('[data-tb-score]', box), delta: $('[data-tb-delta]', box), meter: $('[data-tb-meter]', box),
      high: $('[data-tb-high]', box), total: $('[data-tb-total]', box), summary: $('[data-tb-summary]', box),
      best: $('[data-tb-best]', box), insights: $('[data-tb-insights]', box), live: $('[data-tb-live]', box),
      reset: $('[data-tb-reset]', box), mini: $('[data-tb-mini]', box)
    };
    var rows = {};
    $$('[data-tb-deltas] li', box).forEach(function (li) {
      rows[li.getAttribute('data-color')] = { li: li, bar: $('.deltas__bar i', li), val: $('.deltas__val', li) };
    });
    var canvas = $('[data-tb-canvas]', box);
    var graph = canvas ? new TeamGraph(canvas) : null;
    var shown = { score: +el.score.textContent || 0, high: +el.high.textContent || 0 };
    var stopScore = function () {}, stopHigh = function () {}, summaryTimer = 0;

    if (el.reset) el.reset.addEventListener('click', function () { counts = Object.assign({}, DEFAULTS); update(null); });

    function fmtDelta(d) { return d > 0 ? '+' + d : d < 0 ? '−' + Math.abs(d) : '±0'; }

    function renderInsights(list) {
      var ul = el.insights, prev = $$('.insight', ul).map(function (li) { return li.getAttribute('data-id'); });
      ul.innerHTML = '';
      if (!list.length) {
        var e = document.createElement('li'); e.className = 'insights__empty';
        e.textContent = Engine.total(counts) < 3 ? 'Add a few more people to read the cost of this team’s shape.' : 'Nothing flagged for this mix.';
        ul.appendChild(e); return;
      }
      var n = 0;
      list.forEach(function (it) {
        var li = document.createElement('li');
        li.className = 'insight'; li.setAttribute('data-level', it.level); li.setAttribute('data-id', it.id);
        if (prev.indexOf(it.id) === -1) { li.classList.add('is-new'); li.style.setProperty('--n', n++); }
        li.innerHTML = '<p class="insight__level mono">' + (it.level === 'high' ? 'High' : 'Watch') + '</p><h4></h4><p class="insight__detail"></p><p class="insight__fix"><span class="mono">Fix</span><span class="insight__fixtext"></span></p>';
        $('h4', li).textContent = it.title;
        $('.insight__detail', li).textContent = it.detail;
        $('.insight__fixtext', li).textContent = it.mitigation;
        ul.appendChild(li);
      });
    }

    function update(added, changed) {
      var t = Engine.total(counts);
      var score = Engine.balanceScore(counts), high = Engine.highFrictionPairs(counts);
      var prevScore = +el.score.getAttribute('data-value');
      // steppers
      ORDER.forEach(function (c) {
        var s = steppers[c]; if (!s) return;
        s.val.textContent = counts[c];
        s.minus.disabled = counts[c] <= 0; s.plus.disabled = counts[c] >= MAX;
      });
      if (el.total) el.total.textContent = t;
      if (el.mini) el.mini.textContent = score;
      // score ticker + delta flash
      el.score.setAttribute('data-value', score);
      box.setAttribute('data-score', score);
      stopScore();
      var from = shown.score;
      stopScore = tween(from, score, 650, function (v) { shown.score = Math.round(v); el.score.textContent = shown.score; });
      var d = score - prevScore;
      if (d !== 0 && el.delta) {
        el.delta.textContent = fmtDelta(d);
        el.delta.className = 'kpi__delta mono ' + (d > 0 ? 'is-up' : 'is-down');
        void el.delta.offsetWidth; el.delta.classList.add('is-show');
      }
      if (el.meter) el.meter.style.setProperty('--v', (score / 100).toFixed(2));
      // high friction
      el.high.setAttribute('data-value', high);
      stopHigh();
      stopHigh = tween(shown.high, high, 500, function (v) { shown.high = Math.round(v); el.high.textContent = shown.high; });
      el.high.classList.toggle('is-zero', high === 0);
      if (el.live) el.live.textContent = (changed ? counts[changed] + ' ' + P[changed].label + (counts[changed] === 1 ? '' : 's') + '. ' : '') +
        'Balance score ' + score + ' out of 100, ' + high + ' high-friction pair' + (high === 1 ? '' : 's') + '. Best next hire: ' + P[Engine.oneHire(counts).best].label + '.';
      // summary line (quick crossfade)
      var line = Engine.summaryLine(counts);
      if (el.summary.textContent !== line) {
        clearTimeout(summaryTimer);
        if (REDUCED) el.summary.textContent = line;
        else { el.summary.classList.add('is-swap'); summaryTimer = setTimeout(function () { el.summary.textContent = line; el.summary.classList.remove('is-swap'); }, 160); }
      }
      // one hire from now
      var oh = Engine.oneHire(counts);
      oh.rows.forEach(function (r) {
        var row = rows[r.color]; if (!row) return;
        var w = Math.min(Math.abs(r.delta) * 2.5, 50);
        row.bar.style.setProperty('--w', w + '%');
        row.bar.style.setProperty('--l', (r.delta >= 0 ? 50 : 50 - w) + '%');
        row.bar.classList.toggle('is-neg', r.delta < 0);
        row.val.innerHTML = r.score + ' <em class="' + (r.delta > 0 ? 'is-pos' : r.delta < 0 ? 'is-neg' : '') + '">' + fmtDelta(r.delta) + '</em>';
        row.li.classList.toggle('is-best', r.color === oh.best);
      });
      el.best.textContent = P[oh.best].label + ' (' + P[oh.best].contribution + ')';
      box.setAttribute('data-best', oh.best);
      renderInsights(Engine.insights(counts));
      if (graph) graph.set(counts, added);
    }

    update(null);
    // the first render should not flash a delta
    if (el.delta) el.delta.classList.remove('is-show');
    box._builder = { counts: counts, update: update };
  }

  /* ======================================================================
     PLATFORM micro-demos
     ====================================================================== */
  function initTyper() {
    var box = $('[data-typer]'); if (!box) return;
    var text = $('[data-typer-text]', box), ans = $('[data-typer-answer]', box);
    var role = $('[data-typer-role]', box), color = $('[data-typer-color]', box), why = $('[data-typer-why]', box), dot = $('.ask__role .dot', box);
    var EX = [
      { q: 'We ship fast, then fix the same problems twice.', c: 'Green', why: 'Your team is execution-heavy. Add structure before you add speed, or make one person accountable for the problem statement before work starts.' },
      { q: 'Nobody questions the plan until it’s already wrong.', c: 'Blue', why: 'Nobody here is naturally questioning the framing. Add someone who reliably asks the thing nobody else asked.' },
      { q: 'Plenty of great ideas. Very little ships.', c: 'Yellow', why: 'An ideas-heavy mix. Add someone who closes the gap between deciding and doing, and close the option set at a fixed point.' }
    ];
    if (REDUCED) return;
    var idx = 0, timer = 0, visible = false, running = false;
    function paint(ex) {
      var P = Engine.PROFILES[ex.c];
      role.textContent = P.label; color.textContent = ex.c; why.textContent = ex.why;
      dot.textContent = P.letter; dot.className = 'dot dot--' + ex.c[0].toLowerCase();
    }
    function wait(ms, fn) { timer = setTimeout(fn, ms); }
    function run() {
      if (!visible) { running = false; return; }
      running = true;
      var ex = EX[idx % EX.length], i = 0;
      ans.classList.add('is-hidden');
      text.textContent = '';
      wait(500, function type() {
        if (!visible) { running = false; return; }
        text.textContent = ex.q.slice(0, ++i);
        if (i < ex.q.length) wait(26 + Math.random() * 40, type);
        else wait(650, function () {
          paint(ex);
          ans.classList.remove('is-hidden');
          wait(4200, function () { idx++; run(); });
        });
      });
    }
    watchVisible(box, function (v) {
      visible = v;
      if (v && !running) { clearTimeout(timer); run(); }
      if (!v) { // leave a finished example behind, never an empty box
        clearTimeout(timer); running = false;
        var ex = EX[idx % EX.length]; text.textContent = ex.q; paint(ex); ans.classList.remove('is-hidden');
      }
    }, '-10% 0px');
  }

  function initAI() {
    var box = $('[data-ai]'); if (!box) return;
    var btn = $('[data-ai-btn]', box), rows = $$('.ai__list > div', box);
    var list = $('[data-ai-list]', box); list.setAttribute('aria-live', 'polite');
    var SETS = [
      ['Moves fast and closes things out.', 'Commits before the problem is fully framed.', 'Make one person own the problem statement.'],
      ['Follow-through, sequencing and accountability.', 'Nobody is naturally questioning the framing.', 'Bring an outside perspective into planning.'],
      ['Clear priorities and real ownership.', 'Speed can outrun context.', 'Add Architect (Green) capability.']
    ];
    var k = 0;
    rows.forEach(function (r, i) { r.style.setProperty('--n', i); });
    btn.addEventListener('click', function () {
      if (box.classList.contains('is-busy')) return;
      k = (k + 1) % SETS.length;
      box.classList.add('is-busy');
      setTimeout(function () {
        rows.forEach(function (r, i) { $('dd', r).textContent = SETS[k][i]; });
      }, REDUCED ? 0 : 420);
      setTimeout(function () { box.classList.remove('is-busy'); }, REDUCED ? 0 : 900);
    });
  }

  function initMeeting() {
    var wave = $('[data-wave]'); if (!wave) return;
    var rnd = mulberry(3), total = 64;
    // speaker turns: silence, Visionary, Executor, Motivator
    var turns = [[0, 6, ''], [6, 24, 's-b'], [24, 27, ''], [27, 43, 's-y'], [43, 46, ''], [46, 64, 's-r']];
    for (var i = 0; i < total; i++) {
      var b = document.createElement('i'), cls = '';
      turns.forEach(function (t) { if (i >= t[0] && i < t[1]) cls = t[2]; });
      if (cls) b.className = cls;
      b.style.setProperty('--h', (cls ? .3 + rnd() * .7 : .08 + rnd() * .12).toFixed(2));
      b.style.animationDelay = (-rnd() * 1.4).toFixed(2) + 's';
      b.style.animationDuration = (.7 + rnd() * .9).toFixed(2) + 's';
      wave.appendChild(b);
    }
  }

  function initMapScan() {
    var cell = $('.cell--map'); if (!cell || REDUCED) return;
    var rows = $$('.fmap__row', cell), i = 0, timer = 0;
    watchVisible(cell, function (v) {
      clearInterval(timer);
      if (!v) { rows.forEach(function (r) { r.classList.remove('is-scan'); }); return; }
      timer = setInterval(function () {
        rows.forEach(function (r, k) { r.classList.toggle('is-scan', k === i % (rows.length + 2)); });
        i++;
      }, 700);
    });
  }

  /* ======================================================================
     PROFILES: signal traces (a bright pulse running along each trace)
     ====================================================================== */
  function initTraces() {
    $$('.profile__trace path').forEach(function (p) {
      var hot = p.cloneNode(); hot.setAttribute('pathLength', '1'); hot.setAttribute('class', 'trace-hot');
      p.setAttribute('class', 'trace-dim');
      p.parentNode.appendChild(hot);
    });
  }

  /* ======================================================================
     ACCORDION: <details> with animated height
     ====================================================================== */
  function initAccordion() {
    $$('[data-accordion] details').forEach(function (d) {
      var s = $('summary', d), body = $('.acc__body', d);
      if (!s || !body || !body.animate) return;
      s.addEventListener('click', function (e) {
        if (REDUCED) return;
        e.preventDefault();
        if (d._anim) d._anim.cancel();
        if (d.open) {
          var h = body.offsetHeight;
          d._anim = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.65,0,.35,1)' });
          d._anim.onfinish = function () { d.open = false; d._anim = null; };
        } else {
          d.open = true;
          var h2 = body.scrollHeight;
          d._anim = body.animate([{ height: '0px', opacity: 0 }, { height: h2 + 'px', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.16,1,.3,1)' });
          d._anim.onfinish = function () { d._anim = null; };
        }
      });
    });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function boot() {
    [initNav, initReveal, initHero, initFriction, initBuilder, initTyper, initAI, initMeeting, initMapScan, initTraces, initAccordion]
      .forEach(function (fn) { try { fn(); } catch (err) { console.error('[signal] ' + fn.name + ': ' + err.message); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
