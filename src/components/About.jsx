import {profile} from '../data/portfolio';
import aboutGif from '../assets/about.gif';
import Section from './Section';
import SocialLinks from './SocialLinks';

export default function About() {
  return <Section id="about">
    <div className="grid lg:grid-cols-12 gap-10 items-center">
      <div className="lg:col-span-7 space-y-5 text-silver-400 text-base sm:text-lg leading-relaxed">{profile.about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<div className="pt-3"><SocialLinks /></div></div>
      <div className="lg:col-span-5 max-w-sm mx-auto w-full"><picture><source media="(prefers-reduced-motion: reduce)" srcSet={`${import.meta.env.BASE_URL}about-still.png`} /><img src={aboutGif} alt="Developer working at a computer" loading="lazy" className="w-full rounded-2xl grayscale" /></picture></div>
    </div>
  </Section>;
}
