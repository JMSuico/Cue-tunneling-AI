# AGENTS.md -- Katipuneros Library Store
# AI Agent Behavior Contract
# Read this file BEFORE touching any code in this project.
# This file is the binding rule set for every AI agent working on this codebase.

---

## AGENT IDENTITY

You are a **Senior Full-Stack Software Architect** working on the **Katipuneros Library Store** system.
- Frontend: **TypeScript + React + Vite** (Feature-based Vertical Slice)
- Backend:  **.NET 10 + ASP.NET Core Web API + C#** (Layered Vertical Slice)
- ORM:      **Entity Framework Core 10 (EF Core)** -- Code-First, always use migrations
- Database: **SQL Server (SSMS) recommended / PostgreSQL / MySQL (XAMPP MariaDB)**
- Auth:     **JWT Bearer Tokens + ASP.NET Identity** -- backend-enforced ONLY
- API Docs: **Scalar V1** at `http://localhost:5000/scalar/v1`
- API Tool: **REST API** via ASP.NET Core Web API

**Read `SKILL.md` for the complete architecture reference before implementing any feature.**

---

## CRITICAL RULES -- ENFORCE ALWAYS

### NEVER Do This (Hard Stops)

- NEVER put business logic in controllers
- NEVER query the database (`_context`) from a controller -- use repositories only
- NEVER skip a layer in the flow chain
- NEVER hardcode connection strings, secrets, or API keys in source code
- NEVER use `any` type in TypeScript -- always type strictly
- NEVER put API calls (`fetch`, `axios`) directly in React page components
- NEVER put UI logic, HTTP concerns, or API parsing in services
- NEVER mix Landing Page code with UserRoles panel code
- NEVER mix Customer, Cashier, or Admin panel code with each other
- NEVER instantiate service or repository classes directly -- always use constructor DI
- NEVER use static classes for services or repositories
- NEVER bypass dependency injection
- NEVER run raw `ALTER TABLE` SQL -- always use EF Core migrations
- NEVER store secrets in the React/TypeScript frontend bundle
- NEVER trust raw user input -- always sanitize via `InputSanitizer.cs`
- NEVER grant access based on frontend visibility -- enforce on the backend only
- NEVER create spaghetti code -- every file has ONE responsibility
- NEVER hardcode exact colors or ad-hoc font declarations in component/page files -- ALWAYS call/import global design tokens and fonts from `LayoutStyles/` and `LayoutStyles/FontSyle/`
- NEVER put 3D scene logic directly in React page components -- store 3D assets and engine scripts in `src/Assets/threejs/` and mount via lifecycle hooks
- NEVER write inline `window.addEventListener('resize')` or duplicated breakpoint queries in React components -- ALWAYS consume `Hooks/useFluidResposiveness.ts` or `Hooks/useResponsive.ts`
- ALWAYS consume global hooks from `Hooks/` (`useFluidResposiveness.ts`, `useResponsive.ts`, `useDebounce.ts`, `usePagination.ts`, `useTableDraggable.ts`, `usePagesGlobalRefresh.ts`, `useRefreshTelemetry.ts`)
- ALWAYS consume shared UI primitives from global `Frontend/src/Shared/` defaults; role-scoped `[Panel]/Shared/` folders strictly act as adapters calling those defaults to preserve 100% UI visual fidelity without regression.
- NEVER duplicate global hooks, layout bars, or shared primitives inside feature slices -- import them directly from their Global Calling directories
- ALWAYS obey the operational and design principles documented in `PLUGINS_SKILLS_MEMORY_CACHE.md`

### ALWAYS Do This

- ALWAYS follow the exact flow chain (see Flow Chains section below)
- ALWAYS place code in its correct layer (see Placement Guide below)
- ALWAYS add a header comment to every new file (see Comment Rules below)
- ALWAYS use clean, easy-to-read lambda expressions (`=>`) for all synchronous and asynchronous operations across ALL layers -- Repositories, Services, Controllers, Helpers, and Endpoint stubs. (Rule: "Services and Repositories uses Lambda expressions for clean and easy to read for asynchronous and synchronous this one => used lambda expression for asynchronous and synchronous not only in the Services and Repositories, all uses asynchronous and synchronous")
- ALWAYS use interfaces for every Service and every Repository
- ALWAYS register new services and repositories in `Program.cs` via DI
- ALWAYS validate DTOs using DataAnnotations (`[Required]`, `[EmailAddress]`) or FluentValidation
- ALWAYS sanitize public form submissions through `InputSanitizer.cs`
- ALWAYS protect admin/role-gated endpoints with `[Authorize(Roles = "Admin")]`
- ALWAYS keep the Landing Page separated from UserRoles modules
- ALWAYS use `appsettings.json` / `.env` for ALL configuration -- never inline values
- ALWAYS write one-responsibility-per-file code
- ALWAYS call and import global CSS color tokens, theme variables, and font classes from `LayoutStyles/` and `LayoutStyles/FontSyle/`
- ALWAYS place 3D scene assets and engine modules in `src/Assets/threejs/`
- ALWAYS treat `Hooks/`, `Shared/`, `LayoutBars/`, `LayoutStyles/` (with `FontSyle/`), `Libs/Assets/`, and `Endpoints/` as GLOBAL CALLING IMPORTS
- ALWAYS place device responsiveness for any devices (small, medium, large, ultra-wide) and fluid responsiveness in `Hooks/` as `useFluidResposiveness.ts`

---

## FLOW CHAINS -- NEVER ALTER ORDER

### 3A) Frontend Flow Chain

```
Pages
  |  (route-level composition ONLY -- no logic)
Features
  |  (feature-specific UI, hooks, workflows)
Hooks / State / Endpoints
  |  (reusable logic, shared state, API stubs)
Shared Components
  |  (presentational primitives ONLY)
Libs / Utilities
  |  (formatters, validators, constants)
Assets
  |  (raw static files only)
```

### 3B) Backend Flow Chain (.NET 10 C#)

```
Models (Entities)  ->  Enums  ->  AppDbContext (EF Core)
  ->  Repository Interface  ->  Repository Implementation
  ->  Service Interface  ->  Service Implementation
  ->  Helpers / Security Utilities
  ->  API Controllers
  ->  Middleware
  ->  Program.cs / appsettings.json
```

### 3C) HTTP Request Flow Chain

```
Incoming Request
  -> Middleware (rate limit, CORS, JWT auth, idempotency)
  -> Controller (parse + validate DTO, call IService, return IActionResult)
  -> Service    (business rules, validation, orchestration)
  -> Repository (EF Core queries via AppDbContext ONLY)
  -> Database   (SQL Server / PostgreSQL / MySQL)
```

### 3D) Background Task Flow (.NET IHostedService)

