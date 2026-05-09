import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyDpMMvExzeM1b4pGz2nTUnXkZza2sXtVyI",
  authDomain: "annu-guild-test.firebaseapp.com",
  databaseURL: "https://annu-guild-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "annu-guild-test",
  storageBucket: "annu-guild-test.firebasestorage.app",
  messagingSenderId: "259073812655",
  appId: "1:259073812655:web:691105e24a8cee51a34c5a",
  measurementId: "G-4E1C87C4G8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== UTILITY =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

// ===== HOME PAGE: Realtime Videos =====
function loadVideos() {
    const container = document.getElementById('videosContainer');
    if (!container) return;

    onValue(ref(db, 'videos'), (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            container.innerHTML = '<div class="text-center text-gray-500">No videos posted yet.</div>';
            return;
        }

        const vList = Object.values(data).sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
        container.innerHTML = vList.map(v => `
            <div class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
                <img src="${v.thumb}" class="w-full h-48 object-cover">
                <div class="p-5">
                    <h3 class="text-xl font-bold">${escapeHtml(v.title)}</h3>
                    <a href="${v.url}" target="_blank" class="text-pink-500 mt-2 inline-block font-semibold">Watch on YouTube →</a>
                </div>
            </div>
        `).join('');
    });
}

// ===== HOME PAGE: Realtime Social Links =====
function loadSocialLinks() {
    const container = document.getElementById('socialLinksContainer');
    if (!container) return;

    onValue(ref(db, 'socialLinks'), (snapshot) => {
        const s = snapshot.val() || {};
        const secondChannelImage = 'https://yt3.googleusercontent.com/tDi1pAF8FZGIF8e2K1rx8JTKrpA16mEhIbT1NkUaPWeE0ZuNfbXIISUBHplqEeIlY2XNZJiV2Q=s176-c-k-c0x00ffffff-no-rj-mo';

        container.innerHTML = `
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition">
                <i class="fab fa-discord text-4xl mb-2"></i>
                <h3 class="text-2xl font-bold">Discord Server</h3>
                <a href="${s.discord || '#'}" target="_blank" class="inline-block bg-white text-indigo-600 px-5 py-2 rounded-full mt-3 font-bold">Join Server</a>
            </div>
            <div class="bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition">
                <i class="fab fa-instagram text-4xl mb-2"></i>
                <h3 class="text-2xl font-bold">Instagram</h3>
                <a href="${s.instagram || '#'}" target="_blank" class="inline-block bg-white text-pink-600 px-5 py-2 rounded-full mt-3 font-bold">Follow</a>
            </div>
            <div class="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition">
                <i class="fas fa-broadcast-tower text-4xl mb-2"></i>
                <h3 class="text-2xl font-bold">Broadcast</h3>
                <a href="${s.broadcast || '#'}" target="_blank" class="inline-block bg-white text-purple-600 px-5 py-2 rounded-full mt-3 font-bold">Join Now</a>
            </div>
            <div class="bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition col-span-full md:col-span-2">
                <div class="flex flex-col md:flex-row items-center justify-center gap-4">
                    <img src="${secondChannelImage}" class="w-20 h-20 rounded-full object-cover border-2 border-white shadow">
                    <div>
                        <h3 class="text-2xl font-bold">Second Channel</h3>
                        <a href="${s.secondChannel || '#'}" target="_blank" class="inline-block bg-white text-red-600 px-5 py-2 rounded-full mt-2 font-bold"><i class="fab fa-youtube mr-2"></i> ANNU PLAY EXTRA</a>
                    </div>
                </div>
            </div>
        `;
    });
}

// ===== FILE HELPER =====
function readFileAsDataURL(file, maxSizeMB) {
    return new Promise((resolve, reject) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
            reject(new Error(`File size exceeds ${maxSizeMB}MB`));
            return;
        }
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.readAsDataURL(file);
    });
}

// ===== GUILD REGISTRATION (Push to Firebase) =====
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = regForm.querySelector('button');
        const formMsg = document.getElementById('formMsg');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const ign = document.getElementById('ign').value.trim();
            const rank = document.getElementById('rank').value;
            const message = document.getElementById('message').value.trim();

            let profilePic = '';
            const picFile = document.getElementById('profilePic').files[0];
            if (picFile) profilePic = await readFileAsDataURL(picFile, 2);

            let video = '';
            const vidFile = document.getElementById('videoFile').files[0];
            if (vidFile) video = await readFileAsDataURL(vidFile, 10);

            // Push to Firebase registrations node
            await push(ref(db, 'registrations'), {
                name,
                email: email.toLowerCase(),
                ign,
                rank,
                message,
                profilePic,
                video,
                status: 'pending',
                submittedAt: Date.now()
            });

            formMsg.innerHTML = '<span class="text-green-600 font-bold">✅ Application Received! We will email you soon.</span>';
            regForm.reset();
        } catch (error) {
            formMsg.innerHTML = `<span class="text-red-500">❌ Error: ${error.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit Registration';
        }
    });
}

// ===== STATUS CHECK (Query Firebase) =====
const checkBtn = document.getElementById('checkStatusBtn');
if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
        const email = document.getElementById('checkEmail').value.trim().toLowerCase();
        const resDiv = document.getElementById('statusResult');
        if (!email) { resDiv.innerHTML = '<span class="text-red-500">Enter email</span>'; return; }

        resDiv.innerHTML = 'Searching...';

        const snapshot = await get(ref(db, 'registrations'));
        if (snapshot.exists()) {
            const regs = Object.values(snapshot.val());
            const found = regs.find(r => r.email === email);
            
            if (!found) {
                resDiv.innerHTML = '<span class="text-red-500">No application found with this email.</span>';
            } else {
                const statusMap = {
                    'pending': '<span class="text-yellow-600">⏳ Status: PENDING (Under Review)</span>',
                    'approved': '<span class="text-green-600">✅ Status: APPROVED! Welcome to the Guild.</span>',
                    'rejected': '<span class="text-red-600">❌ Status: REJECTED (Better luck next time)</span>'
                };
                resDiv.innerHTML = statusMap[found.status] || 'Unknown';
            }
        } else {
            resDiv.innerHTML = '<span class="text-red-500">No data found.</span>';
        }
    });
}

// Initialize
loadVideos();
loadSocialLinks();
