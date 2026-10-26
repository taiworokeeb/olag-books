import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    Timestamp,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    where,
    updateDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCJdr5tJOxWV5KIdkYumuKf8CE3DFUTsu0",
    authDomain: "olag-s-book-house.firebaseapp.com",
    projectId: "olag-s-book-house",
    storageBucket: "olag-s-book-house.firebasestorage.app",
    messagingSenderId: "491432341942",
    appId: "1:491432341942:web:a18f46caf1d7cc5f471117"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const dashboardName = document.getElementById("dashboard-name");
const dashboardEmail = document.getElementById("dashboard-email");
const dashboardRole = document.getElementById("dashboard-role");
const logoutButton = document.getElementById("logout-button");

const librarianSection = document.getElementById("librarian-management");
const bookForm = document.getElementById("book-form");
const bookIdInput = document.getElementById("managed-book-id");
const titleInput = document.getElementById("managed-book-title");
const authorInput = document.getElementById("managed-book-author");
const categoryInput = document.getElementById("managed-book-category");
const coverInput = document.getElementById("managed-book-cover");
const descriptionInput = document.getElementById("managed-book-description");
const saveBookButton = document.getElementById("save-book-button");
const cancelBookEditButton = document.getElementById("cancel-book-edit");
const bookFormStatus = document.getElementById("book-form-status");
const managedBooksList = document.getElementById("managed-books-list");
const readerLoansSection = document.getElementById("reader-loans-section");
const borrowRequestsList = document.getElementById("borrow-requests-list");
const dashboardMain = document.querySelector(".dashboard-main");
const dashboardLoader = document.getElementById("dashboard-loader");

let currentUser = null;
let isLoggingOut = false;
let isLibrarian = false;

function resetBookForm() {
    bookForm.reset();
    bookIdInput.value = "";
    saveBookButton.textContent = "Add book";
    cancelBookEditButton.hidden = true;
    bookFormStatus.textContent = "";
}

async function loadManagedBooks() {
    managedBooksList.textContent = "Loading books...";

    try {
        const snapshot = await getDocs(collection(db, "books"));

        if (snapshot.empty) {
            managedBooksList.textContent = "There are no books to manage yet.";
            return;
        }

        managedBooksList.replaceChildren();

        const categoryNames = {
            fiction: "Fiction",
            children: "Children's books",
            nonfiction: "Nonfiction"
        };

        snapshot.forEach((bookDocument) => {
            const book = bookDocument.data();

            const row = document.createElement("article");
            row.className = "managed-book-row";

            const cover = document.createElement("img");
            cover.className = "managed-book-cover";
            cover.alt = `Cover of ${book.title || "this book"}`;
            cover.loading = "lazy";

            if (book.cover) {
                cover.src = book.cover;
            } else {
                cover.hidden = true;
            }

            cover.addEventListener("error", () => {
                cover.hidden = true;
            });

            const details = document.createElement("div");
            details.className = "managed-book-details";

            const title = document.createElement("h3");
            title.textContent = book.title || "Untitled book";

            const author = document.createElement("p");
            author.textContent = `by ${book.author || "Unknown author"}`;

            const category = document.createElement("p");
            category.textContent =
                `Category: ${categoryNames[book.category] || book.category || "Uncategorized"}`;

            details.append(title, author, category);

            const actions = document.createElement("div");
            actions.className = "managed-book-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.dataset.bookId = bookDocument.id;
            editButton.setAttribute("aria-label", `Edit ${book.title}`);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "Remove";
            removeButton.dataset.action = "remove";
            removeButton.dataset.bookId = bookDocument.id;
            removeButton.setAttribute("aria-label", `Remove ${book.title}`);

            actions.append(editButton, removeButton);
            row.append(cover, details, actions);
            managedBooksList.append(row);
        });
    } catch (error) {
        console.error("Could not load books for management:", error);
        managedBooksList.textContent =
            "We couldn't load the books. Refresh and try again.";
    }
}

