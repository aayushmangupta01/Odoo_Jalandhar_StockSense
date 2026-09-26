import React from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "../pages/dashboard/dashboard";
import InventoryLayout from "../components/layout/InventoryLayout";
import { authApi } from "../services/authApi";

import ProductsPage from "../pages/inventory/ProductsPage";
import ProductDetailPage from "../pages/inventory/ProductDetailPage";
import CategoriesPage from "../pages/inventory/CategoriesPage";
import CurrentStockPage from "../pages/inventory/CurrentStockPage";
import ReceiptsPage from "../pages/inventory/ReceiptsPage";
import DeliveriesPage from "../pages/inventory/DeliveriesPage";
import AdjustmentsPage from "../pages/inventory/AdjustmentsPage";
import PhysicalVerificationPage from "../pages/inventory/PhysicalVerificationPage";
import OpeningStockPage from "../pages/inventory/OpeningStockPage";
import StockMovementsPage from "../pages/inventory/StockMovementsPage";
import StockLedgerPage from "../pages/inventory/StockLedgerPage";
import InventoryAnalyticsPage from "../pages/inventory/InventoryAnalyticsPage";

import AnomaliesPage from "../pages/inventory/intelligence/AnomaliesPage";
import ForecastPage from "../pages/inventory/intelligence/ForecastPage";
import LocationIntelligencePage from "../pages/inventory/intelligence/LocationIntelligencePage";
import SmartRecommendationsPage from "../pages/inventory/intelligence/SmartRecommendationsPage";
import StockDetectivePage from "../pages/inventory/StockDetectivePage";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import ForgotPassword from "../pages/Login/ForgotPassword";
import OTPVerification from "../pages/Login/OTPVerification";
import ResetPassword from "../pages/Login/ResetPassword";
import StaffDashboard from "../pages/dashboard/StaffDashboard";
import { authApi as currentAuthApi } from "../services/authApi";
import {
  AdjustmentRequestsPage,
  InternalTransfersPage,
  MyActivityPage,
  StockAlertsPage,
} from "../pages/inventory/RoleWorkflowsPage";
import { AdminUsersPage, AuditLogsPage } from "../pages/admin/AdminManagementPages";

function RootRoute() {
  return <Navigate to={authApi.getCurrentUser() ? "/dashboard" : "/login"} replace />;
}

function RequireAuth({ children }) {
  const location = useLocation();

  if (!authApi.getCurrentUser()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const location = useLocation();
  const user = currentAuthApi.getCurrentUser();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRoute() {
  return currentAuthApi.getCurrentUser()?.role === "staff"
    ? <StaffDashboard />
    : <Dashboard />;
}

function AdminPage({ children }) {
  return <RequireAdmin><InventoryLayout>{children}</InventoryLayout></RequireAdmin>;
}

function ProtectedInventoryPage({ children }) {
  return (
    <RequireAuth>
      <InventoryLayout>{children}</InventoryLayout>
    </RequireAuth>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={<RootRoute />} />
        <Route path="/dashboard" element={<ProtectedInventoryPage><DashboardRoute /></ProtectedInventoryPage>} />

        {/* Inventory Module Routes */}
        <Route path="/inventory/products" element={<ProtectedInventoryPage><ProductsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/products/:id" element={<ProtectedInventoryPage><ProductDetailPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/categories" element={<AdminPage><CategoriesPage /></AdminPage>} />
        <Route path="/inventory/stock" element={<ProtectedInventoryPage><CurrentStockPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/receipts" element={<ProtectedInventoryPage><ReceiptsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/deliveries" element={<ProtectedInventoryPage><DeliveriesPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/transfers" element={<ProtectedInventoryPage><InternalTransfersPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/adjustment-requests" element={<ProtectedInventoryPage><AdjustmentRequestsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/alerts" element={<ProtectedInventoryPage><StockAlertsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/my-activity" element={<ProtectedInventoryPage><MyActivityPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/adjustments" element={<AdminPage><AdjustmentsPage /></AdminPage>} />
        <Route path="/inventory/physical-verification" element={<AdminPage><PhysicalVerificationPage /></AdminPage>} />
        <Route path="/inventory/opening-stock" element={<AdminPage><OpeningStockPage /></AdminPage>} />
        <Route path="/inventory/movements" element={<AdminPage><StockMovementsPage /></AdminPage>} />
        <Route path="/inventory/ledger" element={<AdminPage><StockLedgerPage /></AdminPage>} />
        <Route path="/inventory/analytics" element={<AdminPage><InventoryAnalyticsPage /></AdminPage>} />

        {/* Inventory Intelligence Routes */}
        <Route path="/inventory/intelligence/anomalies" element={<AdminPage><AnomaliesPage /></AdminPage>} />
        <Route path="/inventory/intelligence/forecast" element={<AdminPage><ForecastPage /></AdminPage>} />
        <Route path="/inventory/intelligence/location" element={<AdminPage><LocationIntelligencePage /></AdminPage>} />
        <Route path="/inventory/intelligence/recommendations" element={<AdminPage><SmartRecommendationsPage /></AdminPage>} />
        <Route path="/inventory/stock-detective" element={<AdminPage><StockDetectivePage /></AdminPage>} />
        <Route path="/inventory/audit-logs" element={<AdminPage><AuditLogsPage /></AdminPage>} />
        <Route path="/admin/users" element={<AdminPage><AdminUsersPage /></AdminPage>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;