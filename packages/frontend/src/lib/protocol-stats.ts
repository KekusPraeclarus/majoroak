import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"

import {
  FACTORY_DEPLOYED,
  INDEXER_FALLBACK,
} from "../config"
import { PRESET_TOKENS } from "../tokens"
import { addQuoteUsd, indexerConfigured, useIndexerStats } from "./discovery"
import { scanFactoryDeals } from "./discovery-rpc"
import { useEthUsd } from "./prices"

export type ProtocolStats = {
  settledUsd: number
  lockedUsd: number
  settledPriced: boolean
  lockedPriced: boolean
  verifiedMarkets: number
  uniqueWallets: number
  ready: boolean
  loading: boolean
  live: boolean
}

const empty: ProtocolStats = {
  settledUsd: 0,
  lockedUsd: 0,
  settledPriced: false,
  lockedPriced: false,
  verifiedMarkets: PRESET_TOKENS.length,
  uniqueWallets: 0,
  ready: false,
  loading: false,
  live: false,
}

export function useProtocolStats(): ProtocolStats {
  const ethUsd = useEthUsd()
  const publicClient = usePublicClient()
  const useApi = FACTORY_DEPLOYED && indexerConfigured()
  const useFallback = FACTORY_DEPLOYED && !useApi && INDEXER_FALLBACK && !!publicClient

  const api = useIndexerStats(useApi)
  const fallback = useQuery({
    queryKey: ["protocol-stats-fallback"],
    enabled: useFallback,
    staleTime: 30_000,
    refetchInterval: 30_000,
    queryFn: async () => (await scanFactoryDeals(publicClient!)).stats,
  })

  const stats = useApi ? api.data : fallback.data
  const loading = useApi ? api.isLoading : fallback.isLoading
  const error = useApi ? api.isError : fallback.isError

  if (!FACTORY_DEPLOYED) {
    return { ...empty, ready: true, settledPriced: true, lockedPriced: true }
  }
  if (!useApi && !useFallback) {
    return { ...empty, loading: false }
  }
  if (!stats) {
    return { ...empty, loading, live: false }
  }
  if (error) {
    return { ...empty, ready: false, loading: false, live: false }
  }

  const settled = addQuoteUsd(stats.settled, ethUsd)
  const locked = addQuoteUsd(stats.open, ethUsd)
  return {
    settledUsd: settled.usd,
    lockedUsd: locked.usd,
    settledPriced: settled.priced,
    lockedPriced: locked.priced,
    verifiedMarkets: PRESET_TOKENS.length,
    uniqueWallets: stats.uniqueWallets,
    ready: true,
    loading: false,
    live: true,
  }
}