async function loadBorrowRequests() {
    borrowRequestsList.textContent = "Loading requests...";

    try {
        const requestsQuery = query(
            collection(db, "loans"),
            where("status", "==", "requested")
        );

        const snapshot = await getDocs(requestsQuery);

        if (snapshot.empty) {
            borrowRequestsList.textContent = "There are no pending requests.";
            return;
        }

        borrowRequestsList.replaceChildren();

        snapshot.forEach((requestDocument) => {
            const request = requestDocument.data();

            const card = document.createElement("article");
            card.className = "borrow-request-card";

            const title = document.createElement("h4");
            title.textContent = request.bookTitle || "Book title unavailable";

            const reader = document.createElement("p");
            reader.textContent =
                `Requested by ${request.readerName || "Reader"}`;

            const requestedDate = document.createElement("p");
            const date = request.requestedAt?.toDate
                ? request.requestedAt.toDate().toLocaleDateString()
                : "Date unavailable";
            requestedDate.textContent = `Request date: ${date}`;

            const actions = document.createElement("div");
            actions.className = "borrow-request-actions";

            const approveButton = document.createElement("button");
            approveButton.type = "button";
            approveButton.textContent = "Approve";
            approveButton.dataset.action = "approve";
            approveButton.dataset.requestId = requestDocument.id;

            const declineButton = document.createElement("button");
            declineButton.type = "button";
            declineButton.textContent = "Decline";
            declineButton.dataset.action = "decline";
            declineButton.dataset.requestId = requestDocument.id;

            actions.append(approveButton, declineButton);
            card.append(title, reader, requestedDate, actions);
            borrowRequestsList.append(card);
        });
    } catch (error) {
        console.error("Could not load borrow requests:", error);
        borrowRequestsList.textContent =
            "We couldn't load requests. Refresh and try again.";
    }
}

async function loadActiveLoans() {
    const activeLoansList = document.getElementById("active-loans-list");
    activeLoansList.textContent = "Loading active loans...";

    try {
        const loansQuery = query(
            collection(db, "loans"),
            where("status", "==", "borrowed")
        );

        const snapshot = await getDocs(loansQuery);

        if (snapshot.empty) {
            activeLoansList.textContent = "There are no books currently on loan.";
            return;
        }

        activeLoansList.replaceChildren();

        snapshot.forEach((loanDocument) => {
            const loan = loanDocument.data();
            const card = document.createElement("article");
            card.className = "active-loan-card";

            const details = document.createElement("div");

            const title = document.createElement("h3");
            title.textContent = loan.bookTitle || "Untitled book";

            const reader = document.createElement("p");
            reader.textContent = `Borrowed by: ${loan.readerName || "Reader"}`;

            const dueDateValue = loan.dueDate?.toDate?.();
            const isOverdue = Boolean(
                dueDateValue && dueDateValue.getTime() < Date.now()
            );

            const loanStatus = document.createElement("p");
            loanStatus.className = "active-loan-status";

            if (isOverdue) {
                loanStatus.classList.add("is-overdue");
                loanStatus.textContent = "Overdue";
            } else {
                loanStatus.textContent = "On loan";
            }

            const dueDate = document.createElement("p");
            dueDate.textContent = dueDateValue
                ? `Due: ${dueDateValue.toLocaleDateString()}`
                : "Due date not recorded";

            details.append(title, reader, loanStatus, dueDate);


            const returnButton = document.createElement("button");
            returnButton.type = "button";
            returnButton.textContent = "Mark returned";
            returnButton.dataset.action = "return";
            returnButton.dataset.loanId = loanDocument.id;
            returnButton.dataset.bookId = loan.bookId;

            card.append(details, returnButton);
            activeLoansList.append(card);
        });
    } catch (error) {
        console.error("Could not load active loans:", error);
        activeLoansList.textContent =
            "We couldn't load current loans. Please refresh and try again.";
    }
}

