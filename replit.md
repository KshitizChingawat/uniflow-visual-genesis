# UniLink - Cross-Platform Device Connectivity

## Overview

UniLink is a revolutionary cross-platform connectivity application that seamlessly syncs files, clipboard, notifications, and device control across Windows, macOS, Linux, Android, and iOS. The application consists of a React-based frontend, an Express.js backend, and a PostgreSQL database with Supabase integration for real-time features and authentication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Supabase Auth for user management
- **Real-time**: Supabase Realtime for live sync features
- **File Storage**: Supabase Storage for file transfers

### Database Architecture
- **Primary Database**: PostgreSQL via Neon serverless
- **Real-time Database**: Supabase PostgreSQL
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Components

### Core Features
1. **Device Management**: Auto-discovery and registration of devices across platforms
2. **File Transfer**: Cloud-based and P2P file sharing with progress tracking
3. **Clipboard Sync**: Real-time clipboard synchronization with content analysis
4. **Smart Sync**: AI-powered suggestions and automation
5. **Secure Vault**: Encrypted storage for sensitive content
6. **Bluetooth Discovery**: Device pairing and proximity detection
7. **Screen Sharing**: Remote desktop and mobile screen mirroring

### Frontend Components
- **Dashboard**: Main application interface with device overview
- **Device Management**: Device registration, status monitoring, and control
- **File Transfer**: Drag-and-drop file sharing with progress indicators
- **Clipboard History**: Searchable clipboard history with smart categorization
- **Analytics**: Usage tracking and performance metrics
- **Security Settings**: Encryption controls and privacy settings

### Backend Services
- **Authentication**: User registration, login, and session management
- **Device API**: Device registration and status endpoints
- **File Transfer**: Upload/download handling with encryption
- **Real-time Sync**: WebSocket connections for live updates
- **AI Assistant**: Content analysis and smart suggestions
- **Analytics**: Usage tracking and performance monitoring

## Data Flow

### User Authentication Flow
1. User registers/logs in via Supabase Auth
2. Frontend receives JWT token and user session
3. Device automatically registers with unique identifier
4. Real-time presence tracking begins

### File Transfer Flow
1. User selects files for transfer
2. Files uploaded to Supabase Storage with encryption
3. Transfer record created in database
4. Target device receives real-time notification
5. Download initiated with progress tracking
6. Transfer completion logged for analytics

### Clipboard Sync Flow
1. Clipboard content detected on source device
2. Content encrypted and stored in database
3. AI analysis performed for smart suggestions
4. Real-time sync to all connected devices
5. Content available in clipboard history

## External Dependencies

### Primary Services
- **Neon**: Primary PostgreSQL database with serverless scaling
- **Express.js**: Backend API with JWT authentication
- **OpenAI**: AI-powered content analysis and suggestions (optional)

### Key Libraries
- **Frontend**: React, TypeScript, TanStack Query, Radix UI, Tailwind CSS
- **Backend**: Express.js, Drizzle ORM, WebSocket support
- **Utilities**: Zod for validation, date-fns for date handling

### Development Tools
- **Build**: Vite for frontend, esbuild for backend
- **Database**: Drizzle Kit for schema management
- **Deployment**: Replit with auto-scaling configuration

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reload via Vite
- **Production**: Auto-scaling deployment on Replit infrastructure
- **Database**: Neon serverless PostgreSQL with automatic scaling
- **Storage**: Supabase Storage with CDN distribution

### Build Process
1. Frontend built with Vite to static assets
2. Backend bundled with esbuild for Node.js runtime
3. Database migrations applied via Drizzle Kit
4. Assets deployed to Replit with auto-scaling enabled

### Security Measures
- End-to-end encryption for file transfers
- JWT-based authentication with refresh tokens
- CORS protection and rate limiting
- Secure WebSocket connections
- Environment variable protection

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```