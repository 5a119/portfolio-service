import {motion, useReducedMotion} from 'framer-motion';
import {sections} from '../data/portfolio';

export default function Section({ id, children }) {
  const { title, eyebrow, description } = sections[id];
  const reduceMotion = useReducedMotion();
  return <section id={id} aria-labelledby={`${id}-title`} className="py-20 sm:py-24 px-6 relative z-10 scroll-mt-24">
    <div className="max-w-7xl mx-auto w-full">
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-12 flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-accent mb-4">{eyebrow}</p>
        <h2 id={`${id}-title`} className="max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{title}</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-accent to-transparent rounded-full" />
        {description && <p className="mt-5 max-w-2xl text-silver-400 leading-relaxed">{description}</p>}
      </motion.div>{children}
    </div>
  </section>;
}