```
Incoming Request -> Controller -> IHostedService enqueue -> Return 202 Accepted
  | (background)
BackgroundService -> Service -> Repository -> Database
```

### 3E) Cache Read Flow

```
Controller -> Service -> CacheService
  HIT?  -> return cached result immediately
  MISS? -> Repository -> Database -> store in cache -> return result
```

### 3F) Cache Write / Invalidation Flow

```
Controller -> Service -> Repository -> Database
  success? -> CacheInvalidation -> invalidate affected cache keys -> return result
```

### 3G) Contact Form Flow (Domain Example)

```
Visitor submits form
  -> Middleware (rate limit, CORS)
  -> ContactController  POST /api/contact
  -> ContactService (validate + sanitize via InputSanitizer + send email)
  -> ContactRepository (persist via EF Core AppDbContext)
  -> Database  ContactMessages table
```

---

## PROJECT STRUCTURE -- WHERE CODE LIVES

### Frontend Folder Map

```
FRONTEND/
  App.tsx                          # Router setup -- React Suspense + lazy loading + redirect guards
  main.tsx                         # React DOM entry point (ReactDOM.createRoot)

  src/
    Assets/                        # GLOBAL CALLING IMPORT -- Raw static files ONLY (images, videos, icons, 3D scenes)
      images/                      # Static logos, banners, photography
      videos/                      # Institutional walkthrough videos
      icons/                       # SVG icon library assets
      threejs/                     # 3D interactive assets (TreeJSAssets scene engines)
        bookHeroScene.ts  code.html  DESIGN.md

    LANDING_PAGE/                  # Landing Page vertical slice -- SEPARATE from UserRoles
      Features/
        Pages/
          Home/                    # Home route entry point (/ or /#home)
            Home.tsx               # Route composer ONLY -- composes HeroSection + BookHero3D + Map
            Components/            # HeroSection.tsx, BookHero3D.tsx, LibraryMapSection.tsx
          Services/                # Services route entry point (/services)
            Services.tsx           # Route composer ONLY
            Components/            # ServicesSection.tsx
          Products/                # Catalog showcase route entry point (/products)
            Product.tsx            # Route composer ONLY
            Components/            # NewlyAcquiredBooks.tsx, BookCarousel.tsx
          ContactMe/               # Public contact & inquiry route entry point (/contact-me)
            ContactMe.tsx          # Route composer ONLY
            Components/            # ContactForm.tsx (calls Endpoints/contactApi.ts)

    UserRoles/                     # User Role vertical slices -- SEPARATE from Landing Page
      Features/
        Pages/
          CustomersPanel/          # Customer Portal vertical slice (Patron Access)
            Pages/                 # Route-level page assemblies -- NO business logic
              CustomerDashboard.tsx # Customer home, stats & active borrowings (/customer/home)
              CatalogPage.tsx      # Book catalog, search filters & holds (/customer/catalog)
              BorrowingsPage.tsx   # Loan history, renewals & trajectory (/customer/borrowings)
              ReservationsPage.tsx # Active holds, queue status & lockers (/customer/reservations)
              FavoritesPage.tsx    # Saved reading wishlist & desk locations (/customer/favorites)
              ProfileSettings.tsx  # Patron card, library clearance & settings (/customer/profile)
              index.ts             # Barrel export for all customer route pages
            Components/            # Customer-specific presentational UI components
            Shared/                # Role adapters (calls global Shared/ defaults, applies customer edits/conversions)

          CashiersPanel/           # Cashier Portal vertical slice (Circulation Desk Terminal)
            Pages/                 # Route-level page assemblies -- NO business logic
              CashierDashboard.tsx # Cashier dashboard & fast desk actions (/cashier/dashboard)
              PendingReservations.tsx # Hold pickups & queue approvals (/cashier/pending-reservations)
              CheckoutBorrow.tsx   # Barcode scanner & loan checkout (/cashier/checkout)
              ReturnsFines.tsx     # Book returns, condition & fee assessment (/cashier/returns)
              CustomerLookup.tsx   # Patron accounts & borrowing standing (/cashier/customers)
              BookAvailability.tsx # Shelf locator & inventory search (/cashier/book-availability)
              Schedules.tsx        # Desk duty shifts & calendar (/cashier/schedules)
              OverdueFines.tsx     # Delinquent accounts & penalty notices (/cashier/overdue-fines)
              Transactions.tsx     # Payment ledger, receipts & register logs (/cashier/transactions)
              Notifications.tsx    # Terminal alerts & hold notifications (/cashier/notifications)
              index.ts             # Barrel export for all cashier route pages
            Components/            # Cashier-specific presentational UI components
            Shared/                # Role adapters (calls global Shared/ defaults, applies cashier edits/conversions)

          AdminsPanel/             # Admin Portal vertical slice (Executive Console)
            Pages/                 # Route-level page assemblies -- NO business logic
              AdminDashboard.tsx   # Analytics overview, KPIs & live stats (/admin/dashboard)
              UserManagement.tsx   # System users, patrons & personnel (/admin/users)
              BooksManager.tsx     # Catalog editor, ISBN, MARC 21 / CSV export (/admin/books)
              Reservations.tsx     # Master reservation queue manager (/admin/reservations)
              Borrowings.tsx       # Circulation audit & loan policies (/admin/borrowings)
              Returns.tsx          # Return inspection & clearance logs (/admin/returns)
              Inventory.tsx        # Stacks inventory, shelf audit & barcodes (/admin/inventory)
              Analytics.tsx        # Circulation trends & reading metrics (/admin/analytics)
              Categories.tsx       # Dewey classifications & genres (/admin/categories)
              Reports.tsx          # Monthly circulation & financial reports (/admin/reports)
              Notifications.tsx    # Broadcast announcements & alerts (/admin/notifications)
              RolesPermissions.tsx # RBAC roles, grants & policy controls (/admin/roles)
              AuditLogs.tsx        # Immutable system security logs (/admin/audit-logs)
              Settings.tsx         # System configuration, email & DB (/admin/settings)
              Profile.tsx          # Administrator credentials & session (/admin/profile)
              index.ts             # Barrel export for all admin route pages
            Components/            # Admin-specific presentational UI components
            Shared/                # Role adapters (calls global Shared/ defaults, applies admin edits/conversions)

    LayoutBars/                    # GLOBAL CALLING IMPORT -- Layout shells and navigation chrome
      LandingLayout.tsx            # Wraps public landing pages (LandingHeader + Outlet + Footer)
      CustomerLayout.tsx           # Wraps customer portal (CustomerHeader + Outlet)
      CashierLayout.tsx            # Wraps cashier terminal (CashierSidebar + CashierHeader + Outlet)
      AdminLayout.tsx              # Wraps admin console (AdminSidebar + AdminHeader + Outlet)
      Header.tsx  CustomerHeader.tsx  Sidebar.tsx  Footer.tsx

    Shared/                        # GLOBAL CALLING IMPORT -- Universal UI primitives (NO logic, NO API calls)
      Button.tsx                   # Universal atomic button primitive (7 variants, 4 sizes, icons, loading)
      RadioButton.tsx              # Universal atomic radio button and RadioGroup primitive
      Dropdown.tsx                 # Generic dropdown component and floating menu panel layout
      SearchBar.tsx                # Universal glassmorphic search bar with ⌘K shortcut, clear icon, debounced typing
      DefaultFloatingModalCard.tsx # Floating dialog with glassmorphism & responsive width
      SkeletonLoader.tsx           # Shimmer loading skeletons (Line, Circle, Card variants)
      DragDropFileUpload.tsx       # Accessible file upload zone for forms and modals
      ImageGallery.tsx             # Responsive touch-ready image slider with auto-play
      TreeView.tsx                 # Expandable nested file/category tree explorer
      Components/                  # Shared components alias mirror (Button.tsx, Dropdown.tsx, RadioButton.tsx)
      index.ts                     # Barrel export for all primitives and debouncing hook

    LayoutStyles/                  # GLOBAL CALLING IMPORT -- Master styling system & design tokens
      FontSyle/                    # GLOBAL typography tokens and font definitions
        fontStyles.css             # Google Fonts Inter, Material Symbols, typography classes
      MainLayout.css               # Color tokens & CSS custom properties (light/dark theme variables)
      PartLayout.css               # Part-level utility classes and layout helpers
      index.css                    # Master styling entry -- imports FontSyle/fontStyles.css, MainLayout, PartLayout

    Hooks/                         # GLOBAL CALLING IMPORT -- Universal reusable hooks across all panels
      useFluidResposiveness.ts     # MOST CRITICAL: Device responsiveness (small to ultrawide) & fluid scaling
                                   # Provides: isMobileSmall, isMobile, isTablet, isLaptop, isDesktop,
                                   # isLargeDesktop, isUltraWide, getFluidClamp(), getFluidPx(), touch detection.
      useDebounce.ts               # Universal input & search debouncing hook (default 300ms)
      usePagination.ts             # Dynamic table/card pagination hook (10, 25, 50, 100 rows per page)
      useTableDraggable.ts         # Horizontal drag-to-scroll container hook for wide tables
      useResponsive.ts             # Lightweight viewport breakpoint matching (sm/md/lg/xl)
      useToasts.ts                 # Toast notification dispatch hook (success, error, warning, info)
      useDraggable.ts              # Draggable modal and element interaction hook
      useScrollbar.ts              # Custom scrollbar position tracking and auto-hide hook
      useAutoRefresh.ts            # Periodic data refresh and polling interval hook
      usePagesGlobalRefresh.ts     # Global recovery hook: auto-refreshes page on network online, health recovery, tab focus
      useRefreshTelemetry.ts       # Telemetry auto-refresh hook: operational feed countdown & interval telemetry sync
      useNotifications.ts          # Notification state and read/unread badge tracking hook

    Libs/Assets/                   # GLOBAL CALLING IMPORT -- Static constants and link catalogs (no UI, no logic)
      data.ts                      # Navigation lists, category taxonomy, system metadata
      bookData.ts                  # Mock book catalog items for showcase rendering
      links.ts                     # External URLs, CDN asset paths, partner links

    Endpoints/                     # GLOBAL CALLING IMPORT -- API client stubs bridging to .NET 10 Web API
      apiClient.ts                 # Typed HTTP client: Bearer token injection, ApiResponse<T> unwrapping
      contactApi.ts                # Public contact form submission stub (POST /api/contact)
      feedbackApi.ts               # Visitor feedback submission stub (POST /api/feedback)
      booksApi.ts                  # Catalog, metrics, search, bulk-delete, archive, batch-isbn, MARC 21 / CSV export (/api/books)
      Customer/                    # Customer-role stubs: borrowApi.ts, reservationApi.ts
      Cashier/                     # Cashier-role stubs: transactionApi.ts, fineApi.ts
      Admin/                       # Admin-role stubs: cmsApi.ts, userApi.ts, inventoryApi.ts, reportApi.ts, notificationApi.ts
```

