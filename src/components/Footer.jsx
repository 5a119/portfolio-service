import {ArrowUp} from 'lucide-react';
import {profile} from '../data/portfolio';

const currentYear = new Date().getFullYear();
export default function Footer() {
  return <footer className="relative z-10 border-t border-white/10 px-6 py-8"><div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-silver-400"><p>© {currentYear} {profile.name}</p><p>Made with 🤍</p><a href="#home" className="flex gap-2 items-center hover:text-white">Back to top<ArrowUp size={16} aria-hidden="true" /></a></div></footer>;
}
