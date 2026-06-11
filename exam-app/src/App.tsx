import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute, { AdminRoute, StaffRoute } from './components/PrivateRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';  // ← add this
import Dashboard from './pages/Dashboard';
import ExamTaking from './pages/ExamTaking';
import Results from './pages/Results';
import StudentProfile from './pages/StudentProfile';
import CourseManagement from './pages/CourseManagement';
import QuestionBank from './pages/QuestionBank';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />  {/* ← add this */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/exam/:examId" element={<PrivateRoute><ExamTaking /></PrivateRoute>} />
          <Route path="/admin/*" element={<StaffRoute><AdminPanel /></StaffRoute>} />
          <Route path="/results/:examId" element={<PrivateRoute><Results /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute><CourseManagement /></PrivateRoute>} />
          <Route path="/question-bank" element={<PrivateRoute><QuestionBank /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;