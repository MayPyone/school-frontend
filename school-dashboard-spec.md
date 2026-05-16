# Language School Management System - Design Specification

**Version:** 1.0  
**Last Updated:** 2026-05-16

## Overview

This document maps the backend API endpoints to UI components and defines the design patterns for the Language School Management System admin dashboard. It serves as a bridge between the database schema, REST API, and the user interface.

---

## API Base Configuration

- **Base URL:** `/api/v1`
- **Authentication:** User login required (`POST /api/v1/users/login`)
- **Response Format:** JSON
- **API Version:** OpenAPI 3.1

---

## Page-to-API Mapping

### 1. Overview Dashboard

**Route:** `/`  
**Component:** `Overview.tsx`

**API Endpoints:**
- `GET /api/v1/schools` - Fetch total schools count and list
- `GET /api/v1/schools/{schoolId}/lessons` - Aggregate lessons count
- Statistics aggregation (derived from multiple endpoints)

**Data Display:**
- **Statistics Cards:**
  - Total Schools
  - Total Lessons
  - Active Staff Members
  - Scheduled Activities
- **Quick Actions:** Links to create new entries
- **Recent Activity Feed:** Latest updates across all entities

**UI Components Needed:**
- StatCard component (metric display)
- QuickActionButton component
- ActivityFeedItem component
- Dashboard grid layout

---

### 2. Schools Management

**Route:** `/schools`  
**Component:** `Schools.tsx`

**API Endpoints:**

| Method | Endpoint | Purpose | UI Action |
|--------|----------|---------|-----------|
| GET | `/api/v1/schools` | List all schools | Page load, refresh |
| POST | `/api/v1/schools` | Create new school | "Add School" button |
| PUT | `/api/v1/schools/{id}` | Update school | Edit form submission |
| DELETE | `/api/v1/schools/{id}` | Delete school | Delete confirmation |

**Request/Response Models:**

```typescript
// SchoolRequest
interface SchoolRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  openingHours: OpeningHourRequest[];
}

// OpeningHourRequest
interface OpeningHourRequest {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  openTime: string; // LocalTime format: "HH:mm:ss"
  closeTime: string; // LocalTime format: "HH:mm:ss"
}

// SchoolResponse
interface SchoolResponse {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  openingHours: OpeningHour[];
  createdAt: string;
  updatedAt: string;
}
```

**UI Components:**
- SchoolsList (table/grid view)
- SchoolCard (individual school display)
- SchoolForm (create/edit modal)
- OpeningHoursEditor (weekday time selector)
- DeleteConfirmationDialog

**Form Fields:**
- School Name (text input, required)
- Address (textarea, required)
- Phone (tel input with validation)
- Email (email input with validation)
- Opening Hours (dynamic form with day/time selectors)

**Validation Rules:**
- Email format validation
- Phone number format
- Opening hours: closeTime must be after openTime
- At least one opening hour required

---

### 3. Lessons Management

**Route:** `/lessons`  
**Component:** `Lessons.tsx`

**API Endpoints:**

| Method | Endpoint | Purpose | UI Action |
|--------|----------|---------|-----------|
| GET | `/api/v1/schools/{schoolId}/lessons` | List lessons by school | School filter change |
| GET | `/api/v1/schools/{schoolId}/lessons/{lessonId}` | Get lesson details | View lesson details |
| POST | `/api/v1/schools/{schoolId}/lessons` | Create new lesson | "Add Lesson" button |
| PUT | `/api/v1/schools/{schoolId}/lessons/{lessonId}` | Update lesson | Edit form submission |
| DELETE | `/api/v1/schools/{schoolId}/lessons/{lessonId}` | Delete lesson | Delete confirmation |

**Request/Response Models:**

```typescript
// LessonRequest
interface LessonRequest {
  title: string;
  description: string;
  level: string; // e.g., "A1", "A2", "B1", "B2", "C1", "C2"
  duration: number; // in minutes
}

// LessonResponse
interface LessonResponse {
  id: number;
  schoolId: number;
  title: string;
  description: string;
  level: string;
  duration: number;
  units: LessonUnitResponse[];
  createdAt: string;
  updatedAt: string;
}

// LessonUnitResponse (summary)
interface LessonUnitResponse {
  id: number;
  unitNumber: number;
  title: string;
  vocabularyCount: number;
}
```

