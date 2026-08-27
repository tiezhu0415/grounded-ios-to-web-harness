import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MobileShell } from '@/components/MobileShell';
import { useAppStore } from '@/store/useAppStore';
import Home from '@/pages/Home';
import Store from '@/pages/Store';
import Categories from '@/pages/Categories';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Favorites from '@/pages/Favorites';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Profile from '@/pages/Profile';
import Orders from '@/pages/Orders';
import OrderDetails from '@/pages/OrderDetails';
import EditProfile from '@/pages/EditProfile';
import EditAddress from '@/pages/EditAddress';
import DeleteAccount from '@/pages/DeleteAccount';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ResetPassword from '@/pages/ResetPassword';

const publicRoutes = ['/signin', '/signup', '/reset-password'];

function AppContent() {
  const user = useAppStore((s) => s.user);
  const location = useLocation();
  const isPublic = publicRoutes.includes(location.pathname);

  if (!user && !isPublic) {
    return <MobileShell showTabBar={false}><SignIn /></MobileShell>;
  }

  const showTabBar = ![
    '/checkout',
    '/signin',
    '/signup',
    '/reset-password',
    '/profile/edit',
    '/profile/address',
    '/profile/delete-account',
  ].includes(location.pathname) && !location.pathname.startsWith('/profile/orders/');

  return (
    <MobileShell showTabBar={showTabBar}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store" element={<Store />} />
        <Route path="/store/categories/:category" element={<Categories />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/orders" element={<Orders />} />
        <Route path="/profile/orders/:id" element={<OrderDetails />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/address" element={<EditAddress />} />
        <Route path="/profile/delete-account" element={<DeleteAccount />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileShell>
  );
}

export default function App() {
  return <AppContent />;
}
