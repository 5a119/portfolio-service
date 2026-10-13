import {Calendar, GraduationCap} from 'lucide-react';
import {education} from '../data/portfolio';
import Section from './Section';

export default function Education() {
  return <Section id="education">
    <div className="grid lg:grid-cols-2 gap-8">
      {education.map(item => <article key={item.school} className="portfolio-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
        <div className={`school-logo school-logo--${item.logoTheme}`}><img src={`${import.meta.env.BASE_URL}${item.logo}`} alt={`${item.school} logo`} width="80" height="80" loading="lazy" /></div>
        <div><p className="text-sm text-silver-400 mb-2 flex items-center gap-2"><GraduationCap size={18} aria-hidden="true" />{item.location}</p>
          <h3 className="font-bold text-xl text-white">{item.degree}</h3><p className="mt-2 text-silver-300">{item.school}</p>
          <p className="flex items-center gap-2 text-sm text-silver-400 mt-4"><Calendar size={16} aria-hidden="true" />{item.dates}</p><p className="mt-3 text-silver-200 font-medium">GPA: {item.gpa}</p>{item.honors && <p className="text-sm text-silver-400 mt-2">{item.honors}</p>}
        </div>
      </article>)}
    </div>
  </Section>;
}
