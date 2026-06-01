import { useState, useEffect } from "react";
import api from "../services/api";
import "./CustomersPage.css";

const STATUS_COLORS = {
  pending:     { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  confirmed:   { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  in_progress: { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  completed:   { bg: "#F0FDF4", text: "#15803D", dot: "#16A34A" },
  cancelled:   { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E" },
};

export default function CustomersPage() {
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [cars, setCars]             = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState("name");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await api.get("/users/");
      // Filter to only customer role
      setCustomers(res.data.filter((u) => u.role === "customer" || !u.role));
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  }

  async function openCustomer(customer) {
    setSelected(customer);
    setHistory([]);
    setCars([]);
    setDrawerLoading(true);
    try {
      const [historyRes, carsRes] = await Promise.all([
        api.get(`/service-requests/?user_id=${customer.id}`),
        api.get(`/cars/?user_id=${customer.id}`),
      ]);
      setHistory(historyRes.data);
      setCars(carsRes.data);
    } catch (err) {
      console.error("Failed to load customer details", err);
    } finally {
      setDrawerLoading(false);
    }
  }

  const filtered = customers
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name")
        return (a.full_name || "").localeCompare(b.full_name || "");
      if (sortBy === "newest")
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });

  const completedCount = history.filter((h) => h.status === "completed").length;
  const activeCount    = history.filter((h) =>
    ["pending","confirmed","in_progress"].includes(h.status)
  ).length;

  return (
    <div className="customers-page">
      {/* ── Header ── */}
      <div className="customers-header">
        <div>
          <h1>Customers</h1>
          <p>{customers.length} registered customers</p>
        </div>
        <button className="btn-primary" onClick={fetchCustomers}>↻ Refresh</button>
      </div>

      {/* ── Filters ── */}
      <div className="customers-filters">
        <input
          className="search-input"
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="newest">Sort: Newest first</option>
        </select>
      </div>

      {/* ── Customer Grid ── */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading customers…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👤</span>
          <p>No customers found</p>
        </div>
      ) : (
        <div className="customers-grid">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="customer-card"
              onClick={() => openCustomer(c)}
            >
              <div className="cc-avatar">
                {(c.full_name || "?")[0].toUpperCase()}
              </div>
              <div className="cc-info">
                <div className="cc-name">{c.full_name || "—"}</div>
                <div className="cc-email">{c.email}</div>
                {c.phone && <div className="cc-phone">📞 {c.phone}</div>}
              </div>
              <div className="cc-footer">
                <span className="cc-joined">
                  Joined{" "}
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString("en-IN", {
                        month: "short", year: "numeric",
                      })
                    : "—"}
                </span>
                <span className="cc-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Customer Detail Drawer ── */}
      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>

            {/* Profile Hero */}
            <div className="profile-hero">
              <div className="profile-avatar">
                {(selected.full_name || "?")[0].toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{selected.full_name}</h2>
                <p className="profile-email">{selected.email}</p>
                <p className="profile-phone">📞 {selected.phone || "N/A"}</p>
                <p className="profile-joined">
                  Member since{" "}
                  {selected.created_at
                    ? new Date(selected.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            {drawerLoading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading details…</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="customer-stats">
                  {[
                    { label: "Total Visits",  value: history.length,  color: "#7C3AED" },
                    { label: "Completed",     value: completedCount,  color: "#22C55E" },
                    { label: "Active",        value: activeCount,     color: "#3B82F6" },
                    { label: "Vehicles",      value: cars.length,     color: "#F97316" },
                  ].map((s) => (
                    <div className="cstat" key={s.label}>
                      <span className="cstat-value" style={{ color: s.color }}>{s.value}</span>
                      <span className="cstat-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Vehicles */}
                <section className="profile-section">
                  <h3>Vehicles</h3>
                  {cars.length === 0 ? (
                    <p className="empty-text">No vehicles registered</p>
                  ) : (
                    <div className="vehicles-list">
                      {cars.map((car) => (
                        <div className="vehicle-item" key={car.id}>
                          <span className="vi-icon">🚗</span>
                          <div className="vi-info">
                            <div className="vi-model">
                              {car.make} {car.model} {car.year && `(${car.year})`}
                            </div>
                            <div className="vi-plate">{car.license_plate}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Appointment History */}
                <section className="profile-section">
                  <h3>Appointment History</h3>
                  {history.length === 0 ? (
                    <p className="empty-text">No appointments yet</p>
                  ) : (
                    <div className="history-list">
                      {history.map((h) => {
                        const sc = STATUS_COLORS[h.status] || STATUS_COLORS.pending;
                        return (
                          <div className="history-item" key={h.id}>
                            <div className="history-left">
                              <div className="history-service">{h.service_type || "Service"}</div>
                              <div className="history-meta">
                                {h.scheduled_date
                                  ? new Date(h.scheduled_date).toLocaleDateString("en-IN", {
                                      day: "numeric", month: "short", year: "numeric",
                                    })
                                  : "—"}
                                {h.car_plate ? ` · ${h.car_plate}` : ""}
                              </div>
                            </div>
                            <span
                              className="status-badge"
                              style={{ background: sc.bg, color: sc.text }}
                            >
                              <span className="status-dot" style={{ background: sc.dot }} />
                              {h.status?.replace("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}