**UI Components:**
- LessonsList (filterable table)
- SchoolSelector (dropdown filter)
- LessonCard (detailed view with units)
- LessonForm (create/edit modal)
- LevelBadge (visual indicator for CEFR levels)

**Form Fields:**
- School Selection (dropdown, required, pre-filter)
- Title (text input, required)
- Description (rich text editor)
- Level (dropdown: A1, A2, B1, B2, C1, C2)
- Duration (number input, minutes)

**Design Patterns:**
- Color-coded level badges (A1=green, B1=yellow, C1=red)
- Expandable rows to show units within lesson
- Quick edit inline for title/duration
- Bulk actions for multiple lessons

---

### 4. Units Management (Sub-section of Lessons)

**Route:** `/lessons/{lessonId}/units`  
**Component:** `Units.tsx` or integrated into `Lessons.tsx`

**API Endpoints:**

| Method | Endpoint | Purpose | UI Action |
|--------|----------|---------|-----------|
| GET | `/api/v1/lessons/{lessonId}/units` | List units for lesson | Expand lesson details |
| GET | `/api/v1/lessons/{lessonId}/units/{unitId}` | Get unit details | View unit |
| POST | `/api/v1/lessons/{lessonId}/units` | Create new unit | "Add Unit" button |
| PUT | `/api/v1/lessons/{lessonId}/units/{unitId}` | Update unit | Edit form submission |
| DELETE | `/api/v1/lessons/{lessonId}/units/{unitId}` | Delete unit | Delete confirmation |

**Request/Response Models:**

```typescript
// CreateUnitRequest
interface CreateUnitRequest {
  unitNumber: number;
  title: string;
  content: string;
  vocabulary: string[]; // Array of vocabulary terms
}

// UpdateUnitRequest
interface UpdateUnitRequest {
  title?: string;
  content?: string;
  vocabulary?: string[];
}

// UnitResponse
interface UnitResponse {
  id: number;
  lessonId: number;
  unitNumber: number;
  title: string;
  content: string;
  vocabulary: string[];
  createdAt: string;
  updatedAt: string;
}
```

**UI Components:**
- UnitsList (nested within lesson)
- UnitCard (collapsible content display)
- UnitForm (create/edit modal)
- VocabularyEditor (tag-based input for vocabulary terms)
- UnitReorder (drag-and-drop for unit numbers)

**Form Fields:**
- Unit Number (auto-increment or manual)
- Title (text input, required)
- Content (markdown or rich text editor)
- Vocabulary (tag input, multiple terms)

**Design Patterns:**
- Nested tree view (Lesson → Units)
- Drag-and-drop reordering for unit numbers
- Inline vocabulary tag display with count
- Content preview with "Read more" expansion

---

### 5. Class Schedules Management

**Route:** `/schedules`  
**Component:** `Schedules.tsx`

**API Endpoints:**
- **Note:** Based on database schema, this should map to `class_schedules` table
- Expected endpoints (to be confirmed with backend):
  - `GET /api/v1/schedules`
  - `POST /api/v1/schedules`
  - `PUT /api/v1/schedules/{id}`
  - `DELETE /api/v1/schedules/{id}`

**Data Model (from schema):**

```typescript
interface ClassSchedule {
  id: number;
  schoolId: number;
  lessonId: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string; // LocalTime
  endTime: string; // LocalTime
  room: string;
  capacity: number;
  isOnline: boolean;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
}
```

**UI Components:**
- WeeklyCalendarView (grid layout by day)
- ScheduleCard (individual class block)
- ScheduleForm (create/edit modal)
- TimeSlotPicker (visual time selector)
- OnlineOfflineToggle

