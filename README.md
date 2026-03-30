# K8sWhisperer — Immutable Audit Trail

## Project Title
**K8sWhisperer Immutable Audit Trail** — Tamper-proof incident logging on Stellar blockchain.

## Project Description
K8sWhisperer is an autonomous Kubernetes incident response agent that detects, diagnoses, and remediates cluster anomalies like crashes, memory issues, and pending pods. This Web3 module extends its pipeline with an **immutable audit trail** — every incident resolution is hashed (SHA-256), and the fingerprint is stored on the **Stellar blockchain** via a **Soroban smart contract**. A React dashboard lets operators verify that no audit records have been tampered with, bringing trustless accountability to AI-driven infrastructure decisions.

## Project Vision
When an AI agent autonomously restarts pods, patches memory limits, or escalates to human reviewers, there needs to be an unalterable record of *what happened and why*. By anchoring every incident's diagnosis, remediation action, and outcome hash on-chain, we create a verification layer that's independent of the agent itself — anyone can confirm the decision history hasn't been altered after the fact. This matters for compliance, post-mortem investigations, and building trust in autonomous systems.

## Key Features
- **SHA-256 Audit Hashing** — Every incident entry gets a deterministic hash stored on-chain
- **Soroban Smart Contract** — `log_incident`, `verify_incident`, `get_incident`, `get_recent_incidents` functions
- **Real-time Dashboard** — React + Tailwind with stats, incident table, and blockchain verification UI
- **Automatic Pipeline Integration** — Agent submits hashes after every remediation cycle via Stellar Python SDK
- **Tamper Detection** — Any modification to an audit log entry produces a different hash, revealing tampering

## Deployed Smart Contract Details

### Contract ID
```
CAAOY65YLBPR766MQ3PXIQ24H53WMOLR7Z7G6CKP5KHKZ6N2YF2XEX6F
```
🔗 [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CAAOY65YLBPR766MQ3PXIQ24H53WMOLR7Z7G6CKP5KHKZ6N2YF2XEX6F)
🔗 [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CAAOY65YLBPR766MQ3PXIQ24H53WMOLR7Z7G6CKP5KHKZ6N2YF2XEX6F)

### Contract Functions
| Function | Description |
|---|---|
| `initialize(admin)` | Set contract admin |
| `log_incident(reporter, hash, type, resource, decision, blast)` | Store incident on-chain |
| `verify_incident(id, hash)` | Check hash matches stored record |
| `get_incident(id)` | Retrieve a single record |
| `get_recent_incidents(count)` | Dashboard feed of latest incidents |
| `get_incident_count()` | Total number of stored incidents |

## UI Screenshots
The frontend provides three views:
1. **Dashboard** — Stats cards (total incidents, auto-remediated, HITL approved, blockchain records), anomaly distribution chart, decision breakdown bars, blockchain connection status
2. **Incidents** — Filterable table with expandable rows showing diagnosis, execution result, and incident ID
3. **Blockchain** — Incident selector with SHA-256 hash verification, on-chain proof status, and block explorer links

## Demo Link
```bash
# Start the K8sWhisperer API server (serves audit log to frontend)
uvicorn api.webhook:app --port 8002 --reload

# Start frontend dashboard
npm install && npm run dev

# Open http://localhost:3000
```

## Project Setup Guide

### Prerequisites
- Python 3.9+ with `stellar-sdk` (`pip install stellar-sdk`)
- Node.js 18+ (for the React frontend)
- Rust + Soroban CLI (only needed if redeploying the contract)
- A running K8sWhisperer agent instance (for live incident data)

### Installation
```bash
# Frontend
npm install

# Smart contract (optional — already deployed)
cd contracts/hello-world
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/k8s_audit_trail.wasm \
  --network testnet --source k8swhisperer
```

### Configuration
Create a `.env` file (see `.env.example`):
```bash
STELLAR_SECRET_KEY=S...         # Stellar testnet keypair secret
STELLAR_CONTRACT_ID=CAAOY65YLBPR766MQ3PXIQ24H53WMOLR7Z7G6CKP5KHKZ6N2YF2XEX6F
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

### Running
```bash
# Terminal 1: K8sWhisperer API + Agent
uvicorn api.webhook:app --port 8002 --reload

# Terminal 2: Frontend Dashboard
npm run dev

# Terminal 3: Trigger a test incident
kubectl apply -f k8s/test-scenarios/crashloop.yaml
```
The agent detects the incident → diagnoses → remediates → hashes the audit entry → submits to Stellar → frontend shows verification.

## Repository Structure
```
k8s-whisperer-audit-trail/
├── contracts/hello-world/      # Soroban smart contract (Rust)
│   ├── Cargo.toml
│   └── src/lib.rs              # log_incident, verify_incident, get_*
├── src/                        # React + Tailwind frontend
│   ├── components/
│   │   ├── Dashboard.jsx       # Stats cards, charts, blockchain status
│   │   ├── IncidentTable.jsx   # Filterable incident table with details
│   │   └── BlockchainVerifier.jsx  # On-chain hash verification UI
│   ├── App.jsx                 # Main app with tab navigation
│   ├── index.css               # Tailwind + glassmorphism styles
│   └── index.js                # React entry point
├── integration/                # Stellar-SDK integration (Python)
│   └── stellar_client.py      # submit_to_stellar, verify_on_chain
├── .env.example
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## How the Integration Works
1. K8sWhisperer agent detects an anomaly (CrashLoopBackOff, OOMKilled, etc.)
2. After remediation, the `explain_node` in the agent pipeline creates an audit log entry
3. `integration/stellar_client.py` computes a SHA-256 hash of the canonical JSON entry
4. The hash is submitted to the Soroban smart contract via `log_incident()`
5. The frontend fetches audit data and lets users verify hashes against on-chain records
6. Any tampered entry will produce a different hash — mismatch = tamper detected

## Future Scope
- Deploy contract to Stellar mainnet for production audit trails
- Add multi-signature approval for HITL decisions on-chain
- NFT-based incident certificates for compliance auditing
- Cross-cluster audit aggregation via Stellar anchors
- Real-time WebSocket updates for the dashboard
