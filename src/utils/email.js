// utils/email.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "jairo.littel@ethereal.email",
    pass: "uKGXpEN95REd7tgsRu",
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: `"Traids Platform" <no-reply@traids.com>`,
    to,
    subject,
    text,
    html,
  });

  console.log("🚀 Email sent:", nodemailer.getTestMessageUrl(info));
  return info;
};
