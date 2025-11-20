const connection = require("../config/connection");
const { logErrorToServer } = require("../utils/errorLogger");

const getdatabyId = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    // 1. Get the optional selected date from query parameters
    const selectedDate = req.query.date;

    // Get today's date string (YYYY-MM-DD)
    const todayString = new Date().toISOString().split("T")[0];

    // 2. Determine the target date for which slots are being fetched
    // Use the selected date (trimmed/validated) or default to today
    const targetDate = selectedDate && !isNaN(new Date(selectedDate))
        ? selectedDate.split("T")[0]
        : todayString;

    // Determine if the target date is today. This flag controls time filtering.
    const isTargetDateToday = targetDate === todayString;
    
    // Get the day of the week for the target date
    const dayOfWeek = new Date(targetDate).toLocaleDateString("en-US", { weekday: "long" });

    // --- Current Time Check Logic ---
    let currentDateTime = new Date(0); // Default to an ancient time (effectively past)

    if (isTargetDateToday) {
        // If the target date is today, we set the current time boundary
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 8);
        currentDateTime = new Date(`${todayString}T${currentTime}`);
    }

    // 1️⃣ Salon info (no change)
    const salon = await new Promise((resolve, reject) => {
      connection.query("SELECT * FROM salons WHERE salon_id = ?", [id], (err, results) =>
        err ? reject(err) : resolve(results[0])
      );
    });
    if (!salon) return res.status(404).send("Salon not found");

    // 2️⃣ Services offered by this salon (no change)
    const services = await new Promise((resolve, reject) => {
      connection.query("SELECT * FROM services WHERE salon_id = ?", [id], (err, results) =>
        err ? reject(err) : resolve(results)
      );
    });

    // 3️⃣ Holiday check (uses targetDate)
    const isHoliday = await new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM salon_holidays WHERE salon_id = ? AND holiday_date = ?",
        [id, targetDate],
        (err, results) => (err ? reject(err) : resolve(results.length > 0))
      );
    });

    // 4️⃣ Working hours (uses dayOfWeek for targetDate)
    const hoursRows = await new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM salon_working_hours WHERE salon_id = ? AND day_of_week = ?",
        [id, dayOfWeek],
        (err, results) => (err ? reject(err) : resolve(results))
      );
    });

    // If closed or holiday, return empty slots
    if (!hoursRows.length || isHoliday) {
      return res.json({
        salon,
        services,
        slots_by_service: services.map(s => ({
          service_id: s.service_id,
          service_name: s.name,
          duration_minutes: s.duration_minutes,
          slots: []
        }))
      });
    }

    const { start_time, end_time } = hoursRows[0];

    // 5️⃣ Generate available slots per service
    const slots_by_service = [];

    for (const service of services) {
      const duration = service.duration_minutes;
      // Use targetDate for generating start/end times
      let start = new Date(`${targetDate}T${start_time}`);
      let end = new Date(`${targetDate}T${end_time}`);
      if (end <= start) end.setDate(end.getDate() + 1);

      // --- Fetch booked slots from booking_details table (uses targetDate) ---
      const bookedRows = await new Promise((resolve, reject) => {
        connection.query(
          `SELECT bd.start_time, bd.end_time 
           FROM booking_details bd
           JOIN booking_master bm ON bd.booking_id = bm.booking_id
           WHERE bm.salon_id = ? AND bd.service_id = ? AND DATE(bm.booking_date) = ?
           AND bm.status != 'cancelled'`,
           
          [id, service.service_id, targetDate],
          (err, results) => (err ? reject(err) : resolve(results))
        );
      });

      const bookedSlots = bookedRows.map(b => ({
        // Note: We use targetDate to create the full Date objects for comparison
        start: new Date(`${targetDate}T${b.start_time}`),
        end: new Date(`${targetDate}T${b.end_time}`)
      }));

      const slots = [];
      while (start < end) {
        const slotEnd = new Date(start.getTime() + duration * 60000);
        if (slotEnd > end) break;

        // 🎯 CRITICAL LOGIC CHANGE: Filter out past slots ONLY if isTargetDateToday is true
        const isPast = isTargetDateToday && (start < currentDateTime);
        const isBooked = bookedSlots.some(bs => start < bs.end && slotEnd > bs.start);

        if (!isBooked && !isPast) {
          slots.push({
            slot_id: `${service.service_id}-${start.getTime()}`, // frontend unique ID
            start_time: start.toTimeString().slice(0, 5),
            end_time: slotEnd.toTimeString().slice(0, 5),
            is_booked: false
          });
        }

        start = slotEnd;
      }




      slots_by_service.push({
        service_id: service.service_id,
        service_name: service.name,
        duration_minutes: duration,
        slots
      });
    }



// 6️⃣ Get average rating for the salon
const avgRatingResult = await new Promise((resolve, reject) => {
  connection.query(
    "SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_reviews FROM reviews WHERE salon_id = ?",
    [id],
    (err, results) => (err ? reject(err) : resolve(results[0]))
  );
});

salon.avg_rating = avgRatingResult?.avg_rating ? parseFloat(avgRatingResult.avg_rating.toFixed(1)) : 0;
salon.total_reviews = avgRatingResult?.total_reviews || 0;



    res.json({ salon, services, slots_by_service, is_today: isTargetDateToday, date: targetDate });

  } catch (err) {
    console.error(err);
    await logErrorToServer(
      "Salon Module",
      "getdatabyId Controller",
      "Error fetching salon data or saloon slots",
      err.message
    );
    res.status(500).send("Server error");
  }
};

module.exports = { getdatabyId };