async function loadReaderLoans(user) {
    const myLoans = document.getElementById("my-loans");
    myLoans.textContent = "Loading your books...";

    try {
        const loansQuery = query(
            collection(db, "loans"),
            where("readerUid", "==", user.uid)
        );

        const snapshot = await getDocs(loansQuery);

        if (snapshot.empty) {
            myLoans.textContent =
                "You don’t have any book requests or loans yet.";
            return;
        }

        myLoans.replaceChildren();

        snapshot.forEach((loanDocument) => {
            const loan = loanDocument.data();

            const card = document.createElement("article");
            card.className = "reader-loan-card";

            const title = document.createElement("h3");
            title.textContent = loan.bookTitle || "Untitled book";

            const status = document.createElement("p");
            status.className = `loan-status loan-status-${loan.status}`;


            const dueDateValue = loan.dueDate?.toDate?.();
            const isOverdue =
                loan.status === "borrowed" &&
                dueDateValue &&
                dueDateValue < new Date();

            status.className = "loan-status";

            if (isOverdue) {
                status.classList.add("loan-status-overdue");
            } else {
                status.classList.add(`loan-status-${loan.status}`);
            }

            const statusLabels = {
                requested: "Waiting for librarian approval",
                borrowed: "Borrowed",
                "return-requested": "Waiting for librarian to confirm return",
                returned: "Returned",
                declined: "Request declined"
            };

            status.textContent = isOverdue
                ? "Status: Overdue"
                : `Status: ${statusLabels[loan.status] || loan.status}`;

            card.append(title, status);

            function addDate(label, timestamp) {
                if (!timestamp?.toDate) return;

                const date = document.createElement("p");
                date.textContent =
                    `${label}: ${timestamp.toDate().toLocaleDateString()}`;
                card.append(date);
            }

            addDate("Requested", loan.requestedAt);
            addDate("Borrowed", loan.borrowedAt);
            addDate("Due", loan.dueDate);
            addDate("Returned", loan.returnedAt);
            if (loan.status === "borrowed") {
                const returnButton = document.createElement("button");
                returnButton.type = "button";
                returnButton.className = "return-request-button";
                returnButton.textContent = "Return this book";
                returnButton.dataset.action = "request-return";
                returnButton.dataset.loanId = loanDocument.id;



                card.append(returnButton);
            }

            myLoans.append(card);
        });
    } catch (error) {
        console.error("Could not load your loans:", error);
        myLoans.textContent =
            "We couldn't load your books. Please refresh and try again.";
    }
}

async function loadReturnConfirmations() {
    const list = document.getElementById("return-confirmations-list");
    list.textContent = "Loading return requests...";

    try {
        const returnQuery = query(
            collection(db, "loans"),
            where("status", "==", "return-requested")
        );

        const snapshot = await getDocs(returnQuery);

        if (snapshot.empty) {
            list.textContent = "There are no return requests to confirm.";
            return;
        }

        list.replaceChildren();

        snapshot.forEach((loanDocument) => {
            const loan = loanDocument.data();

            const card = document.createElement("article");
            card.className = "borrow-request-card";

            const details = document.createElement("div");

            const title = document.createElement("h4");
            title.textContent = loan.bookTitle || "Untitled book";

            const reader = document.createElement("p");
            reader.textContent =
                `Returned by: ${loan.readerName || "Reader"}`;

            details.append(title, reader);

            const confirmButton = document.createElement("button");
            confirmButton.type = "button";
            confirmButton.textContent = "Confirm book received";
            confirmButton.dataset.action = "confirm-return";
            confirmButton.dataset.loanId = loanDocument.id;
            confirmButton.dataset.bookId = loan.bookId;

            const actions = document.createElement("div");
            actions.className = "borrow-request-actions";
            actions.append(confirmButton);

            card.append(details, actions);
            list.append(card);
        });
    } catch (error) {
        console.error("Could not load return requests:", error);
        list.textContent =
            "We couldn't load return requests. Refresh and try again.";
    }
}

const myLoans = document.getElementById("my-loans");

myLoans.addEventListener("click", async (event) => {
    const button = event.target.closest(
        'button[data-action="request-return"]'
    );

    if (!button || !auth.currentUser) return;

    const confirmation = await Swal.fire({
        icon: "question",
        title: "Request return confirmation?",
        text: "Give the book to the librarian. They will confirm when they receive it.",
        showCancelButton: true,
        confirmButtonText: "Yes, I returned it",
        cancelButtonText: "Cancel"
    });

    if (!confirmation.isConfirmed) return;

    button.disabled = true;

    try {
        await updateDoc(doc(db, "loans", button.dataset.loanId), {
            status: "return-requested",
            returnRequestedAt: serverTimestamp()
        });

        await loadReaderLoans(auth.currentUser);

        await Swal.fire({
            icon: "success",
            title: "Return request sent",
            text: "The book will remain on loan until the librarian confirms receiving it."
        });
    } catch (error) {
        console.error("Could not request book return:", error);
        button.disabled = false;

        await Swal.fire({
            icon: "error",
            title: "Return request failed",
            text: "Please try again. If it continues, check the Firestore rules."
        });
    }
});