### Backend Folder Map

```
Backend/
  Program.cs                       # DI registration, middleware pipeline, EF Core setup
  appsettings.json                 # ALL config: DB connection, JWT, SMTP, Redis
  appsettings.Development.json     # Dev overrides
  appsettings.Production.json      # Prod overrides (NEVER commit secrets here)
  .env                             # Secret overrides loaded via environment
  Backend.csproj  Backend.sln

  Features/
    Data/
      AppDbContext.cs              # EF Core DbSets ONLY -- no business logic
      Migrations/                  # EF Core Code-First auto-generated migration history
        20260915004316_InitialCreate.cs
        20260915005517_AddPersonnelAndRefinements.cs
      Models/                      # Entity classes -- data shape ONLY
        User.cs  Book.cs  BorrowTransaction.cs  Reservation.cs
        OverdueFine.cs  AuditLog.cs  ContactMessage.cs  Feedback.cs  Personnel.cs  Category.cs
      Enums/                       # Fixed enumerations ONLY (no logic)
        UserRole.cs  InquiryStatus.cs  FeedbackRating.cs  TransactionStatus.cs  ReservationStatus.cs

    Repositories/
      Interfaces/                  # IUserRepository  IBookRepository  IBorrowRepository
                                   # IReservationRepository  IFineRepository  ICategoryRepository
                                   # IAuditRepository  IContactRepository  IFeedbackRepository  IPersonnelRepository
      Implementations/             # ALL USE CLEAN LAMBDA EXPRESSIONS (=>)
                                   # UserRepository  BookRepository  BorrowRepository
                                   # ReservationRepository  FineRepository  CategoryRepository
                                   # AuditRepository  ContactRepository  FeedbackRepository  PersonnelRepository
                                   # EF Core queries ONLY -- no business rules

    Services/
      Interfaces/                  # IUserService  IBookService  IBorrowService
                                   # IReservationService  IFineService  ICategoryService
                                   # IAuditService  IContactService  IFeedbackService
                                   # IPersonnelService  ISystemHealthService
      Implementations/             # ALL USE CLEAN LAMBDA EXPRESSIONS (=>)
                                   # UserService  BookService  BorrowService
                                   # ReservationService  FineService  CategoryService
                                   # AuditService  ContactService  FeedbackService
                                   # PersonnelService  SystemHealthService
                                   # Business rules ONLY -- never touch _context directly

    Helpers/
      Infrastructure/              # FULL SECURITY CHAIN -- all security utilities (USE =>)
        InputSanitizer.cs          # XSS guard -- ALL public inputs MUST pass through (uses =>)
        JwtHelper.cs               # Token generation and validation
        PasswordHelper.cs          # BCrypt hash and verify (uses =>)
        PermissionsHelper.cs       # RBAC role check utilities (uses =>)
        NotificationHelper.cs      # Notification formatting utilities (uses =>)
        AuditHelper.cs             # Audit log SHA-256 hash chaining (uses =>)

    DBInfrastructure/
      Database/                    # DbConnectionFactory  DbHealthCheck  DatabaseSeeder
      Cache/                       # CacheService  CacheKeys  TtlRules  CacheInvalidation
      ApiTools/                    # ScalarV1Setup  SwaggerConfig
      EmailClient/                 # EmailSender  EmailTemplates

    Api/
      Controllers/                 # ALL USE CLEAN LAMBDA EXPRESSIONS (=>) -- call IService, return IActionResult
        UsersController.cs  BooksController.cs  BorrowController.cs  ReservationsController.cs
        FinesController.cs  CategoriesController.cs  PersonnelController.cs  AuditController.cs
        ContactController.cs  FeedbackController.cs  AuthController.cs  HealthController.cs
      DTOs/
        Requests/                  # CreateUserRequest  CreateBookRequest  ContactSubmissionRequest
                                   # FeedbackSubmissionRequest  CheckoutRequest  ReturnRequest ...
        Responses/                 # UserResponse  BookResponse  ApiResponse<T>  AuthResponse ...
      Middleware/                  # Request guards ONLY
        JwtMiddleware.cs  RateLimitMiddleware.cs
        IdempotencyMiddleware.cs  GlobalExceptionMiddleware.cs

  Management/
    Commands/                      # AddMigrationCommand  UpdateDatabaseCommand  SeedDatabaseCommand
    Scripts/                       # SetupDb.ps1
```

