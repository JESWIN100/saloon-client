const connection = require('../config/connection'); // adjust path if needed
const { logErrorToServer } = require('../utils/errorLogger');



const getdatabypincode = async (req, res) => {
  try {
    const { pincode } = req.body;

    const sql = `
      SELECT s.*,
             COUNT(r.review_id) AS review_count,
             IFNULL(AVG(r.rating), 0) AS avg_rating
      FROM salons s
      LEFT JOIN reviews r ON s.salon_id = r.salon_id
      WHERE s.pincode = ?
      GROUP BY s.salon_id
    `;


    connection.query(sql, [pincode], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Database query error');
      }

      if (results.length === 0) {
        return res.status(404).send('No salons found for this pincode');
      }


      return res.json(results);
    });

  } catch (error) {
    console.log(error);
    await logErrorToServer('Home Module', 'homeController.js', 'getdatabypincode Error', error.message);
    return res.status(500).send('Server error');
  }
}



const getSalonsByService = async (req, res) => {
  try {
    const { service_id, pincode } = req.body;

    
    
    let sql = `
      SELECT salons.salon_id, salons.name, salons.address, salons.pincode, salons.image
      FROM salons
      INNER JOIN services ON salons.salon_id = services.salon_id
      WHERE services.service_id = ?
    `;

    const params = [service_id];

    if (pincode) {
      sql += " AND salons.pincode = ?";
      params.push(pincode);
    }

    connection.query(sql, params, (err, results) => {
      if (err) return res.status(500).json({ message: "Database Error" });

      
      return res.status(200).json(results);
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};





const seacrchSalonsByName = async (req, res) => {
  try {
    const { name, pincode } = req.query;

    if (!name || !pincode) {
      return res.status(400).json({ 
        success: false, 
        message: "Both name and pincode are required" 
      });
    }

    const searchTerm = `%${name}%`;

    const sql = `
      SELECT 
        s.*,
        COUNT(r.review_id) AS review_count,
        IFNULL(AVG(r.rating), 0) AS avg_rating
      FROM salons s
      LEFT JOIN reviews r ON s.salon_id = r.salon_id
      WHERE s.name LIKE ? AND s.pincode = ?
      GROUP BY s.salon_id
    `;

    connection.query(sql, [searchTerm, pincode], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Database query error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "No salons found" });
      }

      return res.status(200).json({ success: true, data: results });
    });

  } catch (error) {
    console.log(error);
    await logErrorToServer(
      'Home Module',
      'homeController.js',
      'seacrchSalonsByName Error',
      error.message
    );
    return res.status(500).json({ success: false, message: "Server error" });
  }
};





module.exports = {
  getdatabypincode,
  seacrchSalonsByName,
  getSalonsByService
  

};

