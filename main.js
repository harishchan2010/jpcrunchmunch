/* assets/main.js — cleaned & fixed
   - Single file; runs safely with DOMContentLoaded or defer
   - Robust DOM queries and event-delegation
*/


const HERO_IMAGE = '1.png';
const LOGO_IMAGE = 'logo.png';
const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/0029Vb2GVo86WaKgwF7Mfu1X';
const WHATSAPP_NUMBER = '9035371303';

const products = [
  { id:1, title:'Garlic Murukku — pouch', price:100, unit:'250g', img:'6.png', desc:'Crispy garlic murukku.' },
  { id:2, title:'Ribbon Murukku — pouch', price:100, unit:'250g', img:'8.png', desc:'Crunchy ribbon murukku.' },
  { id:3, title:'Special Mixture — pouch', price:100, unit:'250g', img:'8.png', desc:'Savory namkeen mix.' },
  { id:4, title:'Dry Fruit Laddoo — box', price:350, unit:'250g', img:'10.png', desc:'Healthy dry fruit laddoo.' }
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function safeOpenWhatsApp(message){
  try {
    const encoded = encodeURIComponent(String(message || 'Hello'));
    if(WHATSAPP_NUMBER && WHATSAPP_NUMBER.trim().length >= 5){
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
      window.open(url, '_blank', 'noopener');
    } else {
      window.open(WHATSAPP_CHANNEL, '_blank', 'noopener');
    }
  } catch (err) {
    console.error('open whatsapp failed', err);
    window.open(WHATSAPP_CHANNEL, '_blank', 'noopener');
  }
}

/* Render product grid with delegation */
function renderGrid(){
  const grid = $('#productGrid');
  if(!grid) return;
  grid.innerHTML = '';
  products.forEach(p => {
    const article = document.createElement('article');
    article.className = 'card product-card';
    article.innerHTML = `
      <div class="thumb" aria-hidden="true"><img src="${p.img}" alt="${p.title}" loading="lazy"></div>
      <h4>${p.title}</h4>
      <div style="color:var(--muted);font-size:13px">${p.unit}</div>
      <p style="color:var(--muted);margin-top:8px;font-size:13px">${p.desc}</p>
      <div class="meta">
        <div class="price">₹${p.price}</div>
        <div class="product-buttons">
          <button class="btn-outline details" data-id="${p.id}">Details</button>
          <button class="btn-cta order" data-title="${encodeURIComponent(p.title)}">Order</button>
        </div>
      </div>
    `;
    grid.appendChild(article);
  });

  // event delegation on grid
  grid.addEventListener('click', (e) => {
    const d = e.target.closest('.details');
    if(d){ openDetails(Number(d.dataset.id)); return; }
    const o = e.target.closest('.order');
    if(o){ safeOpenWhatsApp(`Hi, I want to order: ${decodeURIComponent(o.dataset.title || '')}`); return; }
  });
}

/* Modal */
function openDetails(id){
  const p = products.find(x => x.id === id);
  if(!p) return;
  const modal = $('#modal'), card = $('#modalCard');
  if(!modal || !card) return;
  card.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">
      <img src="${p.img}" alt="${p.title}" style="width:100%;border-radius:10px"/>
      <div>
        <h2 style="margin-top:0">${p.title}</h2>
        <div style="color:var(--muted);margin-bottom:12px">${p.unit} • ₹${p.price}</div>
        <p style="color:var(--muted)">${p.desc}</p>
        <div style="margin-top:14px;display:flex;gap:10px">
          <button id="modalOrder" class="btn-cta">Order on WhatsApp</button>
          <button id="modalClose" class="btn-outline">Close</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');

  const closeBtn = $('#modalClose'); const orderBtn = $('#modalOrder');
  if(closeBtn) closeBtn.addEventListener('click', closeModal, { once:true });
  if(orderBtn) orderBtn.addEventListener('click', () => safeOpenWhatsApp(`I would like to order: ${p.title} (1)`), { once:true });
}

function closeModal(){
  const m = $('#modal');
  if(!m) return;
  m.classList.remove('open'); m.setAttribute('aria-hidden','true');
}

/* Modal overlay clicks & ESC */
function setupModalOverlay(){
  const modal = $('#modal');
  if(!modal) return;
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });
}

