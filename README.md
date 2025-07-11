CityMall_Assignment_Disaster_Response
A comprehensive real-time disaster management system built with the MERN stack, featuring AI-powered location extraction, social media monitoring, and geospatial resource mapping to coordinate emergency relief efforts effectively.

Platform Overview License Node.js React


📋 Table of Contents
Features
Tech Stack
Architecture
Installation
Configuration
API Documentation
Database Schema
Usage
Real-time Features
External Integrations
Deployment
Contributing
License
✨ Features
🎯 Core Functionality
Disaster Management: Complete CRUD operations for disaster records with audit trails
Real-time Monitoring: Live updates via WebSockets for instant coordination
AI-Powered Location Extraction: Google Gemini API for intelligent location parsing
Geospatial Mapping: Advanced PostgreSQL/PostGIS queries for resource location
Social Media Monitoring: Real-time feed aggregation and priority filtering
Official Updates: Government and relief organization update aggregation
🔧 Advanced Features
Smart Caching: Supabase-based caching system with TTL management
Rate Limiting: Intelligent API throttling and protection
Image Verification: AI-powered disaster image authenticity checking
Priority Alerts: Keyword-based urgency classification system
Responsive UI: Mobile-first design with Tailwind CSS
🛠 Tech Stack
Backend
Runtime: Node.js 18+
Framework: Express.js
Database: Supabase (PostgreSQL with PostGIS)
Real-time: Socket.IO
Authentication: JWT with role-based access
Caching: Redis-like caching via Supabase
Frontend
Framework: React 18+
Styling: Tailwind CSS
State Management: React Hooks
Animations: Framer Motion
Notifications: React Hot Toast
Icons: Lucide React
External Services
AI: Google Gemini API
Geocoding: Google Maps/Mapbox/OpenStreetMap
Social Media: Mock Twitter API/Bluesky
Web Scraping: Cheerio for official updates
🏗 Architecture
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React)       │◄──►│   (Express)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST APIs     │    │ • Gemini API    │
│ • Social Media  │    │ • WebSockets    │    │ • Maps API      │
│ • Browse Page   │    │ • Rate Limiting │    │ • Social APIs   │
│ • Map View      │    │ • Caching       │    │ • Gov Websites  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (Supabase)    │
                    │                 │
                    │ • PostgreSQL    │
                    │ • PostGIS       │
                    │ • Real-time     │
                    │ • Row Level     │
                    │   Security      │
                    └─────────────────┘
🚀 Installation
Prerequisites
Node.js 18+
npm or yarn
Supabase account
Google Cloud Platform account (for Gemini API)
Clone Repository
git clone https://github.com/yourusername/disaster-response-platform.git
cd disaster-response-platform
Backend Setup
cd backend
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see Configuration section)
# Start development server
npm run dev
Frontend Setup
cd frontend
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm start
⚙️ Configuration
Backend Environment Variables (.env)
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Services
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_maps_api_key

# Social Media APIs (Optional)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
BLUESKY_ACCESS_TOKEN=your_bluesky_token

# Cache Configuration
CACHE_TTL=3600000
DEFAULT_USER_ID=netrunnerX

# Rate Limiting
API_RATE_LIMIT=200
MOCK_RATE_LIMIT=1000
Frontend Environment Variables (.env)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_DEFAULT_USER_ID=netrunnerX
REACT_APP_DEBUG_MODE=true
REACT_APP_WS_URL=http://localhost:5000
Database Setup
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create tables (see Database Schema section)
-- Set up Row Level Security
-- Create indexes for performance
📚 API Documentation
Disaster Management
GET    /api/disasters              # List all disasters
POST   /api/disasters              # Create new disaster
GET    /api/disasters/:id          # Get disaster details
PUT    /api/disasters/:id          # Update disaster
DELETE /api/disasters/:id          # Delete disaster
Social Media Monitoring
GET    /api/disasters/:id/social-media    # Get social media reports
GET    /api/mock-social-media             # Get mock social data
Official Updates
GET    /api/disasters/:id/official-updates      # Get official updates
GET    /api/official-updates/sources            # Get available sources
GET    /api/official-updates/category/:category # Get category updates
GET    /api/official-updates/search             # Search updates
Geospatial Resources
GET    /api/disasters/:id/resources       # Get nearby resources
POST   /api/disasters/:id/resources       # Add new resource
AI Services
POST   /api/geocode                       # Extract and geocode location
POST   /api/disasters/:id/verify-image    # Verify disaster image
🗄 Database Schema
Core Tables
-- Disasters table with geospatial support
CREATE TABLE disasters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326),
    description TEXT,
    tags TEXT[],
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    audit_trail JSONB DEFAULT '[]'::jsonb
);