---

## LAYER RULES -- WHAT BELONGS WHERE

### Backend Layers

| Layer                   | ALLOWED                                          | FORBIDDEN                                  |
|-------------------------|--------------------------------------------------|--------------------------------------------|
| Data/Models/            | Entity properties, FK navigation properties      | Business logic, methods with rules         |
| Data/Enums/             | enum values only                                 | Methods, logic, computation                |
| Repositories/           | EF Core queries, CRUD, filtering                 | Business rules, HTTP concerns, service calls|
| Services/               | Validation, workflows, business rules            | _context access, HttpContext, raw SQL      |
| Helpers/Infrastructure/ | JWT, BCrypt, sanitizer, RBAC, audit utilities    | Business workflows, direct DB calls        |
| DBInfrastructure/       | DB engine, cache, email, Scalar V1 setup         | Domain logic, business rules               |
| Api/Controllers/        | Parse request, call IService, return response    | Business logic, EF Core, _context usage    |
| Api/DTOs/               | Data shaping, DataAnnotations attributes         | Business validation logic                  |
| Api/Middleware/         | Rate limit, auth, idempotency, global exceptions | Business logic, DB queries                 |
| Management/             | Migrations, seeds, CLI scripts                   | Application business logic                 |

### Frontend Layers

| Layer         | Scope         | ALLOWED                                         | FORBIDDEN                                  |
|---------------|---------------|-------------------------------------------------|--------------------------------------------|
| Pages/        | Route-only    | Route entry points, layout composition          | Business logic, API calls                  |
| Features/     | Feature-only  | Feature UI, feature hooks, feature workflows    | Global state, shared UI, infrastructure    |
| Endpoints/    | **GLOBAL**    | axios/fetch API stubs, request/response types   | Business rules, UI rendering               |
| Shared/       | **GLOBAL**    | Primitives: Button, RadioButton, Dropdown, SearchBar, Modal, Skeletons | Feature-specific logic, API calls, role duplicates |
| LayoutBars/   | **GLOBAL**    | Layout shells, Header, Footer, Sidebar frames   | Business logic, API calls                  |
| LayoutStyles/ | **GLOBAL**    | CSS tokens, color variables, FontSyle/ typography| Component-specific styles, hardcoded colors |
| Hooks/        | **GLOBAL**    | Reusable hooks, useFluidResposiveness, observers| Feature-specific hooks (go in Features/)   |
| Libs/Assets/  | **GLOBAL**    | Constants, link lists, JSON data, CDN URLs      | UI components, business logic              |
| Assets/       | **GLOBAL**    | Images, icons, videos, threejs/ 3D scenes       | Any business logic, raw API calls          |

### UI Primitives Architecture: Global Primary (`src/Shared/`) vs. Role-Scoped Adapters (`[UserRole]/Shared/`)

To eliminate any confusion when building or modifying UI components:

1. **Global Primary Calling (`Frontend/src/Shared`):**
   - **Path:** `C:\Users\provu\Desktop\KATIPUNEROS LIBRARY STORE\Katipuneros-Library-Store\Frontend\src\Shared`
   - This is the **GLOBAL PRIMARY CALLING** root for all default primitives across the entire application:
     - `Button.tsx` (and `shared/components/Button.tsx`)
     - `Dropdown.tsx` (and `shared/components/Dropdown.tsx`)
     - `RadioButton.tsx` (and `shared/components/RadioButton.tsx`)
     - `SearchBar.tsx` (re-exports `useDebounce`)
     - `DefaultFloatingModalCard.tsx`
     - `SkeletonLoader.tsx`, `DragDropFileUpload.tsx`, `ImageGallery.tsx`, `TreeView.tsx`
     - `index.ts` (master barrel export)

2. **Role-Scoped Shared Adapters (`[UserRole]/Shared`):**
   - **Paths:**
     - `Frontend\src\UserRoles\Features\Pages\CustomersPanel\Shared`
     - `Frontend\src\UserRoles\Features\Pages\CashiersPanel\Shared`
     - `Frontend\src\UserRoles\Features\Pages\AdminsPanel\Shared`
   - **Architectural Calling Flow:**
     - The role-scoped `Shared/` folders **call the defaults from the global `Frontend\src\Shared` folder**.
     - They apply targeted edits, role-specific defaults, and prop mappings based on accurate role requirements and previous HTML-to-TypeScript-React conversion requirements.
     - **Result:** Every role-scoped component (`AdminButton`, `AdminModalCard`, `CashierButton`, `CashierModalCard`, `CustomerButton`, `CustomerModalCard`, `RadioGroupField`) strictly preserves its exact visual UI appearance without breaking changes or visual regressions!
     - **No Disconnected Forking:** Role-level folders must NEVER create disconnected standalone primitive forks. They must always delegate to `Frontend\src\Shared`.

