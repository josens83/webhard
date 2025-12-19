import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import FilesPage from './pages/FilesPage'
import FileDetailPage from './pages/FileDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MyPage from './pages/MyPage'
import UploadPage from './pages/UploadPage'
import ChargePage from './pages/ChargePage'
import AdminPage from './pages/AdminPage'
import ProtectedRoute from './components/ProtectedRoute'

// Educational Platform Pages
import OnboardingFlow from './pages/OnboardingFlow'
import CoursesPage from './pages/CoursesPage'
import StudentDashboard from './pages/StudentDashboard'

// Communication Pages (쪽지/친구)
import MessagesPage from './pages/MessagesPage'
import FriendsPage from './pages/FriendsPage'

// Additional Pages
import UserProfilePage from './pages/UserProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import PaymentHistoryPage from './pages/PaymentHistoryPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="files/:id" element={<FileDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="onboarding" element={<OnboardingFlow />} />

        {/* Educational Platform Routes */}
        <Route path="courses" element={<CoursesPage />} />
        <Route path="dashboard" element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Communication Routes (쪽지/친구) */}
        <Route path="messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="friends" element={
          <ProtectedRoute>
            <FriendsPage />
          </ProtectedRoute>
        } />

        {/* User & Account Routes */}
        <Route path="users/:userId" element={<UserProfilePage />} />
        <Route path="notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        <Route path="payment-history" element={
          <ProtectedRoute>
            <PaymentHistoryPage />
          </ProtectedRoute>
        } />

        {/* Protected Routes */}
        <Route path="mypage" element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        } />
        <Route path="upload" element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        } />
        <Route path="charge" element={
          <ProtectedRoute>
            <ChargePage />
          </ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
