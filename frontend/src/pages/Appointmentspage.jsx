import { useState, useEffect } from "react";
import api from "../services/api";
import "./AppointmentsPage.css";

const STATUS_COLORS = {
  pending:    { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  confirmed:  { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  in_progress:{ bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  completed:  { bg: "#F0FDF4", text: "#15803D", dot: "#16A34A" },
  cancelled:  { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E" },
};

const SERVICE_ICONS = {
  "Oil Change": "🛢️",
  "Tire Rotation": "🔄",
  "Brake Service": "🛑",
  "Engine Check": "⚙️",
  "AC Service": "❄️",
  "Full Service": "🔧",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading]   = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch]             = useState("");
  const [updatingId, setUpdatingId]     = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const res = await api.get("/service-requests/");
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    } finally {
      setLoading(false);
    }
  }

  async function openProfile(appt) {
    setSelected(appt);
    setCustomerProfile(null);
    setProfileLoading(true);
    try {
      const [customerRes, historyRes] = await Promise.all([
        api.get(`/users/${appt.user_id}`),
        api.get(`/service-requests/?user_id=${appt.user_id}`),
      ]);
      setCustomerProfile({
        customer: customerRes.data,
        history: historyRes.data,
      });
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setProfileLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    setUpdatingId(id);
    try {
      await api.patch(`/service-requests/${id}`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      if (selected?.id === id) setSelected((s) => ({ ...s, status: newStatus }));
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = appointments.filter((a) => {
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.customer_name?.toLowerCase().includes(q) ||
      a.service_type?.toLowerCase().includes(q) ||
      a.car_plate?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = {
    total:       appointments.length,
    pending:     appointments.filter((a) => a.status === "pending").length,
    in_progress: appointments.filter((a) => a.status === "in_progress").length,
    completed:   appointments.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="appt-page">
      {/* ── Header ── */}
      <div className="appt-header">
        <div>
          <h1>Appointments</h1>
          <p>Manage service requests and customer bookings</p>
        </div>
        <button className="btn-primary" onClick={fetchAppointments}>
          ↻ Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="appt-stats">
        {[
          { label: "Total",       value: stats.total,       color: "#7C3AED" },
          { label: "Pending",     value: stats.pending,     color: "#F97316" },
          { label: "In Progress", value: stats.in_progress, color: "#3B82F6" },
          { label: "Completed",   value: stats.completed,   color: "#22C55E" },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="appt-filters">
        <input
          className="search-input"
          placeholder="Search by customer, service, plate…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              className={`filter-tab ${filterStatus === s ? "active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading appointments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="appt-table-wrap">
          <table className="appt-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS.pending;
                return (
                  <tr key={a.id} onClick={() => openProfile(a)} className="appt-row">
                    <td className="row-num">{i + 1}</td>
                    <td>
                      <div className="customer-cell">
                        <div className="avatar">{(a.customer_name || "?")[0].toUpperCase()}</div>
                        <div>
                          <div className="customer-name">{a.customer_name || "—"}</div>
                          <div className="customer-email">{a.customer_email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-cell">
                        <span className="plate-badge">{a.car_plate || "—"}</span>
                        <span className="vehicle-model">{a.car_model || ""}</span>
                      </div>
                    </td>
                    <td>
                      <span className="service-cell">
                        {SERVICE_ICONS[a.service_type] || "🔧"} {a.service_type || "—"}
                      </span>
                    </td>
                    <td className="date-cell">
                      {a.scheduled_date
                        ? new Date(a.scheduled_date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span className="status-badge" style={{ background: sc.bg, color: sc.text }}>
                        <span className="status-dot" style={{ background: sc.dot }} />
                        {a.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="status-select"
                        value={a.status}
                        disabled={updatingId === a.id}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Customer Profile Drawer ── */}
      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>

            {profileLoading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading profile…</p>
              </div>
            ) : customerProfile ? (
              <>
                {/* Profile Header */}
                <div className="profile-hero">
                  <div className="profile-avatar">
                    {(customerProfile.customer.full_name || "?")[0].toUpperCase()}
                  </div>
                  <div className="profile-info">
                    <h2>{customerProfile.customer.full_name}</h2>
                    <p>{customerProfile.customer.email}</p>
                    <p className="profile-phone">📞 {customerProfile.customer.phone || "N/A"}</p>
                  </div>
                  <div className="profile-meta">
                    <div className="meta-item">
                      <span className="meta-value">
                        {customerProfile.history.length}
                      </span>
                      <span className="meta-label">Total Visits</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-value">
                        {customerProfile.history.filter((h) => h.status === "completed").length}
                      </span>
                      <span className="meta-label">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Current Appointment */}
                <section className="profile-section">
                  <h3>Current Appointment</h3>
                  <div className="current-appt-card">
                    <div className="ca-row">
                      <span className="ca-label">Service</span>
                      <span className="ca-value">
                        {SERVICE_ICONS[selected.service_type] || "🔧"} {selected.service_type}
                      </span>
                    </div>
                    <div className="ca-row">
                      <span className="ca-label">Vehicle</span>
                      <span className="ca-value">
                        {selected.car_model} — <b>{selected.car_plate}</b>
                      </span>
                    </div>
                    <div className="ca-row">
                      <span className="ca-label">Date</span>
                      <span className="ca-value">
                        {selected.scheduled_date
                          ? new Date(selected.scheduled_date).toLocaleDateString("en-IN", {
                              weekday: "long", day: "numeric",
                              month: "long", year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="ca-row">
                      <span className="ca-label">Notes</span>
                      <span className="ca-value">{selected.notes || "None"}</span>
                    </div>
                    <div className="ca-row">
                      <span className="ca-label">Status</span>
                      <span>
                        <select
                          className="status-select"
                          value={selected.status}
                          onChange={(e) => updateStatus(selected.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </span>
                    </div>
                  </div>
                </section>

                {/* Appointment History */}
                <section className="profile-section">
                  <h3>Appointment History</h3>
                  {customerProfile.history.length === 0 ? (
                    <p className="empty-text">No previous appointments</p>
                  ) : (
                    <div className="history-list">
                      {customerProfile.history.map((h) => {
                        const sc = STATUS_COLORS[h.status] || STATUS_COLORS.pending;
                        return (
                          <div className="history-item" key={h.id}>
                            <div className="history-icon">
                              {SERVICE_ICONS[h.service_type] || "🔧"}
                            </div>
                            <div className="history-body">
                              <div className="history-service">{h.service_type}</div>
                              <div className="history-date">
                                {h.scheduled_date
                                  ? new Date(h.scheduled_date).toLocaleDateString("en-IN", {
                                      day: "numeric", month: "short", year: "numeric",
                                    })
                                  : "—"}
                                {" · "}{h.car_plate}
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
            ) : (
              <p className="empty-text">Could not load profile.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}