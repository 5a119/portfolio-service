import {useEffect, useState} from 'react';
import {ArrowUpRight, Menu, X} from 'lucide-react';
import {navigation, profile} from '../data/portfolio';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 20);
      // Track document order so the highlight follows the visible section.
      const current = Array.from(document.querySelectorAll('main section[id]')).filter(section => section.getBoundingClientRect().top <= 160).at(-1);
      setActive(current?.id || 'home');
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('keydown', closeOnEscape);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('keydown', closeOnEscape); };
  }, []);
  return <>
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#home" aria-label={`${profile.name}, home`} className="brand">
        <img src={`${import.meta.env.BASE_URL}code-mark.svg`} alt="" className="brand-mark" />
        <span>{profile.name}</span>
      </a>
      <nav aria-label="Main navigation" className="desktop-nav">
        {navigation.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>{label}</a>)}
      </nav>
      <div className="header-actions">
        <a href="#contact" onClick={() => setOpen(false)} className="header-cta" aria-current={active === 'contact' ? 'location' : undefined}>Let’s talk<ArrowUpRight size={16} aria-hidden="true" /></a>
        <button type="button" className="menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls={open ? 'mobile-navigation' : undefined} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
    </header>
    {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav">
      {navigation.map(({ id, label }) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)} aria-current={active === id ? 'location' : undefined}>{label}</a>)}
    </nav>}
  </>;
}
