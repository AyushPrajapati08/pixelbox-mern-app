import { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [bids, setBids] = useState([]);
  const [wins, setWins] = useState([]);
  const [tab, setTab] = useState('bids');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    const load = async () => {
      const [profRes, bidsRes, winsRes] = await Promise.all([
        API.get('/user/profile'),
        API.get('/user/bids?limit=20'),
        API.get('/user/wins'),
      ]);
      setProfile(profRes.data.user);
      setBids(bidsRes.data.bids);
      setWins(winsRes.data.auctions);
      setForm({ name: profRes.data.user.name, phone: profRes.data.user.phone });
    };
    load().catch(() => toast.error('Failed to load profile'));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await API.put('/user/profile', form);
    setProfile(res.data.user);
    setEditing(false);
    toast.success('Profile updated!');
  };

  if (!profile) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {profile.name?.[0]}
            </div>
            <div>
              {editing ? (
                <form onSubmit={handleUpdate} className="flex gap-2 items-center">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-white/60 text-sm" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone" className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-white/60 text-sm" />
                  <button type="submit" className="bg-white text-purple-700 text-xs px-3 py-1 rounded font-semibold">Save</button>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-white/80">{profile.email}</p>
                  {profile.phone && <p className="text-white/70 text-sm">{profile.phone}</p>}
                </>
              )}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="flex gap-6 mt-4 text-sm">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="opacity-70">Total Bids</p>
            <p className="text-xl font-bold">{bids.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="opacity-70">Auctions Won</p>
            <p className="text-xl font-bold">{wins.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['bids', 'wins'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg capitalize font-medium text-sm transition ${tab === t ? 'bg-purple-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
            {t === 'bids' ? `🔨 My Bids (${bids.length})` : `🏆 Won (${wins.length})`}
          </button>
        ))}
      </div>

      {tab === 'bids' ? (
        <div className="space-y-3">
          {bids.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🔨</p>
              <p>No bids placed yet. <Link to="/auctions" className="text-purple-600 hover:underline">Browse auctions</Link></p>
            </div>
          ) : bids.map((bid) => (
            <div key={bid._id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4 hover:shadow-md transition">
              <img src={bid.auction?.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-semibold">{bid.auction?.paintingName}</p>
                <p className="text-sm text-gray-500">{new Date(bid.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-700">${bid.amount}</p>
                <span className={`text-xs ${bid.auction?.status === 'LIVE' ? 'text-green-600' : 'text-gray-400'}`}>
                  {bid.auction?.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {wins.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🏆</p>
              <p>No wins yet. Keep bidding!</p>
            </div>
          ) : wins.map((auction) => (
            <div key={auction._id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4 border-l-4 border-yellow-400">
              <img src={auction.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-semibold">{auction.paintingName}</p>
                <p className="text-sm text-gray-500">by {auction.painter?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">${auction.currentBid}</p>
                <p className="text-xs text-gray-400">Won!</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
