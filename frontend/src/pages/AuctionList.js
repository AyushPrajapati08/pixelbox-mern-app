import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuctions, setFilters } from '../redux/slices/auctionSlice';
import AuctionCard from '../components/AuctionCard';

const CATEGORIES = ['', 'Oil', 'Watercolor', 'Digital', 'Sculpture', 'Sketch', 'Acrylic', 'Other'];
const STATUSES = ['', 'LIVE', 'UPCOMING', 'ENDED'];

const AuctionList = () => {
  const dispatch = useDispatch();
  const { auctions, loading, total, pages, filters } = useSelector((s) => s.auction);
  const [page, setPage] = useState(1);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    dispatch(fetchAuctions({ ...filters, page, limit: 12 }));
  }, [dispatch, filters, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: localSearch }));
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🎨 Art Auctions</h1>
        <p className="text-gray-500">Discover and bid on unique artworks from talented painters</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-60">
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search paintings..."
            className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition">Search</button>
        </form>

        <select
          value={filters.status}
          onChange={(e) => { dispatch(setFilters({ status: e.target.value })); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>

        <select
          value={filters.category}
          onChange={(e) => { dispatch(setFilters({ category: e.target.value })); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>

        <span className="text-sm text-gray-500 ml-auto">{total} results</span>
      </div>

      {/* Auction Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🖼️</p>
          <p className="text-xl">No auctions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((a) => <AuctionCard key={a._id} auction={a} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                page === p ? 'bg-purple-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionList;
