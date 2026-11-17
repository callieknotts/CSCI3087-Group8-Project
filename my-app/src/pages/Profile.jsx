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

  // Load the logged-in user's profile
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
        if (!cancelled) {
          setLoadError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

  // Save updated profile information
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
        message: "Changes saved.",
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

  // Discard unsaved changes
  function handleReset() {
    setForm(saved);
    setStatus({ type: "", message: "" });
  }

  if (loading) {
    return (
      <main className="profile-page">
        <p className="profile-loading">Loading your profile...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="profile-page">
        <p className="profile-error" role="alert">
          {loadError}
        </p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        {/* Left card: who you are + stats */}
        <aside className="profile-card profile-summary">
          <header className="profile-header">
            <div className="profile-avatar" aria-hidden="true">
              {getInitials(saved.name)}
            </div>
            <h1>{saved.name}</h1>
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
          </header>

          {stats && (
            <section className="profile-stats" aria-label="Your stats">
              <div className="profile-stat">
                <span className="profile-stat-label">
                  {stats.total_decks === 1 ? "Deck" : "Decks"}
                </span>
                <span className="profile-stat-value">{stats.total_decks}</span>
              </div>
            </section>
          )}
        </aside>

        {/* Right card: edit account details */}
        <form className="profile-card profile-form" onSubmit={handleSubmit}>
          <h2>Account details</h2>

          <label>
            Name
            <input
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Username
            <input
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <div className="profile-actions">
            <button type="submit" disabled={!isDirty || saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || saving}
            >
              Discard changes
            </button>
          </div>

          <p
            className={`profile-status ${status.type}`}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        </form>
      </div>
    </main>
  );
}