**Form Fields:**
- School (dropdown, required)
- Lesson (dropdown filtered by school)
- Day of Week (button group)
- Start Time / End Time (time pickers)
- Room (text input, disabled if online)
- Capacity (number input)
- Online/Onsite (toggle switch)
- Instructor Name (text input)

**Design Patterns:**
- Calendar grid view (7 columns for weekdays)
- Color coding: online (blue), onsite (green)
- Time conflict detection and warnings
- Capacity indicators (filled/total)

---

### 6. Staff Management

**Route:** `/staff`  
**Component:** `Staff.tsx`

**API Endpoints:**
- **Note:** Based on database schema, this should map to `staff` table
- Expected endpoints (to be confirmed with backend):
  - `GET /api/v1/staff`
  - `POST /api/v1/staff`
  - `PUT /api/v1/staff/{id}`
  - `DELETE /api/v1/staff/{id}`

**Data Model (from schema):**

```typescript
interface Staff {
  id: number;
  schoolId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'TEACHER' | 'ADMIN' | 'COORDINATOR' | 'SUPPORT';
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  createdAt: string;
  updatedAt: string;
}
```

**UI Components:**
- StaffList (table with filters)
- StaffCard (profile display)
- StaffForm (create/edit modal)
- RoleBadge (visual role indicator)
- StatusIndicator (active/inactive/on-leave)

**Form Fields:**
- School (dropdown, required)
- First Name (text input, required)
- Last Name (text input, required)
- Email (email input, unique validation)
- Phone (tel input)
- Role (dropdown: Teacher, Admin, Coordinator, Support)
- Hire Date (date picker)
- Status (dropdown: Active, Inactive, On Leave)

**Design Patterns:**
- Role-based color coding
- Filter by school, role, status
- Search by name or email
- Avatar with initials fallback

---

### 7. Activities Management

**Route:** `/activities`  
**Component:** `Activities.tsx`

**API Endpoints:**
- **Note:** Based on database schema, this should map to `activities` table
- Expected endpoints (to be confirmed with backend):
  - `GET /api/v1/activities`
  - `POST /api/v1/activities`
  - `PUT /api/v1/activities/{id}`
  - `DELETE /api/v1/activities/{id}`
  - `POST /api/v1/activities/{id}/images` (upload images)

**Data Model (from schema):**

```typescript
interface Activity {
  id: number;
  schoolId: number;
  title: string;
  description: string;
  activityDate: string; // ISO date
  location: string;
  maxParticipants: number;
  registeredCount: number;
  images: string[]; // URLs to activity images
  createdAt: string;
  updatedAt: string;
}
```

**UI Components:**
- ActivitiesList (card grid layout)
- ActivityCard (image gallery preview)
- ActivityForm (create/edit modal)
- ImageUploader (drag-and-drop multiple)
- ParticipantCounter (progress indicator)

**Form Fields:**
- School (dropdown, required)
- Title (text input, required)
- Description (rich text editor)
- Activity Date (date picker, future dates)
- Location (text input with map integration)
- Max Participants (number input)
- Images (file upload, multiple, max 10)

**Design Patterns:**
- Card-based grid layout with image thumbnails
- Image gallery lightbox view
- Participant capacity progress bar
- Past/upcoming activity filters
- Date-based sorting

---

## Authentication Flow

**API Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/users` | Register new user (admin only) |
| POST | `/api/v1/users/login` | User authentication |

**Request/Response Models:**

```typescript
// UserLoginRequest
interface UserLoginRequest {
  email: string;
  password: string;
}

// UserRequest (registration)
interface UserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'TEACHER' | 'STAFF';
}

