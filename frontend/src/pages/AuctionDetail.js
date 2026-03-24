import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuction, updateCurrentBid, updateAuctionStatus } from '../redux/slices/auctionSlice';
import { getSocket, connectSocket } from '../utils/socket';
import API from '../utils/api';
import toast from 'react-hot-toast';

const statusColors = {
  LIVE: 'text-green-600',
  UPCOMING: 'text-blue-600',
  ENDED: 'text-gray-500',
  PAUSED: 'text-yellow-600'
};

const AuctionDetail = () => {

  const { id } = useParams();
  const dispatch = useDispatch();

  const { selectedAuction: auction, bids, loading } = useSelector((s) => s.auction);
  const { user, token } = useSelector((s) => s.auth);

  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [highlightBid, setHighlightBid] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  useEffect(() => {
    dispatch(fetchAuction(id));
  }, [dispatch, id]);

  // SOCKET CONNECTION
  useEffect(() => {

    const socket = token ? connectSocket(user?.id) : getSocket();

    if (!socket.connected) socket.connect();

    socket.emit('join:auction', id);

    socket.on('bid:new', (data) => {

      dispatch(updateCurrentBid(data));

      // blinking effect
      setHighlightBid(true);
      setTimeout(() => {
        setHighlightBid(false);
      }, 1500);

      toast.success(`🔥 New bid: $${data.amount} by ${data.bidder}`);

    });

    socket.on('auction:statusChange', (data) => {

      dispatch(updateAuctionStatus(data));

      toast(data.status === 'ENDED'
        ? '🏁 Auction has ended!'
        : `Auction is now ${data.status}`);

    });

    socket.on('auction:winner', (data) => {

      if (user && data.winnerId === user.id) {
        toast.success('🎉 Congratulations! You won this auction!');
      }

    });

    socket.on('bid:outbid', (data) => {
      toast.error(data.message);
    });

    return () => {

      socket.emit('leave:auction', id);
      socket.off('bid:new');
      socket.off('auction:statusChange');
      socket.off('auction:winner');
      socket.off('bid:outbid');

    };

  }, [id, token, user, dispatch]);

  // TIMER
  useEffect(() => {

    if (!auction) return;

    const interval = setInterval(() => {

      const diff = new Date(auction.endTime) - new Date();

      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setTimeLeft(
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      );

    }, 1000);

    return () => clearInterval(interval);

  }, [auction]);

  const handleBid = async (e) => {

    e.preventDefault();

    if (!token) {
      toast.error('Please login to bid');
      return;
    }

    setBidding(true);

    try {

      await API.post('/user/bid', {
        auctionId: id,
        amount: Number(bidAmount)
      });

      toast.success(`🔥 Bid of $${bidAmount} placed!`);
      setBidAmount('');

    } catch (err) {

      toast.error(err.response?.data?.message || 'Bid failed');

    } finally {

      setBidding(false);

    }

  };

  if (loading || !auction) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse bg-gray-200 rounded-xl h-96" />
      </div>
    );
  }

  const minBid = auction.currentBid + auction.minimumIncrement;
  const canBid = auction.status === 'LIVE' && user?.role === 'user';

  return (

    <div className="max-w-5xl mx-auto px-4 py-8">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* IMAGE */}

        <div>

          <img
            src={auction.image}
            alt={auction.paintingName}
            className="w-full rounded-2xl shadow-lg object-cover"
          />

        </div>

        {/* RIGHT SIDE */}

        <div className="space-y-6">

          <div>

            <div className="flex items-center gap-2 mb-2">

              <span className={`font-bold uppercase text-sm ${statusColors[auction.status]}`}>
                ● {auction.status}
              </span>

              <span className="text-gray-400">·</span>

              <span className="text-sm text-gray-500">
                {auction.category}
              </span>

            </div>

            <h1 className="text-3xl font-bold">
              {auction.paintingName}
            </h1>

            <p className="text-gray-600 mt-2">
              {auction.description}
            </p>

          </div>

          {/* CURRENT BID */}

          <div className={`rounded-xl p-5 border transition-all duration-300
            ${highlightBid ? 'bg-yellow-200 border-yellow-400 scale-105' : 'bg-purple-50 border-purple-200'}
          `}>

            <div className="flex justify-between items-center">

              <div>

                <p className="text-sm text-gray-500">
                  Current Bid
                </p>

                <p className="text-4xl font-bold text-purple-700">
                  🔥 ${auction.currentBid?.toLocaleString()}
                </p>

              </div>

              {auction.status === 'LIVE' && (

                <div className="text-right">

                  <p className="text-sm text-gray-500">
                    ⏳ Time Remaining
                  </p>

                  <p className="text-2xl font-mono font-bold text-red-500">
                    {timeLeft}
                  </p>

                </div>

              )}

            </div>

            <p className="text-xs text-gray-500 mt-2">
              Min. increment: ${auction.minimumIncrement} · Min. bid: ${minBid}
            </p>

          </div>

          {/* WINNER */}

          {auction.status === 'ENDED' && bids.length > 0 && (

            <div className="bg-green-50 border border-green-300 p-4 rounded-xl text-center">

              <h2 className="text-lg font-bold text-green-700">
                🏆 Auction Winner
              </h2>

              <p className="text-xl font-semibold mt-1">
                🎉 {bids[0].user?.name}
              </p>

              <p className="text-gray-600">
                Winning Bid: ${bids[0].amount}
              </p>

            </div>

          )}

          {/* BID FORM */}

          {canBid && (

            <form
              onSubmit={handleBid}
              className="bg-white rounded-xl p-5 shadow border"
            >

              <h3 className="font-semibold mb-3 text-gray-800">
                Place Your Bid
              </h3>

              <div className="flex gap-3">

                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={minBid}
                  placeholder={`Min $${minBid}`}
                  required
                  className="flex-1 border rounded-lg px-3 py-2 text-lg"
                />

                <button
                  type="submit"
                  disabled={bidding}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  {bidding ? 'Bidding...' : 'Bid!'}
                </button>

              </div>

            </form>

          )}

          {/* BID HISTORY */}

          <div>

            <h3 className="font-semibold text-gray-800 mb-3">
              Bid History ({bids.length})
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2">

              {bids.length === 0 ? (

                <p className="text-sm text-gray-400 text-center py-4">
                  No bids yet
                </p>

              ) : (

                bids.map((bid, i) => (

                  <div
                    key={bid._id || i}
                    className={`flex justify-between p-3 rounded-lg ${
                      i === 0
                        ? 'bg-yellow-50 border border-yellow-300'
                        : 'bg-gray-50'
                    }`}
                  >

                    <span>
                      {i === 0 && "🏆 "}
                      {bid.user?.name}
                    </span>

                    <span className="font-bold">
                      ${bid.amount?.toLocaleString()}
                    </span>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};

export default AuctionDetail;