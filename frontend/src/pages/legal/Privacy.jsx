import { Link } from 'react-router-dom'
import LegalLayout, { Section, List, Placeholder, SupportLink } from './LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This policy explains what personal information DailyPot collects, why, and what rights you
        have. The data controller is <Placeholder>OPERATOR LEGAL NAME</Placeholder> of{' '}
        <Placeholder>REGISTERED ADDRESS</Placeholder>
        {' '}<Placeholder>DATA PROTECTION REGISTRATION NUMBER, IF REQUIRED</Placeholder>. Contact us
        about privacy at <SupportLink />.
      </p>

      <Section title="What we collect">
        <List>
          <li><strong>Account details:</strong> full name, phone number, email address, country, and your password (stored only as a secure hash, never in readable form).</li>
          <li><strong>Saving activity:</strong> your pots, daily amounts, payment method, payments and their references, buffer days, wallet transactions and payout requests.</li>
          <li><strong>Payout details:</strong> the mobile money number or bank account you give us for a payout.</li>
          <li><strong>Agent details</strong> (if you apply to be an agent): market name, location, city and mobile money provider and number.</li>
          <li><strong>Messages you send us:</strong> your name, email address and message when you use the contact form or email support.</li>
          <li><strong>Technical data:</strong> when you last logged in, and standard server logs (such as IP address and browser type) kept for security.</li>
        </List>
      </Section>

      <Section title="Why we use it">
        <List>
          <li>To run your account and pots, record and confirm payments, and make payouts (needed to provide the service you signed up for).</li>
          <li>To send you service emails, such as account confirmation and password reset.</li>
          <li>To prevent fraud, keep the service secure, and keep financial records the law requires.</li>
          <li>To answer your questions and complaints.</li>
        </List>
        <p>We do not sell your personal information, and we do not use it for advertising.</p>
      </Section>

      <Section title="Who can see it">
        <List>
          <li><strong>DailyPot admins</strong> can see saver accounts and activity in order to confirm payments and process payouts.</li>
          <li><strong>Your agent</strong>, if you save in cash, can see your name, phone number and the pots they collect for.</li>
          <li><strong>Service providers</strong> who help us run DailyPot: our hosting provider (<Placeholder>HOSTING PROVIDER AND SERVER LOCATION</Placeholder>), our email provider (<Placeholder>EMAIL PROVIDER</Placeholder>), and the mobile money or bank providers that carry payments and payouts.</li>
          <li><strong>Authorities</strong>, when the law requires it.</li>
        </List>
        <p>
          Our pages load fonts from Google Fonts, so your browser connects to Google's servers and
          shares your IP address with them. <Placeholder>CONFIRM, OR SELF-HOST THE FONTS AND REMOVE
          THIS SENTENCE</Placeholder>
        </p>
      </Section>

      <Section title="International transfers">
        <p>
          Your data is stored on servers in <Placeholder>COUNTRY OF SERVER</Placeholder>.{' '}
          <Placeholder>SAFEGUARDS FOR CROSS-BORDER TRANSFER, AS REQUIRED BY THE APPLICABLE LAW</Placeholder>
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your account details while your account is open. Payment and payout records are
          kept for <Placeholder>RETENTION PERIOD FOR FINANCIAL RECORDS</Placeholder> after your
          account closes, because the law requires us to keep financial records. After that we
          delete or anonymise them.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Depending on where you live, you may have the right to:</p>
        <List>
          <li>see the personal information we hold about you;</li>
          <li>correct information that is wrong;</li>
          <li>ask us to delete it (we may need to keep financial records for a period);</li>
          <li>object to or restrict how we use it;</li>
          <li>complain to your data protection authority: <Placeholder>DATA PROTECTION AUTHORITY FOR EACH COUNTRY SERVED</Placeholder>.</li>
        </List>
        <p>To use any of these rights, email <SupportLink /> from the address on your account.</p>
      </Section>

      <Section title="Security">
        <p>
          Passwords are hashed, the site uses HTTPS, and only authorised staff can access admin
          tools. No system is perfectly secure; if we discover a breach that affects you we will
          tell you and the relevant authority as the law requires.
        </p>
      </Section>

      <Section title="Cookies and local storage">
        <p>
          See our <Link to="/cookies" className="text-teal hover:underline">Cookie notice</Link>.
        </p>
      </Section>

      <Section title="Changes">
        <p>We will update the date at the top of this page when the policy changes, and tell you about important changes by email.</p>
      </Section>
    </LegalLayout>
  )
}
