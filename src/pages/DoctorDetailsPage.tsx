// src/pages/DoctorDetailsPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiUrl } from "../api";

type Doctor = {
  id: number;
  name: string;
  specialization: string;
  city: string;
  consultation_type: string;
  consultation_fee: number;
  rating: number | null;
};

export default function DoctorDetailsPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoctor() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(apiUrl("/api/doctors"));
        if (!res.ok) throw new Error("Failed to load doctors");
        const data: Doctor[] = await res.json();
        const idNum = Number(doctorId);
        const found = data.find((d) => d.id === idNum) || null;
        if (!found) {
          setError("Doctor not found");
        }
        setDoctor(found);
      } catch (err: any) {
        setError(err.message ?? "Error loading doctor");
      } finally {
        setLoading(false);
      }
    }

    if (doctorId) {
      loadDoctor();
    } else {
      setLoading(false);
      setError("Missing doctor id");
    }
  }, [doctorId]);

  if (loading) return <div className="card">Loading doctor...</div>;
  if (error) return <div className="card">Error: {error}</div>;
  if (!doctor) return <div className="card">Doctor not found.</div>;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          background:
            "linear-gradient(120deg, rgba(59,130,246,0.95), rgba(37,99,235,0.9))",
          color: "white",
          padding: "1rem 1.5rem",
          margin: "-1.4rem -1.8rem 1.1rem -1.8rem",
        }}
      >
        <h1 style={{ margin: 0 }}>{doctor.name}</h1>
        <p style={{ margin: "0.3rem 0 0" }}>
          {doctor.specialization} · {doctor.city}
        </p>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <h2>Consultation Details</h2>
        <p>
          Type: <strong>{doctor.consultation_type}</strong>
        </p>
        <p>
          Fee: <strong>₹{doctor.consultation_fee}</strong>
        </p>
        <p>
          Rating: <strong>{doctor.rating ?? "Not rated"}</strong>
        </p>
      </div>

      <div className="grid-two">
        <section>
          <h3>About Doctor</h3>
          <p style={{ fontSize: "0.9rem" }}>
            Dr. {doctor.name} is an experienced{" "}
            {doctor.specialization.toLowerCase()} specialist based in{" "}
            {doctor.city}. The doctor consults{" "}
            {doctor.consultation_type === "ONLINE"
              ? "online through video consultations."
              : "in-person at CityCare Hospital."}
          </p>
        </section>
        <section>
          <h3>Next Steps</h3>
          <p style={{ fontSize: "0.9rem" }}>
            You can view available slots and book an appointment with this
            doctor.
          </p>
          <Link to={`/booking/${doctor.id}`}>
            <button className="button-primary">
              <span>Book Appointment</span>
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
}
