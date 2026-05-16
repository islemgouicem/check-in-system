# 📲 S&T Check-in System

A QR-based attendance and access control system built for **:contentReference[oaicite:0]{index=0} events**, designed to manage presence, prevent duplication, and organize event logistics efficiently.

🌐 Live System: https://snt-checkin-sys.netlify.app/login

---

## ⚡ Overview

This system was built to handle **real-world event operations** during S&T activities, including:

- Daily check-in (start of day attendance)
- Meal-time validation (lunch/dinner control)
- Organizer shift tracking
- Prevention of duplicate food distribution
- Real-time presence verification

Each participant and organizer receives a **unique QR code via email**, used for all check-ins.

---

## 🧠 Core Idea

Instead of manual attendance lists or paper-based verification:

👉 Every person has a QR identity  
👉 Every action is scanned in real time  
👉 Every scan updates the system instantly  

This removes:
- Human error
- Duplicate entries
- Fake check-ins
- Chaos during high-attendance moments

---

## 🚀 Key Features

### 👤 Role-Based System
- 👨‍💼 Admin panel (full control)
- 🧑‍🏫 Manager panel (scan & verify)

### 📷 QR Check-in
- Scan QR codes using phone camera
- Instant validation of identity
- Works for both participants and organizers

### 🍽️ Meal Control System
- Ensures **one meal per person per time slot**
- Prevents duplication or abuse

### ⏱️ Shift Management
- Tracks organizer attendance by shift
- Ensures fair workload distribution

### 📧 Automated QR Distribution
- QR codes sent via email to all users
- Unique per participant/organizer

---

## 🛠️ Tech Stack

- Frontend: React / Next.js *(adjust if needed)*
- Backend: Node.js / Express *(if applicable)*
- Database: MongoDB / PostgreSQL *(if applicable)*
- QR System: QR Code generation + scanning API
- Deployment: Netlify

---

## 🔐 System Architecture

1. User is registered (participant or organizer)
2. System generates unique QR code
3. QR sent via email automatically
4. Manager scans QR during events
5. Backend validates:
   - Identity
   - Time slot
   - Previous scans
6. Attendance is recorded instantly

---

## 🧩 Use Cases

- 📅 Event attendance tracking
- 🍱 Food distribution control
- 👥 Organizer shift management
- 📊 Real-time participation monitoring

---

## 🧪 Why this system matters

During large events, manual management leads to:
- Confusion
- Overlapping entries
- Resource waste

This system ensures:
> **One person → One identity → One scan per action**

---

## 👑 Contributors

Built for the **Skill & Tell Scientific Club** under event operations.

- 💻 IT Department implementation
- 🧠 Club managers: logic design & workflow validation

---

## 🚀 Future Improvements

- Face recognition integration
- Offline scanning mode
- Advanced analytics dashboard
- QR expiration & security rotation
- Mobile app version

---

## 📫 Contact

For improvements or contributions, reach out to the IT department of Skill & Tell Scientific Club.
