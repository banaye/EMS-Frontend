# EMS Quick Start Guide for Developers

## Get Up and Running in 5 Minutes

### 1. Initial Setup
```bash
# Clone and install
git clone <repository-url>
cd exam-app
npm install

# Start development server
npm run dev
```

The app opens at `http://localhost:5173`

---

## Quick Reference

### Project Commands
```bash
npm run dev       # Start dev server with HMR
npm run build     # Build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

### Folder Quick Map
```
src/
├── pages/         → Full page views (Login, Dashboard, etc.)
├── components/    → Reusable UI components
│   └── admin/     → Admin-only components
├── context/       → Global state (AuthContext)
├── services/      → API calls (currently empty - add here)
├── styles/        → CSS files (one per page/component)
└── types/         → TypeScript interfaces (currently empty)
```

---

## Authentication Flow (Critical to Understand)

### For Testing
Add a test login in `Login.tsx` or use the actual backend:
```typescript
// In AuthContext.tsx - login method typically:
const mockUser = {
  name: "Test User",
  email: "test@example.com",
  role: "student" // or "admin"
};
```

### To Add Role-Based Access
```typescript
// In components that need admin-only access:
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function AdminFeature() {
  const auth = useContext(AuthContext);
  
  if (auth?.user?.role !== 'admin') {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Content</div>;
}
```

---

## Adding a New Page

### Step 1: Create the page
```bash
touch src/pages/NewPage.tsx
touch src/styles/NewPage.css
```

### Step 2: Write the component
```typescript
// src/pages/NewPage.tsx
export default function NewPage() {
  return (
    <div className="new-page">
      <h1>New Page</h1>
    </div>
  );
}
```

### Step 3: Add CSS
```css
/* src/styles/NewPage.css */
.new-page {
  padding: 20px;
}
```

### Step 4: Add route
```typescript
// In App.tsx - add to Routes:
<Route
  path="/new-page"
  element={
    <PrivateRoute>
      <NewPage />
    </PrivateRoute>
  }
/>
```

### Step 5: Add navigation link
```typescript
// In Navigation.tsx component:
<a href="/new-page">New Page</a>
```

---

## Working with API Calls

### Create a Service File
```typescript
// src/services/courseService.ts
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Add auth token to all requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const courseService = {
  async getCourses() {
    const { data } = await API.get('/api/courses');
    return data;
  },

  async createCourse(courseData: CourseType) {
    const { data } = await API.post('/api/courses', courseData);
    return data;
  },

  async updateCourse(id: string, courseData: CourseType) {
    const { data } = await API.put(`/api/courses/${id}`, courseData);
    return data;
  },

  async deleteCourse(id: string) {
    const { data } = await API.delete(`/api/courses/${id}`);
    return data;
  }
};
```

### Use in a Component
```typescript
import { useEffect, useState } from 'react';
import { courseService } from '../services/courseService';

export function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await courseService.getCourses();
        setCourses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {courses.map((course) => (
        <div key={course.id}>{course.name}</div>
      ))}
    </div>
  );
}
```

---

## Type Safety Tips

### Define Your Types
```typescript
// src/types/index.ts (or create separate files)
export interface Course {
  id: string;
  name: string;
  description: string;
  instructorId: string;
  createdAt: Date;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  duration: number; // in minutes
  passPercentage: number;
  totalQuestions: number;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: 'mcq' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer: string;
  marks: number;
}
```

### Use Types in Components
```typescript
import { Course, Exam } from '../types';

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
}

export function CourseCard({ course, onSelect }: CourseCardProps) {
  return (
    <div onClick={() => onSelect(course)}>
      <h3>{course.name}</h3>
      <p>{course.description}</p>
    </div>
  );
}
```

---

## Common Patterns

### useAuth Hook (Custom Hook)
```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Usage in components:
import { useAuth } from '../hooks/useAuth';

function UserProfile() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Loading and Error States
```typescript
interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useData<T>(fetchFn: () => Promise<T>) {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchFn()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, []);

  return state;
}
```

---

## CSS Styling Best Practices

### BEM Naming Convention
```css
/* Block */
.exam-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

/* Element */
.exam-card__title {
  font-size: 18px;
  font-weight: bold;
}

/* Modifier */
.exam-card--active {
  border: 2px solid blue;
}
.exam-card--disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

### Responsive Design
```css
/* Mobile first */
.container {
  padding: 10px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 20px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 40px;
  }
}
```

---

## Debugging Checklist

- [ ] Is the backend running?
- [ ] Check `console.log()` statements in browser console
- [ ] Verify token in localStorage (`F12 → Application → Local Storage`)
- [ ] Check network requests in DevTools (`F12 → Network`)
- [ ] Verify route exists in `App.tsx`
- [ ] Check component imports are correct
- [ ] Run `npm run lint` to catch TypeScript errors
- [ ] Check CSS file is imported in component

---

## Next Steps

1. **Setup Backend**: Create API endpoints matching the documentation
2. **Add Services**: Create service files for all API endpoints
3. **Define Types**: Add TypeScript interfaces in `src/types/`
4. **Build Features**: Implement pages and components
5. **Test**: Test each feature thoroughly
6. **Deploy**: Use `npm run build` for production

---

## Useful Links

- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Cheat Sheet](https://www.typescriptlang.org/cheatsheets)
- [React Router Guide](https://reactrouter.com/start/overview)
- [Axios Quick Start](https://axios-http.com/docs/intro)

---

**Happy coding! 🚀**
