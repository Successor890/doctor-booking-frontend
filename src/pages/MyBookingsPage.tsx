// src/pages/MyBookingsPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { apiUrl } from "../api";

type BookingItem = {
  booking: {
    id: number;
    status: string;
    queue_number: number;
    appointment_date: string;
    reason: string | null;
    payment_status: string;
  };
  doctor: {
    id: number;
    name: string;
    specialization: string;
    city: string;
  };
  slot: {
    id: number;
    start_time: string;
    end_time: string;
  };
  people_ahead: number;
  estimated_wait_minutes: number;
};

type SlotSummary = {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const email = user?.email;

  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reschedulingBookingId, setReschedulingBookingId] =
    useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotSummary[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  async function load() {
    if (!email) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        apiUrl(
          `/api/patients/bookings?email=${encodeURIComponent(email)}`
        )
      );
      if (!res.ok) throw new Error("Failed to load bookings");
      const data: BookingItem[] = await res.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message ?? "Error loading bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [email]);

  async function handleCancel(bookingId: number) {
    try {
      const res = await fetch(
        apiUrl(`/api/bookings/${bookingId}/cancel`),
        { method: "PATCH" }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Cancel failed");
      }
      setReschedulingBookingId(null);
      setAvailableSlots([]);
      await load();
    } catch (err: any) {
      alert(err.message ?? "Error cancelling booking");
    }
  }

  async function handlePay(bookingId: number) {
    try {
      const res = await fetch(apiUrl("/api/payments/fake"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, success: true }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Payment failed");
      }
      setReschedulingBookingId(null);
      setAvailableSlots([]);
      await load();
    } catch (err: any) {
      alert(err.message ?? "Error confirming payment");
    }
  }

  async function startReschedule(item: BookingItem) {
    setReschedulingBookingId(item.booking.id);
    setAvailableSlots([]);
    setSlotsError(null);
    setSlotsLoading(true);
    try {
      const res = await fetch(
        apiUrl(`/api/doctors/${item.doctor.id}/slots`)
      );
      if (!res.ok) throw new Error("Failed to load available slots");
      const data: SlotSummary[] = await res.json();
      setAvailableSlots(data);
    } catch (err: any) {
      setSlotsError(err.message ?? "Error loading slots");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function confirmReschedule(newSlotId: number) {
    if (!reschedulingBookingId) return;
    try {
      const res = await fetch(
        apiUrl(
          `/api/bookings/${reschedulingBookingId}/reschedule`
        ),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_slot_id: newSlotId }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Reschedule failed");
      }
      setReschedulingBookingId(null);
      setAvailableSlots([]);
      await load();
    } catch (err: any) {
      alert(err.message ?? "Error rescheduling booking");
    }
  }

  if (!email) {
    return (
      <div className="card">
        Please login as a patient to view your bookings.
      </div>
    );
  }

  if (loading) return <div className="card">Loading bookings...</div>;
  if (error) return <div className="card">Error: {error}</div>;
  if (items.length === 0) return <div className="card">No active bookings.</div>;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          background:
            "linear-gradient(120deg, rgba(0,82,204,0.95), rgba(30,64,175,0.9))",
          color: "white",
          padding: "1rem 1.5rem",
          margin: "-1.4rem -1.8rem 1.1rem -1.8rem",
        }}
      >
        <h1 style={{ margin: 0 }}>My Bookings</h1>
        <p style={{ margin: "0.3rem 0 0" }}>
          View, cancel or reschedule your active appointments.
        </p>
      </div>

      <table className="table-basic">
        <thead>
          <tr>
            <th>ID</th>
            <th>Doctor</th>
            <th>Specialization</th>
            <th>City</th>
            <th>Status / Payment</th>
            <th>Appointment Date</th>
            <th>Slot Time</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.booking.id}>
              <td>{item.booking.id}</td>
              <td>{item.doctor.name}</td>
              <td>{item.doctor.specialization}</td>
              <td>{item.doctor.city}</td>
              <td>
                <span className="badge badge-pending">
                  {item.booking.status} / {item.booking.payment_status}
                </span>
              </td>
              <td>
                {new Date(
                  item.booking.appointment_date
                ).toLocaleDateString()}{" "}
                {new Date(
                  item.booking.appointment_date
                ).toLocaleTimeString()}
              </td>
              <td>
                {new Date(item.slot.start_time).toLocaleTimeString()} -{" "}
                {new Date(item.slot.end_time).toLocaleTimeString()}
              </td>
              <td>{item.booking.reason ?? "-"}</td>
              <td>
                {item.booking.status !== "CANCELLED" && (
                  <button
                    className="button-danger"
                    onClick={() => handleCancel(item.booking.id)}
                  >
                    <span>Cancel</span>
                  </button>
                )}{" "}
                {item.booking.status === "PENDING" &&
                  item.booking.payment_status === "PENDING" && (
                    <button
                      className="button-primary"
                      onClick={() => handlePay(item.booking.id)}
                    >
                      <span>Pay & Confirm</span>
                    </button>
                  )}{" "}
                {(item.booking.status === "PENDING" ||
                  item.booking.status === "CONFIRMED") && (
                  <button
                    className="button-primary"
                    onClick={() => startReschedule(item)}
                  >
                    <span>Reschedule</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {reschedulingBookingId && (
        <div style={{ marginTop: 16 }}>
          <h2>Reschedule Booking #{reschedulingBookingId}</h2>
          {slotsLoading && <div>Loading available slots...</div>}
          {slotsError && (
            <div style={{ color: "red" }}>{slotsError}</div>
          )}
          {!slotsLoading && !slotsError && availableSlots.length === 0 && (
            <div>No available slots for this doctor.</div>
          )}
          {!slotsLoading && availableSlots.length > 0 && (
            <ul className="list-clean">
              {availableSlots.map((s) => (
                <li key={s.id}>
                  Slot {s.id}:{" "}
                  {new Date(s.start_time).toLocaleString()} -{" "}
                  {new Date(s.end_time).toLocaleTimeString()}{" "}
                  <button
                    className="button-primary"
                    onClick={() => confirmReschedule(s.id)}
                  >
                    <span>Choose this slot</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
