const nodemailer = require("nodemailer");

const sendMail = async (to, subject, html) => {   // 👈 rename text -> html
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,   // your email
        pass: process.env.EMAIL_PASS    // app password
      }
    });

    await transporter.sendMail({
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html      // 👈 now html is defined correctly
    });

    console.log("Email sent successfully");

  } catch (error) {
    console.error("Email error:", error);
    throw error;  // 👈 better to throw so controller can handle
  }
};

module.exports = sendMail;
