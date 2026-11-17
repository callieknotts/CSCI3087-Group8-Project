
import { useEffect, useState } from "react";
import "./Profile.css";

const EMPTY_FORM = { name: "", username: "", email: "" };

function readError(body, status) {
  if (status === 422) return "Enter a valid email address.";
  if (typeof body?.detail === "string") return body.detail;
  return "Something went wrong. Try again.";
}

function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase();
}

export default function Profile() {
  const [saved, setSaved] = useState(EMPTY_FORM);
  const [form, setForm] = useState(EMPTY_FORM);
  const [stats, setStats] = useState(null);
  const [memberSince, setMemberSince] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/profile/", {
          credentials: "include",
        });

        if (res.status === 401) {
          throw new Error("Log in to view your profile.");
        }

        if (!res.ok) {
          throw new Error("Couldn't load your profile.");
        }

        const data = await res.json();

        if (cancelled) return;

        const values = {
          name: data.name,
          username: data.username,
          email: data.email,
        };

        setSaved(values);
        setForm(values);
        setStats(data.stats || null);
        setMemberSince(data.member_since || null);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty =
    form.name !== saved.name ||
    form.username !== saved.username ||
    form.email !== saved.email;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (status.message) {
      setStatus({ type: "", message: "" });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/profile/", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({
          type: "error",
          message: readError(body, res.status),
        });
        return;
      }

      const values = {
        name: body.name,
        username: body.username,
        email: body.email,
      };

      setSaved(values);
      setForm(values);

      setStatus({
        type: "success",
        message: "Changes saved successfully.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Could not reach the server. Check your connection.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(saved);
    setStatus({ type: "", message: "" });
  }

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-container">
          <p className="profile-loading">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="profile-page">
        <div className="profile-container">
          <p className="profile-error" role="alert">
            {loadError}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-container">

        {/* Page heading */}
        <div className="profile-page-heading">
          <p className="profile-eyebrow"><strong>YOUR ACCOUNT</strong></p>
        </div>

        {/* Profile overview */}
        <section className="profile-overview">

          <div className="profile-avatar">
            {getInitials(saved.name)}
          </div>

          <div className="profile-identity">
            <h2>{saved.name}</h2>
            <p className="profile-handle">@{saved.username}</p>

            {memberSince && (
              <p className="profile-since">
                Member since{" "}
                {new Date(memberSince).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

        </section>

        {/* Dashboard content */}
        <div className="profile-content">

          {/* Statistics */}
          <section className="profile-stats-section">
            <div className="profile-section-heading">
              <h2>Overview</h2>
              <p>Your activity at a glance.</p>
            </div>

            <div className="profile-stats">
              <div className="profile-stat-card">
                <div className="profile-stat-icon">▤</div>
                <div>
                  <p className="profile-stat-label">Total decks</p>
                  <p className="profile-stat-value">
                    {stats?.total_decks ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Account settings */}
          <section className="profile-settings">
            <div className="profile-section-heading">
              <h2>Account details</h2>
              <p>Update the information associated with your account.</p>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="profile-fields">

                <label className="profile-field">
                  <span>Full name</span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </label>

                <label className="profile-field">
                  <span>Username</span>
                  <input
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    required
                  />
                </label>

                <label className="profile-field">
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </label>

              </div>

              {status.message && (
                <p
                  className={`profile-status ${status.type}`}
                  role="status"
                  aria-live="polite"
                >
                  {status.message}
                </p>
              )}

              <div className="profile-actions">
                <button
                  type="button"
                  className="profile-reset-button"
                  onClick={handleReset}
                  disabled={!isDirty || saving}
                >
                  Discard changes
                </button>

                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={!isDirty || saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>

            </form>
          </section>

        </div>
      </div>
    </main>
  );
}
