import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBox, FaList, FaChartBar, FaUsers, FaMapMarkerAlt, FaBars, FaTimes, FaLocationArrow, FaShoppingCart, FaTruck, FaImage, FaTag, FaAddressBook } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [paidOrderCount, setPaidOrderCount] = useState(0);

  // Fetch count of new orders (status: 'booked') for Tracking
  useEffect(() => {
    const fetchNewOrders = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tracking/bookings`, {
          params: { status: 'booked' }
        });
        setNewOrderCount(response.data.length);
      } catch (err) {
        console.error('Failed to fetch new orders for Tracking:', err);
      }
    };

    fetchNewOrders();
    const interval = setInterval(fetchNewOrders, 100000); // Refresh every 100 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch count of paid orders (status: 'paid') for Dispatch Customers
  useEffect(() => {
    const fetchPaidOrders = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tracking/bookings`, {
          params: { status: 'paid' }
        });
        setPaidOrderCount(response.data.length);
      } catch (err) {
        console.error('Failed to fetch paid orders for Dispatch:', err);
      }
    };

    fetchPaidOrders();
    const interval = setInterval(fetchPaidOrders, 100000); // Refresh every 100 seconds
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Inventory', path: '/inventory', icon: <FaBox className="mr-2" /> },
    { name: 'Listing', path: '/listing', icon: <FaList className="mr-2" /> },
    { name: 'Promo Code', path: '/promo-code', icon: <FaTag className="mr-2" /> },
    { name: 'Banner', path: '/banner', icon: <FaImage className="mr-2" /> },
    { name: 'Direct Customer', path: '/direct-customer', icon: <FaUsers className="mr-2" /> },
    { name: 'Direct Enquiry', path: '/direct-enquiry', icon: <FaShoppingCart className="mr-2" /> },
    { name: 'Location', path: '/location', icon: <FaLocationArrow className="mr-2" /> },
    { 
      name: 'Tracking', 
      path: '/tracking', 
      icon: <FaMapMarkerAlt className="mr-2" />,
      notification: newOrderCount > 0 ? newOrderCount : null
    },
    { 
      name: 'Dispatch Customers', 
      path: '/dispatch-customers', 
      icon: <FaTruck className="mr-2" />,
      notification: paidOrderCount > 0 ? paidOrderCount : null
    },
    { name: 'Report', path: '/report', icon: <FaChartBar className="mr-2" /> },
    { name: 'Sales Analysis', path: '/sales-analysis', icon: <FaAddressBook className="mr-2" /> },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {!isOpen && (
        <button
          className="hundred:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md"
          onClick={toggleSidebar}
        >
          <FaBars size={24} />
        </button>
      )}

      <div
        className={`fixed top-0 left-0 h-screen bg-black/80 text-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } hundred:translate-x-0 mobile:w-64 w-64 z-40`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700 flex items-center justify-between">
          Admin
          <button className="hundred:hidden text-white" onClick={toggleSidebar}>
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="flex-1 mt-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center py-3 px-6 text-sm font-medium hover:bg-black/50 transition-colors ${
                      isActive ? 'bg-gray-900 text-white' : ''
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span className="flex-1">{item.name}</span>
                  {(item.name === 'Tracking' || item.name === 'Dispatch Customers') && item.notification !== null && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-1 ml-2">
                      {item.notification}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {isOpen && (
        <div
          className="hundred:hidden fixed inset-0 bg-black/50 bg-opacity-30 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}