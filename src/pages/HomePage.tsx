// src/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { apiUrl } from "../api";

type BookingItem = {
  booking: {
    id: number;
    status: string;
    appointment_date: string;
  };
  doctor: {
    id: number;
    name: string;
    specialization: string;
    city: string;
  };
};

export default function HomePage() {
  const { user } = useAuth();
  const isPatient = user?.role === "PATIENT";
  const email = user?.email ?? "";

  const [nextBooking, setNextBooking] = useState<BookingItem | null>(null);
  const [nextLoading, setNextLoading] = useState(false);
  const [nextError, setNextError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPatient || !email) {
      setNextBooking(null);
      return;
    }

    async function loadNext() {
      try {
        setNextLoading(true);
        setNextError(null);
        const res = await fetch(
          apiUrl(
            `/api/patients/bookings?email=${encodeURIComponent(email)}`
          )
        );
        if (!res.ok) throw new Error("Failed to load bookings");
        const data: BookingItem[] = await res.json();

        const now = new Date();
        const future = data.filter((item) => {
          const d = new Date(item.booking.appointment_date);
          return d.getTime() >= now.getTime();
        });

        if (future.length === 0) {
          setNextBooking(null);
          return;
        }

        future.sort(
          (a, b) =>
            new Date(a.booking.appointment_date).getTime() -
            new Date(b.booking.appointment_date).getTime()
        );

        setNextBooking(future[0]);
      } catch (err: any) {
        setNextError(err.message ?? "Error loading next appointment");
      } finally {
        setNextLoading(false);
      }
    }

    loadNext();
  }, [isPatient, email]);

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden", borderRadius: "14px" }}
    >
      {isPatient && (
        <div style={{ padding: "0.9rem 1.6rem 0 1.6rem" }}>
          <h3 style={{ margin: "0 0 0.4rem 0" }}>Your next appointment</h3>
          {nextLoading && <p>Checking your upcoming bookings...</p>}
          {nextError && <p style={{ color: "red" }}>{nextError}</p>}
          {!nextLoading && !nextError && !nextBooking && (
            <p style={{ fontSize: "0.9rem" }}>
              You don&apos;t have any upcoming appointments. Use{" "}
              <strong>Find Doctors</strong> to book one.
            </p>
          )}
          {!nextLoading && !nextError && nextBooking && (
            <div
              style={{
                padding: "0.7rem 0.9rem",
                borderRadius: "10px",
                background:
                  "linear-gradient(90deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))",
                border: "1px solid rgba(59,130,246,0.3)",
                fontSize: "0.9rem",
              }}
            >
              <div>
                <strong>
                  Dr. {nextBooking.doctor.name} –{" "}
                  {nextBooking.doctor.specialization}
                </strong>
              </div>
              <div>
                {new Date(
                  nextBooking.booking.appointment_date
                ).toLocaleString()}{" "}
                ({nextBooking.booking.status})
              </div>
              <div style={{ color: "#64748b" }}>
                Location: {nextBooking.doctor.city}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          position: "relative",
          minHeight: 260,
          backgroundImage:
            "url('https://images.pexels.com/photos/6129052/pexels-photo-6129052.jpeg?auto=compress&cs=tinysrgb&w=1200')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          marginTop: isPatient ? "0.75rem" : 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(0,82,204,0.9), rgba(15,23,42,0.85))",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: "2rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <h1 style={{ margin: 0 }}>CityCare Multispeciality Hospital</h1>
          <p style={{ maxWidth: 520 }}>
            Compassionate, technology-driven healthcare with experienced
            specialists, 24x7 emergency, and seamless online appointments.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                24x7 Emergency
              </div>
              <div style={{ fontWeight: 600 }}>+91-98765-12345</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                Appointment Helpline
              </div>
              <div style={{ fontWeight: 600 }}>+91-98765-54321</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>Email</div>
              <div style={{ fontWeight: 600 }}>
                [care@citycarehospital.com](mailto:care@citycarehospital.com)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>
        <h2>Facilities & Specialities</h2>
        <div className="grid-two">
          <section>
            <ul>
              <li>24x7 Emergency and Trauma Care</li>
              <li>Advanced Cardiology & Cardiac Surgery</li>
              <li>Neuro & Ortho Care Units</li>
              <li>Fully equipped ICU and NICU</li>
              <li>Diagnostic Lab and Imaging (MRI, CT, X-ray)</li>
              <li>Day-care Surgery & Pharmacy</li>
            </ul>
          </section>
          <section>
            <h3>Location & Contact</h3>
            <p>
              CityCare Multispeciality Hospital,
              <br />
              123 Health Street, Andheri East,
              <br />
              Mumbai, Maharashtra – 400059
            </p>
            <p style={{ fontSize: "0.9rem" }}>
              For appointments, use the <strong>Find Doctors</strong> page to
              search for specialists and book your visit online.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
