const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const resetPasswordMessage = document.getElementById("resetPasswordMessage");
const resendResetOtpBtn = document.getElementById("resendResetOtpBtn");

const prefillEmail = localStorage.getItem("lucianResetEmail") || "";
if (prefillEmail) {
  document.getElementById("resetEmail").value = prefillEmail;
}

async function resendResetOtp() {
  const email = document.getElementById("resetEmail").value.trim();

  if (!email) {
    resetPasswordMessage.textContent = "Please enter your email first.";
    resetPasswordMessage.className = "message error";
    return;
  }

  resendResetOtpBtn.disabled = true;
  resendResetOtpBtn.textContent = "Sending...";

  try {
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to resend OTP");

    resetPasswordMessage.textContent = "A new reset code has been sent.";
    resetPasswordMessage.classList.add("success");
    localStorage.setItem("lucianResetEmail", email);
  } catch (error) {
    resetPasswordMessage.textContent = error.message;
    resetPasswordMessage.classList.add("error");
  } finally {
    resendResetOtpBtn.disabled = false;
    resendResetOtpBtn.textContent = "Resend OTP";
  }
}

resendResetOtpBtn.addEventListener("click", resendResetOtp);

resetPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();
  const otp = document.getElementById("resetOtp").value.trim();
  const password = document.getElementById("newPassword").value;

  if (!email || !otp || !password) {
    resetPasswordMessage.textContent = "Please complete all fields.";
    resetPasswordMessage.className = "message error";
    return;
  }

  resetPasswordMessage.textContent = "";
  resetPasswordMessage.className = "message";
  resetPasswordBtn.disabled = true;
  resetPasswordBtn.textContent = "Resetting...";

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Password reset failed");
    }

    localStorage.removeItem("lucianResetEmail");
    resetPasswordMessage.textContent = "Password reset successful. Redirecting to login...";
    resetPasswordMessage.classList.add("success");

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);
  } catch (error) {
    resetPasswordMessage.textContent = error.message;
    resetPasswordMessage.classList.add("error");
  } finally {
    resetPasswordBtn.disabled = false;
    resetPasswordBtn.textContent = "Reset password";
  }
});
