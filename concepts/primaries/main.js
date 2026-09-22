/* ==========================================================================
   RoleColorFinder · "Primaries" · main.js
   Page-agnostic modules, each initialised only if its hook exists:
     RCF.engine      product data + formulas (mirrors the live team-composition engine)
     RCF.motion      spring easing, tickers, shape "personalities", word splitting
     header / menu   [data-head], [data-menu]
     reveal          [data-reveal], [data-split], [data-count]
     hero            [data-hero]
     scrub           [data-scrub]
     specimens       [data-spec]
     friction        [data-friction]
     builder         [data-builder]
     features        [data-features]
     stages          [data-stages]
     accordion       [data-accordion]
     scroll decor    [data-spin]
   ========================================================================== */
(function () {
  'use strict';
  window.RCF_READY = true;

  var doc = document;
  var root = doc.documentElement;
  var RMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function motionOK() { return !RMQ.matches && !root.classList.contains('no-anim'); }
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var raf = window.requestAnimationFrame.bind(window);

  /* ------------------------------------------------------------------
     ENGINE: data and formulas, as in content/engine.js
     ------------------------------------------------------------------ */
  var PROFILES = {
    Yellow: { label: 'Executor',  focus: 'clear priorities, ownership, and delivery',          contribution: 'follow-through, sequencing, and accountability', blindSpot: 'speed can outrun context',            preferredCadence: 'clear handoffs and rapid execution loops' },
    Red:    { label: 'Motivator', focus: 'people momentum, alignment, and visible energy',     contribution: 'social energy, urgency, and buy-in',             blindSpot: 'optimism can outrun structure',       preferredCadence: 'live discussion and fast relational feedback' },
    Green:  { label: 'Architect', focus: 'logic, quality, and durable systems',                contribution: 'rigor, precision, and thoughtful tradeoffs',     blindSpot: 'analysis can delay commitment',       preferredCadence: 'time to think, validate, and refine' },
    Blue:   { label: 'Visionary', focus: 'possibility, pattern recognition, and innovation',   contribution: 'new angles, reframing, and future-state thinking', blindSpot: 'ideas can drift without a landing zone', preferredCadence: 'wide exploration before narrowing' }
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
  var DOMINANT = {
    Yellow: { title: 'Execution-heavy', detail: 'This group will move fast and close things out, but is likely to commit before the problem is fully framed and to under-invest in the structure that keeps it from recurring.', mitigation: 'Add Architect (Green) capability, or make one person accountable for the problem statement before work starts.' },
    Red:    { title: 'Energy-heavy', detail: 'Buy-in and morale will be strong, and optimism will regularly outrun the evidence. Plans get committed to on conviction rather than analysis.', mitigation: 'Add Architect (Green) capability, and require one piece of hard evidence before the team commits.' },
    Green:  { title: 'Planning-heavy', detail: 'Work will be well-structured and defensible, but the group will tend to over-analyse, delay commitment, and ship late.', mitigation: 'Add Executor (Yellow) capability, and set a decision deadline with an explicit "80% confidence is enough" rule.' },
    Blue:   { title: 'Ideas-heavy', detail: 'Plenty of original direction, but a real risk of reopening settled decisions and starting more than the group finishes.', mitigation: 'Add Executor (Yellow) capability, and close the option set at a fixed point.' }
  };
  var MISSING = {
    Yellow: { title: 'No Executor', detail: 'Nobody here is naturally driven by shipping. Work is likely to be well-considered and late.', mitigation: 'Hire or move in a Yellow, or give one person explicit ownership of delivery pace.' },
    Red:    { title: 'No Motivator', detail: 'Nobody is naturally working on belief and morale. This team will be efficient and quietly disengaged under pressure.', mitigation: 'Hire or move in a Red, or make morale an explicit part of someone’s remit.' },
    Green:  { title: 'No Architect', detail: 'Nobody is naturally building structure. Expect repeated problems, tribal knowledge, and quality that depends on individuals.', mitigation: 'Hire or move in a Green, or assign process ownership deliberately.' },
    Blue:   { title: 'No Visionary', detail: 'Nobody is naturally questioning the framing. This team will execute the plan it was given, including when the plan is wrong.', mitigation: 'Hire or move in a Blue, or bring an outside perspective into planning.' }
  };
  function total(counts) { return ORDER.reduce(function (s, c) { return s + (counts[c] || 0); }, 0); }
  function summaryLine(counts) {
    var t = total(counts);
    if (t === 0) return 'No one on this team has been assessed yet.';
    if (t < 3) return 'Too few people assessed to read a team shape.';
    var pct = function (c) { return Math.round((counts[c] || 0) / t * 100); };
    var dom = ORDER.filter(function (c) { return pct(c) > 50; })[0];
    if (dom) return pct(dom) + '% ' + PROFILES[dom].label + ': ' + DOMINANT[dom].title.toLowerCase() + '. ' + DOMINANT[dom].detail;
    if (balanceScore(counts) >= 75) return 'Well balanced across all four styles. This team can cover framing, structure, delivery and buy-in without borrowing capability.';
    var top = ORDER.slice().sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0); })[0];
    return 'Tilted toward ' + PROFILES[top].label + ' (' + pct(top) + '%), with the other styles represented but thin.';
  }
  // One hire from now: delta per color. Best = largest delta; ties go to the thinner profile.
  function hireDeltas(counts) {
    var base = balanceScore(counts);
    return ORDER.map(function (c) {
      var next = Object.assign({}, counts); next[c] = (next[c] || 0) + 1;
      var s = balanceScore(next);
      return { color: c, score: s, delta: s - base };
    });
  }
  function bestHire(deltas, counts) {
    var best = null;
    deltas.forEach(function (d) {
      if (!best || d.delta > best.delta || (d.delta === best.delta && (counts[d.color] || 0) <= (counts[best.color] || 0))) best = d;
    });
    return best;
  }
  // "What this costs you" cards
  var HIGH_PAIRS = [['Yellow', 'Blue'], ['Red', 'Green'], ['Red', 'Blue']];
  function insights(counts) {
    var t = total(counts), out = [];
    var pct = function (c) { return t ? Math.round((counts[c] || 0) / t * 100) : 0; };
    if (t >= 3) {
      var dom = ORDER.filter(function (c) { return pct(c) > 50; })[0];
      if (dom) out.push({ id: 'dom-' + dom, color: dom, level: pct(dom) >= 70 ? 'high' : 'medium',
        title: DOMINANT[dom].title + ' (' + pct(dom) + '% ' + PROFILES[dom].label + ')', detail: DOMINANT[dom].detail, fix: DOMINANT[dom].mitigation });
    }
    if (t >= 4) ORDER.forEach(function (c) {
      if (!(counts[c] || 0)) out.push({ id: 'miss-' + c, color: c, level: 'gap', title: MISSING[c].title, detail: MISSING[c].detail, fix: MISSING[c].mitigation });
    });
    var hf = highFrictionPairs(counts);
    if (hf > 0) {
      var parts = HIGH_PAIRS.map(function (p) {
        var n = (counts[p[0]] || 0) * (counts[p[1]] || 0);
        return n ? PAIRS[pairKey(p[0], p[1])].name + ' × ' + n : null;
      }).filter(Boolean);
      out.push({ id: 'hf', color: null, level: hf >= 3 ? 'high' : 'medium',
        title: hf + ' high-friction pairing' + (hf === 1 ? '' : 's'),
        detail: 'Some people on this team have working styles that reliably grind against each other on shared work. Here: ' + parts.join(', ') + '.',
        fix: 'Open the Friction Map to see which pairs, and what to do about each.' });
    }
    return out;
  }

  var SHAPE = { Yellow: 'tri', Red: 'cir', Green: 'sq', Blue: 'arc' };
  var CVAR = { Yellow: 'var(--yellow)', Red: 'var(--red)', Green: 'var(--green)', Blue: 'var(--blue)' };
  var RISK_TEXT = { high: 'High friction', medium: 'Watch closely', low: 'Low friction' };
  var RISK_LEVEL = { high: 3, medium: 2, low: 1 };

  window.RCF = window.RCF || {};
  window.RCF.engine = { PROFILES: PROFILES, ORDER: ORDER, PAIRS: PAIRS, pairKey: pairKey, pairRisk: pairRisk, mirrorPair: mirrorPair,
    getPair: getPair, balanceScore: balanceScore, highFrictionPairs: highFrictionPairs, summaryLine: summaryLine,
    hireDeltas: hireDeltas, bestHire: bestHire, insights: insights };

  /* ------------------------------------------------------------------
     MOTION utilities
     ------------------------------------------------------------------ */
  // Damped spring sampled into a CSS linear() easing. Returns {easing, duration}.
  function spring(k, c, samples) {
    k = k || 180; c = c || 15; samples = samples || 44;
    var w0 = Math.sqrt(k), z = c / (2 * Math.sqrt(k)), wd = w0 * Math.sqrt(1 - z * z);
    var x = function (t) { return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); };
    var ts = Math.log((1 + z * w0 / wd) / 0.002) / (z * w0);
    var pts = [];
    for (var i = 0; i <= samples; i++) pts.push(i === samples ? 1 : +x(i / samples * ts).toFixed(3));
    return { easing: 'linear(' + pts.join(', ') + ')', duration: Math.round(ts * 1000) };
  }
  var HAS_LINEAR = window.CSS && CSS.supports && CSS.supports('animation-timing-function', 'linear(0, 1)');
  var SPRING = HAS_LINEAR ? spring(180, 15) : { easing: 'cubic-bezier(.34,1.56,.64,1)', duration: 850 };
  var SPRING_SOFT = HAS_LINEAR ? spring(120, 12) : { easing: 'cubic-bezier(.34,1.4,.64,1)', duration: 1000 };
  var EASE_OUT = 'cubic-bezier(.16,1,.3,1)';

  function anim(el, frames, opts) {
    if (!el || !el.animate) return null;
    try { return el.animate(frames, opts); } catch (e) { return null; }
  }
  // Number ticker
  function tick(el, to, dur) {
    if (!el) return;
    var from = parseFloat(el.getAttribute('data-now'));
    if (isNaN(from)) from = parseFloat(el.textContent) || 0;
    el.setAttribute('data-now', to);
    if (!motionOK() || from === to) { el.textContent = to; return; }
    var t0 = performance.now(); dur = dur || 650;
    var id = (el._tick || 0) + 1; el._tick = id;
    (function step(now) {
      if (el._tick !== id) return;
      var p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) raf(step);
    })(t0);
  }
  // Each shape has a personality: the triangle surges forward, the circle
  // pulses, the square snaps a quarter turn, the half-circle rises.
  function personality(kind, el) {
    if (!motionOK() || !el || el._busy) return;
    var a;
    if (kind === 'tri') a = anim(el, [{ transform: 'none' }, { transform: 'translateY(-16%) rotate(-7deg)', offset: .32 }, { transform: 'none' }], { duration: SPRING.duration, easing: 'cubic-bezier(.3,.7,.3,1)' });
    else if (kind === 'cir') a = anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(.84)', offset: .22 }, { transform: 'scale(1.12)', offset: .5 }, { transform: 'scale(.97)', offset: .75 }, { transform: 'scale(1)' }], { duration: 760, easing: 'ease-in-out' });
    else if (kind === 'sq') a = anim(el, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }], { duration: SPRING.duration, easing: SPRING.easing });
    else if (kind === 'arc') a = anim(el, [{ transform: 'none' }, { transform: 'translateY(-22%)', offset: .45 }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.45,0,.2,1)' });
    if (a) { el._busy = true; a.onfinish = a.oncancel = function () { el._busy = false; }; }
  }
  // Split an element's text into masked words (.w > .wi) without touching aria-hidden children.
  function splitWords(el, cls) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = cls ? cls : 'w';
            if (cls) { w.textContent = p; w.style.setProperty('--wi', idx++); }
            else { var wi = doc.createElement('span'); wi.className = 'wi'; wi.textContent = p; wi.style.setProperty('--wi', idx++); w.appendChild(wi); }
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.getAttribute('aria-hidden') !== 'true') {
          walk(n);
        } else if (n.nodeType === 1) {
          n.setAttribute('data-word-index', idx);
        }
      });
    })(el);
    return idx;
  }
  window.RCF.motion = { spring: spring, tick: tick, personality: personality, splitWords: splitWords, motionOK: motionOK };

  /* ------------------------------------------------------------------
     HEADER: hide on scroll down, show on scroll up
     ------------------------------------------------------------------ */
  function initHeader() {
    var head = $('[data-head]'); if (!head) return;
    var lastY = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      raf(function () {
        var y = window.scrollY;
        var inside = head.contains(doc.activeElement);
        if (y > 140 && y > lastY + 6 && !inside && !root.classList.contains('menu-open')) head.classList.add('is-hidden');
        else if (y < lastY - 6 || y <= 140) head.classList.remove('is-hidden');
        lastY = y; ticking = false;
      });
    }, { passive: true });
    head.addEventListener('focusin', function () { head.classList.remove('is-hidden'); });
  }

  /* ------------------------------------------------------------------
     MENU (mobile): clip-path reveal from the button, staggered links
     ------------------------------------------------------------------ */
  function initMenu() {
    var menu = $('[data-menu]'), openBtn = $('[data-menu-open]'), closeBtn = $('[data-menu-close]');
    if (!menu || !openBtn) return;
    var isOpen = false, busy = null;
    function focusables() { return $$('a[href], button:not([disabled])', menu); }
    function open() {
      if (isOpen) return; isOpen = true;
      var r = openBtn.getBoundingClientRect();
      var mx = r.left + r.width / 2, my = r.top + r.height / 2;
      menu.style.setProperty('--mx', mx + 'px'); menu.style.setProperty('--my', my + 'px');
      menu.hidden = false;
      root.classList.add('menu-open');
      openBtn.setAttribute('aria-expanded', 'true');
      if (motionOK()) {
        if (busy) busy.cancel();
        busy = anim(menu, [{ clipPath: 'circle(0px at ' + mx + 'px ' + my + 'px)' }, { clipPath: 'circle(150% at ' + mx + 'px ' + my + 'px)' }], { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)' });
        $$('.menu-nav a', menu).forEach(function (a, i) {
          anim(a, [{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, delay: 180 + i * 70, easing: EASE_OUT, fill: 'backwards' });
          anim($('.shp', a), [{ transform: 'scale(0) rotate(-180deg)' }, { transform: 'none' }], { duration: SPRING.duration, delay: 300 + i * 70, easing: SPRING.easing, fill: 'backwards' });
        });
        anim($('.menu-foot', menu), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 480, easing: EASE_OUT, fill: 'backwards' });
        $$('.md', menu).forEach(function (m, i) {
          anim(m, [{ transform: 'translate(120px, -60px) rotate(120deg)' }, { transform: 'none' }], { duration: SPRING_SOFT.duration, delay: 250 + i * 80, easing: SPRING_SOFT.easing, fill: 'backwards' });
        });
      }
      setTimeout(function () { var f = $('.menu-nav a', menu); if (f) f.focus({ preventScroll: true }); }, 60);
    }
    function close(returnFocus) {
      if (!isOpen) return; isOpen = false;
      openBtn.setAttribute('aria-expanded', 'false');
      var done = function () { menu.hidden = true; root.classList.remove('menu-open'); };
      if (motionOK()) {
        var r = openBtn.getBoundingClientRect(), mx = r.left + r.width / 2, my = r.top + r.height / 2;
        if (busy) busy.cancel();
        busy = anim(menu, [{ clipPath: 'circle(150% at ' + mx + 'px ' + my + 'px)' }, { clipPath: 'circle(0px at ' + mx + 'px ' + my + 'px)' }], { duration: 480, easing: 'cubic-bezier(.7,0,.3,1)' });
        if (busy) busy.onfinish = done; else done();
      } else done();
      if (returnFocus !== false) openBtn.focus({ preventScroll: true });
    }
    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', function () { close(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
    doc.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        var f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) close(false); });
  }

  /* ------------------------------------------------------------------
     REVEAL: fade-up blocks, masked word headings, count-ups
     ------------------------------------------------------------------ */
  function initReveal() {
    // stagger siblings in lists
    $$('.specimens, .voices-grid').forEach(function (list) {
      $$('[data-reveal]', list).forEach(function (el, i) { el.style.setProperty('--rd', (i * 0.08) + 's'); });
    });
    if (motionOK()) $$('[data-split]').forEach(function (el) { splitWords(el); });
    var targets = $$('[data-reveal], [data-split], [data-count]');
    if (!('IntersectionObserver' in window) || !motionOK()) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-in');
        if (el.hasAttribute('data-count')) countUp(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), pre = el.getAttribute('data-prefix') || '';
    var t0 = performance.now(), dur = 1100;
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + Math.round(to * e);
      if (p < 1) raf(step);
    })(t0);
  }

  /* ------------------------------------------------------------------
     HERO: shapes assemble with a spring, drift, follow the cursor,
     then the art "scans" the team and flags risky pairs.
     ------------------------------------------------------------------ */
  function initHero() {
    var fig = $('[data-hero]'); if (!fig) return;
    var hero = fig.closest('.hero'), art = $('.art', fig);
    var shapes = $$('.hs', art);
    var byId = {}; shapes.forEach(function (s) { byId[s.getAttribute('data-hs')] = s; });
    var COLOR = { t: 'Yellow', c: 'Red', s: 'Green', a: 'Blue' };
    var colorOf = function (id) { return COLOR[id.charAt(0)]; };
    var line = $('[data-link]', art), flag = $('[data-flag]', art);
    var readout = $('[data-readout]', fig), meter = $('[data-meter]', fig), crack = $('[data-crack]');
    var SCAN = [['t1', 'a1'], ['c2', 's2'], ['t1', 'c2'], ['c2', 'a1'], ['s1', 's2']];
    $$('.hero-title .wi').forEach(function (w, i) { w.style.setProperty('--wi', i); });

    function center(el) {
      var a = art.getBoundingClientRect(), f = $('.hs-f', el).getBoundingClientRect();
      var kind = el.getAttribute('data-kind');
      var yk = kind === 'tri' ? 0.62 : kind === 'arc' ? 0.62 : 0.5;
      return { x: (f.left + f.width / 2 - a.left) / a.width * 100, y: (f.top + f.height * yk - a.top) / a.height * 100 };
    }
    var activePair = null;
    function syncLine() {
      if (!activePair) return null;
      var p1 = center(activePair[0]), p2 = center(activePair[1]);
      line.setAttribute('x1', p1.x.toFixed(2)); line.setAttribute('y1', p1.y.toFixed(2)); line.setAttribute('x2', p2.x.toFixed(2)); line.setAttribute('y2', p2.y.toFixed(2));
      flag.style.left = ((p1.x + p2.x) / 2).toFixed(2) + '%'; flag.style.top = ((p1.y + p2.y) / 2).toFixed(2) + '%';
      return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    function showPair(ids, animate) {
      var A = byId[ids[0]], B = byId[ids[1]];
      var ca = colorOf(ids[0]), cb = colorOf(ids[1]);
      var pair = getPair(ca, cb);
      activePair = [A, B];
      line.getAnimations && line.getAnimations().forEach(function (a) { a.cancel(); });
      var len = syncLine();
      line.classList.toggle('is-medium', pair.risk !== 'high');
      line.style.strokeDasharray = pair.risk === 'high' ? (animate ? len + ' ' + len : 'none') : '1.8 1.4';
      art.classList.add('is-scanning');
      shapes.forEach(function (s) { s.classList.toggle('is-flag', s === A || s === B); });
      flag.textContent = pair.name;
      flag.classList.add('is-on');
      readout.innerHTML = '<b>' + pair.name + '</b> · ' + RISK_TEXT[pair.risk] + ' · ' + PROFILES[ca].label + ' \u00d7 ' + PROFILES[cb].label;
      meter.setAttribute('data-level', RISK_LEVEL[pair.risk]);
      if (!animate) { line.style.opacity = 1; line.style.strokeDashoffset = 0; return; }
      var draw = anim(line, pair.risk === 'high'
        ? [{ opacity: 1, strokeDashoffset: len }, { opacity: 1, strokeDashoffset: 0 }]
        : [{ opacity: 0 }, { opacity: 1 }], { duration: 520, easing: EASE_OUT, fill: 'forwards' });
      if (draw && pair.risk === 'high') draw.onfinish = function () { line.style.strokeDasharray = 'none'; };
      var ja = $('.hs-j', A), jb = $('.hs-j', B);
      if (pair.risk === 'high') {
        [ja, jb].forEach(function (j, i) {
          var s = i ? 1 : -1;
          anim(j, [{ transform: 'none' }, { transform: 'translate(' + (7 * s) + 'px,' + (-3) + 'px) rotate(' + (4 * s) + 'deg)', offset: .15 },
            { transform: 'translate(' + (-6 * s) + 'px,2px) rotate(' + (-3 * s) + 'deg)', offset: .35 }, { transform: 'translate(' + (4 * s) + 'px,0) rotate(' + (2 * s) + 'deg)', offset: .55 },
            { transform: 'translate(' + (-2 * s) + 'px,0)', offset: .75 }, { transform: 'none' }], { duration: 620, delay: 380, easing: 'linear' });
        });
        if (crack) { setTimeout(function () { crack.classList.add('is-jolt'); }, 380); setTimeout(function () { crack.classList.remove('is-jolt'); }, 900); }
      } else if (pair.risk === 'medium') {
        [ja, jb].forEach(function (j, i) {
          var s = i ? 1 : -1;
          anim(j, [{ transform: 'none' }, { transform: 'rotate(' + (5 * s) + 'deg)', offset: .3 }, { transform: 'rotate(' + (-3 * s) + 'deg)', offset: .65 }, { transform: 'none' }], { duration: 900, delay: 380, easing: 'ease-in-out' });
        });
      } else {
        [ja, jb].forEach(function (j) {
          anim(j, [{ transform: 'none' }, { transform: 'scale(1.06)', offset: .4 }, { transform: 'none' }], { duration: 800, delay: 380, easing: 'ease-in-out' });
        });
      }
    }
    function clearPair() {
      activePair = null;
      art.classList.remove('is-scanning');
      shapes.forEach(function (s) { s.classList.remove('is-flag'); });
      flag.classList.remove('is-on');
      line.getAnimations && line.getAnimations().forEach(function (a) { a.cancel(); });
      anim(line, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    }

    if (!motionOK()) {
      hero.classList.add('is-go');
      raf(function () { showPair(SCAN[0], false); });
      return;
    }

    // 1. assemble
    raf(function () {
      hero.classList.add('is-go');
      var a = art.getBoundingClientRect(), acx = a.left + a.width / 2, acy = a.top + a.height / 2;
      var order = ['t1', 'c2', 'a1', 's2', 'c1', 's1', 'a2', 't2'];
      order.forEach(function (id, i) {
        var el = byId[id]; if (!el) return;
        var b = el.getBoundingClientRect();
        var dx = (b.left + b.width / 2 - acx) * 0.9, dy = (b.top + b.height / 2 - acy) * 0.9 - 40;
        var rot = (i % 2 ? 1 : -1) * (40 + i * 12);
        anim($('.hs-j', el), [
          { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg) scale(.2)', opacity: 0 },
          { opacity: 1, offset: .18 },
          { transform: 'none', opacity: 1 }
        ], { duration: SPRING.duration + 250, delay: 420 + i * 95, easing: SPRING.easing, fill: 'backwards' });
      });
      setTimeout(function () { art.classList.add('is-alive'); }, 420 + 8 * 95 + SPRING.duration);
    });

    // 2. cursor + scroll parallax
    var pointer = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, visible = true, loopOn = false, lastSy = -1;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var layers = shapes.map(function (s) { return { p: $('.hs-p', s), d: +s.getAttribute('data-depth') || 12 }; });
    if (fine) window.addEventListener('pointermove', function (e) {
      var r = art.getBoundingClientRect();
      pointer.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 200), -1, 1);
      pointer.y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 200), -1, 1);
      startLoop();
    }, { passive: true });
    window.addEventListener('scroll', function () { if (visible) startLoop(); }, { passive: true });
    function startLoop() { if (!loopOn) { loopOn = true; raf(loop); } }
    function loop() {
      cur.x += (pointer.x - cur.x) * 0.08; cur.y += (pointer.y - cur.y) * 0.08;
      var sy = Math.min(window.scrollY, 1200);
      layers.forEach(function (l, i) {
        var tx = -cur.x * l.d, ty = -cur.y * l.d - sy * l.d * 0.007;
        var r = sy * 0.02 * (i % 2 ? 1 : -1) * (l.d / 20);
        l.p.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) rotate(' + r.toFixed(2) + 'deg)';
      });
      syncLine();
      if (Math.abs(pointer.x - cur.x) > 0.001 || Math.abs(pointer.y - cur.y) > 0.001 || Math.abs(sy - lastSy) > 0.5) { lastSy = sy; raf(loop); } else loopOn = false;
    }

    // 3. hover personalities
    shapes.forEach(function (s) {
      var kind = s.getAttribute('data-kind'), f = $('.hs-f', s);
      s.addEventListener('pointerenter', function () { personality(kind, f); });
    });

    // 4. friction scan loop (pauses when off-screen or tab hidden)
    var step = 0, timer = null;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.2 }).observe(art);
    function cycle() {
      if (!visible || doc.hidden) { timer = setTimeout(cycle, 600); return; }
      showPair(SCAN[step % SCAN.length], true);
      step++;
      timer = setTimeout(function () { clearPair(); timer = setTimeout(cycle, 650); }, 2900);
    }
    setTimeout(cycle, 420 + 8 * 95 + SPRING.duration + 200);
  }

  /* ------------------------------------------------------------------
     SCRUB: manifesto words light up with scroll position
     ------------------------------------------------------------------ */
  function initScrub() {
    var el = $('[data-scrub]'); if (!el || !motionOK()) return;
    splitWords(el, 'sw');
    var words = $$('.sw', el), shapes = $('.inline-shapes', el);
    var shapeAt = shapes ? +shapes.getAttribute('data-word-index') : -1;
    var lit = -1, pending = false;
    function update() {
      pending = false;
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3), 0, 1);
      var n = Math.round(p * words.length);
      if (n === lit) return; lit = n;
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < n); });
      if (shapes) el.classList.toggle('shapes-in', n >= shapeAt);
    }
    window.addEventListener('scroll', function () { if (!pending) { pending = true; raf(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ------------------------------------------------------------------
     SPECIMENS: shape personality on hover / tap / focus
     ------------------------------------------------------------------ */
  function initSpecimens() {
    $$('[data-spec]').forEach(function (row) {
      var kind = row.getAttribute('data-spec'), shape = $('.spec-shape i', row);
      row.addEventListener('pointerenter', function () { personality(kind, shape); });
      row.addEventListener('click', function () { personality(kind, shape); });
    });
  }

  /* ------------------------------------------------------------------
     FRICTION ENGINE
     ------------------------------------------------------------------ */
  function initFriction() {
    var fe = $('[data-friction]'); if (!fe) return;
    var stage = $('[data-stage]', fe), matrix = $('[data-matrix]', fe), result = $('[data-result]', fe);
    var actA = $('[data-actor="a"]', stage), actB = $('[data-actor="b"]', stage);
    var markHigh = $('.stage-mark--high', stage), markMed = $('.stage-mark--medium', stage);
    var state = { a: 'Yellow', b: 'Blue' }, played = false;

    // matrix (upper triangle incl. diagonal = the 10 pairings)
    var html = '<span class="mh" aria-hidden="true"></span>';
    ORDER.forEach(function (c) { html += '<span class="mh" aria-hidden="true"><i class="shp shp--' + SHAPE[c] + '"></i></span>'; });
    ORDER.forEach(function (r, ri) {
      html += '<span class="mh" aria-hidden="true"><i class="shp shp--' + SHAPE[r] + '"></i></span>';
      ORDER.forEach(function (c, ci) {
        if (ci < ri) { html += '<span class="mcell-empty" aria-hidden="true"></span>'; return; }
        var p = getPair(r, c);
        html += '<button type="button" class="mcell mcell--' + p.risk + '" data-a="' + r + '" data-b="' + c + '" aria-pressed="false" aria-label="' +
          PROFILES[r].label + ' and ' + PROFILES[c].label + ': ' + p.name + ', ' + RISK_TEXT[p.risk].toLowerCase() + '">' +
          (p.risk === 'high' ? '<svg viewBox="-50 -50 100 100" aria-hidden="true"><line x1="0" y1="-44" x2="0" y2="-18"/><line x1="0" y1="18" x2="0" y2="44"/><line x1="-36" y1="-36" x2="-14" y2="-14"/><line x1="36" y1="-36" x2="14" y2="-14"/><line x1="-36" y1="36" x2="-14" y2="14"/><line x1="36" y1="36" x2="14" y2="14"/></svg>' : '') +
          '</button>';
      });
    });
    matrix.innerHTML = html;
    var cells = $$('.mcell', matrix);
    cells.forEach(function (b) {
      b.addEventListener('click', function () { setPair(b.getAttribute('data-a'), b.getAttribute('data-b')); });
    });
    $$('input[type=radio]', fe).forEach(function (inp) {
      inp.addEventListener('change', function () {
        state.a = $('input[name=fe-a]:checked', fe).value; state.b = $('input[name=fe-b]:checked', fe).value;
        render(true);
      });
    });
    function setPair(a, b) {
      state.a = a; state.b = b;
      $('input[name=fe-a][value=' + a + ']', fe).checked = true;
      $('input[name=fe-b][value=' + b + ']', fe).checked = true;
      render(true);
    }
    function sizes() {
      var W = stage.clientWidth, H = stage.clientHeight;
      var S = Math.round(clamp(Math.min(W * 0.2, H * 0.5), 76, 150));
      stage.style.setProperty('--S', S + 'px');
      return { W: W, S: S, half: S / 2, gapH: Math.round(clamp(W * 0.09, 34, 72)) };
    }
    function setShape(actor, color) {
      var s = $('.stage-shape', actor);
      s.className = 'stage-shape f-' + SHAPE[color];
      s.style.setProperty('--c', CVAR[color]);
    }
    function restX(risk, z) { return risk === 'high' ? z.half + z.gapH : risk === 'medium' ? z.half + 22 : z.half - 6; }
    function tx(x, r, sc) { return 'translateX(' + x.toFixed(1) + 'px) rotate(' + (r || 0) + 'deg)' + (sc ? ' scale(' + sc + ')' : ''); }

    function playStage(risk, animate) {
      var z = sizes(), rest = restX(risk, z), far = z.W / 2 + z.S;
      var bodyA = $('.stage-body', actA), bodyB = $('.stage-body', actB);
      [bodyA, bodyB, markHigh, markMed, stage].forEach(function (el) { el.getAnimations && el.getAnimations().forEach(function (a) { a.cancel(); }); });
      bodyA.style.transform = tx(-rest); bodyB.style.transform = tx(rest);
      stage.setAttribute('data-risk', risk);
      var mw = Math.max(0, 2 * (rest - z.half));
      markMed.style.width = mw + 'px'; markMed.style.marginLeft = (-mw / 2) + 'px';
      if (!animate || !motionOK()) return;
      var frames = function (s) {
        var o = s; // -1 for A, +1 for B
        if (risk === 'high') return [
          { transform: tx(o * far, o * 50), easing: 'cubic-bezier(.55,0,.85,.4)' },
          { transform: tx(o * (z.half - 8), 0, 1), offset: .36, easing: 'cubic-bezier(.1,.9,.3,1)' },
          { transform: tx(o * (rest + 34), o * 16), offset: .52, easing: 'ease-in-out' },
          { transform: tx(o * (rest - 10), o * -6), offset: .66, easing: 'ease-in-out' },
          { transform: tx(o * (rest + 6), o * 3), offset: .8, easing: 'ease-in-out' },
          { transform: tx(o * (rest - 2), 0), offset: .9 },
          { transform: tx(o * rest, 0) }];
        if (risk === 'medium') return [
          { transform: tx(o * far, o * 30), easing: 'cubic-bezier(.3,.6,.4,1)' },
          { transform: tx(o * (z.half + 1), 0), offset: .5, easing: 'ease-out' },
          { transform: tx(o * (rest + 12), o * 6), offset: .68, easing: 'ease-in-out' },
          { transform: tx(o * (rest - 4), o * -2), offset: .84, easing: 'ease-in-out' },
          { transform: tx(o * rest, 0) }];
        return [
          { transform: tx(o * far, o * 24), easing: 'cubic-bezier(.2,.8,.3,1)' },
          { transform: tx(o * (z.half - 12), 0, '1.05,.95'), offset: .62, easing: 'ease-out' },
          { transform: tx(o * (z.half - 3), 0), offset: .82, easing: 'ease-in-out' },
          { transform: tx(o * rest, 0) }];
      };
      var dur = risk === 'high' ? 1300 : risk === 'medium' ? 1150 : 1000;
      anim(bodyA, frames(-1), { duration: dur });
      anim(bodyB, frames(1), { duration: dur });
      if (risk === 'high') {
        anim(markHigh, [{ opacity: 0, transform: 'scale(.2) rotate(-30deg)' }, { opacity: 1, transform: 'scale(1.35) rotate(8deg)', offset: .4 }, { opacity: 1, transform: 'none' }], { duration: 600, delay: dur * .36, easing: 'ease-out', fill: 'backwards' });
        anim(stage, [{ transform: 'none' }, { transform: 'translate(-5px, 2px)', offset: .2 }, { transform: 'translate(4px,-2px)', offset: .45 }, { transform: 'translate(-2px,0)', offset: .7 }, { transform: 'none' }], { duration: 320, delay: dur * .36 });
      } else if (risk === 'medium') {
        anim(markMed, [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: dur * .62, easing: EASE_OUT, fill: 'backwards' });
      }
    }
    function list(key, items) {
      var ul = $('[data-list="' + key + '"]', result);
      ul.innerHTML = items.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    }
    function render(animate) {
      var a = state.a, b = state.b, pair = getPair(a, b);
      if (animate) { played = true; stage.classList.remove('stage--wait'); }
      setShape(actA, a); setShape(actB, b);
      $('[data-name="a"]', stage).textContent = PROFILES[a].label;
      $('[data-name="b"]', stage).textContent = PROFILES[b].label;
      $('[data-risk-text]', result).textContent = RISK_TEXT[pair.risk];
      $('.meter', result).setAttribute('data-level', RISK_LEVEL[pair.risk]);
      $('[data-pair-name]', result).textContent = pair.name;
      $('[data-summary]', result).textContent = pair.summary || pair.why;
      var why = $('[data-why]', result);
      why.textContent = pair.summary ? pair.why : ''; why.hidden = !pair.summary;
      list('strengths', pair.strengths); list('watchouts', pair.watchouts); list('actions', pair.actions);
      var lo = Math.min(ORDER.indexOf(a), ORDER.indexOf(b)), hi = Math.max(ORDER.indexOf(a), ORDER.indexOf(b));
      cells.forEach(function (c) {
        var on = c.getAttribute('data-a') === ORDER[lo] && c.getAttribute('data-b') === ORDER[hi];
        c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      playStage(pair.risk, animate);
      if (animate && motionOK()) {
        [$('.fe-verdict', result), $('.fe-cols', result)].forEach(function (el, i) {
          anim(el, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 120 + i * 90, easing: EASE_OUT, fill: 'backwards' });
        });
      }
    }
    render(false);
    // play the collision the first time the stage comes into view
    if ('IntersectionObserver' in window && motionOK()) {
      stage.classList.add('stage--wait');
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !played) {
          played = true; stage.classList.remove('stage--wait');
          playStage(getPair(state.a, state.b).risk, true); io.disconnect();
        }
      }, { threshold: 0.5 });
      io.observe(stage);
    }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { playStage(getPair(state.a, state.b).risk, false); }, 150); });
  }

  /* ------------------------------------------------------------------
     TEAM BUILDER
     ------------------------------------------------------------------ */
  var GHOST = {
    tri: '<path d="M50 6 95 90H5Z"/>',
    cir: '<circle cx="50" cy="50" r="44"/>',
    sq: '<rect x="8" y="8" width="84" height="84"/>',
    arc: '<path d="M6 74A44 44 0 0 1 94 74Z"/>'
  };
  function initBuilder() {
    var tb = $('[data-builder]'); if (!tb) return;
    var DEF = { Yellow: 4, Red: 2, Green: 1, Blue: 0 }, MAX = 10;
    var counts = Object.assign({}, DEF);
    var canvas = $('[data-canvas]', tb), costsEl = $('[data-costs]', tb);
    var cols = {};
    canvas.innerHTML = '';
    ORDER.forEach(function (c) {
      var col = doc.createElement('div'); col.className = 'tb-col'; col.setAttribute('data-col', c);
      col.innerHTML = '<span class="tb-col-name">' + PROFILES[c].label + '</span>';
      canvas.appendChild(col); cols[c] = col;
    });
    function personEl(c) {
      var p = doc.createElement('span'); p.className = 'person';
      p.innerHTML = '<i class="f-' + SHAPE[c] + '" style="--c:' + CVAR[c] + '"></i>';
      return p;
    }
    function ghostEl(c) {
      var g = doc.createElement('span'); g.className = 'person person--ghost';
      g.innerHTML = '<svg viewBox="0 0 100 100" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 5" vector-effect="non-scaling-stroke">' + GHOST[SHAPE[c]] + '</svg>';
      var lab = doc.createElement('span'); lab.className = 'tb-col-gap'; lab.textContent = 'Gap';
      var wrap = doc.createDocumentFragment(); wrap.appendChild(g); wrap.appendChild(lab);
      return wrap;
    }
    function drawCanvas(animate) {
      var most = Math.max.apply(null, ORDER.map(function (c) { return counts[c]; }).concat([1]));
      var h = canvas.clientHeight - 60, w = canvas.clientWidth / 4 - 16;
      canvas.style.setProperty('--ps', Math.round(clamp(Math.min((h - most * 6) / most, w), 18, 52)) + 'px');
      ORDER.forEach(function (c) {
        var col = cols[c], n = counts[c];
        var live = $$('.person:not(.person--ghost):not(.is-leaving)', col);
        var ghost = $('.person--ghost', col);
        if (n > 0 && ghost) { var lab = $('.tb-col-gap', col); ghost.remove(); if (lab) lab.remove(); }
        for (var i = live.length; i < n; i++) {
          var p = personEl(c); col.appendChild(p);
          if (animate && motionOK()) anim(p, [{ transform: 'translateY(-70px) rotate(' + (i % 2 ? 90 : -90) + 'deg) scale(.3)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: 'none', opacity: 1 }],
            { duration: SPRING.duration, delay: (i - live.length) * 45, easing: SPRING.easing, fill: 'backwards' });
        }
        for (var k = live.length - 1; k >= n; k--) {
          (function (el) {
            el.classList.add('is-leaving');
            if (animate && motionOK()) {
              var a = anim(el, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-24px) scale(.2) rotate(45deg)', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
              if (a) a.onfinish = function () { el.remove(); }; else el.remove();
            } else el.remove();
          })(live[k]);
        }
        if (n === 0 && !$('.person--ghost', col)) {
          col.appendChild(ghostEl(c));
          if (animate && motionOK()) anim($('.person--ghost', col), [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: SPRING.duration, easing: SPRING.easing });
        }
      });
    }
    var lastSummary = '';
    var statusTimer;
    function update(animate) {
      var t = total(counts), score = balanceScore(counts), hf = highFrictionPairs(counts);
      // steppers
      $$('.stepper', tb).forEach(function (row) {
        var c = row.getAttribute('data-color');
        $('[data-val]', row).textContent = counts[c];
        $('[data-step="-1"]', row).disabled = counts[c] <= 0;
        $('[data-step="1"]', row).disabled = counts[c] >= MAX;
      });
      $('[data-total]', tb).textContent = t + (t === 1 ? ' person' : ' people');
      // score + pairs
      tick($('[data-score]', tb), score);
      tick($('[data-pairs]', tb), hf);
      $('[data-gauge]', tb).style.setProperty('--v', score / 100);
      $('[data-gauge-mark]', tb).style.setProperty('--v', score / 100);
      if (animate && motionOK()) $$('.score', tb).forEach(function (s) { s.classList.remove('is-bump'); void s.offsetWidth; s.classList.add('is-bump'); });
      // mix
      ORDER.forEach(function (c) {
        $('[data-seg="' + c + '"]', tb).style.flexGrow = counts[c];
        $('[data-pct="' + c + '"] b', tb).textContent = (t ? Math.round(counts[c] / t * 100) : 0) + '%';
      });
      // summary
      var sl = summaryLine(counts), sEl = $('[data-summary-line]', tb);
      if (sl !== lastSummary) {
        sEl.textContent = sl; lastSummary = sl;
        if (animate && motionOK()) anim(sEl, [{ opacity: .2, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: EASE_OUT });
      }
      // one hire from now
      var deltas = hireDeltas(counts), best = bestHire(deltas, counts), hasBest = best && best.delta > 0;
      deltas.forEach(function (d) {
        var li = $('[data-delta="' + d.color + '"]', tb);
        $('.d-score', li).textContent = d.score;
        $('.d-chip', li).textContent = (d.delta > 0 ? '+' : d.delta < 0 ? '−' : '±') + Math.abs(d.delta);
        li.classList.toggle('is-up', d.delta > 0);
        li.classList.toggle('is-best', hasBest && d.color === best.color);
      });
      var bestEl = $('[data-best]', tb);
      bestEl.innerHTML = '<span class="label">Best next hire</span> ' + (hasBest
        ? PROFILES[best.color].label + ' (' + PROFILES[best.color].contribution + ').'
        : 'No single hire raises the score from here.');
      var hireBtn = $('[data-hire-best]', tb);
      hireBtn.disabled = !hasBest || counts[best.color] >= MAX;
      hireBtn.setAttribute('data-color', hasBest ? best.color : '');
      hireBtn.setAttribute('aria-label', hasBest ? 'Hire the gap: add a ' + PROFILES[best.color].label : 'Hire the gap');
      // costs
      drawCosts(insights(counts), animate, t);
      drawCanvas(animate);
      // announce
      clearTimeout(statusTimer);
      statusTimer = setTimeout(function () {
        $('[data-status]', tb).textContent = t + ' people. Balance score ' + score + ' out of 100. ' + hf + ' high-friction pair' + (hf === 1 ? '' : 's') + '. ' +
          (hasBest ? 'Best next hire: ' + PROFILES[best.color].label + '.' : '');
      }, 500);
    }
    function costHTML(c) {
      return '<p class="cost-tag">' + (c.level === 'high' ? 'High' : c.level === 'gap' ? 'Gap' : 'Watch') + '</p>' +
        '<h4 class="cost-title">' + c.title + '</h4><p>' + c.detail + '</p><p class="cost-fix"><b>Fix</b> ' + c.fix + '</p>';
    }
    function drawCosts(list, animate, t) {
      var existing = {};
      $$('.cost:not(.is-leaving)', costsEl).forEach(function (el) { existing[el.getAttribute('data-id')] = el; });
      var keep = {};
      var empty = $('.costs-empty', costsEl);
      list.forEach(function (c, i) {
        keep[c.id] = true;
        var el = existing[c.id];
        var html = costHTML(c);
        if (!el) {
          el = doc.createElement('article'); el.className = 'cost'; el.setAttribute('data-id', c.id);
          el.innerHTML = html;
          if (animate && motionOK()) anim(el, [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: i * 50, easing: EASE_OUT, fill: 'backwards' });
        } else if (el._html !== html) {
          el.innerHTML = html;
          if (animate && motionOK()) anim($('.cost-title', el), [{ opacity: .3 }, { opacity: 1 }], { duration: 400 });
        }
        el._html = html;
        el.setAttribute('data-level', c.level);
        el.style.setProperty('--c', c.color ? CVAR[c.color] : 'var(--ink)');
        costsEl.appendChild(el); // keeps order
      });
      Object.keys(existing).forEach(function (id) {
        if (keep[id]) return;
        var el = existing[id];
        el.classList.add('is-leaving'); el.removeAttribute('data-id');
        if (animate && motionOK()) {
          var a = anim(el, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.96)' }], { duration: 220, fill: 'forwards' });
          if (a) a.onfinish = function () { el.remove(); }; else el.remove();
        } else el.remove();
      });
      if (!list.length) {
        if (!empty) { empty = doc.createElement('p'); empty.className = 'costs-empty'; costsEl.appendChild(empty); }
        empty.textContent = t === 0 ? 'Add people to see what the mix costs you.' : 'Nothing flagged for this mix.';
      } else if (empty) empty.remove();
    }
    // wire controls
    $$('.stepper', tb).forEach(function (row) {
      var c = row.getAttribute('data-color');
      $$('[data-step]', row).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = clamp(counts[c] + (+btn.getAttribute('data-step')), 0, MAX);
          if (v === counts[c]) return;
          counts[c] = v; update(true);
          personality(SHAPE[c], $('.shp', row));
        });
      });
    });
    $('[data-hire-best]', tb).addEventListener('click', function () {
      var c = this.getAttribute('data-color'); if (!c || counts[c] >= MAX) return;
      counts[c]++; update(true);
    });
    $('[data-reset]', tb).addEventListener('click', function () { counts = Object.assign({}, DEF); update(true); });
    // initial: replace server-rendered cost cards with keyed ones
    costsEl.innerHTML = '';
    update(false);
    window.RCF.builder = { get: function () { return Object.assign({}, counts); }, set: function (c) { counts = Object.assign({}, c); update(true); } };
  }

  /* ------------------------------------------------------------------
     FEATURES: desktop = sticky panel switched by scroll or click;
     mobile = every panel inline, played when it scrolls in.
     ------------------------------------------------------------------ */
  function initFeatures() {
    var wrap = $('[data-features]'); if (!wrap) return;
    var items = $$('.feat-item', wrap), panels = $$('.feat-panel', wrap);
    var desk = window.matchMedia('(min-width: 1024px)');
    var active = 0;
    function play(panel) {
      panel.classList.remove('is-played'); void panel.offsetWidth; panel.classList.add('is-played');
      var typed = $('[data-type]', panel);
      if (typed) typeOut(typed, panel);
    }
    function activate(i) {
      if (i === active && panels[i].classList.contains('is-played')) return;
      active = i;
      items.forEach(function (it, k) {
        it.classList.toggle('is-active', k === i);
        $('.feat-btn', it).setAttribute('aria-expanded', k === i ? 'true' : 'false');
      });
      panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
      play(panels[i]);
    }
    items.forEach(function (it, i) {
      $('.feat-btn', it).addEventListener('click', function () {
        if (desk.matches) activate(i); else { play(panels[i]); }
      });
    });
    if (!('IntersectionObserver' in window) || !motionOK()) {
      panels.forEach(function (p) { p.classList.add('is-played'); });
      if (desk.matches) activate(0);
      return;
    }
    // desktop: item crossing the middle band of the viewport becomes active
    var ioDesk = new IntersectionObserver(function (en) {
      if (!desk.matches) return;
      en.forEach(function (e) { if (e.isIntersecting) activate(items.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    items.forEach(function (it) { ioDesk.observe(it); });
    // play the first panel when the section arrives
    var ioFirst = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && desk.matches) { play(panels[active]); ioFirst.disconnect(); }
    }, { threshold: 0.3 });
    ioFirst.observe(wrap);
    // mobile: each panel plays as it scrolls in; loops only while visible
    var ioMob = new IntersectionObserver(function (en) {
      if (desk.matches) return;
      en.forEach(function (e) {
        e.target.classList.toggle('is-active', e.isIntersecting);
        if (e.isIntersecting && !e.target._played) { e.target._played = true; play(e.target); }
      });
    }, { threshold: 0.35 });
    panels.forEach(function (p) { ioMob.observe(p); });
  }
  function typeOut(el, panel) {
    if (!el._full) el._full = el.textContent;
    var full = el._full, out = $('.wh-out', panel);
    if (!motionOK()) { el.textContent = full; return; }
    var id = (el._id || 0) + 1; el._id = id;
    el.textContent = '';
    if (out) { out.style.opacity = 0; out.style.transform = 'translateY(10px)'; }
    var i = 0;
    (function step() {
      if (el._id !== id) return;
      i += 2; el.textContent = full.slice(0, i);
      if (i < full.length) setTimeout(step, 26);
      else if (out) {
        out.style.transition = 'opacity .5s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)';
        out.style.opacity = 1; out.style.transform = 'none';
        personality('tri', $('.wh-shape', out));
      }
    })();
  }

  /* ------------------------------------------------------------------
     STAGES (Tuckman): shapes arrange themselves per stage
     ------------------------------------------------------------------ */
  function initStages() {
    var list = $('[data-stages]'); if (!list) return;
    if (!('IntersectionObserver' in window) || !motionOK()) { list.classList.add('is-in'); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { list.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(list);
    $$('.stage-card', list).forEach(function (card) {
      card.addEventListener('pointerenter', function () {
        if (!list.classList.contains('is-in') || card._busy) return;
        card._busy = true;
        card.classList.add('is-reset', 'is-quick');
        void card.offsetWidth;
        card.classList.remove('is-reset');
        setTimeout(function () { card.classList.remove('is-quick'); card._busy = false; }, 1300);
      });
    });
  }

  /* ------------------------------------------------------------------
     ACCORDION: animated <details>
     ------------------------------------------------------------------ */
  function initAccordion() {
    $$('[data-accordion] details').forEach(function (d) {
      var sum = $('summary', d), body = $('.acc-a', d), running = null;
      sum.addEventListener('click', function (e) {
        if (!motionOK() || !body.animate) return;
        e.preventDefault();
        if (running) running.cancel();
        if (!d.open) {
          d.open = true;
          var h = body.offsetHeight;
          running = anim(body, [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: EASE_OUT });
          if (running) running.onfinish = function () { running = null; };
        } else {
          var h2 = body.offsetHeight;
          running = anim(body, [{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.5,0,.75,0)' });
          if (running) running.onfinish = function () { d.open = false; running = null; };
          else d.open = false;
        }
      });
      body.style.overflow = 'hidden';
    });
  }

  /* ------------------------------------------------------------------
     SCROLL DECOR: [data-spin] rotates with scroll
     ------------------------------------------------------------------ */
  function initSpin() {
    var els = $$('[data-spin]'); if (!els.length || !motionOK()) return;
    var pending = false;
    function update() {
      pending = false;
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.getAttribute('data-spin')) || 0.05;
        el.style.transform = 'rotate(' + ((r.top + r.height / 2 - vh / 2) * k).toFixed(2) + 'deg)';
      });
    }
    window.addEventListener('scroll', function () { if (!pending) { pending = true; raf(update); } }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------ */
  function boot() {
    [initHeader, initMenu, initReveal, initHero, initScrub, initSpecimens, initFriction, initBuilder, initFeatures, initStages, initAccordion, initSpin]
      .forEach(function (fn) { try { fn(); } catch (err) { root.classList.add('no-anim'); if (window.console) console.warn('[rcf]', fn.name, err); } });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
