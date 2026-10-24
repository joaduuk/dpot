// Shared pieces for the policy pages. Every page is a draft until the
// operator has filled in the placeholders and had it legally reviewed —
// search the repo for <Placeholder> to find what still needs filling in.

export const SUPPORT_EMAIL = 'support@dailypot.online'
export const LAST_UPDATED = '24 October 2026'

export const LEGAL_PAGES = [
  { to: '/terms', label: 'Terms of Use' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/cookies', label: 'Cookie notice' },
  { to: '/fees', label: 'Fees' },
  { to: '/important-information', label: 'Not a bank' },
]

export default function LegalLayout({ title, children }) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-deep">
        Draft. This page is still being finalised and has not yet been legally reviewed.
        Text in <Placeholder>brackets</Placeholder> will be completed before launch.
      </p>

      <div className="mt-8 space-y-4 leading-relaxed text-ink/80">{children}</div>
    </article>
  )
}

export function Section({ title, children }) {
  return (
    <section className="space-y-3 pt-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function List({ children }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>
}

// Something the operator must fill in (or confirm with a lawyer).
export function Placeholder({ children }) {
  return (
    <mark className="rounded bg-gold/20 px-1 font-medium text-gold-deep">[{children}]</mark>
  )
}

export function SupportLink() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-teal hover:underline">
      {SUPPORT_EMAIL}
    </a>
  )
}
