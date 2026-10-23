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
    doc,
    getDoc,
    getFirestore,
    serverTimestamp,
    setDoc
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

const statusMessage = document.getElementById("seed-status");
const seedButton = document.getElementById("seed-button");

let librarianIsSignedIn = false;

// Enable importing only if this account's Firestore profile says librarian.
onAuthStateChanged(auth, async (user) => {
    seedButton.disabled = true;
    librarianIsSignedIn = false;

    if (!user) {
        statusMessage.textContent =
            "You are signed out. Sign in with your librarian account, then open this page again.";
        return;
    }

    try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));

        if (!profileSnapshot.exists() ||
            profileSnapshot.data().role !== "librarian") {
            statusMessage.textContent =
                "This account does not have the librarian role.";
            return;
        }

        librarianIsSignedIn = true;
        seedButton.disabled = false;
        statusMessage.textContent =
            `Signed in as librarian. ${window.libraryBooks.length} books are ready to import.`;
    } catch (error) {
        console.error("Could not check librarian profile:", error);
        statusMessage.textContent =
            "Could not check your role. Check the browser console and Firestore rules.";
    }
});

seedButton.addEventListener("click", async () => {
    if (!librarianIsSignedIn) return;

    seedButton.disabled = true;
    statusMessage.textContent = "Importing books...";

    let importedCount = 0;
    let skippedCount = 0;

    try {
        for (const book of window.libraryBooks) {
            const bookRef = doc(db, "books", book.id);
            const existingBook = await getDoc(bookRef);

            if (existingBook.exists()) {
                skippedCount++;
                continue;
            }

            await setDoc(bookRef, {
                ...book,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            importedCount++;
        }

        statusMessage.textContent =
            `Finished: ${importedCount} imported, ${skippedCount} already existed and were skipped.`;
    } catch (error) {
        console.error("Book import failed:", error);
        statusMessage.textContent =
            "Import stopped. Check the browser console for details. You can run it again; existing books will be skipped.";
    } finally {
        seedButton.disabled = false;
    }
});