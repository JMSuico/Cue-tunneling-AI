# Katipuneros Library Store -- Frontend UI & Backend CRUD Mapping Master Specification

> **Document Type**: Master Architecture & API Implementation Contract  
> **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS & LayoutStyles Design Tokens  
> **Backend**: .NET 10 + ASP.NET Core Web API + C# + EF Core 10  
> **Database**: SQL Server (SSMS) / PostgreSQL / MySQL (MariaDB)  
> **Binding Rules**: Strictly governed by `AGENTS.md` and `SKILL.md`  
> **Last Verified**: September 2026

---

## 1. Architectural Flow Chain Contract

Every interaction in the frontend initiates an HTTP request through a typed endpoint stub in `Frontend/src/Endpoints/`. No React component directly invokes `fetch` or `axios`. Every request strictly flows through the backend layered vertical slice:

```
[React 19 Component / View]
  │  (Invokes typed function in Endpoints/)
  ▼
[Endpoints/ Stub]  (e.g., Endpoints/Customer/borrowApi.ts)
  │  (Sends HTTP Request to http://localhost:5000/api/...)
  ▼
[ASP.NET Core 10 Controller]
  │  (Validates ModelState/DTO DataAnnotations, parses claims via JwtMiddleware)
  │  (Sanitizes public inputs via InputSanitizer.cs, checks [Authorize(Roles = "...")])
  ▼
[Service Interface & Implementation]  (e.g., IBorrowService -> BorrowService)
  │  (Enforces business rules, loan caps, fines check, policy validation)
  ▼
[Repository Interface & Implementation]  (e.g., IBorrowRepository -> BorrowRepository)
  │  (Executes EF Core 10 LINQ queries against AppDbContext ONLY -- no raw SQL)
  ▼
[Database Engine]  (SQL Server / PostgreSQL / MySQL)
```

---

## 2. Exhaustive Vertical Slice UI & CRUD Inventory

---

### Slice 1: Public Landing Page (`LANDING_PAGE`)

| Page / Component | UI Elements, Buttons & Triggers | Frontend Action / Display State | Real & Possible CRUD Type | Target Backend Endpoint | HTTP Method | Request / Response DTO | Authorization Gate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Home Route (`Home.tsx`)** | `HeroSection.tsx`, 3D Canvas (`BookHero3D.tsx`), "Find Book" search bar, "Reserve Book" button | Interactive 3D book rotation, catalog search input, spotlight modal triggers | **READ**: Fetch spotlight book metadata, featured titles, real-time patron counts | `GET /api/books/spotlight`<br>`GET /api/books/featured` | `GET` | Response: `BookResponse[]`<br>`SpotlightBookDto` | Public |
| **Auth Modal (`AuthModal.tsx`)** | "Sign In" tab, "Sign Up" tab, Google OAuth, Full Name, Email, Password, Student/Faculty ID | State switcher, client validation, credential submission | **CREATE**: Authenticate patron/staff account<br>**CREATE**: Register patron account | `POST /api/auth/login`<br>`POST /api/auth/register` | `POST` | Request: `LoginRequest`, `RegisterRequest`<br>Response: `AuthResponse { Token, Role, User }` | Public |
| **Book Detail Modal (`BookDetailModal.tsx`)** | "Reserve This Copy" button, synopsis accordion, shelf location tag, "Close" button | Floating glassmorphism modal with physical bay location and availability indicator | **READ**: Fetch full MARC/Dewey metadata, physical copies in stacks | `GET /api/books/{id}/details` | `GET` | Response: `BookDetailResponse` | Public |
| **Reservation Modal (`ReservationModal.tsx`)** | Pickup branch dropdown, pickup date picker, "Confirm Reservation" button | Form validation, reservation confirmation toast notification | **CREATE**: Place physical hold on book | `POST /api/reservations` | `POST` | Request: `CreateReservationRequest { BookId, PickupBranch, PickupDate }` | Public / Patron |
| **Products Catalog (`Product.tsx`)** | Newly acquired books grid, category carousel, filter chips (STEM, Filipiniana, History) | In-memory showcase filtering from `bookData.ts` | **READ**: Paginated showcase catalog query | `GET /api/books/new-acquisitions` | `GET` | Response: `PagedResult<BookResponse>` | Public |
| **Contact & Inquiries (`ContactMe.tsx`)** | Name, Email, Subject, Message, "Send Message" submit button | Calls `Endpoints/contactApi.ts`, shows loading spinner & confirmation badge | **CREATE**: Persist visitor inquiry message, dispatch auto-reply via SMTP | `POST /api/contact` | `POST` | Request: `ContactRequest`<br>Sanitized via `InputSanitizer.cs` | Public (Rate Limited) |
| **Library Map Section (`LibraryMapSection.tsx`)** | Interactive Stacks floor plan, Bay A-D pins, Circulation Desk queue counter | Visual SVG map with dynamic hover indicators | **READ**: Real-time bay occupancy and circulation desk queue load | `GET /api/branches/occupancy` | `GET` | Response: `BranchOccupancyDto` | Public |

---

### Slice 2: Customer / Patron Portal (`CustomersPanel`)

