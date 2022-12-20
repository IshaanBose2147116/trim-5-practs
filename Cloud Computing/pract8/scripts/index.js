const tbody = document.getElementById("table-body");
const thead = document.getElementById("table-head");
const searchBox = document.getElementById("search");
const filterOption = document.getElementById("filter");
const viewSwitchButton = document.getElementById("view-switch");

const PAGE_URL = window.location.href.split("?")[0];
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
let dbData = null;
let currData = null;

fetchBooksFromDB();

document.getElementById("sign-out").onclick = () => {
    window.location.replace("/");
}

searchBox.oninput = (e) => {
    const pattern = e.target.value.toLowerCase();
    const filterBy = document.getElementById("filter").value;

    filterBooks(pattern, filterBy);
};

filterOption.onchange = (e) => {
    const pattern = searchBox.value.toLowerCase();
    const filterBy = e.target.value;
    
    filterBooks(pattern, filterBy);
};

viewSwitchButton.onclick = (e) => {
    if (e.target.textContent === "View Checkouts") {
        fetchCheckoutsFromDB();
        viewSwitchButton.innerText = "View Library";
    } else {
        fetchBooksFromDB();
        viewSwitchButton.innerText = "View Checkouts";
    }
};

function fetchBooksFromDB() {
    fetch(`${ PAGE_URL }get-books`, {
        method: 'GET',
        headers: { "Content-Type" : "application/json" }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                console.log(data);
                dbData = data;
                currData = dbData;
                displayBookData();
            });
        }
    });
}

function fetchCheckoutsFromDB() {
    fetch(`${ PAGE_URL }get-checkouts/${ params.id }`, {
        method: 'GET',
        headers: { "Content-Type" : "application/json" }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                console.log(data);
                dbData = data;
                currData = dbData;
                displayCheckouts();
            });
        }
    });
}

function filterBooks(pattern, filterBy) {
    const filtered = [];

    for (let i = 0; i < dbData.length; i++) {
        if (filterBy === "author") {
            if (dbData[i].author.toLowerCase().includes(pattern)) {
                filtered.push(dbData[i]);
            }
        } else {
            if (dbData[i].title.toLowerCase().includes(pattern)) {
                filtered.push(dbData[i]);
            }
        }
    }

    currData = filtered;

    if (viewSwitchButton.textContent === "View Checkouts")
        displayBookData();
    else
        displayCheckouts();
}

function displayBookData() {
    thead.innerHTML = `
    <th>Cover</th>
    <th>Title</th>
    <th>Author</th>
    <th>Available</th>
    <th></th>`;
    tbody.innerHTML = "";

    for (let i = 0; i < currData.length; i++) {
        if (currData[i].stock != 0) {
            tbody.innerHTML += `
                <tr>
                    <td><img src="${ currData[i].cover_link }" width="100" height="160" alt="Book Cover"/></td>
                    <td>${ currData[i].title }</td>
                    <td>${ currData[i].author }</td>
                    <td>${ currData[i].stock }</td>
                    <td><button id="checkout-${ currData[i].book_id }" class="btn">Checkout</button></td>
                </tr>
            `;
        }
    }

    for (let i = 0; i < currData.length; i++) {
        document.getElementById(`checkout-${ currData[i].book_id }`).onclick = () => {
            const currDate = new Date();
            const timestamp = `${ currDate.getUTCFullYear() }-${ currDate.getUTCMonth() + 1 }-${ currDate.getUTCDate() } ${ currDate.getUTCHours() }:${ currDate.getUTCMinutes() }:${ currDate.getUTCSeconds() }`;
            fetch(`${ PAGE_URL }checkout/${ currData[i].book_id }`, {
                method: 'POST',
                body: JSON.stringify({
                    timestamp: timestamp,
                    user_id: params.id
                }),
                headers: { "Content-Type" : "application/json" }
            }).then(response => {
                if (response.status === 200) {
                    alert("Checked out!");
                    fetchBooksFromDB();
                } else if (response.status === 400) {
                    alert("Already checked out!");
                }
            });
        }
    }
}

function displayCheckouts() {
    thead.innerHTML = `
    <th>Checkout Time</th>
    <th>Cover</th>
    <th>Title</th>
    <th>Author</th>
    <th></th>`;
    tbody.innerHTML = "";

    for (let i = 0; i < currData.length; i++) {
        let date = new Date(currData[i].timestamp);
        date = `${ date.getUTCFullYear() }-${ date.getUTCMonth() + 1 }-${ date.getUTCDate() } ${ date.getUTCHours() }:${ date.getUTCMinutes() }:${ date.getUTCSeconds() }`;

        tbody.innerHTML += `
            <tr>
                <td>${ new Date(currData[i].timestamp).toLocaleString() }</td>
                <td><img src="${ currData[i].cover_link }" width="100" height="160" alt="Book Cover"/></td>
                <td>${ currData[i].title }</td>
                <td>${ currData[i].author }</td>
                <td><button id="return-${ date }" class="btn">Return</button></td>
            </tr>
        `;
    }

    for (let i = 0; i < currData.length; i++) {
        let date = new Date(currData[i].timestamp);
        date = `${ date.getUTCFullYear() }-${ date.getUTCMonth() + 1 }-${ date.getUTCDate() } ${ date.getUTCHours() }:${ date.getUTCMinutes() }:${ date.getUTCSeconds() }`;

        document.getElementById(`return-${ date }`).onclick = () => {
            fetch(`${ PAGE_URL }return/${ date }`, { 
                method: 'POST',
                body: JSON.stringify({
                    book_id: currData[i].book_id
                }),
                headers: { "Content-Type" : "application/json" }
            }).then((res) => {
                if (res.status === 200) {
                    fetchCheckoutsFromDB();
                } else {
                    alert("Could not return!");
                }
            });
        }
    }
}