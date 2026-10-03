import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS

if (!smtpUser || !smtpPass) {
    console.warn('[NODEMAILER] SMTP_USER or SMTP_PASS environment variables are missing! OTP email sending will fail.')
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
})

export default transporter;