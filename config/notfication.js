const axios = require('axios');
const sendNotification = (from,to, type, message, related_id) => {
  axios.post("http://localhost:7000/notifications/create", {
    role: "salon",
    from_id: from,          // client id
    to_id: to,            // salon id
    type: type,
    message: message,
    related_id: related_id
  })
  .then(response => {
    console.log("Notification response:", response.data);
  })
  .catch(error => {
    console.error("Error sending notification:", error);
  });
};







module.exports = { sendNotification };
