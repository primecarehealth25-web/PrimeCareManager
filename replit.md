# Prime Care Clinic Management System

## Overview

Prime Care is a comprehensive clinic management system designed to streamline patient registration, billing, medicine inventory, treatment management, and financial reporting for healthcare facilities. The application provides an efficient workflow for managing patient visits, tracking medical inventory, processing payments, and generating business insights through reports.

The system emphasizes clinical efficiency with minimal clicks to complete tasks, clear data visualization for medical information, and a professional medical-grade aesthetic following Material Design 3 principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management, caching, and data synchronization

**UI Component Library**
- **shadcn/ui** components built on Radix UI primitives following the "New York" style variant
- Material Design 3 principles for medical application clarity and established patterns
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Inter** font family from Google Fonts for professional typography
- Custom color system with HSL-based theming supporting light/dark modes

**Form Management**
- **React Hook Form** for performant form state management
- **Zod** for runtime schema validation
- **@hookform/resolvers** for seamless integration between validation and form handling

**Data Visualization**
- **Recharts** library for rendering charts and graphs in the Reports module
- Used for monthly earnings trends, expense tracking, and patient statistics

**Design System Decisions**
- Consistent spacing using Tailwind's scale (4, 6, 8, 12, 16)
- 2-column grid layouts for forms, 3-column for dashboard statistics
- Card-based UI pattern for grouping related information
- Fixed top navigation with centered/right-aligned menu items
- Toast notifications for user feedback on actions

### Backend Architecture

**Server Framework**
- **Express.js** running on Node.js for REST API endpoints
- HTTP server created using Node's native `http.createServer()`
- Custom middleware for JSON body parsing with raw body preservation (for webhook verification)
- Request logging middleware tracking response times and status codes

**API Design Pattern**
- RESTful endpoints organized by resource (patients, visits, medicines, treatments, bills, expenses)
- Standard CRUD operations with appropriate HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- Centralized error handling with appropriate HTTP status codes

**Development Environment**
- Vite middleware mode integration for HMR during development
- Replit-specific plugins for error overlay, cartographer, and dev banner
- Separate development and production build processes
- ESBuild for server-side bundling with selective dependency bundling to improve cold start times

### Data Storage Architecture

**Database**
- **PostgreSQL** as the primary relational database
- **Neon Database** serverless PostgreSQL with WebSocket support for connection pooling
- **Drizzle ORM** for type-safe database queries and schema management
- Schema-first approach with TypeScript types generated from database schema

**Database Schema Design**

Key tables and relationships:
- **patients**: Core patient records with basic contact information
- **visits**: One-to-many relationship with patients, tracking each clinic visit with complaints, diagnosis, treatment, and prescriptions
- **medicines**: Master inventory table with price, quantity, and cumulative earnings tracking
- **treatments**: Master table for treatment procedures with pricing
- **bills**: Patient billing records with date and total amount
- **billTreatmentItems** and **billMedicineItems**: Many-to-many join tables linking bills to treatments and medicines with quantities and prices
- **expenses**: Financial expense tracking with categories, amounts, and dates

**Data Access Layer**
- Storage abstraction (`IStorage` interface) for separating business logic from database implementation
- Drizzle queries using the query builder pattern for type-safety
- Relations defined in schema for efficient joins and data fetching
- Automatic timestamp management with `defaultNow()` for created dates

**Schema Validation**
- **drizzle-zod** integration for generating Zod schemas from Drizzle tables
- Runtime validation of incoming data against schema definitions
- Separate insert and select schemas for handling auto-generated fields

### Application Routing & Pages

**Client-Side Routes**
- `/` - Dashboard with statistics and recent patient list
- `/registration` - Patient registration (new patients and follow-up visits)
- `/billing` - Medicine/treatment billing interface
- `/medicine-master` - Medicine inventory management (CRUD)
- `/treatment-master` - Treatment procedures management (CRUD)
- `/reports` - Financial reporting and analytics
- `/expenses` - Expense tracking and management

**Navigation Pattern**
- Fixed top navbar with icon-based navigation
- Active route indication with visual highlighting
- Responsive design considerations for mobile/tablet devices

### State Management Strategy

**Server State**
- TanStack Query for all API data fetching and caching
- Automatic background refetching disabled (`refetchOnWindowFocus: false`)
- Infinite stale time for mostly static data (medicines, treatments)
- Query invalidation on mutations to keep UI synchronized
- Optimistic updates not implemented (server-first approach)

**Client State**
- React's built-in useState/useReducer for local component state
- Form state managed by React Hook Form
- No global client state management (Redux/Zustand) - relies on React Query cache
- Theme preference stored in localStorage

**Data Flow**
1. User action triggers form submission
2. React Hook Form validates with Zod schema
3. API request made via `apiRequest` utility
4. Server processes and updates database via Drizzle
5. Query cache invalidated
6. UI automatically refetches and updates
7. Toast notification confirms action

## External Dependencies

### Third-Party Services

**Database Provider**
- **Neon Database** - Serverless PostgreSQL hosting with WebSocket connection pooling
- Configuration via `DATABASE_URL` environment variable
- Connection handling through `@neondatabase/serverless` client

### Key NPM Packages

**UI & Styling**
- `@radix-ui/*` - Unstyled, accessible component primitives (40+ components)
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Type-safe variant management for components
- `clsx` & `tailwind-merge` - Conditional class name utilities

**Data Management**
- `drizzle-orm` - Type-safe ORM for database operations
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form state and validation
- `zod` - Schema validation library
- `date-fns` - Date manipulation and formatting

**Server**
- `express` - Web application framework
- `ws` - WebSocket implementation for Neon Database connections
- `connect-pg-simple` - PostgreSQL session store (configured but session management not fully implemented)

**Development Tools**
- `vite` - Frontend build tool and dev server
- `tsx` - TypeScript execution for Node.js
- `esbuild` - Server bundling for production
- `drizzle-kit` - Database migration and schema management CLI

**Data Visualization**
- `recharts` - Chart library for React (used in Reports module)

**Icons**
- `lucide-react` - Icon library used throughout the application

### Build & Deployment

**Build Process**
1. Client: Vite builds React application to `dist/public`
2. Server: ESBuild bundles Express server to `dist/index.cjs`
3. Selective dependency bundling for faster cold starts (allowlist in build.ts)
4. TypeScript compilation checking without emit

**Environment Requirements**
- Node.js with ES Modules support
- `DATABASE_URL` environment variable must be set
- Production mode set via `NODE_ENV=production`

**Asset Management**
- Static files served from `dist/public` in production
- Vite dev server handles assets during development
- Favicon and fonts loaded from CDN (Google Fonts for Inter)
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)