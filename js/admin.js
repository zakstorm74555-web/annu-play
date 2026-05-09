import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, update, remove, set, get, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDpMMvExzeM1b4pGz2nTUnXkZza2sXtVyI",
    authDomain: "annu-guild-test.firebaseapp.com",
    databaseURL: "https://annu-guild-test-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "annu-guild-test",
    storageBucket: "annu-guild-test.firebasestorage.app",
    messagingSenderId: "259073812655",
    appId: "1:259073812655:web:691105e24a8cee51a34c5a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// WHITELISTED ADMINS
const ALLOWED_EMAILS = [
    "bilalmohsin650@gmail.com",
    "annuplaybusiness@gmail.com",
    "cobracg6@gmail.com"
];

// --- AUTHENTICATION LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('googleLoginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const msg = document.getElementById('loginMsg');
            try {
                const result = await signInWithPopup(auth, provider);
                const email = result.user.email.toLowerCase();
                
                if (ALLOWED_EMAILS.includes(email)) {
                    localStorage.setItem('adminLoggedIn', 'true');
                    msg.innerText = "Access Granted! Loading Panel...";
                    msg.className = "mt-6 text-center font-bold text-sm text-green-600";
                    setTimeout(() => window.location.href = 'admin-panel.html', 1000);
                } else {
                    await signOut(auth);
                    localStorage.removeItem('adminLoggedIn');
                    msg.innerText = "Access Denied: Unauthorized Email! 🛑";
                    msg.className = "mt-6 text-center font-bold text-sm text-red-500";
                }
            } catch (e) {
                if(msg) msg.innerText = "Login Error. Please try again.";
            }
        });
    }
});

// --- DASHBOARD SESSION GUARD ---
onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.includes('admin-login.html');
    if (!user && !isLoginPage) {
        window.location.href = 'admin-login.html';
    } 
    if (user && !isLoginPage) {
        if (!ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
            window.location.href = 'admin-login.html';
        } else {
            initAdminPanel();
        }
    }
});

function initAdminPanel() {
    loadPending();
    loadSocialAdmin();
    loadVideosAdmin();
    loadMembersAdmin();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            signOut(auth).then(() => {
                localStorage.removeItem('adminLoggedIn');
                window.location.href = 'admin-login.html';
            });
        };
    }
}

// --- GLOBAL FUNCTIONS (Attached to window for HTML buttons) ---

window.processReq = async (id, status) => {
    const r = await get(ref(db, `registrations/${id}`));
    const req = r.val();
    if (status === 'approved') {
        await push(ref(db, 'members'), { 
            name: req.name, 
            ign: req.ign, 
            rank: req.rank, 
            profilePic: req.profilePic || '',
            joinDate: new Date().toISOString().split('T')[0]
        });
    }
    await update(ref(db, `registrations/${id}`), { status });
    alert("Request " + status.toUpperCase());
};

window.syncVid = (id) => {
    const title = document.getElementById(`t_${id}`).value;
    const url = document.getElementById(`u_${id}`).value;
    update(ref(db, `videos/${id}`), { title, url }).then(() => alert("Video Updated!"));
};

window.delVid = (id) => {
    if(confirm("Purge this video clip?")) remove(ref(db, `videos/${id}`));
};

window.delMem = (id) => {
    if(confirm("Remove this member from roster?")) remove(ref(db, `members/${id}`));
};

// --- DATA LOADING FUNCTIONS ---

