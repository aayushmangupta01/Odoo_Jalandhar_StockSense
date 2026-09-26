import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/dashboard/Dashboard";
import InventoryLayout from "../components/layout/InventoryLayout";

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

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Dashboard route (Owned by Teammate) */}
        <Route path="/" element={<Dashboard />} />

        {/* Inventory Module Routes */}
        <Route path="/inventory/products" element={<InventoryLayout><ProductsPage /></InventoryLayout>} />
        <Route path="/inventory/products/:id" element={<InventoryLayout><ProductDetailPage /></InventoryLayout>} />
        <Route path="/inventory/categories" element={<InventoryLayout><CategoriesPage /></InventoryLayout>} />
        <Route path="/inventory/stock" element={<InventoryLayout><CurrentStockPage /></InventoryLayout>} />
        <Route path="/inventory/receipts" element={<InventoryLayout><ReceiptsPage /></InventoryLayout>} />
        <Route path="/inventory/deliveries" element={<InventoryLayout><DeliveriesPage /></InventoryLayout>} />
        <Route path="/inventory/adjustments" element={<InventoryLayout><AdjustmentsPage /></InventoryLayout>} />
        <Route path="/inventory/physical-verification" element={<InventoryLayout><PhysicalVerificationPage /></InventoryLayout>} />
        <Route path="/inventory/opening-stock" element={<InventoryLayout><OpeningStockPage /></InventoryLayout>} />
        <Route path="/inventory/movements" element={<InventoryLayout><StockMovementsPage /></InventoryLayout>} />
        <Route path="/inventory/ledger" element={<InventoryLayout><StockLedgerPage /></InventoryLayout>} />
        <Route path="/inventory/analytics" element={<InventoryLayout><InventoryAnalyticsPage /></InventoryLayout>} />

        {/* Inventory Intelligence Routes */}
        <Route path="/inventory/intelligence/anomalies" element={<InventoryLayout><AnomaliesPage /></InventoryLayout>} />
        <Route path="/inventory/intelligence/forecast" element={<InventoryLayout><ForecastPage /></InventoryLayout>} />
        <Route path="/inventory/intelligence/location" element={<InventoryLayout><LocationIntelligencePage /></InventoryLayout>} />
        <Route path="/inventory/intelligence/recommendations" element={<InventoryLayout><SmartRecommendationsPage /></InventoryLayout>} />
        <Route path="/inventory/stock-detective" element={<InventoryLayout><StockDetectivePage /></InventoryLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;