// Ligne de terminal qui défile parmi les technologies
  const words = ["WordPress & Elementor", "WooCommerce", "PHP", "Python"];
  const el = document.getElementById('typed');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    el.textContent = words[0];
  } else {
    let wi = 0, ci = 0, deleting = false;

    function tick(){
      const word = words[wi];
      if (!deleting){
        ci++;
        el.textContent = word.slice(0, ci);
        if (ci === word.length){
          deleting = true;
          setTimeout(tick, 1400);
          return;
        }
      } else {
        ci--;
        el.textContent = word.slice(0, ci);
        if (ci === 0){
          deleting = false;
          wi = (wi + 1) % words.length;
        }
      }
      setTimeout(tick, deleting ? 35 : 55);
    }
    tick();
  }

  // Révélation au défilement
  if (!reduced && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.15});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'));
  }