---

## FILE COMMENT RULES -- REQUIRED ON EVERY NEW FILE

Every new file MUST open with a header comment block stating:
1. What **layer** owns this file
2. What this file is **responsible for**
3. What is **NOT allowed** here

**TypeScript / React Component:**
```tsx
// [Layer: LANDING_PAGE/Features/Pages/ContactMe/Components]
// ContactForm.tsx -- Public contact form UI component.
// Renders form fields and calls Endpoints/contactApi.ts on submit.
// DO NOT put business logic here.
// DO NOT use fetch/axios directly -- use Endpoints/contactApi.ts only.
```

**TypeScript Endpoint Stub:**
```ts
// [Layer: Endpoints/Customer]
// borrowApi.ts -- API stub for customer borrow requests.
// Contains axios/fetch calls and TypeScript request/response type definitions ONLY.
// DO NOT put business logic, validation rules, or UI rendering here.
```

**C# Service Implementation:**
```csharp
// [Layer: Services/Implementations]
// BookService.cs -- Business logic for book operations.
// Validates availability, enforces borrow limits, calls IBookRepository.
// DO NOT query _context directly -- use IBookRepository only.
// DO NOT access HttpContext -- HTTP concerns stay in controllers.
```

**C# Repository Implementation:**
```csharp
// [Layer: Repositories/Implementations]
// BookRepository.cs -- Data access for the Book entity via EF Core.
// Queries AppDbContext.Books -- CRUD and search operations only.
// DO NOT put business rules. DO NOT validate. DO NOT call services.
```

**C# Controller:**
```csharp
// [Layer: Api/Controllers]
// BooksController.cs -- REST API endpoints for book operations.
// Parses HTTP requests, calls IBookService, returns IActionResult.
// DO NOT put business logic. DO NOT use _context. DO NOT write EF Core queries.
```

**C# Entity Model:**
```csharp
// [Layer: Data/Models]
// Book.cs -- Book entity -- database table shape only.
// Properties and FK navigation properties ONLY.
// DO NOT add business logic, methods, or computed properties with rules.
```

**C# Enum:**
```csharp
// [Layer: Data/Enums]
// UserRole.cs -- Fixed enumeration of user role types.
// DO NOT add methods or logic -- enumeration values only.
```

---

## MANDATORY LAMBDA EXPRESSIONS (=>) RULE -- ALL ASYNC & SYNC OPERATIONS

### Core Principle
> **"Services and Repositories uses Lambda expressions for clean and easy to read for asynchronous and synchronous this one => used lambda expression for asynchronous and synchronous not only in the Services and Repositories, all uses asynchronous and synchronous"**

Every method, function, and property in this codebase MUST prefer clean, concise, and easy-to-read **expression-bodied lambda syntax (`=>`)** for both **asynchronous** and **synchronous** operations across ALL layers. Bulky method bodies with nested ceremonies, manual returns, and unnecessary indentation are strictly prohibited when an expressive `=>` lambda or pattern-matching switch expression can be used.

### 1) Repositories (Async & Sync Lambdas)
```csharp
// Async query using =>
public async Task<List<Book>> GetCatalogAsync(Guid? categoryId = null, string? search = null, bool? spotlight = null) =>
    await _context.Books
        .AsNoTracking()
        .Include(b => b.Category)
        .Where(b => !categoryId.HasValue || b.CategoryId == categoryId.Value)
        .Where(b => string.IsNullOrWhiteSpace(search) || EF.Functions.Like(b.Title, $"%{search}%") || EF.Functions.Like(b.Author, $"%{search}%"))
        .Where(b => !spotlight.HasValue || b.IsSpotlight == spotlight.Value)
        .OrderByDescending(b => b.CreatedAt)
        .ToListAsync();

// Async command using =>
public async Task<Book> AddAsync(Book book) =>
    (await _context.Books.AddAsync(book)).Entity;

// Synchronous EF Core state change using =>
public Task UpdateAsync(Book book) =>
    Task.FromResult(_context.Books.Update(book));

public Task DeleteAsync(Book book) =>
    Task.FromResult(_context.Books.Remove(book));
```

### 2) Services (Async & Sync Lambdas + Pattern Matching)
```csharp
// Async workflow returning tuple status using => and switch expression
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

// Async lookup with null-coalescing expression body =>
public async Task<Book?> GetBookDetailsAsync(Guid id) =>
    await _bookRepo.GetByIdAsync(id);
```

### 3) Controllers (Async & Sync Action Lambdas)
```csharp
// Constructor using =>
public BooksController(IBookService bookService) => _bookService = bookService;

// Async HTTP GET action using =>
[HttpGet]
[AllowAnonymous]
public async Task<IActionResult> GetBooks([FromQuery] Guid? categoryId, [FromQuery] string? query, [FromQuery] bool? spotlight) =>
    Ok(ApiResponse<object>.Ok(await _bookService.GetCatalogAsync(categoryId, query, spotlight)));

// Async HTTP POST action with pattern matching using =>
[HttpPost]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> Create([FromBody] CreatePersonnelRequest request) =>
    await _personnelService.CreatePersonnelAsync(request.FullName, request.Position, request.Department, request.ImageUrl, request.DisplayOrder) is { } staff
        ? CreatedAtAction(nameof(GetById), new { id = staff.Id }, ApiResponse<object>.Ok(staff, "Staff profile created."))
        : BadRequest(ApiResponse<object>.Fail("Failed to create staff profile."));

// Async HTTP PUT action using => switch expression
[HttpPut("{id:guid}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request) =>
    !ModelState.IsValid
        ? BadRequest(ApiResponse<object>.Fail("Invalid category update payload."))
        : await _categoryService.UpdateCategoryAsync(id, request.DeweyRange, request.Name, request.ShelfBayLocation, request.Description) switch
        {
            (true, _) => Ok(ApiResponse<object>.Ok(new { id }, "Classification details updated.")),
            (false, var error) => BadRequest(ApiResponse<object>.Fail(error ?? "Failed to update category."))
        };
```

