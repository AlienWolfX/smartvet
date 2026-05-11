# SmartVet

QR Code-Based Portable Pet Health E-Card System for Veterinary Record Management

## Folder Structure

- `.github/` - GitHub Actions workflows for linting and testing
- `app/` - Laravel application logic
  - `Actions/` - Fortify authentication actions
  - `Http/Controllers/` - controllers for web requests and API behavior
  - `Http/Middleware/` - middleware for roles, email verification, setup checks, and inactivity timeout
  - `Http/Requests/` - form request validation classes
  - `Http/Responses/` - custom response classes for authentication and actions
  - `Http/Traits/` - shared controller/tenant traits
  - `Mail/` - mail classes for verification and testing
  - `Models/` - Eloquent models for pets, owners, consultations, inventory, payments, and users
  - `Policies/` - authorization policies
  - `Providers/` - application and Fortify service providers
  - `Services/` - business services like inventory usage and Turnstile verification
- `bootstrap/` - Laravel bootstrap files and cached framework bootstrap
- `config/` - application configuration files, including auth, database, mail, session, and Fortify
- `database/` - database layer
  - `factories/` - data factories
  - `migrations/` - migration files defining schema changes
  - `seeders/` - seeders to bootstrap initial data
- `docs/` - documentation and project diagrams, including ERD
- `public/` - publicly accessible assets and application entry point
- `resources/` - frontend resources
  - `css/` - stylesheets
  - `js/` - frontend scripts, Inertia pages, and components
- `routes/` - Laravel route definitions for web and console
- `tests/` - Pest tests for application features and units
- `storage/` - runtime storage for logs, cache, and compiled views
- `vendor/` - Composer dependencies

## Installation

```bash
composer install
npm install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
npm run dev
```

## Possible Q & A

### 1. What problem does SmartVet solve?
SmartVet solves the need for portable, digital veterinary records by giving pets a QR code-based health e-card. It reduces paper records, speeds up clinic intake, and improves access to vaccination, consultation, and medication history.

### 2. What is the core architecture of the system?
The system is built on Laravel for backend logic and database management, using Eloquent models for domain entities. The frontend uses Inertia.js with React components and Vite for asset bundling, allowing a modern single-page experience while keeping Laravel routing and server-side rendering.

### 3. Why use QR codes in this project?
QR codes provide a fast, offline-friendly way to identify pets and retrieve their health profile. Clinic staff or pet owners can scan a pet's QR code to instantly access records without needing manual search or physical documents.

### 4. What are the main technologies used?
- Laravel PHP framework
- Laravel Fortify for authentication
- Inertia.js for frontend SPA behavior
- React / TypeScript for UI components
- Vite for frontend bundling
- MySQL / MariaDB or SQLite via Laravel database configuration
- Pest for PHP testing

### 5. How does the project handle security?
Authentication and authorization are handled by Laravel Fortify and middleware. Email verification, role checks, setup completion enforcement, inactivity timeout, and CSRF protection are supported by Laravel. Sensitive backend logic is separated into controllers, services, and request validation classes.

### 6. How are user roles organized?
The app separates users by roles such as admin, clinic, and owner. Middleware checks user role permissions before allowing access to admin features, clinic settings, or owner-specific actions.

### 7. What are the main modules in the codebase?
- Pet management: registration, species, QR tokens
- Consultation management: create, update, and record consultations
- Vaccination tracking: record vaccinations, categories, and associated payments
- Inventory and medication: categories, stock, usage, and sales
- Billing: pet payments, payment items, statuses, and owner billing
- Notifications: dismissed notifications and in-app alerts

### 8. What are the biggest challenges and how were they addressed?
Managing multiple related entities like pets, consultations, vaccinations, and payments required a clean domain model. The project uses Eloquent relationships and dedicated controllers/services to keep logic modular and maintainable.

### 9. How is data migration and initialization handled?
Schema changes are implemented through Laravel migrations. Initial data and administrative setup are seeded using database seeders. This provides a repeatable setup process for development and deployment.

### 10. What future improvements are planned?
Possible improvements include a dedicated mobile app or PWA, stronger offline support, improved clinic reporting dashboards, and enhanced notification/email workflows. Additional audit logging and analytics could also be added over time.

### 11. How is testing performed in this project?
Testing is handled with Pest for PHP feature and unit tests. The repo includes test configuration and workflows for automated validation of controllers, models, and application flows.

### 12. How does SmartVet support maintainability?
The codebase uses Laravel conventions, clear folder separation, and Eloquent models to keep logic organized. Middleware, service classes, request validation, and route grouping help isolate concerns and make future changes safer.

### 13. What database relationships are important here?
Important relationships include users to owners, owners to pets, pets to consultations, consultations to payments, and vaccinations to pet payment records. These relationships ensure data remains connected across health history, billing, and inventory.

### 14. How does the app manage inventory and medication tracking?
The inventory module stores categories, medication items, and usage logs separately from consultation and payment data. This allows clinics to track stock levels, supply use, and cost association without mixing inventory and patient records.

### 15. What deployment environment is expected?
SmartVet is built for PHP hosting that supports Laravel, such as Apache or Nginx with PHP-FPM. It also needs Node.js for asset building with Vite, and a database like MySQL, MariaDB, or SQLite for development.

### 16. How does the UI support different user types?
The frontend is designed with role-based navigation and screens for clinics, admins, and owners. Owners can access pet records and payments, while clinics manage consultations, inventory, and settings through specialized dashboards.

### 17. Why was Inertia chosen instead of a separate API?
Inertia allows the project to keep Laravel server-side routing while still delivering interactive React pages. It reduces the complexity of maintaining separate frontend and backend projects and keeps authentication, session state, and validation consistent.

### 18. How are API requests and backend actions secured?
The app uses Laravel CSRF protection, authenticated routes, and request validation to secure form submissions. Middleware ensures only authorized users can access sensitive actions like updating inventory, managing payments, or changing settings.

### 19. How does the project handle file uploads or attachments?
File handling is managed through Laravel controllers and storage configuration, typically using the `storage` folder. Uploaded files such as consultation attachments are recorded in models and stored safely with Laravel filesystem support.

### 20. What data privacy considerations were included?
The system protects pet and owner data through user roles and authenticated access. In a production release, it can be extended with encryption, stricter audit logging, and GDPR-style policies for data retention and access control.

### 21. What performance improvements are possible?
Performance can be improved by caching database queries, bundling assets efficiently with Vite, and optimizing Eloquent relationships. Query optimization and pagination for large lists of pets, consultations, and payments are also important for scaling.

### 22. How does SmartVet handle errors and validation?
Validation is centralized in Laravel Request classes to ensure data integrity before controller logic runs. Controllers and services can return clear error responses and user-friendly feedback through Inertia flash messages.

### 23. Can this system be extended with notifications or reminders?
Yes. The architecture supports adding scheduled notifications and reminders for vaccinations or appointments. Laravel jobs, notifications, and scheduled tasks can be added to automate reminders and follow-up messages.