| Page / Component | UI Elements, Buttons & Triggers | Frontend Action / Display State | Real & Possible CRUD Type | Target Backend Endpoint | HTTP Method | Request / Response DTO | Authorization Gate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Dashboard (`CustomerDashboard.tsx`)** | Instant search bar (`Enter` key), Discipline filter pills, Borrowing trajectory card, "Explore Stacks" | Pill toggle styling, active loans display, due date badges | **READ**: Patron dashboard statistics, active borrowings count, pending hold alerts | `GET /api/customer/overview` | `GET` | Response: `PatronDashboardDto { ActiveLoans, PendingHolds, FinesDue }` | `[Authorize(Roles = "Customer")]` |
| **Catalog & OPAC Search (`CatalogPage.tsx`)** | Search input, Grid vs Compact List switch, Favorite heart toggle, "Reserve Book" button | Grid/List DOM layout toggle, favorite heart toggle micro-interaction, hold confirmation toast | **READ**: Multi-criteria book search<br>**CREATE/DELETE**: Toggle patron favorite<br>**CREATE**: Submit reservation hold | `GET /api/books/search`<br>`POST /api/customer/favorites/toggle`<br>`POST /api/customer/reservations` | `GET`<br>`POST`<br>`POST` | Request: `BookSearchQuery`, `ToggleFavoriteRequest`, `CreateHoldRequest` | `[Authorize(Roles = "Customer")]` |
| **Active Borrowings (`BorrowingsPage.tsx`)** | Filter tabs (All Past Loans, Returned on Time, Renewals), Quick search input, "Request Renewal (+7 Days)", "Ledger Export" | Live button spinner, renewal extension badge, in-memory table filter, browser print/export | **READ**: Active & past loan history<br>**UPDATE**: Extend loan due date (+7 days policy check)<br>**READ**: Export PDF/CSV loan passbook | `GET /api/customer/borrowings`<br>`POST /api/customer/borrowings/{id}/renew`<br>`GET /api/customer/borrowings/export` | `GET`<br>`POST`<br>`GET` | Request: `RenewLoanRequest`<br>Response: `LoanPassbookDto`, `FileStreamResult` | `[Authorize(Roles = "Customer")]` |
| **Reservations & Lockers (`ReservationsPage.tsx`)** | Filter tabs (Pending, Ready, Completed, Cancelled), "Cancel Hold" button, "Cancel Confirmation Modal", "View Locker Pass" | Modal popup open/close, cancel confirmation toast, locker PIN reveal | **READ**: Active hold queue, smart locker pickup pass<br>**DELETE**: Cancel pending reservation hold | `GET /api/customer/reservations`<br>`DELETE /api/customer/reservations/{id}` | `GET`<br>`DELETE` | Response: `ReservationDto[]`<br>Response: `204 No Content` | `[Authorize(Roles = "Customer")]` |
| **Wishlist & Saved Stacks (`FavoritesPage.tsx`)** | "+ Create Reading List" button, "Export (BibTeX / CSV)", "Reserve All Available (8)", Remove button | Filter tabs by custom lists, citation export trigger, batch reservation trigger | **READ**: Saved books wishlist<br>**CREATE**: Create custom reading list<br>**READ**: Export BibTeX citations<br>**CREATE**: Batch reserve available books | `GET /api/customer/favorites`<br>`POST /api/customer/reading-lists`<br>`GET /api/customer/favorites/export`<br>`POST /api/customer/reservations/batch` | `GET`<br>`POST`<br>`GET`<br>`POST` | Request: `CreateReadingListRequest`, `BatchReserveRequest`<br>Response: `BibTeX/CSV Stream` | `[Authorize(Roles = "Customer")]` |
| **Profile & Settings (`ProfileSettings.tsx`)** | Tab switcher (Personal, Reminders, Preferences, Security), "Copy Card #", "Save Profile & Preferences", Photo upload | Clipboard copy feedback, smooth tab scrolling, input validation | **READ**: Patron profile and library clearance standing<br>**UPDATE**: Personal details, notification channels, default shelf bay | `GET /api/customer/profile`<br>`PUT /api/customer/profile`<br>`PATCH /api/customer/preferences` | `GET`<br>`PUT`<br>`PATCH` | Request: `UpdatePatronProfileRequest { FullName, Email, Phone, BayPreference }` | `[Authorize(Roles = "Customer")]` |

---

### Slice 3: Cashier / Circulation Desk Terminal (`CashiersPanel`)

