import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/protected-route"
import Unauthorized from "./pages/auth/Unauthorized"

// Auth Pages
import Login from "./pages/auth/Login"
// import Register from "./pages/auth/Register"

// Admin Pages
import AdminDashboard from "./pages/roleMangement/AdminDashboard"
import EditUserRoles from "./pages/roleMangement/EditUserRoles"
import CreateUser from "./pages/roleMangement/CreateUser"

// SharePoint Pages
import SharepointShow from "./pages/sharepoint-show-enhanced"
import SharepointForm from "./pages/sharepoint-form"
import SharepointDetail from "./pages/sharepoint-detail-enhanced"
import SharepointEdit from "./pages/sharepoint-edit"
import SharepointAssigned from "./pages/sharepoint-assigned"

// User Pages
import ProfilePage from "./pages/user/profile-page"
import SettingsPage from "./pages/user/settings-page"

function App() {
  const adminRoles = ["Admin"]
  const productionRoles = [
    "User",
    "Manager",
    "Admin",
    "Informatic Systems Staff",
    "Plant manager",
    "Engineering Manager",
    "Project Manager",
    "Business Manager",
    "Operations director",
    "Purchasing Manager",
    "Quality Manager",
    "Maintenance Manager",
 
    "Maintenance Staff",
    "Health & Safety Staff",
    "Quality Manager",
    "Purchasing Staff",
    "Logistics Staff",
    "Quality Staff",
  ]

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Home route - redirect to sharepoint list */}
        <Route
          path="/"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointShow />
            </ProtectedRoute>
          }
        />

        {/* SharePoint routes */}
        <Route
          path="/sharepoint"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointShow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sharepoint/create"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sharepoint/:id"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sharepoint/:id/edit"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sharepoint/assigned"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointAssigned />
            </ProtectedRoute>
          }
        />

        {/* User profile routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={adminRoles}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-user/:license"
          element={
            <ProtectedRoute requiredRoles={adminRoles}>
              <EditUserRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-user"
          element={
            <ProtectedRoute requiredRoles={adminRoles}>
              <CreateUser />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
