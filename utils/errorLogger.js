const axios = require('axios');

const logErrorToServer = async (moduleName, fileName, errorTitle, errorDetails) => {
  try {
    const now = new Date();
    const DateStr = now.toISOString().split('T')[0];
    const TimeStr = now.toTimeString().split(' ')[0];

    await axios.post('http://localhost:4040/user/error', {
      moduleName,
      fileName,
      errorTitle,
      errorDetails,
      Date: DateStr,
      time: TimeStr
    });
  } catch (err) {
    console.error('❌ Failed to send error to log server:', err.message);
  }
};

module.exports = { logErrorToServer };
