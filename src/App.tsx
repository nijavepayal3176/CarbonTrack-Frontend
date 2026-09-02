
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  GoogleOAuthProvider,
} from "@react-oauth/google";

import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import MyDevices from "./pages/MyDevices";
import DashboardLayout from "./layouts/DashboardLayout";
import Goals from "./pages/Goals";
import Leaderboard from "./pages/Leaderboard";
import EcoTips from "./pages/EcoTips";
import Reports from "./pages/Reports";
import AIAssistant from "./pages/AIAssistant";
import Notifications from "./pages/Notifications";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;

const App = () => {
  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID}
    >
      <Routes>

        {/* PUBLIC ROUTES */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* PROTECTED ROUTES */}

        <Route
          element={<ProtectedRoute />}
        >
          <Route
            element={<DashboardLayout />}
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/activities"
              element={<Activities />}
            />

            <Route
              path="/devices"
              element={<MyDevices />}
            />

            <Route
              path="/goals"
              element={<Goals />}
            />

            <Route
              path="/leaderboard"
              element={<Leaderboard />}
            />

            <Route
              path="/eco-tips"
              element={<EcoTips />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

            <Route
              path="/ai-assistant"
              element={<AIAssistant />}
            />

            {/* FIXED NOTIFICATIONS ROUTE */}

            <Route
              path="/notifications"
              element={<Notifications />}
            />
          </Route>
        </Route>

        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </GoogleOAuthProvider>
  );
};

export default App;
