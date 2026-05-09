import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, update, remove, set, get, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.app";

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
const loginBtn = document.getElementById('googleLoginBtn');
if (loginBtn) {
    loginBtn.onclick = async () => {
        const msg = document.getElementById('loginMsg');
        try {
            const result = await signInWithPopup(auth, provider);
            if (ALLOWED_EMAILS.includes(result.user.email.toLowerCase())) {
                localStorage.setItem('adminLoggedIn', 'true');
                msg.innerText = "Access Granted! Loading Panel...";
                msg.className = "mt-6 text-center font-bold text-sm text-green-600";
                setTimeout(() => window.location.href = 'admin-panel.html', 1000);
            } else {
                await signOut(auth);
                localStorage.removeItem('adminLoggedIn');
                msg.innerText = "Access Denied: You are not an Admin! 🛑";
                msg.className = "mt-6 text-center font-bold text-sm text-red-500";
            }
        } catch (e) {
            msg.innerText = "Login Error. Please try again.";
        }
    };
}

// --- DASHBOARD LOGIC ---
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
    
    // Logout Event
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

// 🟢 1. PENDING REQUESTS
function loadPending() {
    const container = document.getElementById('pendingList');
    if (!container) return;

    onValue(ref(db, 'registrations'), (snapshot) => {
        const data = snapshot.val();
        if (!data) { container.innerHTML = '<p class="text-gray-400">All clear!</p>'; return; }

        const pending = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .filter(r => r.status === 'pending');

        container.innerHTML = pending.map(req => `
            <div class="border rounded-xl p-4 bg-gray-50 flex flex-wrap gap-4 items-start">
                <img src="${req.profilePic || 'icon.png'}" class="w-16 h-16 rounded-full border-2 border-pink-200">
                <div class="flex-1">
                    <strong class="text-lg">${req.name}</strong> (${req.ign})<br>
                    <span class="text-sm text-gray-500">${req.rank}</span>
                    <div class="mt-2">
                        ${req.video ? `<video controls class="max-h-32 rounded"><source src="${req.video}"></video>` : ''}
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick="processReq('${req.id}', 'approved')" class="bg-green-500 text-white px-4 py-2 rounded-lg">Accept</button>
                    <button onclick="processReq('${req.id}', 'rejected')" class="bg-red-500 text-white px-4 py-2 rounded-lg">Reject</button>
                </div>
            </div>
        `).join('');
    });
}

window.processReq = async (id, status) => {
    const r = await get(ref(db, `registrations/${id}`));
    const req = r.val();
    if (status === 'approved') {
        await push(ref(db, 'members'), { name: req.name, ign: req.ign, rank: req.rank, profilePic: req.profilePic || '' });
    }
    await update(ref(db, `registrations/${id}`), { status });
    alert("Updated!");
};

// 🟢 2. SOCIAL LINKS
function loadSocialAdmin() {
    onValue(ref(db, 'socialLinks'), (s) => {
        const data = s.val();
        if (!data) return;
        if(document.getElementById('discordAdmin')) document.getElementById('discordAdmin').value = data.discord || '';
        if(document.getElementById('instagramAdmin')) document.getElementById('instagramAdmin').value = data.instagram || '';
        if(document.getElementById('broadcastAdmin')) document.getElementById('broadcastAdmin').value = data.broadcast || '';
        if(document.getElementById('secondChannelAdmin')) document.getElementById('secondChannelAdmin').value = data.secondChannel || '';
    });

    const saveSocialBtn = document.getElementById('saveSocialBtn');
    if (saveSocialBtn) {
        saveSocialBtn.onclick = () => {
            update(ref(db, 'socialLinks'), {
                discord: document.getElementById('discordAdmin').value,
                instagram: document.getElementById('instagramAdmin').value,
                broadcast: document.getElementById('broadcastAdmin').value,
                secondChannel: document.getElementById('secondChannelAdmin').value
            }).then(() => alert("Social Links Synced!"));
        };
    }
}

// 🟢 3. VIDEOS MANAGEMENT
function loadVideosAdmin() {
    const list = document.getElementById('videosAdminList');
    if (!list) return;

    onValue(ref(db, 'videos'), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        list.innerHTML = Object.entries(data).map(([id, v]) => `
            <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border">
                <img src="${v.thumb}" class="w-20 rounded">
                <div class="flex-1">
                    <input type="text" id="t_${id}" value="${v.title}" class="w-full mb-1 border rounded px-1">
                    <input type="text" id="u_${id}" value="${v.url}" class="w-full border rounded px-1 text-xs">
                </div>
                <button onclick="syncVid('${id}')" class="text-blue-500"><i class="fas fa-save"></i></button>
                <button onclick="delVid('${id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    });

    const addVidBtn = document.getElementById('addVideoBtn');
    if (addVidBtn) {
        addVidBtn.onclick = () => {
            push(ref(db, 'videos'), { title: 'New Video', url: '', thumb: 'icon.png' });
        };
    }
}

window.syncVid = (id) => {
    update(ref(db, `videos/${id}`), {
        title: document.getElementById(`t_${id}`).value,
        url: document.getElementById(`u_${id}`).value
    });
};

window.delVid = (id) => remove(ref(db, `videos/${id}`));

// 🟢 4. MEMBERS LIST
function loadMembersAdmin() {
    const list = document.getElementById('adminMemberList');
    if (!list) return;

    onValue(ref(db, 'members'), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        list.innerHTML = Object.entries(data).map(([id, m]) => `
            <div class="flex justify-between p-2 border-b">
                <span>${m.name} (${m.ign})</span>
                <button onclick="delMem('${id}')" class="text-red-500 text-xs">Remove</button>
            </div>
        `).join('');
    });
}

window.delMem = (id) => remove(ref(db, `members/${id}`));
