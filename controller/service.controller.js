
const connection=require('../config/connection');
const { logErrorToServer } = require('../utils/errorLogger');
const getservices = async (req, res) => {
  try {
    const sql = `
      SELECT 
        name,
        MIN(price) AS price,
        MIN(duration_minutes) AS duration_minutes,
        MIN(description) AS description,
        MIN(image) AS image
      FROM services
      WHERE status = 1
      GROUP BY name
    `;

    connection.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(200).json(result);
    });

  } catch (error) {
     await logErrorToServer(
      "Service Module",
      "service Controller",
      "Error fetching getservices",
      error.message
    );
   
  }
}






const getServicesByGender = async (req, res) => {
  try {
    let { gender } = req.body;
    

    // Convert to lowercase to match DB enum values
    gender = gender?.toLowerCase();

    const sql = `
      SELECT service_id, name, price, duration_minutes, description, image, gender
      FROM services
      WHERE (gender = ? OR gender = 'unisex') AND status = 1
      GROUP BY name
    `;

    connection.query(sql, [gender], (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

   
      res.status(200).json(result);
    });

  } catch (error) {
       await logErrorToServer(
      "Service Module",
      "service Controller",
      "Error fetching getServicesByGender",
      error.message
    );
    console.error("Catch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports={getservices,getServicesByGender};