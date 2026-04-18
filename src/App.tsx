import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsHubManager } from "@/hooks/useIsHubManager";
import DashboardLayout from "@/components/DashboardLayout";
import AdminLayout from "@/components/AdminLayout";
import HubLayout from "@/components/HubLayout";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import CartPage from "@/pages/CartPage";
import WishlistPage from "@/pages/WishlistPage";
import QuotesPage from "@/pages/QuotesPage";
import QuickQuotePage from "@/pages/QuickQuotePage";
import OrdersPage from "@/pages/OrdersPage";
import MyInventoryPage from "@/pages/MyInventoryPage";
import ProfilePage from "@/pages/ProfilePage";
import ContactPage from "@/pages/ContactPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminQuotes from "@/pages/admin/AdminQuotes";
import AdminWhatsappQuotes from "@/pages/admin/AdminWhatsappQuotes";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminSuppliers from "@/pages/admin/AdminSuppliers";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminProductImages from "@/pages/admin/AdminProductImages";
import AdminHubNetwork from "@/pages/admin/AdminHubNetwork";
import AdminOffers from "@/pages/admin/AdminOffers";
import NotFound from "@/pages/NotFound";
import PartnerApplicationPage from "@/pages/PartnerApplicationPage";
import HubDashboard from "@/pages/hub/HubDashboard";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  if (authLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function HubRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isHubManager, loading: roleLoading } = useIsHubManager();
  if (authLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isHubManager) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/quick-quote" element={<QuickQuotePage />} />
              </Route>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/partner" element={<PartnerApplicationPage />} />
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/quotes" element={<QuotesPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/inventory" element={<MyInventoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>
              <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/quotes" element={<AdminQuotes />} />
                <Route path="/admin/whatsapp-drafts" element={<AdminWhatsappQuotes />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/product-images" element={<AdminProductImages />} />
                <Route path="/admin/offers" element={<AdminOffers />} />
                <Route path="/admin/suppliers" element={<AdminSuppliers />} />
                <Route path="/admin/hubs" element={<AdminHubNetwork />} />
                <Route path="/admin/banners" element={<AdminBanners />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
              </Route>
              <Route element={<HubRoute><HubLayout /></HubRoute>}>
                <Route path="/hub" element={<HubDashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
