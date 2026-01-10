const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "morent369@gmail.com",  // your Gmail ID
    pass: "ytnbjftcckidslyu", // 16 digit App Password
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

const sendConfirmation = async (customerName, customerEmail, salonName,date, serviceName, startTime, endTime) => {
   return sendMail(
    customerEmail,
    `Booking Request Received – Waiting for ${salonName} Confirmation`,
    `Hi ${customerName}, your booking request at ${salonName} is under review.`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; background: #f4f4f4; padding: 20px;">
      
      <!-- Outer Card -->
      <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e0e0e0; overflow: hidden;">

        <!-- Header -->
        <div style="background: #f59e0b; padding: 25px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 26px;">Booking Pending</h2>
          <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">
            Waiting for salon confirmation
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 25px;">

          <p style="font-size: 16px;">
            Hi <strong>${customerName}</strong>,
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for booking with <strong>${salonName}</strong> 🎉  
            Your appointment request has been successfully sent and is currently 
            <strong>waiting for approval from the salon owner</strong>.
          </p>

          <!-- Booking Details -->
          <div style="background: #fafafa; padding: 18px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0;">
            <p style="margin: 6px 0; font-size: 16px;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Time:</strong> ${startTime} – ${endTime}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">
            Once the salon confirms your booking, you’ll receive another email instantly.  
            Please sit back and relax — happy styling ahead ✨
          </p>

          <p style="font-size: 18px; text-align: center; margin-top: 30px; font-weight: bold;">
            Go 2 Salon Team 
          </p>

        </div>
      </div>

    </div>
    `
  );
};

const sendCancellationEmail = async (
  customerEmail, 
  customerName,
  salonName, 
  salonAddress, 
  bookingDate, 
  slotTime, 
  serviceName,
  reason
) => {

  return sendMail(
    customerEmail,
    `Booking Cancelled - ${salonName}`,
    `Hi ${customerName}, your booking at ${salonName} for ${serviceName} on ${bookingDate} has been cancelled.`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; background: #f4f4f4; padding: 20px;">
      
      <!-- Outer Card -->
      <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e0e0e0; overflow: hidden;">

        <!-- Header -->
        <div style="background: #d32f2f; padding: 25px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 26px;">Booking Cancelled</h2>
          <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">${salonName}</p>
        </div>

        <!-- Body -->
        <div style="padding: 25px;">

          <p style="font-size: 16px;">Hi <strong>${customerName}</strong>,</p>

          <p style="font-size: 16px; line-height: 1.6;">
            Your booking has been successfully cancelled.  
            Below are the details of your cancelled appointment:
          </p>

          <!-- Booking Details Card -->
          <div style="background: #fafafa; padding: 18px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0;">
            <p style="margin: 6px 0; font-size: 16px;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Salon:</strong> ${salonName}</p>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Address:</strong> ${salonAddress}</p>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Date:</strong> ${bookingDate}</p>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Time:</strong> ${slotTime}</p>
            <p style="margin: 6px 0; font-size: 16px;"><strong>Reason:</strong> ${reason}</p>
          </div>

          <!-- Cancellation Policy -->
          <div style="background: #fff3f3; padding: 15px; border-radius: 8px; border: 1px solid #f5c6cb;">
            <p style="margin: 0; font-size: 14px; color: #d32f2f;">
              <strong>Cancellation Policy:</strong><br/>
              • More than 24 hours before: 100% refund<br/>
              • 24 to 12 hours before: 50% refund<br/>
              • 12 to 6 hours before: 30% refund<br/>
              • Less than 6 hours before: No refund
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
            We hope to serve you in the future. If you have any questions, feel free to contact us anytime.
          </p>

          <p style="font-size: 18px; text-align: center; margin-top: 30px; font-weight: bold;">
            Go 2 Salon Team
          </p>

        </div>
      </div>

    </div>
    `
  );
};




module.exports = { sendConfirmation, sendCancellationEmail };
