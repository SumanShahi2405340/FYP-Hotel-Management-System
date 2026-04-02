// // app/api/hotel-chat/route.js
// import { NextResponse } from "next/server";

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     const { message, context, history = [] } = body;

//     const { rooms = [], bookings = [], prices = {}, inventory = {} } = context;

//     // ── Build rich hotel context snapshot ──────────────────────────────────
//     const now = new Date();

//     const roomSnapshot = rooms.map((r) => {
//       const occupied = bookings.some((b) => {
//         const numMatch =
//           b.room?.toString() === r.number?.toString() ||
//           b.room?.toLowerCase() === r.type?.toLowerCase();
//         if (!numMatch) return false;
//         if (b.status === "Available") return false;
//         const ci = b.checkin ? new Date(b.checkin) : null;
//         const co = b.checkout ? new Date(b.checkout) : null;
//         return ci && co && now >= ci && now < co;
//       });

//       const booking = occupied
//         ? bookings.find((b) => {
//             const numMatch =
//               b.room?.toString() === r.number?.toString() ||
//               b.room?.toLowerCase() === r.type?.toLowerCase();
//             if (!numMatch) return false;
//             const ci = b.checkin ? new Date(b.checkin) : null;
//             const co = b.checkout ? new Date(b.checkout) : null;
//             return ci && co && now >= ci && now < co;
//           })
//         : null;

//       return {
//         number: r.number,
//         type: r.type,
//         price: r.price,
//         isAvailable: !occupied,
//         currentGuest: booking ? booking.name : null,
//         checkoutAt: booking ? booking.checkout : null,
//       };
//     });

//     // ── Stats ──────────────────────────────────────────────────────────────
//     const stats = {
//       total: roomSnapshot.length,
//       available: roomSnapshot.filter((r) => r.isAvailable).length,
//       occupied: roomSnapshot.filter((r) => !r.isAvailable).length,
//       byType: {
//         Normal: {
//           total: roomSnapshot.filter((r) => r.type === "Normal").length,
//           available: roomSnapshot.filter((r) => r.type === "Normal" && r.isAvailable).length,
//           price: prices.normal_price,
//           range: "101-199",
//         },
//         Deluxe: {
//           total: roomSnapshot.filter((r) => r.type === "Deluxe").length,
//           available: roomSnapshot.filter((r) => r.type === "Deluxe" && r.isAvailable).length,
//           price: prices.deluxe_price,
//           range: "201-299",
//         },
//         Suite: {
//           total: roomSnapshot.filter((r) => r.type === "Suite").length,
//           available: roomSnapshot.filter((r) => r.type === "Suite" && r.isAvailable).length,
//           price: prices.suite_price,
//           range: "301-399",
//         },
//       },
//     };

//     // ── Upcoming checkouts (next 48 hrs) ───────────────────────────────────
//     const upcomingCheckouts = bookings
//       .filter((b) => {
//         const co = b.checkout ? new Date(b.checkout) : null;
//         return co && co > now && co < new Date(now.getTime() + 48 * 60 * 60 * 1000);
//       })
//       .map((b) => ({ room: b.room, guest: b.name, checkout: b.checkout }));

//     // ── Active bookings ────────────────────────────────────────────────────
//     const activeBookings = bookings
//       .filter((b) => {
//         if (b.status === "Available") return false;
//         const ci = b.checkin ? new Date(b.checkin) : null;
//         const co = b.checkout ? new Date(b.checkout) : null;
//         return ci && co && now >= ci && now < co;
//       })
//       .map((b) => ({
//         guest: b.name,
//         room: b.room,
//         checkin: b.checkin,
//         checkout: b.checkout,
//         days: b.days,
//         contact: b.contact,
//       }));

//     // ── Available room numbers per type ────────────────────────────────────
//     const availableNormal = roomSnapshot.filter((r) => r.type === "Normal" && r.isAvailable).map((r) => r.number);
//     const availableDeluxe = roomSnapshot.filter((r) => r.type === "Deluxe" && r.isAvailable).map((r) => r.number);
//     const availableSuite  = roomSnapshot.filter((r) => r.type === "Suite"  && r.isAvailable).map((r) => r.number);

//     // ── System prompt ──────────────────────────────────────────────────────
//     const systemPrompt = `You are an expert Hotel Booking Assistant with real-time access to live hotel database data. Answer questions about room availability, pricing, bookings, and give recommendations using only the data provided below.

// CURRENT DATE AND TIME: ${now.toLocaleString("en-US", { timeZone: "UTC" })} UTC

// LIVE HOTEL STATISTICS RIGHT NOW:
// - Total Rooms: ${stats.total}
// - Available Now: ${stats.available}
// - Currently Occupied: ${stats.occupied}
// - Occupancy Rate: ${stats.total > 0 ? ((stats.occupied / stats.total) * 100).toFixed(1) : 0}%

