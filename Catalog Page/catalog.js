import {
    getApp,
    getApps,
    initializeApp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    collection,
    getDocs,
    getFirestore
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
const db = getFirestore(app);

// Firestore will fill this array when the catalog loads.
let books = [];

const bookGrid = document.getElementById("book-grid");
const filterForm = document.getElementById("catalog-filter-form");
const searchInput = document.getElementById("catalog-search");
const categoryFilter = document.getElementById("category-filter");
const availabilityFilter = document.getElementById("availability-filter");

// This message will appear when no books match the search or filters.
const resultsMessage = document.createElement("p");
resultsMessage.setAttribute("aria-live", "polite");
bookGrid.after(resultsMessage);

function displayBooks(bookList) {
    bookGrid.innerHTML = "";

    if (bookList.length === 0) {
        resultsMessage.textContent = "No books match your search. Try changing your search or filters.";
         document.querySelector(".catalog-results-heading h2").textContent= ''
        return;
    }else{
        document.querySelector(".catalog-results-heading h2").textContent =
    `Showing ${bookList.length} ${bookList.length === 1 ? "book" : "books"}`;
    }

    resultsMessage.textContent = "";

    bookList.forEach(function (book) {
        const bookLink = `./book.html?book=${encodeURIComponent(book.id)}`;
        const availabilityText =
            book.availability === "available" ? "Available" : "On loan";

        const card = document.createElement("article");
        card.className = "book-card";
        card.dataset.title = book.title.toLowerCase();
        card.dataset.author = book.author.toLowerCase();
        card.dataset.category = book.category;
        card.dataset.availability = book.availability;

        card.innerHTML = `
            <a class="book-card-cover" href="${bookLink}"
               aria-label="View ${book.title} details">
                <img class="catalog-cover-image"
                     src="${book.cover}"
                     alt="Cover of ${book.title}">
            </a>

            <div class="book-card-content">
                <span class="availability">
                    <span class="availability-dot" aria-hidden="true"></span>
                    ${availabilityText}
                </span>

                <h3><a href="${bookLink}">${book.title}</a></h3>
                <p class="book-author">by ${book.author}</p>
                <p class="book-description">${book.description}</p>

                <a class="button button-secondary" href="${bookLink}">
                    View book details
                </a>
            </div>
        `;

        bookGrid.appendChild(card);
    });
}

function filterBooks() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedAvailability = availabilityFilter.value;

    const matchingBooks = books.filter(function (book) {
        const matchesSearch =
            book.title.toLowerCase().includes(searchText) ||
            book.author.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            book.category === selectedCategory;

        const matchesAvailability =
            selectedAvailability === "all" ||
            book.availability === selectedAvailability;

        return matchesSearch && matchesCategory && matchesAvailability;
    });

    displayBooks(matchingBooks);
}
async function loadBooksFromFirestore() {
    resultsMessage.textContent = "Loading books...";
    resultsMessage.classList.add("is-loading");
    bookGrid.setAttribute("aria-busy", "true");

    try {
        const booksSnapshot = await getDocs(collection(db, "books"));

        books = booksSnapshot.docs.map((bookDocument) => ({
            ...bookDocument.data(),
            id: bookDocument.id
        }));

        resultsMessage.classList.remove("is-loading");
        filterBooks();
    } catch (error) {
        console.error("Could not load books:", error);

        resultsMessage.classList.remove("is-loading");
        resultsMessage.textContent =
            "We couldn't load the books. Please refresh and try again.";
    } finally {
        bookGrid.removeAttribute("aria-busy");
    }
}

// Stop the form from reloading the page when Search is clicked.
filterForm.addEventListener("submit", function (event) {
    event.preventDefault();
    filterBooks();
});

// Update results while the visitor types or changes a filter.
searchInput.addEventListener("input", filterBooks);
categoryFilter.addEventListener("change", filterBooks);
availabilityFilter.addEventListener("change", filterBooks);

// Show all books when the catalog first opens.
const catalogParams = new URLSearchParams(window.location.search);
searchInput.value = catalogParams.get("q") || "";

loadBooksFromFirestore();