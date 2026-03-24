import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminAuctions from './pages/AdminAuctions';
import AdminPainters from './pages/AdminPainters';
import PainterPanel from './pages/PainterPanel';
import UserProfile from './pages/UserProfile';

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/auctions" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auctions" element={<AuctionList />} />
      <Route path="/auctions/:id" element={<AuctionDetail />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/auctions" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminAuctions /></ProtectedRoute>
      } />
      <Route path="/admin/painters" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminPainters /></ProtectedRoute>
      } />

      {/* Painter */}
      <Route path="/painter/dashboard" element={
        <ProtectedRoute allowedRoles={['painter']}><PainterPanel /></ProtectedRoute>
      } />

      {/* User */}
      <Route path="/user/profile" element={
        <ProtectedRoute allowedRoles={['user']}><UserProfile /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/auctions" replace />} />
    </Routes>
  </>
);

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
