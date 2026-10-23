import {
    getApp,
    getApps,
    initializeApp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCJdr5tJOxWV5KIdkYumuKf8CE3DFUTsu0",
    authDomain: "olag-s-book-house.firebaseapp.com",
    projectId: "olag-s-book-house",
    storageBucket: "olag-s-book-house.firebasestorage.app",
    messagingSenderId: "491432341942",
    appId: "1:491432341942:web:a18f46caf1d7cc5f471117"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const bookId = new URLSearchParams(window.location.search).get("book");

const bookTitle = document.getElementById("book-title");
const bookAuthor = document.getElementById("book-author");
const bookDescription = document.getElementById("book-description");
const bookCategory = document.getElementById("book-category");
const bookAvailability = document.getElementById("book-availability");
const bookStatus = document.getElementById("book-status");
const bookAction = document.getElementById("book-action");
const bookActionNote = document.getElementById("book-action-note");
const bookCover = document.getElementById("book-cover");

let currentBook = null;
let currentUser = null;
let currentUserRole = null;
let bookLoaded = false;
let authLoaded = false;

bookAction.disabled = true;
bookAction.textContent = "Loading...";

function updateBookAction() {
    if (!bookLoaded || !authLoaded) {
        bookAction.disabled = true;
        bookAction.textContent = "Loading...";
        return;
    }

    if (!currentBook || currentBook.availability !== "available") {
        bookAction.hidden = true;
        return;
    }

    bookAction.hidden = false;

    if (!currentUser) {
        bookAction.disabled = false;
        bookAction.textContent = "Sign in to request this book";
        bookActionNote.textContent =
            "Sign in to request this book. A librarian will confirm the loan and record the borrowing and return dates.";
        return;
    }

    if (currentUserRole === "librarian") {
        bookAction.disabled = true;
        bookAction.textContent = "Librarian account";
        bookActionNote.textContent =
            "Librarians manage the collection and review reader requests.";
        return;
    }

    if (currentUserRole !== "reader") {
        bookAction.disabled = true;
        bookAction.textContent = "Account role unavailable";
        bookActionNote.textContent =
            "We couldn't confirm your reader account. Refresh the page or sign in again.";
        return;
    }

    bookAction.disabled = false;
    bookAction.textContent = "Request this book";
    bookActionNote.textContent =
        "A librarian will review your request and confirm the borrowing and due dates.";
}

function showBookMessage(title, message) {
    currentBook = null;
    document.title = `${title} | Olag's Book House`;
    bookTitle.textContent = title;
    bookAuthor.textContent = "";
    bookDescription.textContent = message;
    bookCategory.textContent = "—";
    bookAvailability.hidden = true;
    bookAction.hidden = true;
}

async function loadBook() {
    try {
        if (!bookId) {
            showBookMessage(
                "Book not found",
                "Choose a book from the catalog to view its details."
            );
            return;
        }

        const bookSnapshot = await getDoc(doc(db, "books", bookId));

        if (!bookSnapshot.exists()) {
            showBookMessage(
                "Book not found",
                "We couldn't find that book. Go back to the catalog and choose another."
            );
            return;
        }

        currentBook = {
            ...bookSnapshot.data(),
            id: bookSnapshot.id
        };

        document.title = `${currentBook.title} | Olag's Book House`;
        bookTitle.textContent = currentBook.title;
        bookAuthor.textContent = `by ${currentBook.author}`;
        bookDescription.textContent = currentBook.description;

        const categoryNames = {
            fiction: "Fiction",
            children: "Children's books",
            nonfiction: "Nonfiction"
        };

        bookCategory.textContent =
            categoryNames[currentBook.category] || currentBook.category;

        bookStatus.textContent =
            currentBook.availability === "available" ? "Available" : "On loan";

        bookCover.src = currentBook.cover;
        bookCover.alt = `Cover of ${currentBook.title}`;
        bookCover.hidden = false;

        if (currentBook.availability === "available") {
            bookAvailability.hidden = false;
        } else {
            bookAvailability.hidden = false;
            bookActionNote.textContent =
                "This book is currently on loan. Please check back after it has been returned.";
        }
    } catch (error) {
        console.error("Could not load book:", error);
        showBookMessage(
            "Book unavailable",
            "We couldn't load this book right now. Please refresh and try again."
        );
    } finally {
        bookLoaded = true;
        updateBookAction();
    }
}

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    currentUserRole = null;
    authLoaded = false;
    updateBookAction();

    if (user) {
        try {
            const profileSnapshot = await getDoc(doc(db, "users", user.uid));

            if (profileSnapshot.exists()) {
                currentUserRole = profileSnapshot.data().role;
            }
        } catch (error) {
            console.error("Could not check the user's role:", error);
        }
    }

    authLoaded = true;
    updateBookAction();
});

