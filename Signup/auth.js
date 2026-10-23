import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendEmailVerification,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
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

async function ensureReaderProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    // Create the profile only if it does not already exist.
    // This avoids changing an existing librarian role.
    if (!userSnapshot.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            displayName:
                user.displayName || user.email?.split("@")[0] || "Reader",
            email: user.email,
            role: "reader",
            createdAt: serverTimestamp()
        });
    }
}

const viewButtons = document.querySelectorAll("[data-auth-view]");
const signupPanel = document.getElementById("signup-panel");
const signinPanel = document.getElementById("signin-panel");
const authMessage = document.getElementById("auth-message");

function continueAfterSignIn(
    user,
    name = user.displayName || user.email || "Reader"
) {
    sessionStorage.setItem("signedInName", name);

    const requestedPage =
        new URLSearchParams(window.location.search).get("next");
    const fallbackPage = "../Dashboard/dashboard.html";

    if (requestedPage) {
        const destination = new URL(requestedPage, window.location.href);

        if (destination.origin === window.location.origin) {
            window.location.assign(destination.href);
            return;
        }
    }

    window.location.assign(fallbackPage);
}

// Switch between the sign-up and sign-in panels.
viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const view = button.dataset.authView;
        const showSignup = view === "signup";

        signupPanel.hidden = !showSignup;
        signinPanel.hidden = showSignup;
        authMessage.textContent = "";

        document.querySelectorAll(".auth-tab").forEach((tab) => {
            const isActive = tab.dataset.authView === view;
            tab.classList.toggle("is-active", isActive);
            tab.setAttribute("aria-pressed", isActive);
        });
    });
});

const signupForm = document.getElementById("signup-form");
const signinForm = document.getElementById("signin-form");

// Create an email-and-password account.
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const firstName = formData.get("firstName").trim();
    const lastName = formData.get("lastName").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
        await Swal.fire({
            icon: "error",
            title: "Passwords don't match",
            text: "Check both password fields and try again."
        });
        return;
    }

    Swal.fire({
        title: "Creating your account...",
        text: "Please wait.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const result = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const fullName = `${firstName} ${lastName}`;

        await updateProfile(result.user, {
            displayName: fullName
        });

        // Send this before profile saving, so a Firestore rules problem
        // cannot prevent Firebase from sending the verification email.
        await sendEmailVerification(result.user);
        await signOut(auth);

        await Swal.fire({
            icon: "success",
            title: "Account created successfully!",
            text: "We sent a verification link to your email. Verify your address, then sign in."
        });

        document.querySelector('[data-auth-view="signin"]').click();
    } catch (error) {
        console.error("Sign-up error:", error);
        Swal.close();

        let message = "We couldn't create your account. Please try again.";

        if (error.code === "auth/email-already-in-use") {
            message = "An account with that email already exists. Try signing in.";
        } else if (error.code === "auth/weak-password") {
            message = "Your password is too weak. Choose a stronger one.";
        } else if (error.code === "auth/operation-not-allowed") {
            message = "Email and password sign-up isn't enabled in Firebase yet.";
        }

        await Swal.fire({
            icon: "error",
            title: "Account creation failed",
            text: message
        });
    }
});

// Sign in with email and password.
signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signinForm);
    const email = formData.get("email").trim();
    const password = formData.get("password");

    Swal.fire({
        title: "Signing you in...",
        text: "Please wait.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const result = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        // This check must happen before creating the profile or redirecting.
        if (!result.user.emailVerified) {
            await signOut(auth);

            await Swal.fire({
                icon: "warning",
                title: "Verify your email first",
                text: "Open the verification link we emailed you, then sign in again."
            });
            return;
        }

        await ensureReaderProfile(result.user);
        continueAfterSignIn(result.user);
    } catch (error) {
        console.error("Sign-in error:", error);
        Swal.close();

        let message = "We couldn't sign you in. Please try again.";

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/invalid-login-credentials" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {
            message = "The email or password is incorrect. Check them and try again.";
        } else if (error.code === "permission-denied") {
            message =
                "Sign-in worked, but Firestore couldn't read or create your profile. The Firestore rules need checking.";
        } else if (error.code === "auth/too-many-requests") {
            message = "Too many attempts. Wait a little, then try again.";
        }

        await Swal.fire({
            icon: "error",
            title: "Sign-in failed",
            text: message
        });
    }
});

// Send a password-reset email.
const forgotPasswordButton = document.getElementById("forgot-password");

forgotPasswordButton.addEventListener("click", async () => {
    const email = document.getElementById("signin-email").value.trim();

    if (!email) {
        await Swal.fire({
            icon: "warning",
            title: "Enter your email",
            text: "Type your email address first, then click Forgot password."
        });
        return;
    }

    Swal.fire({
        title: "Sending reset email...",
        text: "Please wait.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        await sendPasswordResetEmail(auth, email);

        await Swal.fire({
            icon: "success",
            title: "Check your email",
            text: "If an account uses that address, Firebase has sent a password reset link. Check your spam folder too."
        });
    } catch (error) {
        console.error("Password reset error:", error);
        Swal.close();

        let message = "We couldn't send the reset email. Please try again.";

        if (error.code === "auth/invalid-email") {
            message = "That email address doesn't look valid. Check it and try again.";
        }

        await Swal.fire({
            icon: "error",
            title: "Reset email failed",
            text: message
        });
    }
});

// Google sign-in works for both Google buttons because both use
// the data-google-signin attribute.
const googleProvider = new GoogleAuthProvider();
const googleButtons = document.querySelectorAll("[data-google-signin]");

googleButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        try {
            // Start the popup directly from the click before showing the loader.
            const signInPromise = signInWithPopup(auth, googleProvider);

            Swal.fire({
                title: "Connecting to Google...",
                text: "Please wait.",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const result = await signInPromise;
            await ensureReaderProfile(result.user);

            const userName =
                result.user.displayName || result.user.email || "Reader";

            await Swal.fire({
                icon: "success",
                title: `Welcome, ${userName}!`,
                text: "You signed in successfully."
            });

            continueAfterSignIn(result.user);
        } catch (error) {
            console.error("Google sign-in error:", error);
            Swal.close();

            let message =
                "We couldn't sign you in with Google. Please try again.";

            if (error.code === "permission-denied") {
                message =
                    "Google sign-in worked, but Firestore couldn't read or create your profile. The Firestore rules need checking.";
            }

            await Swal.fire({
                icon: "error",
                title: "Google sign-in failed",
                text: message
            });
        }
    });
});