| Page / Component | UI Elements, Buttons & Triggers | Frontend Action / Display State | Real & Possible CRUD Type | Target Backend Endpoint | HTTP Method | Request / Response DTO | Authorization Gate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Terminal Dashboard (`CashierDashboard.tsx`)** | Fast desk shortcuts (Checkout, Return, Lookup), Daily ledger chart, Terminal register stats | Live terminal UI metrics, quick action triggers | **READ**: Cash drawer balance, loans processed today, returns pending grading | `GET /api/cashier/terminal/stats` | `GET` | Response: `TerminalMetricsDto { CashBalance, LoansToday, ReturnsPending }` | `[Authorize(Roles = "Cashier")]` |
| **Pending Reservations (`PendingReservations.tsx`)** | Barcode search, "Approve for Pickup", "Transfer to Smart Locker", Rejection Modal (`btn-modal-reject-damage`, `btn-modal-reject-limit`) | Modal popup, approval state transition, rejection reason form | **READ**: Pending holds roster<br>**UPDATE**: Fulfill reservation for pickup<br>**POST**: Assign smart locker bay & generate PIN<br>**PUT**: Reject reservation hold | `GET /api/cashier/reservations/pending`<br>`PUT /api/cashier/reservations/{id}/fulfill`<br>`POST /api/cashier/reservations/{id}/assign-locker`<br>`PUT /api/cashier/reservations/{id}/reject` | `GET`<br>`PUT`<br>`POST`<br>`PUT` | Request: `AssignLockerRequest { LockerBay, Pin }`<br>`RejectHoldRequest { Reason }` | `[Authorize(Roles = "Cashier")]` |
| **Rapid Checkout (`CheckoutBorrow.tsx`)** | Patron barcode scanner input, Book barcode scanner input, "Checkout Items", Due date selector | Real-time barcode scan queue, patron limit validation | **CREATE**: Process physical circulation loan transactions, update book status to `Borrowed` | `POST /api/cashier/checkout` | `POST` | Request: `CheckoutBorrowRequest { PatronBarcode, BookBarcodes[], DueDate }`<br>Response: `CheckoutReceiptDto` | `[Authorize(Roles = "Cashier")]` |
| **Returns & Grading (`ReturnsFines.tsx`)** | Barcode scanner, Condition pills (Pristine, Minor Wear, Damaged, Lost), "Process Return", "Assess Fine" | Dynamic condition assessment, auto fine calculator based on delay/damage | **UPDATE**: Mark book copy returned, increment available stacks<br>**CREATE**: Record fine transaction | `POST /api/cashier/returns` | `POST` | Request: `ProcessReturnRequest { Barcode, ConditionGrade, DamageFee, ReturnDate }` | `[Authorize(Roles = "Cashier")]` |
| **Patron Lookup (`CustomerLookup.tsx`)** | Patron query search bar, "Issue Clearance Certificate", Patron Details Modal (`patronModal`), Suspension toggle | Patron modal with active loan table, clearance certificate popup | **READ**: Patron profile, loan standing, unpaid fines<br>**CREATE**: Generate and sign digital Library Clearance Certificate | `GET /api/cashier/customers/{query}`<br>`POST /api/cashier/customers/{id}/clearance` | `GET`<br>`POST` | Request: `IssueClearanceRequest`<br>Response: `ClearanceCertificateDto (PDF/Signed)` | `[Authorize(Roles = "Cashier")]` |
| **Shelf Locator (`BookAvailability.tsx`)** | Title/ISBN search, Floor/Bay filter dropdown, Floorplan Modal (`floorplanModal`), Shelf tags | Interactive floor plan drawer, copy breakdown (Available, Bound, Lost) | **READ**: Physical shelf inventory coordinates and bay availability | `GET /api/cashier/inventory/availability` | `GET` | Request: `InventorySearchQuery { Isbn, Bay, Floor }`<br>Response: `ShelfAvailabilityDto` | `[Authorize(Roles = "Cashier")]` |
| **Duty Schedules (`Schedules.tsx`)** | Week switcher (`chevron_left`, `chevron_right`), "Request Shift Swap", Shift calendar matrix | Shift matrix display, swap request form | **READ**: Staff duty roster for the week<br>**CREATE**: Submit shift swap request | `GET /api/cashier/schedules`<br>`POST /api/cashier/schedules/swap-request` | `GET`<br>`POST` | Request: `ShiftSwapRequest { TargetStaffId, ShiftDate, Reason }` | `[Authorize(Roles = "Cashier")]` |
| **Overdue Fines (`OverdueFines.tsx`)** | "Settle Fine", "Apply Waiver / Discount", Filter tabs (Unpaid, In Dispute, Settled) | Fine calculation review, waiver rationale modal | **UPDATE**: Settle overdue fine balance (Cash/GCash)<br>**UPDATE**: Apply authorized waiver | `POST /api/cashier/fines/{id}/settle`<br>`PUT /api/cashier/fines/{id}/waive` | `POST`<br>`PUT` | Request: `SettleFineRequest { AmountPaid, PaymentMethod }`<br>`WaiveFineRequest { Reason, SupervisorId }` | `[Authorize(Roles = "Cashier")]` |
| **Register Transactions (`Transactions.tsx`)** | "Export Audit CSV", "Today" filter, "View Log", "Audit Memo", Payment type filter (Cash, GCash, Card) | Print audit register, filter transaction ledger | **READ**: Register transaction ledger<br>**READ**: Export daily audit CSV<br>**DELETE**: Void mistyped entry (with audit log) | `GET /api/cashier/transactions`<br>`GET /api/cashier/transactions/export`<br>`POST /api/cashier/transactions/{id}/void` | `GET`<br>`GET`<br>`POST` | Request: `VoidTransactionRequest { Reason }`<br>Response: `TransactionLedgerDto[]`, `CSV Stream` | `[Authorize(Roles = "Cashier")]` |
| **Terminal Alerts (`Notifications.tsx`)** | Category tabs (All, System, Overdue, Pickup), "Mark All as Read", "Dispatch Desk Broadcast" form | DOM tab switching, broadcast submit spinner, form reset | **READ**: Terminal notifications<br>**UPDATE**: Mark notifications read<br>**CREATE**: Dispatch desk broadcast announcement | `GET /api/cashier/notifications`<br>`PUT /api/cashier/notifications/mark-read`<br>`POST /api/cashier/notifications/broadcast` | `GET`<br>`PUT`<br>`POST` | Request: `BroadcastNoticeRequest { Title, Message, Urgency }` | `[Authorize(Roles = "Cashier")]` |

