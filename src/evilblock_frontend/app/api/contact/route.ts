import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_SERVER_USER}>`,
      to: process.env.EMAIL_TO_ADDRESS,
      subject: `New Contact Form Message from ${name} - EviBlock`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            New Contact Form Submission - EviBlock
          </h2>

          <div style="margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007bff;">${email}</a></p>
          </div>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

          <p style="color: #666; font-size: 12px;">
            This message was sent from the EviBlock contact form.
          </p>
        </div>
      `,
      replyTo: email,
    };

    // Send email to admin/support team
    await transporter.sendMail(mailOptions);

    // Send confirmation email to sender
    const confirmationMailOptions = {
      from: `"EviBlock Support" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: 'Thank you for contacting EviBlock',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            Thank you for contacting EviBlock!
          </h2>

          <p style="font-size: 16px; line-height: 1.6;">
            Hi ${name},
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for reaching out to us. We've received your message and will get back to you within 24 hours.
          </p>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">
            If you have any additional information or questions, feel free to reply to this email.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            The EviBlock Team
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

          <p style="color: #666; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      `,
    };

    // Send confirmation email
    await transporter.sendMail(confirmationMailOptions);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send email', details: errorMessage },
      { status: 500 }
    );
  }
}