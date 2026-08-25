export function UnverifiedBadge({
  size = 16,
  title = "Unverified token",
}: {
  size?: number
  title?: string
}) {
  return (
    <span className="vbadge warn" title={title} role="img" aria-label={title}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <path
          stroke="currentColor"
          strokeWidth="1.75"
          d="M12 4L21 20H3L12 4Z"
        />
        <path stroke="currentColor" strokeWidth="1.75" d="M12 10v5M12 17.5v.5" />
      </svg>
    </span>
  )
}