---

### Slice 4: Administrator Executive Console (`AdminsPanel`)

| Page / Component | UI Elements, Buttons & Triggers | Frontend Action / Display State | Real & Possible CRUD Type | Target Backend Endpoint | HTTP Method | Request / Response DTO | Authorization Gate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Executive Dashboard (`AdminDashboard.tsx`)** | "+ Add User", "+ Add Book", "Generate Audit Report", Time filters (Weekly, Monthly, Term Q3) | SVG trend charts, KPI cards, pending approval quick-actions | **READ**: High-level library KPIs, circulation rate, budget utilization, delinquent accounts | `GET /api/admin/metrics` | `GET` | Response: `AdminKpiResponse { TotalPatrons, TotalBooks, ActiveCirculation, Revenue }` | `[Authorize(Roles = "Admin")]` |
| **User Management (`UserManagement.tsx`)** | "+ Add User" button, Role filter tabs (All, Patrons, Cashiers, Admins), Status toggle, "Export CSV / Excel" | Filter tabs, user data table, status badges | **CREATE**: Add patron/staff account<br>**READ**: Filtered user accounts<br>**UPDATE**: Modify roles, grant permissions, suspend user<br>**DELETE**: Soft-delete user | `POST /api/admin/users`<br>`GET /api/admin/users`<br>`PUT /api/admin/users/{id}`<br>`DELETE /api/admin/users/{id}` | `POST`<br>`GET`<br>`PUT`<br>`DELETE` | Request: `CreateUserRequest`, `UpdateUserRequest`<br>Response: `PagedResult<UserResponse>` | `[Authorize(Roles = "Admin")]` |
| **Books Manager (`BooksManager.tsx`)** | "+ Add New Book", "Batch ISBN Import", "Export MARC 21 / CSV", Category pills | Category filters, book table, ISBN import trigger | **CREATE**: Ingest new catalog title<br>**CREATE**: Bulk batch ISBN ingestion<br>**UPDATE**: Edit title, author, copies, shelf bay<br>**DELETE**: De-accession / archive book | `POST /api/admin/books`<br>`POST /api/admin/books/batch-import`<br>`PUT /api/admin/books/{id}`<br>`DELETE /api/admin/books/{id}` | `POST`<br>`POST`<br>`PUT`<br>`DELETE` | Request: `CreateBookRequest`, `BatchIsbnImportRequest`, `UpdateBookRequest` | `[Authorize(Roles = "Admin")]` |
| **Master Reservations (`Reservations.tsx`)** | "Export Roster", "Locker Matrix", "Batch Hold Clearance", Location filter tabs | Location filtering, batch selection triggers | **READ**: Master reservation queue<br>**UPDATE**: Batch hold release / cancellation<br>**UPDATE**: Reallocate locker slots | `GET /api/admin/reservations`<br>`POST /api/admin/reservations/batch-clearance` | `GET`<br>`POST` | Request: `BatchClearanceRequest { HoldIds[], Action }`<br>Response: `ReservationQueueDto[]` | `[Authorize(Roles = "Admin")]` |
| **Circulation Audit (`Borrowings.tsx`)** | "Export Loan Ledger", "Lending Rules", "New Circulation Loan Override", "Renewal Modal (`renewalModal`)" | Search input, renewal modal with duration override | **CREATE**: Manual loan override (bypass loan caps)<br>**READ**: Complete institutional circulation audit<br>**UPDATE**: Force extend loan | `POST /api/admin/borrowings/override`<br>`GET /api/admin/borrowings/audit`<br>`POST /api/admin/borrowings/{id}/force-renew` | `POST`<br>`GET`<br>`POST` | Request: `LoanOverrideRequest { PatronId, BookId, DueDate, OverrideReason }` | `[Authorize(Roles = "Admin")]` |
| **Returns Journal (`Returns.tsx`)** | "Export Daily Returns Journal", "Process Bulk Returns", Status tabs (On-Time, Late, Damaged) | Return ledger inspection, receipt viewer | **READ**: Immutable return journal logs<br>**CREATE**: Batch return clearance | `GET /api/admin/returns/journal`<br>`POST /api/admin/returns/bulk` | `GET`<br>`POST` | Request: `BulkReturnRequest { Barcodes[] }`<br>Response: `ReturnJournalDto[]` | `[Authorize(Roles = "Admin")]` |
| **RFID & Barcodes (`Inventory.tsx`)** | "RFID Sync Batch", "Print Shelf Tags", "Ingest Physical Barcodes", Status filter pills | RFID sync simulation, batch ingestion modal | **CREATE**: Ingest physical RFID tag IDs<br>**READ**: Tagged vs Untagged physical stacks<br>**UPDATE**: Re-assign barcode to new physical volume | `POST /api/admin/inventory/rfid-sync`<br>`GET /api/admin/inventory/audit`<br>`PUT /api/admin/inventory/reassign-tag` | `POST`<br>`GET`<br>`PUT` | Request: `RfidSyncBatchRequest { TagIds[], AntennaId }`<br>Response: `InventoryAuditDto` | `[Authorize(Roles = "Admin")]` |
| **Circulation Analytics (`Analytics.tsx`)** | Range buttons (7D, 30D, 90D, 1Y, All), "Export Dossier (PDF/CSV)", "Review Stacks Allocation" | Responsive SVG line & bar visualizations | **READ**: Aggregated circulation velocity, peak desk hours, department borrowing trends | `GET /api/admin/analytics/trends` | `GET` | Request: `AnalyticsRangeQuery { Range = "7D" | "30D" | "1Y" }`<br>Response: `AnalyticsDossierDto` | `[Authorize(Roles = "Admin")]` |
| **Dewey Categories (`Categories.tsx`)** | "+ Add Category" button, "Export Schema", "Add Category Modal (`addCategoryModal`)", Category search input | Filterable category tree, modal form | **CREATE**: Add new Dewey classification range<br>**READ**: Complete Dewey concordance<br>**UPDATE**: Edit classification name/bay<br>**DELETE**: Remove empty classification | `POST /api/admin/categories`<br>`GET /api/admin/categories`<br>`PUT /api/admin/categories/{id}`<br>`DELETE /api/admin/categories/{id}` | `POST`<br>`GET`<br>`PUT`<br>`DELETE` | Request: `CreateCategoryRequest { DeweyRange, Name, ShelfBay }` | `[Authorize(Roles = "Admin")]` |
| **Official Reports (`Reports.tsx`)** | "Generate Official Report Dossier", Format buttons (PDF, CSV, XLSX), Template selector | Template dropdown, delinquency flags, download trigger | **CREATE**: Generate server-rendered PDF/Excel compliance reports | `POST /api/admin/reports/generate` | `POST` | Request: `GenerateReportRequest { TemplateId, DateRange, DelinquencyFlag }`<br>Response: `FileStreamResult (application/pdf)` | `[Authorize(Roles = "Admin")]` |
| **System Broadcasts (`Notifications.tsx`)** | "Configure Dispatch Templates", "Trigger Acquisition Order", "Broadcast Modal (`broadcast-modal`)" | Trigger acquisition modal, dispatch notice | **CREATE**: Send SMS/Email/In-App broadcasts<br>**READ**: Delivery confirmation telemetry | `POST /api/admin/notifications/broadcast`<br>`GET /api/admin/notifications/telemetry` | `POST`<br>`GET` | Request: `SystemBroadcastRequest { Title, Channel, TargetRoles[] }` | `[Authorize(Roles = "Admin")]` |
| **Roles & Permissions (`RolesPermissions.tsx`)** | "Create Custom Role", "Save Role Policy", "Reset to Defaults", "Export Security Policy" | Interactive matrix check toggling, role switcher | **CREATE**: Create custom staff role<br>**READ**: Permission privilege matrix<br>**UPDATE**: Save granular RBAC policies | `POST /api/admin/roles`<br>`GET /api/admin/roles/matrix`<br>`PUT /api/admin/roles/{id}/permissions` | `POST`<br>`GET`<br>`PUT` | Request: `UpdateRolePermissionsRequest { RoleId, Grants[] }` | `[Authorize(Roles = "Admin")]` |
| **Audit Logs (`AuditLogs.tsx`)** | "Verify Hash Chain", "Export Cryptographic Dossier", Severity filters (Info, Warning, Critical) | Search bar, severity filtering, cryptographic badge | **READ**: Tamper-evident SHA-256 hash-chained security event logs<br>**READ**: Verify cryptographic chain integrity | `GET /api/admin/audit-logs`<br>`GET /api/admin/audit-logs/verify-chain` | `GET`<br>`GET` | Request: `AuditLogQuery { Severity, Date }`<br>Response: `AuditLogVerificationDto { IsIntact, BrokenNodeId }` | `[Authorize(Roles = "Admin")]` |
| **System Governance Console (`Settings.tsx`)** | Circulation steppers (Tiers 1-3), Courtesy Grace dropdown, Reservation setup switches, Fine steppers & Live Simulator, Theme mode & Brand accent selector, Centralized System Archives multi-select table, POS/SuperAdmin timeout dropdowns, Campus IP & CIDR table with Add Subnet modal & bulk deletion, Categorized Save/Reset diff modals | Tab navigation (Circulation, Reservations, Fines, Appearance, Archives, Security), live fine calculator, theme persistence, batch archive recovery, CIDR subnet bitmasking | **READ**: Global system settings & institutional quotas<br>**UPDATE**: Circulation loan policies & tiers<br>**UPDATE**: Reservation hold setups<br>**UPDATE**: Fine calculation tariffs & caps<br>**UPDATE**: User account theme & layout preferences<br>**READ/UPDATE**: Centralized system archives across 9 modules<br>**READ/CREATE/DELETE**: Campus IP CIDR subnet whitelist<br>**READ**: Security telemetry node stats<br>**POST**: Save categorized settings diff<br>**POST**: Reset institutional defaults | `GET /api/admin/settings`<br>`PUT /api/admin/settings/circulation`<br>`PUT /api/admin/settings/reservations`<br>`PUT /api/admin/settings/fines`<br>`PUT /api/admin/settings/user-preferences`<br>`GET /api/admin/settings/archives`<br>`GET /api/admin/settings/cidr`<br>`POST /api/admin/settings/cidr`<br>`POST /api/admin/settings/cidr/bulk-delete`<br>`GET /api/admin/settings/telemetry`<br>`POST /api/admin/settings/save`<br>`POST /api/admin/settings/reset` | `GET`<br>`PUT`<br>`PUT`<br>`PUT`<br>`PUT`<br>`GET`<br>`GET`<br>`POST`<br>`POST`<br>`GET`<br>`POST`<br>`POST` | Request: `UpdateCirculationPolicyRequest`, `UpdateReservationSetupsRequest`, `UpdateFineTariffsRequest`, `UpdateUserPreferencesRequest`, `AddCidrSubnetRequest`, `BulkDeleteCidrRequest`, `ResetSettingsRequest`<br>Response: `SystemSettingsResponse`, `CidrSubnetDto[]`, `ArchiveModuleSummaryDto[]`, `SecurityTelemetryDto` | `[Authorize(Roles = "Admin")]` |
| **Profile & Sessions (`Profile.tsx`)** | "Rotate Password Now", "Download Access Keycard", "Terminate All Other Sessions", "Logout" | Security credential cards, session list | **UPDATE**: Rotate admin password<br>**DELETE**: Revoke active JWT refresh tokens across devices | `PUT /api/admin/profile/password`<br>`POST /api/admin/profile/terminate-sessions` | `PUT`<br>`POST` | Request: `ChangePasswordRequest { CurrentPassword, NewPassword }` | `[Authorize(Roles = "Admin")]` |

