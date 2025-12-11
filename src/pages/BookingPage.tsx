// src/pages/BookingPage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { apiUrl } from "../api";

type Slot = {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
};

type SlotsByDate = {
  dateLabel: string;
  slots: Slot[];
};

export default function BookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [lastBookingId, setLastBookingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const { token, user } = useAuth();

  function groupSlotsByDate(allSlots: Slot[]): SlotsByDate[] {
    const groups: Record<string, Slot[]> = {};
    for (const s of allSlots) {
      const d = new Date(s.start_time);
      const key = d.toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    const result: SlotsByDate[] = Object.entries(groups).map(([_, list]) => {
      const d = new Date(list[0].start_time);
      return {
        dateLabel: d.toLocaleDateString(),
        slots: list.sort(
          (a, b) =>
            new Date(a.start_time).getTime() -
            new Date(b.start_time).getTime()
        ),
      };
    });
    result.sort((a, b) => {
      const da = new Date(a.slots[0].start_time).getTime();
      const db = new Date(b.slots[0].start_time).getTime();
      return da - db;
    });
    return result;
  }

  useEffect(() => {
    if (!doctorId) return;

    async function loadSlots() {
      try {
        const res = await fetch(apiUrl(`/api/doctors/${doctorId}/slots`));
        if (!res.ok) throw new Error("Failed to load slots");
        const data: Slot[] = await res.json();
        setSlots(data);
        setSlotsByDate(groupSlotsByDate(data));
      } catch (err: any) {
        setError(err.message ?? "Error loading slots");
      } finally {
        setLoading(false);
      }
    }

    loadSlots();
  }, [doctorId]);

  async function handleBook() {
    if (!doctorId || !selectedSlotId) return;
    if (!token || !user) {
      setBookingStatus("Please login as patient to book.");
      return;
    }
    if (!reason.trim()) {
      setBookingStatus("Please enter a reason for your visit.");
      return;
    }
    setBookingStatus("Booking...");

    try {
      const res = await fetch(
        apiUrl(
          `/api/doctors/${doctorId}/slots/${selectedSlotId}/bookings`
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_name: user.email,
            patient_email: user.email,
            reason: reason.trim(),
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Booking failed");
      }

      const data = await res.json();
      setLastBookingId(data.id);
      setBookingStatus(
        `Booking created with id ${data.id}, status ${data.status}`
      );
    } catch (err: any) {
      setBookingStatus(`Error: ${err.message}`);
    }
  }

  async function handleConfirm() {
    if (!lastBookingId) return;
    setBookingStatus("Confirming (fake payment)...");

    try {
      const res = await fetch(apiUrl("/api/payments/fake"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: lastBookingId, success: true }),
      });

      if (!res.ok) throw new Error("Payment failed");

      const data = await res.json();
      setBookingStatus(
        `Booking ${data.id} confirmed, status ${data.status}`
      );
    } catch (err: any) {
      setBookingStatus(`Error confirming: ${err.message}`);
    }
  }

  if (!doctorId) return <div className="card">Missing doctor id</div>;
  if (loading) return <div className="card">Loading slots...</div>;
  if (error) return <div className="card">Error: {error}</div>;
  if (slots.length === 0) return <div className="card">No available slots.</div>;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          background:
            "linear-gradient(120deg, rgba(56,189,248,0.95), rgba(0,82,204,0.9))",
          color: "white",
          padding: "1rem 1.5rem",
          margin: "-1.4rem -1.8rem 1.1rem -1.8rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Book Appointment</h1>
        <p style={{ margin: "0.3rem 0 0" }}>
          Choose a convenient date and time, then specify your reason for visit.
        </p>
      </div>

      {slotsByDate.map((group) => (
        <div key={group.dateLabel} style={{ marginBottom: "0.9rem" }}>
          <h3 style={{ marginBottom: "0.3rem" }}>{group.dateLabel}</h3>
          <ul className="list-clean">
            {group.slots.map((s) => (
              <li key={s.id}>
                <label>
                  <input
                    type="radio"
                    name="slot"
                    value={s.id}
                    onChange={() => setSelectedSlotId(s.id)}
                  />{" "}
                  {new Date(s.start_time).toLocaleTimeString()} –{" "}
                  {new Date(s.end_time).toLocaleTimeString()} (
                  {s.status.toLowerCase()})
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div style={{ marginTop: 12 }}>
        <label>
          Reason for visit
          <textarea
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Fever, headache, general check-up"
          />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          disabled={!selectedSlotId}
          onClick={handleBook}
          className="button-primary"
        >
          <span>Book Selected Slot</span>
        </button>{" "}
        <button
          disabled={!lastBookingId}
          onClick={handleConfirm}
          className="button-primary"
        >
          <span>Confirm (Fake Payment)</span>
        </button>
      </div>

      {bookingStatus && <p style={{ marginTop: 10 }}>{bookingStatus}</p>}
    </div>
  );
}