// NORMAL ROOMS (rooms ${stats.byType.Normal.range}):
// - Total: ${stats.byType.Normal.total}
// - Available: ${stats.byType.Normal.available}
// - Occupied: ${stats.byType.Normal.total - stats.byType.Normal.available}
// - Price: $${stats.byType.Normal.price} per night
// - Available room numbers: ${availableNormal.length > 0 ? availableNormal.slice(0, 15).join(", ") + (availableNormal.length > 15 ? ` and ${availableNormal.length - 15} more` : "") : "NONE available right now"}

// DELUXE ROOMS (rooms ${stats.byType.Deluxe.range}):
// - Total: ${stats.byType.Deluxe.total}
// - Available: ${stats.byType.Deluxe.available}
// - Occupied: ${stats.byType.Deluxe.total - stats.byType.Deluxe.available}
// - Price: $${stats.byType.Deluxe.price} per night
// - Available room numbers: ${availableDeluxe.length > 0 ? availableDeluxe.slice(0, 15).join(", ") + (availableDeluxe.length > 15 ? ` and ${availableDeluxe.length - 15} more` : "") : "NONE available right now"}

// SUITE ROOMS (rooms ${stats.byType.Suite.range}):
// - Total: ${stats.byType.Suite.total}
// - Available: ${stats.byType.Suite.available}
// - Occupied: ${stats.byType.Suite.total - stats.byType.Suite.available}
// - Price: $${stats.byType.Suite.price} per night
// - Available room numbers: ${availableSuite.length > 0 ? availableSuite.slice(0, 15).join(", ") + (availableSuite.length > 15 ? ` and ${availableSuite.length - 15} more` : "") : "NONE available right now"}

// CURRENTLY CHECKED IN GUESTS (${activeBookings.length} total):
// ${activeBookings.length > 0
//   ? activeBookings.slice(0, 15).map(
//       (b) => `- Guest: ${b.guest} | Room: ${b.room} | Check-in: ${new Date(b.checkin).toLocaleDateString()} | Check-out: ${new Date(b.checkout).toLocaleDateString()} | Days: ${b.days}`
//     ).join("\n")
//   : "No active bookings right now."}
// ${activeBookings.length > 15 ? `Plus ${activeBookings.length - 15} more active bookings.` : ""}

// UPCOMING CHECKOUTS IN NEXT 48 HOURS:
// ${upcomingCheckouts.length > 0
//   ? upcomingCheckouts.map((c) => `- Room ${c.room} | Guest: ${c.guest} | Checks out: ${new Date(c.checkout).toLocaleString()}`).join("\n")
//   : "No checkouts expected in the next 48 hours."}

// ROOM AMENITIES:
// Normal Room ($${stats.byType.Normal.price}/night): Queen bed, 40 inch Smart TV, Coffee maker, AC, Private bathroom, Free WiFi. Facilities: Free parking, 24/7 room service, Complimentary breakfast.
// Deluxe Room ($${stats.byType.Deluxe.price}/night): King bed, 55 inch 4K TV, Premium coffee machine, Central AC, Luxury bathroom, Mini bar, Free WiFi. Facilities: Reserved parking, 24/7 concierge, Breakfast buffet, Pool access, Gym access.
// Suite Room ($${stats.byType.Suite.price}/night): Super King bed, 65 inch OLED TV, Espresso machine, Climate control, Spa bathroom, Stocked mini bar, Butler service, Ultra WiFi. Facilities: VIP parking, Personal butler, Gourmet breakfast, Private pool, Personal gym.

// HOTEL POLICIES:
// - Check-in time: 2:00 PM
// - Check-out time: 11:00 AM
// - 10% discount for bookings of 3 or more nights
// - All rooms include complimentary breakfast

// YOUR RULES:
// - ONLY use the data above — never make up or guess any numbers
// - Give exact room counts and specific room numbers when asked
// - Calculate prices correctly: price x days = total, apply 10% off for 3+ nights
// - Give specific room recommendations with reasons
// - Use emojis to make responses friendly and easy to read
// - Keep answers clear and concise`;

//     // ── Build messages array for Groq ──────────────────────────────────────
//     const groqMessages = [
//       { role: "system", content: systemPrompt },
//       ...history
//         .filter((h) => h.text && h.text.trim())
//         .map((h) => ({
//           role: h.type === "user" ? "user" : "assistant",
//           content: h.text,
//         })),
//       { role: "user", content: message },
//     ];

//     // ── Call Groq API ──────────────────────────────────────────────────────
//     const groqKey = process.env.GROQ_API_KEY;
//     if (!groqKey) {
//       throw new Error("GROQ_API_KEY is not set in .env.local");
//     }