---

## 3. Exhaustive Interactive Modals Catalog

The frontend includes **16 specialized modal dialogs**:

| Modal ID | Host Page | Purpose | Trigger Button / Event | Form Fields & Inputs | Target Backend Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `authModal` | Landing (`Home.tsx`) | Patron / Staff Authentication & Sign Up | Header "Sign In" button | Email, Password, Full Name, ID | `POST /api/auth/login`, `POST /api/auth/register` |
| `bookDetailModal` | Landing (`Home.tsx`) | ISBN details, physical copies & synopsis | "View Details" on Book Cards | None (Display only) | `GET /api/books/{id}` |
| `reservationModal` | Landing (`Home.tsx`) | Reserve book hold from landing page | "Reserve This Copy" button | Branch selector, pickup date | `POST /api/reservations` |
| `cancelModal` | Customer (`ReservationsPage.tsx`) | Confirm cancellation of active reservation | "Cancel Hold" button | Confirmation acknowledgment | `DELETE /api/customer/reservations/{id}` |
| `pickupModal` | Customer (`ReservationsPage.tsx`) | Display digital pass and locker access PIN | "View Pickup Pass" button | None (Display barcode & PIN) | `GET /api/customer/reservations/{id}/pass` |
| `rejection-modal` | Cashier (`PendingReservations.tsx`) | Reject hold due to copy damage or policy limit | "Reject Hold" button | Rejection reason, notes | `PUT /api/cashier/reservations/{id}/reject` |
| `patronModal` | Cashier (`CustomerLookup.tsx`) | Full patron standing, loans & clearance inspect | Patron row click / "View" | None (Display history & clearance status) | `GET /api/cashier/customers/{id}` |
| `floorplanModal` | Cashier (`BookAvailability.tsx`) | Interactive floor plan and physical shelf locator | "View Floorplan" button | Bay selector, floor floorplan zoom | `GET /api/cashier/inventory/bay/{bayId}` |
| `renewalModal` | Admin (`Borrowings.tsx`) | Executive manual override of loan renewal | "Loan Override" button | New due date, authorization reason | `POST /api/admin/borrowings/{id}/force-renew` |
| `addCategoryModal` | Admin (`Categories.tsx`) | Add new Dewey Decimal taxonomy category | "+ Add Category" button | Dewey range, Name, Shelf Bay, Description | `POST /api/admin/categories` |
| `broadcast-modal` | Admin (`Notifications.tsx`) | System-wide emergency notification dispatch | "Broadcast Notice" button | Title, Message, Channels (SMS/Email/Push) | `POST /api/admin/notifications/broadcast` |

