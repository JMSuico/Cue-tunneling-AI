---
name: katipuneros-library-fullstack-architecture
description: >
  Full-stack architecture skill for the Katipuneros Library Store System.
  Apply this skill whenever working on frontend structure (React + Vite + TypeScript),
  backend structure (.NET 10 ASP.NET Core + C#), database schema, cache design,
  or any architecture decision for the Katipuneros Library Store System.
  Triggers on: "project structure", "architecture", "vertical slice", "backend flow",
  "frontend flow", "flowchain", "where does X go", "organize structure", "add feature",
  "new endpoint", "database schema", "cache layer", "repository", "service layer",
  or any mention of Katipuneros Library Store, Landing Page, or Library Management System.
  This is the single source of truth for all architecture rules, flow chains, placement logic,
  do/dont rules, and project structures -- frontend, backend, and database combined.
---

# Katipuneros Library Store -- Full-Stack Architecture Skill

This is the **reusable architecture rule set** for the Katipuneros Library Store project.
It covers the Landing Page (React + Vite + TypeScript) and the Library Management System
(.NET 10 ASP.NET Core C# + React TypeScript).
Do not change the chain flow unless Jhon explicitly overrides a section.

---

## 0) Identity and Role

You are a **Senior Full-Stack Software Architect** and **Project Structure Designer**.
Always apply this skill as the default rule set for every architectural decision in this project.
Never create spaghetti code. Never mix responsibilities. Never skip layers. Never place code randomly.
Never hardcode values -- all configuration must come from `.env`, `appsettings.json`, or environment variables.

---

## 1) Core Framework at a Glance

| Layer              | Technology                                                        | Pattern                       |
|--------------------|-------------------------------------------------------------------|-------------------------------|
| Web Frontend       | React + Vite + TypeScript                                         | Feature-based Vertical Slice  |
| Mobile Frontend    | React Native + TypeScript (future)                                | Feature-based Vertical Slice  |
| Backend            | .NET 10 + ASP.NET Core Web API + C#                               | Layered Vertical Slice        |
| ORM                | Entity Framework Core 10 (EF Core)                                | Code-First / Model-First      |
| Database           | SSMS SQL Server (recommended) / PostgreSQL / MySQL (XAMPP MariaDB)| Strict Relational             |
| Cache & Broker     | Redis (optional -- for performance scaling)                       | Infrastructure Layer          |
| Background Workers | .NET Hosted Services / IHostedService                             | Async Task Offloading         |
| Auth               | JWT Bearer Tokens + ASP.NET Identity                              | Backend-enforced              |
| API Documentation  | Scalar V1 (OpenAPI / Swagger UI replacement)                      | API Tools Layer               |
| API Style          | REST API via ASP.NET Core Web API                                 | Resource-Oriented             |

---

## 2) Universal Rules -- Always Follow

```
DO                                              NEVER DO
--------------------------------------------------  --------------------------------------------------
Follow the exact flow chain                     Skip layers
Place code in the correct layer                 Mix responsibilities
Keep every file to one responsibility           Put business logic in controllers
Keep modules modular and reusable               Put API calls in page components
Keep frontend and backend separate              Put DB queries in middleware
Keep DB relational and controlled               Put UI logic in DB code
Follow the flow chain direction                 Reverse or bypass the chain
Add short purpose comments to every file        Leave files without clear ownership
Keep platform-specific code isolated            Duplicate feature logic across platforms
Enforce all security on the backend             Rely on frontend visibility as security
Use appsettings.json / .env for all config      Hardcode connection strings or secrets
Use EF Core migrations for DB changes           Run raw SQL ALTER TABLE manually
Use interfaces for all services/repos           Instantiate concrete classes directly
Use dependency injection everywhere             Use static classes for business logic
Type everything strictly in TypeScript          Use any type in TypeScript
Keep React components presentational            Put API calls directly in components
Import global tokens from LayoutStyles/         Input hardcoded exact colors in files
Call font styles from LayoutStyles/FontSyle/    Declare ad-hoc typography or raw font rules
Centralize all device responsiveness in Hooks/  Write inline resize listeners or custom device math
Use Hooks/useFluidResposiveness.ts for scaling  Hardcode static pixel widths or unscaled desktop sizes
Treat Hooks/, Shared/, LayoutBars/ as Global    Duplicate global hooks/primitives inside feature slices
Use Endpoints/ stubs for all backend requests   Call fetch() or axios directly inside UI components
Express all async & sync ops with clean => lambdas  Write bulky multi-line method boilerplate
```

> **Universal Lambda Expression (`=>`) Rule:**
> "Services and Repositories uses Lambda expressions for clean and easy to read for asynchronous and synchronous this one => used lambda expression for asynchronous and synchronous not only in the Services and Repositories, all uses asynchronous and synchronous"
> Every method across Repositories, Services, Controllers, Helpers, and API stubs MUST use clean, readable expression bodies (`=>`). Bulky method ceremonies with manual return statements are strictly forbidden when an expressive lambda body or pattern-matching switch expression can be used.

---

## 3) Flow Chains -- Never Alter Order

### 3A) Frontend Flow Chain

```
Pages
  |  (route-level composition only -- no business logic here)
Features
  |  (feature-specific UI, hooks, and workflows)
Hooks / State / API (Endpoints)
  |  (reusable logic, shared state, backend calls)
Shared Components
  |  (presentational primitives only -- no logic)
Libs / Utilities
  |  (infrastructure: auth clients, helpers, formatters)
Assets
  |  (raw static files: images, icons, fonts, media)
```

### 3B) Backend Flow Chain (.NET 10 / C#)

```
Models (Entities)
  |
Enums
  |
EF Core DbContext (AppDbContext)
  |
Repository Implementation
  |
Repository Interface
  |
Service Implementation
  |
Service Interface
  |
Helpers / Security Utilities
  |
API Controllers (ASP.NET Core)
  |
Middleware (auth guards, rate limit, CORS, idempotency)
  |
Program.cs -> appsettings.json -> Management / CLI Scripts
```

### 3C) HTTP Request Flow Chain

```
Incoming HTTP Request
  |
ASP.NET Core Middleware Pipeline
  (rate limiting, CORS, JWT auth guards, idempotency check)
  |
API Controller
  (parse request, validate model state, call service, return response)
  |
Service Layer
  (validate business rules, orchestrate, enforce logic)
  |
Repository Layer
  (query, persist, filter via EF Core -- no business logic here)
  |
Database
  (SQL Server / PostgreSQL / MySQL -- final persistent state)
```

### 3D) Background Task Flow (.NET Hosted Service)

```
Incoming Request -> API Controller -> IHostedService / BackgroundService enqueue -> Return 202 Accepted
  | (Background Process via IHostedService / Channel<T> or HangFire)
Background Worker -> Service Layer -> Repository Layer -> Database
```

### 3E) Cache Read Flow

```
Request -> Middleware -> Controller -> Service -> Cache Service (IMemoryCache / IDistributedCache)
  Cache HIT?  -> Return cached Data immediately
  Cache MISS? -> Repository -> Database -> Store in Cache -> Return Data
```

### 3F) Cache Write / Invalidation Flow

```
Request -> Controller -> Service -> Repository -> Database
  Success? -> Invalidate: book:{id}, book:list, dashboard:stats -> Return Result
```

### 3G) Contact Form Flow (Domain-Specific)

```
Visitor submits Contact Form
  |
ASP.NET Core Middleware (rate_limit, CORS, JWT optional)
  |
ContactController  POST /api/contact
  |
ContactService  (validate DTO, sanitize via InputSanitizer, send email via EmailClient)
  |
ContactRepository  (persist inquiry via EF Core -> AppDbContext)
  |
Database  ContactMessages table
```

---

## 4) Frontend -- Landing Page (Mostly Static / TypeScript + React)

> **Rule:** The Landing Page is SEPARATE from the UserRoles modules.
> Do NOT mix Landing Page components with Customer/Cashier/Admin panel code.
> The Landing Page is mostly static -- minimal API calls except for dynamic content like new books.

```
FRONTEND/                                            # Root frontend -- Vite + React + TypeScript
|
|-- App.tsx                                          # Main router setup -- React Suspense + lazy loading
|-- main.tsx                                         # React DOM entry point (ReactDOM.createRoot)
|
|-- src/
|   |
|   |-- Assets/                                      # WHERE ALL STATIC FILES & 3D ASSETS LIVE
|   |   |-- threejs/                                 # 3D interactive assets (TreeJSAssets scene engines & reference models)
|   |   |   |-- bookHeroScene.ts                     # Three.js 3D hardcover book cluster scene engine
|   |   |   |-- code.html                            # Static source Three.js reference
|   |   |   `-- DESIGN.md                            # 3D scene design reference specification
|   |   |-- images/                                  # Static image files (logos, banners, photos)
|   |   |   |-- logo.png                             # EXAMPLE: library store main logo
|   |   |   `-- hero-banner.jpg                      # EXAMPLE: hero section background image
|   |   |-- videos/                                  # Static video files
|   |   |   `-- library-intro.mp4                   # EXAMPLE: library introduction video
|   |   `-- icons/                                   # SVG and icon assets
|   |       `-- book-icon.svg                       # EXAMPLE: book icon for navigation
|   |   # DO NOT put any logic here -- raw static files and 3D scene engines only
|   |
|   |-- LANDING_PAGE/                                # Landing Page vertical slice -- SEPARATE from UserRoles
|   |   `-- Features/                                # Feature-specific slices for the landing page
|   |       `-- Pages/                               # Route-level page assemblies -- no business logic
|   |           |
|   |           |-- Home/
|   |           |   |-- Home.tsx                     # NAVIGATE -- Home route entry (composes HeroSection + LibraryMapSection)
|   |           |   `-- Components/                  # Home-specific UI components
|   |           |       |-- HeroSection.tsx          # EXAMPLE: Hero banner with library open/closed status clock
|   |           |       |-- BookHero3D.tsx           # EXAMPLE: Three.js 3D hero scene container
|   |           |       `-- LibraryMapSection.tsx    # EXAMPLE: Google Maps embed for library location
|   |           |
|   |           |-- Services/
|   |           |   |-- Services.tsx                 # NAVIGATE -- Services route entry point
|   |           |   `-- Components/                  # Services-specific UI components
|   |           |       `-- ServicesSection.tsx      # EXAMPLE: Library services accordion with step details
|   |           |
|   |           |-- Products/
|   |           |   |-- Product.tsx                  # NAVIGATE -- Products/Books catalog route
|   |           |   `-- Components/                  # Product-specific UI components
|   |           |       |-- NewlyAcquiredBooks.tsx   # EXAMPLE: Recently added books grid display
|   |           |       `-- BookCarousel.tsx         # EXAMPLE: 3D rotating book carousel component
|   |           |
|   |           `-- ContactMe/
|   |               |-- ContactMe.tsx                # NAVIGATE -- Contact page route entry
|   |               `-- Components/                  # Contact-specific UI components
|   |                   `-- ContactForm.tsx          # EXAMPLE: Public contact form (calls Endpoints/contactApi.ts)
|   |
|   |-- LayoutBars/                                  # GLOBAL CALLING IMPORT -- shared layout frame across Landing Page AND UserRoles
|   |   |-- LandingLayout.tsx                        # GLOBAL: Wrapper layout for public landing pages (LandingHeader + Outlet + Footer)
|   |   |-- CustomerLayout.tsx                       # GLOBAL: Wrapper layout for customer portal (CustomerHeader + Outlet, top-nav)
|   |   |-- CashierLayout.tsx                        # GLOBAL: Wrapper layout for cashier desk (CashierSidebar + CashierHeader + Outlet)
|   |   |-- AdminLayout.tsx                          # GLOBAL: Wrapper layout for admin console (AdminSidebar + AdminHeader + Outlet)
|   |   |-- Header.tsx                               # GLOBAL: Landing page floating glass header with responsive navigation
|   |   |-- CustomerHeader.tsx                       # GLOBAL: Customer top navigation header (pill tabs, search, cart, profile)
|   |   |-- Footer.tsx                               # GLOBAL: Global footer component with institutional links
|   |   `-- Sidebar.tsx                              # GLOBAL: Responsive sidebar (collapsible drawer on mobile/tablet)
|   |   # GLOBAL CALLING IMPORT: Call and wrap layouts in App.tsx or route composers. DO NOT put business logic here.
|   |
|   |-- Shared/                                      # GLOBAL CALLING IMPORT -- universal reusable presentational primitives
|   |   |-- Button.tsx                               # GLOBAL: Universal atomic button primitive (7 variants, 4 sizes, icons, loading)
|   |   |-- RadioButton.tsx                          # GLOBAL: Universal atomic radio button and accessible RadioGroup primitive
|   |   |-- Dropdown.tsx                             # GLOBAL: Generic dropdown component and floating menu panel layout (outside-click auto-close)
|   |   |-- SearchBar.tsx                            # GLOBAL: Universal glassmorphic search bar with ⌘K shortcut, clear icon, debounced typing
|   |   |-- DefaultFloatingModalCard.tsx             # GLOBAL: Default floating modal -- standard glass style, responsive sizing
|   |   |-- SkeletonLoader.tsx                       # GLOBAL: Shimmer loading skeletons -- Line, Circle, Card variants
|   |   |-- DragDropFileUpload.tsx                   # GLOBAL: Drag-and-drop file upload zone for forms and admin modals
|   |   |-- ImageGallery.tsx                         # GLOBAL: Reusable responsive image slider with touch swiping & auto-play
|   |   |-- TreeView.tsx                             # GLOBAL: Interactive hierarchical tree explorer component
|   |   |-- Components/                              # Shared components alias mirror (Button.tsx, Dropdown.tsx, RadioButton.tsx)
|   |   `-- index.ts                                 # Master barrel export for all global primitives and debouncing hook
|   |   # GLOBAL CALLING IMPORT: import { Button, Dropdown, RadioButton, SearchBar, DefaultFloatingModalCard } from '@/Shared'
|   |   # Accessible across Landing Page and ALL UserRole panels. DO NOT put API calls or business logic here.
|   |   # STRICT PROHIBITION: Role-level folders (Admin/Cashier/Customer) must NEVER duplicate primitives!
|   |
|   |-- LayoutStyles/                                # GLOBAL CALLING IMPORT -- master styling system & design tokens
|   |   |-- FontSyle/                                # GLOBAL typography and font definitions -- all sizes, weights, classes
|   |   |   `-- fontStyles.css                       # Master typography stylesheet (Google Fonts Inter, Material Symbols, type scale)
|   |   |-- MainLayout.css                           # Primary layout CSS -- color tokens, theme variables, glassmorphism
|   |   |-- PartLayout.css                           # Part-level utility classes and layout helpers
|   |   `-- index.css                                # Master styling entry -- imports FontSyle/fontStyles.css, MainLayout, PartLayout
|   |   # STRICT GLOBAL RULE: NEVER input hardcoded colors or ad-hoc font styles in individual files!
|   |   # All pages/components MUST call and import global tokens and fonts from LayoutStyles/
|   |
|   |-- Hooks/                                       # GLOBAL CALLING IMPORT -- reusable hooks shared across ALL features & panels
|   |   |-- useFluidResposiveness.ts                 # CRITICAL: Responsiveness for any devices (small, large, 4K) & fluid scaling
|   |   |                                            # Provides: isMobileSmall (<480px), isMobile (<768px), isTablet (768-1023px),
|   |   |                                            # isLaptop (1024-1279px), isDesktop (1280-1919px), isUltraWide (>=1920px),
|   |   |                                            # viewport width/height, touch detection, getFluidClamp(), and getFluidPx().
|   |   |-- useDebounce.ts                           # GLOBAL: Universal input & search debouncing hook (default 300ms)
|   |   |-- usePagination.ts                         # GLOBAL: Dynamic table pagination hook (10, 25, 50, 100 rows per page)
|   |   |-- useTableDraggable.ts                     # GLOBAL: Horizontal drag-to-scroll container hook for wide tables
|   |   |-- useResponsive.ts                         # GLOBAL: Lightweight viewport breakpoint detection hook (sm/md/lg/xl)
|   |   |-- useToasts.ts                             # GLOBAL: Toast notification hook (success, error, warning, info)
|   |   |-- useDraggable.ts                          # GLOBAL: Draggable modal and element interaction hook
|   |   |-- useScrollbar.ts                          # GLOBAL: Custom scrollbar position tracking and auto-hide hook
|   |   |-- useAutoRefresh.ts                        # GLOBAL: Periodic data refresh and polling interval hook
|   |   |-- usePagesGlobalRefresh.ts                 # GLOBAL: Auto-refresh page on network online, health recovery, tab focus
|   |   |-- useRefreshTelemetry.ts                   # GLOBAL: Telemetry auto-refresh hook: feed countdown & interval telemetry sync
|   |   `-- useNotifications.ts                      # GLOBAL: Notification state and read/unread badge tracking hook
|   |   # GLOBAL CALLING IMPORT: import { useFluidResposiveness } from '@/Hooks/useFluidResposiveness'
|   |   # import { useDebounce } from '@/Hooks/useDebounce'; import { usePagination } from '@/Hooks/usePagination';
|   |   # import { usePagesGlobalRefresh } from '@/Hooks/usePagesGlobalRefresh'; import { useRefreshTelemetry } from '@/Hooks/useRefreshTelemetry';
|   |   # Feature-specific hooks go inside Features/{FeatureName}/hooks/ -- NOT here
|   |
|   |-- Libs/                                        # General utilities, helpers, and data constants
|   |   |-- formatters.ts                            # Date, currency (PHP ₱), text formatting utilities
|   |   |-- validators.ts                            # Client-side form validation helpers
|   |   |-- chartUtils.ts                            # Dynamic scaling and formatting utilities for chart libraries
|   |   `-- Assets/                                  # GLOBAL CALLING IMPORT -- Constants, data arrays, CDN links -- no logic
|   |       |-- data.ts                              # GLOBAL: System constants, navigation arrays, category lists
|   |       |-- bookData.ts                          # GLOBAL: Catalog dataset and showcase book items
|   |       `-- links.ts                             # GLOBAL: External URLs, CDN asset paths, social links
|   |   # DO NOT put UI components or business rules here -- pure utility functions and constants
|   |
|   `-- Endpoints/                                   # GLOBAL CALLING IMPORT -- API endpoint stubs (Frontend -> Backend bridge)
|       |-- contactApi.ts                            # POST /api/contact -- public contact form submission stub
|       |-- feedbackApi.ts                           # POST /api/feedback -- visitor feedback submission stub
|       |-- booksApi.ts                              # /api/books: metrics, catalog search, bulk-delete, archive, batch-isbn, export
|       |
|       |-- Customer/                                # Customer-role API endpoint stubs
|       |   |-- borrowApi.ts                         # POST /api/customer/borrow -- borrow & renewal request stub
|       |   `-- reservationApi.ts                    # POST /api/customer/reserve -- book reservation stub
|       |
|       |-- Cashier/                                 # Cashier-role API endpoint stubs
|       |   |-- transactionApi.ts                    # POST /api/cashier/transaction -- payment & checkout stub
|       |   `-- fineApi.ts                           # GET/POST /api/cashier/fines -- fine collection & waiver stub
|       |
|       `-- Admin/                                   # Admin-role API endpoint stubs
|           |-- cmsApi.ts                            # CRUD /api/admin/books, /departments, /gallery stub
|           |-- userApi.ts                           # CRUD /api/admin/users -- user account management stub
|           |-- inventoryApi.ts                      # /api/admin/inventory: physical copies, metrics, label, MARC sync
|           |-- reportApi.ts                         # GET /api/admin/reports -- circulation & financial analytics stub
|           `-- notificationApi.ts                   # GET /api/admin/notifications -- system alerts stub
|   # DO NOT put business logic here -- only axios/fetch calls and TypeScript request/response types
```

---

## 5) Frontend -- UserRoles Modules (TypeScript + React)

> **Rule:** UserRoles are SEPARATE from the Landing Page.
> Each panel (Customer, Cashier, Admin) is its own vertical slice.
> Do NOT import Landing Page components into UserRole panels unless they come from Shared/.

```
FRONTEND/
`-- src/
    `-- UserRoles/                                   # WHERE ALL USER ROLE PANELS LIVE -- separate from Landing Page
        `-- Features/                                # UserRole feature slices
            `-- Pages/                               # Route-level page assemblies -- no business logic
                |
                |-- CustomersPanel/                  # Customer role vertical slice (Patron Portal)
                |   |-- Pages/                       # Customer route pages
                |   |   |-- CustomerDashboard.tsx    # NAVIGATE -- Customer home, stats & active borrowings (/customer/home)
                |   |   |-- CatalogPage.tsx          # NAVIGATE -- Book catalog, search filters & holds (/customer/catalog)
                |   |   |-- BorrowingsPage.tsx       # NAVIGATE -- Loan history, renewals & trajectory (/customer/borrowings)
                |   |   |-- ReservationsPage.tsx     # NAVIGATE -- Active holds, queue status & lockers (/customer/reservations)
                |   |   |-- FavoritesPage.tsx        # NAVIGATE -- Saved reading wishlist & desk locations (/customer/favorites)
                |   |   |-- ProfileSettings.tsx      # NAVIGATE -- Patron card, library clearance & settings (/customer/profile)
                |   |   `-- index.ts                 # BARREL -- Clean exports for all customer route pages
                |   |-- Components/                  # Customer-specific UI components
                |   |   |-- BorrowRequestCard.tsx    # Customer borrow status card
                |   |   `-- BookSearchBar.tsx        # Customer OPAC search and filter bar
                |   `-- Shared/                      # Role-scoped adapters (calls global Shared/ defaults, applies customer edits/conversions)
                |       |-- CustomerButton.tsx       # Delegates to Shared/Button with customer defaults
                |       |-- RadioGroupField.tsx      # Delegates to Shared/RadioButton with field grouping
                |       `-- CustomerModalCard.tsx    # Delegates to Shared/DefaultFloatingModalCard
                |
                |-- CashiersPanel/                   # Cashier role vertical slice (Circulation Desk Terminal)
                |   |-- Pages/                       # Cashier route pages
                |   |   |-- CashierDashboard.tsx     # NAVIGATE -- Cashier dashboard & fast desk actions (/cashier/dashboard)
                |   |   |-- PendingReservations.tsx  # NAVIGATE -- Hold pickups & queue approvals (/cashier/pending-reservations)
                |   |   |-- CheckoutBorrow.tsx       # NAVIGATE -- Barcode scanner & loan checkout (/cashier/checkout)
                |   |   |-- ReturnsFines.tsx         # NAVIGATE -- Book returns, condition & fee assessment (/cashier/returns)
                |   |   |-- CustomerLookup.tsx       # NAVIGATE -- Patron accounts & borrowing standing (/cashier/customers)
                |   |   |-- BookAvailability.tsx     # NAVIGATE -- Shelf locator & inventory search (/cashier/book-availability)
                |   |   |-- Schedules.tsx            # NAVIGATE -- Desk duty shifts & calendar (/cashier/schedules)
                |   |   |-- OverdueFines.tsx         # NAVIGATE -- Delinquent accounts & penalty notices (/cashier/overdue-fines)
                |   |   |-- Transactions.tsx         # NAVIGATE -- Payment ledger, receipts & register logs (/cashier/transactions)
                |   |   |-- Notifications.tsx        # NAVIGATE -- Terminal alerts & hold notifications (/cashier/notifications)
                |   |   `-- index.ts                 # BARREL -- Clean exports for all cashier route pages
                |   |-- Components/                  # Cashier-specific UI components
                |   |   |-- PaymentForm.tsx          # Fine payment processing form
                |   |   `-- ReceiptCard.tsx          # Transaction receipt layout
                |   `-- Shared/                      # Role-scoped adapters (calls global Shared/ defaults, applies cashier edits/conversions)
                |       |-- CashierButton.tsx        # Delegates to Shared/Button with cashier defaults
                |       |-- RadioGroupField.tsx      # Delegates to Shared/RadioButton with field grouping
                |       `-- CashierModalCard.tsx    # Delegates to Shared/DefaultFloatingModalCard
                |
                `-- AdminsPanel/                     # Admin role vertical slice (Executive Console)
                    |-- Pages/                       # All Admin route pages
                    |   |-- AdminDashboard.tsx       # NAVIGATE -- Analytics overview, KPIs & live stats (/admin/dashboard)
                    |   |-- UserManagement.tsx       # NAVIGATE -- System users, patrons & personnel (/admin/users)
                    |   |-- BooksManager.tsx         # NAVIGATE -- Catalog editor, ISBN, MARC 21 / CSV export (/admin/books)
                    |   |-- Reservations.tsx         # NAVIGATE -- Master reservation queue manager (/admin/reservations)
                    |   |-- Borrowings.tsx           # NAVIGATE -- Circulation audit & loan policies (/admin/borrowings)
                    |   |-- Returns.tsx              # NAVIGATE -- Return inspection & clearance logs (/admin/returns)
                    |   |-- Inventory.tsx            # NAVIGATE -- Stacks inventory, shelf audit & barcodes (/admin/inventory)
                    |   |-- Analytics.tsx            # NAVIGATE -- Circulation trends & reading metrics (/admin/analytics)
                    |   |-- Categories.tsx           # NAVIGATE -- Dewey classifications & genres (/admin/categories)
                    |   |-- Reports.tsx              # NAVIGATE -- Monthly circulation & financial reports (/admin/reports)
                    |   |-- Notifications.tsx        # NAVIGATE -- Broadcast announcements & alerts (/admin/notifications)
                    |   |-- RolesPermissions.tsx     # NAVIGATE -- RBAC roles, grants & policy controls (/admin/roles)
                    |   |-- AuditLogs.tsx            # NAVIGATE -- Immutable system security logs (/admin/audit-logs)
                    |   |-- Settings.tsx             # NAVIGATE -- System configuration, email & DB (/admin/settings)
                    |   |-- Profile.tsx              # NAVIGATE -- Administrator credentials & session (/admin/profile)
                    |   `-- index.ts                 # BARREL -- Clean exports for all admin route pages
                    |-- Components/                  # Admin-specific UI components
                    |   |-- AdminSidebar.tsx         # Collapsible admin navigation menu
                    |   |-- StatsCard.tsx            # Metric KPI card with trend indicator
                    |   `-- DataTable.tsx            # Sortable, searchable, paginated data grid
                    `-- Shared/                      # Role-scoped adapters (calls global Shared/ defaults, applies admin edits/conversions)
                        |-- AdminButton.tsx          # Delegates to Shared/Button with admin defaults
                        |-- RadioGroupField.tsx      # Delegates to Shared/RadioButton with field grouping
                        |-- NotificationUI.tsx       # Admin system notification popup
                        `-- AdminModalCard.tsx       # Delegates to Shared/DefaultFloatingModalCard
```

### Frontend Layer Rules

| Layer          | Purpose                   | Calling Scope | What Belongs                                    | What is Forbidden                              |
|----------------|---------------------------|---------------|-------------------------------------------------|------------------------------------------------|
| Pages/         | Route-level composition   | Route only    | Layout assembly, route entry points             | Business logic, API calls, feature duplication |
| Features/      | Vertical slice ownership  | Feature only  | Workflow logic, feature hooks, feature API      | Global state, shared UI, infrastructure        |
| Endpoints/     | Backend bridge            | **GLOBAL**    | API call functions, request/response TS types   | Business rules, UI rendering                   |
| Shared/        | Shared UI primitives      | **GLOBAL**    | Modals, cards, buttons, loading skeletons       | Feature-specific logic, API calls              |
| LayoutBars/    | Global layout frames      | **GLOBAL**    | Layout shells, headers, footers, sidebars       | Business logic, API calls                      |
| LayoutStyles/  | Global design tokens & CSS| **GLOBAL**    | CSS variables, color tokens, typography classes | Component-specific ad-hoc styles/colors        |
| Hooks/         | Global reactive behavior  | **GLOBAL**    | Device responsiveness, fluid clamp, toasts      | Feature-specific state machines                |
| Libs/Assets/   | Constants & static data   | **GLOBAL**    | Link mappings, catalog datasets, constants      | UI components, business logic                  |
| Assets/        | Raw static assets & 3D    | **GLOBAL**    | Images, icons, SVGs, Three.js 3D scene engines  | Any application logic or direct API calls      |

---

## 5B) Global Calling Imports & Responsiveness Architecture (Universal Guide)

> **Core Principle:** Global Calling Imports are shared across ALL vertical slices without boundary violations.
> Every developer and AI agent MUST recognize these directories as universally callable imports.
> NEVER duplicate global logic, styling tokens, or device calculations inside individual feature slices.

```
GLOBAL CALLING IMPORT ROSTER:
1. src/Hooks/                 --> Global hooks (useFluidResposiveness.ts, useResponsive.ts, useDebounce.ts, usePagination.ts, useTableDraggable.ts, useToasts.ts, etc.)
2. src/Shared/                --> Global UI primitives (DefaultFloatingModalCard, SkeletonLoader, TreeView, etc.)
3. src/LayoutBars/            --> Global layout frames (LandingLayout, CustomerLayout, CashierLayout, AdminLayout)
4. src/LayoutStyles/          --> Global styling tokens & CSS variables (MainLayout.css, PartLayout.css, index.css)
   `-- FontSyle/              --> Global typography system & font classes (fontStyles.css)
5. src/Libs/Assets/           --> Global static constants & dataset catalogs (data.ts, bookData.ts, links.ts)
6. src/Endpoints/             --> Global API client stubs bridging to .NET 10 backend (contactApi.ts, Customer/, etc.)
7. src/Assets/                --> Global raw media (images/, videos/, icons/) and 3D scenes (threejs/)
```

### 1) Hooks/ as a Global Calling Import
- **Location:** `src/Hooks/`
- **Scope:** Accessible from ANY file in `LANDING_PAGE/`, `UserRoles/` (`CustomersPanel`, `CashiersPanel`, `AdminsPanel`), `LayoutBars/`, or `Shared/`.
- **Purpose:** Centralizes all cross-cutting reactive behavior, device detection, window events, and UI interaction states.

#### Responsiveness for Any Devices & Fluid Responsiveness (`useFluidResposiveness.ts`)
- **CRITICAL RULE:** Responsiveness for any device (small or large) AND Fluid Responsiveness for any device MUST be placed in `Hooks/` as `useFluidResposiveness.ts` (and `useResponsive.ts`).
- **Forbidden:** NEVER write ad-hoc `window.addEventListener('resize')` or duplicated breakpoint queries directly inside React page components!
- **Capabilities of `useFluidResposiveness.ts`:**
  - **Breakpoint Detection:**
    - `isMobileSmall` (< 480px) -- small mobile phones
    - `isMobile` (< 768px) -- all mobile viewports
    - `isTablet` (768px - 1023px) -- iPad / tablet screens
    - `isLaptop` (1024px - 1279px) -- compact laptops
    - `isDesktop` (1280px - 1919px) -- standard monitors
    - `isLargeDesktop` (>= 1536px) -- large screens
    - `isUltraWide` (>= 1920px) -- 2K / 4K / Ultrawide displays
    - `deviceType`: `'mobile-small' | 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide'`
  - **Fluid Calculations:**
    - `getFluidClamp(minPx, maxPx, minVw?, maxVw?)`: Returns mathematical CSS `clamp()` string for inline styles / CSS vars.
    - `getFluidPx(minPx, maxPx, minVw?, maxVw?)`: Computes real-time linearly interpolated pixel size based on active viewport.
  - **Viewport Dimensions:** `width`, `height`, `aspectRatio`, `isPortrait`, `isLandscape`, `isTouch`.

#### Usage Example:
```tsx
// [Layer: UserRoles/Features/Pages/CustomersPanel/Pages]
import React from 'react';
import { useFluidResposiveness } from '@/Hooks/useFluidResposiveness';

export const CatalogView: React.FC = () => {
  const { isMobile, isTablet, isUltraWide, getFluidClamp } = useFluidResposiveness();

  return (
    <div
      className={isMobile ? "grid grid-cols-1 gap-2" : isTablet ? "grid grid-cols-2 gap-4" : "grid grid-cols-4 gap-6"}
      style={{ padding: getFluidClamp(16, 48) }}
    >
      {/* Content dynamically adapts to small, large, and ultrawide displays */}
    </div>
  );
};
```

#### Additional Global Hooks (`useDebounce.ts`, `usePagination.ts`, `useTableDraggable.ts`):
- **`useDebounce<T>(value: T, delay?: number): T`**
  - Universally debounces real-time inputs (e.g., search bars, filtering inputs) to prevent typing lag and redundant API queries.
- **`usePagination<T>(items: T[], options?: UsePaginationOptions)`**
  - Manages table and card grid pagination with standard row increments: `[10, 25, 50, 100]`.
  - Automatically handles page clamping, next/prev, total pages, and slice indexing.
- **`useTableDraggable<T>()`**
  - Enables smooth horizontal drag-to-scroll on desktop mouse and touch screens for wide tabular datasets.


### 2) Shared/ as Global Primary Calling & Role-Scoped Shared Adapters

#### A) Primary Global Primitives (`src/Shared/`)
- **Primary Root Location:** `C:\Users\provu\Desktop\KATIPUNEROS LIBRARY STORE\Katipuneros-Library-Store\Frontend\src\Shared`
- **Scope:** This is the **GLOBAL PRIMARY CALLING** root for all default primitives across the entire application:
  - `Button.tsx` (and `shared/components/Button.tsx`) -- The global atomic button component supporting 7 semantic variants (`primary`, `secondary`, `action-green`, `danger`, `ghost`, `outline`, `soft-blue`), 4 sizes (`xs`, `sm`, `md`, `lg`), Material Symbols icons, loading spinners, and full-width mode.
  - `RadioButton.tsx` (and `shared/components/RadioButton.tsx`) -- The global atomic radio button primitive `<RadioButton />` and `<RadioGroup />` supporting card and simple layouts, description texts, status badges, and direction layouts.
  - `Dropdown.tsx` (and `shared/components/Dropdown.tsx`) -- A generic, global floating dropdown panel layout with outside-click dismissal (`useRef`), keyboard navigation, custom triggers, search/filter item states, and badge counters.
  - `SearchBar.tsx` -- Universal glassmorphic search bar with ⌘K keyboard shortcut, clear action, and debounced typing hook integration (`useDebounce`).
  - `DefaultFloatingModalCard.tsx` -- Floating dialog with backdrop blur, keyboard ESC dismissal, header subtitle, body scrolling, customizable footer, and responsive max-width.
  - `SkeletonLoader.tsx` -- Shimmer placeholder components with `line`, `circle`, and `card` variants.
  - `DragDropFileUpload.tsx` -- Accessible drag-and-drop zone for PDF/image uploads in forms.
  - `ImageGallery.tsx` -- Touch-friendly image carousel with thumbnail navigation.
  - `TreeView.tsx` -- Interactive expandable directory/category tree.
  - `index.ts` -- Master barrel export for all global primitives and debouncing hook.
- **Debouncing Hook Support:** `useDebounce.ts` is re-exported directly from `Shared/` as well as `Hooks/`, enabling zero-overhead instant integration with `SearchBar` for live search filtering algorithms across management panels.

#### B) Role-Scoped Shared Adapters (`[UserRole]/Shared/`)
- **Role Folder Locations:**
  - `C:\Users\provu\Desktop\KATIPUNEROS LIBRARY STORE\Katipuneros-Library-Store\Frontend\src\UserRoles\Features\Pages\CustomersPanel\Shared`
  - `C:\Users\provu\Desktop\KATIPUNEROS LIBRARY STORE\Katipuneros-Library-Store\Frontend\src\UserRoles\Features\Pages\CashiersPanel\Shared`
  - `C:\Users\provu\Desktop\KATIPUNEROS LIBRARY STORE\Katipuneros-Library-Store\Frontend\src\UserRoles\Features\Pages\AdminsPanel\Shared`
- **Architectural Calling Flow & Conversion Rules:**
  - **Global-First Invocation:** The role-scoped `Shared/` folders **call the defaults from the primary global `Frontend\src\Shared` folder**.
  - **Accurate Role Adaptations:** They apply targeted edits, role-specific defaults, and prop mappings based on accurate role requirements and previous HTML-to-TypeScript-React conversion requirements.
  - **Zero UI Regressions:** This architecture guarantees that every role-specific component (`AdminButton`, `AdminModalCard`, `CashierButton`, `CashierModalCard`, `CustomerButton`, `CustomerModalCard`, `RadioGroupField`) strictly preserves its exact visual UI appearance without breaking changes or visual regressions!
  - **No Standalone Forking:** Role-level folders must NEVER create disconnected standalone primitive forks. They must always delegate to `Frontend\src\Shared`.
- **Operational Memory Cache:** Refer to `PLUGINS_SKILLS_MEMORY_CACHE.md` for full design tokens, E2E testing, and UX rules.

### 3) LayoutBars/ as a Global Calling Import
- **Location:** `src/LayoutBars/`
- **Scope:** Layout composition wrappers and navigation chrome.
- **Included Components:**
  - `LandingLayout.tsx` -- Wraps public pages with `LandingHeader` + `<Outlet />` + `Footer`.
  - `CustomerLayout.tsx` -- Wraps customer portal with `CustomerHeader` + `<Outlet />`.
  - `CashierLayout.tsx` -- Wraps circulation desk with `CashierSidebar` + `CashierHeader` + `<Outlet />`.
  - `AdminLayout.tsx` -- Wraps management console with `AdminSidebar` + `AdminHeader` + `<Outlet />`.
  - `Header.tsx`, `CustomerHeader.tsx`, `Sidebar.tsx`, `Footer.tsx`.

### 4) LayoutStyles/ & FontSyle/ as a Global Calling Import
- **Location:** `src/LayoutStyles/` and `src/LayoutStyles/FontSyle/`
- **Files:** `MainLayout.css`, `PartLayout.css`, `index.css`, `FontSyle/fontStyles.css`.
- **STRICT UNIVERSAL RULE:**
  - NEVER hardcode exact hex, rgb, hsl colors (`#164E63`, `rgb(24,50,61)`) in individual page or component files.
  - NEVER declare ad-hoc font families or raw font-size rules in individual files.
  - ALWAYS call CSS custom properties (`var(--primary)`, `var(--action-green)`, `var(--surface-container)`) or design token utility classes (`bg-primary`, `text-on-primary`, `font-headline-1`, `text-headline-1`).

### 5) Libs/Assets/ as a Global Calling Import
- **Location:** `src/Libs/Assets/`
- **Files:** `data.ts` (system constants), `bookData.ts` (mock/seed book collections), `links.ts` (CDN endpoints and social URLs).
- **Rule:** Pure static data only -- no React hooks, no DOM manipulation, no business rules.

### 6) Endpoints/ as a Global Calling Import
- **Location:** `src/Endpoints/`
- **Files:** `apiClient.ts` (typed HTTP client, Bearer token injection, ApiResponse<T> unwrapping), `contactApi.ts`, `feedbackApi.ts`, `booksApi.ts`, plus role-scoped folders `Customer/` (`borrowApi.ts`, `reservationApi.ts`), `Cashier/` (`transactionApi.ts`, `fineApi.ts`), `Admin/` (`userApi.ts`, `cmsApi.ts`, `notificationApi.ts`).
- **Rule:** Contains only typed API communication functions (axios/fetch stubs) and TypeScript request/response contracts. Uses concise arrow function lambdas (`=>`).

---

## 6) Backend Vertical Slice Structure (.NET 10 / ASP.NET Core / C#)

> **Rule:** Every layer has exactly one responsibility.
> Controllers call Services. Services call Repositories. Repositories call DbContext.
> Helpers and Infrastructure are utilities -- they never own business logic.
> **ALL layers (Repositories, Services, Controllers, Helpers) MUST use clean, readable expression-bodied lambda expressions (`=>`) for all synchronous and asynchronous operations.**

```
Backend/                                             # Root .NET 10 ASP.NET Core Web API solution
|
|-- Program.cs                                       # App entry point -- DI, middleware pipeline, EF Core setup
|-- appsettings.json                                 # App configuration -- DB, JWT, SMTP, Redis settings
|-- appsettings.Development.json                     # Development overrides (local DB, dev secrets)
|-- appsettings.Production.json                      # Production overrides (never commit secrets here)
|-- .env                                             # Secret overrides -- loaded via environment variables
|-- Backend.csproj                                   # .NET project file -- NuGet package references
|-- Backend.sln                                      # Solution file
|
`-- Features/                                        # Domain vertical slices -- main application logic
    |
    |-- Data/                                        # MODEL-FIRST FOUNDATION -- database shape only
    |   |
    |   |-- AppDbContext.cs                          # EF Core DB context -- registers DbSets, configures relations (uses =>)
    |   |-- Migrations/                              # EF Core Code-First migration history
    |   |   |-- 20260915004316_InitialCreate.cs
    |   |   `-- 20260915005517_AddPersonnelAndRefinements.cs
    |   |
    |   |-- Models/                                  # Entity models -- database table shape only (NO business logic)
    |   |   |-- User.cs                              # Guid Id; string FullName; string Email; UserRole Role;
    |   |   |-- Book.cs                              # Guid Id; string Title; string Author; string Isbn; string DeweyCode;
    |   |   |-- BorrowTransaction.cs                 # Guid Id; Guid PatronId; Guid BookId; DateTime DueDate;
    |   |   |-- Reservation.cs                       # Guid Id; Guid PatronId; Guid BookId; ReservationStatus Status;
    |   |   |-- OverdueFine.cs                       # Guid Id; Guid TransactionId; decimal Balance;
    |   |   |-- AuditLog.cs                          # Guid Id; string Action; string PreviousHash; string CurrentHash;
    |   |   |-- ContactMessage.cs                    # Guid Id; string SenderName; string SenderEmail; string Message;
    |   |   |-- Feedback.cs                          # Guid Id; FeedbackRating Rating; string? Comments;
    |   |   |-- Personnel.cs                         # Guid Id; string FullName; string Position; string? ImageUrl;
    |   |   `-- Category.cs                          # Guid Id; string DeweyRange; string Name; string ShelfBayLocation;
    |   |
    |   `-- Enums/                                   # Fixed-value enumerations -- never compute logic here
    |       |-- UserRole.cs                          # Admin, Cashier, Customer
    |       |-- InquiryStatus.cs                     # New, InProgress, Resolved, Archived
    |       |-- FeedbackRating.cs                    # Poor, Fair, Good, Excellent
    |       |-- TransactionStatus.cs                 # Active, Returned, Overdue, Cancelled
    |       `-- ReservationStatus.cs                 # Pending, ReadyForPickup, Fulfilled, Cancelled, Expired
    |
    |-- Repositories/                                # DATA ACCESS LAYER -- EF Core queries only (ALL USE =>)
    |   |
    |   |-- Interfaces/                              # Repository contracts
    |   |   |-- IUserRepository.cs  IBookRepository.cs  IBorrowRepository.cs
    |   |   |-- IReservationRepository.cs  IFineRepository.cs  ICategoryRepository.cs
    |   |   |-- IAuditRepository.cs  IContactRepository.cs  IFeedbackRepository.cs  IPersonnelRepository.cs
    |   |
    |   `-- Implementations/                         # Concrete classes using expression bodies (=>)
    |       |-- UserRepository.cs                    # Uses => for all async queries and sync entity updates
    |       |-- BookRepository.cs                    # Uses => for catalog search, barcode lookup, CRUD
    |       |-- BorrowRepository.cs                  # Uses => for active loans, history, and ledger
    |       |-- ReservationRepository.cs             # Uses => for queue filtering and locker staging
    |       |-- FineRepository.cs                    # Uses => for settlement, waivers, and balances
    |       |-- CategoryRepository.cs                # Uses => for Dewey classification taxonomy
    |       |-- AuditRepository.cs                   # Uses => for immutable hash chain queries
    |       |-- ContactRepository.cs                 # Uses => for public inquiry persistence
    |       |-- FeedbackRepository.cs                # Uses => for visitor rating persistence
    |       `-- PersonnelRepository.cs               # Uses => for library staff CMS persistence
    |
    |-- Services/                                    # BUSINESS LOGIC LAYER -- no _context, no HTTP (ALL USE =>)
    |   |
    |   |-- Interfaces/                              # Service contracts
    |   |   |-- IUserService.cs  IBookService.cs  IBorrowService.cs
    |   |   |-- IReservationService.cs  IFineService.cs  ICategoryService.cs
    |   |   |-- IAuditService.cs  IContactService.cs  IFeedbackService.cs
    |   |   |-- IPersonnelService.cs  ISystemHealthService.cs
    |   |
    |   `-- Implementations/                         # Concrete classes using expression bodies (=>)
    |       |-- UserService.cs                       # Uses => with pattern matching and tuple status
    |       |-- BookService.cs                       # Uses => for stock validation and catalog updates
    |       |-- BorrowService.cs                     # Uses => for circulation rules and return grading
    |       |-- ReservationService.cs                # Uses => for hold expiry and locker assignment
    |       |-- FineService.cs                       # Uses => for payment recording and waiver checks
    |       |-- CategoryService.cs                   # Uses => for taxonomy validation
    |       |-- AuditService.cs                      # Uses => for SHA-256 hash verification
    |       |-- ContactService.cs                    # Uses => for InputSanitizer pass and persistence
    |       |-- FeedbackService.cs                   # Uses => for rating moderation and feedback
    |       |-- PersonnelService.cs                  # Uses => for staff CMS management
    |       `-- SystemHealthService.cs               # Uses => for DB connectivity and memory diagnostics
    |
    |-- Helpers/                                     # REUSABLE UTILITIES -- ALL USE =>
    |   `-- Infrastructure/                          # Full security chain
    |       |-- InputSanitizer.cs                    # Strips HTML, prevents XSS (uses =>)
    |       |-- JwtHelper.cs                         # Generates and verifies JWT tokens (uses =>)
    |       |-- PasswordHelper.cs                    # BCrypt cryptographic hash and verify (uses =>)
    |       |-- PermissionsHelper.cs                 # RBAC role permissions evaluation (uses =>)
    |       |-- NotificationHelper.cs                # Notification formatting and channel routing (uses =>)
    |       `-- AuditHelper.cs                       # SHA-256 hash chaining calculation (uses =>)
    |
    |-- DBInfrastructure/                            # EXTERNAL SYSTEM INFRASTRUCTURE
    |   |-- Database/                                # DbConnectionFactory, DbHealthCheck, DatabaseSeeder
    |   |-- Cache/                                   # CacheService, CacheKeys, TtlRules, CacheInvalidation
    |   |-- ApiTools/                                # ScalarV1Setup, SwaggerConfig
    |   `-- EmailClient/                             # EmailSender, EmailTemplates
    |
    `-- Api/                                         # REST API LAYER -- ALL USE =>
        |
        |-- Controllers/                             # ASP.NET Core controllers using expression bodies (=>)
        |   |-- UsersController.cs                   # User administration & patron lookup (uses =>)
        |   |-- BooksController.cs                   # Public catalog & acquisitions (uses =>)
        |   |-- BorrowController.cs                  # Circulation checkouts, returns, extensions (uses =>)
        |   |-- ReservationsController.cs            # Holds, queue, and smart locker staging (uses =>)
        |   |-- FinesController.cs                   # Overdue settlement & waivers (uses =>)
        |   |-- CategoriesController.cs              # Dewey taxonomy & shelf bays (uses =>)
        |   |-- PersonnelController.cs               # Library staff CMS (uses =>)
        |   |-- AuditController.cs                   # Cryptographic audit inspection & chain verify (uses =>)
        |   |-- ContactController.cs                 # Public contact inquiries (uses =>)
        |   |-- FeedbackController.cs                # Patron ratings & testimonials (uses =>)
        |   |-- AuthController.cs                    # Login, registration, profile (uses =>)
        |   `-- HealthController.cs                  # Operational diagnostics & DB health (uses =>)
        |
        |-- DTOs/                                    # Request/Response shapes
        |   |-- Requests/                            # CreateBookRequest, CheckoutRequest, ReturnRequest ...
        |   `-- Responses/                           # ApiResponse<T>, AuthResponse, BookResponse ...
        |
        `-- Middleware/                              # Request guards: GlobalException, RateLimit, Idempotency, JWT
```

---

## 6B) Universal Lambda Expressions (=>) for Asynchronous and Synchronous Operations

### The Core Binding Rule
> **"Services and Repositories uses Lambda expressions for clean and easy to read for asynchronous and synchronous this one => used lambda expression for asynchronous and synchronous not only in the Services and Repositories, all uses asynchronous and synchronous"**

Every asynchronous and synchronous method across the codebase MUST be written using clean, expressive, and easily readable **lambda expressions (`=>`)**. Bulky method ceremonies with manual variable re-declarations, multi-line brackets, and verbose return paths are prohibited when an expression body or pattern-matching switch expression can be used.

### Clean Readability Standards:

1. **Asynchronous Repositories (`=> await`)**:
```csharp
public async Task<List<Book>> GetCatalogAsync(Guid? categoryId = null, string? search = null, bool? spotlight = null) =>
    await _context.Books
        .AsNoTracking()
        .Include(b => b.Category)
        .Where(b => !categoryId.HasValue || b.CategoryId == categoryId.Value)
        .Where(b => string.IsNullOrWhiteSpace(search) || EF.Functions.Like(b.Title, $"%{search}%") || EF.Functions.Like(b.Author, $"%{search}%"))
        .Where(b => !spotlight.HasValue || b.IsSpotlight == spotlight.Value)
        .OrderByDescending(b => b.CreatedAt)
        .ToListAsync();
```

2. **Synchronous Repositories (`=> Task.FromResult` / `=> Task.CompletedTask`)**:
```csharp
public Task UpdateAsync(Book book) =>
    Task.FromResult(_context.Books.Update(book));

public Task DeleteAsync(Book book) =>
    Task.FromResult(_context.Books.Remove(book));
```

3. **Asynchronous Services with Pattern-Matching Switch Expressions (`=> await ... switch`)**:
```csharp
public async Task<(bool Success, string? Error)> SubmitContactMessageAsync(string name, string email, string subject, string message) =>
    string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(message)
        ? (false, "Name, valid email, and message body are mandatory.")
        : await _contactRepo.CreateAsync(new ContactMessage
        {
            SenderName = InputSanitizer.SanitizeText(name),
            SenderEmail = InputSanitizer.SanitizeEmail(email),
            Subject = InputSanitizer.SanitizeText(subject),
            Message = InputSanitizer.SanitizeText(message)
        }) switch
        {
            var msg when msg != null => (true, null),
            _ => (false, "Could not persist contact message.")
        };
```

4. **Asynchronous Controllers (`=> Ok(...)` / `=> switch`)**:
```csharp
[HttpGet]
[AllowAnonymous]
public async Task<IActionResult> GetBooks([FromQuery] Guid? categoryId, [FromQuery] string? query, [FromQuery] bool? spotlight) =>
    Ok(ApiResponse<object>.Ok(await _bookService.GetCatalogAsync(categoryId, query, spotlight)));

[HttpPost]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> Create([FromBody] CreatePersonnelRequest request) =>
    await _personnelService.CreatePersonnelAsync(request.FullName, request.Position, request.Department, request.ImageUrl, request.DisplayOrder) is { } staff
        ? CreatedAtAction(nameof(GetById), new { id = staff.Id }, ApiResponse<object>.Ok(staff, "Staff profile created."))
        : BadRequest(ApiResponse<object>.Fail("Failed to create staff profile."));
```

5. **Pure Synchronous Helper Utilities (`=>`)**:
```csharp
public static string HashPassword(string plainPassword) =>
    BCrypt.Net.BCrypt.EnhancedHashPassword(plainPassword, WorkFactor);

public static string ComputeHash(string previousHash, string action, string targetEntity, string payload, DateTime timestamp) =>
    Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes($"{previousHash}|{action}|{targetEntity}|{payload}|{timestamp:O}")));

public static string SanitizeText(string? input) =>
    string.IsNullOrWhiteSpace(input)
        ? string.Empty
        : WebUtility.HtmlEncode(HtmlTagRegex.Replace(ScriptTagRegex.Replace(input, string.Empty), string.Empty).Trim());
```

6. **Frontend Arrow Functions (`=>`)**:
```ts
export const getPublicBooks = async (categoryId?: string, query?: string): Promise<BookItem[]> =>
  (await apiRequest<BookItem[]>({ url: '/api/books', params: { categoryId, query } })).data ?? [];
```

---

## 7) Backend -- Management / CLI Tools

```
Management/                                          # CLI TOOLS AND OPERATIONAL SCRIPTS -- not application logic
|-- Commands/
|   |-- AddMigrationCommand.cs                       # USAGE: dotnet ef migrations add {MigrationName} -- wrapper command
|   |-- UpdateDatabaseCommand.cs                     # USAGE: dotnet ef database update -- wrapper command
|   |-- SeedDatabaseCommand.cs                       # Seeds default admin, roles, and system configuration on first run
|   `-- DeleteAdminCommand.cs                        # Safe interactive menu to manage terminal-created admin accounts
`-- Scripts/
    `-- SetupDb.ps1                                  # USAGE: .\Management\Scripts\SetupDb.ps1 -- first-time DB bootstrap
```

### Backend Layer Rules

| Layer                    | Purpose                 | What Belongs                                         | What is Forbidden                               |
|--------------------------|-------------------------|------------------------------------------------------|-------------------------------------------------|
| Data/Models/             | DB shape                | Entity classes, FK navigation properties             | Business rules, methods with logic              |
| Data/Enums/              | Fixed values            | Roles, statuses, constrained option sets             | Logic, computation, methods                     |
| Repositories/            | Data access             | EF Core queries, CRUD, filtering, ORM ops            | Business rules, HTTP concerns, service calls    |
| Services/                | Business logic          | Validation, workflows, orchestration, rules          | Direct DB queries, HttpContext access           |
| Helpers/Infrastructure/  | Security utilities      | JWT, password, sanitizer, RBAC, audit utilities      | Full workflows, direct DB calls                 |
| DBInfrastructure/        | External system setup   | DB engine, cache, email, API tools infrastructure    | Domain logic, business rules                    |
| Api/Controllers/         | REST API endpoints      | Parse request, call service, return IActionResult    | Business logic, EF Core usage, _context access  |
| Api/DTOs/                | Data shaping            | Request/response DTO classes, DataAnnotations        | Business validation logic                       |
| Api/Middleware/          | Request guards          | Rate limit, auth, idempotency, exception handling    | Business logic, DB queries                      |
| Management/              | CLI operations          | Migrations, seeds, setup scripts                     | Application business logic                      |

---

## 8) Database Vertical Slice Schema

```
KATIPUNEROSDATABASE                                  # Root database for the Katipuneros Library Store
|
|-- Security/                                        # Authentication and authorization data
|   |-- Roles                                        # Role definitions: Admin, Cashier, Customer, Guest
|   |-- Permissions                                  # Permission definitions: Read, Write, Delete, Manage
|   |-- RolePermissions                              # Role-to-permission mapping junction table
|   |-- UserSessions                                 # Active JWT session tracking per user
|   |-- LoginAttempts                                # Failed and successful login attempt tracking
|   `-- SecurityEvents                               # Security audit event log
|
|-- Users/                                           # User identity and profile data
|   |-- Users                                        # Main user accounts (Id, Username, PasswordHash, Role, CreatedAt)
|   |-- UserProfiles                                 # Extended profile (FullName, Avatar, ContactNo, Address)
|   `-- Students                                     # Student-specific profile (StudentId, Course, Year)
|
|-- Library/                                         # Library catalog and physical inventory
|   |-- Books                                        # Core book catalog (Id, Title, Author, ISBN, CoverImageUrl, Stock, Price)
|   |-- Authors                                      # Author master table (Id, FullName, Biography)
|   |-- Categories                                   # Category / Dewey classification table
|   |-- BookCategories                               # Book-to-category junction table (many-to-many)
|   |-- BookCopies                                   # Physical copy inventory (Barcode, Condition, ShelfLocation)
|   |-- Shelves                                      # Shelf location (Section, Row, Level)
|   `-- Rooms                                        # Room location (Floor, SectionLabel)
|
|-- Personnel/                                       # Library staff CMS data
|   `-- Personnel                                    # Staff profiles (Id, FullName, Position, ImageUrl, DisplayOrder)
|
|-- Gallery/                                         # Library interior photo gallery
|   `-- LibraryInteriorImages                        # Gallery images (ImageUrl, CategoryLabel, DisplayOrder)
|
|-- ContactMessages/                                 # Contact form submissions from visitors
|   `-- ContactMessages                              # Submitted inquiries (Name, Email, Message, Status, SubmittedAt)
|
|-- Transactions/                                    # Borrowing, returns, reservations, and fines
|   |-- BorrowTransactions                           # Borrow records (UserId FK, BookId FK, BorrowDate, DueDate, Status)
|   |-- ReturnTransactions                           # Return records (BorrowTransactionId FK, ReturnDate, Condition)
|   |-- Reservations                                 # Book reservation queue table
|   |-- Fines                                        # Outstanding fine records (UserId FK, BorrowTransactionId FK, Amount)
|   |-- FinePayments                                 # Fine payment history (FineId FK, PaidAt, AmountPaid)
|   `-- TransactionIdempotency                       # Duplicate request protection per transaction
|
|-- Audit/                                           # Full audit trail and traceability
|   |-- AuditLogs                                    # Main audit trail (UserId, Action, EntityType, EntityId, Timestamp)
|   |-- AdminActions                                 # Admin-specific action history
|   |-- APIRequestLogs                               # Full API request log (Method, Path, StatusCode, Duration)
|   `-- EntityChanges                                # Before/after entity change snapshots (JSON diff)
|
|-- Reports/                                         # Reporting and analytics aggregates
|   |-- DailyStatistics                              # Daily usage stats snapshot
|   |-- MonthlyStatistics                            # Monthly usage stats snapshot
|   `-- BorrowingAnalytics                           # Detailed borrowing trend analytics
|
`-- Configuration/                                   # System-wide configuration values
    |-- SystemSettings                               # Application-level settings (Key-Value pairs)
    |-- BorrowPolicies                               # Borrowing duration and limit policies
    |-- FineRules                                    # Fine calculation rules per violation type
    `-- FeatureFlags                                 # Feature toggles (on/off per environment)
```

### Database Flow (.NET 10 EF Core)

```
Frontend (React TypeScript)
  |
ASP.NET Core Web API  (Controllers + DTOs)
  |
Service Layer         (business rules + validation)
  |
Repository Layer      (EF Core queries via AppDbContext)
  |
Database              (SQL Server / PostgreSQL / MySQL)
  |
SSMS / pgAdmin / DB Client  (management, reporting, inspection)
```

### Database Rules

```
DO                                              NEVER DO
--------------------------------------------------  --------------------------------------------------
Use relational tables with foreign keys         Use raw ADO.NET in services without strong reason
Separate audit, security, transactions          Mix domain data into the same table group
Use EF Core for all standard queries            Hardcode connection strings in C# files
Keep DB config in appsettings.json / .env      Put raw SQL in controllers without justification
Use explicit FK relationships + navigation      Bypass EF Core ORM without strong reason
Keep sensitive data in protected tables         Mix DB rules into UI code
Use EF Core migrations for all DB changes      Run raw ALTER TABLE scripts manually
Use Guid or int PKs consistently               Mix Guid and int PKs across related tables
```

---

## 9) Cache Architecture

Cache is an **infrastructure concern** -- it lives inside Backend/Features/DBInfrastructure/Cache/.
It never owns data. It never holds business rules. It only serves performance.

### What Cache CAN Store

- Book catalog listings and book detail pages
- Dashboard statistics and analytics summaries
- User permissions (short TTL -- 5 minutes)
- System settings and reference / configuration data
- Borrowing and reservation summary counts

### What Cache MUST NOT Store

- Passwords or password hashes
- JWT refresh tokens or auth secrets
- Database connection strings or secrets
- Sensitive personal data (full PII)

### Cache Key Naming Convention (from CacheKeys.cs)

```csharp
// EXAMPLES from CacheKeys.cs:
public static string BookDetail(Guid id) => $"book:{id}";
public static string BookList()          => "book:list";
public static string DashboardStats()   => "dashboard:stats";
public static string UserPerms(Guid userId) => $"user:perms:{userId}";
public static string ActiveBorrows(Guid userId) => $"borrow:active:{userId}";
public static string SystemSettings()   => "system:settings";
```

### Cache TTL Policy (from TtlRules.cs)

```
Book catalog list   -> 10 minutes
Book detail         -> 15 minutes
Dashboard stats     ->  5 minutes
User permissions    ->  5 minutes
System settings     -> 60 minutes
```

---

## 10) Security Rules

```
DO                                              NEVER DO
--------------------------------------------------  --------------------------------------------------
Enforce auth decisions on the backend           Rely on frontend UI visibility as security
Keep API keys server-side only                  Store API keys in TypeScript/React bundles
Put secrets in appsettings.json / .env          Hardcode secrets in C# or TypeScript files
Sanitize all public form inputs                 Trust raw user input directly
Log all security events to SecurityEvents       Expose sensitive data in API response logs
Use role-based access control (RBAC)            Grant access based on client-side checks
Protect admin endpoints with [Authorize]        Skip middleware for internal API routes
Use BCrypt for all password hashing             Use MD5, SHA1, or plain text passwords
Use JWT Bearer tokens with expiry               Use permanent tokens without expiry
Validate all DTOs with DataAnnotations          Accept unvalidated request bodies
Use [ApiController] for auto model binding      Manually parse raw request body in controllers
```

All public form submissions (Contact, Feedback) **must** pass through `InputSanitizer.cs` to prevent XSS.
Backend middleware validates JWT on every protected route **before** controllers are reached.
Admin endpoints must be decorated with `[Authorize(Roles = "Admin")]`.

---

## 11) File Comment Rules

Every file must have a header comment block answering:
- What **layer** owns this file?
- What is this file **responsible for**?
- What is **NOT allowed** here?

**TypeScript / React:**
```tsx
// [Layer: LANDING_PAGE/Features/Pages/ContactMe/Components]
// ContactForm.tsx -- Public contact form UI component.
// Renders form fields, handles local state, calls Endpoints/contactApi.ts on submit.
// DO NOT put validation business logic here -- that belongs in the backend service.
// DO NOT put direct fetch/axios calls here -- use Endpoints/contactApi.ts only.
```

**C# Service:**
```csharp
// [Layer: Services/Implementations]
// ContactService.cs -- Business logic for contact form submission.
// Validates input, sanitizes via InputSanitizer, triggers email, calls IContactRepository.
// DO NOT query the database directly -- use IContactRepository only.
// DO NOT access HttpContext here -- HTTP concerns stay in controllers.
```

**C# Repository:**
```csharp
// [Layer: Repositories/Implementations]
// BookRepository.cs -- Data access for the Book entity via EF Core.
// Queries AppDbContext.Books -- CRUD and search operations only.
// DO NOT put business rules. DO NOT validate. DO NOT call services.
```

**C# Controller:**
```csharp
// [Layer: Api/Controllers]
// BooksController.cs -- REST API endpoint handler for book operations.
// Parses HTTP request, calls IBookService, returns IActionResult.
// DO NOT put business logic. DO NOT use _context directly. DO NOT write EF Core queries.
```

**C# Enum:**
```csharp
// [Layer: Data/Enums]
// UserRole.cs -- Fixed enumeration of user role types.
// Used for role-based access control (RBAC) across the system.
// DO NOT add methods or logic -- enumeration values only.
```

---

## 12) Adding a New Feature -- Checklist

```
BACKEND:
1.  [ ] Define the entity model in Features/Data/Models/
2.  [ ] Define enums in Features/Data/Enums/ if fixed values are needed
3.  [ ] Register entity in AppDbContext.cs as DbSet<T>
4.  [ ] Create EF Core migration: dotnet ef migrations add {MigrationName}
5.  [ ] Apply migration: dotnet ef database update
6.  [ ] Define repository interface in Features/Repositories/Interfaces/
7.  [ ] Implement repository in Features/Repositories/Implementations/
8.  [ ] Define service interface in Features/Services/Interfaces/
9.  [ ] Implement service in Features/Services/Implementations/
10. [ ] Create request/response DTOs in Features/Api/DTOs/
11. [ ] Create controller in Features/Api/Controllers/
12. [ ] Register DI bindings in Program.cs (builder.Services.AddScoped<IRepo, Repo>)
13. [ ] Add cache invalidation in DBInfrastructure/Cache/CacheInvalidation.cs if cached
14. [ ] Add AuditLog entry in AuditHelper.cs if the feature touches user data

FRONTEND:
15. [ ] Add API endpoint stub in src/Endpoints/{Role}/featureApi.ts
16. [ ] Add feature slice in src/LANDING_PAGE/Features/ or src/UserRoles/Features/{Panel}/
17. [ ] Create Components/ folder inside the feature slice
18. [ ] Add shared hooks in src/Hooks/ only if the hook is reused across 2+ features
19. [ ] Compose in the correct Page.tsx -- route-level only, no business logic in the page
20. [ ] Add route in App.tsx with React.lazy() and Suspense if it is a new page route
```

---

## 13) Placement Decision Guide

```
FRONTEND:
Is it a page route entry point?           -> LANDING_PAGE/Features/Pages/ or UserRoles/Features/Pages/
Is it feature-specific UI or logic?       -> Features/{FeatureName}/Components/
Is it a backend API call?                 -> Endpoints/{Role}/featureApi.ts
Is it reusable UI used in 2+ places?      -> Shared/ (global) or Panel/Shared/ (role-scoped)
Is it a global layout element?            -> LayoutBars/ (Header, Footer, Sidebar)
Is it a shared hook?                      -> Hooks/
Is it static data / constant list?        -> Libs/Assets/data.ts or links.ts
Is it a static image or media file?       -> Assets/images/ or Assets/icons/
Is it a 3D scene engine or 3D asset?      -> Assets/threejs/
Is it typography, font size, or font styles? -> LayoutStyles/FontSyle/
Is it global CSS or color tokens?         -> LayoutStyles/MainLayout.css or PartLayout.css

BACKEND (.NET C#):
Is it a database entity / table shape?    -> Features/Data/Models/
Is it a fixed enumeration value?          -> Features/Data/Enums/
Is it database access logic?              -> Features/Repositories/Implementations/
Is it business logic / rules?             -> Features/Services/Implementations/
Is it a security or auth utility?         -> Features/Helpers/Infrastructure/
Is it an API endpoint handler?            -> Features/Api/Controllers/
Is it a request or response shape?        -> Features/Api/DTOs/
Is it a request guard / pipeline step?    -> Features/Api/Middleware/
Is it external system setup?              -> Features/DBInfrastructure/
Is it cache logic?                        -> Features/DBInfrastructure/Cache/
Is it a CLI / migration command?          -> Management/Commands/
```

---

## 14) Scalar V1 -- Interactive API Documentation

Scalar V1 replaces Swagger UI as the API documentation and testing interface.

**Setup in Program.cs:**
```csharp
builder.Services.AddOpenApi();       // Register OpenAPI schema generation

app.MapOpenApi();                    // generates /openapi/v1.json raw schema
app.MapScalarApiReference();         // Scalar V1 interactive UI at /scalar/v1
```

**Access URLs (Development):**
- Scalar V1 UI:            http://localhost:5000/scalar/v1
- Raw OpenAPI JSON schema:  http://localhost:5000/openapi/v1.json

**Controller documentation requirements:**
```csharp
/// <summary> Get all books in the catalog </summary>
/// <returns> List of BookResponse </returns>
[ProducesResponseType(typeof(List<BookResponse>), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[HttpGet]
public async Task<IActionResult> GetAllBooks() { ... }
```

**Rules:**
- All controllers must use [ApiController] and [Route("api/[controller]")]
- All endpoints must return typed results for accurate schema generation
- Add XML doc comments on every controller action
- Disable Scalar in production environment via appsettings.Production.json flag

---

## 15) Final Strict Rules -- Repeat and Follow Always

```
NEVER violate the flow chain.
NEVER create spaghetti code.
NEVER mix responsibilities across layers.
NEVER bypass the architecture.
NEVER place code in the wrong layer.
NEVER skip layers in the chain.
NEVER put business logic in controllers.
NEVER put database queries (_context) in controllers.
NEVER put API calls in React page components -- use Endpoints/ files.
NEVER store secrets in frontend TypeScript/React code.
NEVER hardcode connection strings in C# files.
NEVER use any type in TypeScript -- always type strictly.
NEVER use static classes for services or repositories in .NET.
NEVER bypass dependency injection -- always use constructor injection.
NEVER run EF Core migrations manually -- use dotnet ef CLI only.
NEVER mix Landing Page code with UserRoles panel code.
NEVER mix Customer, Cashier, or Admin panel code with each other.
ALWAYS keep header comments on every file (layer, responsibility, forbidden).
ALWAYS keep the structure visible, predictable, and organized.
ALWAYS follow the exact flow chain in section 3.
ALWAYS place new code using section 13 placement decision guide.
ALWAYS use interfaces for every Service and Repository in .NET.
ALWAYS register new services and repositories in Program.cs via DI.
ALWAYS validate DTOs using DataAnnotations or FluentValidation.
ALWAYS sanitize public form input through InputSanitizer.cs.
ALWAYS protect admin and role-gated endpoints with [Authorize(Roles = "...")].
ALWAYS type all API request and response objects in TypeScript (no implicit any).
ALWAYS keep the Landing Page separated from UserRole modules.
ALWAYS keep each UserRole panel (Customer / Cashier / Admin) as its own isolated vertical slice.
NEVER hardcode exact colors or raw font declarations in component/page files.
ALWAYS call and import global CSS color tokens, variables, and font classes from LayoutStyles/ and LayoutStyles/FontSyle/.
ALWAYS treat Hooks/, Shared/, LayoutBars/, LayoutStyles/, Libs/Assets/, and Endpoints/ as GLOBAL CALLING IMPORTS.
ALWAYS centralize device responsiveness (mobile, tablet, desktop, ultrawide) and fluid calculations in Hooks/ as useFluidResposiveness.ts.
NEVER write inline window resize event listeners or custom responsive math inside React page components.
ALWAYS place 3D Three.js scene assets and engine scripts in src/Assets/threejs/ as isolated modules.
```

---

*This skill is the single source of truth for all architecture decisions in the Katipuneros Library Store project.
Update this file when the project introduces new layers, platforms, or architectural changes.*

---

## 16) Verified Implementation State (Initial Scaffold -- September 2026)

### Backend Target Counts

| Layer                  | Location                                    | Target Count |
|------------------------|---------------------------------------------|--------------|
| Models                 | Features/Data/Models/                       | 6+ files     |
| Enums                  | Features/Data/Enums/                        | 4+ files     |
| Repository Interfaces  | Features/Repositories/Interfaces/           | 5+ files     |
| Repository Impls       | Features/Repositories/Implementations/     | 5+ files     |
| Service Interfaces     | Features/Services/Interfaces/               | 5+ files     |
| Service Impls          | Features/Services/Implementations/         | 5+ files     |
| Controllers            | Features/Api/Controllers/                   | 7+ files     |
| DTOs                   | Features/Api/DTOs/                          | 10+ files    |
| Middleware             | Features/Api/Middleware/                    | 4 files      |
| Helpers                | Features/Helpers/Infrastructure/            | 6 files      |

### Frontend Target Route Count

| Type     | Panel     | Example Routes                                               |
|----------|-----------|--------------------------------------------------------------|
| Landing  | Public    | /, /services, /products, /contact                           |
| UserRole | Customer  | /customer/dashboard, /customer/borrow, /customer/my-borrows |
| UserRole | Cashier   | /cashier/dashboard, /cashier/payment, /cashier/history      |
| UserRole | Admin     | /admin/dashboard, /admin/books, /admin/users, /admin/reports |
| Isolated | Auth      | /login, /admin/login (no layout shell)                      |

### Runtime (Development -- No Docker Required)

```
Frontend:  npm run dev  ->  http://localhost:5173   (Vite dev server)
Backend:   dotnet run   ->  http://localhost:5000   (ASP.NET Core Kestrel)
Database:  SSMS SQL Server  -> localhost:1433  (recommended)
           pgAdmin PostgreSQL -> localhost:5432 (2nd recommendation)
           XAMPP MySQL       -> localhost:3306  (alternative)
Scalar V1: http://localhost:5000/scalar/v1   (API docs and testing UI)
```

### Known Items Requiring Attention Before Production

| Priority | Item                                        | Action Needed                                           |
|----------|---------------------------------------------|---------------------------------------------------------|
| HIGH     | JWT secret key in appsettings.json          | Move to environment variable or Azure Key Vault for prod |
| HIGH     | CORS policy set to AllowAll in dev          | Restrict to specific frontend origin in production      |
| MEDIUM   | Rate limiting stored in-memory              | Switch to Redis-backed distributed rate limiting        |
| MEDIUM   | No HTTPS redirect configured                | Add app.UseHttpsRedirection() in Program.cs for prod    |
| LOW      | Scalar V1 UI exposed in all environments    | Disable Scalar in production environment                |

*Update this section after each deep scan or major feature addition. Do not skip updates.*

---

## 17) Master Plugins-Derived Architectural System & Operational Rules
*(Adopted, applied, obeyed, and enforced from `C:\Users\provu\Desktop\PLUGINS` and `PLUGINS_SKILLS_MEMORY_CACHE.md`)*

### 17.1 Complete Plugins Operational Synthesis
This architecture strictly incorporates the principles learned from all 18 toolkits and plugins located in `C:\Users\provu\Desktop\PLUGINS`:
1. **`ui-ux-pro-max-skill`:** Design token hierarchy (Primitive $\to$ Semantic $\to$ Component), 24 fluid device scales (360px to 3840px), glassmorphism, accessibility (WCAG AA/AAA), and standard focus rings.
2. **`rtk`:** High-density command execution, output deduplication, deterministic state flow, slice query caching, and optimistic UI with failure rollbacks.
3. **`xlsx` & Ingest/Export:** Multi-criteria CSV/Excel filtering (date ranges, alphabetical, and accession ID matching) and batch ISBN-10/13 checksum validation.
4. **`playwright`:** E2E multi-device testing (`390x844`, `412x915`, `768x1024`, `1024x1366`, `1440x900`), layout stability, and automated visual regression artifacts.
5. **`context7`:** Anti-hallucination, single source of truth, and strict context grounding against live files.
6. **`OmniRoute`:** Hierarchical routing, layout shell persistence, 23 Hard Rules compliance, and automatic drawer dismissal on $< 1024\text{px}$ viewports.
7. **`headroom`:** Sticky topbar chrome, dynamic left-margin offset matching sidebar collapse/expand, `backdrop-blur-xl`, and scroll restoration.
8. **`graphify`:** Acyclic vertical-slice architecture, strict layer isolation, and elimination of god-nodes.
9. **`caveman`:** High-density token efficiency, clean lambda expression bodies (`=>`), pattern-matching `switch` expressions, and elimination of method ceremonies.
10. **`ralph` & `loop-eng`:** Closed-loop PRD user stories (`passes: false` $\to$ `passes: true`), automated builder/checker cycles, and verification before completion.
11. **`one-skill-to-rule-them-all`:** Meta-skill orchestrator (task-observer) driving the 5-phase engineering lifecycle (Spec $\to$ Plan $\to$ Implement $\to$ Verify $\to$ Review).
12. **`claude-code` & `claude-skills`:** Agentic execution, systematic root-cause debugging, TDD, and rigorous code reviews.
13. **`skills` (Anthropic):** Standardized skill definitions, explicit YAML frontmatter, and repeatable domain procedures.
14. **`wazuh`:** Continuous security telemetry, intrusion event analysis, and active perimeter monitoring.
15. **`ghidra` & `GhidrAssist`:** Structural code integrity, control-flow call graph auditing, and AST validation across service boundaries.
16. **`radare2`:** Smallest coherent diffs, hot-path optimization, and avoidance of speculative abstractions.
17. **`ImHex`:** Low-level block structure verification, SHA-256 block hash chaining, and Merkle tree root validation.

### 17.2 End-to-End DDD Flowchain
Every transaction and query in the system MUST traverse this six-tier unidirectional flowchain without layer skipping:
$$\text{Database (SQL Server / EF Core)} \longrightarrow \text{Repositories (Data Access)} \longrightarrow \text{Services (Business Logic)} \longrightarrow \text{Controllers (REST API)} \longrightarrow \text{Endpoints (TypeScript Client)} \longrightarrow \text{Pages & Features (React 19)}$$

- **Layer 1: Database (SQL Server / EF Core 10):** Code-first schema migrations managed via `AppDbContext.cs`.
- **Layer 2: Repositories (`Features/Repositories`):** Typed interfaces (`IBookRepository`, `IUserRepository`, etc.) and implementations using universal expression bodies (`=>`).
- **Layer 3: Domain Services (`Features/Services`):** Business validation, fine accrual, hold expiration, and security checks. Zero HTTP context dependencies.
- **Layer 4: REST Controllers (`Features/Api/Controllers`):** Resource routing with explicit HTTP verbs and status codes. Zero business logic.
- **Layer 5: Typed Endpoints (`Frontend/src/Endpoints`):** Modular client API functions dispatched through `apiClient.ts`.
- **Layer 6: React 19 UI (`Frontend/src/UserRoles/Features`):** Functional components consuming global hooks (`useFluidResposiveness`, `usePagesGlobalRefresh`, `useToasts`) and global primitives (`SearchBar`, `Dropdown`, `RadioButton`, `DefaultFloatingModalCard`).

### 17.3 Definitive DO and NEVER DO Rules Matrix

```
DO                                                     NEVER DO
--------------------------------------------------     --------------------------------------------------
Use universal lambda syntax (=>) across all methods    Write multiline method ceremonies with empty returns
Enforce N=0 empty database fallbacks (0, 0.0%, ₱0.00)  Display hardcoded seed metrics (3,420, 1,248, ₱1,245)
Wire usePagesGlobalRefresh in every admin route page   Leave views disconnected from network recovery
Use reactive toast notifications via useToasts.ts      Trigger native browser alert() or prompt()
Consume global shared primitives from Frontend/Shared  Duplicate UI components across feature slices
Centralize viewport math in useFluidResposiveness.ts   Write inline window resize listeners in components
Enforce role authorization on backend controllers      Rely on client-side route hiding for security
Sanitize all public input via InputSanitizer.cs        Trust raw form payloads or query strings directly
Keep lower layers strictly independent of higher ones  Import feature internals from shared/global layers
Protect all ratios against division by zero            Render NaN%, undefined, or broken gauge bars
```

### 17.4 Core Computational Logics & Algorithmic Foundations

1. **Catalog Availability Rate:**
   $$\text{ShelfRate} = \begin{cases} 0.0\%, & \text{if } C_{\text{total}} = 0 \\ \left( \frac{\sum b.\text{AvailableCopies}}{\sum b.\text{TotalCopies}} \times 100 \right)\%, & \text{if } C_{\text{total}} > 0 \end{cases}$$

2. **SVG Circular Donut Breakdown Geometry:**
   $$\text{AvailableArc} = \left(\frac{A}{C_{\text{total}}} \times 100\right)\%, \quad \text{BorrowedArc} = \left(\frac{B}{C_{\text{total}}} \times 100\right)\%$$
   $$\text{StrokeDashOffset}_{\text{borrowed}} = -\text{AvailableArc}, \quad \text{StrokeDashOffset}_{\text{reserved}} = -(\text{AvailableArc} + \text{BorrowedArc})$$

3. **Multi-Series Bezier Circulation Velocity Curves:**
   $$y_i = 340 - \left( \frac{v_i}{\max(V)} \times 280 \right)$$

4. **Daily Overdue Fine Accrual & Statutory Cap Evaluation:**
   $$F_{\text{raw}}(d) = \max(0, d) \times R_{\text{daily}} \quad (R_{\text{daily}} = \text{₱}15.00/\text{day})$$
   $$F_{\text{final}}(d) = \min(F_{\text{raw}}(d), M_{\text{cap}}) \quad (M_{\text{cap}} = \text{₱}500.00)$$

5. **Courtesy Grace Period Buffer Evaluation:**
   $$\text{FineActive}(t, t_{\text{due}}, G_{\text{hours}}) = \begin{cases} \text{true}, & \text{if } t > t_{\text{due}} + (G_{\text{hours}} \times 3600\text{s}) \\ \text{false}, & \text{otherwise} \end{cases}$$

6. **Bitwise CIDR Subnet Access Evaluation Algorithm:**
   $$\text{SubnetMask}(p) = \sim((1 \ll (32 - p)) - 1)$$
   $$\text{IsAllowed}(\text{IP}, \text{Subnet}, p) = (\operatorname{IpToUInt32}(\text{IP}) \mathbin{\&} \text{SubnetMask}(p)) == (\operatorname{IpToUInt32}(\text{Subnet}) \mathbin{\&} \text{SubnetMask}(p))$$

7. **Cryptographic SHA-256 Audit Chaining & Merkle Tree Root:**
   $$\text{Hash}_i = \operatorname{SHA256}(\text{Hash}_{i-1} \parallel \text{Timestamp}_i \parallel \text{Action}_i \parallel \text{Payload}_i)$$
   $$\text{MerkleParent}(L, R) = \operatorname{SHA256}(L \parallel R)$$

---

*This skill is the single source of truth for all architecture decisions in the Katipuneros Library Store project.*
*Both SKILL.md and AGENTS.md must stay in sync whenever the project structure changes.*