function loadPending() {
    const container = document.getElementById('pendingList');
    if (!container) return;
    onValue(ref(db, 'registrations'), (snapshot) => {
        const data = snapshot.val();
        if (!data) { container.innerHTML = '<p class="text-gray-400">No pending registrations.</p>'; return; }
        const pending = Object.entries(data).map(([id, val]) => ({ id, ...val })).filter(r => r.status === 'pending');
        container.innerHTML = pending.map(req => `
            <div class="border rounded-xl p-4 bg-gray-50 flex flex-wrap gap-4 items-start mb-4">
                <img src="${req.profilePic || 'icon.png'}" class="w-16 h-16 rounded-full border-2 border-pink-200 object-cover">
                <div class="flex-1">
                    <strong class="text-lg">${req.name}</strong> (${req.ign})<br>
                    <span class="text-sm text-gray-500">${req.rank}</span>
                    <div class="mt-2">${req.video ? `<video controls class="max-h-32 rounded"><source src="${req.video}"></video>` : ''}</div>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick="processReq('${req.id}', 'approved')" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">Accept</button>
                    <button onclick="processReq('${req.id}', 'rejected')" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Reject</button>
                </div>
            </div>
        `).join('');
    });
}

function loadSocialAdmin() {
    onValue(ref(db, 'socialLinks'), (s) => {
        const data = s.val();
        if (!data) return;
        if(document.getElementById('discordAdmin')) document.getElementById('discordAdmin').value = data.discord || '';
        if(document.getElementById('instagramAdmin')) document.getElementById('instagramAdmin').value = data.instagram || '';
        if(document.getElementById('broadcastAdmin')) document.getElementById('broadcastAdmin').value = data.broadcast || '';
        if(document.getElementById('secondChannelAdmin')) document.getElementById('secondChannelAdmin').value = data.secondChannel || '';
    });
    const saveBtn = document.getElementById('saveSocialBtn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            update(ref(db, 'socialLinks'), {
                discord: document.getElementById('discordAdmin').value,
                instagram: document.getElementById('instagramAdmin').value,
                broadcast: document.getElementById('broadcastAdmin').value,
                secondChannel: document.getElementById('secondChannelAdmin').value
            }).then(() => alert("Social Links Synced!"));
        };
    }
}

function loadVideosAdmin() {
    const list = document.getElementById('videosAdminList');
    if (!list) return;
    onValue(ref(db, 'videos'), (snapshot) => {
        const data = snapshot.val();
        if (!data) { list.innerHTML = '<p class="text-gray-400">No videos.</p>'; return; }
        list.innerHTML = Object.entries(data).map(([id, v]) => `
            <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border mb-3">
                <img src="${v.thumb || 'icon.png'}" class="w-20 h-12 object-cover rounded">
                <div class="flex-1">
                    <input type="text" id="t_${id}" value="${v.title}" class="w-full mb-1 border rounded px-2 py-1 text-sm">
                    <input type="text" id="u_${id}" value="${v.url}" class="w-full border rounded px-2 py-1 text-xs">
                </div>
                <div class="flex gap-2">
                    <button onclick="syncVid('${id}')" class="text-blue-500 p-2"><i class="fas fa-save"></i></button>
                    <button onclick="delVid('${id}')" class="text-red-500 p-2"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    });
    const addVidBtn = document.getElementById('addVideoBtn');
    if (addVidBtn) {
        addVidBtn.onclick = () => {
            push(ref(db, 'videos'), { title: 'New Transmission', url: '', thumb: 'icon.png', timestamp: Date.now() });
        };
    }
}

function loadMembersAdmin() {
    const list = document.getElementById('adminMemberList');
    if (!list) return;
    onValue(ref(db, 'members'), (snapshot) => {
        const data = snapshot.val();
        if (!data) { list.innerHTML = '<p class="text-gray-400">No members found.</p>'; return; }
        list.innerHTML = Object.entries(data).map(([id, m]) => `
            <div class="flex justify-between items-center p-3 border-b bg-white rounded-lg mb-2 shadow-sm">
                <div class="flex items-center gap-3">
                    <img src="${m.profilePic || 'icon.png'}" class="w-8 h-8 rounded-full">
                    <span class="font-medium">${m.name} <small class="text-gray-500">(${m.ign})</small></span>
                </div>
                <button onclick="delMem('${id}')" class="text-red-500 hover:text-red-700 transition"><i class="fas fa-user-minus"></i></button>
            </div>
        `).join('');
    });
}