---

## 4. Master Data Tables & Column Architecture

The frontend renders **18 high-fidelity data tables**:

### 1. Customer Active Borrowings Ledger (`borrowingsTable`)
- **Columns**: `Book Title & Barcode`, `Borrow Date`, `Return Date`, `Duration`, `Fine Status`, `Audit / Receipt`, `Actions`
- **Backend API**: `GET /api/customer/borrowings`
- **Actions**: Request Renewal (+7 Days), View Receipt, Report Damage/Lost

### 2. Customer Reservations Queue
- **Columns**: `Hold Reference`, `Book / Catalog Title`, `Reserved / Completed`, `Fulfillment Desk`, `Status`, `Actions`
- **Backend API**: `GET /api/customer/reservations`
- **Actions**: View Locker Pass, Cancel Hold

### 3. Cashier Circulation Desk Intake Queue
- **Columns**: `Reservation Ref`, `Patron Details`, `Requested Volume`, `Stacks & Staging`, `Hold Schedule`, `Standing`, `Actions`
- **Backend API**: `GET /api/cashier/reservations/pending`
- **Actions**: Approve for Pickup, Assign Smart Locker, Reject Hold

### 4. Cashier Rapid Checkout Transaction Stream
- **Columns**: `Timestamp / Tx ID`, `Patron Details`, `Physical Book Asset`, `Asset Barcode`, `Due Date`, `Gate Status`, `Actions`
- **Backend API**: `GET /api/cashier/checkout/stream`
- **Actions**: Print Receipt, Remove from Cart, Override Due Date

