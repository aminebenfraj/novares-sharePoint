import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/protected-route"
import Unauthorized from "./pages/auth/Unauthorized"

// Auth Pages
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

// Admin Pages
import AdminDashboard from "./pages/roleMangement/AdminDashboard"
import EditUserRoles from "./pages/roleMangement/EditUserRoles"
import CreateUser from "./pages/roleMangement/CreateUser"
import SharepointForm from "./pages/sharepoint-form"

// SharePoint Pages
import SharepointShow from "../src/pages/sharepoint-show"
import SharePointCreatePage from "../src/pages/sharepoint-form"
import SharepointDetail from "../src/pages/sharepoint-detail"

// User Pages
import ProfilePage from "./pages/user/profile-page"
import SettingsPage from "./pages/user/settings-page"

function App() {
  const adminRoles = ["Admin"]
  const productionRoles = [
    "Manager",
    "Admin", 
    "PRODUCCION", 
    "Manufacturing Eng. Manager", 
    "Manufacturing Eng. Leader",
    "Project Manager",
    "Business Manager",
    "Financial Leader",
    "Methodes UAP1&3",
    "Methodes UAP2",
    "Maintenance Manager",
    "Maintenance Leader UAP2",
    "Prod. Plant Manager UAP1",
    "Prod. Plant Manager UAP2",
    "Quality Manager",
    "Quality Leader UAP1",
    "Quality Leader UAP2",
    "Quality Leader UAP3"
  ]
  const logisticRoles = ["Admin"]
  const inventoryRoles = ["Admin"]
  const qualityRoles = ["Admin"]

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Home route */}
        <Route
          path="/"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointForm />
            </ProtectedRoute>
          }
        />

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
              <SharePointCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sharepoint/details/:id"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <SharepointDetail />
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