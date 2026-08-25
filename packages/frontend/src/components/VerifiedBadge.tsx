export function VerifiedBadge({
  size = 16,
  title = "Official MajorOak listing",
}: {
  size?: number
  title?: string
}) {
  return (
    <span className="vbadge" title={title} role="img" aria-label={title}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path d="M12 1L23 12L12 23L1 12Z" fill="currentColor" />
        <path
          d="M8 12.2 L11 15.2 L16.2 9.2"
          fill="none"
          stroke="var(--mo-canvas)"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  )
}
