export function emailDraft({name = '', email = '', subject = '', message = ''}, recipient) {
  const body = `${message.trim()}\n\nName: ${name.trim()}\nEmail: ${email.trim()}`;
  return `mailto:${recipient}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
}
