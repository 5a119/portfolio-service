import {ArrowUpRight, BookOpen} from 'lucide-react';
import Section from './Section';
import {learning} from '../data/portfolio';

export default function Certifications() {
  return <Section id="certifications">
    <article className="portfolio-card p-7 sm:p-10 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><BookOpen size={32} className="text-accent" aria-hidden="true" /><span className="learning-status inline-flex gap-2 items-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-wider text-silver-200"><span className="w-1.5 h-1.5 bg-accent rounded-full" />{learning.status}</span></div>
      <h3 className="text-2xl font-bold text-white mb-4">{learning.title}</h3><p className="text-silver-400 leading-relaxed text-base sm:text-lg">{learning.description}</p>
      <div className="border-t border-white/10 mt-7 pt-5 flex items-center gap-2 text-sm text-silver-300"><ArrowUpRight size={18} aria-hidden="true" />{learning.next}</div>
    </article>
  </Section>;
}
