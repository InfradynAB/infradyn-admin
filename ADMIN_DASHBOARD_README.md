# INFRADYN Super Admin Dashboard

Complete admin dashboard for managing the INFRADYN platform. Built with Next.js 16, React 19, and TypeScript.

## 🎯 Overview

This is a **super admin-only** dashboard where Infradyn staff can:
- Monitor platform health (MRR, active orgs, users)
- Create and manage organizations
- Suspend/activate organizations
- Control feature rollout with feature flags
- Impersonate users for debugging
- Invite other super admins
- View audit logs of all platform actions

## 🏗️ Architecture

### Authentication Flow
1. User visits `/` → Redirects to `/login`
2. **Iron Gate Middleware** checks every request:
   - ✅ Public routes: `/login`, `/invite/*`, `/api/auth/*`
   - 🔒 All other routes: Must be authenticated as `SUPER_ADMIN`
   - 🚫 Suspended accounts are blocked
3. Session validated via Better Auth

### Route Structure
```
/login                    → Super admin authentication
/(admin)
  /                       → God View Dashboard
  /organizations          → Manage all organizations
  /organizations/[id]     → Organization details (TODO)
  /users                  → Search & impersonate users
  /feature-flags          → Toggle features globally/per-org
  /audit-logs             → View all platform actions
  /settings               → Invite super admins, platform config
```

## 📦 What's Implemented

### ✅ Complete Features

#### 1. **Login Page** (`/login`)
- Email/password authentication
- Role verification (SUPER_ADMIN only)
- Suspension checks
- Error handling (access_denied, account_suspended)

#### 2. **God View Dashboard** (`/`)
- **KPI Cards**:
  - Total MRR (Monthly Recurring Revenue)
  - Active Organizations count
  - Total Users across platform
  - System Health status
- **Live Activity Feed**: Last 50 audit log entries in real-time
- **Revenue Trend Chart**: Placeholder for recharts integration

