import { useState, useMemo } from "react";

const SERVICES = [
  { id: 1,  name: "General Service",        category: "Maintenance", price: 2999, duration: "180 min", status: "Inactive" },
  { id: 2,  name: "Oil Change",             category: "Maintenance", price: 799,  duration: "30 min",  status: "Active" },
  { id: 3,  name: "Brake Service",          category: "Repair",      price: 1499, duration: "60 min",  status: "Active" },
  { id: 4,  name: "AC Service",             category: "Maintenance", price: 1299, duration: "90 min",  status: "Active" },
  { id: 5,  name: "Wheel Alignment",        category: "Maintenance", price: 599,  duration: "45 min",  status: "Active" },
  { id: 6,  name: "Battery Check",          category: "Electrical",  price: 199,  duration: "15 min",  status: "Active" },
  { id: 7,  name: "Car Wash",               category: "Cleaning",    price: 349,  duration: "30 min",  status: "Active" },
  { id: 8,  name: "Engine Diagnostics",     category: "Inspection",  price: 999,  duration: "60 min",  status: "Active" },
  { id: 9,  name: "Tyre Replacement",       category: "Repair",      price: 2499, duration: "45 min",  status: "Active" },
  { id: 10, name: "Brake Pad Replacement",  category: "Repair",      price: 1999, duration: "60 min",  status: "Active" },
  { id: 11, name: "Interior Cleaning",      category: "Cleaning",    price: 799,  duration: "90 min",  status: "Active" },
  { id: 12, name: "Exterior Polishing",     category: "Cleaning",    price: 999,  duration: "120 min", status: "Active" },
  { id: 13, name: "Suspension Repair",      category: "Repair",      price: 2999, duration: "120 min", status: "Active" },
  { id: 14, name: "Clutch Repair",          category: "Repair",      price: 3499, duration: "180 min", status: "Active" },
  { id: 15, name: "Coolant Replacement",    category: "Maintenance", price: 649,  duration: "30 min",  status: "Active" },
  { id: 16, name: "Air Filter Replacement", category: "Maintenance", price: 399,  duration: "20 min",  status: "Active" },
  { id: 17, name: "Oil Filter Replacement", category: "Maintenance", price: 299,  duration: "20 min",  status: "Active" },
  { id: 18, name: "Wiper Replacement",      category: "Maintenance", price: 249,  duration: "15 min",  status: "Active" },
  { id: 19, name: "Car Detailing",          category: "Cleaning",    price: 2499, duration: "240 min", status: "Active" },
  { id: 20, name: "Dent & Paint",           category: "Repair",      price: 4999, duration: "300 min", status: "Active" },
];

const CATEGORY_STYLES = {
  Maintenance: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  Repair:      { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  Cleaning:    { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  Electrical:  { bg: "#FFF7ED", text: "#9A3412", dot: "#F97316" },
  Inspection:  { bg: "#F5F3FF", text: "#5B21B6", dot: "#7C3AED" },
};

const CATEGORIES = ["All", "Maintenance", "Repair", "Cleaning", "Electrical", "Inspection"];

function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] || {};
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 20,
        backgroundColor: style.bg,
        color: style.text,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: style.dot,
          flexShrink: 0,
        }}
      />
      {category}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 20,
        backgroundColor: isActive ? "#ECFDF5" : "#F3F4F6",
        color: isActive ? "#065F46" : "#6B7280",
      }}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        backgroundColor: "#F9F9FB",
        borderRadius: 10,
        padding: "14px 18px",
        flex: 1,
        minWidth: 120,
      }}
    >
      <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 600, color: "#111827" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState(SERVICES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Maintenance", price: "", duration: "", status: "Active" });

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "All" || s.category === categoryFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [services, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = services.filter((s) => s.status === "Active").length;
    const avg = Math.round(services.reduce((a, s) => a + s.price, 0) / services.length);
    return { total: services.length, active, avg };
  }, [services]);

  function openAdd() {
    setEditTarget(null);
    setForm({ name: "", category: "Maintenance", price: "", duration: "", status: "Active" });
    setShowModal(true);
  }

  function openEdit(service) {
    setEditTarget(service.id);
    setForm({ name: service.name, category: service.category, price: service.price, duration: service.duration, status: service.status });
    setShowModal(true);
  }

  function handleDelete(id) {
    if (window.confirm("Delete this service?")) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.price) return;
    if (editTarget) {
      setServices((prev) =>
        prev.map((s) => (s.id === editTarget ? { ...s, ...form, price: Number(form.price) } : s))
      );
    } else {
      const newId = Math.max(...services.map((s) => s.id)) + 1;
      setServices((prev) => [...prev, { id: newId, ...form, price: Number(form.price) }]);
    }
    setShowModal(false);
  }

  function toggleStatus(id) {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s
      )
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    fontSize: 13,
    color: "#111827",
    outline: "none",
    backgroundColor: "#fff",
  };

  const labelStyle = { fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 4, display: "block" };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#F8F8FA", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111827", margin: 0 }}>Services</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 3 }}>Manage all service offerings for your auto care center</p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            backgroundColor: "#7C3AED", color: "#fff",
            border: "none", borderRadius: 8, padding: "9px 16px",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add service
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Total services" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.total - stats.active} />
        <StatCard label="Avg. price" value={`₹${stats.avg.toLocaleString()}`} />
        <StatCard label="Categories" value={5} />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <svg
            width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
          {CATEGORIES.map((c) => <option key={c}>{c === "All" ? "All categories" : c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
          <option value="All">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
              {["#", "Service name", "Category", "Price (₹)", "Duration", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, fontSize: 12, color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#9CA3AF" }}>No services found</td></tr>
            ) : (
              filtered.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #F9F9F9" }}>
                  <td style={{ padding: "12px 16px", color: "#9CA3AF" }}>{i + 1}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                      </span>
                      {s.name}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><CategoryBadge category={s.category} /></td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>₹{s.price.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280" }}>{s.duration}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => toggleStatus(s.id)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      title="Toggle status"
                    >
                      <StatusBadge status={s.status} />
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openEdit(s)}
                        style={{ background: "#F5F3FF", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#7C3AED", fontSize: 12, fontWeight: 500 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{ background: "#FEF2F2", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#DC2626", fontSize: 12, fontWeight: 500 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 10 }}>
        Showing {filtered.length} of {services.length} services
      </p>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "24px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
                {editTarget ? "Edit service" : "Add new service"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 18 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Service name</label>
                <input
                  type="text"
                  placeholder="e.g. Oil Change"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  {["Maintenance", "Repair", "Cleaning", "Electrical", "Inspection"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 min"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: "9px", border: "1px solid #E5E7EB", borderRadius: 8, backgroundColor: "#fff", fontSize: 13, fontWeight: 500, color: "#6B7280", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, backgroundColor: "#7C3AED", fontSize: 13, fontWeight: 500, color: "#fff", cursor: "pointer" }}
              >
                {editTarget ? "Save changes" : "Add service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}