/* counters animation using rAF */
function animateCounter(el, target = 0, duration = 1200){
  target = Number(target) || 0;
  if(target <= 0){ el.textContent = '0'; return; }
  let start = 0, startTime = null;
  function step(ts){
    if(!startTime) startTime = ts;
    const progress = Math.min((ts - startTime)/duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = String(value);
    if(progress < 1) requestAnimationFrame(step);
    else el.textContent = String(target);
  }
  requestAnimationFrame(step);
}

function setupCounters(){
  const counters = $$('[data-target]');
  if(!counters.length) return;
  counters.forEach(c => c.textContent = '0');
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        const t = Number(en.target.getAttribute('data-target')) || 0;
        animateCounter(en.target, t, 1400);
        observer.unobserve(en.target);
      }
    });
  }, { threshold: 0.25 });
  counters.forEach(c => obs.observe(c));
}

/* Reviews: horizontal auto-scroll track (fallback fade not needed here) */
function setupReviews(){
  const track = $('.review-track');
  if(!track) return;
  const cards = $$('.review-card', track);
  if(!cards.length) return;

  // duplicate once for smooth infinite scroll (if not already duplicated)
  if(!track.dataset.duplicated){
    track.innerHTML = track.innerHTML + track.innerHTML;
    track.dataset.duplicated = 'true';
  }

  let pos = 0;
  const speed = 0.35; // px per frame approx
  let rafId;
  function step(){
    pos += speed;
    const widthHalf = track.scrollWidth / 2;
    if(widthHalf === 0){ rafId = requestAnimationFrame(step); return; }
    if(pos >= widthHalf) pos = 0;
    track.style.transform = `translateX(-${Math.round(pos)}px)`;
    rafId = requestAnimationFrame(step);
  }
  rafId = requestAnimationFrame(step);

  // pause on hover for better UX
  track.addEventListener('mouseenter', () => cancelAnimationFrame(rafId));
  track.addEventListener('mouseleave', () => { rafId = requestAnimationFrame(step); });
}

/* reveal */
function setupReveal(){
  const items = $$('.product-card').concat($$('.review-card'));
  const hero = $('#hero');
  if(hero) items.push(hero);
  if(!items.length) return;
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(i => obs.observe(i));
}

/* contact form */
function setupContactForm(){
  const form = $('#contactForm');
  if(!form) return;
  const name = $('#name'), phone = $('#phone'), message = $('#message'), reset = $('#contactReset');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!(name && phone && message)){
      alert('Form fields missing');
      return;
    }
    if(!name.value.trim() || !phone.value.trim() || !message.value.trim()){
      alert('Please fill name, phone and message before sending.');
      return;
    }
    const txt = `Order/Message from ${name.value.trim()} (${phone.value.trim()}): ${message.value.trim()}`;
    safeOpenWhatsApp(txt);
  });
  if(reset) reset.addEventListener('click', () => form.reset());
}

/* order bar */
function setupOrderBar(){
  const bar = $('#orderBar');
  const orderBtn = $('#orderNow');
  if(orderBtn) orderBtn.addEventListener('click', () => safeOpenWhatsApp('Hi — I want to place an order'));

  if(!bar) return;
  const onScroll = () => { if(window.scrollY < 120) bar.classList.add('hidden'); else bar.classList.remove('hidden'); };
  window.addEventListener('scroll', onScroll);
  onScroll();
}

/* dark toggle */
function setupDarkToggle(){
  const toggle = $('#darkToggle');
  if(!toggle) return;
  toggle.addEventListener('click', () => {
    const now = document.body.classList.toggle('dark');
    toggle.setAttribute('aria-pressed', String(now));
    toggle.textContent = now ? '☀️' : '🌙';
    try { localStorage.setItem('jp_dark', now ? 'true' : 'false'); } catch(e){}
  });

  try {
    const saved = localStorage.getItem('jp_dark');
    if(saved === 'true') { document.body.classList.add('dark'); toggle.textContent = '☀️'; toggle.setAttribute('aria-pressed','true'); }
    else if(saved === 'false') { document.body.classList.remove('dark'); toggle.textContent = '🌙'; toggle.setAttribute('aria-pressed','false'); }
  } catch(e){}
}

/* init */
function init(){
  const heroImg = $('#heroImg'); if(heroImg && HERO_IMAGE) heroImg.src = HERO_IMAGE;
  const logoImg = $('#logoImg'); if(logoImg && LOGO_IMAGE) logoImg.src = LOGO_IMAGE;

  renderGrid();
  setupCounters();
  setupContactForm();
  setupOrderBar();
  setupDarkToggle();
  setupModalOverlay();
  setupReviews();

  // stagger reveal for cards (small delay)
  $$('.product-card').forEach((c, i) => setTimeout(()=> c.classList.add('visible'), i * 60));
  setTimeout(setupReveal, 120);
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
