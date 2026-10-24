import LegalLayout, { Section, Placeholder, SupportLink } from './LegalLayout'

export default function Cookies() {
  return (
    <LegalLayout title="Cookie notice">
      <p>
        DailyPot does not use advertising or analytics cookies, and we do not track you across other
        websites.
      </p>

      <Section title="What we store on your device">
        <p>
          To keep you logged in, the site saves two items in your browser's local storage (which
          works like a cookie):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Purpose</th>
                <th className="py-2">How long</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              <tr>
                <td className="py-2 pr-4 font-mono">dailypot_token</td>
                <td className="py-2 pr-4">Your login session, so you don't have to sign in on every page.</td>
                <td className="py-2">Until you log out or the session expires</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">dailypot_user</td>
                <td className="py-2 pr-4">Your name and role, so the menus show the right links.</td>
                <td className="py-2">Until you log out</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          These are strictly necessary for the service to work, so we don't ask for consent. Logging
          out removes them, and you can also clear them in your browser settings.
        </p>
      </Section>

      <Section title="Third parties">
        <p>
          Our pages load fonts from Google Fonts, which means your browser contacts Google and may
          receive cookies or share your IP address under Google's own policies.{' '}
          <Placeholder>CONFIRM, OR SELF-HOST THE FONTS AND REMOVE THIS SECTION</Placeholder>
        </p>
      </Section>

      <Section title="Questions">
        <p>Email <SupportLink />.</p>
      </Section>
    </LegalLayout>
  )
}
