import {FileText} from 'lucide-react';

export function ResumeLink({className = 'button-secondary'}) {
  return <a className={className} href={`${import.meta.env.BASE_URL}resume.pdf`} target="_blank" rel="noopener noreferrer" aria-label="View Resume (PDF, opens in a new tab)"><FileText size={18} aria-hidden="true" />View Resume</a>;
}