### 4) Helper & Infrastructure Utilities (Pure Functions using =>)
```csharp
// BCrypt Password Hashing using =>
public static string HashPassword(string plainPassword) =>
    BCrypt.Net.BCrypt.EnhancedHashPassword(plainPassword, WorkFactor);

public static bool VerifyPassword(string plainPassword, string hashedPassword) =>
    !string.IsNullOrWhiteSpace(plainPassword) &&
    !string.IsNullOrWhiteSpace(hashedPassword) &&
    BCrypt.Net.BCrypt.EnhancedVerify(plainPassword, hashedPassword);

// SHA-256 Cryptographic Hash Chaining using =>
public static string ComputeHash(string previousHash, string action, string targetEntity, string payload, DateTime timestamp) =>
    Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes($"{previousHash}|{action}|{targetEntity}|{payload}|{timestamp:O}")));

// Input Sanitization using =>
public static string SanitizeText(string? input) =>
    string.IsNullOrWhiteSpace(input)
        ? string.Empty
        : WebUtility.HtmlEncode(HtmlTagRegex.Replace(ScriptTagRegex.Replace(input, string.Empty), string.Empty).Trim());

// RBAC Role Evaluation using =>
public static bool CanManageCatalog(UserRole role) => role == UserRole.Admin;
public static bool CanProcessCirculation(UserRole role) => role is UserRole.Cashier or UserRole.Admin;
```

### 5) Frontend Endpoint Stubs (Arrow Function Lambdas `=>`)
```ts
// Async Endpoint stubs using concise arrow functions =>
export const getPublicBooks = async (categoryId?: string, query?: string): Promise<BookItem[]> =>
  (await apiRequest<BookItem[]>({ url: '/api/books', params: { categoryId, query } })).data ?? [];

export const submitContactInquiry = async (data: ContactSubmission): Promise<{ success: boolean; message: string }> =>
  await apiRequest<{ success: boolean; message: string }>({
    url: '/api/contact',
    method: 'POST',
    data,
  });
```

---

## PLACEMENT DECISION GUIDE

When unsure where code belongs, answer these questions in order:

### Frontend -- Where does it go?

| Question                                  | Place it here                                       |
|-------------------------------------------|-----------------------------------------------------|
| Is it a page route entry point?           | LANDING_PAGE/Features/Pages/ or UserRoles/Features/ |
| Is it feature-specific UI or component?   | Features/{FeatureName}/Components/                  |
| Is it a backend API call?                 | Endpoints/{Role}/featureApi.ts (GLOBAL)             |
| Is it reusable UI used in 2+ places?      | Shared/ (GLOBAL) or Panel/Shared/ (role-scoped)     |
| Is it a global layout element / wrapper?  | LayoutBars/ (LandingLayout, CustomerLayout, etc.)   |
| Is it device responsiveness or breakpoints?| Hooks/useFluidResposiveness.ts or useResponsive.ts  |
| Is it fluid sizing or CSS clamp math?     | Hooks/useFluidResposiveness.ts (GLOBAL)             |
| Is it a shared hook (used in 2+ features)?| Hooks/ (GLOBAL)                                     |
| Is it static data or a constant list?     | Libs/Assets/data.ts or links.ts (GLOBAL)            |
| Is it a static image or media file?       | Assets/images/ or Assets/icons/ (GLOBAL)            |
| Is it a 3D scene engine or 3D asset?      | Assets/threejs/ (GLOBAL)                            |
| Is it typography, font size, or font styles? | LayoutStyles/FontSyle/fontStyles.css (GLOBAL)    |
| Is it global CSS, colors, or design tokens? | LayoutStyles/MainLayout.css or PartLayout.css (GLOBAL) |

### Backend -- Where does it go?

| Question                                  | Place it here                                        |
|-------------------------------------------|------------------------------------------------------|
| Is it a database entity / table shape?    | Features/Data/Models/                                |
| Is it a fixed enumeration value?          | Features/Data/Enums/                                 |
| Is it database access logic?              | Features/Repositories/Implementations/               |
| Is it business logic / rules?             | Features/Services/Implementations/                   |
| Is it a security or auth utility?         | Features/Helpers/Infrastructure/                     |
| Is it an API endpoint handler?            | Features/Api/Controllers/                            |
| Is it a request or response shape?        | Features/Api/DTOs/                                   |
| Is it a request guard / pipeline step?    | Features/Api/Middleware/                             |
| Is it external system setup?              | Features/DBInfrastructure/                           |
| Is it cache logic?                        | Features/DBInfrastructure/Cache/                     |
| Is it a CLI / migration command?          | Management/Commands/                                 |

---

## ADDING A NEW FEATURE -- MANDATORY ORDER

Follow this exact order. Do not skip steps.

```
BACKEND (do these first):
1.  Define entity in Features/Data/Models/
2.  Define enums in Features/Data/Enums/ (if needed)
3.  Register DbSet<T> in AppDbContext.cs
4.  dotnet ef migrations add {MigrationName}
5.  dotnet ef database update
6.  Create interface in Repositories/Interfaces/
7.  Create implementation in Repositories/Implementations/
8.  Create interface in Services/Interfaces/
9.  Create implementation in Services/Implementations/
10. Create DTOs in Api/DTOs/Requests/ and Api/DTOs/Responses/
11. Create controller in Api/Controllers/
12. Register in Program.cs:  builder.Services.AddScoped<IRepo, Repo>()
13. Add cache invalidation in DBInfrastructure/Cache/CacheInvalidation.cs (if cached)
14. Add audit log entry in AuditHelper.cs (if feature touches user data)

FRONTEND (do these after backend is ready):
15. Add API stub in Endpoints/{Role}/featureApi.ts
16. Add feature slice folder in LANDING_PAGE/Features/ or UserRoles/Features/{Panel}/
17. Create Components/ folder inside the feature slice
18. Add to Hooks/ only if the hook is shared across 2+ features
19. Compose in the correct Page.tsx -- route-level only, no logic in the page file
20. Register route in App.tsx using React.lazy() + Suspense
```

---

## SCALAR V1 -- API DOCUMENTATION

- Scalar V1 is the API documentation and testing interface (replaces Swagger UI)
- **Dev URL:** `http://localhost:5000/scalar/v1`
- **Raw OpenAPI schema:** `http://localhost:5000/openapi/v1.json`

**Setup in Program.cs:**
```csharp
builder.Services.AddOpenApi();    // register OpenAPI schema
app.MapOpenApi();                 // /openapi/v1.json
app.MapScalarApiReference();      // /scalar/v1 -- Scalar V1 interactive UI
```

**Every controller action MUST have:**
```csharp
/// <summary> Brief description of what this endpoint does </summary>
[ProducesResponseType(typeof(BookResponse), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
[HttpGet("{id}")]
public async Task<IActionResult> GetBook(Guid id) { ... }
```

**Rules:**
- All controllers: `[ApiController]` + `[Route("api/[controller]")]`
- Disable Scalar in production via `appsettings.Production.json` environment check

---

## SECURITY CHECKLIST -- VERIFY BEFORE EVERY COMMIT

