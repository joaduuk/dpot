import { Route } from 'react-router-dom'
import Terms from './Terms'
import Privacy from './Privacy'
import Cookies from './Cookies'
import Fees from './Fees'
import ImportantInformation from './ImportantInformation'
import Contact from '../Contact'

// Public policy and contact pages, rendered inside <Routes> in App.jsx.
export const legalRoutes = (
  <>
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/cookies" element={<Cookies />} />
    <Route path="/fees" element={<Fees />} />
    <Route path="/important-information" element={<ImportantInformation />} />
    <Route path="/contact" element={<Contact />} />
  </>
)
