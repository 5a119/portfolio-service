import {useId, useRef, useState} from 'react';
import {ArrowUpRight, Mail, X} from 'lucide-react';
import {profile} from '../data/portfolio';
import {emailDraft} from './email-draft.js';

export default function EmailDraftButton({children, className = 'button-primary'}) {
  const id = useId();
  const dialogRef = useRef(null);
  const buttonRef = useRef(null);
  const [notice, setNotice] = useState('');

  function open() {
    setNotice('');
    dialogRef.current.showModal();
  }

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setNotice('Your email app should open with this draft. Review it there and press Send.');
    window.location.assign(emailDraft(values, profile.email));
  }

  return <>
    <button ref={buttonRef} type="button" className={className} onClick={open} aria-haspopup="dialog"><Mail size={18} aria-hidden="true" />{children}<ArrowUpRight size={16} aria-hidden="true" /></button>
    <dialog ref={dialogRef} className="email-draft-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onClose={() => buttonRef.current?.focus()} onClick={event => {if (event.target === event.currentTarget) dialogRef.current.close();}}>
      <div className="email-draft-panel">
        <button type="button" className="email-draft-close" onClick={() => dialogRef.current.close()} aria-label="Close email draft"><X size={20} aria-hidden="true" /></button>
        <p className="email-draft-eyebrow">Get in touch</p>
        <h2 id={`${id}-title`}>What’s on your mind?</h2>
        <p id={`${id}-description`} className="email-draft-description">Tell me a little about the opportunity, project, or question you have in mind.</p>
        <form onSubmit={submit} className="email-draft-form">
          <label htmlFor={`${id}-name`}>Name<input id={`${id}-name`} name="name" autoComplete="name" maxLength={100} required /></label>
          <label htmlFor={`${id}-email`}>Email<input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label htmlFor={`${id}-subject`}>Subject<input id={`${id}-subject`} name="subject" maxLength={160} placeholder="What would you like to discuss?" required /></label>
          <label htmlFor={`${id}-message`}>Message<textarea id={`${id}-message`} name="message" maxLength={2000} rows={4} required /></label>
          <button type="submit" className="button-primary"><Mail size={18} aria-hidden="true" />Open email draft<ArrowUpRight size={16} aria-hidden="true" /></button>
        </form>
        <p className="email-draft-note">Your message opens in your email app, ready for you to review and send.</p>
        {notice && <p className="email-draft-status" role="status">{notice}</p>}
      </div>
    </dialog>
  </>;
}
