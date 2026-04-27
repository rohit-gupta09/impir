import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsHubManager } from "@/hooks/useIsHubManager";
import { useIsSupplier } from "@/hooks/useIsSupplier";

const DashboardLayout = lazy(() => import("@/components/DashboardLayout"));
const AdminLayout = lazy(() => import("@/components/AdminLayout"));
const HubLayout = lazy(() => import("@/components/HubLayout"));
const SupplierLayout = lazy(() => import("@/components/SupplierLayout"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const QuotesPage = lazy(() => import("@/pages/QuotesPage"));
const QuickQuotePage = lazy(() => import("@/pages/QuickQuotePage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const MyInventoryPage = lazy(() => import("@/pages/MyInventoryPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminQuotes = lazy(() => import("@/pages/admin/AdminQuotes"));
const AdminWhatsappQuotes = lazy(() => import("@/pages/admin/AdminWhatsappQuotes"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminSuppliers = lazy(() => import("@/pages/admin/AdminSuppliers"));
const AdminBanners = lazy(() => import("@/pages/admin/AdminBanners"));
const AdminProductImages = lazy(() => import("@/pages/admin/AdminProductImages"));
const AdminHubNetwork = lazy(() => import("@/pages/admin/AdminHubNetwork"));
const AdminOffers = lazy(() => import("@/pages/admin/AdminOffers"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PartnerApplicationPage = lazy(() => import("@/pages/PartnerApplicationPage"));
const HubDashboard = lazy(() => import("@/pages/hub/HubDashboard"));
const SupplierDashboard = lazy(() => import("@/pages/supplier/SupplierDashboard"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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

function SupplierRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isSupplier, loading: roleLoading } = useIsSupplier();
  if (authLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSupplier) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<RouteLoader />}>
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
                  <Route path="/auth/callback" element={<AuthCallback />} />
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
                <Route element={<SupplierRoute><SupplierLayout /></SupplierRoute>}>
                  <Route path="/supplier" element={<SupplierDashboard />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
