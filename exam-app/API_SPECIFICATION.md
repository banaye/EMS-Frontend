# EMS API Specification

## Base Configuration

```
Base URL: http://localhost:5000 (development)
API Version: v1
Authentication: Bearer Token (JWT)
Content-Type: application/json
```

### Standard Response Format
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation successful",
  "timestamp": "2026-05-13T10:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "Invalid or expired token"
  },
  "timestamp": "2026-05-13T10:30:00Z"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User lacks permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### POST /api/auth/login
**Description**: Authenticate user and return JWT token

**Request**
```json
{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_123",
      "name": "John Student",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

**Errors**
- `400` - Missing email or password
- `401` - Invalid credentials
- `404` - User not found

---

### POST /api/auth/logout
**Description**: Invalidate user token (optional - can be client-side)

**Headers**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/verify
**Description**: Verify token validity and get current user

**Headers**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "name": "John Student",
    "email": "student@example.com",
    "role": "student"
  }
}
```

**Errors**
- `401` - Invalid or expired token

---

## User Management Endpoints

### GET /api/users
**Description**: List all users (Admin only)

**Headers**
```
Authorization: Bearer <admin_token>
```

**Query Parameters**
```
?role=student        # Filter by role (admin/student)
?search=john         # Search by name or email
?page=1              # Pagination
&limit=20            # Items per page
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "usr_123",
        "name": "John Student",
        "email": "john@example.com",
        "role": "student",
        "createdAt": "2026-01-15T10:00:00Z",
        "lastLogin": "2026-05-12T15:30:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

---

### POST /api/users
**Description**: Create new user (Admin only)

**Headers**
```
Authorization: Bearer <admin_token>
```

**Request**
```json
{
  "name": "Jane Student",
  "email": "jane@example.com",
  "password": "securePassword123",
  "role": "student"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "usr_124",
    "name": "Jane Student",
    "email": "jane@example.com",
    "role": "student",
    "createdAt": "2026-05-13T10:30:00Z"
  }
}
```

**Errors**
- `400` - Missing required fields or invalid data
- `409` - Email already exists

---

### GET /api/users/:userId
**Description**: Get specific user details

**Headers**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "name": "John Student",
    "email": "john@example.com",
    "role": "student",
    "enrolledCourses": ["course_1", "course_2"],
    "createdAt": "2026-01-15T10:00:00Z",
    "lastLogin": "2026-05-12T15:30:00Z"
  }
}
```

---

### PUT /api/users/:userId
**Description**: Update user information

**Headers**
```
Authorization: Bearer <token>
```

