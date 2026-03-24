import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin, loginPainter, loginUser } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'painter') navigate('/painter/dashboard');
      else navigate('/auctions');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const actions = { admin: loginAdmin, painter: loginPainter, user: loginUser };
    const result = await dispatch(actions[form.role]({ email: form.email, password: form.password }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Welcome back!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎨 PixelBox</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* Role Selector */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {['user', 'painter', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setForm({ ...form, role })}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition capitalize ${
                form.role === role ? 'bg-purple-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-600 hover:underline font-medium">
              Register
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            Want to list art?{' '}
            <Link to="/register?role=painter" className="text-purple-500 hover:underline">
              Register as Painter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
