import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { APP_EXTERNAL, appHref, SITE_EXTERNAL, siteHref } from "../config"

type Props = {
  className?: string
  to?: string
  children: ReactNode
  "aria-label"?: string
}

/* A link into the application. It stays a route while both share one host. */
export function AppLink({ className, to = "/create", children }: Props) {
  if (APP_EXTERNAL) {
    return (
      <a className={className} href={appHref(to)}>
        {children}
      </a>
    )
  }
  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  )
}

/* A link to the marketing pages. The brand mark uses it on every host. */
export function SiteLink({ className, to = "/", children, ...rest }: Props) {
  if (SITE_EXTERNAL) {
    return (
      <a className={className} href={siteHref(to)} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link className={className} to={to} {...rest}>
      {children}
    </Link>
  )
}
