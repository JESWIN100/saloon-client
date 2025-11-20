


const getlocation=async(req,res)=>{
     const { lat, lon } = req.query;

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon,
          format: "json",
          addressdetails: 1,
        },
        headers: {
          "User-Agent": "MyServerApp/1.0 (contact@example.com)"
        }
      }
    );


    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Reverse failed" });
  }
}


const searchlocation=async(req,res)=>{
     const { q } = req.query;

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q,
          countrycodes: "in",
          format: "json",
          addressdetails: 1,
        },
        headers: {
          "User-Agent": "MyServerApp/1.0 (contact@example.com)"
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
}

module.exports={
getlocation,
searchlocation
}