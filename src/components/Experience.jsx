import {Briefcase, MapPin} from 'lucide-react';
import {experience} from '../data/portfolio';
import Section from './Section';

export default function Experience() {
  return <Section id="experience">
    <div className="max-w-5xl mx-auto space-y-8">
      {experience.map(job => <article key={job.company} className="portfolio-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between border-b border-white/10 pb-5 mb-5">
          <div><p className="flex items-center gap-2 text-sm text-silver-400 mb-2"><Briefcase size={16} aria-hidden="true" />{job.company}</p><h3 className="text-xl sm:text-2xl font-bold text-white">{job.role}</h3></div>
          <div className="sm:text-right text-sm text-silver-400"><p>{job.dates}</p><p className="inline-flex gap-1 items-center mt-2"><MapPin size={14} aria-hidden="true" />{job.location}</p></div>
        </div>
        <ul className="list-disc pl-5 space-y-3 text-silver-300 leading-relaxed marker:text-silver-500">{job.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>
        <div className="flex flex-wrap gap-2 mt-6">{job.technologies.map(tech => <span key={tech} className="tag">{tech}</span>)}</div>
      </article>)}
    </div>
  </Section>;
}
