import { useState } from "react"

import { explorerUrl } from "../config"
import { ArrowUpRight, Copy } from "./Icon"
import { Modal } from "./Modal"
import { VerifiedBadge } from "./VerifiedBadge"

export function SuccessModal({
  open,
  title,
  subtitle,
  txHash,
  dealUrl,
  actionLabel,
  onAction,
  closeLabel = "Close",
  onClose,
}: {
  open: boolean
  title: string
  subtitle?: string
  txHash?: string
  dealUrl?: string
  actionLabel?: string
  onAction?: () => void
  closeLabel?: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            {closeLabel}
          </button>
          {actionLabel && onAction && (
            <button type="button" className="btn primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </>
      }
    >
      <div className="modal-seal">
        <VerifiedBadge size={24} />
        <span className="label">Confirmed on chain</span>
      </div>

      {subtitle && <p>{subtitle}</p>}

      {dealUrl && (
        <div className="copy-row">
          <span className="url mono">{dealUrl}</span>
          <button
            type="button"
            className="btn sm secondary"
            onClick={() => {
              navigator.clipboard.writeText(dealUrl)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            }}
          >
            <Copy size={16} />
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}

      {txHash && (
        <a
          className="btn-link"
          href={explorerUrl(`/tx/${txHash}`)}
          target="_blank"
          rel="noreferrer"
        >
          View the transaction
          <ArrowUpRight size={16} />
        </a>
      )}
    </Modal>
  )
}
