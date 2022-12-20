const tbody = document.getElementById("table-body");
const thead = document.getElementById("table-head");
const dataTable = document.getElementById("data-table");
const addUpdateTable = document.getElementById("add-update-table");
const addDataButton = document.getElementById("add-book");
const bookIDInput = document.getElementById("book-id");
const coverImageInput = document.getElementById("cover-image");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const availableInput = document.getElementById("available");
const addUpdateButton = document.getElementById("add-update-button");
const inputFields = [
    bookIDInput, coverImageInput, titleInput, authorInput, availableInput
];
let selectedBookID = null;

const PAGE_URL = window.location.href.split("?")[0];

let dbData = null;

document.getElementById("sign-out").onclick = () => {
    window.location.replace("/");
}

fetchBooksFromDB();

addDataButton.onclick = () => {
    if (addDataButton.textContent === "Add Book") {
        switchToAddUpdateTable(true);
    } else {
        switchToDataTable();
    }
};

addUpdateButton.onclick = () => {
    const title = titleInput.value;
    const author = authorInput.value;
    const available = availableInput.value;
    const bookID = bookIDInput.value;
    
    if (addUpdateButton.textContent === "Add Book") {
        const formData = new FormData();
        formData.append("image", coverImageInput.files[0]);
        
        fetch(`${ PAGE_URL }upload-image/${ bookID }`, {
            method: "POST",
            body: formData
        }).then(response => {
            if (response.status === 200) {
                response.json().then(data => {
                    const coverLink = data.link;

                    fetch(`${ PAGE_URL }upload-book`, {
                        method: "POST",
                        body: JSON.stringify({
                            book_id: bookID,
                            title: title,
                            author: author,
                            available: available,
                            cover_link: coverLink
                        }),
                        headers: { "Content-Type" : "application/json" }
                    }).then(response => {
                        if (response.status === 200) {
                            switchToDataTable();
                            fetchBooksFromDB();
                        } else {
                            alert("Could not upload book.");
                        }
                    });
                });
            } else {
                console.log("ERRR");
            }
        });
    } else {
        if (coverImageInput.files.length !== 0) {
            const formData = new FormData();
            formData.append("image", coverImageInput.files[0]);

            fetch(`${ PAGE_URL }upload-image/${ bookID }`, {
                method: "POST",
                body: formData
            }).then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        const coverLink = data.link;

                        fetch(`${ PAGE_URL }update-book/${ selectedBookID }`, {
                            method: "PUT",
                            body: JSON.stringify({
                                id: bookID,
                                title: title,
                                author: author,
                                available: available,
                                cover_link: coverLink
                            }),
                            headers: { "Content-Type" : "application/json" }
                        }).then(response => {
                            if (response.status === 200) {
                                switchToDataTable();
                                fetchBooksFromDB();
                            } else {
                                alert("Could not upload book.");
                            }
                        });
                    });
                } else {
                    console.log("ERRR");
                }
            });
        } else {
            fetch(`${ PAGE_URL }update-book/${ selectedBookID }`, {
                method: "PUT",
                body: JSON.stringify({
                    id: bookID,
                    title: title,
                    author: author,
                    available: available
                }),
                headers: { "Content-Type" : "application/json" }
            }).then(response => {
                if (response.status === 200) {
                    switchToDataTable();
                    fetchBooksFromDB();
                } else {
                    alert("Could not upload book.");
                }
            });
        }
    }
};

function switchToAddUpdateTable(add) {
    dataTable.style.display = "none";
    addUpdateTable.style.display = "table";
    addDataButton.innerText = "Go Back";
    addUpdateButton.innerText = add ? "Add Book" : "Update Data";
}

function switchToDataTable() {
    for (let i = 0; i < inputFields.length; i++) {
        inputFields[i].value = "";
    }
    dataTable.style.display = "table";
    addUpdateTable.style.display = "none";
    addDataButton.innerText = "Add Book";
}

function fetchBooksFromDB() {
    fetch(`${ PAGE_URL }get-books`, {
        method: 'GET',
        headers: { "Content-Type" : "application/json" }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                console.log(data);
                dbData = data;
                displayBookData();
            });
        }
    });
}

function displayBookData() {
    thead.innerHTML = `
    <th>Cover</th>
    <th>Title</th>
    <th>Author</th>
    <th>Available</th>
    <th></th>
    <th></th>`;
    tbody.innerHTML = "";

    for (let i = 0; i < dbData.length; i++) {
        if (dbData[i].stock != 0) {
            tbody.innerHTML += `
                <tr>
                    <td><img src="${ dbData[i].cover_link }" width="100" height="160" alt="Book Cover"/></td>
                    <td>${ dbData[i].title }</td>
                    <td>${ dbData[i].author }</td>
                    <td>${ dbData[i].stock }</td>
                    <td><button id="update-${ i }" class="btn update">Update</button></td>
                    <td><button id="delete-${ i }" class="btn delete">Delete</button></td>
                </tr>
            `;
        }
    }

    for (let i = 0; i < dbData.length; i++) {
        document.getElementById(`delete-${ i }`).onclick = () => {
            fetch(`${ PAGE_URL }delete/${ dbData[i].book_id }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            }).then(response => {
                if (response.status === 200) {
                    alert("Deleted!");
                    fetchBooksFromDB();
                } else {
                    alert("Failed to delete!");
                }
            });
        };

        document.getElementById(`update-${ i }`).onclick = () => {
            bookIDInput.value = dbData[i].book_id;
            titleInput.value = dbData[i].title;
            authorInput.value = dbData[i].author;
            availableInput.value = dbData[i].stock;
            selectedBookID = dbData[i].book_id;

            switchToAddUpdateTable(false);
        };
    }
}