borrowRequestsList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !isLibrarian || !currentUser) return;

    const action = button.dataset.action;
    const requestId = button.dataset.requestId;

    const confirmation = await Swal.fire({
        icon: "question",
        title: action === "approve" ? "Approve this request?" : "Decline this request?",
        text: action === "approve"
            ? "The book will be marked on loan with a 7-day due date."
            : "The reader's request will be declined.",
        showCancelButton: true,
        confirmButtonText: action === "approve" ? "Approve request" : "Decline request",
        cancelButtonText: "Cancel"
    });

    if (!confirmation.isConfirmed) return;

    button.disabled = true;

    try {
        const loanRef = doc(db, "loans", requestId);// Check the reader's current loans before approving this request.
        
        if (action === "approve") {
            const requestSnapshot = await getDoc(loanRef);

            if (!requestSnapshot.exists()
                || requestSnapshot.data().status !== "requested") {
                throw new Error("REQUEST_ALREADY_PROCESSED");
            }

            const readerUid = requestSnapshot.data().readerUid;
            const readerLoansQuery = query(
                collection(db, "loans"),
                where("readerUid", "==", readerUid)
            );
            const readerLoansSnapshot = await getDocs(readerLoansQuery);

            const activeLoanCount = readerLoansSnapshot.docs.filter((loanDocument) => {
                const status = loanDocument.data().status;
                return status === "borrowed" || status === "return-requested";
            }).length;

            if (activeLoanCount >= 3) {
                await Swal.fire({
                    icon: "warning",
                    title: "Borrowing limit reached",
                    text: "This reader already has three books on loan. Confirm a returned book before approving another request."
                });

                await loadBorrowRequests();
                return;
            }
        }



        await runTransaction(db, async (transaction) => {
            const loanSnapshot = await transaction.get(loanRef);

            if (!loanSnapshot.exists()
                || loanSnapshot.data().status !== "requested") {
                throw new Error("REQUEST_ALREADY_PROCESSED");
            }

            const loan = loanSnapshot.data();

            if (action === "decline") {
                transaction.update(loanRef, {
                    status: "declined",
                    processedBy: currentUser.uid
                });
                return;
            }

            const bookRef = doc(db, "books", loan.bookId);
            const bookSnapshot = await transaction.get(bookRef);

            if (!bookSnapshot.exists()
                || bookSnapshot.data().availability !== "available") {
                throw new Error("BOOK_NOT_AVAILABLE");
            }

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            transaction.update(loanRef, {
                status: "borrowed",
                borrowedAt: serverTimestamp(),
                dueDate: Timestamp.fromDate(dueDate),
                processedBy: currentUser.uid
            });

            transaction.update(bookRef, {
                availability: "on-loan",
                updatedAt: serverTimestamp()
            });
        });

        await loadBorrowRequests();

        await Swal.fire({
            icon: "success",
            title: action === "approve" ? "Request approved" : "Request declined",
            timer: 1300,
            showConfirmButton: false
        });
    } catch (error) {
        console.error("Could not process borrow request:", error);

        const message = error.message === "BOOK_NOT_AVAILABLE"
            ? "This book is no longer available. Refresh the request list."
            : "The request couldn't be processed. It may already have been handled, or the Firestore rules blocked the change.";

        await Swal.fire({
            icon: "error",
            title: "Request not updated",
            text: message
        });

        await loadBorrowRequests();
    }
});

bookForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isLibrarian) {
        bookFormStatus.textContent = "Only a librarian can manage books.";
        return;
    }

    const bookData = {
        title: titleInput.value.trim(),
        author: authorInput.value.trim(),
        category: categoryInput.value,
        cover: coverInput.value.trim(),
        description: descriptionInput.value.trim(),
        updatedAt: serverTimestamp()
    };

    const existingBookId = bookIdInput.value;
    const successMessage = existingBookId
        ? "Book updated successfully."
        : "Book added successfully.";

    saveBookButton.disabled = true;
    bookFormStatus.textContent = "Saving book...";

    try {
        if (existingBookId) {
            // Merge edits with the existing document, preserving availability.
            await setDoc(
                doc(db, "books", existingBookId),
                bookData,
                { merge: true }
            );
        } else {
            // Create a new document with a unique Firestore ID.
            const newBookRef = doc(collection(db, "books"));

            await setDoc(newBookRef, {
                ...bookData,
                id: newBookRef.id,
                availability: "available",
                createdAt: serverTimestamp()
            });
        }

        resetBookForm();
        await loadManagedBooks();
        bookFormStatus.textContent = successMessage;
    } catch (error) {
        console.error("Could not save book:", error);
        bookFormStatus.textContent =
            "The book couldn't be saved. Check the Firestore rules and try again.";
    } finally {
        saveBookButton.disabled = false;
    }
});

