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

