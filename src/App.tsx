// src/App.tsx
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import LoginPage from "./pages/LoginPage";
import FindDoctorsPage from "./pages/FindDoctorsPage";
import { useAuth } from "./AuthContext";
import { RequireAuth } from "./RequireAuth";
import DoctorDetailsPage from "./pages/DoctorDetailsPage";


function App() {
  const { user, logout } = useAuth();

  const isPatient = user?.role === "PATIENT";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="app-root">
      <nav className="app-nav">
        <div className="app-nav-left">
          {user && <Link to="/">CityCare Hospital</Link>}

          {user && isPatient && (
            <>
              <Link to="/find-doctors">Find Doctors</Link>
              <Link to="/my-bookings">My Bookings</Link>
            </>
          )}

          {user && isAdmin && <Link to="/admin">Admin</Link>}

          {!user && <Link to="/login">Login</Link>}
        </div>

        <div className="app-nav-right">
          {user && (
            <>
              <span style={{ fontSize: "0.85rem" }}>
                {user.role.toLowerCase()} – {user.email}
              </span>
              <button onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />

          <Route
  path="/doctor/:doctorId"
  element={
    <RequireAuth>
      {isPatient ? (
        <DoctorDetailsPage />
      ) : (
        <div className="card">Only patients can view this page.</div>
      )}
    </RequireAuth>
  }
/>


          <Route
            path="/find-doctors"
            element={
              <RequireAuth>
                {isPatient ? (
                  <FindDoctorsPage />
                ) : (
                  <div className="card">Only patients can view this page.</div>
                )}
              </RequireAuth>
            }
          />

          <Route
            path="/booking/:doctorId"
            element={
              <RequireAuth>
                {isPatient ? (
                  <BookingPage />
                ) : (
                  <div className="card">
                    Only patients can book appointments.
                  </div>
                )}
              </RequireAuth>
            }
          />

          <Route
            path="/my-bookings"
            element={
              <RequireAuth>
                {isPatient ? (
                  <MyBookingsPage />
                ) : (
                  <div className="card">
                    Only patients can view this page.
                  </div>
                )}
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                {isAdmin ? (
                  <AdminPage />
                ) : (
                  <div className="card">
                    Only admins can view this page.
                  </div>
                )}
              </RequireAuth>
            }
          />

          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;