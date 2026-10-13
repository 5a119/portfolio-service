import {
    Activity,
    Bell,
    ChartNoAxesCombined,
    GitBranch,
    GraduationCap,
    Monitor,
    PanelsTopLeft,
    ShieldCheck
} from 'lucide-react';
import {projects} from '../data/portfolio';
import Section from './Section';

function ProjectVisual({ type }) {
  const activity = type === 'activity';
  const Icon = activity ? Activity : Monitor;
  const steps = activity ? [{ icon: ShieldCheck, name: 'Authorize' }, { icon: ChartNoAxesCombined, name: 'Visualize' }, { icon: Bell, name: 'Remind' }] : [{ icon: PanelsTopLeft, name: 'React UI' }, { icon: GraduationCap, name: 'Scorecard API' }, { icon: GitBranch, name: 'CI/CD' }];
  return <div className="project-visual" aria-hidden="true">
    <div className="flex items-center gap-2 text-silver-300 text-sm mb-7"><Icon size={20} /><span>{activity ? 'Activity sessions' : 'Connected web experiences'}</span></div>
    <div className="grid grid-cols-3 gap-3">{steps.map(step => <div key={step.name} className="rounded-xl border border-white/15 bg-black/40 py-5 flex flex-col items-center gap-3"><step.icon size={26} /><span className="text-[10px] sm:text-xs text-silver-400">{step.name}</span></div>)}</div>
  </div>;
}
export default function Projects() {
  return <Section id="projects">
    <div className="grid md:grid-cols-2 gap-8">
      {projects.map(project => <article key={project.title} className="portfolio-card project-card overflow-hidden flex flex-col">
        <ProjectVisual type={project.visual} />
        <div className="p-6 sm:p-8 flex flex-col flex-1">
          <p className="text-xs uppercase tracking-wider text-silver-400 mb-2">{project.category}</p><h3 className="text-2xl font-bold text-white">{project.title}</h3><p className="text-sm text-silver-400 mt-2">{project.dates}</p>
          <p className="text-silver-300 leading-relaxed mt-5">{project.description}</p>
          <ul className="mt-4 space-y-3 list-disc pl-5 text-sm leading-relaxed text-silver-400 marker:text-silver-500">{project.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>
          <div className="flex flex-wrap gap-2 pt-6 mt-auto">{project.technologies.map(tech => <span key={tech} className="tag">{tech}</span>)}</div>
        </div>
      </article>)}
    </div>
  </Section>;
}
