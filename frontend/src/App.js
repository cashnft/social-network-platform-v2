import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import LoadingSpinner from "./components/LoadingSpinner";
import { useUser } from "./contexts/UserContext";

const HomePage = React.lazy(() => import("./pages/HomePage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const SignupPage = React.lazy(() => import("./pages/SignupPage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));

function RequireAuth({ children }) {
  const { user } = useUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const { user } = useUser();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/404" element={<NotFoundPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={user ? <Navigate to="/home" replace /> : <LandingPage />}
            />
            <Route
              path="/home"
              element={
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />

            <Route
              path="/notifications"
              element={
                <RequireAuth>
                  <NotificationsPage />
                </RequireAuth>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
