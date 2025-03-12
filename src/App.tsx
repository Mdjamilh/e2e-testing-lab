import type { ReactNode } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router";
import { AuthProvider, useAuth } from "./state/auth";
import { CartProvider, useCart } from "./state/cart";
import { LoginPage } from "./pages/LoginPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function Header() {
  const { session, signOut } = useAuth();
  const { totals } = useCart();
  if (!session) return null;
  return (
    <header className="site-header">
      <Link className="brand" to="/">
        Clinic Supplies
      </Link>
      <nav aria-label="Main">
        <NavLink to="/" end>
          Products
        </NavLink>
        <NavLink to="/cart">
          Cart <span className="badge">{totals.itemCount}</span>
          <span className="visually-hidden"> items</span>
        </NavLink>
      </nav>
      <div className="user">
        <span>{session.user.name}</span>
        <button type="button" className="button link" onClick={signOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

function Protected({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <Header />
      {children}
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Protected><ProductsPage /></Protected>} />
            <Route path="/cart" element={<Protected><CartPage /></Protected>} />
            <Route path="/checkout" element={<Protected><CheckoutPage /></Protected>} />
            <Route path="/orders/:orderId" element={<Protected><ConfirmationPage /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
