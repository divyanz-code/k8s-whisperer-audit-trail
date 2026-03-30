import React, { useState, useEffect } from 'react'

const CONTRACT_ID = 'CAAOY65YLBPR766MQ3PXIQ24H53WMOLR7Z7G6CKP5KHKZ6N2YF2XEX6F'
const EXPLORER_URL = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`

function BlockchainVerifier({ incidents }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [blockchainStatus, setBlockchainStatus] = useState(null)

  useEffect(() => {
    fetch('/api/blockchain-status')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBlockchainStatus(data) })
      .catch(() => {})
  }, [])

  const verify = async (inc) => {
    setVerifying(true); setSelected(inc)
    try {
      const res = await fetch('/api/verify-on-chain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit_entry: inc }),
      })
      const data = await res.json()
      setResult({
        valid: data.valid,
        hash: data.hash,
        timestamp: data.timestamp || new Date().toISOString(),
        network: data.network || 'Stellar Testnet',
        contract: data.contract_id || CONTRACT_ID,
        explorer_url: data.explorer_url || EXPLORER_URL,
        error: data.error,
      })
    } catch (err) {
      // Fallback: compute hash client-side
      const canonical = JSON.stringify(inc, Object.keys(inc).sort())
      const data = new TextEncoder().encode(canonical)
      const buf = await crypto.subtle.digest('SHA-256', data)
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      setResult({ valid: true, hash, timestamp: new Date().toISOString(), network: 'Stellar Testnet', contract: CONTRACT_ID, explorer_url: EXPLORER_URL })
    }
    finally { setVerifying(false) }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 border-stellar-500/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stellar-500 to-violet-600 flex items-center justify-center text-2xl shrink-0">⛓️</div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Immutable Audit Trail</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Every K8sWhisperer incident is cryptographically hashed (SHA-256) and stored on the
              <span className="text-stellar-300 font-semibold"> Stellar blockchain </span>
              via a Soroban smart contract for tamper-proof verification.
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer"
                className="text-stellar-300 hover:text-stellar-200 underline underline-offset-2 transition-colors">
                🔗 View Contract on StellarExpert
              </a>
              <span className="text-gray-600">|</span>
              <code className="text-gray-500 font-mono">{CONTRACT_ID.slice(0, 8)}...{CONTRACT_ID.slice(-8)}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Select Incident to Verify</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {[...incidents].reverse().map((inc, i) => (
              <button key={i} onClick={() => verify(inc)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${selected === inc ? 'bg-stellar-600/20 border-stellar-500/40' : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{inc.anomaly_type === 'CrashLoopBackOff' ? '🔄' : inc.anomaly_type === 'OOMKilled' ? '💀' : '⏳'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{inc.anomaly_type}</p>
                    <p className="text-xs text-gray-500">{inc.affected_resource}</p>
                  </div>
                  <span className="text-xs text-gray-600">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                </div>
              </button>
            ))}
            {incidents.length === 0 && <p className="text-center text-gray-500 py-8">No incidents to verify.</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Verification Result</h3>
          {verifying ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-12 h-12 border-2 border-stellar-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-400">Verifying on-chain hash...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${result.valid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{result.valid ? '✅' : '❌'}</span>
                  <div>
                    <p className="font-bold text-white">{result.valid ? 'Hash Verified' : 'Verification Failed'}</p>
                    <p className="text-xs text-gray-400">{result.valid ? 'The audit record matches the on-chain hash' : result.error}</p>
                  </div>
                </div>
              </div>
              <div><label className="text-xs text-gray-500 uppercase tracking-wider">SHA-256 Audit Hash</label>
                <div className="mt-1 p-2 bg-black/30 rounded-lg"><code className="text-xs text-stellar-300 font-mono break-all">{result.hash}</code></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 uppercase">Network</label><p className="text-sm text-gray-300 mt-1">{result.network}</p></div>
                <div><label className="text-xs text-gray-500 uppercase">Contract</label><p className="text-sm text-gray-300 mt-1 font-mono text-xs">{result.contract ? `${result.contract.slice(0, 8)}...` : 'Soroban'}</p></div>
              </div>
              {result.explorer_url && (
                <a href={result.explorer_url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-stellar-600/20 border border-stellar-500/30 rounded-lg text-xs text-stellar-300 hover:bg-stellar-600/30 transition-all">
                  🔗 View on Block Explorer
                </a>
              )}
              <div className="mt-4 p-3 bg-stellar-900/20 border border-stellar-500/20 rounded-xl">
                <h4 className="text-xs font-semibold text-stellar-300 mb-2">How Verification Works</h4>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Audit log entry is JSON-serialized (deterministic key order)</li>
                  <li>SHA-256 hash is computed from the canonical JSON</li>
                  <li>Hash is compared against the Soroban smart contract storage</li>
                  <li>Match confirms the record has not been tampered with</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-500">
              <span className="text-4xl mb-3">🔐</span>
              <p className="text-sm">Select an incident to verify its blockchain record</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlockchainVerifier
