import { poll_backend } from "../../declarations/poll_backend";

const photoListDiv = document.getElementById('photoList');
const userPhotosDiv = document.getElementById('userPhotos');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const buyPhotoForm = document.getElementById('buyPhotoForm');
const errorDiv = document.getElementById('error');
const logoutButton = document.getElementById('logout');
const balanceDiv = document.getElementById('balance');

let currentUser = null;

// Load available photos when the page loads
document.addEventListener('DOMContentLoaded', async (e) => {
    e.preventDefault();
    await loadAvailablePhotos();
    return false;
}, false);

// Event listener for the register form
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const username = formData.get('username');
    const password = formData.get('password');
    const initialBalance = formData.get('initialBalance');
    
    const success = await poll_backend.register(username, password, parseInt(initialBalance));
    if (success) {
        showMessage("Registration successful. Please log in.");
    } else {
        showError("Username already taken.");
    }
    return false;
}, false);

// Event listener for the login form
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    
    currentUser = await poll_backend.login(username, password);
    if (currentUser) {
        showMessage(`Welcome, ${username}!`);
        await loadUserPhotos(username);
        await loadAvailablePhotos();
    } else {
        showError("Invalid username or password.");
    }
    return false;
}, false);

// Event listener for the buy photo form
buyPhotoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        showError("Please log in first.");
        return false;
    }

    const formData = new FormData(buyPhotoForm);
    const photoId = formData.get('photoId');
    
    const success = await poll_backend.buyPhoto(currentUser.username, parseInt(photoId));
    if (success) {
        showMessage("Photo purchased successfully.");
        await loadUserPhotos(currentUser.username);
        await loadAvailablePhotos();
    } else {
        showError("Photo could not be purchased. Maybe it's already owned or insufficient balance.");
    }
    return false;
}, false);

// Event listener for logout
logoutButton.addEventListener('click', async (e) => {
    e.preventDefault();
    currentUser = null;
    balanceDiv.innerHTML = '';
    showMessage("Logged out.");
    return false;
}, false);

// Load available photos from the backend
async function loadAvailablePhotos() {
    try {
        const photos = await poll_backend.availablePhotos();
        let photoHTML = '<ul>';
        for (const photo of photos) {
            photoHTML += `
                <li class="photo-item">
                    <img src="${photo.path}" alt="${photo.title}" />
                    <div>${photo.title} - ${photo.price}
                        <button onclick="buyPhoto(${photo.id})">Buy</button>
                    </div>
                </li>`;
        }
        photoHTML += '</ul>';
        photoListDiv.innerHTML = photoHTML;
    } catch (error) {
        showError("Failed to load photos: " + error.message);
    }
}

// Load user photos from the backend
async function loadUserPhotos(username) {
    try {
        const photos = await poll_backend.userPhotos(username);
        let userPhotoHTML = '<ul>';
        for (const photo of photos) {
            userPhotoHTML += `
                <li class="photo-item">
                    <img src="${photo.path}" alt="${photo.title}" />
                    <div>${photo.title} - ${photo.price}</div>
                </li>`;
        }
        userPhotoHTML += '</ul>';
        userPhotosDiv.innerHTML = userPhotoHTML;
        balanceDiv.innerHTML = `Balance: ${currentUser.balance}`;
    } catch (error) {
        showError("Failed to load user photos: " + error.message);
    }
}

// Helper function to show error messages
function showError(message) {
    errorDiv.innerText = message;
}

// Helper function to show success messages
function showMessage(message) {
    errorDiv.innerText = message;
}