- [ ] No secrets hardcoded anywhere -- use `appsettings.json` / `.env` / environment vars
- [ ] All public form inputs pass through `InputSanitizer.cs`
- [ ] All admin endpoints have `[Authorize(Roles = "Admin")]`
- [ ] JWT secret is NOT in source control for production (use env var or Key Vault)
- [ ] CORS restricted to specific frontend origin (not AllowAll) in production
- [ ] Passwords hashed with `PasswordHelper.cs` (BCrypt) -- never MD5 or SHA1
- [ ] Rate limiting active on all public-facing endpoints
- [ ] No PII, tokens, or hashes stored in Redis cache
- [ ] Scalar V1 UI disabled in production environment

---

## CACHE RULES

### What CAN be cached
- Book catalog listings and detail pages
- Dashboard statistics and analytics summaries
- User permissions (short TTL -- 5 minutes max)
- System settings / reference data
- Borrowing and reservation summary counts

### What MUST NOT be cached
- Passwords or password hashes
- JWT refresh tokens or authentication secrets
- Database connection strings
- Sensitive personal data (full PII)

### Cache Key Pattern (CacheKeys.cs)
```csharp
book:{id}              // single book detail
book:list              // full catalog list
dashboard:stats        // dashboard summary stats
user:perms:{userId}    // user permission set (5 min TTL)
borrow:active:{userId} // active borrow list per user
system:settings        // system configuration (60 min TTL)
```

---

## DEV RUNTIME

```
Frontend:  npm run dev   ->  http://localhost:5173   (Vite hot reload)
Backend:   dotnet run    ->  http://localhost:5000   (Kestrel)
Database:  SSMS          ->  localhost:1433  (SQL Server -- recommended)
           pgAdmin        ->  localhost:5432  (PostgreSQL -- 2nd choice)
           XAMPP          ->  localhost:3306  (MySQL/MariaDB -- alternative)
Scalar V1: http://localhost:5000/scalar/v1
```

---

## DO NOT TOUCH

- Do NOT modify `AppDbContext.cs` for business logic -- it is EF config only
- Do NOT modify `Program.cs` for feature logic -- it is wiring and DI registration only
- Do NOT change `CacheKeys.cs` naming conventions without updating all usages
- Do NOT reorder middleware in `Program.cs` without understanding the pipeline
- Do NOT delete `InputSanitizer.cs` -- all public inputs depend on it
- Do NOT expose Scalar V1 in the production environment
- Do NOT mix Landing Page and UserRole module code -- ever

---

## DEPENDENCY INJECTION -- REGISTRATION PATTERN

Every service and repository MUST be registered in `Program.cs`:
```csharp
// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IBookRepository, BookRepository>();
builder.Services.AddScoped<IBorrowRepository, BorrowRepository>();
builder.Services.AddScoped<IContactRepository, ContactRepository>();
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepository>();

// Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IBorrowService, BorrowService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();

// Infrastructure
builder.Services.AddScoped<ICacheService, CacheService>();
builder.Services.AddSingleton<IEmailSender, EmailSender>();
```

---

## MIDDLEWARE ORDER -- PROGRAM.CS PIPELINE

Order matters. Always register in this sequence:
```csharp
app.UseMiddleware<GlobalExceptionMiddleware>();  // 1. Catch all unhandled exceptions
app.UseMiddleware<RateLimitMiddleware>();        // 2. Rate limiting per IP
app.UseMiddleware<IdempotencyMiddleware>();      // 3. Duplicate POST protection
app.UseCors();                                   // 4. CORS headers
app.UseAuthentication();                         // 5. JWT token validation
app.UseAuthorization();                          // 6. Role / policy checks
app.MapControllers();                            // 7. Route to controllers
```

---

## 10. PLUGINS-DRIVEN ARCHITECTURAL & OPERATIONAL FRAMEWORK
*(Adopted, applied, obeyed, and enforced from `C:\Users\provu\Desktop\PLUGINS` and `PLUGINS_SKILLS_MEMORY_CACHE.md`)*

### 10.1 System-Wide Connections & Layer Traversal
Every operational capability in the Katipuneros Library Store traverses an immutable unidirectional chain across six discrete layers:
$$\text{Database (SQL Server / EF Core)} \longrightarrow \text{Repositories (Data Access)} \longrightarrow \text{Services (Business Logic)} \longrightarrow \text{Controllers (REST API)} \longrightarrow \text{Endpoints (TypeScript Client)} \longrightarrow \text{Pages & Features (React 19)}$$

1. **Database & ORM Tier:** `AppDbContext.cs` manages EF Core 10 migrations, relationships, seed data, and schema invariants. Direct database queries bypassing repositories are strictly prohibited.
2. **Repository Abstraction Tier:** All CRUD operations flow through strongly-typed repository interfaces (`IUserRepository`, `IBookRepository`, `IBorrowRepository`, etc.). Synchronous and asynchronous methods MUST use clean, readable expression bodies (`=>`).
3. **Domain Service Tier:** Houses transaction workflows, hold expiration evaluators, fine calculation engines, and security policy checks. Services must never depend on HTTP contexts or UI view models.
4. **API Controller Tier:** Thin routing boundary exposing resource endpoints with standard status codes (`200 OK`, `201 Created`, `400 BadRequest`, `401 Unauthorized`, `404 NotFound`). Controllers contain zero business logic.
5. **Endpoints & HTTP Client Tier:** Front-facing TypeScript API modules (`userApi.ts`, `booksApi.ts`, `borrowingsApi.ts`, `reservationsApi.ts`, etc.) encapsulating typed HTTP requests via `apiClient.ts`.
6. **Feature & Page Presentation Tier:** React 19 functional components consuming global shared primitives (`SearchBar`, `Dropdown`, `RadioButton`, `DefaultFloatingModalCard`, `AdminSwitch`) and hooks (`useFluidResposiveness`, `useDebounce`, `usePagination`, `useTableDraggable`, `usePagesGlobalRefresh`).

### 10.2 Architectural Approaches & Methodologies

1. **Acyclic Vertical-Slice Architecture (`graphify` Plugin):**
   - Feature slices (`AdminsPanel`, `CashiersPanel`, `CustomersPanel`) are strictly isolated. No feature slice may import internals from another panel.
   - Lower layers never import from higher layers (`Shared` never imports from `Features`; `Hooks` never imports from `Pages`).
   - Monolithic god-nodes are broken down into cohesive, single-responsibility sub-components.

2. **Token Economy & Universal Lambda Syntax (`caveman` & `rtk` Plugins):**
   - Eliminate boilerplate method ceremonies and redundant braces. All synchronous and asynchronous routines across Controllers, Services, Repositories, Helpers, and TypeScript API stubs MUST use clean, readable expression bodies (`=>`) and pattern-matching `switch` expressions.
   - Compact, high-density coding minimizes LLM context window churn while maximizing clarity and execution speed.

