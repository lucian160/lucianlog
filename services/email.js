const crypto = require("crypto");

function generateOtp(length = 6) {
  const digits = "0123456789";
  let otp = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = crypto.randomInt(digits.length);
    otp += digits[randomIndex];
  }

  return otp;
}

async function sendOtpEmail({ to, otp, purpose = "verification" }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!resendApiKey) {
    console.log(`[${purpose.toUpperCase()} OTP] ${otp} -> ${to}`);
    return {
      mocked: true,
      message: "No RESEND_API_KEY configured; OTP was printed to terminal instead."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject: purpose === "password-reset" ? "Lucian Logs password reset code" : "Lucian Logs verification code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Your Lucian Logs code</h2>
          <p>Your one-time password is:</p>
          <h1 style="letter-spacing: 0.2em; font-size: 32px; margin: 16px 0;">${otp}</h1>
          <p>This code expires soon. Use it to finish your ${purpose === "password-reset" ? "password reset" : "verification"}.</p>
        </div>
      `
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Resend email failed:", result);
    throw new Error(result.message || "Failed to send verification email");
  }

  console.log(`[${purpose.toUpperCase()} OTP] ${otp} -> ${to}`);

  return {
    mocked: false,
    data: result
  };
}

module.exports = {
  generateOtp,
  sendOtpEmail
};
