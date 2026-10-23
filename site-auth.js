import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCJdr5tJOxWV5KIdkYumuKf8CE3DFUTsu0",
    authDomain: "olag-s-book-house.firebaseapp.com",
    projectId: "olag-s-book-house",
    storageBucket: "olag-s-book-house.firebasestorage.app",
    messagingSenderId: "491432341942",
    appId: "1:491432341942:web:a18f46caf1d7cc5f471117"
};

// Reuse the Firebase app if this page has already initialized it.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signInLinks = document.querySelectorAll("[data-signin-link]");
const logoutButtons = document.querySelectorAll("[data-logout-button]");

const readerDashboard = document.querySelector("[data-reader-dashboard]");
const dashboardName = document.querySelector("[data-user-name]");
const dashboardEmail = document.querySelector("[data-user-email]");
const dashboardRole = document.querySelector("[data-user-role]");

onAuthStateChanged(auth, async (user) => {
    signInLinks.forEach((link) => {
        link.hidden = Boolean(user);
    });

    logoutButtons.forEach((button) => {
        button.hidden = !user;
    });

    if (readerDashboard) {
        readerDashboard.hidden = !user;
    }

    if (!user || !readerDashboard) {
        return;
    }

    const fallbackName =
        user.displayName || user.email?.split("@")[0] || "Reader";

    dashboardName.textContent = fallbackName;
    dashboardEmail.textContent = user.email || "";
    dashboardRole.textContent = "Reader";

    try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (profileSnapshot.exists()) {
            const profile = profileSnapshot.data();

            dashboardName.textContent =
                profile.displayName || fallbackName;

            dashboardRole.textContent =
                profile.role === "librarian" ? "Librarian" : "Reader";
        }
    } catch (error) {
        console.error("Could not load the user's profile:", error);
    }
});

logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        const confirmation = await Swal.fire({
            icon: "question",
            title: "Log out?",
            text: "Are you sure you want to log out?",
            showCancelButton: true,
            confirmButtonText: "Log out",
            cancelButtonText: "Stay signed in",
            reverseButtons: true
        });

        // Cancel leaves the reader signed in and keeps them on this page.
        if (!confirmation.isConfirmed) {
            return;
        }

        button.disabled = true;

        Swal.fire({
            title: "Logging out...",
            text: "Please wait.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            await signOut(auth);

            await Swal.fire({
                icon: "success",
                title: "You’re signed out",
                text: "Returning you to the homepage.",
                timer: 1200,
                timerProgressBar: true,
                showConfirmButton: false
            });

            window.location.assign(
                new URL("./index.html", import.meta.url).href
            );
        } catch (error) {
            console.error("Sign-out error:", error);
            Swal.close();
            button.disabled = false;

            await Swal.fire({
                icon: "error",
                title: "Could not log out",
                text: "Please try again."
            });
        }
    });
});