# ParcelScope

> **Current build — active product discovery and prototype development**

ParcelScope is a property-research and tax-auction preparation product I am actively building and validating. The current Replit codebase is branded **ESTANVIO**; ParcelScope is the working project name used throughout product discovery.

The product is designed to reduce the fragmentation involved in researching parcels across county GIS systems, auction lists, spreadsheets, PDFs/photos, maps, notes, bid scenarios, and official property-record sources.

**Current status:** working prototype in active discovery. Not a production SaaS product and not yet publicly deployed.

## What exists today

The current prototype includes:

- Live Charleston County parcel lookup and boundary retrieval
- Exact 10-digit parcel-ID validation
- Charleston County ArcGIS integration with validated parcel geometry
- XLSX/CSV import with clickable parcel rows
- Drag-and-drop file handling
- PDF/photo OCR with explicit human review
- County-record source links
- USGS map imagery plus external Google Maps / Street View links
- Local research notes and watchlist state
- Manual bid and redemption scenarios
- CSV export/reimport for supported research fields

## Current architecture

The current implementation uses:

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Radix-based UI components
- **Routing/state:** Wouter and TanStack Query
- **Backend:** Node.js, Express 5, TypeScript
- **API contract:** shared OpenAPI contract with generated client types and Zod validation
- **Mapping:** Leaflet plus official Charleston County parcel geometry and USGS imagery
- **CSV import:** Papa Parse in a browser worker
- **XLSX import:** ExcelJS in a dedicated Web Worker
- **PDF processing:** PDF.js
- **OCR:** Tesseract.js 7 using WebAssembly/Web Workers
- **HEIC fallback:** heic-to
- **Persistence today:** browser localStorage
- **Database status:** PostgreSQL/Drizzle scaffold exists, but current research workflows do not use it

For the detailed implementation and failure model, see **[Technical Architecture](TECHNICAL_ARCHITECTURE.md)**.

## Core data flow

```
User input / imported list
        ↓
Parcel ID validation
        ↓
Express API
        ↓
Charleston County ArcGIS
        ↓
Validated parcel record + polygon
        ↓
React client / Leaflet map
        ↓
Local research notes, scenarios, export
```

Document processing follows a different path:

```
CSV / XLSX / PDF / photo
        ↓
Browser-local parsing / OCR
        ↓
Candidate parcel IDs
        ↓
Human review and correction
        ↓
Explicit parcel lookup against county GIS
```

The OCR result is **not** treated as the source of truth. It only assists with input. The authoritative parcel lookup still comes from county GIS.

## Product and trust boundaries

ParcelScope is intentionally explicit about what it does **not** verify.

A parcel match or map display does not constitute:

- Legal title verification
- A land survey
- Flood clearance
- Zoning approval
- Road-access verification
- Buildability confirmation
- Property-condition assurance
- Investment or bid advice

Official and licensed sources remain authoritative.

## Why the project is technically interesting

ParcelScope combines several different problem types without forcing AI into every layer:

- Structured GIS/API retrieval for parcel data
- Deterministic parcel-ID and geometry validation
- Browser workers for large file processing
- OCR for semi-structured documents
- Human review where recognition can be wrong
- Local-first persistence for prototype speed
- Deterministic calculations for bid scenarios
- External source links for authoritative verification

The product reflects a broader design principle:

> **Use AI or probabilistic systems where flexible interpretation adds value. Keep authority, validation, and high-risk decisions explicit and deterministic.**

## Active discovery

I am currently validating ParcelScope with real-estate professionals rather than assuming the final workflow.

Discovery focuses on:

- Which tools agents/investors use today
- Where they duplicate work
- Which property details take longest to verify
- Auction-day time pressure and failure points
- Which information must remain in MLS/CRM or official county systems
- Whether client-ready reports, comparison tools, field notes, or synchronization are actually worth building
- What outcome would justify paying for the product

See **[Discovery & Roadmap](DISCOVERY_AND_ROADMAP.md)**.

## Current limitations

Do not treat these as implemented capabilities:

- No verified public production deployment
- No account/login system
- No tenant authorization model
- No active server-side research database
- No cross-device synchronization
- No MLS integration
- No CRM integration
- No automatic title/flood/zoning clearance
- No production customer or revenue claims
- Real phone-camera capture and HEIC behavior still need broader device validation

## Production direction

If evidence supports moving ParcelScope beyond the current prototype, the next major architectural work would include:

1. Authentication and authorization
2. Durable database-backed research state
3. Local-to-account data migration
4. Cross-device synchronization and conflict handling
5. Monitoring, alerting, and production error tracking
6. Distributed rate limiting and stronger security controls
7. Data-retention/deletion rules and source/licensing review
8. Production deployment and smoke testing

## My role

I am responsible for:

- Problem framing and workflow discovery
- Product requirements and prioritization
- Technical-product architecture decisions
- GIS/source behavior
- Import and OCR trust boundaries
- Failure-state definition
- Acceptance testing
- Customer discovery
- Roadmap decisions
- AI-assisted prototype implementation and iteration

I use AI-assisted development tools as part of implementation. I do not claim to have manually written every line of code.

## Interview takeaway

ParcelScope is the project I am **actively building now**. Unlike the completed/frozen portfolio baselines, it shows the product process while it is still happening:

**workflow discovery → working prototype → user observation → evidence → product decision → next iteration**

The goal is not to make the prototype look finished. The goal is to use evidence to decide what deserves to become production software.