-- Reports table for user submissions
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Resources table for emergency resources
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326),
    type TEXT NOT NULL,
    description TEXT,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Cache table for external API responses
CREATE TABLE cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
Indexes for Performance
-- Geospatial indexes
CREATE INDEX disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX resources_location_idx ON resources USING GIST (location);

-- Query optimization indexes
CREATE INDEX disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX disasters_owner_idx ON disasters (owner_id);
CREATE INDEX cache_expires_idx ON cache (expires_at);
💻 Usage
Starting the Application
Backend: npm run dev (runs on port 5000)
Frontend: npm start (runs on port 3000)
Access: Open http://localhost:3000
Key Features Walkthrough
1. Dashboard Overview
Real-time disaster statistics
Recent activity feed
Quick action buttons
System status indicators
2. Social Media Monitoring
Navigate to /social-media
Filter by priority (urgent, high, medium, low)
Search by keywords or hashtags
Real-time feed updates
3. Official Updates
Navigate to /browse
Filter by source (FEMA, Red Cross, NYC Emergency, etc.)
Category-based filtering
Search across all updates
4. Disaster Management
Create new disaster reports
Real-time location extraction with AI
Geospatial resource mapping
Audit trail tracking
⚡ Real-time Features
WebSocket Events
// Client-side event listeners
socket.on('disaster_created', (data) => {
    // Handle new disaster notification
});

socket.on('disaster_updated', (data) => {
    // Update disaster in real-time
});

socket.on('social_media_updated', (data) => {
    // Refresh social media feed
});

socket.on('resources_updated', (data) => {
    // Update resource map
});
Real-time Capabilities
Live Disaster Updates: Instant notifications for new/updated disasters
Social Media Monitoring: Real-time social feed updates
Resource Tracking: Live resource availability updates
System Alerts: Priority notifications for urgent situations
🔌 External Integrations
Google Gemini AI
Location Extraction: Intelligent parsing of location names from text
Image Verification: Authenticity checking for disaster images
Content Analysis: Priority classification of social media posts
Mapping Services
Google Maps: High-accuracy geocoding and reverse geocoding
Mapbox: Alternative geocoding with custom styling
OpenStreetMap: Free alternative using Nominatim
Social Media APIs
Mock Twitter API: Sample data for development and testing
Twitter API v2: Real-time tweet monitoring (if available)
Bluesky API: Alternative social media monitoring
Official Sources
FEMA: Federal emergency management updates
Red Cross: Humanitarian aid information
Local Emergency Services: City and state emergency updates
Weather Services: National weather alerts
🌐 Deployment
Backend Deployment (Render)
# Build command
npm install && npm run build

# Start command
npm start

# Environment variables
# Set all backend environment variables in Render dashboard
Frontend Deployment (Vercel)
# Build command
npm run build

# Output directory
build

# Environment variables
# Set all frontend environment variables in Vercel dashboard
Database Deployment (Supabase)
Create new Supabase project
Run database migrations
Set up Row Level Security policies
Configure authentication rules
🔧 Development Tools Used
AI Coding Assistance
Cursor Composer: Used for generating API routes and database queries
Windsurf Cascade: Implemented caching logic and WebSocket handlers
GitHub Copilot: Assisted with component creation and styling
Key AI-Generated Components
Social media processing logic
Geospatial query optimization
Rate limiting middleware
Cache management system
WebSocket event handlers
🧪 Testing
Backend Testing
cd backend
npm test

# Test specific modules
npm test -- --grep "social media"
npm test -- --grep "geocoding"
Frontend Testing
cd frontend
npm test

# Run with coverage
npm test -- --coverage
API Testing
Use the included Postman collection or test with curl:

# Test disaster creation
curl -X POST http://localhost:5000/api/disasters \
  -H "Content-Type: application/json" \
  -H "x-user-id: netrunnerX" \
  -d '{"title":"Test Disaster","location_name":"New York, NY","description":"Test description","tags":["test"]}'
🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
Development Guidelines
Follow ESLint configuration
Write tests for new features
Update documentation for API changes
Use conventional commit messages
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Google Gemini AI for intelligent location extraction
Supabase for seamless database and real-time capabilities
OpenStreetMap community for geographic data
Emergency response organizations for inspiration and real-world insights


