import { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AdminPainters = () => {
  const [painters, setPainters] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchPainters = async () => {
  setLoading(true);
  try {
    const params =
      filter === 'pending'
        ? '?isApproved=false'
        : filter === 'approved'
        ? '?isApproved=true'
        : '';

    const query = params ? `${params}&limit=50` : `?limit=50`;

    const res = await API.get(`/admin/painters${query}`);
    setPainters(res.data.painters);
  } catch {
    toast.error('Failed to load painters');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchPainters(); }, [filter]);

  const handleApprove = async (id, approve) => {
    await API.patch(`/admin/painters/${id}/approve`, { isApproved: approve });
    toast.success(approve ? 'Approved!' : 'Rejected');
    fetchPainters();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Painters</h1>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'approved'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${filter === f ? 'bg-purple-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {painters.map((p) => (
            <div key={p._id} className="bg-white rounded-xl shadow p-5 border hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                {p.profileImage ? (
                  <img src={p.profileImage} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                    {p.name?.[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.email}</p>
                </div>
              </div>
              {p.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.bio}</p>}
              {p.portfolio && (
                <a href={p.portfolio} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline block mb-3">Portfolio →</a>
              )}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.isApproved ? '✅ Approved' : '⏳ Pending'}
                </span>
                <div className="flex gap-2">
                  {!p.isApproved && (
                    <button onClick={() => handleApprove(p._id, true)} className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">Approve</button>
                  )}
                  {p.isApproved && (
                    <button onClick={() => handleApprove(p._id, false)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition">Revoke</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {p.auctions?.length || 0} auctions · Joined {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPainters;
