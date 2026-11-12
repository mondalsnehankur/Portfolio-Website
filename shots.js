/* Drop-in images: put a screenshot named like data-shot (png, jpg or webp) into img/projects/ and it appears;
   if no file exists the image removes itself and the built-in illustration stays. */
(() => {
  document.querySelectorAll('img[data-shot]').forEach((img) => {
    const base = img.dataset.shot, exts = ['webp', 'png', 'jpg', 'jpeg']; let i = 0;
    const next = () => { if (i >= exts.length) { img.remove(); return; } img.src = `${base}.${exts[i++]}`; };
    img.addEventListener('error', next); img.addEventListener('load', () => img.closest('.project-visual')?.classList.add('has-shot'));
    next();
  });
})();
