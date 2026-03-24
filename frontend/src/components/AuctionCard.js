import { Link } from 'react-router-dom';

const statusColors = {
  LIVE: 'bg-green-500',
  UPCOMING: 'bg-blue-500',
  ENDED: 'bg-gray-500',
  PAUSED: 'bg-yellow-500',
};

const AuctionCard = ({ auction }) => {
  const { _id, paintingName, image, category, status, currentBid, isFeatured, painter, endTime } = auction;

  const timeLeft = () => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Ended';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow ${isFeatured ? 'ring-2 ring-purple-500' : ''}`}>
      <div className="relative">
        <img src={image} alt={paintingName} className="w-full h-48 object-cover" />
        {isFeatured && (
          <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">⭐ Featured</span>
        )}
        <span className={`absolute top-2 right-2 text-white text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg truncate">{paintingName}</h3>
        <p className="text-sm text-gray-500">{category} · {painter?.name}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Current Bid</p>
            <p className="text-xl font-bold text-purple-700">${currentBid?.toLocaleString()}</p>
          </div>
          {status === 'LIVE' && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Ends in</p>
              <p className="text-sm font-semibold text-red-500">{timeLeft()}</p>
            </div>
          )}
        </div>
        <Link
          to={`/auctions/${_id}`}
          className="mt-3 block text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition"
        >
          {status === 'LIVE' ? 'Bid Now' : 'View Details'}
        </Link>
      </div>
    </div>
  );
};

export default AuctionCard;
