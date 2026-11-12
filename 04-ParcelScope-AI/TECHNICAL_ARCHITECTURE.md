# ParcelScope — Technical Architecture

## Status

This document describes the **current implemented prototype**. It separates verified behavior from future production recommendations.

The current codebase is maintained in Replit and is branded ESTANVIO. This GitHub portfolio entry documents the active implementation and product decisions while development continues.

## 1. System shape

ParcelScope uses a local-first web architecture:

```
React / TypeScript browser client
        ↓
Generated API client
        ↓
Node / Express API
        ↓
Charleston County ArcGIS services
```

Most document processing and research state remain in the browser.

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix-based UI components
- Wouter routing
- TanStack Query

Main product views include Auction List, Property View, and My Research.

### Backend

- Node.js
- Express 5
- TypeScript
- esbuild production bundle
- Shared OpenAPI contract
- Generated client types
- Zod validation

Primary API behavior is intentionally narrow: the server acts mainly as a controlled adapter to county parcel/GIS services.

## 2. Parcel lookup

The lookup flow is:

```
Exact 10-digit parcel ID
        ↓
Server validation
        ↓
Charleston County ArcGIS query
        ↓
Response + geometry validation
        ↓
Normalized parcel result
        ↓
Leaflet map and property view
```

The implementation preserves leading zeros.

It rejects:

- Ambiguous parcel results
- Parcel-ID mismatches
- Unexpected coordinate systems
- Invalid polygon geometry

A possible extra-zero correction requires explicit user confirmation; it is not silently applied.

The API returns:

- County attributes where available
- Polygon rings
- Calculated centroid
- Source/query links
- Retrieval timestamp
- Warnings

The current implementation uses an official Charleston County parcel layer with an official ProVal backup layer when needed.

## 3. Mapping

Leaflet renders the parcel polygon.

Map imagery and parcel geometry remain separate sources.

Current map-related sources include:

- Charleston County parcel geometry
- USGS / The National Map imagery or topographic tiles
- External Google Maps / Street View links based on parcel location

A GIS polygon is not represented as a legal survey.

## 4. Request behavior and reliability

Parcel lookup is explicit rather than search-on-every-keystroke.

When the requested parcel changes, prior client requests are cancelled so that a slow response for an older parcel cannot replace the currently selected parcel.

Current backend safeguards include approximately:

- 8-second county-request timeout
- Process-local request budget
- Burst capacity around 20
- Refill around 2 requests/second
- Maximum around 8 active distinct lookups
- Same-PID request deduplication
- 429 response behavior with retry guidance
- No-store parcel responses
- Structured logging with sensitive-header redaction

These controls are process-local, not distributed per-user production rate limiting.

## 5. CSV / XLSX import

Files are processed locally in the browser.

### CSV

- Papa Parse
- Browser worker

### XLSX

- ExcelJS
- Dedicated Web Worker

Running workbook parsing off the main UI thread avoids freezing the interface during heavier workbook work.

The user reviews the suggested header row and column mapping before using imported rows.

Imported owner/address/amount values remain unverified list snapshots until separately researched.

The system does not invent missing leading zeros or blindly expand scientific-notation parcel IDs.

Current guardrails include approximately:

- 20 MB spreadsheet limit
- 50,000-row limit
- 150 XLSX-column limit
- 45-second workbook timeout

## 6. PDF / image OCR

The OCR path is browser-local.

It does **not** currently use OpenAI, Gemini, Claude, Google Vision, or another cloud OCR service.

### PDF

PDF.js first attempts to use an existing PDF text layer.

If a page does not contain sufficient usable text, the page is rendered to a canvas and passed to OCR.

### Photos

Images are decoded and resized locally before recognition.

### OCR engine

- Tesseract.js 7
- English LSTM recognition engine
- Web Workers
- WebAssembly
- App-served OCR engine/training assets

HEIC/HEIF has a fallback conversion path using `heic-to`.

Current processing boundaries include approximately:

- 30 pages maximum
- 25 MB per file
- Images reduced to a maximum side near 3,200 px

## 7. OCR trust model

OCR generates **candidates**, not trusted parcel records.

The review workflow can expose:

- Recognized text
- Candidate parcel identifiers
- Source line/crop where available
- Ambiguous characters
- Invalid lengths
- Duplicates

Users can correct and select candidates.

Explicit review is required because OCR can confidently return a wrong character.

After review, a candidate parcel ID is still validated through the county lookup path.

## 8. OCR/document failure states

Handled failure scenarios include:

- Missing OCR assets
- Unsupported browser capabilities
- Unreadable PDFs
- Password-protected PDFs
- HEIC conversion failure
- OCR cancellation
- No candidates
- Invalid parcel-ID length
- Duplicate candidates
- Recognition ambiguity

The system should expose failure rather than silently inventing success.

## 9. Persistence

Current research persistence uses browser `localStorage`.

It can store:

- Imported lists
- Watchlist state
- Notes
- Research status
- Maximum bids
- Saved parcel snapshots
- Retrieval times
- Manual scenarios
- Recent searches
- Checklist/UI preferences

There is currently:

- No active server-side research database
- No account isolation
- No cross-device synchronization

A PostgreSQL/Drizzle scaffold exists in the repository, but the current application routes do not use it for research persistence.

## 10. Calculations

Current scenario calculations are deterministic client-side arithmetic.

They are not AI valuations or autonomous bidding recommendations.

Examples include:

- User-entered resale scenarios
- Manual bid scenarios
- Redemption illustrations using explicitly supplied/confirmed values

## 11. Export

The browser generates CSV exports for supported research fields.

Supported data can include:

- Notes
- Maximum bid
- Selected metadata
- Scenario fields

Supported research fields can be restored through reimport.

Formula-like CSV values are neutralized to reduce spreadsheet formula-injection risk.

## 12. Authentication / authorization

Not currently implemented:

- User login
- Session identity
- Tenant permissions
- Role-based access
- Subscription entitlement

Authentication-related dependencies or environment variables do not mean the feature is connected.

## 13. Current failure model

Important failure categories include:

- Invalid/no-match parcel ID
- Ambiguous parcel response
- County timeout/outage
- Malformed county response
- Rate limiting
- Imagery tile failure
- Local-storage failure
- Spreadsheet parse failure
- OCR/document failure

The UI avoids presenting an old parcel as a successful new lookup after a failed request.

## 14. Production evolution

A multi-user production version would require:

- Authentication
- Authorization and record ownership
- Durable database-backed research state
- Backups and recovery
- Local-to-account migration
- Cross-device synchronization
- Conflict handling
- Production monitoring/alerting
- Distributed abuse protection
- Security-header/CORS hardening
- Retention/deletion policy
- Access auditing
- Production deployment validation
- Data/imagery rights review

Local OCR could remain valuable because it minimizes unnecessary server-side document processing.

## 15. Architecture principle

ParcelScope deliberately avoids adding an LLM where structured software is a better fit.

Today the product uses:

- GIS APIs for authoritative parcel data
- Deterministic validation for IDs and geometry
- Browser workers for heavy parsing
- OCR for semi-structured input
- Human confirmation for recognition risk
- Local persistence for prototype speed
- Deterministic arithmetic for scenario calculations

Future AI should be added only where discovery demonstrates a real user benefit.
