import {useState} from 'react';
import {Copy, MapPin, MessageSquare} from 'lucide-react';
import {actions, contact, profile} from '../data/portfolio';
import Section from './Section';
import SocialLinks from './SocialLinks';
import {EmailContactButton, ResumeAccessButton} from './ResumeAccess';

export default function Contact() {
  const [copyStatus, setCopyStatus] = useState('');
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyStatus('Email address copied.');
    } catch {
      setCopyStatus('Select the email address above to copy it.');
    }
  }
  return <Section id="contact">
    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <div className="portfolio-card contact-card p-7 sm:p-9"><MessageSquare size={30} className="mb-5 text-accent" aria-hidden="true" /><h3 className="text-2xl font-bold text-white">{contact.heading}</h3><p className="text-silver-400 leading-relaxed mt-4">{contact.body}</p><p className="flex items-center gap-2 text-sm text-silver-400 mt-6"><MapPin size={16} aria-hidden="true" />{profile.location}</p><div className="mt-6"><SocialLinks /></div></div>
      <div className="portfolio-card contact-card p-7 sm:p-9 flex flex-col justify-center"><p className="text-sm text-silver-400 mb-3">{contact.emailLabel}</p><button type="button" onClick={copyEmail} className="email-address" aria-label={`Copy ${profile.email} to clipboard`} aria-describedby="email-copy-status"><span>{profile.email}</span><Copy size={17} aria-hidden="true" /></button><p id="email-copy-status" role="status" className="text-sm text-accent mt-2 min-h-5">{copyStatus}</p><div className="flex flex-wrap gap-3 mt-7"><EmailContactButton>{actions.email}</EmailContactButton><ResumeAccessButton /></div></div>
    </div>
  </Section>;
}
