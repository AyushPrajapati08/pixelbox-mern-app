import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { disconnectSocket } from '../utils/socket';

const Navbar = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    disconnectSocket();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'painter') return '/painter/dashboard';
    return '/user/profile';
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/auctions" className="text-2xl font-bold text-purple-400 tracking-wide">
          🎨 PixelBox
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/auctions" className="hover:text-purple-300 transition">Auctions</Link>

          {user ? (
            <>
              <Link to={getDashboardLink()} className="hover:text-purple-300 transition">
                Dashboard
              </Link>
              <span className="text-xs bg-purple-700 px-2 py-1 rounded-full uppercase">
                {user.role}
              </span>
              <span className="text-sm text-gray-300">{user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-purple-300 transition">Login</Link>
              <Link
                to="/register"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-1 rounded transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
