const connection = require('../config/connection');
const Razorpay = require("razorpay");
const crypto = require("crypto"); // Add this at the top
const {sendConfirmation, sendCancellationEmail} = require('../utils/sendEmail');
const { logErrorToServer } = require('../utils/errorLogger');
const { sendNotification } = require('../config/notfication');
const createBooking = async (req, res) => {
  const {id}=req.params;
  try {
    const {
      salonId,
      service_id, // array of service IDs
      slot_id,
      salonName,
      payment_method,
      start_time,
      end_time,
      customer_name,
      date,
      customer_phone,
      customer_email,
      
      totalPrice
    } = req.body;
    

    const customer_id = id
    const payment_status = payment_method === 'pay_now' ? 'paid' : 'pending';
    const booking_status = 'pending';

    const query = (sql, params) =>
      new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

    const insertMasterSql = `
      INSERT INTO booking_master 
      (customer_id, salon_id,	booking_date, status, payment_status, total_amount,payment_method)
      VALUES (?,?, ?, ?, ?, ?, ?)
    `;

    const masterResult = await query(insertMasterSql, [
      customer_id,
      salonId,
      date,
      booking_status,
      payment_status,
      totalPrice,
      payment_method
    ]);

    const bookingId = masterResult.insertId;

    // 2️⃣ Insert into booking_details for each service
    for (const id of service_id) {
      const detailSql = `
        INSERT INTO booking_details 
        (booking_id, service_id, start_time, end_time, amount, status)
        VALUES (?, ?, ?,  ?, ?, ?)
      `;

      await query(detailSql, [
        bookingId,
        id,
        start_time,
        end_time,
        totalPrice / service_id.length, // divide equally or adjust logic
        'pending'
      ]);
    }

    // 3️⃣ Fetch service names for confirmation
    const placeholders = service_id.map(() => '?').join(',');
    const serviceRows = await query(
      `SELECT name FROM services WHERE service_id IN (${placeholders})`,
      service_id
    );
    const serviceNames = serviceRows.map(s => s.name).join(', ');

    // 4️⃣ Send confirmation email
    sendConfirmation(customer_name, customer_email, salonName, serviceNames,date, start_time, end_time)
      .then((sent) => {
        if (!sent){
          throw new Error("Booking saved, but email failed to send.")

        }
          
      })
      .catch((err) => console.error('Email error:', err));

    // 5️⃣ WhatsApp message

    const to = salonId; // salon receives notification
    const type = "Booking Scuccess";
    const  message= `Congrats ${customer_name}! 
Your slot has been booked successfully.
Please wait while ${salonName} confirms your booking.
You’ll get a notification once it’s confirmed.`;
    const related_id = bookingId;
    

    await sendNotification(to, customer_id, type, message, related_id);


    // 6️⃣ Respond
    res.json({
      success: true,
      message: 'Booking created successfully!',
      booking_id: bookingId,
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    await logErrorToServer('Booking Module', 'bookingController.js', 'createBooking Error', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};





// 1. Import


// 2. Initialize
const razorpay = new Razorpay({
    key_id: "rzp_test_RNHIkNYj8x7yTK",
    key_secret: "nOOzvtGiOG3dEyjLBgX9sD19",
});

// 3. Use in your function
const booking_razopay = async (req, res) => {
    try {
        const { amount } = req.body;

if(!amount){
  throw new Error("amount is required!")
}
        
        const order = await razorpay.orders.create({
            amount: amount * 100, // convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });


        res.json(order);
        
    } catch (err) {
        console.error(err);
        await logErrorToServer('Booking Module', 'bookingController.js', 'booking_razopay Error', err.message);
        res.status(500).send("Razorpay order creation failed");
    }
};




const razopay_success = async (req, res) => {
  const {id}=req.params;
  try {
    const {
      salonId,
      service_id,  // array of service IDs
      salonName,
      start_time,
      end_time,
      customer_name,
      customer_phone,
      customer_email,
      orderId,
      payment_method,
      paymentId,
      signature,
      totalPrice,
      date
    } = req.body;


    

    const customer_id = id;
    const booking_status = "pending";
    // const payment_method = "pay_now";
    let payment_status = "pending";

    if (orderId) payment_status = "paid";

    // ✅ Verify razorpay signature
    const generated_signature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generated_signature !== signature) {
      throw new Error("Payment verification failed")
      // return res.status(400).json({
      //   success: false,
      //   message: "Payment verification failed",
      // });
    }

   
    
    // Helper query function
    const query = (sql, params) =>
      new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

    // 1️⃣ Insert into booking_master
    const insertMasterSql = `
      INSERT INTO booking_master 
      (customer_id, salon_id, booking_date, status, payment_status, total_amount,payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const masterResult = await query(insertMasterSql, [
      customer_id,
      salonId,
      date,
      booking_status,
      payment_status,
      totalPrice,
      payment_method
    ]);

    const bookingId = masterResult.insertId;




    // 2️⃣ Insert into booking_details for each service
    for (const sid of service_id) {
      const detailSql = `
        INSERT INTO booking_details
        (booking_id, service_id, start_time, end_time, amount, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await query(detailSql, [
        bookingId,
        sid,
        start_time,
        end_time,
        totalPrice / service_id.length, // amount per service
        "pending",
      ]);
    }


    
    // 3️⃣ Fetch service names
    const placeholders = service_id.map(() => "?").join(",");
    const serviceRows = await query(
      `SELECT name FROM services WHERE service_id IN (${placeholders})`,
      service_id
    );
    const serviceNames = serviceRows.map((s) => s.name).join(", ");

    // 4️⃣ Send confirmation email
    sendConfirmation(
      customer_name,
      customer_email,
      salonName,
      serviceNames,
      start_time,
      end_time
    ).catch((err) => console.log("Email sending failed:", err));


    const to = salonId; // salon receives notification
    const type = "Booking Scuccess";
    const  message= `Congrats ${customer_name}! 
Your slot has been booked successfully.
Please wait while ${salonName} confirms your booking.
You’ll get a notification once it’s confirmed.`;
    const related_id = bookingId;

    await sendNotification(to, customer_id, type, message, related_id);

    // 5️⃣ Return response
    res.json({
      success: true,
      message: "Booking created successfully with online payment!",
      booking_id: bookingId,
    });

   
    
  } catch (err) {
    console.error("Razorpay Success Error:", err);
    await logErrorToServer("Payment Module", "bookingController.js", "razopay_success Error", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




const getBookingsByCustomerId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });

    const rows = await new Promise((resolve, reject) => {
      connection.query(
        `
        SELECT 
          bm.booking_id, bm.booking_date, bm.status AS booking_status,
          bm.payment_status, bm.total_amount,
          bd.detail_id, bd.start_time, bd.end_time,
          bd.amount AS service_amount, bd.status AS service_status,
          s.name AS service_name
        FROM booking_master bm
        JOIN booking_details bd ON bm.booking_id = bd.booking_id
        JOIN services s ON bd.service_id = s.service_id
        WHERE bm.customer_id = ?
        ORDER BY bm.booking_date DESC, bd.detail_id ASC
        `,
        [id],
        (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }
      );
    });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this customer",
      });
    }

    // 🔹 Group data by booking_id
    const bookingsMap = new Map();

    rows.forEach((row) => {
      if (!bookingsMap.has(row.booking_id)) {
        bookingsMap.set(row.booking_id, {
          booking_id: row.booking_id,
          booking_date: row.booking_date,
          booking_status: row.booking_status,
          payment_status: row.payment_status,
          total_amount: row.total_amount,
          services: [],
        });
      }

      bookingsMap.get(row.booking_id).services.push({
        detail_id: row.detail_id,
        service_name: row.service_name,
        start_time: row.start_time,
        end_time: row.end_time,
        service_amount: row.service_amount,
        service_status: row.service_status,
      });
    });

    const allBookings = Array.from(bookingsMap.values());

    // 🔹 Group by booking_status (based on enum values)
    const upcoming = allBookings.filter(
      (b) => b.booking_status === "pending" || b.booking_status === "confirmed"
    );
    const completed = allBookings.filter(
      (b) => b.booking_status === "completed"
    );
    const cancelled = allBookings.filter(
      (b) => b.booking_status === "cancelled"
    );

    // ✅ Send grouped response
    res.status(200).json({
      success: true,
      data: {
        upcoming,
        completed,
        cancelled,
      },
    });
  } catch (error) {
    console.error("❌ getBookingsByCustomerId Error:", error);
    await logErrorToServer("Payment Module", "bookingController.js", "getBookingsByCustomerId Error", error.message);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};








const getBookingById = async(req, res) => {
  const { id } = req.params; // booking_id from URL params
try {
  



  if (!id) {
    throw new Error("Booking ID is required")
    // return res.status(400).json({ success: false, message: "Booking ID is required" });
  }

  const query = `
    SELECT 
      bm.booking_id,
      bm.customer_id,
      bm.salon_id,
      bm.booking_date,
      bm.status AS booking_status,
      bm.payment_status,
      bm.total_amount,
      u.name AS user_name,
      u.email AS user_email,
      u.mobile AS user_phone,
      s.name AS salon_name,
      s.image AS image,
      s.address AS salon_address,
      s.phone AS salon_phone,
      bd.detail_id,
      bd.start_time,
      bd.end_time,
      bd.amount AS service_amount,
      bd.status AS service_status,
      sv.name AS service_name
    FROM booking_master bm
    JOIN booking_details bd ON bm.booking_id = bd.booking_id
    JOIN services sv ON bd.service_id = sv.service_id
    JOIN users u ON bm.customer_id = u.user_id
    LEFT JOIN salons s ON bm.salon_id = s.salon_id
    WHERE bm.booking_id = ?
    ORDER BY bd.detail_id ASC
  `;

  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Build structured response
    const booking = {
      booking_id: results[0].booking_id,
      customer_id: results[0].customer_id,
      user_name: results[0].user_name,
      user_email: results[0].user_email,
      user_phone: results[0].user_phone,
      salon_id: results[0].salon_id,
      salon_name: results[0].salon_name,
      salon_address: results[0].salon_address,
      salon_phone: results[0].salon_phone,
      booking_date: results[0].booking_date,
      booking_status: results[0].booking_status,
      payment_status: results[0].payment_status,
      total_amount: results[0].total_amount,
      image:results[0].image,
      services: results.map(row => ({
        detail_id: row.detail_id,
        service_name: row.service_name,
        start_time: row.start_time,
        end_time: row.end_time,
        service_amount: row.service_amount,
        service_status: row.service_status
      }))
    };

    res.status(200).json({ success: true, data: booking });
  });
} catch (error) {
  console.log(error);
   await logErrorToServer('Booking Module', 'bookingController.js', 'getBookingById Error', error.message);
  
}
};





