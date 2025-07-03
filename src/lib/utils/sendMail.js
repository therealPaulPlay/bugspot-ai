import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT),
    secure: true,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

export async function sendMail(options) {
    try {
        await transporter.sendMail(options);
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
}