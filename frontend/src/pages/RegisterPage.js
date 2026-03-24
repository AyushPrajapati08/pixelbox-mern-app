import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { registerUser, registerPainter } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'painter' ? 'painter' : 'user';
  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', portfolio: '', phone: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'user') {
      const result = await dispatch(registerUser(form));
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Account created!');
        navigate('/auctions');
      }
    } else {
      const result = await dispatch(registerPainter(form));
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Registered! Awaiting admin approval.');
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">🎨 PixelBox</h1>
        <p className="text-center text-gray-500 mb-6">Create your account</p>

        {/* Role toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {['user', 'painter'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition capitalize ${
                role === r ? 'bg-purple-600 text-white shadow' : 'text-gray-600'
              }`}
            >
              {r === 'user' ? '🎯 Bidder' : '🖌️ Painter'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'email', 'password', 'phone'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                required={field !== 'phone'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}

          {role === 'painter' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                <input
                  type="url"
                  value={form.portfolio}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                ⚠️ Painter accounts require admin approval before you can log in and list auctions.
              </p>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