#### 3. **Organizations** (`/organizations`)
- **List View**:
  - Search by name/slug
  - Filter by status (TRIAL, ACTIVE, SUSPENDED, CANCELLED)
  - Filter by plan (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
  - Table with MRR, last activity, status badges
- **Create Dialog**:
  - Organization details (name, slug, plan, industry, contact info)
  - Optional PM invitation (auto-sends email)
  - Auto-generates slug from name
- **Actions**:
  - Suspend with reason prompt
  - Activate suspended orgs
  - View details (link to detail page)

#### 4. **Feature Flags** (`/feature-flags`)
- **Grid View**: All flags with toggle switches
- **Create Dialog**:
  - Feature name and key (auto-generates uppercase)
  - Description
  - Defaults to disabled on creation
- **Toggle**: Enable/disable globally
- **Per-Org Config**: Placeholder for whitelist/blacklist (button ready)

#### 5. **Users** (`/users`)
- **Search Interface**: Search by email, name, or organization
- **Impersonation**:
  - Click "Impersonate" → Generates magic link (1-hour validity)
  - Copies to clipboard with instructions
  - Use in main app to debug as that user

#### 6. **Audit Logs** (`/audit-logs`)
- **Table View**: Timestamp, action type, performer, target, IP address
- **Filter**: By action type (ORG_CREATED, ORG_SUSPENDED, etc.)
- **Export**: Download as CSV with date stamp
- **Actions Tracked**:
  - `ORG_CREATED`, `ORG_SUSPENDED`, `ORG_ACTIVATED`, `ORG_PLAN_CHANGED`
  - `USER_IMPERSONATED`
  - `FEATURE_FLAG_CHANGED`
  - `SUPER_ADMIN_INVITED`

#### 7. **Settings** (`/settings`)
- **Super Admin Team**:
  - Invite new super admins by email
  - Sends invitation email with token
- **Platform Settings**: Placeholder for future configs

### 🎨 UI Components Created

#### Layout
- **AdminSidebar**: Dark sidebar with navigation (Dashboard, Organizations, Users, Feature Flags, Audit Logs, Settings)
- **AdminHeader**: User avatar, notifications bell, user menu dropdown
- **Admin Layout**: Wraps all `(admin)` routes with sidebar + header

#### Dialogs
- **CreateOrganizationDialog**: Multi-step form with org details + PM invitation
- **CreateFeatureFlagDialog**: Simple form with auto-key generation

#### Lists
- **OrganizationsList**: Filterable table with suspend/activate actions
- **FeatureFlagsList**: Card grid with toggle switches
- **UsersList**: Search results with impersonate button
- **AuditLogsList**: Filterable table with CSV export
- **GodViewDashboard**: KPI cards + activity feed

#### Shared
- Uses shadcn/ui components (already installed):
  - Card, Table, Badge, Button, Input, Select, Dialog, Switch, Textarea
  - Avatar, Dropdown Menu, Scroll Area, Skeleton

## 🚀 Getting Started

### 1. Install Dependencies (Already Done)
```bash
pnpm install
```

### 2. Database Setup
```bash
# Generate migration from schema
pnpm db:generate

# Push to database
pnpm db:push
```

### 3. Create First Super Admin
You'll need to manually insert the first super admin into the database:

```sql
INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@infradyn.com',
  true,
  'Super Admin',
  'SUPER_ADMIN',
  NOW(),
  NOW()
);

-- Set password via Better Auth (use /sign-up temporarily or set hash directly)
```

**OR** use the Better Auth CLI to create a user and then manually update role to `SUPER_ADMIN`.

### 4. Run Development Server
```bash
pnpm dev
```

Navigate to `http://localhost:3000` → Redirects to `/login`

### 5. Login
- Email: `admin@infradyn.com`
- Password: (whatever you set)

If role ≠ `SUPER_ADMIN`, you'll see "Access Denied" error.

## 🔧 Configuration

### Environment Variables
Ensure these are set in `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# AWS (for S3 uploads, Textract)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=...

# Email (Resend)
RESEND_API_KEY=...

# OpenAI (for AI extraction)
OPENAI_API_KEY=...
```

### Middleware Configuration
The Iron Gate middleware (`middleware.ts`) protects all routes except:
- `/login`
- `/invite/*`
- `/api/auth/*`
- Static files (`_next/static`, `favicon.ico`, images)

## 📊 Server Actions

### Organization Management
```typescript
import { createOrganization, suspendOrganization, activateOrganization, updateOrganizationPlan, listOrganizations } from "@/lib/actions/super-admin";

// Create with optional PM invite
await createOrganization({
  name: "Acme Corp",
  slug: "acme-corp",
  plan: "STARTER",
  pmEmail: "pm@acme.com", // Optional
  pmName: "John Doe",      // Optional
});

// Suspend
await suspendOrganization("org-uuid", "Non-payment");

// Activate
await activateOrganization("org-uuid");

// Change plan
await updateOrganizationPlan("org-uuid", "PROFESSIONAL");

// List with filters
await listOrganizations({ status: "ACTIVE", plan: "ENTERPRISE" });
```

### Feature Flags
```typescript
import { createFeatureFlag, toggleFeatureFlag, setFeatureFlagForOrgs, isFeatureEnabled } from "@/lib/actions/feature-flags";

// Create
await createFeatureFlag({
  name: "AI Document Extraction",
  key: "AI_DOCUMENT_EXTRACTION",
  description: "Enable AI-powered invoice extraction",
  isEnabled: false,
});

// Toggle globally
await toggleFeatureFlag("AI_DOCUMENT_EXTRACTION", true);

// Enable for specific orgs only
await setFeatureFlagForOrgs("AI_DOCUMENT_EXTRACTION", ["org-1", "org-2"], []);

// Check in main app
if (await isFeatureEnabled("AI_DOCUMENT_EXTRACTION", orgId)) {
  // Use AI extraction
}
```

### Impersonation
```typescript
import { generateImpersonationToken, validateImpersonationToken } from "@/lib/actions/feature-flags";

// Generate magic link (super admin action)
const result = await generateImpersonationToken("user-uuid");
console.log(result.magicLink); // Copy to clipboard

// Validate in main app API route (/api/auth/impersonate?token=...)
const validation = await validateImpersonationToken(token, ipAddress, userAgent);
if (validation.success) {
  // Log in as validation.user
}
```

### Platform Stats
```typescript
import { getPlatformStats, getRecentActivity } from "@/lib/actions/super-admin";

// Dashboard KPIs
const stats = await getPlatformStats();
// { totalRevenue, activeOrganizations, totalOrganizations, totalUsers, avgRevenuePerOrg }

// Activity feed
const activities = await getRecentActivity(50);
// Array of audit log entries with performer details
```

### Super Admin Invites
```typescript
import { inviteSuperAdmin } from "@/lib/actions/super-admin";

// Send invitation email
await inviteSuperAdmin("colleague@infradyn.com");
// Token valid for 7 days, redirects to /invite/[token]
```

## 🎨 Theming

Uses **Tailwind CSS 4** with custom INFRADYN colors:
- Primary: `#0F6157` (teal green)
- Dark: `#0A1C27` (navy)
- Light backgrounds: `bg-gray-50`

Sidebar is dark-themed, main content is light.

## 🧪 Testing

Run tests:
```bash
pnpm test
```

Current test files:
- `delivery-engine.test.ts`
- `logistics-engine.test.ts`

**TODO**: Add tests for super admin actions.

## 📝 TODO / Future Enhancements

### High Priority
- [ ] **Organization Detail Page** (`/organizations/[id]`)
  - Users list with roles
  - Projects overview
  - Activity timeline
  - Plan change UI
  - Suspension history
  - Edit organization details

- [ ] **User Search API**
  - Create `/api/users/search` endpoint
  - Connect to `UsersList` component
  - Return user with org details

- [ ] **Impersonation API Route**
  - Create `/api/auth/impersonate` endpoint
  - Validate token, create session for target user
  - Redirect to main app dashboard

- [ ] **Feature Flag Per-Org Config**
  - Modal to whitelist/blacklist specific organizations
  - Multi-select dropdown with org search

- [ ] **Super Admin Invite Acceptance**
  - Create `/invite/[token]` page
  - Validate token, set password, activate account

### Medium Priority
- [ ] **Charts & Analytics**
  - Integrate `recharts` for God View dashboard
  - Revenue trend line chart (last 12 months)
  - User growth chart
  - Organization churn rate

- [ ] **Email Templates**
  - PM invitation email (organization created)
  - Super admin invitation email
  - Organization suspended notification

- [ ] **Real-Time Updates**
  - WebSocket/polling for live activity feed
  - Toast notifications for new actions

- [ ] **Advanced Filters**
  - Date range picker for audit logs
  - Multi-filter support (status + plan + search)
  - Saved filter presets

- [ ] **Bulk Actions**
  - Multi-select organizations
  - Bulk suspend/activate
  - Bulk feature flag updates

### Low Priority
- [ ] **Mobile Responsive Sidebar**
  - Hamburger menu for mobile
  - Slide-out drawer

- [ ] **Dark Mode Toggle**
  - Theme switcher in header
  - Persist preference

- [ ] **Audit Log Details Modal**
  - Click row to see full metadata JSON
  - User agent, request details

- [ ] **System Metrics Dashboard**
  - Use `systemMetric` table
  - Track API response times, error rates
  - Database query performance

- [ ] **Export Features**
  - Export organizations as CSV
  - Export users as CSV
  - Scheduled reports via email

## 🐛 Known Issues

1. **User Search Not Implemented**: UsersList component has placeholder search. Need to create API endpoint.
2. **Charts Are Placeholders**: Revenue trend chart shows "Integrate with recharts" message.
3. **No Email Sending**: Invitations are created in DB but emails not sent (need to integrate Resend).
4. **Feature Flag Per-Org Config**: "Configure" button does nothing yet.
5. **No Organization Detail Page**: Clicking "View Details" goes to non-existent route.

## 🔒 Security Considerations

1. **Iron Gate Middleware**: First line of defense, blocks non-super-admins
2. **requireSuperAdmin()**: Called in every server action
3. **Audit Logging**: All actions tracked with IP address and user agent
4. **Impersonation Tokens**: 1-hour expiry, single-use, tracked in audit log
5. **Invitation Tokens**: 7-day expiry, single-use
6. **Suspension Checks**: Users can be suspended mid-session

## 📖 Documentation

### Related Files
- **Schema**: [`db/schema.ts`](../db/schema.ts) - All table definitions
- **Auth**: [`auth.ts`](../auth.ts) - Better Auth configuration
- **RBAC**: [`src/lib/rbac.ts`](../src/lib/rbac.ts) - Role checks
- **Middleware**: [`middleware.ts`](../middleware.ts) - Iron Gate protection

### Design Docs
- [`docs/requirements.md`](../docs/requirements.md) - Original material tracker requirements
- [`docs/features.md`](../docs/features.md) - Feature specifications
- [`docs/design.md`](../docs/design.md) - System design
- [`docs/user_journey.md`](../docs/user_journey.md) - User flows

## 🤝 Contributing

This is an internal admin dashboard for Infradyn staff only. When adding features:

1. **Always use server actions** (`"use server"`) for data mutations
2. **Call `requireSuperAdmin()`** at the start of every protected action
3. **Log to audit table** for important actions
4. **Add TypeScript types** for all function parameters
5. **Use proper error handling** with try-catch blocks
6. **Return `{ success: boolean, error?: string }`** from actions

## 📞 Support

For questions or issues, contact the Infradyn engineering team.

---

**Built with ❤️ by the Infradyn Team**
