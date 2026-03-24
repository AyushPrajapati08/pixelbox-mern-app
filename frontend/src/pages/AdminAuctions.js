import { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AdminAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [painters, setPainters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    paintingName: '',
    category: 'Oil',
    image: '',
    description: '',
    painterId: '',
    startingBid: '',
    minimumIncrement: '50',
    startTime: '',
    endTime: ''
  });

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/auctions?limit=50');
      setAuctions(res.data.auctions);
    } catch {
      toast.error('Could not load auctions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    API.get('/admin/painters').then((r) => setPainters(r.data.painters));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const now = new Date();

    // Empty field check
    if (
      !form.paintingName ||
      !form.image ||
      !form.painterId ||
      !form.startingBid ||
      !form.minimumIncrement ||
      !form.startTime ||
      !form.endTime
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Starting bid validation
    if (form.startingBid <= 0) {
      toast.error("Please enter a valid starting bid (greater than $0).");
      return;
    }

    // Increment validation
    if (form.minimumIncrement <= 0) {
      toast.error("Minimum increment must be at least $1.");
      return;
    }

    // Start time validation
    if (start < now) {
      toast.error("Start time cannot be in the past.");
      return;
    }

    // End time validation
    if (end <= start) {
      toast.error("End time must be later than the start time.");
      return;
    }

    try {
      await API.post('/admin/auctions', form);
      toast.success('Auction created successfully!');

      setShowForm(false);

      setForm({
        paintingName: '',
        category: 'Oil',
        image: '',
        description: '',
        painterId: '',
        startingBid: '',
        minimumIncrement: '50',
        startTime: '',
        endTime: ''
      });

      fetchAuctions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) return;

    await API.delete(`/admin/auctions/${id}`);
    toast.success('Auction deleted successfully.');
    fetchAuctions();
  };

  const handleStatus = async (id, status) => {
    await API.patch(`/admin/auctions/${id}/status`, { status });
    toast.success(`Auction status changed to ${status}`);
    fetchAuctions();
  };

  const handleFeature = async (id) => {
    await API.patch(`/admin/auctions/${id}/feature`);
    toast.success('Featured status updated.');
    fetchAuctions();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Auctions</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          {showForm ? 'Cancel' : '+ New Auction'}
        </button>
      </div>

      {/* Create Auction Form */}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >

          <h2 className="col-span-2 font-bold text-lg text-gray-800">
            Create Auction
          </h2>

          {[
            { key: 'paintingName', label: 'Painting Name', type: 'text' },
            { key: 'image', label: 'Image URL', type: 'url' },
            { key: 'startingBid', label: 'Starting Bid ($)', type: 'number' },
            { key: 'minimumIncrement', label: 'Min Increment ($)', type: 'number' },
            { key: 'startTime', label: 'Start Time', type: 'datetime-local' },
            { key: 'endTime', label: 'End Time', type: 'datetime-local' },
          ].map(({ key, label, type }) => (

            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {label}
              </label>

              <input
                type={type}
                required
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              />
            </div>

          ))}

          {/* Category */}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Category
            </label>

            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >

              {['Oil', 'Watercolor', 'Digital', 'Sculpture', 'Sketch', 'Acrylic', 'Other']
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}

            </select>
          </div>

          {/* Painter */}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Painter
            </label>

            <select
              required
              value={form.painterId}
              onChange={(e) =>
                setForm({ ...form, painterId: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >

              <option value="">Select painter...</option>

              {painters.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}

            </select>
          </div>

          {/* Description */}

          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Create Auction
            </button>
          </div>

        </form>
      )}

      {/* Auction Table */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>
                {['Image', 'Painting', 'Painter', 'Current Bid', 'Status', 'Featured', 'Actions']
                  .map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-gray-600"
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : auctions.map((a) => (

                <tr key={a._id} className="border-t hover:bg-gray-50">

                  <td className="px-4 py-3">
                    <img
                      src={a.image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {a.paintingName}
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {a.painter?.name}
                  </td>

                  <td className="px-4 py-3 font-bold text-purple-700">
                    ${a.currentBid}
                  </td>

                  <td className="px-4 py-3">

                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      a.status === 'LIVE'
                        ? 'bg-green-100 text-green-700'
                        : a.status === 'UPCOMING'
                        ? 'bg-blue-100 text-blue-700'
                        : a.status === 'ENDED'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>

                      {a.status}

                    </span>

                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleFeature(a._id)}
                      className={`text-sm ${
                        a.isFeatured
                          ? 'text-purple-600 font-bold'
                          : 'text-gray-400'
                      }`}
                    >
                      {a.isFeatured ? '⭐' : '☆'}
                    </button>
                  </td>

                  <td className="px-4 py-3">

                    <div className="flex gap-1 flex-wrap">

                      {a.status === 'LIVE' && (
                        <button
                          onClick={() =>
                            handleStatus(a._id, 'PAUSED')
                          }
                          className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded"
                        >
                          Pause
                        </button>
                      )}

                      {a.status === 'PAUSED' && (
                        <button
                          onClick={() =>
                            handleStatus(a._id, 'LIVE')
                          }
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                        >
                          Resume
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(a._id)}
                        className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded"
                      >
                        Delete
                      </button>

                    </div>

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

export default AdminAuctions;