cancelBookEditButton.addEventListener("click", resetBookForm);

managedBooksList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !isLibrarian) return;

    const bookId = button.dataset.bookId;
    const bookRef = doc(db, "books", bookId);

    if (button.dataset.action === "edit") {
        try {
            const bookSnapshot = await getDoc(bookRef);

            if (!bookSnapshot.exists()) {
                bookFormStatus.textContent =
                    "That book no longer exists. Refresh the list.";
                return;
            }

            const book = bookSnapshot.data();

            bookIdInput.value = bookId;
            titleInput.value = book.title || "";
            authorInput.value = book.author || "";
            categoryInput.value = book.category || "";
            coverInput.value = book.cover || "";
            descriptionInput.value = book.description || "";

            saveBookButton.textContent = "Save changes";
            cancelBookEditButton.hidden = false;
            bookFormStatus.textContent = "Editing this book.";

            bookForm.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Could not open book for editing:", error);
            bookFormStatus.textContent =
                "We couldn't load that book for editing.";
        }

        return;
    }

    if (button.dataset.action === "remove") {
        const confirmation = await Swal.fire({
            icon: "warning",
            title: "Remove this book?",
            text: "This removes it from the catalog. You can't undo this from the page.",
            showCancelButton: true,
            confirmButtonText: "Remove book",
            cancelButtonText: "Keep book"
        });

        if (!confirmation.isConfirmed) return;

        try {
            await deleteDoc(bookRef);
            resetBookForm();
            await loadManagedBooks();

            await Swal.fire({
                icon: "success",
                title: "Book removed",
                timer: 1200,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Could not remove book:", error);

            await Swal.fire({
                icon: "error",
                title: "Could not remove book",
                text: "Check the Firestore rules and try again."
            });
        }
    }
});

const activeLoansList = document.getElementById("active-loans-list");

activeLoansList.addEventListener("click", async (event) => {
    const button = event.target.closest('button[data-action="return"]');

    if (!button || !isLibrarian || !currentUser) return;

    const loanId = button.dataset.loanId;
    const bookId = button.dataset.bookId;

    if (!loanId || !bookId) {
        Swal.fire({
            icon: "error",
            title: "Missing loan information",
            text: "Refresh the dashboard and try again."
        });
        return;
    }

    const confirmation = await Swal.fire({
        icon: "question",
        title: "Mark this book as returned?",
        text: "This will record the return and make the book available again.",
        showCancelButton: true,
        confirmButtonText: "Mark returned",
        cancelButtonText: "Cancel"
    });

    if (!confirmation.isConfirmed) return;

    button.disabled = true;

    try {
        const loanRef = doc(db, "loans", loanId);
        const bookRef = doc(db, "books", bookId);

        await runTransaction(db, async (transaction) => {
            const loanSnapshot = await transaction.get(loanRef);
            const bookSnapshot = await transaction.get(bookRef);

            if (!loanSnapshot.exists() || !bookSnapshot.exists()) {
                throw new Error("The loan or book could not be found.");
            }

            if (loanSnapshot.data().status !== "borrowed") {
                throw new Error("This loan is no longer active.");
            }

            transaction.update(loanRef, {
                status: "returned",
                returnedAt: serverTimestamp(),
                processedBy: currentUser.uid
            });

            transaction.update(bookRef, {
                availability: "available",
                updatedAt: serverTimestamp()
            });
        });

        await loadActiveLoans();
        await loadManagedBooks();

        await Swal.fire({
            icon: "success",
            title: "Book returned",
            text: "The book is available in the catalog again."
        });
    } catch (error) {
        console.error("Could not record the book return:", error);

        await Swal.fire({
            icon: "error",
            title: "Could not record the return",
            text: "Check the connection and Firestore rules, then try again."
        });

        button.disabled = false;
    }
});

const returnConfirmationsList = document.getElementById("return-confirmations-list");

