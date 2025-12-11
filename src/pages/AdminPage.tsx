// src/pages/AdminPage.tsx
import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "../AuthContext";
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

type Slot = {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
};

export default function AdminPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [city, setCity] = useState("");
  const [consultationType, setConsultationType] =
    useState("IN_PERSON");
  const [consultationFee, setConsultationFee] = useState("");
  const [rating, setRating] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [selectedDoctorId, setSelectedDoctorId] =
    useState<number | null>(null);
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotCreating, setSlotCreating] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slotSuccess, setSlotSuccess] = useState<string | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const { token, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  async function loadDoctors() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl("/api/doctors"));
      if (!res.ok) throw new Error("Failed to load doctors");
      const data: Doctor[] = await res.json();
      setDoctors(data);
      if (data.length > 0 && selectedDoctorId === null) {
        setSelectedDoctorId(data[0].id);
        await loadSlotsForDoctor(data[0].id);
      }
    } catch (err: any) {
      setError(err.message ?? "Error loading doctors");
    } finally {
      setLoading(false);
    }
  }

  async function loadSlotsForDoctor(doctorId: number) {
    try {
      setSlotsLoading(true);
      setSlotsError(null);
      const res = await fetch(
        apiUrl(`/api/doctors/${doctorId}/slots`)
      );
      if (!res.ok) throw new Error("Failed to load slots");
      const data: Slot[] = await res.json();
      setSlots(data);
    } catch (err: any) {
      setSlotsError(err.message ?? "Error loading slots");
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateDoctor(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      if (!token) throw new Error("Login as admin first");
      if (
        !name.trim() ||
        !specialization.trim() ||
        !city.trim() ||
        !consultationType.trim() ||
        !consultationFee.trim()
      ) {
        throw new Error("All fields except rating are required");
      }

      const res = await fetch(apiUrl("/api/admin/doctors"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          specialization: specialization.trim(),
          city: city.trim(),
          consultation_type: consultationType,
          consultation_fee: Number(consultationFee),
          rating: rating.trim() ? Number(rating) : null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create doctor");
      }

      await res.json();
      setCreateSuccess("Doctor created successfully");
      setName("");
      setSpecialization("");
      setCity("");
      setConsultationType("IN_PERSON");
      setConsultationFee("");
      setRating("");
      await loadDoctors();
    } catch (err: any) {
      setCreateError(err.message ?? "Error creating doctor");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateSlot(e: FormEvent) {
    e.preventDefault();
    setSlotCreating(true);
    setSlotError(null);
    setSlotSuccess(null);

    try {
      if (!token) throw new Error("Login as admin first");
      if (!selectedDoctorId) {
        throw new Error("Please select a doctor first");
      }
      if (!slotStart.trim() || !slotEnd.trim()) {
        throw new Error("Start and end time are required");
      }

      const start_time = new Date(slotStart).toISOString();
      const end_time = new Date(slotEnd).toISOString();

      const res = await fetch(
        apiUrl(`/api/admin/doctors/${selectedDoctorId}/slots`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ start_time, end_time }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create slot");
      }

      await res.json();
      setSlotSuccess("Slot created successfully");
      setSlotStart("");
      setSlotEnd("");
      await loadSlotsForDoctor(selectedDoctorId);
    } catch (err: any) {
      setSlotError(err.message ?? "Error creating slot");
    } finally {
      setSlotCreating(false);
    }
  }

  async function handleDeleteDoctor(id: number) {
    if (!token) {
      alert("Login as admin first");
      return;
    }
    if (!confirm("Delete this doctor and all their slots/bookings?")) return;

    try {
      const res = await fetch(
        apiUrl(`/api/admin/doctors/${id}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete doctor");
      }
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoctorId === id) {
        setSelectedDoctorId(null);
        setSlots([]);
      }
    } catch (err: any) {
      alert(err.message ?? "Error deleting doctor");
    }
  }

  async function handleDeleteSlot(slotId: number) {
    if (!token) {
      alert("Login as admin first");
      return;
    }
    if (!selectedDoctorId) return;
    if (!confirm("Delete this slot?")) return;

    try {
      const res = await fetch(
        apiUrl(
          `/api/admin/doctors/${selectedDoctorId}/slots/${slotId}`
        ),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete slot");
      }
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err: any) {
      alert(err.message ?? "Error deleting slot");
    }
  }

  if (!isAdmin) {
    return (
      <div className="card">
        Admin access only. Please login as an admin user.
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          background:
            "linear-gradient(120deg, rgba(15,23,42,0.95), rgba(0,82,204,0.9))",
          color: "white",
          padding: "1rem 1.5rem",
          margin: "-1.4rem -1.8rem 1.1rem -1.8rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <p style={{ margin: "0.3rem 0 0" }}>
          Create and manage doctors and their appointment slots.
        </p>
      </div>

      <h2>Create Doctor</h2>
      <form onSubmit={handleCreateDoctor}>
        <div className="form-row">
          <label>
            Name
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Specialization
            <input
              className="input"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              disabled={creating}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            City
            <input
              className="input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={creating}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Consultation Type
            <select
              className="input"
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value)}
              disabled={creating}
            >
              <option value="IN_PERSON">IN_PERSON</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Consultation Fee
            <input
              className="input"
              type="number"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              disabled={creating}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Rating (optional)
            <input
              className="input"
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              disabled={creating}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="button-primary"
        >
          <span>{creating ? "Creating..." : "Create Doctor"}</span>
        </button>
      </form>
      {createError && <p style={{ color: "red" }}>{createError}</p>}
      {createSuccess && (
        <p style={{ color: "green" }}>{createSuccess}</p>
      )}

      <h2>Existing Doctors</h2>
      {loading && <div>Loading doctors...</div>}
      {error && <div>Error: {error}</div>}
      {!loading && !error && doctors.length === 0 && (
        <div>No doctors found.</div>
      )}
      {!loading && !error && doctors.length > 0 && (
        <>
          <table className="table-basic">
            <thead>
              <tr>
                <th>Select</th>
                <th>ID</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>City</th>
                <th>Type</th>
                <th>Fee</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td>
                    <input
                      type="radio"
                      name="selectedDoctor"
                      checked={selectedDoctorId === d.id}
                      onChange={async () => {
                        setSelectedDoctorId(d.id);
                        await loadSlotsForDoctor(d.id);
                      }}
                    />
                  </td>
                  <td>{d.id}</td>
                  <td>{d.name}</td>
                  <td>{d.specialization}</td>
                  <td>{d.city}</td>
                  <td>{d.consultation_type}</td>
                  <td>{d.consultation_fee}</td>
                  <td>{d.rating ?? "-"}</td>
                  <td>
                    <button
                      className="button-danger"
                      onClick={() => handleDeleteDoctor(d.id)}
                    >
                      <span>Delete Doctor</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Create Slot for Selected Doctor</h2>
          <form onSubmit={handleCreateSlot}>
            <div className="form-row">
              <label>
                Start Time
                <input
                  className="input"
                  type="datetime-local"
                  value={slotStart}
                  onChange={(e) => setSlotStart(e.target.value)}
                  disabled={slotCreating}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                End Time
                <input
                  className="input"
                  type="datetime-local"
                  value={slotEnd}
                  onChange={(e) => setSlotEnd(e.target.value)}
                  disabled={slotCreating}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={slotCreating || !selectedDoctorId}
              className="button-primary"
            >
              <span>{slotCreating ? "Creating slot..." : "Create Slot"}</span>
            </button>
          </form>
          {slotError && <p style={{ color: "red" }}>{slotError}</p>}
          {slotSuccess && (
            <p style={{ color: "green" }}>{slotSuccess}</p>
          )}

          <h2>Slots for Selected Doctor</h2>
          {slotsLoading && <div>Loading slots...</div>}
          {slotsError && <div>Error: {slotsError}</div>}
          {!slotsLoading && !slotsError && slots.length === 0 && (
            <div>No slots for this doctor.</div>
          )}
          {!slotsLoading && !slotsError && slots.length > 0 && (
            <ul className="list-clean">
              {slots.map((s) => (
                <li key={s.id}>
                  Slot {s.id}:{" "}
                  {new Date(s.start_time).toLocaleString()} –{" "}
                  {new Date(s.end_time).toLocaleTimeString()} [{s.status}]{" "}
                  <button
                    className="button-danger"
                    onClick={() => handleDeleteSlot(s.id)}
                  >
                    <span>Delete Slot</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
