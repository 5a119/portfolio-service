import {profile} from '../data/portfolio';

function Github() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 19c-4.3 1.3-4.3-2.2-6-2.7M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0 .2-3.7s-1.2-.4-3.9 1.4a12.8 12.8 0 0 0-7 0C6.2 1.2 5 1.6 5 1.6a5.5 5.5 0 0 0 .2 3.7A5.5 5.5 0 0 0 4.5 8.7c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" /></svg>;
}
function Linkedin() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.4 7.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM3.5 9H7v12H3.5ZM10 9h3.4v1.6c.5-.9 1.5-1.9 3.4-1.9 3.6 0 4.2 2.3 4.2 5.3v7h-3.6v-6.2c0-1.5 0-3.3-2-3.3s-2.2 1.5-2.2 3.2V21H10Z" /></svg>;
}
export default function SocialLinks() {
  return <div className="flex gap-3">
    <a className="social-link" href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="Sang Nguyen on GitHub"><Github /></a>
    <a className="social-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Sang Nguyen on LinkedIn"><Linkedin /></a>
  </div>;
}
