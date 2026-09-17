const registerForm =
  document.getElementById("registerForm");

const registerBtn =
  document.getElementById("registerBtn");

const registerMessage =
  document.getElementById("registerMessage");


registerForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const name =
      document
        .getElementById("name")
        .value
        .trim();

    const email =
      document
        .getElementById("email")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value;


    registerMessage.textContent = "";
    registerMessage.className = "message";


    if (password.length < 8) {

      registerMessage.textContent =
        "Password must be at least 8 characters.";

      registerMessage.classList.add("error");

      return;
    }


    registerBtn.disabled = true;

    registerBtn.textContent =
      "Creating account...";


    try {

      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              name,
              email,
              password
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Registration failed"
        );

      }


      localStorage.setItem("lucianPendingEmail", email);

      registerMessage.textContent =
        "Account created successfully. Redirecting to email verification...";

      registerMessage.classList.add(
        "success"
      );


      setTimeout(() => {

        window.location.href =
          "/verify-email.html";

      }, 800);


    } catch (error) {

      registerMessage.textContent =
        error.message;

      registerMessage.classList.add(
        "error"
      );

    } finally {

      registerBtn.disabled = false;

      registerBtn.textContent =
        "Create Account";

    }

  }
);