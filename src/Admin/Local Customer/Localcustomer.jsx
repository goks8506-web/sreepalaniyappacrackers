import React, { useState, useEffect } from "react";
import "../../App.css";
import Sidebar from "../Sidebar/Sidebar";
import { API_BASE_URL } from "../../../Config";
import Logout from "../Logout";
import { FaSearch } from "react-icons/fa";

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button onClick={onClick} disabled={disabled}
    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all duration-150
      ${active ? "bg-indigo-600 border-indigo-600 text-white"
      : disabled ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
      : "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:text-indigo-600"}`}>
    {label}
  </button>
)

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

export default function Localcustomer() {
  const initialFormData = {
    customerName: "", state: "", district: "", mobileNumber: "", email: "", address: "",
    customerType: "Customer", agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "",
    custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: ""
  };

  const [formData, setFormData] = useState(initialFormData);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedType, setSelectedType] = useState("Customer");
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewedCustomer, setViewedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;
  const filteredCustomers = customers.filter(c =>
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile_number?.includes(searchTerm) ||
    c.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { fetchStates(); fetchCustomers(selectedType); fetchAgents(); }, []);
  useEffect(() => { fetchCustomers(selectedType); }, [selectedType]);

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      setStates(await response.json());
    } catch (error) { setError("Failed to load states."); }
  };

  const fetchDistricts = async (stateName, fieldPrefix = "") => {
    if (!stateName) { setDistricts([]); setFormData((prev) => ({ ...prev, [`${fieldPrefix}district`]: "" })); return []; }
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setDistricts(data);
      return data;
    } catch (error) { setError(`Failed to load districts for ${stateName}.`); setDistricts([]); return []; }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/directcust/agents`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setAgents(data.map(agent => ({ id: agent.id, name: agent.name || agent.customer_name })));
    } catch (error) { setError("Failed to load agents."); setAgents([]); }
  };

  const fetchCustomers = async (type) => {
    try {
      const url = new URL(`${API_BASE_URL}/api/directcust/customers`);
      if (type && type !== "All") url.searchParams.append("type", type);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setCustomers(data.sort((a, b) => b.id - a.id));
    } catch (error) { setError("Failed to load customers."); }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (["mobileNumber", "agentContact", "custAgentContact"].includes(name)) {
      value = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    if (name === "state") { fetchDistricts(value); setFormData((prev) => ({ ...prev, district: "" })); }
    else if (name === "agentState") { fetchDistricts(value, "agent"); setFormData((prev) => ({ ...prev, agentDistrict: "" })); }
    else if (name === "custAgentState") { fetchDistricts(value, "custAgent"); setFormData((prev) => ({ ...prev, custAgentDistrict: "" })); }
    else if (name === "customerType") {
      const newType = value.trim();
      setFormData({ customerName: "", state: "", district: "", mobileNumber: "", email: "", address: "", customerType: newType, agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "", custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: "" });
      setSelectedAgent(""); setAgents([]);
      if (newType === "Customer of Selected Agent") fetchAgents();
    }
  };

  const handleEdit = async (customer) => {
    setEditId(customer.id);
    setFormData({ ...initialFormData, customerType: customer.customer_type });
    setSelectedAgent(customer.agent_id || "");
    let prefix = ""; let targetState = customer.state; let targetDistrictName = customer.district;
    switch (customer.customer_type) {
      case "Customer":
        prefix = "";
        setFormData((prev) => ({ ...prev, customerName: customer.customer_name || "", state: customer.state || "", mobileNumber: customer.mobile_number || "", email: customer.email || "", address: customer.address || "" }));
        break;
      case "Agent":
        prefix = "agent";
        setFormData((prev) => ({ ...prev, agentName: customer.customer_name || "", agentState: customer.state || "", agentContact: customer.mobile_number || "", agentEmail: customer.email || "", address: customer.address || "" }));
        break;
      case "Customer of Selected Agent":
        prefix = "custAgent";
        await fetchAgents();
        setFormData((prev) => ({ ...prev, custAgentName: customer.customer_name || "", custAgentState: customer.state || "", custAgentContact: customer.mobile_number || "", custAgentEmail: customer.email || "", custAgentAddress: customer.address || "" }));
        break;
    }
    if (targetState) {
      const dists = await fetchDistricts(targetState, prefix);
      const districtId = dists.find((d) => d.name === targetDistrictName)?.id || "";
      setFormData((prev) => ({ ...prev, [`${prefix}state`]: targetState, [`${prefix}district`]: districtId }));
    }
    setSuccess(false); setError(null); setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/directcust/customers/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      setDeleteConfirmId(null); fetchCustomers(selectedType);
    } catch (error) { setError("Failed to delete customer."); setDeleteConfirmId(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEmpty = (val) => !val || typeof val !== "string" || !val.trim();
    const { customerType, customerName, state, district, mobileNumber, address, agentName, agentContact, agentState, agentDistrict, custAgentName, custAgentContact, custAgentState, custAgentDistrict, custAgentAddress } = formData;
    let validationError = null;
    if (customerType === "Customer" && (isEmpty(customerName) || isEmpty(state) || isEmpty(district) || isEmpty(mobileNumber) || isEmpty(address))) validationError = "Please fill all required fields for Customer.";
    else if (customerType === "Agent" && (isEmpty(agentName) || isEmpty(agentContact) || isEmpty(agentState) || isEmpty(agentDistrict))) validationError = "Please fill all required fields for Agent.";
    else if (customerType === "Customer of Selected Agent" && (!selectedAgent || isEmpty(custAgentName) || isEmpty(custAgentContact) || isEmpty(custAgentState) || isEmpty(custAgentDistrict) || isEmpty(custAgentAddress))) validationError = "Please fill all required fields for Customer of Selected Agent.";
    if (validationError) { setError(validationError); return; }
    setLoading(true); setError(null);
    try {
      const payload = {
        customer_name: formData.customerName.trim() || null, state: formData.state.trim() || null, district: formData.district.trim() || null,
        mobile_number: formData.mobileNumber.trim() || null, email: formData.email.trim() || null, address: formData.address.trim() || null,
        customer_type: formData.customerType.trim() || null, agent_id: selectedAgent || null, agent_name: formData.agentName.trim() || null,
        agent_contact: formData.agentContact.trim() || null, agent_email: formData.agentEmail.trim() || null, agent_state: formData.agentState.trim() || null,
        agent_district: formData.agentDistrict.trim() || null, cust_agent_name: formData.custAgentName.trim() || null,
        cust_agent_contact: formData.custAgentContact.trim() || null, cust_agent_email: formData.custAgentEmail.trim() || null,
        cust_agent_address: formData.custAgentAddress.trim() || null, cust_agent_district: formData.custAgentDistrict.trim() || null,
        cust_agent_state: formData.custAgentState.trim() || null
      };
      const url = editId ? `${API_BASE_URL}/api/directcust/customers/${editId}` : `${API_BASE_URL}/api/directcust/customers`;
      const response = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.error || `HTTP error! Status: ${response.status}`); }
      setSuccess(true); setError(null); setFormData(initialFormData); setSelectedAgent(""); setEditId(null); setDistricts([]);
      fetchCustomers(selectedType); setIsModalOpen(false);
    } catch (error) { setError(error.message || "Failed to save customer. Try again."); setSuccess(false); }
    finally { setLoading(false); }
  };

  const resetAndClose = () => { setFormData(initialFormData); setSelectedAgent(""); setError(null); setSuccess(false); setEditId(null); setIsModalOpen(false); };

  const typeMap = { Customer: "text-sky-600 bg-sky-50 border-sky-200", Agent: "text-emerald-600 bg-emerald-50 border-emerald-200", "Customer of Selected Agent": "text-amber-600 bg-amber-50 border-amber-200" };

  const SelectField = ({ label, name, options, required, disabled, value, onChange }) => (
    <Field label={label} required={required}>
      <select name={name} value={value !== undefined ? value : formData[name]} onChange={onChange || handleChange} disabled={disabled} className={`${inputCls} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} required={required}>
        <option value="">{options.length === 0 && name === "selectedAgent" ? "Loading agents..." : "Select an option..."}</option>
        {options.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
      </select>
    </Field>
  )

  const InputField = ({ label, name, type = "text", placeholder, required }) => (
    <Field label={label} required={required}>
      <input type={type} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} className={inputCls} required={required}
        pattern={["mobileNumber", "agentContact", "custAgentContact"].includes(name) ? "\\d{10}" : undefined} />
    </Field>
  )

  const TextareaField = ({ label, name, placeholder, required }) => (
    <Field label={label} required={required}>
      <textarea name={name} rows="3" value={formData[name]} onChange={handleChange} placeholder={placeholder} className={`${inputCls} resize-none`} required={required} />
    </Field>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Customers</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Manage your customer directory</p>
          </div>

          {error && !isModalOpen && (
            <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-6">
            <div className="flex flex-wrap gap-3 items-end justify-between">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-44">
                  <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Customer Type</label>
                  <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }} className={inputCls}>
                    <option value="All">All Types</option>
                    <option value="Customer">Customer</option>
                    <option value="Agent">Agent</option>
                    <option value="Customer of Selected Agent">Customer of Selected Agent</option>
                  </select>
                </div>
                <div className="min-w-56">
                  <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input type="text" placeholder="Name, mobile, district..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border" />
                  </div>
                </div>
              </div>
              <button onClick={() => { setFormData(initialFormData); setSelectedAgent(""); setEditId(null); setIsModalOpen(true); }}
                className="h-10 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200">
                + Add Customer
              </button>
            </div>
          </div>

          {paginatedCustomers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl mb-6">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-slate-400 font-medium text-sm">No customers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mb-6">
              {paginatedCustomers.map((customer) => (
                <div key={customer.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-base font-bold text-slate-800">{customer.customer_name}</div>
                      {customer.mobile_number && (
                        <a href={`tel:${customer.mobile_number}`} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">📞 {customer.mobile_number}</a>
                      )}
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeMap[customer.customer_type] || "text-slate-400 bg-slate-50 border-slate-200"}`}>
                      {customer.customer_type === "Customer of Selected Agent" ? "Agent Customer" : customer.customer_type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-4">
                    {[["📍 District", customer.district || "N/A"], ["🏛️ State", customer.state || "N/A"]].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg px-2 py-1.5">
                        <div className="text-xs font-bold text-slate-400">{label}</div>
                        <div className="text-xs font-semibold text-slate-700">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setViewedCustomer(customer); setViewModalOpen(true); }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200">
                      View
                    </button>
                    <button onClick={() => handleEdit(customer)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200">
                      Edit
                    </button>
                    <button onClick={() => setDeleteConfirmId(customer.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              <PaginBtn label="← Prev" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((page) => (
                <PaginBtn key={page} label={page} onClick={() => setCurrentPage(page)} active={currentPage === page} />
              ))}
              <PaginBtn label="Next →" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && resetAndClose()}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">{editId ? "✏️ Edit Customer" : "➕ Add Customer"}</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs">⚠️ {error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-4 text-xs">✓ Saved successfully</div>}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Field label="Customer Type" required>
                  <select name="customerType" value={formData.customerType} onChange={handleChange} disabled={!!editId} className={`${inputCls} ${editId ? "opacity-50 cursor-not-allowed" : ""}`} required>
                    <option value="Customer">Customer</option>
                    <option value="Agent">Agent</option>
                    <option value="Customer of Selected Agent">Customer of Selected Agent</option>
                  </select>
                </Field>

                {formData.customerType === "Customer" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Customer Name" name="customerName" placeholder="Jane Smith" required />
                    <InputField label="Mobile Number" name="mobileNumber" placeholder="1234567890" required />
                    <SelectField label="State" name="state" options={states.map(s => ({ id: s.name, name: s.name }))} required />
                    <SelectField label="District" name="district" options={districts} disabled={!formData.state} required />
                    <InputField label="Email" name="email" type="email" placeholder="jane@example.com" />
                    <div className="sm:col-span-2"><TextareaField label="Address" name="address" placeholder="123 Main St, Apt 4B" required /></div>
                  </div>
                )}

                {formData.customerType === "Agent" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Agent Name" name="agentName" placeholder="Agent Name" required />
                    <InputField label="Agent Contact" name="agentContact" placeholder="1234567890" required />
                    <InputField label="Agent Email" name="agentEmail" type="email" placeholder="agent@example.com" />
                    <SelectField label="Agent State" name="agentState" options={states.map(s => ({ id: s.name, name: s.name }))} required />
                    <SelectField label="Agent District" name="agentDistrict" options={districts} disabled={!formData.agentState} required />
                    <div className="sm:col-span-2"><TextareaField label="Agent Address" name="address" placeholder="123 Main St" required /></div>
                  </div>
                )}

                {formData.customerType === "Customer of Selected Agent" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField label="Select Agent" name="selectedAgent" options={agents} disabled={agents.length === 0} required value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} />
                    <InputField label="Customer Name" name="custAgentName" placeholder="Customer Name" required />
                    <InputField label="Contact" name="custAgentContact" placeholder="1234567890" required />
                    <InputField label="Email" name="custAgentEmail" type="email" placeholder="email@example.com" />
                    <SelectField label="State" name="custAgentState" options={states.map(s => ({ id: s.name, name: s.name }))} required />
                    <SelectField label="District" name="custAgentDistrict" options={districts} disabled={!formData.custAgentState} required />
                    <div className="sm:col-span-2"><TextareaField label="Address" name="custAgentAddress" placeholder="123 Main St" required /></div>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button type="button" onClick={resetAndClose} disabled={loading} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={loading}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center gap-2
                      ${loading ? "bg-slate-300 cursor-not-allowed" : "bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500"}`}>
                    {loading ? (<><span className="inline-block w-4 h-4 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>) : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModalOpen && viewedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setViewModalOpen(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">👤 Customer Details</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[["Name", viewedCustomer.customer_name], ["Type", viewedCustomer.customer_type === "Customer of Selected Agent" ? "Agent Customer" : viewedCustomer.customer_type], ["Mobile", viewedCustomer.mobile_number || "N/A"], ["Email", viewedCustomer.email || "N/A"], ["District", viewedCustomer.district || "N/A"], ["State", viewedCustomer.state || "N/A"], ["Address", viewedCustomer.address || "N/A"]].map(([label, value]) => (
                <div key={label} className={`bg-slate-50 rounded-xl px-3 py-2.5 ${label === "Address" ? "col-span-2" : ""}`}>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                  <div className="text-sm font-semibold text-slate-700 mt-0.5">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-2.5">Delete Customer?</h2>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete this customer? This cannot be undone.</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Keep It</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}