export const generateVerificationEmail = (verificationLink: string) => {
  const subject = "Verify your email address";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: hsl(0,0%,100%); color: hsl(222.2,84%,4.9%); border: 1px solid hsl(214.3,31.8%,91.4%); border-radius: 8px; padding: 32px;">
      <h2>Hello👋</h2>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <p style="text-align: center;">
        <a href="${verificationLink}" 
           style="background-color: hsl(221.2,83.2%,53.3%); color: hsl(210,40%,98%); padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${verificationLink}" style="color: hsl(221.2,83.2%,53.3%);">${verificationLink}</a></p>
      <br />
      <p style="font-size: 12px; color: hsl(215.4,16.3%,46.9%);">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;

  return { subject, html };
};

export const generateForgotPasswordEmail = (resetLink: string) => {
  const subject = "Reset your password";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: hsl(0,0%,100%); color: hsl(222.2,84%,4.9%); border: 1px solid hsl(214.3,31.8%,91.4%); border-radius: 8px; padding: 32px;">
      <h2>Hello👋</h2>
      <p>We received a request to reset your password. Click the button below to create a new one:</p>
      <p style="text-align: center;">
        <a href="${resetLink}"
           style="background-color: hsl(221.2,83.2%,53.3%); color: hsl(210,40%,98%); padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>If you didn't request a password reset, you can ignore this email.</p>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${resetLink}" style="color: hsl(221.2,83.2%,53.3%);">${resetLink}</a></p>
      <br />
      <p style="font-size: 12px; color: hsl(215.4,16.3%,46.9%);">This link will expire soon for security reasons.</p>
    </div>
  `;

  return { subject, html };
};


export const generatePasswordChangedEmail = (email: string) => {
  const subject = "Your password was changed";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: hsl(0,0%,100%); color: hsl(222.2,84%,4.9%); border: 1px solid hsl(214.3,31.8%,91.4%); border-radius: 8px; padding: 32px;">
      <h2>Hello👋</h2>
      <p>Your password has been changed successfully. If you did not perform this action, please contact support immediately.</p>
    </div>
  `;

  return { subject, html };
};


export const generateContactUsEmail = (data: {
  firstName: string;
  lastName: string;
  email: string;
  subject?: string;
  message?: string;
}) => {
  const subject = `New Contact Message from ${data.firstName} ${data.lastName}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: auto; background-color: hsl(0 0% 100%); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); color: hsl(222.2 84% 4.9%); border: 1px solid hsl(214.3 31.8% 91.4%);">
      <div style="background: linear-gradient(135deg, hsl(221.2 83.2% 53.3%), hsl(217.2 91.2% 59.8%)); padding: 20px; border-radius: 8px 8px 0 0; margin: -40px -40px 30px -40px;">
        <h2 style="font-size: 24px; font-weight: 600; margin: 0; color: hsl(210 40% 98%);">Contact Details</h2>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="height: 40px; border-bottom: 1px solid hsl(214.3 31.8% 91.4%);">
          <td style="color: hsl(215.4 16.3% 46.9%); font-weight: 500; padding: 12px 0;"><strong>First Name:</strong></td>
          <td style="padding: 12px 0; color: hsl(222.2 84% 4.9%);">${data.firstName}</td>
        </tr>
        <tr style="height: 40px; border-bottom: 1px solid hsl(214.3 31.8% 91.4%);">
          <td style="color: hsl(215.4 16.3% 46.9%); font-weight: 500; padding: 12px 0;"><strong>Last Name:</strong></td>
          <td style="padding: 12px 0; color: hsl(222.2 84% 4.9%);">${data.lastName}</td>
        </tr>
        <tr style="height: 40px; border-bottom: 1px solid hsl(214.3 31.8% 91.4%);">
          <td style="color: hsl(215.4 16.3% 46.9%); font-weight: 500; padding: 12px 0;"><strong>Email:</strong></td>
          <td style="padding: 12px 0; color: hsl(221.2 83.2% 53.3%);">${data.email}</td>
        </tr>
        <tr style="height: 40px; border-bottom: 1px solid hsl(214.3 31.8% 91.4%);">
          <td style="color: hsl(215.4 16.3% 46.9%); font-weight: 500; padding: 12px 0;"><strong>Subject:</strong></td>
          <td style="padding: 12px 0; color: hsl(222.2 84% 4.9%);">${data.subject || "-"}</td>
        </tr>
        <tr style="height: auto; border-bottom: 1px solid hsl(214.3 31.8% 91.4%);">  
          <td style="color: hsl(215.4 16.3% 46.9%); font-weight: 500; padding: 12px 0; vertical-align: top;"><strong>Message:</strong></td>
          <td style="padding: 12px 0; white-space: pre-wrap; color: hsl(222.2 84% 4.9%); line-height: 1.6;">${data.message || "No message provided."}</td>
        </tr>
      </table>
      <div style="margin-top: 30px; padding: 20px; background-color: hsl(210 40% 96.1%); border-radius: 8px; border: 1px solid hsl(214.3 31.8% 91.4%);">
        <p style="margin: 0; color: hsl(215.4 16.3% 46.9%); font-size: 12px; text-align: center;">This message was sent from your contact form</p>
      </div>
    </div>
  `;

  return { subject, html };
};