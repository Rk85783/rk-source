import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireSection } from "./components/RequireSection";
import { AuthProvider } from "./context/AuthProvider";
import { Activate } from "./pages/Activate";
import { AdminManagement } from "./pages/AdminManagement";
import { CarrierManagement } from "./pages/CarrierManagement";
import { DriverManagement } from "./pages/DriverManagement";
import { Drivers } from "./pages/Drivers";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Network } from "./pages/Network";
import { Overview } from "./pages/Overview";
import { Register } from "./pages/Register";
import { Settings } from "./pages/Settings";
import { ShipperManagement } from "./pages/ShipperManagement";
import { UserManagement } from "./pages/UserManagement";

const gated = (section, element) => (
  <RequireSection section={section}>{element}</RequireSection>
);

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/activate" element={<Activate />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="users" element={gated("users", <UserManagement />)} />
        <Route path="admins" element={gated("admins", <AdminManagement />)} />
        <Route
          path="shippers"
          element={gated("shippers", <ShipperManagement />)}
        />
        <Route
          path="carriers"
          element={gated("carriers", <CarrierManagement />)}
        />
        <Route
          path="drivers"
          element={gated("drivers", <DriverManagement />)}
        />
        <Route path="network" element={gated("network", <Network />)} />
        <Route path="my-drivers" element={gated("myDrivers", <Drivers />)} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AuthProvider>
);

export default App;
