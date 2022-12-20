const emailTextbox = document.getElementById("email");
const passwordTextbox = document.getElementById("password");
const cnfPasswordTextbox = document.getElementById("cnf-password");
const registerButton = document.getElementById("register");
const PAGE_URL = window.location.href.split("register")[0];

registerButton.onclick = () => {
    const email = emailTextbox.value;
    const password = passwordTextbox.value;
    const cnfPassword = cnfPasswordTextbox.value;
    let proceed = true;

    if (email.length === 0) {
        alert("Email cannot be empty!");
        proceed = false;
    }
    if (password.length === 0) {
        alert("Password cannot be empty!");
        proceed = false;
    }
    if (cnfPassword.length === 0) {
        alert("Confirm password cannot be empty!");
        proceed = false;
    }

    if (proceed) {
        if (password !== cnfPassword) {
            alert("Passwords do not match!");
        } else {
            fetch(`${ PAGE_URL }register`, {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
                headers: { "Content-Type" : "application/json" }
            }).then(response => {
                if (response.status === 200) {
                    alert("Registered!");
                    window.location.replace(PAGE_URL);
                } else if (response.status === 400) {
                    alert("Email already exists!");
                } else {
                    alert("Server error!");
                }
            });
        }
    }
};