const cancellBooking = async (req, res) => {
  const { detailId } = req.params;
  const { status, reason } = req.body;

 

  try {
    if (!detailId || !status) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    // 1️⃣ Cancel the service in booking_details
    const cancelSql = 'UPDATE booking_details SET status = ? WHERE detail_id = ?';
    connection.query(cancelSql, [status, detailId], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (result.affectedRows === 0)
        throw new Error("Service not found")
        //  return res.status(404).json({ success: false, message: 'Service not found' });

      // 2️⃣ Log cancellation
      const logSql = `
        INSERT INTO cancelled_bookings (booking_id, detail_id, cancelled_status, cancelled_reason) 
        VALUES ((SELECT booking_id FROM booking_details WHERE detail_id = ?), ?, ?, ?)
      `;
      connection.query(logSql, [detailId, detailId, status, reason || null]);

      // 3️⃣ Get booking_id to verify if remaining services exist
      const getBookingSql = 'SELECT booking_id FROM booking_details WHERE detail_id = ?';
      connection.query(getBookingSql, [detailId], (err2, bookingResult) => {
        if (err2) 
          throw new Error("Database error")
          // return res.status(500).json({ success: false, message: 'Database error' });

        const bookingId = bookingResult[0].booking_id;

        // 4️⃣ Check remaining active services
        const checkActiveSql = `
          SELECT COUNT(*) AS activeCount 
          FROM booking_details 
          WHERE booking_id = ? AND status != 'cancelled'
        `;
        connection.query(checkActiveSql, [bookingId], (err3, countResult) => {
          if (err3) return res.status(500).json({ success: false, message: 'Database error' });

          const activeCount = countResult[0].activeCount;

          // 5️⃣ Fetch user + service name for email
          const getUserSql = `
SELECT 
  u.name AS customer_name,
  u.email AS customer_email,
  s.name AS service_name,
  sm.name AS salon_name,
  sm.address AS salon_address,
  bm.booking_date AS booking_date,
  CONCAT(bd.start_time, ' - ', bd.end_time) AS slot_time
FROM users u
JOIN booking_master bm ON u.user_id = bm.customer_id
JOIN booking_details bd ON bm.booking_id = bd.booking_id
JOIN services s ON bd.service_id = s.service_id
JOIN salons sm ON bm.salon_id = sm.salon_id
WHERE bd.detail_id = ?;

`;

          connection.query(getUserSql, [detailId], async (err4, userResult) => {
            console.log(err4);

            if (!err4 && userResult.length > 0) {

              const { 
  customer_name, 
  customer_email, 
  service_name, 
  salon_name, 
  salon_address, 
  booking_date, 
  slot_time 
} = userResult[0];
;





              await sendCancellationEmail(
                customer_email,
                customer_name,
                  salon_name, 
  salon_address, 
  booking_date, 
  slot_time ,
  reason,
                `Your service "${service_name}" has been cancelled.${reason ? ` Reason: ${reason}` : ''}`
              );
            }

            // 6️⃣ If no active services → cancel full booking
            if (activeCount === 0) {
              const updateMasterSql = 'UPDATE booking_master SET status = ? WHERE booking_id = ?';
              connection.query(updateMasterSql, ['cancelled', bookingId], () => {
                return res.json({
                  success: true,
                  message: 'Service cancelled. All services cancelled → Booking cancelled. Email sent.'
                });
              });
            } else {
              return res.json({
                success: true,
                message: 'Service cancelled. Email notification sent.'
              });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Cancel Error:', error);
    await logErrorToServer('Booking Module', 'bookingController.js', 'cancellBooking Error', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};




module.exports = { createBooking, booking_razopay,razopay_success,getBookingsByCustomerId,getBookingById,cancellBooking };
