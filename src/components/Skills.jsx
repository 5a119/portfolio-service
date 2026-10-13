import {Braces, Cloud, Database, Server, ShieldCheck, Wrench} from 'lucide-react';
import {skillCategories} from '../data/portfolio';
import Section from './Section';

const icons = { code: Braces, server: Server, cloud: Cloud, database: Database, test: ShieldCheck, tools: Wrench };
export default function Skills() {
  return <Section id="skills">
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skillCategories.map(category => { const Icon = icons[category.icon]; return <article key={category.title} className="portfolio-card p-7"><Icon size={28} className="text-accent mb-5" aria-hidden="true" /><h3 className="text-lg font-bold text-white mb-5">{category.title}</h3><ul className="flex flex-wrap gap-2">{category.skills.map(skill => <li key={skill} className="tag">{skill}</li>)}</ul></article>; })}
    </div>
  </Section>;
}
