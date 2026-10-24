import { Link } from 'react-router-dom'
import LegalLayout, { Section, List, Placeholder, SupportLink } from './LegalLayout'

export default function Terms() {
  return (
    <LegalLayout title="Terms of Use">
      <p>
        These terms apply when you use DailyPot at dailypot.online (the "service"). DailyPot is
        operated by <Placeholder>OPERATOR LEGAL NAME</Placeholder>, <Placeholder>COMPANY
        REGISTRATION NUMBER, IF ANY</Placeholder>, of <Placeholder>REGISTERED ADDRESS</Placeholder> ("we",
        "us"). By creating an account you agree to these terms, our{' '}
        <Link to="/privacy" className="text-teal hover:underline">Privacy Policy</Link> and our{' '}
        <Link to="/fees" className="text-teal hover:underline">Fees</Link> page.
      </p>

      <Section title="1. What DailyPot is">
        <p>
          DailyPot helps you save a fixed amount every day into a "pot". A pot runs for 30 saving
          days, plus one extra day used for the platform fee (day 31). You can pay by mobile money,
          bank transfer, or in cash to a DailyPot agent, and request a payout of what you have saved.
        </p>
        <p>
          DailyPot is <strong>not a bank</strong> and does not take deposits, pay interest or give
          loans. Please read{' '}
          <Link to="/important-information" className="text-teal hover:underline">Important information</Link>{' '}
          before you start saving.
        </p>
      </Section>

      <Section title="2. Your account">
        <List>
          <li>You must be at least <Placeholder>MINIMUM AGE, e.g. 18</Placeholder> years old to open an account.</li>
          <li>Give accurate details (name, phone, email, country) and keep them up to date.</li>
          <li>Keep your password private. You are responsible for activity on your account until you tell us it has been compromised.</li>
          <li>One person, one account. We may ask you to confirm your identity before a payout.</li>
        </List>
      </Section>

      <Section title="3. Pots and payments">
        <List>
          <li>When you create a pot you choose a daily amount, a start date and how you will pay.</li>
          <li>A payment only counts once it has been confirmed by us (or recorded by an agent and confirmed). Until then it is shown as pending.</li>
          <li>If you pay for several days at once, today's day is filled first and the rest are kept as "buffer" days, which you can place on any unpaid day, including the fee day.</li>
          <li>Missing a day does not cancel your pot; you can catch up later with buffer days.</li>
          <li>Money paid in that does not fit a pot (for example an overpayment) may be credited to your DailyPot wallet. The wallet is a record of money we owe you; it is not a bank account and earns no interest.</li>
        </List>
      </Section>

      <Section title="4. Payouts">
        <List>
          <li>You can request a payout once at least one day is confirmed, even before the pot is full.</li>
          <li>Your payout is the number of confirmed days × your daily amount, minus the platform fee described on the <Link to="/fees" className="text-teal hover:underline">Fees</Link> page.</li>
          <li>You can ask for payout by mobile money or bank transfer. We aim to pay within <Placeholder>PAYOUT PROCESSING TIME</Placeholder> of your requested date.</li>
          <li>Each pot can be paid out once. After payout the pot is closed.</li>
          <li>We may delay a payout while we check a payment, confirm your identity, or where the law requires it.</li>
        </List>
      </Section>

      <Section title="5. Agents">
        <p>
          Agents are approved individuals who collect cash payments from savers and record them in
          DailyPot. An agent is <Placeholder>AGENT RELATIONSHIP — e.g. an independent contractor /
          representative of the operator</Placeholder>. Always check a payment appears in your pot
          after handing cash to an agent, and report any problem to <SupportLink />. Agents receive
          a share of the platform fee on cash pots; this never costs the saver anything extra.
          Additional agent terms: <Placeholder>LINK OR TEXT FOR AGENT AGREEMENT</Placeholder>.
        </p>
      </Section>

      <Section title="6. Acceptable use">
        <p>Do not use DailyPot to:</p>
        <List>
          <li>break any law, including laws on money laundering and fraud;</li>
          <li>save money that is not yours or that comes from crime;</li>
          <li>pretend to be someone else, or record payments that did not happen;</li>
          <li>try to access other people's accounts or interfere with the service.</li>
        </List>
        <p>We may suspend or close accounts that break these rules, and report suspected crime to the authorities.</p>
      </Section>

      <Section title="7. Closing your account">
        <p>
          You can ask us to close your account at any time by emailing <SupportLink />. Any money
          owed to you (confirmed pot days minus the fee, and any wallet balance) will be paid out
          first. We may close an account with <Placeholder>NOTICE PERIOD</Placeholder> notice, or
          immediately for a serious breach of these terms, and will still pay out money owed to you
          unless the law prevents it.
        </p>
      </Section>

      <Section title="8. Our responsibility">
        <p>
          We will take reasonable care running DailyPot and looking after money paid to us. The
          service is new and may sometimes be unavailable or contain errors; if you think a balance
          is wrong, tell us and we will investigate. <Placeholder>LIMITATION OF LIABILITY CLAUSE —
          TO BE DRAFTED BY A LAWYER FOR THE APPLICABLE JURISDICTION</Placeholder>. Nothing in these
          terms limits rights you have under consumer protection law.
        </p>
      </Section>

      <Section title="9. Complaints">
        <p>
          If something goes wrong, email <SupportLink /> with your phone number and pot name. We aim
          to reply within <Placeholder>RESPONSE TIME, e.g. 5 working days</Placeholder>. If you are
          not happy with our answer you may be able to complain to <Placeholder>REGULATOR OR
          OMBUDSMAN, IF ANY</Placeholder>.
        </p>
      </Section>

      <Section title="10. Changes and governing law">
        <p>
          We may update these terms. If a change matters to you, we will tell you by email or in the
          app before it takes effect. These terms are governed by the laws of{' '}
          <Placeholder>GOVERNING LAW / JURISDICTION</Placeholder>.
        </p>
      </Section>
    </LegalLayout>
  )
}
