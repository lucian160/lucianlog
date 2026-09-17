const verifyEmailForm = document.getElementById("verifyEmailForm");
const verifyEmailBtn = document.getElementById("verifyEmailBtn");
const verifyEmailMessage = document.getElementById("verifyEmailMessage");
const resendOtpBtn = document.getElementById("resendOtpBtn");

const savedEmail = localStorage.getItem("lucianPendingEmail") || "";
if (savedEmail) {
  document.getElementById("verifyEmailInput").value = savedEmail;
}

async function resendVerificationOtp() {
  const email = document.getElementById("verifyEmailInput").value.trim();

  if (!email) {
    verifyEmailMessage.textContent = "Please enter your email first.";
    verifyEmailMessage.className = "message error";
    return;
  }

  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = "Sending...";

  try {
    const response = await fetch("/api/auth/request-email-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to resend OTP");

    verifyEmailMessage.textContent = "A new verification code has been sent.";
    verifyEmailMessage.classList.add("success");
  } catch (error) {
    verifyEmailMessage.textContent = error.message;
    verifyEmailMessage.classList.add("error");
  } finally {
    resendOtpBtn.disabled = false;
    resendOtpBtn.textContent = "Resend OTP";
  }
}

resendOtpBtn.addEventListener("click", resendVerificationOtp);

verifyEmailForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("verifyEmailInput").value.trim();
  const otp = document.getElementById("verificationCode").value.trim();

  if (!email || !otp) {
    verifyEmailMessage.textContent = "Please complete all fields.";
    verifyEmailMessage.className = "message error";
    return;
  }

  verifyEmailMessage.textContent = "";
  verifyEmailMessage.className = "message";
  verifyEmailBtn.disabled = true;
  verifyEmailBtn.textContent = "Verifying...";

  try {
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Verification failed");

    localStorage.removeItem("lucianPendingEmail");
    verifyEmailMessage.textContent = "Email verified successfully. Redirecting to login...";
    verifyEmailMessage.classList.add("success");

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);
  } catch (error) {
    verifyEmailMessage.textContent = error.message;
    verifyEmailMessage.classList.add("error");
  } finally {
    verifyEmailBtn.disabled = false;
    verifyEmailBtn.textContent = "Verify email";
  }
});
