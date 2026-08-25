import { Fragment, useLayoutEffect, useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { APP_EXTERNAL, appHref, SITE_EXTERNAL, siteHref } from "../config"

/*
 * One navigation for every route, marketing and application.
 * The indicator slides between items. Read docs/brand/motion/inventory.md.
 */
type Item = {
  to: string
  label: string
  /* A site item lives on the marketing host, an app item on the other one. */
  site?: boolean
  /* A second path that lights the same item. */
  also?: string[]
  /* A hairline opens the marketing group, so the two groups read apart. */
  divide?: boolean
}

const ITEMS: Item[] = [
  { to: "/create", label: "Create" },
  { to: "/market", label: "Market", also: ["/listings"] },
  { to: "/deals", label: "My deals" },
  { to: "/about", label: "About", site: true, divide: true },
  { to: "/name", label: "Lore", site: true },
]

/* The indicator holds one base width, so only a transform changes. */
const BASE = 100
/* Matches --mo-border-width-emphasis, so the rule sits on its item's foot. */
const RULE = 2

export function Nav() {
  const { pathname } = useLocation()
  const nav = useRef<HTMLElement>(null)
  /* The rule keeps its place when it goes out, so it fades where it stands. */
  const [mark, setMark] = useState({ x: 0, y: 0, scale: 0, on: false })
  const [armed, setArmed] = useState(false)
  const wasOn = useRef(false)

  useLayoutEffect(() => {
    const root = nav.current
    if (!root) return

    function measure() {
      const active = root!.querySelector<HTMLElement>("a.active")
      if (!active) {
        wasOn.current = false
        setMark((prev) => ({ ...prev, on: false }))
        return
      }
      /* Coming from a page with no active item, the rule appears in place. */
      if (!wasOn.current) setArmed(false)
      wasOn.current = true
      setMark({
        x: active.offsetLeft,
        /* The rule follows its own row, so a wrapped nav still marks the page. */
        y: active.offsetTop + active.offsetHeight - RULE,
        scale: active.offsetWidth / BASE,
        on: true,
      })
    }

    measure()
    /* The first paint places the indicator. It slides only after that. */
    const frame = requestAnimationFrame(() => setArmed(true))
    /* A font swap or a resize changes an item width, so measure again. */
    document.fonts?.ready.then(measure)
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", measure)
    }
  }, [pathname])

  return (
    <nav className="nav" aria-label="Primary" ref={nav}>
      {ITEMS.map((item) => (
        <Fragment key={item.to}>
          {item.divide && <span className="nav-divide" aria-hidden="true" />}
          {/* A route on the other host is a document link, so it cannot be active. */}
          {(item.site ? SITE_EXTERNAL : APP_EXTERNAL) ? (
            <a href={item.site ? siteHref(item.to) : appHref(item.to)}>{item.label}</a>
          ) : (
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive || item.also?.includes(pathname) ? "active" : ""
              }
            >
              {item.label}
            </NavLink>
          )}
        </Fragment>
      ))}
      <span
        className={`nav-indicator${armed ? " armed" : ""}`}
        aria-hidden="true"
        style={{
          opacity: mark.on ? 1 : 0,
          transform: `translate(${mark.x}px, ${mark.y}px) scaleX(${mark.scale})`,
        }}
      />
    </nav>
  )
}
