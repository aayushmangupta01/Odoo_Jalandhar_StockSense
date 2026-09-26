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
        <Route path="/dashboard" element={<ProtectedInventoryPage><Dashboard /></ProtectedInventoryPage>} />

        {/* Inventory Module Routes */}
        <Route path="/inventory/products" element={<ProtectedInventoryPage><ProductsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/products/:id" element={<ProtectedInventoryPage><ProductDetailPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/categories" element={<ProtectedInventoryPage><CategoriesPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/stock" element={<ProtectedInventoryPage><CurrentStockPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/receipts" element={<ProtectedInventoryPage><ReceiptsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/deliveries" element={<ProtectedInventoryPage><DeliveriesPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/adjustments" element={<ProtectedInventoryPage><AdjustmentsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/physical-verification" element={<ProtectedInventoryPage><PhysicalVerificationPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/opening-stock" element={<ProtectedInventoryPage><OpeningStockPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/movements" element={<ProtectedInventoryPage><StockMovementsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/ledger" element={<ProtectedInventoryPage><StockLedgerPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/analytics" element={<ProtectedInventoryPage><InventoryAnalyticsPage /></ProtectedInventoryPage>} />

        {/* Inventory Intelligence Routes */}
        <Route path="/inventory/intelligence/anomalies" element={<ProtectedInventoryPage><AnomaliesPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/intelligence/forecast" element={<ProtectedInventoryPage><ForecastPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/intelligence/location" element={<ProtectedInventoryPage><LocationIntelligencePage /></ProtectedInventoryPage>} />
        <Route path="/inventory/intelligence/recommendations" element={<ProtectedInventoryPage><SmartRecommendationsPage /></ProtectedInventoryPage>} />
        <Route path="/inventory/stock-detective" element={<ProtectedInventoryPage><StockDetectivePage /></ProtectedInventoryPage>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;