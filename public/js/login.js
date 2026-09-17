const loginForm =
  document.getElementById("loginForm");

const loginBtn =
  document.getElementById("loginBtn");

const loginMessage =
  document.getElementById("loginMessage");


loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      document
        .getElementById("email")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value;


    loginMessage.textContent = "";

    loginMessage.className =
      "message";


    loginBtn.disabled = true;

    loginBtn.textContent =
      "Signing in...";


    try {

      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
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
          "Login failed"
        );

      }


      /*
        Save the JWT.

        Your authenticateUser middleware
        expects:

        Authorization: Bearer <token>
      */

      localStorage.setItem(
        "lucianToken",
        data.token
      );


      /*
        Save basic user information so
        the UI can use it without another
        request immediately.
      */

      localStorage.setItem(
        "lucianUser",
        JSON.stringify(data.user)
      );


      loginMessage.textContent =
        "Login successful. Redirecting...";

      loginMessage.classList.add(
        "success"
      );


      setTimeout(() => {

        window.location.href =
          "/projects.html";

      }, 500);


    } catch (error) {

      loginMessage.textContent =
        error.message;

      loginMessage.classList.add(
        "error"
      );

    } finally {

      loginBtn.disabled = false;

      loginBtn.textContent =
        "Sign In";

    }

  }
);