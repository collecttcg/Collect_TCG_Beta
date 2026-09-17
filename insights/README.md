# Collect TCG Insights — Standalone Beta

Version: `2026-09-18-v02`

Standalone owner-only Beta PWA for Collect TCG Insights.

Beta URL: `https://collecttcg.github.io/Collect_TCG_Beta/insights/`

Production standalone Insights remains separate at `https://collecttcg.github.io/Collect_TCG_Insights/`.

This initial Beta is functionally aligned with the current standalone Production Insights app, with a separate Beta identity, cache namespace, PWA scope, and deployment path. It reuses the existing Supabase owner authentication and owner-only analytics RPCs.

## v02 intelligence alignment

- Decision-first Overview metrics
- Strict Contact Viewed / Contact Intent funnel
- Era demand vs inventory share
- Visible Price Band demand panel
- Country -> top Era / top Card demand using the existing owner-only aggregate RPC
- Opportunity signals
- Language retained as secondary context
- No inventory mutation controls; read-only owner analytics only
