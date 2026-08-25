import { useEffect, useState } from "react"

type ThemeChoice = "system" | "light" | "dark"

const THEME_CYCLE: Record<ThemeChoice, ThemeChoice> = {
  system: "light",
  light: "dark",
  dark: "system",
}

function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark" || stored === "system") return stored
    return "system"
  })

  useEffect(() => {
    if (choice === "system") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.dataset.theme = choice
    }
    localStorage.setItem("theme", choice)
  }, [choice])

  const next = THEME_CYCLE[choice]
  return {
    choice,
    cycle: () => setChoice(next),
    nextLabel: `Switch to ${next} theme`,
  }
}

function ThemeIcon({ choice }: { choice: ThemeChoice }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "butt" as const,
    strokeLinejoin: "miter" as const,
    "aria-hidden": true,
  }
  if (choice === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
      </svg>
    )
  }
  if (choice === "dark") {
    return (
      <svg {...common}>
        <path d="M15 4.5A8 8 0 1 0 19.5 15 6.5 6.5 0 0 1 15 4.5Z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="4" y="5" width="16" height="12" />
      <path d="M8 21h8" />
    </svg>
  )
}

export function ThemeToggle() {
  const { choice, cycle, nextLabel } = useTheme()

  return (
    <button type="button" className="icon-button" onClick={cycle} aria-label={nextLabel}>
      <ThemeIcon choice={choice} />
    </button>
  )
}
