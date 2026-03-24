import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, color, icon }) => (
  <div className={`${color} text-white rounded-xl p-5 shadow`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [painters, setPainters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, auctRes, paintRes] = await Promise.all([
          API.get('/admin/dashboard'),
          API.get('/admin/auctions?limit=5'),
          API.get('/admin/painters?isApproved=false&limit=5'),
        ]);
        setStats(dashRes.data.stats);
        setAuctions(auctRes.data.auctions);
        setPainters(paintRes.data.painters);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (painterId, approve) => {
    try {
      await API.patch(`/admin/painters/${painterId}/approve`, { isApproved: approve });
      toast.success(approve ? 'Painter approved!' : 'Painter rejected');
      setPainters((prev) => prev.filter((p) => p._id !== painterId));
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} color="bg-blue-600" icon="👥" />
          <StatCard label="Total Painters" value={stats.totalPainters} color="bg-purple-600" icon="🖌️" />
          <StatCard label="Live Auctions" value={stats.liveAuctions} color="bg-green-600" icon="🔴" />
          <StatCard label="Total Revenue" value={`$${stats.totalRevenue?.toLocaleString()}`} color="bg-orange-500" icon="💰" />
          <StatCard label="Total Auctions" value={stats.totalAuctions} color="bg-indigo-600" icon="🎨" />
          <StatCard label="Total Bids" value={stats.totalBids} color="bg-pink-600" icon="🔨" />
          <StatCard label="Ended Auctions" value={stats.endedAuctions} color="bg-gray-600" icon="✅" />
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Manage Auctions', path: '/admin/auctions', icon: '🎨', desc: 'Create, edit, pause, feature auctions' },
          { label: 'Manage Painters', path: '/admin/painters', icon: '🖌️', desc: 'Approve/reject painter registrations' },
          { label: 'Manage Users', path: '/admin/users', icon: '👥', desc: 'View all registered users' },
        ].map((item) => (
          <Link key={item.path} to={item.path} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition border hover:border-purple-300">
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-bold text-gray-900">{item.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Pending Painters */}
      {painters.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5 mb-8">
          <h2 className="text-xl font-bold mb-4 text-amber-600">⏳ Pending Painter Approvals ({painters.length})</h2>
          <div className="space-y-3">
            {painters.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.email}</p>
                  {p.bio && <p className="text-xs text-gray-400 mt-1">{p.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(p._id, true)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition">Approve</button>
                  <button onClick={() => handleApprove(p._id, false)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Auctions */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Auctions</h2>
          <Link to="/admin/auctions" className="text-purple-600 hover:underline text-sm">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                {['Painting', 'Painter', 'Current Bid', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auctions.map((a) => (
                <tr key={a._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.paintingName}</td>
                  <td className="px-4 py-3 text-gray-500">{a.painter?.name}</td>
                  <td className="px-4 py-3 font-bold text-purple-700">${a.currentBid}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      a.status === 'LIVE' ? 'bg-green-100 text-green-700' :
                      a.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                      a.status === 'ENDED' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/auctions/${a._id}`} className="text-purple-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