// User (response)
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}
```

**UI Flow:**
1. Login page (`/login`) - email/password form
2. On success: Store auth token, redirect to dashboard
3. Protected routes: Check auth token, redirect to login if missing
4. Logout: Clear token, redirect to login

**UI Components:**
- LoginForm
- ProtectedRoute wrapper
- UserMenu (top-right dropdown with logout)

---

## Common UI Patterns

### Loading States
- Skeleton loaders for tables/cards
- Spinner for button actions
- Progress bars for uploads

### Error Handling
- Toast notifications for API errors
- Form validation error messages
- 404 pages for missing resources
- Network error retry buttons

### Confirmation Dialogs
- Delete confirmations (type name to confirm)
- Unsaved changes warnings
- Bulk action confirmations

### Filters & Search
- School-based filtering (global context)
- Text search (debounced, 300ms)
- Date range filters
- Multi-select filters (role, status, level)

### Pagination
- Server-side pagination for large lists
- Page size options: 10, 25, 50, 100
- Jump to page input

---

## Data Relationships & Cascading

### School → Lessons → Units
- Deleting a school: Warn about associated lessons
- Deleting a lesson: Warn about associated units and schedules
- Filtering: School selection cascades to lessons

### School → Staff
- Deleting a school: Warn about associated staff
- Staff list: Filter by school

### School → Schedules
- Deleting a school: Warn about associated schedules
- Schedule creation: Validate school-lesson relationship

### School → Activities
- Deleting a school: Warn about associated activities
- Activity calendar: Filter by school

---

## Responsive Design Breakpoints

- **Mobile:** < 640px (1 column layouts)
- **Tablet:** 640px - 1024px (2 column layouts)
- **Desktop:** > 1024px (3+ column layouts)

**Mobile-First Patterns:**
- Hamburger navigation menu
- Stacked forms (single column)
- Card-based list views
- Bottom sheet modals

---

## Accessibility Requirements

- **WCAG 2.1 Level AA compliance**
- Keyboard navigation for all interactive elements
- ARIA labels for icons and buttons
- Form labels and error announcements
- Color contrast ratio 4.5:1 minimum
- Focus indicators on all focusable elements

---

## Performance Considerations

- **API Response Caching:**
  - Schools list: Cache for 5 minutes
  - Lessons/Units: Cache for 2 minutes
  - Schedules: Cache for 1 minute (frequent updates)

- **Optimistic UI Updates:**
  - Create/Update: Show immediately, rollback on error
  - Delete: Fade out, restore on error

- **Image Optimization:**
  - Activity images: Max 2MB, compress to WebP
  - Lazy loading for image galleries
  - Thumbnail generation for previews

---

## Future API Endpoints (To Be Implemented)

Based on the database schema, these endpoints may be needed:

```
# Enrollment Management
GET    /api/v1/enrollments
POST   /api/v1/enrollments
DELETE /api/v1/enrollments/{id}

# Attendance Tracking
GET    /api/v1/schedules/{scheduleId}/attendance
POST   /api/v1/attendance
PUT    /api/v1/attendance/{id}

# Student Management
GET    /api/v1/students
POST   /api/v1/students
PUT    /api/v1/students/{id}
DELETE /api/v1/students/{id}

# Payments
GET    /api/v1/payments
POST   /api/v1/payments
GET    /api/v1/students/{studentId}/payments
```

---

## Design Tokens (To Be Defined in Figma)

### Colors
- Primary: (brand color)
- Secondary: (accent color)
- Success: (green for active, completed)
- Warning: (yellow for pending, on-leave)
- Error: (red for errors, inactive)
- Neutral: (grays for text, borders, backgrounds)

### Typography
- Heading 1: (page titles)
- Heading 2: (section titles)
- Heading 3: (card titles)
- Body: (default text)
- Caption: (labels, meta info)
- Monospace: (codes, IDs)

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Border Radius
- sm: 4px (inputs, buttons)
- md: 8px (cards)
- lg: 12px (modals)
- full: 9999px (badges, avatars)

---

## Next Steps

1. **Import Figma Design:** Import the visual design system into the codebase
2. **Update API Client:** Create typed API client with all endpoints
3. **Implement Authentication:** Set up auth context and protected routes
4. **Build Reusable Components:** Create design system components from Figma
5. **Connect API to UI:** Replace mock data with real API calls
6. **Add Error Handling:** Implement comprehensive error boundaries and user feedback
7. **Testing:** Unit tests for components, integration tests for API flows
8. **Documentation:** Component storybook and API integration guide

---

**Document maintained by:** Development Team  
**Questions or updates:** Contact project lead
