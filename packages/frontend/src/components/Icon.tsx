/**
 * The icon subset this app uses, drawn on the brand grid.
 * 24 by 24 grid, 20 by 20 live area, 1.5px stroke, butt caps, mitre joins.
 * Read docs/brand/iconography.md before you add one.
 */

type IconProps = {
  size?: number
  className?: string
  title?: string
}

function svgProps({ size = 20, className, title }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "butt" as const,
    strokeLinejoin: "miter" as const,
    className,
    "aria-hidden": title ? undefined : true,
    "aria-label": title,
    role: title ? "img" : undefined,
  }
}

export function ChevronDown(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}

export function Check(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  )
}

export function X(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export function Copy(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="9" y="9" width="11" height="11" />
      <path d="M15 5H4v11" />
    </svg>
  )
}

export function Clock(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5.5l4 2.5" />
    </svg>
  )
}

export function ClockAlert(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M20 12a8 8 0 1 1-8-8" />
      <path d="M12 7v5.5l3.5 2" />
      <path d="M19 4v4M19 10.5v.5" />
    </svg>
  )
}

export function CircleDot(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TriangleAlert(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 4l8.5 15h-17L12 4z" />
      <path d="M12 10v4M12 16.5v.5" />
    </svg>
  )
}

export function OctagonX(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M8.5 3.5h7L20.5 8.5v7L15.5 20.5h-7L3.5 15.5v-7z" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  )
}

export function Info(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8v.5" />
    </svg>
  )
}

export function Search(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  )
}

export function SlidersHorizontal(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <path d="M14 5v6M8 13v6" />
    </svg>
  )
}

export function Percent(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M19 5L5 19" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  )
}

export function Lock(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="5" y="10" width="14" height="10" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function Link(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M10 14a4 4 0 0 1 0-5.5L12.5 6a4 4 0 0 1 5.5 5.5L16.5 13" />
      <path d="M14 10a4 4 0 0 1 0 5.5L11.5 18A4 4 0 0 1 6 12.5L7.5 11" />
    </svg>
  )
}

export function Plus(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
