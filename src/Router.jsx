import { Routes, Route } from 'react-router-dom';
import Home from "./Home/Home";
import Login from './Admin/Login/Login';
import Inventory from './Admin/Inventory/Inventory';
import Tracking from './Admin/Tracking/Tracking';
import List from './Admin/List/List';
import Localcustomer from './Admin/Local Customer/Localcustomer';
import Report from './Admin/Report/Report';
import ProtectedRoute from './ProtectedRoute';
import Location from './Admin/Location/Location';
import Direct from './Admin/Direct/Direct';
import Dispatch from './Admin/Dispatch/Dispatch';
import Banner from './Admin/Banner/Banner';
import Safety from './Home/Safety';
import About from './Home/About';
import Contact from './Home/Contact';
import Pricelist from './Home/Pricelist';
import Promocode from './Admin/Promo/Promocode'
import SalesAnalysis from './Admin/SalesAnalysis';
import Status from './Home/Status';
// import Homey from './Home/Homey';

const AllRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/spc" element={<Login />} />
      <Route path="/safety-tips" element={<Safety />} />
      <Route path="/about-us" element={<About />} />
      <Route path="/contact-us" element={<Contact />} />
      <Route path="/price-list" element={<Pricelist />} />
      <Route path="/status" element={<Status />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/listing" element={<List />} />
        <Route path="/report" element={<Report />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/direct-customer" element={<Localcustomer />} />
        <Route path="/location" element={<Location />} />
        <Route path="/direct-enquiry" element={<Direct />} />
        <Route path="/dispatch-customers" element={<Dispatch />} />
        <Route path="/banner" element={<Banner />} />
        <Route path="/promo-code" element={<Promocode />} />
        <Route path="/sales-analysis" element={<SalesAnalysis />} />
      </Route>
    </Routes>
  );
};

export default AllRoutes;
