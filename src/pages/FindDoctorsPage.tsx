// src/pages/FindDoctorsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../api";

type Doctor = {
  id: number;
  name: string;
  specialization: string;
  city: string;
};

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await fetch(apiUrl("/api/doctors"));
        if (!res.ok) throw new Error("Failed to load doctors");
        const data: Doctor[] = await res.json();
        setDoctors(data);
      } catch (err: any) {
        setError(err.message ?? "Error loading doctors");
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  if (loading) return <div className="card">Loading doctors...</div>;
  if (error) return <div className="card">Error: {error}</div>;
  if (doctors.length === 0) return <div className="card">No doctors found.</div>;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          background:
            "linear-gradient(120deg, rgba(0,82,204,0.9), rgba(56,189,248,0.9))",
          color: "white",
          padding: "1rem 1.5rem",
          margin: "-1.4rem -1.8rem 1.1rem -1.8rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Find Doctors</h1>
        <p style={{ margin: "0.3rem 0 0" }}>
          Browse our specialists and book appointments in a few clicks.
        </p>
      </div>

      <ul className="list-clean">
        {doctors.map((d) => (
          <li key={d.id}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span>
                {d.name} – {d.specialization} ({d.city})
              </span>
              <Link to={`/doctor/${d.id}`}>
                <button className="button-primary">
                  <span>View Details</span>
                </button>
              </Link>
              <Link to={`/booking/${d.id}`}>
                <button className="button-primary">
                  <span>Book</span>
                </button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
