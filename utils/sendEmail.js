const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "morent369@gmail.com",  // your Gmail ID
    pass: "qtrtyqggedwztkkb", // 16 digit App Password
  },
});




const sendMail = async (to, subject, text, html) => {
  if (!to) return false;
  try {
    const info = await transporter.sendMail({ from: '"Go 2 Saloon" <morent369@gmail.com>',
       to, subject, text, html });
    console.log("Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
};

const sendConfirmation = async (customerName, customerEmail, salonName, serviceNames, startTime, endTime) => {
  const servicesStr = Array.isArray(serviceNames) ? serviceNames.join(', ') : serviceNames;
  return sendMail(
    customerEmail,
    `Booking Sucessfull - ${salonName}`,
    `Hi ${customerName}, your booking at ${salonName} for ${servicesStr} from ${startTime} to ${endTime} has been confirmed!`,
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; background-color: #e91e63; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Booking Confirmed!</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">${salonName}</p>
      </div>
      <div style="padding: 20px; background-color: white; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; line-height: 1.5;">Hi <strong>${customerName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Your booking at <strong>${salonName}</strong> has been confirmed! ✅</p>
        <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 16px;"><strong>Service:</strong> ${servicesStr}</p>
          <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">We look forward to seeing you!</p>
        <p style="font-size: 16px; line-height: 1.5; text-align: center; margin-top: 30px;">💇‍♀️ <strong>Go 2 Salon Team</strong></p>
      </div>
    </div>`
  );
};

const sendCancellationEmail = async (customerEmail, customerName, reason) => {

  const message = `
    Your booking has been cancelled as per your request.
    <br/><br/>
    <strong>Cancellation Reason:</strong> ${reason}
    <br/><br/>
    We respect your choice and hope to serve you in the future.
    <br/><br/>
    <strong>Cancellation Policy:</strong><br/>
    - If payment was made online, refund (if applicable) will be processed within 3-7 business days.<br/>
    - If cancellation occurred after service preparation has begun, some charges may still apply.<br/>
    - Please contact our support team if you have any questions.
  `;

  return sendMail(
    customerEmail,
    "Your Booking has been Cancelled",
    `Hi ${customerName}, your booking has been cancelled.`,
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; background-color: #d32f2f; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Booking Cancelled</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">Go 2 Salon</p>
      </div>
      <div style="padding: 20px; background-color: white; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; line-height: 1.5;">Hi <strong>${customerName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">
          ${message}
        </p>
        <hr style="margin: 25px 0;">
        <p style="font-size: 14px; color: #555;">
          If you have any questions or need assistance, feel free to reply to this email or contact our support team.
        </p>
        <p style="font-size: 16px; line-height: 1.5; margin-top: 30px;">Regards,<br/><strong>Go 2 Salon Team</strong></p>
      </div>
    </div>`
  );
};



module.exports = { sendConfirmation, sendCancellationEmail };
