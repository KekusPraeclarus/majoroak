import { useEffect } from "react"
import { Route, Routes, useLocation, useParams } from "react-router-dom"

import { Footer } from "./components/Footer"
import { Header } from "./components/Header"
import { AboutPage } from "./pages/About"
import { CreatePage } from "./pages/Create"
import { DealPage } from "./pages/Deal"
import { LandingPage } from "./pages/Landing"
import { MarketPage } from "./pages/Market"
import { MyDealsPage } from "./pages/MyDeals"
import { NamePage } from "./pages/Name"
import { NotFoundPage } from "./pages/NotFound"
import { PrivacyPage } from "./pages/Privacy"
import { TermsPage } from "./pages/Terms"

const TITLES: Record<string, string> = {
  "/": "MajorOak — Over-the-counter escrow on Robinhood Chain",
  "/about": "About — MajorOak",
  "/name": "Lore — MajorOak",
  "/create": "Create a deal — MajorOak",
  "/market": "Market — MajorOak",
  "/listings": "Market — MajorOak",
  "/deals": "My deals — MajorOak",
  "/terms": "Terms — MajorOak",
  "/privacy": "Privacy — MajorOak",
}

const NOT_FOUND_TITLE = "Page not found — MajorOak"

/* The marketing pages carry no wallet control. Read docs/brand/web-application.md. */
const MARKETING_PATHS = ["/", "/about", "/name"]

function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith("/deal/")) return
    document.title = TITLES[pathname] ?? NOT_FOUND_TITLE
  }, [pathname])

  return null
}

function DealTitle() {
  const { address } = useParams()

  useEffect(() => {
    if (!address) {
      document.title = "Deal — MajorOak"
      return
    }
    const shortAddr = `${address.slice(0, 8)}…${address.slice(-4)}`
    document.title = `Deal ${shortAddr} — MajorOak`
  }, [address])

  return <DealPage />
}

export default function App() {
  const { pathname } = useLocation()
  const marketing = MARKETING_PATHS.includes(pathname)

  return (
    <>
      <DocumentTitle />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header marketing={marketing} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/name" element={<NamePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/deal/:address" element={<DealTitle />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/listings" element={<MarketPage />} />
        <Route path="/deals" element={<MyDealsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  )
}
