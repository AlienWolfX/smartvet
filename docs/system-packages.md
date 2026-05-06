## Backend Packages (Composer)

### Required packages

- `php`: `^8.2` — PHP runtime requirement
- `laravel/framework`: `^12.0` — Laravel application framework
- `laravel/fortify`: `^1.30` — Authentication backend scaffolding
- `inertiajs/inertia-laravel`: `^2.0` — Bridge between Laravel and Inertia.js
- `laravel/tinker`: `^2.10.1` — Interactive REPL for debugging and testing
- `laravel/wayfinder`: `^0.1.9` — Enhanced route listing and debugging utility
- `phpoffice/phpspreadsheet`: `^5.2` — Spreadsheet export/import support

### Development packages

- `beyondcode/laravel-er-diagram-generator`: `^5.0` — ER diagram generation for database schema
- `fakerphp/faker`: `^1.23` — Fake test data generation
- `laravel/pail`: `^1.2.2` — CLI utility and test helper
- `laravel/pint`: `^1.24` — PHP code formatting
- `laravel/sail`: `^1.41` — Docker-based local development environment
- `mockery/mockery`: `^1.6` — Mocking library for tests
- `nunomaduro/collision`: `^8.6` — Improved console error handling
- `pestphp/pest`: `^3.8` — Elegant PHP testing framework
- `pestphp/pest-plugin-laravel`: `^3.2` — Laravel support for Pest

## Frontend Packages (npm)

### Core frontend stack

- `react`: `^19.2.0`
- `react-dom`: `^19.2.0`
- `typescript`: `^5.7.2`
- `vite`: `^7.0.4`
- `@vitejs/plugin-react`: `^5.0.0`
- `laravel-vite-plugin`: `^2.0`
- `@tailwindcss/vite`: `^4.1.11`
- `tailwindcss`: `^4.0.0`
- `@inertiajs/react`: `^2.1.4`

### UI and interaction libraries

- `@headlessui/react`: `^2.2.0` — Accessible UI primitives
- `lucide-react`: `^0.475.0` — Icon components
- `@radix-ui/react-*`: various UI primitives for dialogs, dropdowns, tooltips, labels, and navigation
- `class-variance-authority`: `^0.7.1` — Tailwind-friendly class variance management
- `clsx`: `^2.1.1` — Conditional class name utility
- `tailwind-merge`: `^3.0.1` — Merge Tailwind CSS class names safely
- `tw-animate-css`: `^1.4.0` — Tailwind-compatible animation utilities

### QR codes and browser utilities

- `qrcode`: `^1.5.4` — QR code generation
- `html5-qrcode`: `^2.3.8` — Browser QR scanning
- `html2canvas`: `^1.4.1` — Capture DOM elements as images
- `input-otp`: `^1.4.2` — OTP input controls

### Build and developer tooling

- `@types/react`: `^19.2.0`
- `@types/react-dom`: `^19.2.0`
- `@types/node`: `^22.13.5`
- `eslint`: `^9.17.0`
- `@eslint/js`: `^9.19.0`
- `eslint-config-prettier`: `^10.0.1`
- `eslint-plugin-react`: `^7.37.3`
- `eslint-plugin-react-hooks`: `^7.0.0`
- `prettier`: `^3.4.2`
- `prettier-plugin-organize-imports`: `^4.1.0`
- `prettier-plugin-tailwindcss`: `^0.6.11`
- `typescript-eslint`: `^8.23.0`
- `concurrently`: `^9.0.1` — Run multiple dev commands in parallel
- `globals`: `^15.14.0`

### Optional native build/runtime packages

- `@rollup/rollup-linux-x64-gnu` / `@rollup/rollup-win32-x64-msvc`
- `@tailwindcss/oxide-linux-x64-gnu` / `@tailwindcss/oxide-win32-x64-msvc`
- `lightningcss-linux-x64-gnu` / `lightningcss-win32-x64-msvc`