returnConfirmationsList.addEventListener("click", async (event) => {
    const button = event.target.closest(
        'button[data-action="confirm-return"]'
    );

    if (!button || !isLibrarian || !auth.currentUser) return;

    const loanId = button.dataset.loanId;
    const bookId = button.dataset.bookId;

    if (!loanId || !bookId) {
        await Swal.fire({
            icon: "error",
            title: "Missing loan information",
            text: "Refresh the dashboard and try again."
        });
        return;
    }

    const confirmation = await Swal.fire({
        icon: "question",
        title: "Confirm you received the book?",
        text: "This will mark the loan returned and make the book available again.",
        showCancelButton: true,
        confirmButtonText: "Confirm return",
        cancelButtonText: "Cancel"
    });

    if (!confirmation.isConfirmed) return;

    button.disabled = true;

    try {
        const loanRef = doc(db, "loans", loanId);
        const bookRef = doc(db, "books", bookId);

        await runTransaction(db, async (transaction) => {
            const loanSnapshot = await transaction.get(loanRef);
            const bookSnapshot = await transaction.get(bookRef);

            if (!loanSnapshot.exists() || !bookSnapshot.exists()) {
                throw new Error("The loan or book could not be found.");
            }

            if (loanSnapshot.data().status !== "return-requested") {
                throw new Error("This return request has already changed.");
            }

            transaction.update(loanRef, {
                status: "returned",
                returnedAt: serverTimestamp(),
                processedBy: auth.currentUser.uid
            });

            transaction.update(bookRef, {
                availability: "available",
                updatedAt: serverTimestamp()
            });
        });

        await loadReturnConfirmations();
        await loadActiveLoans();

        await Swal.fire({
            icon: "success",
            title: "Return confirmed",
            text: "The loan is complete and the book is available again."
        });
    } catch (error) {
        console.error("Could not confirm the book return:", error);
        button.disabled = false;

        await Swal.fire({
            icon: "error",
            title: "Could not confirm return",
            text: "Please refresh and try again."
        });
    }
});

onAuthStateChanged(auth, async (user) => {

    currentUser = user;
    isLibrarian = false;
    librarianSection.hidden = true;
    readerLoansSection.hidden = true;

    if (!user) {
        if (!isLoggingOut) {
            window.location.replace("../Signup/auth.html");
        }
        return;
    }
    dashboardMain.hidden = false;
    logoutButton.hidden = false;
    dashboardName.textContent = user.displayName || "Reader";
    dashboardEmail.textContent = user.email || "No email available";
    dashboardRole.textContent = "Reader";

    try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));

        if (!userSnapshot.exists()) return;

        const profile = userSnapshot.data();

        dashboardName.textContent =
            profile.displayName || user.displayName || "Reader";

        isLibrarian = profile.role === "librarian";
        dashboardRole.textContent = isLibrarian ? "Librarian" : "Reader";
        librarianSection.hidden = !isLibrarian;
        readerLoansSection.hidden = isLibrarian;

        if (isLibrarian) {
            librarianSection.hidden = false;
            readerLoansSection.hidden = true;

            await loadManagedBooks();
            await loadBorrowRequests();
            await loadActiveLoans();
            await loadReturnConfirmations();
        } else {
            librarianSection.hidden = true;
            readerLoansSection.hidden = false;
            await loadReaderLoans(user);
        }
    } catch (error) {
        console.error("Could not load the user profile:", error);
    }
    finally {
        dashboardLoader.hidden = true;
        dashboardMain.hidden = false;
        logoutButton.hidden = false;
    }
});

logoutButton.addEventListener("click", async () => {
    const confirmation = await Swal.fire({
        icon: "question",
        title: "Log out?",
        text: "You can sign in again whenever you return.",
        showCancelButton: true,
        confirmButtonText: "Log out",
        cancelButtonText: "Stay signed in"
    });

    if (!confirmation.isConfirmed) return;

    isLoggingOut = true;

    Swal.fire({
        title: "Logging out...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        await signOut(auth);

        await Swal.fire({
            icon: "success",
            title: "You’re signed out",
            timer: 1200,
            showConfirmButton: false
        });

        window.location.replace("../index.html");
    } catch (error) {
        console.error("Log-out error:", error);
        isLoggingOut = false;
        Swal.close();

        await Swal.fire({
            icon: "error",
            title: "Could not log out",
            text: "Please try again."
        });
    }
});