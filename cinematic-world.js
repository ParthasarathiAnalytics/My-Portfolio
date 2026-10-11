const threeModuleUrl = 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

(async () => {
  const canvas = document.getElementById('cinematic-world');
  if (!canvas || !window.matchMedia('(min-width: 700px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('cinematic-fallback');
    return;
  }
  let THREE;
  try { THREE = await import(threeModuleUrl); } catch (error) { document.documentElement.classList.add('cinematic-fallback'); return; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (error) {
    document.documentElement.classList.add('cinematic-fallback');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const uniforms = {
    uTime: { value: 0 }, uScroll: { value: 0 }, uPointer: { value: new THREE.Vector2(.5, .5) },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }, uDark: { value: 0 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `void main(){ gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform float uTime; uniform float uScroll; uniform vec2 uPointer; uniform vec2 uResolution; uniform float uDark;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
      void main(){
        vec2 uv=gl_FragCoord.xy/uResolution; vec2 p=uv-.5; p.x*=uResolution.x/uResolution.y;
        float t=uTime*.08; float scroll=uScroll;
        vec2 pointer=(uPointer-.5)*.10; p-=pointer;
        float wave=sin(p.x*3.0 + p.y*2.1 + t + scroll*7.2)*.16;
        float ribbon=exp(-abs(p.y - wave - sin(p.x*1.6-scroll*2.8)*.12)*13.0);
        float ribbon2=exp(-abs(p.y + .27 + cos(p.x*2.3+t*.7+scroll*4.0)*.09)*19.0);
        float bloom=exp(-length(p-vec2(sin(scroll*6.283)*.35, cos(scroll*4.1)*.22)) * 3.1);
        float grain=(noise(uv*uResolution*.42 + uTime)-.5)*.055;
        vec3 warm=vec3(.82,.31,.22); vec3 cool=vec3(.18,.55,.58); vec3 cream=vec3(.75,.66,.53);
        vec3 col=mix(warm,cool,.5+.5*sin(scroll*6.283 + p.x*1.8));
        float glow=(ribbon*.14+ribbon2*.08+bloom*.055);
        col=mix(col,cream,.22 + .28*sin(scroll*3.14));
        float alpha=clamp(glow+grain*.45,0.,.22);
        alpha*=mix(.42,1.0,uDark);
        gl_FragColor=vec4(col*glow + vec3(max(grain,0.0)), alpha);
      }`
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(plane);

  // Fine floating light points make the background feel like a continuous film space.
  const count = 240;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i=0; i<count; i++) {
    positions[i*3] = (Math.random()-.5)*2.4;
    positions[i*3+1] = (Math.random()-.5)*2.0;
    positions[i*3+2] = Math.random()*.8;
    phases[i] = Math.random()*Math.PI*2;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({ color: 0xe99a7b, size: 1.5, sizeAttenuation: false, transparent: true, opacity: .28, depthWrite: false });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Art-directed 3D motion layer: a fine wireframe knot and orbit rings create
  // a looping, video-like dimensional scene without a large video download.
  // It remains behind the page content and responds gently to scroll + pointer.
  const knotMaterial = new THREE.MeshBasicMaterial({
    color: 0xe88b6e, wireframe: true, transparent: true, opacity: 0.24,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.43, 0.012, 180, 8, 2, 3), knotMaterial);
  knot.position.set(0.63, 0.12, -0.35);
  knot.scale.set(0.9, 0.9, 0.9);
  scene.add(knot);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x7eb8b0, wireframe: true, transparent: true, opacity: 0.16,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.006, 6, 120), ringMaterial);
  orbit.position.set(0.63, 0.12, -0.31);
  orbit.rotation.set(0.85, 0.25, -0.35);
  scene.add(orbit);
  const orbitInner = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.004, 5, 100), ringMaterial.clone());
  orbitInner.material.opacity = 0.12;
  orbitInner.position.copy(orbit.position);
  orbitInner.rotation.set(-0.55, 0.7, 0.3);
  scene.add(orbitInner);

  let targetScroll = 0, smoothScroll = 0, pointerX=.5, pointerY=.5, targetPointerX=.5, targetPointerY=.5;
  let raf = 0, running = true, lastTime = 0;
  const sections = [...document.querySelectorAll('.cinematic-scene')];
  const getScrollProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    targetScroll = Math.min(1, Math.max(0, scrollY / max));
  };
  const onPointer = e => { targetPointerX=e.clientX/innerWidth; targetPointerY=1-e.clientY/innerHeight; };
  const onResize = () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  };
  const setTheme = () => { uniforms.uDark.value = document.body.dataset.theme === 'dark' ? 1 : 0; };
  const observer = new MutationObserver(setTheme); observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] }); setTheme();
  const draw = now => {
    raf = 0; if (!running) return;
    if (now-lastTime < 28) { raf=requestAnimationFrame(draw); return; }
    const dt = Math.min(.05, (now-lastTime)/1000 || .016); lastTime=now;
    smoothScroll += (targetScroll-smoothScroll) * Math.min(1, dt*2.5);
    pointerX += (targetPointerX-pointerX)*.045; pointerY += (targetPointerY-pointerY)*.045;
    uniforms.uTime.value = now*.001;
    uniforms.uScroll.value = smoothScroll;
    uniforms.uPointer.value.set(pointerX,pointerY);
    particles.rotation.y = (pointerX-.5)*.12 + smoothScroll*.35;
    particles.rotation.x = (pointerY-.5)*.08 - smoothScroll*.2;
    particleMaterial.opacity = .15 + .15*(.5+.5*Math.sin(now*.0004));
    knot.rotation.x = now*.00013 + pointerY*.18;
    knot.rotation.y = now*.00019 + smoothScroll*1.8 + (pointerX-.5)*.25;
    knot.rotation.z = Math.sin(now*.00022)*.12 + smoothScroll*.45;
    knot.position.y = .12 + Math.sin(now*.00045)*.045 + (pointerY-.5)*.045;
    knot.scale.setScalar(.9 + Math.sin(now*.0003)*.035 + smoothScroll*.025);
    orbit.rotation.z += dt*.055 + (targetScroll-smoothScroll)*.08;
    orbit.rotation.x = .85 + (pointerY-.5)*.14;
    orbitInner.rotation.y -= dt*.04;
    orbitInner.rotation.z = .3 + smoothScroll*.6;
    renderer.render(scene,camera);
    raf=requestAnimationFrame(draw);
  };
  const onVisibility = () => {
    running = !document.hidden;
    if (running && !raf) { lastTime=0; raf=requestAnimationFrame(draw); }
    if (!running && raf) { cancelAnimationFrame(raf); raf=0; }
  };
  addEventListener('scroll',getScrollProgress,{passive:true});
  addEventListener('pointermove',onPointer,{passive:true});
  addEventListener('resize',onResize,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);
  getScrollProgress(); onResize(); raf=requestAnimationFrame(draw);

  // Every scene becomes a chapter: scroll progress is normalized per section and drives subtle depth.
  const updateScenes = () => {
    const mid = innerHeight*.56;
    sections.forEach((section,index) => {
      const rect=section.getBoundingClientRect();
      const progress=Math.max(0,Math.min(1,(mid-rect.top)/(Math.max(1,rect.height))));
      section.style.setProperty('--scene-progress',progress.toFixed(3));
      section.style.setProperty('--scene-index',index);
      section.style.setProperty('--scene-shift', `${(0.5-progress)*10}px`);
      section.style.setProperty('--scene-line-scale', (0.35+progress*0.65).toFixed(3));
      section.style.setProperty('--scene-card-y', `${(0.5-progress)*6}px`);
      section.classList.toggle('scene-active',rect.top < mid && rect.bottom > mid);
    });
  };
  let sceneRaf=0;
  addEventListener('scroll',()=>{if(!sceneRaf){sceneRaf=requestAnimationFrame(()=>{updateScenes();sceneRaf=0;});}},{passive:true});
  updateScenes();
})();
