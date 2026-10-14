import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowUpRight, Clock, Coffee, FileText, LoaderCircle, Mail, X} from 'lucide-react';
import {makeApiError} from './resume-notification-status.js';
import {emailDraft} from './resume-demo.js';
import {profile} from '../data/portfolio';

const ResumeAccessContext = createContext(null);

async function postJson(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => {
    throw new Error('Résumé access is unavailable. Reload the portfolio and try again.');
  });
  if (!response.ok) throw makeApiError(result);
  return result;
}

export function ResumeAccessProvider({children}) {
  const [initialRoute] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const resume = params.get('resume');
    return {
      open: resume === 'success' || resume === 'cancelled',
      view: resume === 'success' ? 'success' : 'choose',
      sessionId: resume === 'success' ? params.get('session_id') || '' : '',
      notice: resume === 'cancelled' ? 'Checkout was cancelled. You can choose either option below.' : '',
      cancelled: resume === 'cancelled',
    };
  });
  const [open, setOpen] = useState(initialRoute.open);
  const [view, setView] = useState(initialRoute.view);
  const [sessionId, setSessionId] = useState(initialRoute.sessionId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialRoute.notice);
  const [resumeDeadline, setResumeDeadline] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [emailAccessReady, setEmailAccessReady] = useState(false);
  const [emailAccessBusy, setEmailAccessBusy] = useState(false);
  const [emailAccessError, setEmailAccessError] = useState('');
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  const show = useCallback((nextView = 'choose', nextSession = '') => {
    previousFocus.current = document.activeElement;
    setView(nextView);
    setSessionId(nextSession);
    setError('');
    setNotice('');
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    if (dialogRef.current?.open) dialogRef.current.close();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open || !dialogRef.current || dialogRef.current.open) return;
    dialogRef.current.showModal();
    dialogRef.current.querySelector('[autofocus]')?.focus();
  }, [open]);

  useEffect(() => {
    if (open) return;
    previousFocus.current?.focus?.();
  }, [open]);

  useEffect(() => {
    if (initialRoute.cancelled) window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
  }, [initialRoute.cancelled]);

  useEffect(() => {
    if (resumeDeadline === null) return;
    const update = () => setSecondsRemaining(Math.max(0, Math.ceil((resumeDeadline - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 250);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [resumeDeadline]);

  async function prepareEmailAccess() {
    setEmailAccessBusy(true);
    setEmailAccessError('');
    try {
      const result = await postJson('/api/resume/email-access', {});
      if (!Number.isFinite(result.waitSeconds) || result.waitSeconds < 0) throw new Error('Résumé access could not be prepared. Please try again.');
      setResumeDeadline(Date.now() + result.waitSeconds * 1000);
      setEmailAccessReady(true);
    } catch (cause) {
      setEmailAccessError(cause.message);
    } finally {
      setEmailAccessBusy(false);
    }
  }

  async function startCheckout() {
    setBusy(true); setError('');
    try {
      const result = await postJson('/api/resume/checkout', {});
      window.location.assign(result.url);
    } catch (cause) { setError(cause.message); setBusy(false); }
  }

  function submitRequest(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    window.open(emailDraft(values, profile.email), '_blank', 'noopener,noreferrer');
    setSecondsRemaining(10);
    setResumeDeadline(Date.now() + 10_000);
    setNotice('Your email draft opens separately. Review it and press Send in your mail app. Your résumé will be available here after the countdown.');
    void prepareEmailAccess();
  }

  return <ResumeAccessContext.Provider value={{show}}>
    {children}
    <dialog ref={dialogRef} className="resume-dialog" aria-labelledby="resume-dialog-title" onClose={() => setOpen(false)} onClick={(event) => {if (event.target === dialogRef.current) close();}}>
      <div className="resume-dialog-panel">
        <button type="button" className="resume-dialog-close" onClick={close} aria-label="Close dialog"><X size={20} aria-hidden="true" /></button>
        {view === 'choose' && <>
          <p className="resume-dialog-eyebrow">Résumé access</p>
          <h2 id="resume-dialog-title">Choose how to get my résumé.</h2>
          {notice && <p className="resume-dialog-notice" role="status">{notice}</p>}
          <button type="button" className="resume-choice resume-choice-paid" onClick={() => {setError(''); setNotice(''); setView('payment');}}>
            <span className="resume-choice-icon"><Coffee size={22} aria-hidden="true" /></span>
            <span className="resume-choice-copy"><strong>Buy me a coffee</strong></span>
            {busy ? <LoaderCircle className="resume-spinner" size={19} aria-label="Opening secure checkout" /> : <ArrowUpRight size={19} aria-hidden="true" />}
          </button>
          <button type="button" className="resume-choice" onClick={() => {setError(''); setNotice(''); setView('request');}}>
            <span className="resume-choice-icon"><FileText size={22} aria-hidden="true" /></span>
            <span className="resume-choice-copy"><strong>Request it for free</strong></span>
            <ArrowUpRight size={19} aria-hidden="true" />
          </button>
          {error && <p className="resume-dialog-error" role="alert">{error}</p>}
        </>}
        {view === 'payment' && <>
          <button type="button" className="resume-back" onClick={() => {setView('choose'); setError('');}}><ArrowLeft size={16} aria-hidden="true" /> Back to options</button>
          <p className="resume-dialog-eyebrow">One-time payment</p>
          <h2 id="resume-dialog-title">A little caffeine. A lot of code.</h2>
          <p className="resume-dialog-intro">You get my résumé. I get debugging fuel. Pay $5 once for instant access to the résumé in this browser for 30 days.</p>
          <button type="button" className="resume-submit" onClick={startCheckout} disabled={busy}>{busy ? <><LoaderCircle size={18} className="resume-spinner" /> Opening secure checkout…</> : <>☕ Fuel the developer · $5</>}</button>
          <p className="resume-fine-print">Checkout is hosted securely by Stripe. Access is saved in this browser; if you need help reopening your résumé, email snguyen4work@gmail.com with the Stripe receipt.</p>
          {error && <p className="resume-dialog-error" role="alert">{error}</p>}
        </>}
        {(view === 'request' || view === 'contact') && <>
          {view === 'request' && <button type="button" className="resume-back" onClick={() => {setView('choose'); setError('');}}><ArrowLeft size={16} aria-hidden="true" /> Back to options</button>}
          <p className="resume-dialog-eyebrow">{view === 'contact' ? 'Get in touch' : 'Free résumé request'}</p>
          <h2 id="resume-dialog-title">Tell me what you need.</h2>
          <p className="resume-dialog-intro">Fill in your details, then open a prefilled email to Sang in your default mail app.</p>
          {notice && <p className="resume-dialog-notice" role="status">{notice}</p>}
          <form onSubmit={submitRequest} className="resume-form">
            <label>Name<input name="name" autoComplete="name" maxLength="100" required disabled={busy} /></label>
            <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required disabled={busy} /></label>
            <label>Subject<input name="subject" maxLength="160" required disabled={busy} placeholder="What would you like to discuss?" /></label>
            <label>Message<textarea name="message" maxLength="2000" rows="3" required disabled={busy} /></label>
            {error && <p className="resume-dialog-error" role="alert">{error}</p>}
            <button type="submit" className="resume-submit" disabled={secondsRemaining !== null}>Send Message</button>
          </form>
          {secondsRemaining !== null && <div className="resume-email-access">
            {secondsRemaining > 0 && <p className="resume-countdown" role="timer" aria-live="polite" aria-atomic="true"><Clock size={20} aria-hidden="true" /> View Resume in <strong>{secondsRemaining}s</strong></p>}
            {secondsRemaining === 0 && emailAccessBusy && <p className="resume-dialog-notice" role="status">Preparing your résumé…</p>}
            {secondsRemaining === 0 && emailAccessReady && <a className="resume-submit resume-download" href="/api/resume/email-access" target="_blank" rel="noopener noreferrer"><FileText size={18} aria-hidden="true" /> View Resume</a>}
            {emailAccessError && <><p className="resume-dialog-error" role="alert">{emailAccessError}</p><button type="button" className="resume-text-button" onClick={prepareEmailAccess} disabled={emailAccessBusy}>Retry résumé access</button></>}
          </div>}
        </>}
        {view === 'success' && <>
          <p className="resume-dialog-eyebrow">Confirming payment</p>
          <h2 id="resume-dialog-title">A little caffeine. A lot of code.</h2>
          <p className="resume-dialog-intro">Your one-time $5 payment is being verified. This browser can access the résumé for 30 days after purchase.</p>
          {sessionId && <a className="resume-submit resume-download" href={`/api/resume/download?session_id=${encodeURIComponent(sessionId)}`} target="_blank" rel="noreferrer"><FileText size={18} aria-hidden="true" /> Open my résumé</a>}
          {!sessionId && <p className="resume-dialog-error" role="alert">The checkout session is missing. Return to the browser where you started checkout and try again.</p>}
          <p className="resume-fine-print">If payment is still processing, wait a few seconds and try the link again. This browser can reopen your résumé during the 30-day access period. If you need help, email snguyen4work@gmail.com with your Stripe receipt so Sang can verify the purchase manually.</p>
        </>}
      </div>
    </dialog>
  </ResumeAccessContext.Provider>;
}

export function ResumeAccessButton({className = 'button-secondary'}) {
  const context = useContext(ResumeAccessContext);
  if (!context) throw new Error('ResumeAccessButton must be inside ResumeAccessProvider');
  return <button type="button" className={className} onClick={() => context.show()}><FileText size={18} aria-hidden="true" />View Resume</button>;
}

export function EmailContactButton({children, className = 'button-primary'}) {
  const context = useContext(ResumeAccessContext);
  if (!context) throw new Error('EmailContactButton must be inside ResumeAccessProvider');
  return <button type="button" className={className} onClick={() => context.show('contact')}><Mail size={18} aria-hidden="true" />{children}<ArrowUpRight size={16} aria-hidden="true" /></button>;
}
