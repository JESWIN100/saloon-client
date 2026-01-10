const connection = require("../config/connection");
const nodemailer = require("nodemailer");
const bcrypt=require('bcrypt')
const { logErrorToServer } = require('../utils/errorLogger');
// Promise wrapper for MySQL
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Email transporter (use Gmail app password for security)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "morent369@gmail.com",  // your Gmail ID
    pass: "ytnbjftcckidslyu", // 16 digit App Password
  },
});

// 📨 Send OTP
const crateuser = async (req, res) => {

  
  

  try {
const { email } = req.body;

 if (!email) {
  throw new Error("Email is required");
}




    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
     let userId;
    
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const insertResult = await query(
        `INSERT INTO users (name, email, password, mobile, role, status)
         VALUES (NULL, ?, ?, NULL, 'customer', 1)`,
        [email, hashedPassword]
      );
      userId = insertResult.insertId;
      
    } else {
      userId = users[0].user_id;
      
    }

    const otp = generateOTP();

    await query('INSERT INTO user_otp_codes (email, otp) VALUES (?, ?)', [email, otp]);

    await transporter.sendMail({
      from: 'morent369@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });

    console.log(otp);
    
    res.json({
  success: true,
  message: 'OTP sent successfully',
  otp: otp
});

  } catch (err) {
    console.error('Error in crateuser:', err.message);
     await logErrorToServer('User Module', 'authController.js', 'Error in crateuser', err.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// ✅ Verify OTP
const verify = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    throw new Error("Email and OTP are required")
    // return res.status(400).json({ message: 'Email and OTP are required' });



  try {
    // 1) Verify OTP
    const rows = await query(
      'SELECT * FROM user_otp_codes WHERE email = ? AND otp = ? ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    
    if (rows.length === 0)
       throw new Error("Invalid OTP")
      // return res.status(400).json({ message: 'Invalid OTP' });

    const otpEntry = rows[0];
    // const createdTime = new Date(otpEntry.created_at);
    // const now = new Date();

    // // 2) Check expiry (5 minutes)
    // if ((now - createdTime) / 1000 > 300) {
    //   return res.status(400).json({ message: 'OTP expired' });
    // }

    // 3) Delete OTP
    await query('DELETE FROM user_otp_codes WHERE id = ?', [otpEntry.id]);

    // 4) Fetch user details (id, name, phone etc.)
    const userRows = await query('SELECT user_id, name, email, mobile FROM users WHERE email = ?', [email]);

    if (userRows.length === 0) {
      throw new Error("User not found after OTP verify")
      // return res.status(404).json({ message: 'User not found after OTP verify' });
    }

    const user = userRows[0];



    // 5) Send success response with user details
    res.json({
      message: 'OTP verified successfully',
      success: true,
      user
    });

  } catch (err) {
    console.error('Error in verify:', err);
    await logErrorToServer('User Module', 'authController.js', 'Error in verify', err.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};



const getUserProfile = async(req, res) => {
 try {
   const { id } = req.params; // user_id from request URL
const today = new Date().toISOString().split("T")[0];
  // Query 1: Get user information
  const userQuery = "SELECT user_id, name, email, mobile,profile_image, created_at FROM users WHERE user_id = ?";

  // Query 2: Get booking stats for this user
  const statsQuery = `
    SELECT 
      COUNT(*) AS totalBookings,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedBookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS upcomingBookings,
      COALESCE(SUM(total_amount), 0) AS totalSpent
    FROM booking_master
    WHERE customer_id = ?;
  `;

  connection.query(userQuery, [id], (err, userResult) => {
    if (err) {
      console.error("Error fetching user:", err);
      throw new Error("Database error")
      // return res.status(500).json({ success: false, message: "Database error" });
    }

    if (userResult.length === 0) {
      throw new Error("User not found")
      // return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userResult[0];

    // Get booking stats next
    connection.query(statsQuery, [id], (err, statsResult) => {
      if (err) {
        console.error("Error fetching stats:", err);
        throw new Error("Database error")
        // return res.status(500).json({ success: false, message: "Database error" });
      }

      const stats = statsResult[0];

      // Combine both results
      const userProfile = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profile_image: user.profile_image,
        created_at: user.created_at,
        totalBookings: stats.totalBookings || 0,
        completedBookings: stats.completedBookings || 0,
        upcomingBookings: stats.upcomingBookings || 0,
        totalSpent: stats.totalSpent || 0
      };

      res.status(200).json({ success: true, user: userProfile });
    });
  });
 } catch (error) {
  console.log(error);
  console.error("❌ Error in getUserProfile:", error);

    // Send error to external log server
    await logErrorToServer(
      'User Module',
      'authController.js',
      'Error in getUserProfile',
      error.message
    );

    res.status(500).json({ success: false, message: "Something went wrong" });

 }
};

;

const updateUserProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile } = req.body;




  try {
    let updateQuery = `
      UPDATE users 
      SET name = ?, email = ?, mobile = ?
    `;
    const values = [name, email, mobile];

    // ✅ only update image if new one is uploaded
    if (req.file) {
      updateQuery += `, profile_image = ?`;
      values.push(req.file.filename);
    }

    updateQuery += ` WHERE user_id = ?`;
    values.push(id);

    const result = await query(updateQuery, values);

    if (result.affectedRows === 0) {
      throw new Error("User not found")
    }

    // ✅ fetch updated user to send back to frontend
    const [updatedUser] = await query(`SELECT * FROM users WHERE user_id = ?`, [id]);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("❌ Error updating profile:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

module.exports = { updateUserProfile };



module.exports = { crateuser, verify,getUserProfile,updateUserProfile };
