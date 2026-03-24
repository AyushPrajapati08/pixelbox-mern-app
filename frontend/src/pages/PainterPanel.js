import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Oil', 'Watercolor', 'Digital', 'Sculpture', 'Sketch', 'Acrylic', 'Other'];

const PainterPanel = () => {
  const [profile, setProfile] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ paintingName: '', category: 'Oil', image: '', description: '', startingBid: '', minimumIncrement: '50', startTime: '', endTime: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, auctRes] = await Promise.all([
          API.get('/painter/profile'),
          API.get('/painter/auctions?limit=20'),
        ]);
        setProfile(profRes.data.painter);
        setAuctions(auctRes.data.auctions);
      } catch (err) { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/painter/auctions', form);
      toast.success('Auction created!');
      setAuctions((prev) => [res.data.auction, ...prev]);
      setShowForm(false);
      setForm({ paintingName: '', category: 'Oil', image: '', description: '', startingBid: '', minimumIncrement: '50', startTime: '', endTime: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this auction?')) return;
    await API.delete(`/painter/auctions/${id}`);
    toast.success('Deleted');
    setAuctions((prev) => prev.filter((a) => a._id !== id));
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {profile?.name?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.name}</h1>
            <p className="text-white/80">{profile?.email}</p>
            {profile?.bio && <p className="text-white/70 text-sm mt-1">{profile?.bio}</p>}
          </div>
        </div>
      </div>

      {/* New Auction Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Auctions</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
          {showForm ? 'Cancel' : '+ List Artwork'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border">
          <h3 className="col-span-2 font-bold text-lg">Create New Auction</h3>
          {[
            { key: 'paintingName', label: 'Painting Title', type: 'text' },
            { key: 'image', label: 'Image URL', type: 'url' },
            { key: 'startingBid', label: 'Starting Bid ($)', type: 'number' },
            { key: 'minimumIncrement', label: 'Min Increment ($)', type: 'number' },
            { key: 'startTime', label: 'Start Time', type: 'datetime-local' },
            { key: 'endTime', label: 'End Time', type: 'datetime-local' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div className="col-span-2 flex justify-end">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Create Auction</button>
          </div>
        </form>
      )}

      {/* Auctions Grid */}
      {auctions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🖼️</p>
          <p className="text-xl">No auctions yet. List your first artwork!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map((a) => (
            <div key={a._id} className="bg-white rounded-xl shadow p-4 border hover:shadow-md transition">
              <img src={a.image} alt={a.paintingName} className="w-full h-36 object-cover rounded-lg mb-3" />
              <h3 className="font-bold text-gray-900 truncate">{a.paintingName}</h3>
              <p className="text-sm text-gray-500 mb-2">{a.category}</p>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs text-gray-400">Current Bid</p>
                  <p className="text-lg font-bold text-purple-700">${a.currentBid}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  a.status === 'LIVE' ? 'bg-green-100 text-green-700' :
                  a.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                  a.status === 'ENDED' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
                  {a.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Link to={`/auctions/${a._id}`} className="flex-1 text-center text-xs bg-purple-100 text-purple-700 py-1.5 rounded-lg hover:bg-purple-200 transition">View</Link>
                {a.status === 'UPCOMING' && (
                  <button onClick={() => handleDelete(a._id)} className="flex-1 text-xs bg-red-100 text-red-600 py-1.5 rounded-lg hover:bg-red-200 transition">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PainterPanel;
