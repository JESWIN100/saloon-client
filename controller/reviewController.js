const connection=require('../config/connection')
const addReview = (req, res) => {
  const {bookingId, salon_id, customer_id, customer_name, rating, review_text } = req.body;



try {
    
  if (!salon_id || !customer_id || !customer_name || !rating) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO reviews (booking_id,salon_id, customer_id, customer_name, rating, review_text)
    VALUES (?,?, ?, ?, ?, ?)
  `;

  connection.query(sql, [bookingId,salon_id, customer_id, customer_name, rating, review_text], (err) => {
    if (err) {
      console.error("Review insert error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    return res.json({ message: "Review added successfully" });
  });
} catch (error) {
    console.log(error);
    
}

};


const getSalonRatingStats = (req, res) => {
  const { salon_id } = req.params;
console.log(salon_id);

  const sql = `
    SELECT 
      ROUND(AVG(rating), 1) AS average_rating,
      COUNT(*) AS total_reviews
    FROM reviews
    WHERE salon_id = ?
  `;

  connection.query(sql, [salon_id], (err, results) => {
    if (err) {
      console.error("Rating stats fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    const data = results[0] || { average_rating: 0, total_reviews: 0 };

    return res.json(data);
  });
};


const check = (req, res) => {
  const { bookingId, customer_id } = req.params;


  const sql = `SELECT * FROM reviews WHERE booking_id = ? AND customer_id = ?`;
  connection.query(sql, [bookingId, customer_id], (err, results) => {
    if (err) return res.status(500).json({ error: err });


    res.json({
      hasReview: results.length > 0 // true if this customer already rated
    });
  });
};



module.exports={
    addReview,
    getSalonRatingStats,
    check
}