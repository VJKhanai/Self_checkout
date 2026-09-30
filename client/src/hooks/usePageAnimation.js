import { useLayoutEffect } from 'react';
import gsap from 'gsap';

// Animates each page in when the route changes. Respects "reduce motion".
export default function usePageAnimation(ref, key) {
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const marked = ref.current.querySelectorAll('[data-entrance]');
      const targets = marked.length
        ? marked
        : ref.current.querySelectorAll('header, h1, h2, .card, .btn-primary, .btn-accent, .input');

      gsap.fromTo(
        targets,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' }
      );
    }, ref);

    return () => ctx.revert();
  }, [key]);
}