### 5. Cashier Returns & Condition Journal
- **Columns**: `Barcode`, `Book Volume`, `Patron`, `Overdue Status`, `Fee Assessed`, `Settlement`, `Receipt Code`
- **Backend API**: `GET /api/cashier/returns/today`
- **Actions**: Print Return Slip, Re-inspect Condition

### 6. Cashier Patron Lookup & Standing Table
- **Columns**: `Patron Name & Contact`, `Patron ID / Program`, `Active Loans`, `Holds`, `Overdue Fines`, `Standing`, `Action`
- **Backend API**: `GET /api/cashier/customers?query=`
- **Actions**: Inspect Account, Issue Clearance Certificate, Waive Fines

### 7. Cashier Daily Register Transactions Journal
- **Columns**: `Transaction ID`, `Time / Shift`, `Type`, `Patron Details`, `Book / Volume`, `Amount`, `Payment / Status`, `Receipt`
- **Backend API**: `GET /api/cashier/transactions?date=`
- **Actions**: Print Receipt, Void Transaction (Supervisor Override), View Audit Memo

### 8. Admin User Management Directory
- **Columns**: `User ID`, `Patron / User Details`, `Institutional Role`, `Account Status`, `Registration & Login`, `Active Circulation`, `Actions`
- **Backend API**: `GET /api/admin/users?page=&role=`
- **Actions**: Edit Profile, Reset Password, Toggle Suspension, Assign Role

### 9. Admin Books Catalog & MARC 21 Concordance
- **Columns**: `Title & Edition`, `Dewey / ISBN`, `Academic Area`, `Copies Breakdown (Total / Available / Bound)`, `Catalog Status`, `Actions`
- **Backend API**: `GET /api/admin/books?page=&category=`
- **Actions**: Edit Metadata, Batch Barcode Ingest, Archive / De-accession

### 10. Admin Circulation Master Audit Ledger
- **Columns**: `Loan ID`, `Patron Details`, `Book Title & Catalog Barcode`, `Checkout`, `Due Date`, `Days Remaining`, `Renewals`, `Status`, `Actions`
- **Backend API**: `GET /api/admin/borrowings/audit`
- **Actions**: Executive Force Renew, Mark Lost, Override Fine

### 11. Admin Master Returns Journal
- **Columns**: `Return ID`, `Patron Details`, `Item & Barcode`, `Timeline & Overdue`, `Assessed Fine`, `Condition`, `Clearance Status`, `Station / Desk`, `Actions`
- **Backend API**: `GET /api/admin/returns/journal`
- **Actions**: Inspect Return Slip, Audit Station Cashier

### 12. Admin Physical Inventory & RFID Stacks Table
- **Columns**: `Barcode & RFID`, `Title & Edition`, `Dewey Call No`, `Stacks Coordinate`, `Condition`, `Current Custody / Status`, `Acquired`, `Actions`
- **Backend API**: `GET /api/admin/inventory/audit`
- **Actions**: Scan RFID Batch, Print Shelf Tag, Relocate Stacks Coordinate

### 13. Admin Dewey Decimal Categories Concordance
- **Columns**: `Call Range`, `Category / Field Name`, `Sub-Fields`, `Titles`, `Copies`, `Circulation`, `Status`, `Actions`
- **Backend API**: `GET /api/admin/categories`
- **Actions**: Edit Category, Delete Empty Classification, Export Schema

### 14. Admin Official Compliance Dossier Archive
- **Columns**: `Dossier Reference & Title`, `Execution Timestamp`, `Certified Generator`, `Payload Size`, `Verification Status`, `Encrypted Download`
- **Backend API**: `GET /api/admin/reports/archive`
- **Actions**: Download Encrypted PDF, Verify SHA-256 Digest

### 15. Admin Cryptographic Audit Log Trail
- **Columns**: `Timestamp`, `Actor & Identity`, `Role`, `Module / Scope`, `Event Action`, `Record Ref`, `Delta / Modification`, `Node & IP`, `Integrity Seal`, `Audit`
- **Backend API**: `GET /api/admin/audit-logs`
- **Actions**: Verify Hash Chain, Export Cryptographic Dossier, Download Audit Token (.jwt)

### 16. Admin Centralized System Archives Consolidation Table
- **Columns**: `Checkbox`, `Module Scope`, `Record ID`, `Entity Title / Name`, `Archived Date`, `Archived By`, `Retention Status`, `Actions`
- **Backend API**: `GET /api/admin/settings/archives`, `POST /api/admin/settings/archives/bulk-action`
- **Actions**: Restore Selected, Purge Permanently (Audit-sealed), Filter by Module (Users, Books, Categories, Inventory, Reservations, Borrowings, Returns, Reports, Audit Logs)

