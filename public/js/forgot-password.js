const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const forgotPasswordMessage = document.getElementById("forgotPasswordMessage");

forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();

  if (!email) {
    forgotPasswordMessage.textContent = "Please enter your email.";
    forgotPasswordMessage.className = "message error";
    return;
  }

  forgotPasswordMessage.textContent = "";
  forgotPasswordMessage.className = "message";
  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = "Sending...";

  try {
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send reset code");
    }

    forgotPasswordMessage.textContent = "Reset code sent. Redirecting to verification...";
    forgotPasswordMessage.classList.add("success");

    localStorage.setItem("lucianResetEmail", email);

    setTimeout(() => {
      window.location.href = "/reset-password.html";
    }, 800);
  } catch (error) {
    forgotPasswordMessage.textContent = error.message;
    forgotPasswordMessage.classList.add("error");
  } finally {
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = "Send code";
  }
});
