import {useEffect, useRef, useState} from 'react';

const INTERACTIVE = 'a, button, input, textarea, select, [role="button"], [tabindex="0"]';

function Firefly() {
  return <svg viewBox="0 0 64 64" className="firefly-art">
    <defs><radialGradient id="fly-glow"><stop stopColor="#fff9c0"/><stop offset="1" stopColor="#ffbf52"/></radialGradient><linearGradient id="fly-wing" x2="1" y2="1"><stop stopColor="#baffdf" stopOpacity=".85"/><stop offset="1" stopColor="#5ce0ca" stopOpacity=".25"/></linearGradient></defs>
    <g className="firefly-wings" fill="url(#fly-wing)" stroke="#b5f6d8" strokeWidth="1"><ellipse cx="20" cy="25" rx="11" ry="17" transform="rotate(-35 20 25)"/><ellipse cx="44" cy="25" rx="11" ry="17" transform="rotate(35 44 25)"/><path d="m21 19-6 5 6 5m22-10 6 5-6 5" fill="none" stroke="#efffe8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></g>
    <ellipse className="firefly-lantern" cx="32" cy="44" rx="8" ry="12" fill="url(#fly-glow)"/><path d="M25 42h14m-13 6h12" stroke="#fff7c8" strokeOpacity=".6" fill="none"/>
    <path d="M28 24q-9-13-12-12m20 12q9-13 12-12" stroke="#efcc80" strokeWidth="1.5" fill="none"/><circle cx="16" cy="12" r="2" fill="#ffe3a0"/><circle cx="48" cy="12" r="2" fill="#ffe3a0"/>
    <ellipse cx="32" cy="29" rx="9" ry="8" fill="#293c34"/><circle cx="28" cy="27" r="2.6" fill="#ffe2a3"/><circle cx="36" cy="27" r="2.6" fill="#ffe2a3"/><circle cx="28" cy="27" r="1.3" fill="#15201c"/><circle cx="36" cy="27" r="1.3" fill="#15201c"/><path d="M30 32q2 2 4 0" stroke="#ffd8a2" fill="none" strokeLinecap="round"/>
  </svg>;
}

