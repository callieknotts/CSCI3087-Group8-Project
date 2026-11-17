import { useEffect, useState } from "react";
import "./Profile.css";

const EMPTY_FORM = { name: "", username: "", email: "" };

function readError(body, status) {
  if (status === 422) return "Enter a valid email address.";
  if (typeof body?.detail === "string") return body.detail;
  return "Something went wrong. Try again.";
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
      <main className="profile">
        <p className="profile-note">Loading your profile…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="profile">
        <p className="profile-note profile-note--error" role="alert">
          {loadError}
        </p>
      </main>
    );
  }

  return (
    <main className="profile">
      <header className="profile-header">
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
          <dl>
            <div className="profile-stat">
              <dd>{stats.total_decks}</dd>
              <dt>{stats.total_decks === 1 ? "Deck" : "Decks"}</dt>
            </div>
          </dl>
        </section>
      )}

      <section aria-labelledby="edit-heading">
        <h2 id="edit-heading">Account details</h2>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <div className="profile-actions">
            <button type="submit" disabled={!isDirty || saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>

            <button
              type="button"
              className="profile-secondary"
              onClick={handleReset}
              disabled={!isDirty || saving}
            >
              Discard changes
            </button>
          </div>

          <p
            className={`profile-status profile-status--${status.type}`}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        </form>
      </section>
    </main>
  );
}