import {Cloud, Database, MapPin, MessageSquare, Server} from 'lucide-react';
import {motion, useReducedMotion} from 'framer-motion';
import {actions, profile} from '../data/portfolio';
import SocialLinks from './SocialLinks';
import {ResumeAccessButton} from './ResumeAccess';

export default function Hero() {
  const reduceMotion = useReducedMotion();
  return <section id="home" aria-labelledby="hero-title" className="relative min-h-screen flex items-center pt-32 pb-16 px-6 z-10 scroll-mt-24">
    <div className="max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="order-2 lg:order-1 lg:col-span-7 text-center lg:text-left">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-accent mb-5">{profile.name} · {profile.role}</p>
          <h1 id="hero-title" className="text-4xl sm:text-5xl xl:text-6xl font-bold text-gradient leading-tight">{profile.headline}</h1>
          <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-silver-400 text-base sm:text-lg leading-relaxed">{profile.summary}</p>
          <p className="flex gap-2 items-center justify-center lg:justify-start text-sm text-silver-400 mt-5"><MapPin size={16} aria-hidden="true" />{profile.location}</p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-8">
            <a className="button-primary" href="#contact"><MessageSquare size={18} aria-hidden="true" />{actions.talk}</a>
            <ResumeAccessButton />
          </div>
          <div className="mt-7 flex justify-center lg:justify-start"><SocialLinks /></div>
        </div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end">
          <div className="hero-visual">
            <div className="hero-photo"><img src={profile.image} alt={profile.name} width="800" height="800" fetchPriority="high" /></div>
            <span className="orbit-badge top-5 right-4" aria-label="Cloud engineering"><Cloud size={22} /></span>
            <span className="orbit-badge bottom-2 sm:bottom-8 right-0" aria-label="Backend engineering"><Server size={22} /></span>
            <span className="orbit-badge bottom-2 sm:bottom-10 left-0" aria-label="Data systems"><Database size={22} /></span>
          </div>
        </motion.div>
      </div>
    </div>
  </section>;
}
