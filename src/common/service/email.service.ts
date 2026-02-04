import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendResetPasswordEmail(
    email: string,
    resetCode: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@traids.com',
      to: email,
      subject: 'Password Reset Code - Traids',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Use the code below to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${resetCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Traids Team</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendComplianceEmail(
    recipientEmail: string,
    projectName: string,
    companyName: string,
    files: {
      RAMS: string[];
      permits: string[];
      reports: string[];
      incidents: string[];
      drawings: string[];
    },
  ): Promise<void> {
    const formatFileList = (fileUrls: string[], category: string) => {
      if (!fileUrls || fileUrls.length === 0) {
        return `<p style="color: #666; font-style: italic;">No ${category} files available</p>`;
      }

      return fileUrls.map((url, index) => {
        const fileName = url.split('/').pop() || `${category}-file-${index + 1}`;
        return `
          <div style="margin: 8px 0;">
            <a href="${url}" 
               style="color: #2563eb; text-decoration: none; font-weight: 500;"
               target="_blank">
              📎 ${decodeURIComponent(fileName)}
            </a>
          </div>
        `;
      }).join('');
    };

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@traids.com',
      to: recipientEmail,
      subject: `Compliance Documents - ${projectName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                📋 Compliance Documents
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">
                Dear Recipient,
              </p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                <strong>${companyName}</strong> has shared compliance documentation for the following project:
              </p>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1e40af;">
                  ${projectName}
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <!-- RAMS Section -->
              <div style="margin-bottom: 25px;">
                <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center;">
                  📋 RAMS (Risk Assessment Method Statements)
                </h2>
                ${formatFileList(files.RAMS, 'RAMS')}
              </div>

              <!-- Permits Section -->
              <div style="margin-bottom: 25px;">
                <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center;">
                  📄 Permits
                </h2>
                ${formatFileList(files.permits, 'Permits')}
              </div>

              <!-- Reports Section -->
              <div style="margin-bottom: 25px;">
                <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center;">
                  📊 Reports
                </h2>
                ${formatFileList(files.reports, 'Reports')}
              </div>

              <!-- Incidents Section -->
              <div style="margin-bottom: 25px;">
                <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center;">
                  ⚠️ Incidents
                </h2>
                ${formatFileList(files.incidents, 'Incidents')}
              </div>

              <!-- Drawings Section -->
              <div style="margin-bottom: 25px;">
                <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center;">
                  📐 Drawings
                </h2>
                ${formatFileList(files.drawings, 'Drawings')}
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                Best regards,<br>
                <strong>${companyName}</strong><br>
                <em>via Traids Platform</em>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                This email was sent from the Traids Compliance Management System
              </p>
            </div>

          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