export default function CustomCursor() {
  const rootRef = useRef(null);
  const flyRef = useRef(null);
  const frogRef = useRef(null);
  const canvasRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const tongueSvgRef = useRef(null);
  const tongueRef = useRef(null);
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const root = rootRef.current, fly = flyRef.current, frog = frogRef.current;
    const tongue = tongueRef.current, tongueSvg = tongueSvgRef.current;
    const canvas = canvasRef.current;
    let ctx;
    try {
      ctx = canvas?.getContext('2d');
    } catch {
      return;
    }
    if (!root || !fly || !frog || !tongue || !tongueSvg || !canvas || !ctx) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let stop = () => {};
    function start() {
      let frame = 0, visible = false, catchStart = 0, nextCatch = 0;
      let supported = true;
      let particles = [], target = null;
      let nextBlink = performance.now()+1800, blinkStart = 0, doubleBlink = false;
      const mouse = { x: 0, y: 0 };
      const resize = () => {
        try {
          const ratio = Math.min(devicePixelRatio || 1, 2);
          canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio;
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          resetCatch();
        } catch {
          supported = false;
          hide();
        }
      };
      const place = (x, y) => { fly.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; };
      const resetCatch = () => {
        catchStart = 0; target = null; root.dataset.phase = 'idle';
        fly.style.opacity = '1';
        tongue.setAttribute('d', '');
      };
      const schedule = () => {
        try {
          frame = requestAnimationFrame(draw);
        } catch {
          supported = false;
          hide();
        }
      };
      const draw = (now) => {
        try {
        if (!visible) return;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        if (!catchStart && !blinkStart && now >= nextBlink) {
          blinkStart = now; doubleBlink = Math.random() < .3;
        }
        if (blinkStart) {
          const age = now-blinkStart;
          const closed = age < 150 || (doubleBlink && age >= 260 && age < 400);
          root.classList.toggle('is-blinking', closed && !catchStart);
          if (age >= (doubleBlink ? 400 : 150)) {
            blinkStart=0;nextBlink=now+2800+Math.random()*3000;
          }
        }
        particles = particles.filter(p => now - p.time < 650);
        for (const p of particles) {
          const life = 1 - (now - p.time) / 650;
          ctx.beginPath(); ctx.arc(p.x, p.y - (1-life)*12, p.size*life, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,211,117,${life*.65})`; ctx.shadowColor='#ffc761';ctx.shadowBlur=9;ctx.fill();
        }
        ctx.shadowBlur = 0;
        if (!catchStart && innerWidth >= 900 && now >= nextCatch) {
          nextCatch = now+5000;
          catchStart = now; target = { ...mouse }; root.dataset.phase = 'catching';root.classList.remove('is-blinking');
        }
        if (catchStart) {
          const elapsed = now-catchStart;
          // The tongue and mouth share the same artwork coordinates and transforms.
          const matrix = tongueSvg.getScreenCTM();
          const mouthLocal = new DOMPoint(660, 518);
          const mouth = mouthLocal.matrixTransform(matrix);
          // Open first, extend, retract into the mouth, then swallow.
          const shot = elapsed-140;
          if (shot < 260) target = { ...mouse };
          const progress = shot < 0 ? 0 : shot < 260 ? shot/260 : shot < 640 ? 1-(shot-260)/380 : 0;
          const reach = progress*progress*(3-2*progress);
          if (reach > 0) {
            const x=mouth.x+(target.x-mouth.x)*reach, y=mouth.y+(target.y-mouth.y)*reach;
            const inverse = matrix.inverse();
            const tip = new DOMPoint(x,y).matrixTransform(inverse);
            const bend = new DOMPoint((mouth.x+x)/2,(mouth.y+y)/2+Math.sin(progress*Math.PI)*12).matrixTransform(inverse);
            tongue.setAttribute('d', `M ${mouthLocal.x} ${mouthLocal.y} Q ${bend.x} ${bend.y} ${tip.x} ${tip.y}`);
            if (shot >= 260) place(x,y);
          }
          if (elapsed >= 780 && elapsed < 1000) {tongue.setAttribute('d','');root.dataset.phase='swallowing';fly.style.opacity='0';}
          if (elapsed >= 1000 && elapsed < 1900) { root.dataset.phase='celebrating';fly.style.opacity='0'; }
          if (elapsed >= 1900) { resetCatch();place(mouse.x,mouse.y); }
        }
        // Track the actual animated firefly, including its trip into the mouth.
        const flyBounds = fly.getBoundingClientRect();
        const gaze = { x: flyBounds.left+flyBounds.width/2, y: flyBounds.top+flyBounds.height/2 };
        const body = frog.querySelector('.frog-body').getBoundingClientRect();
        [[leftEyeRef.current,.398,.263],[rightEyeRef.current,.636,.345]].forEach(([eye,x,y]) => {
          const dx=gaze.x-(body.left+body.width*x), dy=gaze.y-(body.top+body.height*y);
          const distance=Math.hypot(dx,dy);
          const strength=Math.min(distance/100,1);
          const angle=25*Math.PI/180;
          const localX=dx*Math.cos(angle)+dy*Math.sin(angle), localY=-dx*Math.sin(angle)+dy*Math.cos(angle);
          eye.setAttribute('transform', `translate(${distance ? localX/distance*12*strength : 0} ${distance ? localY/distance*14*strength : 0})`);
        });
        if (!catchStart) frog.style.setProperty('--frog-look', `${Math.max(-5,Math.min(5,(gaze.x-body.left-body.width/2)/100))}deg`);
        schedule();
        } catch {
          supported = false;
          hide();
        }
      };
      const move = e => {
        if (!supported) return;
        if(e.pointerType !== 'mouse') return;
        const now=performance.now();
        fly.style.setProperty('--fly-tilt', `${Math.max(-18, Math.min(18, (e.clientX-mouse.x)*.6))}deg`);
        mouse.x=e.clientX;mouse.y=e.clientY;
        if (!catchStart || now-catchStart < 400) place(mouse.x,mouse.y);
        root.style.setProperty('--pointer-x',`${mouse.x}px`);root.style.setProperty('--pointer-y',`${mouse.y}px`);
        const interactive=Boolean(e.target instanceof Element && e.target.closest(INTERACTIVE));
        root.classList.toggle('is-interactive',interactive);
        particles.push({x:mouse.x,y:mouse.y+10,time:now,size:1+Math.random()*1.6});
        if(particles.length>90)particles.shift();
        if(!visible){nextBlink=now+1800;visible=true;root.style.opacity='1';document.body.classList.add('custom-cursor-active');nextCatch=now+5000;schedule();}
      };
      const hide = () => {
        visible = false;
        root.style.opacity = '0';
        root.classList.remove('is-pressed', 'is-blinking');
        blinkStart = 0;
        document.body.classList.remove('custom-cursor-active');
        try { cancelAnimationFrame(frame); } catch { /* The native cursor is already restored. */ }
        particles = [];
        try { ctx.clearRect(0, 0, innerWidth, innerHeight); } catch { /* Keep the native cursor available. */ }
        resetCatch();
      };
      const key = e => {if(e.key==='Tab')hide();};
      const visibility = () => {if(document.hidden)hide();};
      const press = () => {root.classList.add('is-pressed');};
      const release = () => root.classList.remove('is-pressed');
      resize();root.classList.add('is-enabled');
      window.addEventListener('pointermove',move,{passive:true});
      window.addEventListener('pointerdown',press);window.addEventListener('pointerup',release);
      window.addEventListener('blur',hide);window.addEventListener('keydown',key);
      window.addEventListener('resize',resize);
      document.addEventListener('pointerleave',hide);document.addEventListener('visibilitychange',visibility);
      return () => {hide();root.classList.remove('is-enabled','is-interactive','is-pressed');window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',press);window.removeEventListener('pointerup',release);window.removeEventListener('blur',hide);window.removeEventListener('keydown',key);window.removeEventListener('resize',resize);document.removeEventListener('pointerleave',hide);document.removeEventListener('visibilitychange',visibility);};
    }
    const update = () => {stop();stop=enabled && fine.matches && !reduced.matches ? start() : () => {};};
    update();fine.addEventListener('change',update);reduced.addEventListener('change',update);
    return () => {stop();fine.removeEventListener('change',update);reduced.removeEventListener('change',update);};
  }, [enabled]);
  return <>
    <div ref={rootRef} className="custom-cursor firefly-scene" data-phase="idle" aria-hidden="true">
      <canvas ref={canvasRef} className="firefly-trail" />
      <span className="firefly-hotspot" />
      <span ref={flyRef} className="firefly"><Firefly /></span>
      <div ref={frogRef} className="lotus-frog"><div className="frog-body"><img className="frog-open" src={`${import.meta.env.BASE_URL}lotus-frog.png`} alt="" /><img className="frog-blink" src={`${import.meta.env.BASE_URL}lotus-frog-blink.png`} alt="" /><img className="frog-catch" src={`${import.meta.env.BASE_URL}lotus-frog-catch.png`} alt="" /><svg className="frog-eyes" viewBox="0 0 1000 818">
        <defs>
          <radialGradient id="frog-eye-white" cx=".35" cy=".25"><stop stopColor="#fff9d7"/><stop offset="1" stopColor="#d6d5a5"/></radialGradient>
          <radialGradient id="frog-pupil" cx=".5" cy=".85"><stop stopColor="#a67418"/><stop offset=".48" stopColor="#3b2109"/><stop offset="1" stopColor="#130e07"/></radialGradient>
        </defs>
        <g transform="translate(398 215) rotate(25)">
          <ellipse rx="53" ry="61" fill="url(#frog-eye-white)"/>
          <g ref={leftEyeRef}><ellipse rx="33" ry="43" fill="url(#frog-pupil)"/><ellipse cx="-10" cy="-22" rx="11" ry="8" fill="#fffce8"/><circle cx="13" cy="-10" r="6" fill="#fffce8"/></g>
        </g>
        <g transform="translate(636 282) rotate(25)">
          <ellipse rx="57" ry="61" fill="url(#frog-eye-white)"/>
          <g ref={rightEyeRef}><ellipse rx="34" ry="43" fill="url(#frog-pupil)"/><ellipse cx="-10" cy="-22" rx="11" ry="8" fill="#fffce8"/><circle cx="13" cy="-10" r="6" fill="#fffce8"/></g>
        </g>
      </svg><svg ref={tongueSvgRef} className="frog-tongue" viewBox="0 0 1402 1122" preserveAspectRatio="none"><path ref={tongueRef} fill="none" stroke="#f3a099" strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg></div><span className="frog-message">bug fixed ✓</span></div>
    </div>
    <button className="mascot-toggle" onClick={() => setEnabled(value=>!value)} aria-pressed={enabled} aria-label={enabled ? 'Turn off firefly cursor and frog' : 'Turn on firefly cursor and frog'}>{enabled ? 'Pause magic' : 'Bring back magic'}<span aria-hidden="true"> ✨</span></button>
  </>;
}