**Request**
```json
{
  "name": "John Updated",
  "email": "john.new@example.com"
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "name": "John Updated",
    "email": "john.new@example.com",
    "role": "student",
    "updatedAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### DELETE /api/users/:userId
**Description**: Delete user account (Admin only)

**Headers**
```
Authorization: Bearer <admin_token>
```

**Response (204)**
No content

---

## Course Management Endpoints

### GET /api/courses
**Description**: List all courses

**Query Parameters**
```
?instructor=usr_123  # Filter by instructor
?search=Python       # Search by name
?page=1
&limit=20
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_1",
        "name": "Python Basics",
        "description": "Learn Python fundamentals",
        "instructorId": "usr_100",
        "instructorName": "Prof. Smith",
        "studentCount": 45,
        "createdAt": "2026-01-01T10:00:00Z"
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20
  }
}
```

---

### POST /api/courses
**Description**: Create new course (Admin only)

**Headers**
```
Authorization: Bearer <admin_token>
```

**Request**
```json
{
  "name": "Advanced Python",
  "description": "Learn advanced Python concepts",
  "instructorId": "usr_100"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "course_2",
    "name": "Advanced Python",
    "description": "Learn advanced Python concepts",
    "instructorId": "usr_100",
    "createdAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### GET /api/courses/:courseId
**Description**: Get course details with enrolled students

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "course_1",
    "name": "Python Basics",
    "description": "Learn Python fundamentals",
    "instructorId": "usr_100",
    "instructorName": "Prof. Smith",
    "students": [
      {
        "id": "usr_123",
        "name": "John Student",
        "email": "john@example.com",
        "enrolledDate": "2026-02-01T10:00:00Z"
      }
    ],
    "exams": [
      {
        "id": "exam_1",
        "title": "Midterm Exam",
        "scheduledDate": "2026-06-15T10:00:00Z"
      }
    ]
  }
}
```

---

### PUT /api/courses/:courseId
**Description**: Update course information (Admin only)

**Request**
```json
{
  "name": "Python Basics - Updated",
  "description": "Updated description"
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "course_1",
    "name": "Python Basics - Updated",
    "description": "Updated description",
    "updatedAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### DELETE /api/courses/:courseId
**Description**: Delete course (Admin only)

**Response (204)**
No content

---

### POST /api/courses/:courseId/enroll
**Description**: Enroll student in course

**Headers**
```
Authorization: Bearer <token>
```

**Request**
```json
{
  "studentId": "usr_123"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Student enrolled successfully"
}
```

---

### POST /api/courses/:courseId/unenroll
**Description**: Remove student from course (Admin only)

**Request**
```json
{
  "studentId": "usr_123"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Student unenrolled successfully"
}
```

---

## Exam Management Endpoints

### GET /api/exams
**Description**: List all exams

**Query Parameters**
```
?courseId=course_1   # Filter by course
?status=active       # Filter by status (scheduled/active/completed)
?page=1
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "exams": [
      {
        "id": "exam_1",
        "title": "Midterm Exam",
        "courseId": "course_1",
        "courseName": "Python Basics",
        "duration": 60,
        "totalQuestions": 50,
        "passingPercentage": 60,
        "status": "active",
        "scheduledDate": "2026-06-15T10:00:00Z",
        "createdAt": "2026-05-01T10:00:00Z"
      }
    ],
    "total": 5
  }
}
```

---

### POST /api/exams
**Description**: Create new exam (Admin only)

**Request**
```json
{
  "title": "Final Exam",
  "courseId": "course_1",
  "duration": 120,
  "passingPercentage": 70,
  "scheduledDate": "2026-08-15T10:00:00Z",
  "description": "Final comprehensive exam",
  "totalQuestions": 100
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "exam_2",
    "title": "Final Exam",
    "courseId": "course_1",
    "duration": 120,
    "passingPercentage": 70,
    "status": "scheduled",
    "createdAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### GET /api/exams/:examId
**Description**: Get exam details with questions

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "exam_1",
    "title": "Midterm Exam",
    "courseId": "course_1",
    "duration": 60,
    "passingPercentage": 60,
    "totalQuestions": 50,
    "status": "active",
    "questions": [
      {
        "id": "q_1",
        "type": "mcq",
        "text": "What is Python?",
        "options": ["Language", "Tool", "Framework", "Library"],
        "marks": 2
      }
    ],
    "scheduledDate": "2026-06-15T10:00:00Z"
  }
}
```

---

### PUT /api/exams/:examId
**Description**: Update exam details (Admin only)

**Request**
```json
{
  "title": "Midterm Exam - Updated",
  "duration": 90,
  "passingPercentage": 65
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "exam_1",
    "title": "Midterm Exam - Updated",
    "duration": 90,
    "passingPercentage": 65,
    "updatedAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### DELETE /api/exams/:examId
**Description**: Delete exam (Admin only)

**Response (204)**
No content

---

### POST /api/exams/:examId/submit
**Description**: Submit exam answers (Student)

**Headers**
```
Authorization: Bearer <student_token>
```

**Request**
```json
{
  "answers": [
    {
      "questionId": "q_1",
      "answer": "Language"
    },
    {
      "questionId": "q_2",
      "answer": "A programming language used for web development"
    }
  ],
  "timeSpent": 3600
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "resultId": "result_123",
    "examId": "exam_1",
    "studentId": "usr_123",
    "totalMarks": 100,
    "obtainedMarks": 78,
    "percentage": 78,
    "passed": true,
    "submittedAt": "2026-05-13T11:30:00Z"
  }
}
```

---

## Question Management Endpoints

### GET /api/questions
**Description**: List all questions (Admin)

**Query Parameters**
```
?examId=exam_1       # Filter by exam
?type=mcq            # Filter by type
?difficulty=medium   # Filter by difficulty
?page=1
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q_1",
        "examId": "exam_1",
        "type": "mcq",
        "text": "What is Python?",
        "options": ["Language", "Tool", "Framework", "Library"],
        "correctAnswer": "Language",
        "marks": 2,
        "difficulty": "easy",
        "createdAt": "2026-05-01T10:00:00Z"
      }
    ],
    "total": 50
  }
}
```

---

### POST /api/questions
**Description**: Create new question (Admin)

**Request**
```json
{
  "examId": "exam_1",
  "type": "mcq",
  "text": "What is a variable?",
  "options": ["Storage location", "Function", "Loop", "Condition"],
  "correctAnswer": "Storage location",
  "marks": 2,
  "difficulty": "easy"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "q_2",
    "examId": "exam_1",
    "type": "mcq",
    "text": "What is a variable?",
    "marks": 2,
    "difficulty": "easy",
    "createdAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### PUT /api/questions/:questionId
**Description**: Update question (Admin)

**Request**
```json
{
  "text": "What is a Python variable?",
  "marks": 3
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "q_2",
    "text": "What is a Python variable?",
    "marks": 3,
    "updatedAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### DELETE /api/questions/:questionId
**Description**: Delete question (Admin)

**Response (204)**
No content

---

## Results & Analytics Endpoints

### GET /api/results/:examId
**Description**: Get exam results for all students

**Headers**
```
Authorization: Bearer <admin_token>
```

**Query Parameters**
```
?passed=true         # Filter by passed/failed
?sort=score          # Sort by score, date
?page=1
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "examId": "exam_1",
    "examTitle": "Midterm Exam",
    "results": [
      {
        "id": "result_123",
        "studentId": "usr_123",
        "studentName": "John Student",
        "totalMarks": 100,
        "obtainedMarks": 78,
        "percentage": 78,
        "passed": true,
        "timeSpent": 3600,
        "submittedAt": "2026-05-13T11:30:00Z"
      }
    ],
    "statistics": {
      "totalStudents": 45,
      "passedStudents": 38,
      "failedStudents": 7,
      "averageScore": 75.2,
      "highestScore": 98,
      "lowestScore": 42
    }
  }
}
```

---

### GET /api/results/student/:studentId
**Description**: Get student's exam results

**Headers**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "studentId": "usr_123",
    "studentName": "John Student",
    "results": [
      {
        "id": "result_123",
        "examId": "exam_1",
        "examTitle": "Midterm Exam",
        "courseName": "Python Basics",
        "totalMarks": 100,
        "obtainedMarks": 78,
        "percentage": 78,
        "passed": true,
        "submittedAt": "2026-05-13T11:30:00Z"
      }
    ]
  }
}
```