### 17. Admin Campus IP & CIDR Whitelist Table
- **Columns**: `Checkbox`, `CIDR Subnet Range`, `Network Classification`, `Access Level`, `Status`, `Added Date`, `Actions`
- **Backend API**: `GET /api/admin/settings/cidr`, `POST /api/admin/settings/cidr`, `POST /api/admin/settings/cidr/bulk-delete`
- **Actions**: Add Subnet Modal, Select All / Multi-Select, Floating Bulk Delete Bar, Real-Time CIDR Bitmask Evaluation

---

## 5. Export & Dossier Generation Matrix

The system features **13 distinct export engines**:

| Export Trigger | Output Format | Initiating Component | Backend Generation Pipeline |
| :--- | :--- | :--- | :--- |
| **Loan Passbook Export** | PDF / Printable HTML | Customer Borrowings | Server-rendered PDF of active/historical loans with barcode pass |
| **Patron Hold Slip** | PDF Slip | Customer Reservations | 80mm thermal receipt format with pickup barcode |
| **BibTeX Citations** | `.bib` / Plaintext | Customer Favorites | RFC BibTeX citation records for reference managers (Zotero/Mendeley) |
| **Intake Staging Sheet** | CSV | Cashier Pending Reservations | CSV roster of pending holds and assigned fulfillment shelves |
| **Register Audit Ledger** | CSV | Cashier Transactions | Shift transaction records, cash breakdown, cashier employee ID |
| **Library Clearance Certificate** | Digitally Signed PDF | Cashier Customer Lookup | Cryptographically signed Institutional Library Clearance |
| **User Directory Export** | CSV / XLSX | Admin User Management | Full student/faculty directory with circulation standing |
| **Catalog MARC 21 Export** | MARC 21 (`.mrc`) / CSV | Admin Books Manager | Library of Congress standard MARC 21 bibliographic interchange records |
| **Circulation Audit Ledger** | CSV | Admin Borrowings | Full historical loan ledger with checkout/return timestamps & fines |
| **Daily Returns Journal** | CSV / PDF | Admin Returns | Certified daily returns journal with condition notes |
| **Circulation Analytics Dossier** | PDF / CSV | Admin Analytics | High-level circulation metrics, velocity graphs, and faculty cohort trends |
| **Dewey Schema Concordance** | JSON / CSV | Admin Categories | Full Dewey Decimal classification tree with book copy distributions |
| **Cryptographic Audit Dossier** | `.jwt` / JSON / PDF | Admin Audit Logs | Tamper-evident cryptographic ledger export with SHA-256 hash proofs |

---

## 6. Core Database Entity Schema Required for Backend

```csharp
// [Layer: Backend/Features/Data/Models]
public class User {
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } // Customer, Cashier, Admin
    public string LibraryCardNumber { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Book {
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Isbn { get; set; } = string.Empty;
    public string DeweyCode { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public int PublishedYear { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public string BayLocation { get; set; } = string.Empty;
    public bool IsArchived { get; set; } = false;
}

public class BorrowTransaction {
    public Guid Id { get; set; }
    public Guid PatronId { get; set; }
    public Guid BookId { get; set; }
    public Guid? CashierId { get; set; }
    public DateTime BorrowDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public TransactionStatus Status { get; set; } // Active, Returned, Overdue, Lost
    public int RenewalCount { get; set; } = 0;
    public string? ConditionNotes { get; set; }
}

public class Reservation {
    public Guid Id { get; set; }
    public Guid PatronId { get; set; }
    public Guid BookId { get; set; }
    public DateTime ReservationDate { get; set; } = DateTime.UtcNow;
    public DateTime ExpiryDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, ReadyForPickup, Fulfilled, Cancelled
    public string? FulfillmentNotes { get; set; }
}

public class FineTransaction {
    public Guid Id { get; set; }
    public Guid PatronId { get; set; }
    public Guid BorrowTransactionId { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceRemaining { get; set; }
    public decimal WaivedAmount { get; set; } = 0;
    public string Status { get; set; } = "Unpaid"; // Unpaid, Settled, Waived
    public string Reason { get; set; } = string.Empty;
}

public class AuditLog {
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetEntity { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info"; // Info, Warning, Critical
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string PreviousHash { get; set; } = string.Empty;
    public string CurrentHash { get; set; } = string.Empty;
}

public class SystemSetting {
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }
}

public class CidrSubnet {
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CidrRange { get; set; } = string.Empty;
    public string NetworkClassification { get; set; } = "Faculty & Staff LAN";
    public string AccessLevel { get; set; } = "Full Administrative & POS Access";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

---

## 7. Verification and Next Steps

1. This technical specification maps **every single visual affordance** in the converted TypeScript React frontend to a concrete .NET 10 Web API endpoint.
2. When implementing the backend, create the corresponding `Controller`, `Service`, `Repository`, and `DTO` following the strict names and patterns defined in this document.
3. Every endpoint stub in `Frontend/src/Endpoints/` will seamlessly mirror these REST API routes.