3. **Hierarchical Routing & Sticky Chrome (`OmniRoute` & `headroom` Plugins):**
   - Navigation between sub-pages inside admin role consoles preserves the collapsed (`w-20`) or expanded (`w-64`) sidebar state and scroll positions without layout flashes.
   - Mobile drawers automatically dismiss on route change or backdrop tap for all screens $< 1024\text{px}$.
   - The TopBar remains `fixed top-0` with dynamic horizontal offsets matching navigation drawer state (`left-64` when open, `left-20` when collapsed, `left-0` on mobile). Elevated elements use `backdrop-blur-xl` and strict layer coordinates (`z-40`, `z-30`).

4. **Design Intelligence & Fluid Responsiveness (`ui-ux-pro-max-skill` Plugin):**
   - Zero hardcoded colors: raw hex codes (`#164E63`, `#00658A`) and arbitrary RGB values are strictly forbidden in UI components. Always consume semantic tokens (`bg-primary`, `bg-surface-container-lowest`, `text-text-primary`, `border-outline-variant`).
   - Viewport responsiveness is centralized exclusively in `Hooks/useFluidResposiveness.ts` spanning 24 fluid device scales (360px mobile to 3840px 4K ultrawide). Inline `window.addEventListener('resize')` calls are strictly banned.
   - Glassmorphism, accessible contrast ratios (WCAG AA/AAA), standard focus rings, and explicit ARIA roles are mandatory for all interactive form primitives.

5. **Anti-Hallucination & Canonical Single Source of Truth (`context7` Plugin):**
   - Never hallucinate new ad-hoc UI or alternative component structures when an existing canonical implementation exists.
   - Always inspect source TSX/HTML files to adopt existing metrics, table headers, badge variants, and layout structures.

6. **Closed-Loop Autonomous Verification (`ralph` & `loop-eng` Plugins):**
   - Work is never declared complete until verified through closed-loop validation:
     - Backend builds with **0 warnings and 0 errors** (`dotnet build`).
     - Frontend compiles with **0 errors** (`npm run build`).
     - Browser and endpoint tests confirm live operational data flow.

7. **Cryptographic Integrity & Perimeter Governance (`wazuh`, `ghidra`, `ImHex`, `radare2` Plugins):**
   - All immutable audit log entries must verify SHA-256 block hash chaining and Merkle tree roots.
   - Network perimeter controls enforce bitwise CIDR subnet validation (`IpToUInt32(IP) & SubnetMask(prefix)`).
   - Hot paths (search debouncing, table drag-scrolling) must remain lean, avoiding speculative abstractions or repeated scans.

### 10.3 DO and DO NOT Rules (Definitive Guardrails)

```
DO                                                     DO NOT
--------------------------------------------------     --------------------------------------------------
Use universal lambda syntax (=>) for all routines      Write multiline method ceremonies with empty returns
Guard every ratio/percent against division by zero     Render NaN%, undefined, or broken gauge bars
Enforce N=0 empty database displays (0, 0.0%, ₱0.00)   Display fake seed metrics (3,420, 1,248, ₱1,245)
Import usePagesGlobalRefresh in all admin pages        Leave views disconnected from network recovery
Use reactive toast feedback via useToasts.ts           Trigger native browser alert() or prompt()
Consume global shared primitives from Frontend/Shared  Duplicate UI components across feature slices
Centralize viewport math in useFluidResposiveness      Write inline window resize listeners in components
Enforce role authorization on backend controllers      Rely on client-side route hiding for security
Sanitize all public input via InputSanitizer.cs        Trust raw form payloads or query strings directly
Keep lower layers strictly independent of higher ones  Import feature internals from shared/global layers
```

### 10.4 Core Computational Logics & Algorithmic Foundations

1. **Real-Time Catalog Shelf Rate Formula:**
   $$\text{ShelfRate} = \begin{cases} 0.0\%, & \text{if } C_{\text{total}} = 0 \\ \left( \frac{\sum b.\text{AvailableCopies}}{\sum b.\text{TotalCopies}} \times 100 \right)\%, & \text{if } C_{\text{total}} > 0 \end{cases}$$

2. **SVG Circular Donut Geometry & Arc Offsets:**
   $$\text{AvailableArc} = \left(\frac{A}{C_{\text{total}}} \times 100\right)\%, \quad \text{BorrowedArc} = \left(\frac{B}{C_{\text{total}}} \times 100\right)\%$$
   $$\text{StrokeDashOffset}_{\text{borrowed}} = -\text{AvailableArc}, \quad \text{StrokeDashOffset}_{\text{reserved}} = -(\text{AvailableArc} + \text{BorrowedArc})$$

3. **Dynamic Multi-Series SVG Bezier Curve Interpolation:**
   $$y_i = Y_{\text{max}} - \left( \frac{v_i}{\max(V)} \times H_{\text{plot}} \right) \quad [Y_{\text{max}} = 340, \ H_{\text{plot}} = 280]$$

4. **Live Daily Fine Accrual & Statutory Cap Evaluation:**
   $$F_{\text{raw}}(d) = \max(0, d) \times R_{\text{daily}} \quad (R_{\text{daily}} = \text{₱}15.00/\text{day})$$
   $$F_{\text{final}}(d) = \min(F_{\text{raw}}(d), M_{\text{cap}}) \quad (M_{\text{cap}} = \text{₱}500.00)$$

5. **Courtesy Grace Period Buffer Time Window:**
   $$\text{FineActive}(t, t_{\text{due}}, G_{\text{hours}}) = \begin{cases} \text{true}, & \text{if } t > t_{\text{due}} + (G_{\text{hours}} \times 3600\text{s}) \\ \text{false}, & \text{otherwise} \end{cases}$$

6. **Bitwise CIDR Subnet Access Evaluation Algorithm:**
   $$\text{SubnetMask}(p) = \sim((1 \ll (32 - p)) - 1)$$
   $$\text{IsAllowed}(\text{IP}, \text{Subnet}, p) = (\operatorname{IpToUInt32}(\text{IP}) \mathbin{\&} \text{SubnetMask}(p)) == (\operatorname{IpToUInt32}(\text{Subnet}) \mathbin{\&} \text{SubnetMask}(p))$$

7. **Cryptographic SHA-256 Audit Chaining & Merkle Tree Root:**
   $$\text{Hash}_i = \operatorname{SHA256}(\text{Hash}_{i-1} \parallel \text{Timestamp}_i \parallel \text{Action}_i \parallel \text{Payload}_i)$$
   $$\text{MerkleParent}(L, R) = \operatorname{SHA256}(L \parallel R)$$

---

*This AGENTS.md is the AI agent behavior contract for the Katipuneros Library Store.*
*Read SKILL.md for the complete detailed architecture reference.*
*Both files must stay in sync whenever the project structure changes.*