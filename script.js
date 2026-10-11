(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#year').textContent = new Date().getFullYear();
  const menuToggle = $('#menuToggle'), nav = $('#nav');
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded)); nav.classList.toggle('open', !expanded);
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); }));

  // Pointer-follow light on cards, chips, and interactive surfaces.
  if (matchMedia('(pointer:fine)').matches && !reducedMotion) {
    $$('.project-card, .credential-card, .core-tool-grid>div, .leadership-strip').forEach(el => {
      el.addEventListener('pointermove', event => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
        el.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
      }, {passive:true});
    });
  }

  // Reveal elements once as they enter view, with a lightweight fallback.
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), {threshold:0.12, rootMargin:'0px 0px -35px 0px'});
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add('in-view'));
  // Progress line follows the page without a scroll library.
  const progress = $('#progress'); let scrollTick = false;
  function updateProgress(){ const max = document.documentElement.scrollHeight - innerHeight; progress.style.width = `${max > 0 ? scrollY/max*100 : 0}%`; scrollTick = false; }
  addEventListener('scroll', () => { if(!scrollTick){ requestAnimationFrame(updateProgress); scrollTick = true; } }, {passive:true}); updateProgress();
  // Functional project filtering with accessible selected states.
  const filters = $$('.filter'), cards = $$('.project-card');
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.category.split(' ').includes(filter);
      if(show){ card.classList.remove('is-hidden'); card.classList.remove('in-view'); requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('in-view'))); }
      else card.classList.add('is-hidden');
    });
  }));
  filters.forEach(b => b.setAttribute('aria-pressed', String(b.classList.contains('active'))));
  // Email form prepares a real mailto draft; it never pretends to submit to a server.
  const toast = $('#toast'); let toastTimer;
  function showToast(message){ toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),3500); }
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    const subject = String(form.get('subject')).trim();
    const body = `Name: ${String(form.get('name')).trim()}\nEmail: ${String(form.get('email')).trim()}\n\n${String(form.get('message')).trim()}`;
    const url = `mailto:sarathivarma2005@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showToast('Opening your email app with the message prepared.'); window.location.href = url;
  });
  // A restrained pointer glow on desktop only; no 3D effects.
  const glow = $('.cursor-glow');
  if(glow && matchMedia('(pointer:fine)').matches && !reducedMotion){ let raf=false, x=0,y=0; addEventListener('pointermove', e=>{x=e.clientX;y=e.clientY;if(!raf){requestAnimationFrame(()=>{glow.style.left=x+'px';glow.style.top=y+'px';raf=false;});raf=true;}},{passive:true}); }
  // Smooth navigation for older browsers, keeping native hash destinations intact.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', e => {
    const target = $(link.getAttribute('href')); if(!target) return;
    e.preventDefault(); target.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
    history.replaceState(null,'',link.getAttribute('href'));
  }));
  // Theme rope: non-repeating smooth wind noise + damped pendulum physics.
  const themeToggle = $('#themeToggle');
  const ropeVisual = $('.rope-visual', themeToggle);
  const ropeThread = $('.rope-thread', themeToggle);
  const ropeKnob = $('.rope-pull', themeToggle);
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionReduced = reducedMotionQuery.matches;
  const finePointerQuery = window.matchMedia('(pointer: fine)');
  const savedTheme = (() => { try { return localStorage.getItem('parthasarathi-theme'); } catch (_) { return null; } })();
  function setTheme(theme){
    document.body.dataset.theme = theme;
    const dark = theme === 'dark';
    themeToggle.setAttribute('aria-label', dark ? 'Pull the cord to switch to light theme' : 'Pull the cord to switch to dark theme');
    themeToggle.setAttribute('aria-pressed', String(dark));
    $('.theme-label', themeToggle).textContent = dark ? 'LIGHT' : 'DARK';
    themeToggle.classList.toggle('rope-pulled', !dark);
    const metaTheme = $('meta[name="theme-color"]'); if(metaTheme) metaTheme.content = dark ? '#171a19' : '#f3efe7';
    try { localStorage.setItem('parthasarathi-theme', theme); } catch (_) {}
  }
  setTheme(savedTheme || 'dark');

  let angle = 0, angularVelocity = 0, knobAngle = 0, knobVelocity = 0;
  let pullY = 0, pullVelocity = 0, pullTarget = 0;
  let dragging = false, dragStartY = 0, dragStartX = 0, lastDragX = 0, pointerId = null, draggedEnough = false;
  let lastFrame = 0, rafId = 0, inViewport = true, pageVisible = !document.hidden;
  let lastPointer = null, lastScrollY = window.scrollY, lastScrollAt = performance.now();
  let scrollImpulse = 0;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const radians = d => d * Math.PI / 180;
  const degrees = r => r * 180 / Math.PI;

  // Smooth interpolated value noise: random lattice values are never looped/replayed.
  const noiseHash = (n, salt=0) => {
    const x = Math.sin((n + 1) * 127.1 + salt * 311.7) * 43758.5453123;
    return (x - Math.floor(x)) * 2 - 1;
  };
  function valueNoise(time, interval, salt=0){
    const position = time / interval;
    const index = Math.floor(position);
    const fraction = position - index;
    const smooth = fraction * fraction * (3 - 2 * fraction);
    return noiseHash(index, salt) * (1 - smooth) + noiseHash(index + 1, salt) * smooth;
  }
  function windAt(time){
    return clamp(valueNoise(time, 4.8, 1) * .72 + valueNoise(time, 1.9, 7) * .28, -1, 1);
  }
  function toggleTheme(){
    setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
    showToast(document.body.dataset.theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled');
  }
  function renderRope(){
    ropeVisual.style.transform = `translateX(-50%) rotate(${degrees(angle)}deg)`;
    ropeKnob.style.transform = `translate(-50%, ${pullY}px) rotate(${knobAngle}deg)`;
    themeToggle.style.setProperty('--rope-pull-y', `${pullY}px`);
  }
  function stopRopeFrame(){ if(rafId){ cancelAnimationFrame(rafId); rafId=0; } lastFrame=0; }
  function startRopeFrame(){ if(!motionReduced && inViewport && pageVisible && !rafId) rafId=requestAnimationFrame(animateRope); }
  function animateRope(timestamp){
    rafId = 0;
    if(motionReduced || !inViewport || !pageVisible || !ropeVisual) return;
    const dt = lastFrame ? clamp((timestamp - lastFrame) / 1000, .001, .032) : 1 / 60;
    lastFrame = timestamp;
    const seconds = timestamp / 1000;

    if(!dragging){
      // Wind target drifts between roughly 2° and 8°; the spring makes motion lag naturally.
      const wind = windAt(seconds);
      const gustMagnitude = 2 + Math.abs(wind) * 6;
      const windTarget = radians((wind < 0 ? -1 : 1) * gustMagnitude);
      const springStrength = 10.5;
      const angularDamping = 4.6;
      const angularAcceleration = springStrength * (windTarget - angle) - angularDamping * angularVelocity;
      angularVelocity += angularAcceleration * dt;
      angle += angularVelocity * dt;

      // Secondary weight motion: the knob follows the cord with a slight spring lag.
      const knobTarget = -degrees(angle) * .2;
      knobVelocity += ((knobTarget - knobAngle) * 20 - knobVelocity * 5.8) * dt;
      knobAngle += knobVelocity * dt;

      // Pull stretch returns with a damped elastic overshoot after release.
      pullVelocity += ((pullTarget - pullY) * 125 - pullVelocity * 17) * dt;
      pullY += pullVelocity * dt;
      pullY = clamp(pullY, -3.5, 48);
      if (pullY < 0 && pullTarget === 0 && pullY > -.25 && Math.abs(pullVelocity) < 3) { pullY = 0; pullVelocity = 0; }
    }

    // Scroll impulse is an acceleration, not a per-frame velocity jump.
    angularVelocity += scrollImpulse * dt;
    scrollImpulse *= Math.exp(-5.5 * dt);
    renderRope();
    rafId = requestAnimationFrame(animateRope);
  }

  if ('IntersectionObserver' in window) {
    const ropeObserver = new IntersectionObserver(entries => {
      inViewport = entries[0]?.isIntersecting ?? true;
      if(inViewport) startRopeFrame(); else stopRopeFrame();
    }, {threshold:0.01});
    ropeObserver.observe(themeToggle);
  }
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if(pageVisible) startRopeFrame(); else stopRopeFrame();
  });
  if(!motionReduced) startRopeFrame();
  reducedMotionQuery.addEventListener?.('change', event => {
    motionReduced = event.matches;
    if(event.matches){
      stopRopeFrame(); angle = 0; angularVelocity = 0; knobAngle = 0; knobVelocity = 0;
      pullY = 0; pullVelocity = 0; pullTarget = 0; renderRope();
    } else startRopeFrame();
  });

  // Pointer proximity pushes the pendulum in the direction the pointer travels.
  if(finePointerQuery.matches && !motionReduced){
    document.addEventListener('pointermove', event => {
      const rect = themeToggle.getBoundingClientRect();
      const now = performance.now();
      if(!lastPointer){ lastPointer = {x:event.clientX, y:event.clientY, t:now}; return; }
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      const elapsed = Math.max(8, now - lastPointer.t);
      const anchorX = rect.left + rect.width / 2;
      const anchorY = rect.top + 2;
      const nearX = Math.abs(event.clientX - anchorX);
      const nearY = event.clientY - anchorY;
      const near = nearX < 34 && nearY > -12 && nearY < 74;
      if(near && !dragging){
        const proximity = (1 - nearX / 34) * (1 - clamp(Math.max(0, nearY) / 74, 0, 1) * .45);
        const horizontalSpeed = clamp(dx / elapsed, -2.5, 2.5);
        const verticalSpeed = clamp(dy / elapsed, -2.5, 2.5);
        angularVelocity += (horizontalSpeed * .055 + verticalSpeed * .012) * proximity;
        startRopeFrame();
      }
      lastPointer = {x:event.clientX, y:event.clientY, t:now};
    }, {passive:true});
  }

  // Fast scrolling adds a short, damped sway proportional to scroll velocity.
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const dy = window.scrollY - lastScrollY;
    const elapsed = Math.max(12, now - lastScrollAt);
    const velocity = dy / elapsed;
    if(!motionReduced) scrollImpulse += clamp(velocity * .012, -1.1, 1.1);
    lastScrollY = window.scrollY; lastScrollAt = now;
    updateBackToTop();
  }, {passive:true});

  themeToggle.addEventListener('pointerdown', event => {
    if(event.button !== undefined && event.button !== 0) return;
    dragging = true; draggedEnough = false; dragStartY = event.clientY; dragStartX = event.clientX; lastDragX = event.clientX; pointerId = event.pointerId;
    themeToggle.classList.add('rope-grabbing');
    try { themeToggle.setPointerCapture(event.pointerId); } catch (_) {}
    startRopeFrame();
  });
  themeToggle.addEventListener('pointermove', event => {
    if(!dragging || (pointerId !== null && event.pointerId !== pointerId)) return;
    const dy = event.clientY - dragStartY;
    const dx = event.clientX - dragStartX;
    const frameDx = event.clientX - lastDragX;
    lastDragX = event.clientX;
    pullTarget = clamp(dy, 0, 48);
    pullY = pullTarget;
    if(Math.abs(dy) > 5 || Math.abs(dx) > 5) draggedEnough = true;
    angularVelocity += clamp(frameDx * .0025, -.045, .045);
    knobAngle = clamp(dx * .22, -12, 12);
    themeToggle.style.setProperty('--rope-pull-y', `${pullY}px`);
    renderRope();
  });
  function finishRopeDrag(event){
    if(!dragging || (event && pointerId !== null && event.pointerId !== pointerId)) return;
    const dy = event ? event.clientY - dragStartY : 0;
    const shouldToggle = dy > 16;
    dragging = false; pointerId = null; pullTarget = 0;
    themeToggle.classList.remove('rope-grabbing');
    if(motionReduced){
      pullY = 0; pullVelocity = 0; angle = 0; angularVelocity = 0; knobAngle = 0; knobVelocity = 0; renderRope();
    } else {
      pullY = clamp(pullY, 0, 48);
      pullVelocity = -Math.max(125, pullY * 5.2);
      angularVelocity += radians(clamp(dy * .12, -7, 7));
    }
    if(shouldToggle){ toggleTheme(); themeToggle.dataset.skipNextClick = 'true'; }
    startRopeFrame();
  }
  themeToggle.addEventListener('pointerup', finishRopeDrag);
  themeToggle.addEventListener('pointercancel', () => {
    if(!dragging) return;
    dragging = false; pointerId = null; pullTarget = 0; themeToggle.classList.remove('rope-grabbing');
    if(motionReduced){ pullY = 0; pullVelocity = 0; renderRope(); }
    else pullVelocity = -Math.max(100, pullY * 4);
    startRopeFrame();
  });
  themeToggle.addEventListener('click', event => {
    if(themeToggle.dataset.skipNextClick === 'true'){ delete themeToggle.dataset.skipNextClick; event.preventDefault(); return; }
    toggleTheme();
  });
  // Native button activation preserves Enter/Space keyboard support.

  // Back-to-top remains discoverable while scrolling and is keyboard accessible.
  const backToTop = $('#backToTop');
  function updateBackToTop(){ if(backToTop) backToTop.classList.toggle('is-visible', window.scrollY > 320); }
  if(backToTop){
    backToTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'}));
    updateBackToTop();
  }

  // Clicking the phone contact copies the number and opens the device dialler via tel:.
  const phoneContact = $('.phone-contact');
  if (phoneContact) phoneContact.addEventListener('click', async event => {
    event.preventDefault();
    const number = phoneContact.dataset.phone || '+91 96293 50583';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
        showToast('Phone number copied. Opening dialler…');
      } else {
        const copyField = document.createElement('textarea');
        copyField.value = number; copyField.setAttribute('readonly','');
        copyField.style.position='fixed'; copyField.style.opacity='0'; document.body.appendChild(copyField);
        copyField.select(); document.execCommand('copy'); copyField.remove();
        showToast('Phone number copied. Opening dialler…');
      }
    } catch (_) { showToast('Opening phone dialler…'); }
    window.location.href = phoneContact.href;
  });

  // Cinematic heading reveals: use CSS clipping so real text remains selectable and accessible.
  $$('.hero h1, .section-head h2, .contact h2').forEach((heading, index) => {
    heading.classList.add('cinematic-heading');
    heading.style.setProperty('--heading-delay', `${Math.min(index * 45, 270)}ms`);
  });

  // Stagger direct children as a group enters view, creating a more editorial reveal rhythm.
  $$('.about-grid, .skills-layout, .project-grid, .credential-grid, .contact-layout').forEach(group => {
    group.classList.add('stagger-group');
    [...group.children].forEach((child, index) => child.style.setProperty('--stagger-index', index));
  });

  // Magnetic micro-interaction for primary buttons on fine pointers only.
  const magneticItems = $$('.magnetic, .nav-resume, .project-foot a');
  if (matchMedia('(pointer:fine)').matches && !reducedMotion) {
    magneticItems.forEach(item => {
      item.addEventListener('pointermove', event => {
        const rect = item.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        item.style.setProperty('--mag-x', `${Math.max(-7, Math.min(7, dx * .12))}px`);
        item.style.setProperty('--mag-y', `${Math.max(-5, Math.min(5, dy * .12))}px`);
      });
      item.addEventListener('pointerleave', () => {
        item.style.setProperty('--mag-x', '0px');
        item.style.setProperty('--mag-y', '0px');
      });
    });
  }

  // Pointer-aware card highlight and restrained 2D image drift; no 3D transforms.
  const finePointer = matchMedia('(pointer:fine)').matches;
  if (finePointer && !reducedMotion) {
    $$('.project-card, .credential-card, .leadership-strip').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      }, {passive:true});
    });
    $$('.project-cover').forEach(cover => {
      cover.addEventListener('pointermove', event => {
        const rect = cover.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        cover.style.setProperty('--image-drift-x', `${x * -8}px`);
        cover.style.setProperty('--image-drift-y', `${y * -8}px`);
      }, {passive:true});
      cover.addEventListener('pointerleave', () => {
        cover.style.setProperty('--image-drift-x', '0px');
        cover.style.setProperty('--image-drift-y', '0px');
      });
    });
  }

  // Scroll-linked portrait parallax is throttled to one animation frame and disabled on mobile/reduced motion.
  const heroVisual = $('.hero-visual');
  if (heroVisual && !reducedMotion && matchMedia('(min-width: 761px)').matches) {
    let parallaxPending = false;
    const updateParallax = () => {
      const rect = heroVisual.getBoundingClientRect();
      const centerOffset = (rect.top + rect.height / 2 - innerHeight / 2) / Math.max(innerHeight, 1);
      heroVisual.style.setProperty('--portrait-parallax', `${Math.max(-18, Math.min(18, centerOffset * -30))}px`);
      parallaxPending = false;
    };
    addEventListener('scroll', () => {
      if (!parallaxPending) { requestAnimationFrame(updateParallax); parallaxPending = true; }
    }, {passive:true});
    updateParallax();
  }

  // Cursor glow gets a subtle coral tint in dark mode while remaining decorative and non-interactive.
  if (glow && finePointer && !reducedMotion) {
    document.body.classList.add('has-fine-pointer');
  }


  // Motion-graphic pointer response: move the decorative orbit field gently, never the text.
  const motionWorld = $('.motion-graphic-world');
  if (motionWorld && matchMedia('(pointer:fine)').matches && !reducedMotion) {
    let motionRaf = false, mx = 0, my = 0;
    addEventListener('pointermove', event => {
      mx = (event.clientX / Math.max(innerWidth, 1) - .5) * 16;
      my = (event.clientY / Math.max(innerHeight, 1) - .5) * 12;
      if (!motionRaf) {
        requestAnimationFrame(() => {
          motionWorld.style.setProperty('--motion-pointer-x', `${mx}px`);
          motionWorld.style.setProperty('--motion-pointer-y', `${my}px`);
          motionWorld.querySelectorAll('.motion-orbit').forEach((orbit, index) => {
            orbit.style.translate = `${mx * (index ? -.35 : .5)}px ${my * (index ? -.35 : .5)}px`;
          });
          motionRaf = false;
        });
        motionRaf = true;
      }
    }, {passive:true});
  }

  // Highlight the section currently in view for clearer navigation feedback.
  const navLinks = $$('#nav a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, {rootMargin:'-30% 0px -58% 0px', threshold:0});
    $$('main section[id]').forEach(section => sectionObserver.observe(section));
  }

  // Short transition cue for navigation and a press feedback effect for clickable controls.
  const transitionLayer = $('#pageTransition');
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    if(!reducedMotion && transitionLayer){
      transitionLayer.classList.remove('active');
      requestAnimationFrame(() => { transitionLayer.classList.add('active'); setTimeout(() => transitionLayer.classList.remove('active'), 420); });
    }
  }));
  $$('a, button').forEach(el => el.addEventListener('pointerdown', () => {
    if(!reducedMotion) { el.classList.remove('press-feedback'); void el.offsetWidth; el.classList.add('press-feedback'); setTimeout(() => el.classList.remove('press-feedback'), 260); }
  }));
})();
