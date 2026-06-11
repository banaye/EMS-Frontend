# Exam Management System (EMS) - Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup and Installation](#setup-and-installation)
5. [Key Features](#key-features)
6. [Architecture](#architecture)
7. [Authentication System](#authentication-system)
8. [Component Structure](#component-structure)
9. [Pages and Routes](#pages-and-routes)
10. [Development Guide](#development-guide)
11. [Deployment](#deployment)

---

## Project Overview

The Exam Management System (EMS) is a comprehensive web-based application designed to facilitate exam management, student assessments, and course administration. The system provides distinct interfaces and functionalities for two types of users:

- **Administrators**: Manage courses, exams, questions, users, and view detailed reports
- **Students**: Take exams, view results, and manage their profiles

The application uses modern web technologies with React as the frontend framework and provides a responsive, user-friendly interface for both roles.

### Key Objectives
- Streamline exam creation and management
- Enable secure and fair exam-taking experience
- Provide comprehensive reporting and analytics
- Manage user accounts and course enrollments
- Track student performance and results

---

## Tech Stack

### Frontend
- **Framework**: React 19.2.4
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 8.0.0
- **Routing**: React Router DOM 7.15.0
- **HTTP Client**: Axios 1.16.0
- **Styling**: CSS3 (custom stylesheets)

### Development Tools
- **Linting**: ESLint 9.39.4 with TypeScript support
- **Type Checking**: TypeScript compiler
- **Package Manager**: npm

### Browser Support
- Modern browsers supporting ES2020+
- React 19 and above

---

## Project Structure

```
exam-app/
├── public/                          # Static assets
├── src/
│   ├── components/                  # React components
│   │   ├── Navigation.tsx           # Main navigation component
│   │   ├── PrivateRoute.tsx         # Protected route wrapper
│   │   ├── admin/                   # Admin-specific components
│   │   │   ├── ManageCourses.tsx
│   │   │   ├── ManageExams.tsx
│   │   │   ├── ManageQuestions.tsx
│   │   │   ├── ManageUsers.tsx
│   │   │   └── ViewReports.tsx
│   │   ├── auth/                    # Authentication components
│   │   ├── common/                  # Reusable common components
│   │   └── exam/                    # Exam-related components
│   ├── context/                     # React Context API
│   │   └── AuthContext.tsx          # Authentication state management
│   ├── hooks/                       # Custom React hooks
│   ├── pages/                       # Page components
│   │   ├── Admin_Dashboard.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── CourseManagement.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExamTaking.tsx
│   │   ├── Login.tsx
│   │   ├── QuestionBank.tsx
│   │   ├── Results.tsx
│   │   └── StudentProfile.tsx
│   ├── services/                    # API service calls
│   ├── styles/                      # CSS stylesheets
│   ├── types/                       # TypeScript type definitions
│   ├── utils/                       # Utility functions
│   ├── App.tsx                      # Root application component
│   ├── App.css                      # Global styles
│   ├── index.css                    # Base styles
│   └── main.tsx                     # Application entry point
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
├── eslint.config.js                 # ESLint rules
└── index.html                       # HTML entry point
```

---

## Setup and Installation

### Prerequisites
- Node.js 16+ and npm 8+
- Git (for version control)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exam-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** (if needed)
   - Create a `.env` file in the root directory
   - Add API endpoint configuration:
     ```
     VITE_API_URL=http://localhost:5000
     ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

7. **Run linter**
   ```bash
   npm run lint
   ```

---

## Key Features

### For Students
- **Secure Login**: Role-based authentication with email and password
- **Dashboard**: Overview of available exams and courses
- **Exam Taking**: 
  - Timer-based exam interface
  - Multiple question types support
  - Real-time progress tracking
  - Answer saving functionality
- **Results Viewing**: 
  - Detailed exam performance reports
  - Score analysis
  - Answer reviews
- **Profile Management**: 
  - View and update personal information
  - Track exam history
  - Performance analytics

### For Administrators
- **User Management**: 
  - Create, read, update, delete user accounts
  - Assign user roles (admin/student)
  - View user activity logs
- **Course Management**: 
  - Create and manage courses
  - Assign courses to students
  - Track course progress
- **Exam Management**: 
  - Create and schedule exams
  - Link exams to courses
  - Set exam duration and passing criteria
  - Manage exam availability
- **Question Bank**: 
  - Create question pool across categories
  - Support multiple question types (MCQ, Short answer, etc.)
  - Organize questions by difficulty level
  - Reuse questions across exams
- **Reporting & Analytics**: 
  - Student performance reports
  - Exam statistics
  - Class-wide analytics
  - Export reports

---

## Architecture

### Overall Architecture Pattern
The application follows a **Component-Based Architecture** with **Context API** for state management:

```
┌─────────────────────────────────────┐
│      Router (React Router)           │
├─────────────────────────────────────┤
│     AuthProvider (Context)           │
├─────────────────────────────────────┤
│    PrivateRoute (Protected Routes)  │
├─────────────────────────────────────┤
│      Pages & Components              │
│  ┌──────────────────────────────────┐│
│  │  Admin / Student Components       ││
│  │  └─ Subcomponents                ││
│  └──────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Data Flow
1. **Authentication**: User logs in → AuthContext stores user/token → localStorage persists session
2. **Navigation**: Router directs to appropriate page based on route
3. **Authorization**: PrivateRoute checks authentication status
4. **Component Communication**: Props passing and Context API
5. **API Integration**: Axios calls to backend endpoints
6. **State Management**: Context API for global state (auth), component state for local data

### Separation of Concerns
- **Pages**: Handle entire page layouts and orchestration
- **Components**: Reusable, focused UI elements
- **Context**: Global state management (Authentication)
- **Services**: API communication abstraction
- **Styles**: Modular CSS files matching components

---

## Authentication System

### Authentication Flow

```
┌─────────────┐
│  Login Page │
└──────┬──────┘
       │ (email, password)
       ▼
┌──────────────────────────┐
│   AuthContext.login()    │
│  (API call to backend)   │
└──────┬───────────────────┘
       │
       ├─ Success ──► Store user & token in state & localStorage
       │
       └─ Failure ──► Show error message
```

### Key Components

**AuthContext.tsx**
- Manages authentication state (user, token)
- Provides `login()` function
- Provides `logout()` function
- Persists authentication to localStorage
- Auto-restores session on app load

**PrivateRoute.tsx**
- Wraps protected routes
- Checks authentication status
- Redirects unauthenticated users to login
- Prevents unauthorized access

### User Roles
```typescript
interface User {
  name: string;
  email: string;
  role: 'admin' | 'student';
}
```

### Token Management
- Tokens are stored in localStorage
- Tokens should be sent in API requests (Authorization header)
- Logout clears token and user from localStorage
- Token expiration should be handled by backend

---

## Component Structure

### Page Components (Top-Level)

| Page | Role | Purpose |
|------|------|---------|
| `Login.tsx` | Public | User authentication |
| `Dashboard.tsx` | Student | Main student interface, exam list |
| `ExamTaking.tsx` | Student | Exam interface with timer and questions |
| `Results.tsx` | Student | Exam results and score display |
| `StudentProfile.tsx` | Student | Student profile management |
| `AdminPanel.tsx` | Admin | Admin layout and navigation |
| `Admin_Dashboard.tsx` | Admin | Admin overview and statistics |
| `CourseManagement.tsx` | Admin | Course CRUD operations |
| `QuestionBank.tsx` | Admin | Question management |

### Core Components

**Navigation.tsx**
- Main navigation bar
- User menu with logout
- Role-based menu items
- Responsive design

**PrivateRoute.tsx**
- Route protection
- Redirect to login if unauthenticated
- Wraps protected routes

### Admin Sub-Components
Located in `components/admin/`:

- **ManageCourses.tsx**: CRUD interface for courses
- **ManageExams.tsx**: CRUD interface for exams
- **ManageQuestions.tsx**: Question bank interface
- **ManageUsers.tsx**: User account management
- **ViewReports.tsx**: Analytics and reporting dashboard

---

## Pages and Routes

### Route Structure

```
/                          → Redirect to /dashboard
/login                     → Login page (public)
/dashboard                 → Student dashboard (protected)
/exam/:examId              → Exam taking interface (protected)
/results/:examId           → Exam results (protected)
/student-profile           → Student profile (protected)
/course-management         → Course management (admin only)
/question-bank             → Question bank (admin only)
/admin/*                   → Admin panel routes (admin only)
  ├── /admin/dashboard     → Admin dashboard
  ├── /admin/users         → User management
  ├── /admin/courses       → Course management
  ├── /admin/exams         → Exam management
  ├── /admin/questions     → Question bank
  └── /admin/reports       → Reports/analytics
```

### Route Parameters
- `:examId` - The ID of the exam being accessed (extracted from URL path)

---

## Development Guide

### Code Style and Standards

#### TypeScript Best Practices
- Use explicit type annotations for function parameters and returns
- Define interfaces for object types
- Avoid using `any` type
- Use enums for fixed sets of values

#### React Component Guidelines
- Use functional components with hooks
- Implement proper prop typing
- Extract reusable logic into custom hooks
- Use meaningful component names
- Keep components focused on single responsibility

#### File Naming Conventions
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Styles: `PascalCase.css` matching component name
- Services/Utils: `camelCase.ts` (e.g., `authService.ts`)
- Types: `PascalCase.ts` or inline with interfaces

#### Styling Guidelines
- Use CSS modules or BEM naming convention
- Create scoped stylesheets for each major component
- Keep styles organized and maintainable
- Use CSS variables for common colors and spacing

### Adding a New Feature

1. **Create the page/component**
   ```bash
   touch src/pages/NewFeature.tsx
   touch src/styles/NewFeature.css
   ```

2. **Define types** (if needed)
   - Add type definitions in relevant files
   - Or create a new file in `src/types/`

3. **Create service functions** (if needed API calls)
   - Add to `src/services/` directory
   - Use Axios for HTTP requests

4. **Implement the component**
   - Write the React component
   - Add styling
   - Handle state and effects

5. **Add routing**
   - Update `App.tsx` with new route
   - Wrap with `<PrivateRoute>` if protected
   - Add navigation links

6. **Testing**
   - Test component rendering
   - Test user interactions
   - Test edge cases

### Debugging

#### Development Tips
- Use React DevTools browser extension
- Enable TypeScript strict mode in IDE
- Check browser console for errors
- Use `console.log()` for debugging (remove in production)
- Inspect network requests in DevTools

#### Common Issues
- **Authentication loops**: Check token persistence in localStorage
- **404 API errors**: Verify backend is running and endpoint is correct
- **Route not found**: Check route configuration in App.tsx
- **Component not rendering**: Verify PrivateRoute protection and role-based access

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting errors automatically
npm run lint -- --fix
```

---

## API Integration

### Service Structure
API calls should be organized in `src/services/`:

```typescript
// Example: src/services/examService.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const examService = {
  async getExams() {
    const response = await axios.get(`${API_BASE}/exams`);
    return response.data;
  },
  
  async getExamById(id: string) {
    const response = await axios.get(`${API_BASE}/exams/${id}`);
    return response.data;
  },
  
  async submitExam(id: string, answers: unknown) {
    const response = await axios.post(`${API_BASE}/exams/${id}/submit`, answers);
    return response.data;
  }
};
```

### Using Axios with Authentication

```typescript
// Add interceptor to include token in all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```
   This generates optimized production files in the `dist/` directory.

2. **Verify build output**
   ```bash
   npm run preview
   ```
   Test the production build locally before deployment.

### Deployment Options

#### Static Hosting (Recommended)
The app can be deployed to any static hosting service:
- **Vercel**: Zero-config deployment for Vite projects
- **Netlify**: Drag-and-drop or Git integration
- **GitHub Pages**: Free hosting from GitHub
- **AWS S3 + CloudFront**: Scalable CDN solution
- **Azure Static Web Apps**: Integrated with Azure ecosystem

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g http-server
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["http-server", "dist", "-p", "8080"]
```

#### Environment Configuration
- Development: `http://localhost:5173`
- Production: Update `VITE_API_URL` for backend API
- Use environment variables for sensitive configuration

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Linting passes without errors
- [ ] TypeScript compilation successful
- [ ] API endpoints updated for production
- [ ] Environment variables configured
- [ ] Build artifacts generated successfully
- [ ] Performance optimized (no console logs, unused imports removed)
- [ ] Security headers configured on hosting server

---

## Backend Integration

### API Endpoints Required

The frontend expects the following backend endpoints:

**Authentication**
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token validity

**Exams**
- `GET /api/exams` - List all exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams` - Create new exam (admin)
- `PUT /api/exams/:id` - Update exam (admin)
- `DELETE /api/exams/:id` - Delete exam (admin)
- `POST /api/exams/:id/submit` - Submit exam answers

**Courses**
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin)
- `DELETE /api/courses/:id` - Delete course (admin)

**Questions**
- `GET /api/questions` - List questions
- `POST /api/questions` - Create question (admin)
- `PUT /api/questions/:id` - Update question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)

**Users**
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

**Results**
- `GET /api/results/:examId` - Get exam results
- `GET /api/results/user/:userId` - Get user's results

**Reports**
- `GET /api/reports/analytics` - Get analytics data
- `GET /api/reports/student/:id` - Get student report
- `GET /api/reports/exam/:id` - Get exam report

---

## Troubleshooting

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **Blank page on load** | Missing index.html or incorrect build | Verify `index.html` exists, rebuild with `npm run build` |
| **Login always fails** | Backend not running or incorrect URL | Check `VITE_API_URL` and backend connectivity |
| **Routes not working** | Incorrect route configuration | Verify routes in `App.tsx` and component imports |
| **Styles not loading** | CSS files not imported or path issues | Check CSS file imports and path references |
| **TypeScript errors** | Outdated types or missing declarations | Run `npm install` and check tsconfig.json |
| **API 401 errors** | Missing or invalid token | Check localStorage for token, verify token in requests |

---

## Additional Resources

### Documentation References
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Router Documentation](https://reactrouter.com)
- [Vite Documentation](https://vitejs.dev)
- [Axios Documentation](https://axios-http.com)

### Development Tools
- [VS Code](https://code.visualstudio.com)
- [React DevTools Extension](https://github.com/facebook/react-devtools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) (if using Redux in future)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-13 | Initial documentation |

---

## Support and Contact

For questions or issues:
- Create an issue in the repository
- Contact the development team
- Check existing documentation and FAQs

---

**Last Updated**: May 13, 2026
**Documentation Version**: 1.0.0
