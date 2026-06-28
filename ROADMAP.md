# Skin Platform — Core Feature Implementation Plan

**Team:** Paul (FE) · Paul Georg (Derma) · Max Georg (BE)  
**Stack:** React Native / Expo · Node.js / TypeScript · PostgreSQL · AWS / GCP  
**Last updated:** June 2026

---

## Current Status & Immediate Next Steps

### What's built (prototype, June 2026)

- Expo Router v5, NativeTabs, design system (Wise-inspired brand)
- 4-tab prototype: UV Dashboard · Dermetrics · Longevity · Shop
- Auth screens (Login / Signup — UI only, no backend)
- `eas.json` configured for Android APK builds

### Next ~2 weeks

1. **Wire real UV data** — [OpenUV API](https://www.openuv.io/) (free tier) + `expo-location`
2. **Decide backend stack** — Supabase is fastest path; see Open Decisions below
3. **Auth backend** — Supabase Auth / Cognito; connect Login/Signup screens to real JWTs

### Prototype gaps to fill before Phase 2

- [ ] Location permission → real UV index (replaces hardcoded `7`)
- [ ] Sunscreen reminder → local push notification 2h after "Applied now" tap
- [ ] Sun exposure tracking → persist state (AsyncStorage / SQLite for now)
- [ ] Longevity score + Dermetrics results → connect to real scan data (Phase 2)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1 — Foundation & Compliance](#2-phase-1--foundation--compliance)
3. [Phase 2 — Scan & Clinical Flow](#3-phase-2--scan--clinical-flow)
4. [Phase 3 — Telemedicine & Messaging](#4-phase-3--telemedicine--messaging)
5. [Phase 4 — Beauty & Care E-Shop](#5-phase-4--beauty--care-e-shop)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [Team Responsibilities Matrix](#7-team-responsibilities-matrix)
8. [Open Decisions](#8-open-decisions)

---

## 1. Architecture Overview

### System Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEDICAL PLATFORM (SaMD)                     │
│   Auth · Scan Ingestion · AI Analysis · Doctor Dashboard        │
│   Patient Results · Telemedicine · Secure Messaging             │
│                                                                 │
│   Database: medical_db (GDPR Art.9, encrypted at rest)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
              opt-in consent bridge
              (anonymised skin profile only)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                       E-SHOP (standard)                         │
│   Product Catalog · Recommendations · Checkout · Orders         │
│                                                                 │
│   Database: shop_db (standard PII rules)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principles

- Medical data and shop data are **never stored in the same database**.
- The opt-in bridge passes only an **anonymised skin profile** (JSON struct, no scan images, no diagnosis text).
- Every patient action on medical data is **audit-logged** with timestamp, actor, and action.
- All cross-service communication goes through an **internal API gateway** — no direct DB cross-access.
- Expo app is the **single patient-facing client** across iOS, Android, and web.

### Proposed Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile / Web client | Expo (React Native) v56 | Single codebase for iOS, Android, Web |
| Auth | **Clerk** ✅ decided | `@clerk/clerk-expo` — sessions, MFA, social login, JWT |
| Backend / DB / Realtime | **Convex** ✅ decided | Reactive queries, mutations, file storage, scheduled functions |
| File storage | Convex File Storage | Scan image uploads via `useUploadFile` |
| Video | Daily.co or Twilio Video | HIPAA-eligible EU plans |
| Payments | Stripe | Shop only — `@stripe/stripe-react-native` |
| AI inference | Third-party dermatology API (MVP) | SkinVision / Haut.AI; Convex Action calls the API |
| Push notifications | Expo Notifications (FCM + APNs) | Triggered from Convex scheduled functions |
| CI/CD | GitHub Actions + EAS | EAS Build for native, EAS Update for OTA |

**Reference implementation:** `~/RustroverProjects/turbo-expo-nextjs-clerk-convex-monorepo`

#### Clerk → Convex auth wiring (pattern)

```typescript
// app/_layout.tsx
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Stack screenOptions={{ headerShown: false }} />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

#### Convex schema (medical tables)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  patients: defineTable({
    clerkUserId: v.string(),          // from Clerk identity
    skinType: v.optional(v.number()), // Fitzpatrick 1–6
    gdprConsentAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  }).index('by_clerk', ['clerkUserId']),

  scans: defineTable({
    patientId: v.id('patients'),
    storageId: v.string(),            // Convex file storage ID
    status: v.string(),               // pending | analysing | reviewed | delivered
    capturedAt: v.number(),
  }).index('by_patient', ['patientId']),

  analysisResults: defineTable({
    scanId: v.id('scans'),
    modelVersion: v.string(),
    findings: v.any(),                // structured JSON
    overallRisk: v.string(),
  }),
});
```

---

## 2. Phase 1 — Foundation & Compliance

**Duration:** Months 1–3  
**Goal:** Skeleton that everyone can build on. Auth works, data model is locked, compliance baseline is documented.

---

### 2.1 GDPR & MDR Compliance Baseline

**Owner:** Paul Georg + Max Georg  
**Why first:** Every architectural decision downstream depends on this.

#### Tasks

- [ ] **Legal classification** — Determine if the AI analysis qualifies as a medical device under EU MDR 2017/745 / IVDR 2017/746. Engage a regulatory consultant if needed.
- [ ] **Data Protection Impact Assessment (DPIA)** — Required under GDPR Art. 35 before processing special category health data at scale.
- [ ] **Appoint a Data Protection Officer (DPO)** — Mandatory if processing health data as core business.
- [ ] **Document data flows** — Map every place PHI is created, stored, transmitted, and deleted.
- [ ] **Define retention policies** — Scan images, diagnostic results, chat messages, prescriptions.
- [ ] **Consent framework design** — Two separate consent flows: (a) medical platform, (b) shop opt-in data bridge. Paul Georg to draft clinical wording.
- [ ] **Audit log schema** — Designed and implemented before any PHI is written.

#### Audit Log Schema (medical_db)

```sql
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id      UUID NOT NULL,          -- patient or doctor
  actor_role    TEXT NOT NULL,          -- 'patient' | 'doctor' | 'system'
  action        TEXT NOT NULL,          -- 'scan.viewed' | 'result.accessed' etc.
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB
);
CREATE INDEX ON audit_log (actor_id, timestamp DESC);
CREATE INDEX ON audit_log (resource_type, resource_id);
```

---

### 2.2 Data Architecture

**Owner:** Max Georg  
**Deliverable:** Two separate Postgres instances, seeded schemas, migration tooling in place.

#### medical_db schema (core tables)

```sql
-- Patients
CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub     TEXT UNIQUE NOT NULL,   -- links to auth provider
  email_hash      TEXT NOT NULL,          -- hashed, for lookup only
  date_of_birth   DATE,
  skin_type       SMALLINT,               -- Fitzpatrick scale 1–6
  created_at      TIMESTAMPTZ DEFAULT now(),
  gdpr_consent_at TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ             -- soft delete / right to erasure
);

-- Doctors
CREATE TABLE doctors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub     TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  license_number  TEXT NOT NULL,
  specialty       TEXT,
  is_active       BOOLEAN DEFAULT true
);

-- Scans
CREATE TABLE scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  device_id       TEXT,
  captured_at     TIMESTAMPTZ NOT NULL,
  storage_key     TEXT NOT NULL,          -- S3/GCS path, never a public URL
  status          TEXT NOT NULL DEFAULT 'pending',
                                          -- pending | analysing | reviewed | delivered
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- AI Analysis Results
CREATE TABLE analysis_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         UUID NOT NULL REFERENCES scans(id),
  model_version   TEXT NOT NULL,
  findings        JSONB NOT NULL,         -- structured lesion list
  overall_risk    TEXT,                   -- 'low' | 'medium' | 'high' | 'urgent'
  confidence      NUMERIC(4,3),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Doctor Reviews
CREATE TABLE doctor_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         UUID NOT NULL REFERENCES scans(id),
  doctor_id       UUID NOT NULL REFERENCES doctors(id),
  status          TEXT NOT NULL,          -- 'approved' | 'amended' | 'escalated'
  clinical_notes  TEXT,                   -- encrypted at application layer
  reviewed_at     TIMESTAMPTZ DEFAULT now()
);
```

#### shop_db schema (core tables)

```sql
CREATE TABLE shop_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  -- NO reference to medical patient ID
  skin_profile_id UUID                    -- references opt_in_profiles if consented
);

-- Anonymised skin profiles written by the opt-in bridge
CREATE TABLE opt_in_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NO patient_id, NO scan_id, NO diagnoses
  skin_type       SMALLINT,
  primary_concerns TEXT[],               -- ['dryness','sensitivity','pigmentation']
  avoid_ingredients TEXT[],
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### Opt-in Bridge Service

A dedicated micro-service (not a DB join) that:

1. Checks the patient's `gdpr_consent_at` and a separate `shop_optin_consent` record.
2. Reads only the safe fields from `analysis_results.findings`.
3. Writes/updates a row in `shop_db.opt_in_profiles`.
4. Logs every bridge execution in `medical_db.audit_log`.

---

### 2.3 Patient Authentication

**Owner:** Paul (FE) + Max Georg (BE)  
**Deliverable:** Working sign-up, login, MFA, and session management in the Expo app.

#### Backend tasks

- [ ] Set up AWS Cognito user pool (or Auth0 tenant) with MFA enforced.
- [ ] Create two user groups: `patients` and `doctors` (separate permissions).
- [ ] JWT validation middleware for all API routes.
- [ ] Refresh token rotation with 30-minute access token TTL.
- [ ] Account deletion endpoint (GDPR right to erasure — cascading soft delete).

#### Frontend tasks (Expo)

- [ ] Splash screen and onboarding flow.
- [ ] Sign-up screen: email + password + MFA setup (TOTP or SMS).
- [ ] Login screen with biometric fallback (Face ID / Fingerprint via `expo-local-authentication`).
- [ ] Forgot password / reset flow.
- [ ] Session expiry handling: auto-redirect to login, preserve navigation state.
- [ ] Secure token storage using `expo-secure-store` (never AsyncStorage for tokens).

#### Auth flow

```
Patient opens app
  → check SecureStore for valid refresh token
  → if valid: silently refresh access token → home screen
  → if invalid / absent: show login screen
      → Cognito auth → receive tokens
      → MFA challenge (TOTP / SMS)
      → on success: store tokens in SecureStore → home screen
```

---

### 2.4 Expo Project Scaffold

**Owner:** Paul  
**Deliverable:** Running app on iOS simulator, Android emulator, and Expo web.

#### Project structure

```
apps/
  mobile/                    # Expo app
    app/                     # Expo Router file-based routes
      (auth)/
        login.tsx
        signup.tsx
      (medical)/
        scan/
        results/
        messages/
        appointments/
      (shop)/
        index.tsx
        product/[id].tsx
        cart.tsx
      _layout.tsx
    components/
      ui/                    # shared design system components
      medical/
      shop/
    hooks/
    services/                # API clients
    store/                   # Zustand or Redux Toolkit
    constants/

packages/
  api-client/               # shared typed API client (tRPC or OpenAPI-generated)
  ui/                       # shared component library

services/
  medical-api/              # Fastify backend — medical domain
  shop-api/                 # Fastify backend — shop domain
  opt-in-bridge/            # isolated micro-service
  ai-worker/                # scan processing worker
```

#### Key dependencies

```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "expo-secure-store": "latest",
  "expo-local-authentication": "latest",
  "expo-notifications": "latest",
  "expo-image-picker": "latest",
  "@tanstack/react-query": "^5",
  "zustand": "^4",
  "nativewind": "^4"
}
```

---

## 3. Phase 2 — Scan & Clinical Flow

**Duration:** Months 3–6  
**Goal:** A patient can trigger a scan, the AI analyses it, a doctor reviews it, and the patient receives their result securely.

---

### 3.1 Scan Ingestion Pipeline

**Owner:** Max Georg  
**Deliverable:** Device → S3 → processing queue → AI worker → DB.

#### Pipeline steps

```
Scan device / camera
  → HTTPS POST /api/scans/upload (multipart)
      → authenticate patient JWT
      → generate scan UUID
      → stream upload directly to S3 (presigned PUT URL pattern)
      → write scans row (status: 'pending')
      → publish event to processing queue (SQS / Pub/Sub)

AI Worker (separate service)
  → consume event
  → download scan from S3 (temp, in-memory)
  → call AI inference endpoint
  → write analysis_results row
  → update scans.status → 'analysing' → 'reviewed'
  → publish 'scan.ready_for_review' event
  → discard temp image from worker memory

Doctor notification service
  → consume 'scan.ready_for_review'
  → add to doctor review queue
  → send push notification to assigned doctor
```

#### Presigned upload endpoint

```typescript
// POST /api/scans/initiate-upload
// Returns a presigned S3 URL valid for 5 minutes.
// Patient uploads directly to S3 — scan bytes never touch the API server.

async function initiateUpload(req: Request) {
  const scanId = crypto.randomUUID();
  const key = `scans/${req.patient.id}/${scanId}/raw`;

  const presignedUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: process.env.SCAN_BUCKET,
    Key: key,
    Expires: 300,
    ContentType: 'image/jpeg',
    ServerSideEncryption: 'aws:kms',
  });

  await db.scans.create({
    id: scanId,
    patientId: req.patient.id,
    storageKey: key,
    status: 'pending',
  });

  await auditLog(req.patient.id, 'scan.upload_initiated', 'scan', scanId);

  return { scanId, uploadUrl: presignedUrl };
}
```

#### Security requirements

- Scan images are **never publicly accessible**. All access goes through signed URLs with a 15-minute TTL.
- S3 bucket must have `BlockPublicAccess: true` and be encrypted with a customer-managed KMS key.
- AI worker runs in a VPC with no public internet egress after pulling the model.
- Scan images are deleted from worker memory immediately after inference.

---

### 3.2 AI Analysis Integration

**Owner:** Max Georg + Paul Georg  
**Deliverable:** Automated lesion detection with structured findings output.

#### Options

| Option | Pros | Cons |
|---|---|---|
| Third-party API (SkinVision, Haut.AI, DermEngine) | Fast to market, CE-marked potential | Data leaves your infrastructure, cost per scan |
| Fine-tuned model on SageMaker / Vertex | Full control, data stays in your VPC | Requires training data, MLOps overhead |
| Hybrid: API for MVP, own model later | Pragmatic | Contract lock-in risk |

**Recommendation for MVP:** Use a CE-marked third-party dermatology API (Paul Georg to evaluate clinical accuracy). Build an abstraction layer so the model can be swapped later.

#### Findings schema

```typescript
interface Finding {
  lesionId: string;
  location: {
    bodyRegion: string;        // 'back_upper_left' etc.
    boundingBox: number[];     // [x, y, width, height] normalised 0–1
  };
  classification: string;      // 'benign' | 'suspicious' | 'malignant'
  diagnoses: Array<{
    name: string;              // 'seborrheic keratosis' etc.
    confidence: number;        // 0–1
    icd10Code?: string;
  }>;
  urgency: 'routine' | 'soon' | 'urgent';
}

interface AnalysisResult {
  modelVersion: string;
  processedAt: string;         // ISO timestamp
  overallRisk: 'low' | 'medium' | 'high' | 'urgent';
  findings: Finding[];
  qualityFlags: string[];      // 'motion_blur' | 'insufficient_lighting' etc.
}
```

---

### 3.3 Doctor Dashboard

**Owner:** Paul (FE) + Paul Georg (clinical workflow)  
**Deliverable:** Web-first dashboard (within the Expo web build or a separate React app) where dermatologists review scan queues.

#### Features

- Review queue sorted by urgency and capture date.
- Side-by-side: scan image viewer (zoomable, annotatable) + AI findings panel.
- Doctor can: approve AI findings / amend / escalate / request re-scan.
- Add clinical notes (encrypted at rest using application-layer encryption, not just DB encryption).
- Mark as delivered → triggers patient notification.

#### Clinical notes encryption

```typescript
// Application-layer encryption for clinical_notes
// Key stored in AWS KMS / GCP Cloud KMS, not in code or DB

import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

async function encryptNote(plaintext: string): Promise<string> {
  const cmd = new EncryptCommand({
    KeyId: process.env.CLINICAL_NOTES_KMS_KEY_ARN,
    Plaintext: Buffer.from(plaintext),
  });
  const result = await kms.send(cmd);
  return Buffer.from(result.CiphertextBlob!).toString('base64');
}

async function decryptNote(ciphertext: string): Promise<string> {
  const cmd = new DecryptCommand({
    CiphertextBlob: Buffer.from(ciphertext, 'base64'),
  });
  const result = await kms.send(cmd);
  return Buffer.from(result.Plaintext!).toString('utf-8');
}
```

---

### 3.4 Patient Results Screen

**Owner:** Paul (FE)  
**Deliverable:** In-app results view and PDF export. Results are never emailed in plain text.

#### Features

- Summary card: overall risk level (colour-coded), capture date, reviewing doctor.
- Lesion list: body map overlay showing lesion locations, tap to expand detail.
- Findings in plain language (Paul Georg to provide copy templates).
- "Talk to your doctor" CTA → opens telemedicine booking (Phase 3).
- PDF export: generated server-side, signed URL sent to patient, 1-hour TTL.
- Push notification when results are ready — deep-links directly to results screen.

#### Expo push notification setup

```typescript
// hooks/usePushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotifications(patientId: string) {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Register token on backend
  await api.patients.registerPushToken({ token });
}

// Handle deep-link from notification
Notifications.addNotificationResponseReceivedListener(response => {
  const { screen, scanId } = response.notification.request.content.data;
  if (screen === 'results') {
    router.push(`/results/${scanId}`);
  }
});
```

---

## 4. Phase 3 — Telemedicine & Messaging

**Duration:** Months 6–9  
**Goal:** Patients and doctors can communicate securely via chat, video, and appointment booking.

---

### 4.1 Secure Chat

**Owner:** Max Georg (BE) + Paul (FE)

#### Requirements

- End-to-end encryption (E2EE) for all messages.
- Messages retained for minimum 10 years (medical communication retention rules in DE).
- Read receipts, typing indicators.
- File attachments (images only, max 10 MB, encrypted).
- Doctor can reference a specific scan result in a message.

#### Architecture options

| Option | Notes |
|---|---|
| Build on Matrix / Element | Open-source, E2EE built-in, self-hostable, GDPR-friendly |
| Sendbird HIPAA plan | Managed, fast to integrate, costly |
| Custom WebSocket + libsodium | Full control, significant build effort |

**Recommendation:** Matrix SDK (`matrix-js-sdk`) for the backend, custom Expo UI on top. Self-hosted Synapse server in your EU infrastructure.

#### Message schema (if building custom)

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id       UUID NOT NULL,
  sender_role     TEXT NOT NULL,          -- 'patient' | 'doctor'
  content_enc     TEXT NOT NULL,          -- E2EE ciphertext
  content_iv      TEXT NOT NULL,
  attachment_key  TEXT,                   -- encrypted S3 key if applicable
  sent_at         TIMESTAMPTZ DEFAULT now(),
  read_at         TIMESTAMPTZ
);
```

---

### 4.2 Video Consultations

**Owner:** Paul (FE) + Max Georg (BE)

#### Provider recommendation: Daily.co

- GDPR-compliant EU data residency available.
- React Native SDK (`@daily-co/react-native-daily-js`).
- No media passes through your servers (WebRTC peer-to-peer where possible).
- Recordings require explicit patient consent; stored encrypted in your S3.

#### Implementation

```typescript
// services/video/createRoom.ts
import Daily from '@daily-co/daily-js';

export async function createConsultRoom(appointmentId: string) {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `consult-${appointmentId}`,
      privacy: 'private',
      properties: {
        exp: Math.floor(Date.now() / 1000) + 3600,   // 1-hour expiry
        enable_recording: false,                       // opt-in only
        geo: 'eu',                                     // EU data residency
      },
    }),
  });
  return response.json();
}
```

#### Expo video screen

```typescript
// screens/VideoConsult.tsx
import { DailyProvider, useDaily, DailyVideo } from '@daily-co/react-native-daily-js';

export function VideoConsultScreen({ roomUrl, token }: Props) {
  return (
    <DailyProvider>
      <ConsultRoom roomUrl={roomUrl} token={token} />
    </DailyProvider>
  );
}

function ConsultRoom({ roomUrl, token }: Props) {
  const daily = useDaily();

  useEffect(() => {
    daily?.join({ url: roomUrl, token });
    return () => { daily?.leave(); };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <DailyVideo sessionId="local" style={{ flex: 1 }} />
      <ControlBar />
    </View>
  );
}
```

---

### 4.3 Appointment Booking

**Owner:** Paul (FE)

#### Schema

```sql
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  doctor_id       UUID NOT NULL REFERENCES doctors(id),
  scan_id         UUID REFERENCES scans(id),
  type            TEXT NOT NULL,          -- 'initial' | 'follow_up' | 'urgent'
  channel         TEXT NOT NULL,          -- 'video' | 'chat'
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_mins   SMALLINT DEFAULT 20,
  status          TEXT DEFAULT 'booked',  -- 'booked' | 'confirmed' | 'completed' | 'cancelled'
  video_room_url  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE doctor_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id       UUID NOT NULL REFERENCES doctors(id),
  day_of_week     SMALLINT,               -- 0=Mon … 6=Sun
  start_time      TIME,
  end_time        TIME,
  slot_mins       SMALLINT DEFAULT 20
);
```

#### Booking flow

```
Patient views results → taps "Book consultation"
  → fetch available slots for scan's assigned doctor
  → patient selects slot
  → POST /api/appointments
      → create appointment row
      → create Daily.co room (if video)
      → send confirmation push to patient
      → send push to doctor
      → add to both calendars (optional: iCal / Google Calendar export)
```

---

## 5. Phase 4 — Beauty & Care E-Shop

**Duration:** Months 9–12  
**Goal:** Fully functional skincare shop with optional AI-powered recommendations based on anonymised skin profile.

---

### 5.1 Product Catalog

**Owner:** Paul (FE) + Max Georg (BE)

#### shop_db schema (products)

```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  brand           TEXT,
  description     TEXT,
  ingredients     TEXT[],                 -- INCI list
  concern_tags    TEXT[],                 -- ['dryness','acne','pigmentation']
  skin_type_fit   SMALLINT[],            -- Fitzpatrick types this suits
  price_cents     INTEGER NOT NULL,
  currency        TEXT DEFAULT 'EUR',
  image_keys      TEXT[],               -- S3 keys for product images
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON products USING GIN (concern_tags);
CREATE INDEX ON products USING GIN (ingredients);
```

---

### 5.2 The Opt-in Data Bridge

**Owner:** Max Georg  
**This is the most sensitive piece of Phase 4.**

#### Consent model

Patients must give two separate, explicit consents:

1. **Medical consent** — to process scan data for diagnosis (Phase 1, mandatory).
2. **Shop personalisation consent** — to share an anonymised skin profile with the shop for recommendations (optional, revocable at any time).

```sql
-- In medical_db
CREATE TABLE patient_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  consent_type    TEXT NOT NULL,   -- 'medical' | 'shop_personalisation'
  granted         BOOLEAN NOT NULL,
  granted_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  consent_text_version TEXT NOT NULL  -- version of the consent wording shown
);
```

#### Bridge service

```typescript
// services/opt-in-bridge/syncProfile.ts
// Called after each new doctor-reviewed scan where patient has consented.

async function syncAnonymisedProfile(patientId: string, scanId: string) {
  // 1. Verify consent is active
  const consent = await medicalDb.patientConsents.findOne({
    patientId,
    consentType: 'shop_personalisation',
    granted: true,
    revokedAt: null,
  });
  if (!consent) return;

  // 2. Read ONLY safe fields from medical DB
  const patient = await medicalDb.patients.findById(patientId);
  const result = await medicalDb.analysisResults.findByScanId(scanId);

  // 3. Build anonymised profile — NO patient ID, NO scan ID, NO raw findings
  const profile = {
    skinType: patient.skinType,                    // Fitzpatrick 1–6
    primaryConcerns: extractConcerns(result),      // ['dryness', 'sensitivity']
    avoidIngredients: extractContraindicated(result), // ['retinol', 'AHA']
    updatedAt: new Date().toISOString(),
  };

  // 4. Write to shop DB via internal HTTP call (not direct DB connection)
  await shopApi.post('/internal/skin-profiles/upsert', {
    shopUserId: await lookupShopUserId(patientId),  // via consent bridge mapping table
    profile,
  });

  // 5. Audit log in medical DB
  await auditLog(patientId, 'shop_bridge.profile_synced', 'scan', scanId);
}
```

---

### 5.3 AI Recommendations

**Owner:** Max Georg (BE)  
**Input:** Anonymised skin profile from opt-in bridge.  
**Output:** Ranked product list with ingredient fit scores.

#### Recommendation logic (MVP — rule-based)

```typescript
function scoreProduct(product: Product, profile: SkinProfile): number {
  let score = 0;

  // Concern match
  const concernOverlap = product.concernTags.filter(t =>
    profile.primaryConcerns.includes(t)
  ).length;
  score += concernOverlap * 30;

  // Skin type fit
  if (product.skinTypeFit.includes(profile.skinType)) score += 20;

  // Penalise contraindicated ingredients
  const conflicts = product.ingredients.filter(i =>
    profile.avoidIngredients.includes(i)
  ).length;
  score -= conflicts * 50;

  return Math.max(0, score);
}
```

Post-MVP: train a collaborative filtering model on purchase + profile data once enough signal exists.

---

### 5.4 Checkout & Payments

**Owner:** Paul (FE) + Max Georg (BE)

#### Stripe integration (shop only)

```typescript
// POST /api/shop/checkout/create-intent
async function createPaymentIntent(cart: CartItem[], shopUserId: string) {
  const amount = cart.reduce((sum, item) => sum + item.priceCents * item.qty, 0);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    customer: await getOrCreateStripeCustomer(shopUserId),
    automatic_payment_methods: { enabled: true },
    metadata: { shopUserId },
  });

  return { clientSecret: intent.client_secret };
}
```

#### Expo payments

Use `@stripe/stripe-react-native` for native payment sheets (Apple Pay / Google Pay supported).

---

## 6. Cross-Cutting Concerns

### 6.1 API Design

- All APIs use REST + JSON with consistent envelope: `{ data, error, meta }`.
- Versioned routes: `/api/v1/...`
- Rate limiting on all public endpoints (100 req/min per IP, 1000 req/min per authenticated user).
- Request IDs (`X-Request-ID`) on every response for tracing.

### 6.2 Error Handling & Observability

- Structured logging (JSON) with Pino.
- Distributed tracing: OpenTelemetry → Jaeger or Honeycomb.
- Error tracking: Sentry (both Expo and backend).
- Uptime monitoring: Better Uptime or Grafana Cloud.
- Alerting: PagerDuty or OpsGenie for critical medical pipeline failures.

### 6.3 Testing Strategy

| Layer | Approach |
|---|---|
| Unit tests | Vitest (backend), Jest + Testing Library (Expo) |
| Integration tests | Supertest for API routes with a test DB |
| E2E tests | Detox (Expo) for critical patient flows (sign-up, results, booking) |
| Security testing | OWASP ZAP scan in CI for the medical API |
| Manual clinical review | Paul Georg signs off on AI output display before each release |

### 6.4 Deployment

```
Development   → feature branches → local Expo + Docker Compose
Staging       → main branch → EAS Build (TestFlight + Play Internal) + preview API
Production    → tagged release → EAS Submit + production API
```

- Separate AWS accounts (or GCP projects) for medical and shop services.
- Database credentials rotated via AWS Secrets Manager every 30 days.
- Zero-downtime deployments using rolling updates.
- DB migrations run before code deploys, always backward-compatible.

### 6.5 Security Checklist (per release)

- [ ] No PHI in logs or error messages
- [ ] All S3 URLs generated server-side with TTL ≤ 15 minutes
- [ ] Dependency audit (`npm audit`) passes
- [ ] OWASP Top 10 reviewed for any new public endpoint
- [ ] Penetration test before production launch (external party)
- [ ] KMS key rotation scheduled

---

## 7. Team Responsibilities Matrix

| Feature | Paul (FE) | Max Georg (BE) | Paul Georg (Derma) |
|---|---|---|---|
| Expo scaffold & routing | Lead | Support | — |
| Auth flows (UI) | Lead | Support | — |
| Auth backend (Cognito, JWT) | Support | Lead | — |
| DB schema design | — | Lead | Review |
| GDPR / MDR compliance | — | Technical | Lead |
| Scan upload (UI) | Lead | — | UX review |
| Scan ingestion pipeline | — | Lead | — |
| AI integration | — | Lead | Clinical eval |
| Doctor dashboard | Lead | Support | UX + clinical Lead |
| Patient results screen | Lead | — | Copy & UX review |
| Secure chat (UI) | Lead | Support | — |
| Secure chat (backend) | — | Lead | — |
| Video consultations | Lead | Support | — |
| Appointment booking | Lead | Support | Workflow design |
| E-shop catalog UI | Lead | — | Product curation |
| Opt-in bridge | — | Lead | Consent wording |
| AI recommendations | Support | Lead | Ingredient review |
| Stripe / checkout | Lead | Lead | — |
| Observability & infra | — | Lead | — |

---

## 8. Open Decisions

These must be resolved before the relevant phase begins.

| Decision | Owner | Status | Resolution |
|---|---|---|---|
| Auth provider | Max Georg | ✅ **Done** | **Clerk** (`@clerk/clerk-expo`) |
| Backend / DB / Realtime | Max Georg | ✅ **Done** | **Convex** (reactive DB + file storage + scheduled functions) |
| Monorepo vs separate repos | Max Georg | ✅ **Done** | Turborepo monorepo (see reference impl) |
| Is the AI a SaMD under MDR/IVDR? | Paul Georg | ⏳ Month 1 | Yes → regulatory path; No → proceed |
| AI inference provider | All | ⏳ Month 2 | Third-party API (SkinVision / Haut.AI) for MVP; Convex Action wraps the call |
| Chat infrastructure | Max Georg | ⏳ Month 5 | Convex real-time queries as base; evaluate Matrix/Sendbird for E2EE |
| Video provider | All | ⏳ Month 5 | Daily.co (EU data residency) vs Twilio |
| Doctor dashboard | Paul | ⏳ Month 2 | Next.js app in same monorepo (shares Convex + Clerk) |
| Data hosting region | Max Georg | ⏳ Month 1 | EU-West required for GDPR — confirm Convex EU deployment |