---

### GET /api/results/:resultId
**Description**: Get detailed result with answers

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "result_123",
    "studentId": "usr_123",
    "examId": "exam_1",
    "totalMarks": 100,
    "obtainedMarks": 78,
    "percentage": 78,
    "passed": true,
    "answers": [
      {
        "questionId": "q_1",
        "questionText": "What is Python?",
        "studentAnswer": "Language",
        "correctAnswer": "Language",
        "isCorrect": true,
        "marksObtained": 2
      }
    ],
    "submittedAt": "2026-05-13T11:30:00Z"
  }
}
```

---

### GET /api/reports/analytics
**Description**: Get overall analytics (Admin)

**Headers**
```
Authorization: Bearer <admin_token>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalCourses": 12,
    "totalExams": 35,
    "completedExams": 28,
    "averagePassRate": 78.5,
    "topPerformers": [
      {
        "studentId": "usr_123",
        "name": "John Student",
        "averageScore": 92.5
      }
    ],
    "coursePerformance": [
      {
        "courseId": "course_1",
        "courseName": "Python Basics",
        "studentCount": 45,
        "averageScore": 76.8
      }
    ]
  }
}
```

---

## Error Codes Reference

### Authentication Errors
- `AUTH_INVALID_TOKEN` - Token is invalid or expired
- `AUTH_MISSING_TOKEN` - Authorization header is missing
- `AUTH_INVALID_CREDENTIALS` - Email or password is incorrect
- `AUTH_USER_NOT_FOUND` - User account does not exist

### Authorization Errors
- `AUTH_INSUFFICIENT_PERMISSION` - User lacks required role/permission
- `AUTH_ADMIN_ONLY` - This action is only available to administrators

### Validation Errors
- `VALIDATION_REQUIRED_FIELD` - Required field is missing
- `VALIDATION_INVALID_FORMAT` - Field format is invalid
- `VALIDATION_INVALID_EMAIL` - Email format is invalid
- `VALIDATION_DUPLICATE_ENTRY` - Resource already exists

### Resource Errors
- `RESOURCE_NOT_FOUND` - Requested resource does not exist
- `RESOURCE_ALREADY_EXISTS` - Resource already exists
- `RESOURCE_IN_USE` - Cannot delete resource as it's in use

### Server Errors
- `SERVER_ERROR` - Internal server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_API_ERROR` - External API call failed

---

## Implementation Notes

### Rate Limiting (Recommended)
- Implement rate limiting to prevent abuse
- Suggested: 100 requests per minute per IP

### Pagination
- Default limit: 20 items
- Maximum limit: 100 items
- Always include `total` count in responses

### Sorting
- Support sorting by common fields (date, score, name)
- Use `sort=fieldName` and `order=asc|desc`

### Filtering
- Support filtering by status, role, course, etc.
- Combine multiple filters with AND logic

### CORS
- Enable CORS for development: `http://localhost:5173`
- Restrict to specific origins in production

### Security Headers
- Implement HTTPS in production
- Use secure, httpOnly cookies for tokens (optional)
- Implement CSRF protection if using sessions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-13 | Initial API specification |

---

**Last Updated**: May 13, 2026
