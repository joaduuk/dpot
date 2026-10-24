import LegalLayout, { Section, List, Placeholder, SupportLink } from './LegalLayout'

export default function Fees() {
  return (
    <LegalLayout title="Fees">
      <p>
        DailyPot charges one fee per pot: <strong>one day's saving amount</strong>. There are no
        sign-up, monthly or hidden fees.
      </p>

      <Section title="How the fee works">
        <List>
          <li>Every pot has 30 saving days plus a 31st "fee day".</li>
          <li>When you request a payout, the fee (one daily amount) is deducted once from the total you have saved.</li>
          <li>If you also pay day 31, the fee is covered by that day and you get back the full value of your 30 saving days.</li>
          <li>The fee is the same if you cash out early. Because it is one day's amount, cashing out after only one confirmed day leaves nothing to pay out.</li>
        </List>
      </Section>

      <Section title="Examples (daily amount GHS 10)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-4">Confirmed days</th>
                <th className="py-2 pr-4">Saved</th>
                <th className="py-2 pr-4">Fee</th>
                <th className="py-2">You receive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 font-mono">
              <tr><td className="py-2 pr-4">31 (incl. fee day)</td><td className="py-2 pr-4">310</td><td className="py-2 pr-4">10</td><td className="py-2">300</td></tr>
              <tr><td className="py-2 pr-4">30</td><td className="py-2 pr-4">300</td><td className="py-2 pr-4">10</td><td className="py-2">290</td></tr>
              <tr><td className="py-2 pr-4">12 (early cash-out)</td><td className="py-2 pr-4">120</td><td className="py-2 pr-4">10</td><td className="py-2">110</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Cash pots and agents">
        <p>
          If you save in cash with an agent, the agent is paid half of the same fee. It is not an
          extra charge: you pay one daily amount either way.
        </p>
      </Section>

      <Section title="Charges from other providers">
        <p>
          Your mobile money provider or bank may charge you for sending money to DailyPot.{' '}
          <Placeholder>STATE WHETHER DAILYPOT OR THE SAVER PAYS TRANSFER CHARGES ON PAYOUTS</Placeholder>
        </p>
      </Section>

      <Section title="Questions">
        <p>Your payout screen always shows the fee before you confirm. Questions? Email <SupportLink />.</p>
      </Section>
    </LegalLayout>
  )
}