bookAction.addEventListener("click", async () => {
    if (!currentBook || currentBook.availability !== "available") return;

    if (!currentUser) {
        const returnToBook =
            `../Catalog%20Page/book.html?book=${encodeURIComponent(currentBook.id)}`;

        window.location.assign(
            `../Signup/auth.html?next=${encodeURIComponent(returnToBook)}`
        );
        return;
    }

    if (currentUserRole !== "reader") return;

    bookAction.disabled = true;
    bookAction.textContent = "Sending request...";

    try {
        // Check this reader's requests to avoid duplicate active requests.
        const readerLoansQuery = query(
            collection(db, "loans"),
            where("readerUid", "==", currentUser.uid)
        );

        const readerLoans = await getDocs(readerLoansQuery);
        const existingRequest = readerLoans.docs.find((loanDocument) => {
            const loan = loanDocument.data();

            return loan.bookId === currentBook.id
                && ["requested", "borrowed", "return-requested"].includes(loan.status);
        });

        if (existingRequest) {
            bookAction.textContent =
                existingRequest.data().status === "borrowed"
                    ? "Already borrowed"
                    : "Request already sent";

            bookActionNote.textContent =
                existingRequest.data().status === "borrowed"
                    ? "You already have this book on loan."
                    : existingRequest.data().status === "return-requested"
                        ? "The librarian needs to confirm your return before you can request this book again."
                        : "Your request is waiting for the librarian to review it.";
            return;
        }

        const activeLoanCount = readerLoans.docs.filter((loanDocument) => {
            const status = loanDocument.data().status;
            return status === "borrowed" || status === "return-requested";
        }).length;

        if (activeLoanCount >= 3) {
            bookAction.textContent = "Borrowing limit reached";
            bookActionNote.textContent =
                "You can have up to three books on loan. After returning a book, wait for the librarian to confirm its return before requesting another.";
            return;
        }

        await addDoc(collection(db, "loans"), {
            bookId: currentBook.id,
            bookTitle: currentBook.title,
            readerUid: currentUser.uid,
            readerName:
                currentUser.displayName
                || currentUser.email?.split("@")[0]
                || "Reader",
            status: "requested",
            requestedAt: serverTimestamp(),
            borrowedAt: null,
            dueDate: null,
            returnedAt: null,
            processedBy: null
        });

        bookAction.textContent = "Request sent";
        bookActionNote.textContent =
            "Your request was sent to the librarian. You’ll see the loan dates here after it is approved.";

        await Swal.fire({
            icon: "success",
            title: "Request sent",
            text: "The librarian will review your request."
        });
    } catch (error) {
        console.error("Could not submit book request:", error);
        bookAction.disabled = false;
        bookAction.textContent = "Request this book";

        await Swal.fire({
            icon: "error",
            title: "Request not sent",
            text: "We couldn't submit your request. Please refresh and try again."
        });
    }
});

const welcomeMessage = document.getElementById("reader-welcome");
const signedInName = sessionStorage.getItem("signedInName");

if (welcomeMessage && signedInName) {
    welcomeMessage.textContent = `Welcome, ${signedInName}!`;
    welcomeMessage.hidden = false;
}

loadBook();