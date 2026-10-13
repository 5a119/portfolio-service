import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowUpRight, Coffee, FileText, LoaderCircle, X} from 'lucide-react';
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
  const result = await response.json().catch(() => ({}));
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
    window.location.href = emailDraft(values, profile.email);
    setNotice('Your email draft is ready to open. Review it and press Send in your mail app. If nothing opens, check your default mail app settings.');
  }

  return <ResumeAccessContext.Provider value={{show}}>
    {children}
    <dialog ref={dialogRef} className="resume-dialog" aria-labelledby="resume-dialog-title" onClose={() => setOpen(false)} onClick={(event) => {if (event.target === dialogRef.current) close();}}>
      <div className="resume-dialog-panel">
        <button type="button" className="resume-dialog-close" onClick={close} aria-label="Close résumé options"><X size={20} aria-hidden="true" /></button>
        {view === 'choose' && <>
          <p className="resume-dialog-eyebrow">Résumé access</p>
          <h2 id="resume-dialog-title">Choose how to get my résumé.</h2>
          <p className="resume-dialog-intro">Instant access is $5. Or prepare a free email request; I’ll review it and reply myself.</p>
          {notice && <p className="resume-dialog-notice" role="status">{notice}</p>}
          <button type="button" className="resume-choice resume-choice-paid" onClick={() => {setError(''); setNotice(''); setView('payment');}}>
            <span className="resume-choice-icon"><Coffee size={22} aria-hidden="true" /></span>
            <span className="resume-choice-copy"><strong>☕ Buy me a coffee</strong><span>You get my résumé. I get debugging fuel.</span><small>One-time $5 payment · Instant résumé access · 30 days in this browser</small></span>
            {busy ? <LoaderCircle className="resume-spinner" size={19} aria-label="Opening secure checkout" /> : <ArrowUpRight size={19} aria-hidden="true" />}
          </button>
          <button type="button" className="resume-choice" onClick={() => {setError(''); setNotice(''); setView('request');}}>
            <span className="resume-choice-icon"><FileText size={22} aria-hidden="true" /></span>
            <span className="resume-choice-copy"><strong>Request it for free</strong><span>Fill in your details. Your mail app opens a ready-to-send draft.</span><small>Review the draft and press Send in your mail app.</small></span>
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
        {view === 'request' && <>
          <button type="button" className="resume-back" onClick={() => {setView('choose'); setError('');}}><ArrowLeft size={16} aria-hidden="true" /> Back to options</button>
          <p className="resume-dialog-eyebrow">Free résumé request</p>
          <h2 id="resume-dialog-title">Tell me what you need.</h2>
          <p className="resume-dialog-intro">Fill in your details, then open a prefilled email to Sang in your default mail app.</p>
          <p className="resume-fine-print">This opens a draft; it does not send automatically. Your entered email is included in the message, and your mail app chooses the sending account.</p>
          {notice && <p className="resume-dialog-notice" role="status">{notice}</p>}
          <form onSubmit={submitRequest} className="resume-form">
            <label>Name<input name="name" autoComplete="name" maxLength="100" required disabled={busy} /></label>
            <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required disabled={busy} /></label>
            <label>Subject<input name="subject" maxLength="160" required disabled={busy} placeholder="What would you like to discuss?" /></label>
            <label>Message<textarea name="message" maxLength="2000" rows="3" required disabled={busy} /></label>
            {error && <p className="resume-dialog-error" role="alert">{error}</p>}
            <button type="submit" className="resume-submit">Send Message</button>
          </form>
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
