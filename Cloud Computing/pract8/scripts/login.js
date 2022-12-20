const emailTextbox = document.getElementById("email");
const passwordTextbox = document.getElementById("password");
const loginButton = document.getElementById("login");
const PAGE_URL = window.location.href.split("login")[0];

loginButton.onclick = () => {
    const email = emailTextbox.value;
    const password = passwordTextbox.value;
    let proceed = true;

    if (email.length === 0) {
        alert("Email cannot be empty!");
        proceed = false;
    }
    if (password.length === 0) {
        alert("Password cannot be empty!");
        proceed = false;
    }

    if (proceed) {
        fetch(`${ PAGE_URL }login`, {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                password: password
            }),
            headers: { "Content-Type" : "application/json" }
        }).then(response => {
            if (response.status === 200) {
                response.json().then(data => {
                    window.location.replace(`${ PAGE_URL }?user=${ email }&id=${ data.id }`);
                })
            } else {
                alert("Invalid email or password!");
            }
        });
    }
};