import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import { PostLoginResolver } from './components/auth/PostLoginResolver';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Unauthorized from './pages/auth/Unauthorized';

// Application Pages - Verified Paths
import Dashboard from './pages/Dashboard';
import StudentList from './pages/people/StudentList';
import Teachers from './pages/people/Teachers';
import Classes from './pages/academic/Classes';
import Subjects from './pages/academic/Subjects';
import ClassSubjects from './pages/academic/ClassSubjects';
import Sessions from './pages/academic/Sessions';
import Terms from './pages/academic/Terms';
import Promotions from './pages/academic/Promotions';
import StudentReport from './pages/reports/StudentReport';
import ResultEntry from './pages/results/ResultEntry';
import ResultApproval from './pages/results/ResultApproval';

// Placeholder
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex h-full items-center justify-center">
    <h2 className="text-xl text-slate-400 font-semibold">{title} Coming Soon</h2>
  </div>
);

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Redirect Resolver after Auth */}
            <Route element={<ProtectedRoute />}>
              <Route path="/redirect" element={<PostLoginResolver />} />
            </Route>

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>

                {/* Shared Dashboard */}
                <Route index element={<Dashboard />} />

                {/* Admin Only Routes */}
                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route path="students" element={<StudentList />} />
                  <Route path="teachers" element={<Teachers />} />

                  {/* Academics */}
                  <Route path="academic/classes" element={<Classes />} />
                  <Route path="academic/subjects" element={<Subjects />} />
                  <Route path="academic/subjects/assign" element={<ClassSubjects />} />
                  <Route path="academic/sessions" element={<Sessions />} />
                  <Route path="academic/terms" element={<Terms />} />
                  <Route path="academic/promotions" element={<Promotions />} />

                  {/* Results & Settings */}
                  <Route path="results/approval" element={<ResultApproval />} />
                  <Route path="results/report-cards" element={<StudentReport />} />
                  <Route path="settings" element={<Placeholder title="Settings" />} />
                </Route>

                {/* Teacher Routes */}
                <Route element={<RoleRoute allowedRoles={['teacher', 'admin']} />}>
                  <Route path="results" element={<ResultEntry />} />
                </Route>

                {/* Shared / Student Paths */}
                <Route path="my-report" element={<StudentReport />} />
              </Route>
            </Route>

            {/* Student Specific Route outside Layout if needed, but DashboardLayout is standard */}
            <Route element={<ProtectedRoute />}>
              <Route path="/report-card/:studentId" element={<StudentReport />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
