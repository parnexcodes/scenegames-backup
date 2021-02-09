const nodemailer = require('nodemailer');
const Isemail = require('isemail');

exports.contact = async (req, res) => {
  res.render('contact');
};

exports.submit = async (req, res) => {
  const errors = [];

  if (!req.body.name || !req.body.email || !req.body.body) {
    errors.push('Some required fields are missing.');
  }

  if (req.body.email && !Isemail.validate(req.body.email)) {
    errors.push('Email is invalid.');
  }

  if (req.body.name.length > 255) {
    errors.push('Your name is too long.');
  }

  if (errors.length > 0) {
    return res.render('contact', { success: false, errors });
  }

  const name = req.body.name.trim();
  const email = req.body.email.trim();
  const body = req.body.body.trim();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const dateStr = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()} ${new Date().getHours()}:${new Date().getMinutes()}`;
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_RCPT}>`,
      to: process.env.SMTP_RCPT,
      replyTo: email,
      subject: `SceneGames.to Contact Form Submission (${dateStr})`,
      text: body,
    });

    return res.render('contact', { success: true });
  } catch (error) {
    return res.render('contact', { success: false, errors: ['Error during message transport.'] });
  }
};