//     const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${groqKey}`,
//       },
//       body: JSON.stringify({
//         model: "llama-3.1-8b-instant",
//         messages: groqMessages,
//         max_tokens: 1000,
//         temperature: 0.7,
//       }),
//     });

//     if (!response.ok) {
//       const err = await response.json();
//       throw new Error(err?.error?.message || `Groq API error ${response.status}`);
//     }

//     const data = await response.json();
//     const reply =
//       data.choices?.[0]?.message?.content ||
//       "Sorry, I could not generate a response.";

//     return NextResponse.json({ reply });

//   } catch (error) {
//     console.error("Hotel chat API error:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal server error" },
//       { status: 500 }
//     );
//   }
// }




// app/api/hotel-chat/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, context, history = [] } = body;

    const { rooms = [], bookings = [], prices = {}, inventory = {} } = context;

    const now = new Date();

    // ── FIX: Trust isAvailable from frontend (already computed correctly) ──
    // DO NOT recompute occupancy here — the frontend's isOccupied() already
    // handles all room string formats like "101 / Normal", "101", etc.
    // Just use the enrichedRooms array as-is.
    const roomSnapshot = rooms.map((r) => ({
      number:      r.number,
      type:        r.type,
      price:       r.price,
      isAvailable: r.isAvailable, // ✅ use pre-computed value from AddBookings.jsx
    }));

    // ── Stats built from trusted roomSnapshot ──────────────────────────────
    const stats = {
      total:    roomSnapshot.length,
      available: roomSnapshot.filter((r) => r.isAvailable).length,
      occupied:  roomSnapshot.filter((r) => !r.isAvailable).length,
      byType: {
        Normal: {
          total:     roomSnapshot.filter((r) => r.type === "Normal").length,
          available: roomSnapshot.filter((r) => r.type === "Normal" && r.isAvailable).length,
          price:     prices.normal_price,
          range:     "101-199",
        },
        Deluxe: {
          total:     roomSnapshot.filter((r) => r.type === "Deluxe").length,
          available: roomSnapshot.filter((r) => r.type === "Deluxe" && r.isAvailable).length,
          price:     prices.deluxe_price,
          range:     "201-299",
        },
        Suite: {
          total:     roomSnapshot.filter((r) => r.type === "Suite").length,
          available: roomSnapshot.filter((r) => r.type === "Suite" && r.isAvailable).length,
          price:     prices.suite_price,
          range:     "301-399",
        },
      },
    };

    // ── Available & occupied room numbers per type ─────────────────────────
    const availableNormal = roomSnapshot.filter((r) => r.type === "Normal" && r.isAvailable).map((r) => r.number);
    const availableDeluxe = roomSnapshot.filter((r) => r.type === "Deluxe" && r.isAvailable).map((r) => r.number);
    const availableSuite  = roomSnapshot.filter((r) => r.type === "Suite"  && r.isAvailable).map((r) => r.number);
    const occupiedNormal  = roomSnapshot.filter((r) => r.type === "Normal" && !r.isAvailable).map((r) => r.number);
    const occupiedDeluxe  = roomSnapshot.filter((r) => r.type === "Deluxe" && !r.isAvailable).map((r) => r.number);
    const occupiedSuite   = roomSnapshot.filter((r) => r.type === "Suite"  && !r.isAvailable).map((r) => r.number);

    // ── Active bookings (for guest info display) ───────────────────────────
    const activeBookings = bookings
      .filter((b) => {
        const ci = b.checkin  ? new Date(b.checkin)  : null;
        const co = b.checkout ? new Date(b.checkout) : null;
        return ci && co && now >= ci && now < co;
      })
      .map((b) => ({
        guest:    b.name,
        room:     b.room,
        checkin:  b.checkin,
        checkout: b.checkout,
        days:     b.days,
        contact:  b.contact,
      }));

    // ── Upcoming checkouts (next 48 hrs) ───────────────────────────────────
    const upcomingCheckouts = bookings
      .filter((b) => {
        const co = b.checkout ? new Date(b.checkout) : null;
        return co && co > now && co < new Date(now.getTime() + 48 * 60 * 60 * 1000);
      })
      .map((b) => ({ room: b.room, guest: b.name, checkout: b.checkout }));

    // ── System prompt ──────────────────────────────────────────────────────
    const systemPrompt = `You are an expert Hotel Booking Assistant with real-time access to live hotel database data. Answer questions about room availability, pricing, bookings, and give recommendations using only the data provided below.

CURRENT DATE AND TIME: ${now.toLocaleString("en-US", { timeZone: "UTC" })} UTC

LIVE HOTEL STATISTICS RIGHT NOW:
- Total Rooms: ${stats.total}
- Available Now: ${stats.available}
- Currently Occupied: ${stats.occupied}
- Occupancy Rate: ${stats.total > 0 ? ((stats.occupied / stats.total) * 100).toFixed(1) : 0}%

NORMAL ROOMS (rooms ${stats.byType.Normal.range}):
- Total: ${stats.byType.Normal.total}
- Available NOW: ${stats.byType.Normal.available}
- Occupied NOW: ${stats.byType.Normal.total - stats.byType.Normal.available}
- Price: $${stats.byType.Normal.price} per night
- Available room numbers: ${availableNormal.length > 0 ? availableNormal.join(", ") : "NONE available right now"}
- Occupied room numbers: ${occupiedNormal.length > 0 ? occupiedNormal.join(", ") : "none"}

DELUXE ROOMS (rooms ${stats.byType.Deluxe.range}):
- Total: ${stats.byType.Deluxe.total}
- Available NOW: ${stats.byType.Deluxe.available}
- Occupied NOW: ${stats.byType.Deluxe.total - stats.byType.Deluxe.available}
- Price: $${stats.byType.Deluxe.price} per night
- Available room numbers: ${availableDeluxe.length > 0 ? availableDeluxe.join(", ") : "NONE available right now"}
- Occupied room numbers: ${occupiedDeluxe.length > 0 ? occupiedDeluxe.join(", ") : "none"}

SUITE ROOMS (rooms ${stats.byType.Suite.range}):
- Total: ${stats.byType.Suite.total}
- Available NOW: ${stats.byType.Suite.available}
- Occupied NOW: ${stats.byType.Suite.total - stats.byType.Suite.available}
- Price: $${stats.byType.Suite.price} per night
- Available room numbers: ${availableSuite.length > 0 ? availableSuite.join(", ") : "NONE available right now"}
- Occupied room numbers: ${occupiedSuite.length > 0 ? occupiedSuite.join(", ") : "none"}

CURRENTLY CHECKED IN GUESTS (${activeBookings.length} total):
${activeBookings.length > 0
  ? activeBookings.map(
      (b) => `- Guest: ${b.guest} | Room: ${b.room} | Check-in: ${new Date(b.checkin).toLocaleDateString()} | Check-out: ${new Date(b.checkout).toLocaleDateString()} | Days: ${b.days}`
    ).join("\n")
  : "No active bookings right now."}

UPCOMING CHECKOUTS IN NEXT 48 HOURS:
${upcomingCheckouts.length > 0
  ? upcomingCheckouts.map((c) => `- Room ${c.room} | Guest: ${c.guest} | Checks out: ${new Date(c.checkout).toLocaleString()}`).join("\n")
  : "No checkouts expected in the next 48 hours."}

ROOM AMENITIES:
Normal Room ($${stats.byType.Normal.price}/night): Queen bed, 40 inch Smart TV, Coffee maker, AC, Private bathroom, Free WiFi. Facilities: Free parking, 24/7 room service, Complimentary breakfast.
Deluxe Room ($${stats.byType.Deluxe.price}/night): King bed, 55 inch 4K TV, Premium coffee machine, Central AC, Luxury bathroom, Mini bar, Free WiFi. Facilities: Reserved parking, 24/7 concierge, Breakfast buffet, Pool access, Gym access.
Suite Room ($${stats.byType.Suite.price}/night): Super King bed, 65 inch OLED TV, Espresso machine, Climate control, Spa bathroom, Stocked mini bar, Butler service, Ultra WiFi. Facilities: VIP parking, Personal butler, Gourmet breakfast, Private pool, Personal gym.

HOTEL POLICIES:
- Check-in time: 2:00 PM
- Check-out time: 11:00 AM
- 10% discount for bookings of 3 or more nights
- All rooms include complimentary breakfast

YOUR RULES:
- ONLY use the data above — never make up or guess any numbers
- "Available NOW" means the room is free this moment. "Total" is NOT the same as available.
- When asked how many rooms are available, use the "Available NOW" number — NOT "Total"
- When listing available rooms, list ONLY the room numbers from "Available room numbers" list
- Calculate prices correctly: price x days = total, apply 10% off for 3+ nights
- Give specific room recommendations with reasons
- Use emojis to make responses friendly and easy to read
- Keep answers clear and concise`;

    // ── Build messages for Groq ────────────────────────────────────────────
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((h) => h.text && h.text.trim())
        .map((h) => ({
          role: h.type === "user" ? "user" : "assistant",
          content: h.text,
        })),
      { role: "user", content: message },
    ];

    // ── Call Groq API ──────────────────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new Error("GROQ_API_KEY is not set in .env.local");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant",
        messages:    groqMessages,
        max_tokens:  1000,
        temperature: 0.3, // ✅ lowered from 0.7 — more factual, less hallucination
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || `Groq API error ${response.status}`);
    }

    const data  = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Hotel chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}