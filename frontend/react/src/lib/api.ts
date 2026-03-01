import type { AnalyseRequest, TacticalReport } from '@/types/gafferos'

const API_BASE = '/api'

export async function analyseMatch(body: AnalyseRequest): Promise<TacticalReport> {
  const res = await fetch(`${API_BASE}/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return res.json()
}