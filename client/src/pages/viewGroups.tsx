"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Clock, Users, MapPin, X, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import OrderService from "services/orderService";
import VerificationModal from "../components/VerificationModal";

interface Order {
  id: string;
  restaurant: string;
  expiration: string;
  loc: string;
  participants?: string[];
  owner_id: string;
  is_open: boolean;
}

export default function ViewGroups() {
  const navigate = useNavigate();
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Regenstein Library");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const orderService = new OrderService();

  const locations = [
    "Regenstein Library",
    "Harper Library",
    "John Crerar Library",
  ];

  const userId = localStorage.getItem("userId");

  // Fetch orders when component mounts or location changes
  useEffect(() => {
    fetchOrders();
  }, [selectedLocation]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orders = await orderService.getOrders(selectedLocation);
      setOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load groups. Please try again later.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    // Check if user is logged in with profile
    if (!userEmail) {
      setIsVerificationOpen(true);
    } else if (!userName) {
      // User verified email but hasn't set profile
      navigate("/record-info");
    } else {
      // User has email and profile, go directly to create page
      navigate("/create");
    }
  };

  const handleJoinClick = async (orderId: string) => {
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");
    const userId = localStorage.getItem("userId");

    if (!userEmail) {
      setIsVerificationOpen(true);
    } else if (!userName) {
      // Store the order ID to join after profile setup
      localStorage.setItem("pendingJoinOrderId", orderId);
      navigate("/record-info");
    } else if (userId) {
      try {
        const result = await orderService.joinOrder(userId, orderId);
        if (result.success) {
          await fetchOrders();
        } else {
          setError(result.error || "Failed to join group");
        }
      } catch (err) {
        setError("Failed to join group. Please try again.");
      }
    }
  };

  const handleLeaveClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsLeaveModalOpen(true);
  };

  const handleLeaveConfirm = async () => {
    if (!userId || !selectedOrderId) return;

    try {
      const result = await orderService.leaveOrder(userId, selectedOrderId);
      if (result.success) {
        await fetchOrders();
      } else {
        setError(result.error || "Failed to leave group");
      }
    } catch (err) {
      setError("Failed to leave group. Please try again.");
    } finally {
      setIsLeaveModalOpen(false);
    }
  };

  const handleConfirmClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsConfirmModalOpen(false);
    if (selectedOrderId) {
      try {
        // Update the order status in the backend
        const result = await orderService.updateOrderStatus(selectedOrderId, false);
        if (result.success) {
          // Update the local state
          setOrders(orders.map(order =>
            order.id === selectedOrderId
              ? { ...order, is_open: false }
              : order
          ));
          // Navigate to the order details page
          navigate(`/order/${selectedOrderId}`);
        } else {
          setError("Failed to confirm order. Please try again.");
        }
      } catch (err) {
        console.error("Error confirming order:", err);
        setError("Failed to confirm order. Please try again.");
      }
    }
  };

  const handleVerified = () => {
    // Check if user has a profile
    const userName = localStorage.getItem("userName");
    const pendingOrderId = localStorage.getItem("pendingJoinOrderId");

    if (!userName) {
      // User needs to fill profile
      navigate("/record-info");
    } else if (pendingOrderId) {
      // Clear the pending order ID and join the group
      localStorage.removeItem("pendingJoinOrderId");
      handleJoinClick(pendingOrderId);
    } else {
      // User already has a profile
      navigate("/create");
    }
  };

  // Format the time remaining for an order
  const formatTimeRemaining = (expirationDate: string): { minutes: number; displayTime: string } => {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const minutesRemaining = Math.floor(
      (expiration.getTime() - now.getTime()) / 60000
    );

    if (minutesRemaining < 60) {
      return {
        minutes: minutesRemaining,
        displayTime: `${minutesRemaining} min`
      };
    } else {
      return {
        minutes: minutesRemaining,
        displayTime: expiration.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      };
    }
  };

  // Filter orders for My Groups section
  const myGroups = orders.filter(order =>
    userId && (order.owner_id === userId || order.participants?.includes(userId))
  );

  // Filter orders for Active Groups section (excluding my groups)
  const activeGroups = orders.filter(order =>
    !userId || (!order.participants?.includes(userId) && order.owner_id !== userId)
  );

  interface OrderCardProps {
    order: Order;
    isMember?: boolean;
  }

  const OrderCard = ({ order, isMember = false }: OrderCardProps) => (
    <div
      key={order.id}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-orange-500"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold">{order.restaurant}</h3>
        <div className="flex items-center text-gray-600">
          <Users size={16} className="mr-1" />
          <span>
            {order.participants ? order.participants.length : 0}
          </span>
        </div>
      </div>
      <div className="flex items-center text-gray-600 mb-3">
        <Clock size={16} className="mr-1" />
        {(() => {
          const timeInfo = formatTimeRemaining(order.expiration);
          return timeInfo.minutes < 60 ? (
            <span>Ordering in {timeInfo.displayTime}</span>
          ) : (
            <span>Ordering at {timeInfo.displayTime}</span>
          );
        })()}
      </div>
      {isMember ? (
        order.owner_id === userId ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleLeaveClick(order.id)}
              className="flex-1 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium flex items-center justify-center"
            >
              <X size={16} className="mr-1" />
              Leave
            </button>
            <button
              onClick={() => handleConfirmClick(order.id)}
              className="flex-1 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors font-medium flex items-center justify-center"
            >
              <Check size={16} className="mr-1" />
              Confirm
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              You will be contacted by the group owner when they are ready to order.
            </p>
            <button
              onClick={() => handleLeaveClick(order.id)}
              className="w-full py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium flex items-center justify-center"
            >
              <X size={16} className="mr-1" />
              Leave
            </button>
          </div>
        )
      ) : (
        <button
          onClick={() => handleJoinClick(order.id)}
          className="w-full py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors font-medium"
        >
          Join
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-600">UChomps</h1>
          <div className="flex items-center space-x-2">
            <MapPin className="text-gray-500" size={20} />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 flex-grow">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* My Groups Section */}
        {userId && myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">My Groups at {selectedLocation}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {myGroups.map(order => (
                <OrderCard key={order.id} order={order} isMember={true} />
              ))}
            </div>
          </div>
        )}

        {/* Active Groups Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Active Groups at {selectedLocation}
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : activeGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeGroups.map(order => (
                <OrderCard key={order.id} order={order} isMember={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No active groups at this location.</p>
              <p className="text-gray-500">Create a new group to get started!</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Create Group button */}
      <div className="fixed bottom-8 right-10">
        <button
          onClick={handleCreateClick}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors font-medium"
        >
          <PlusCircle size={20} />
          <span>Create Group</span>
        </button>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onVerified={handleVerified}
        groupData={{
          restaurant: "",
          location: selectedLocation,
          orderTime: new Date().toISOString(),
          maxParticipants: 4,
        }}
      />

      {/* Confirm Order Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Group and Place Order</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to confirm this group order? No one else will be able to join after confirmation. You will be responsible for contacting the participants and placing the order at the agreed upon time.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Leave Group</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave this group order? {selectedOrderId && orders.find(o => o.id === selectedOrderId)?.owner_id === userId ?
                "As the group owner, leaving will transfer ownership to another participant. If you are the only participant, the group will be deleted." :
                "You'll need to rejoin if you want to participate later."}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
