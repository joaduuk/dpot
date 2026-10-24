import LegalLayout, { Section, List, Placeholder, SupportLink } from './LegalLayout'

export default function ImportantInformation() {
  return (
    <LegalLayout title="Important information: DailyPot is not a bank">
      <p>Please read this before you start saving with DailyPot.</p>

      <Section title="What that means for you">
        <List>
          <li>DailyPot is a savings-collection service, not a bank, microfinance institution or investment product.</li>
          <li>Money you save is <strong>not covered by any deposit insurance or deposit protection scheme</strong>.</li>
          <li>DailyPot does not pay interest, and your savings do not grow beyond what you pay in.</li>
          <li>DailyPot does not lend money and is not giving you financial advice.</li>
          <li>
            Regulatory status: <Placeholder>LICENCE OR REGISTRATION HELD, AND REGULATOR — OR A
            STATEMENT THAT NONE IS REQUIRED, CONFIRMED BY A LAWYER</Placeholder>
          </li>
        </List>
      </Section>

      <Section title="How your money is held">
        <p>
          Money paid into pots is held in <Placeholder>WHERE AND HOW SAVERS' MONEY IS HELD — e.g.
          name of bank, whether it is kept separate from the operator's own money</Placeholder>.
        </p>
      </Section>

      <Section title="Risks to be aware of">
        <List>
          <li><strong>Cash payments:</strong> when you pay an agent in cash, check the payment appears in your pot. Report anything missing to <SupportLink /> straight away.</li>
          <li><strong>Pending payments:</strong> a payment only counts once it is confirmed.</li>
          <li><strong>Early cash-out:</strong> the fee is one day's amount whatever you have saved, so cashing out very early returns little.</li>
          <li><strong>New service:</strong> DailyPot is in early testing. Only save money you can afford to have tied up for a while, and keep your own record of what you pay.</li>
        </List>
      </Section>

      <Section title="Contact">
        <p>
          <Placeholder>OPERATOR LEGAL NAME</Placeholder>, <Placeholder>REGISTERED ADDRESS</Placeholder>.
          Email <SupportLink />.
        </p>
      </Section>
    </LegalLayout>
  )
}
