// ===== UTILITY =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ===== SAFE JSON READER =====
function safeGetJSON(key, fallback = []) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (e) {
        // Agar corrupted ho toh reset karo
        const fb = fallback;
        localStorage.setItem(key, JSON.stringify(fb));
        return fb;
    }
}

// ===== INITIALIZE DEFAULT DATA =====
function initData() {
    if (!localStorage.getItem('registrations')) {
        localStorage.setItem('registrations', JSON.stringify([]));
    }
    if (!localStorage.getItem('members')) {
        localStorage.setItem('members', JSON.stringify([
            {
                id: 1,
                name: 'Annu',
                ign: 'AnnuPro',
                rank: 'Grandmaster',
                joinDate: new Date().toISOString().split('T')[0],
                profilePic: ''
            }
        ]));
    }
    if (!localStorage.getItem('videos')) {
        localStorage.setItem('videos', JSON.stringify([
            {
                id: 1,
                title: 'FreeFire Pro Tips',
                url: 'https://youtu.be/TnhJxvqLbPU',
                thumb: 'https://img.youtube.com/vi/TnhJxvqLbPU/maxresdefault.jpg',
                desc: 'Master the game',
                date: Date.now()
            },
            {
                id: 2,
                title: 'Battle Royale Highlights',
                url: 'https://youtu.be/ZO4cYBOTp_g',
                thumb: 'https://img.youtube.com/vi/ZO4cYBOTp_g/maxresdefault.jpg',
                desc: 'Epic moments',
                date: Date.now() - 86400000
            }
        ]));
    }
    if (!localStorage.getItem('socialLinks')) {
        localStorage.setItem('socialLinks', JSON.stringify({
            discord: 'https://discord.gg/your-invite',
            instagram: 'https://instagram.com/yourusername',
            broadcast: 'https://ig.me/j/your-broadcast',
            secondChannel: 'https://youtube.com/@annuplayextra20?si=iS8HzVS0-AKJEIGQ',
            secondChannelImage: 'https://img.sanishtech.com/u/d1da5d219b135feb7d97e8f6aca6f66b.jpg'
        }));
    }
}
initData();

// ===== HOME PAGE: Videos =====
function loadVideos() {
    const container = document.getElementById('videosContainer');
    if (!container) return;
    let v = safeGetJSON('videos', []);
    v.sort((a, b) => (b.date || 0) - (a.date || 0));
    v = v.slice(0, 3);
    if (v.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500">No videos</div>';
        return;
    }
    container.innerHTML = v.map(v => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
            <img src="${v.thumb}" class="w-full h-48 object-cover">
            <div class="p-5">
                <h3 class="text-xl font-bold">${escapeHtml(v.title)}</h3>
                <p>${escapeHtml(v.desc || '')}</p>
                <a href="${v.url}" target="_blank" class="text-pink-500 mt-2 inline-block">Watch →</a>
            </div>
        </div>
    `).join('');
}

// ===== HOME PAGE: Social Links =====
function loadSocialLinks() {
    const container = document.getElementById('socialLinksContainer');
    if (!container) return;
    const s = safeGetJSON('socialLinks', {});
    if (Object.keys(s).length === 0) return;

    const secondChannelImage = 'https://img.sanishtech.com/u/d1da5d219b135feb7d97e8f6aca6f66b.jpg';

    container.innerHTML = `
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition">
            <i class="fab fa-discord text-4xl mb-2"></i>
            <h3 class="text-2xl font-bold">Discord Server</h3>
            <p>Exclusive updates</p>
            <a href="${s.discord || '#'}" target="_blank" class="inline-block bg-white text-indigo-600 px-5 py-2 rounded-full mt-3">Join Server</a>
        </div>
        <div class="bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition">
            <i class="fab fa-instagram text-4xl mb-2"></i>
            <h3 class="text-2xl font-bold">Instagram</h3>
            <p>Daily stories</p>
            <a href="${s.instagram || '#'}" target="_blank" class="inline-block bg-white text-pink-600 px-5 py-2 rounded-full mt-3">Follow</a>
        </div>
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition">
            <i class="fas fa-broadcast-tower text-4xl mb-2"></i>
            <h3 class="text-2xl font-bold">Broadcast</h3>
            <p>Direct announcements</p>
            <a href="${s.broadcast || '#'}" target="_blank" class="inline-block bg-white text-purple-600 px-5 py-2 rounded-full mt-3">Join</a>
        </div>
        <div class="bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl p-6 text-center text-white shadow-xl hover:scale-105 transition col-span-full md:col-span-2">
            <div class="flex flex-col md:flex-row items-center justify-center gap-4">
                <img src="${secondChannelImage}" class="w-20 h-20 rounded-full object-cover border-2 border-white shadow" alt="Second Channel"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/80?text=AP';">
                <div>
                    <h3 class="text-2xl font-bold">Second Channel</h3>
                    <p>Extra gameplay, shorts</p>
                    <a href="${s.secondChannel || '#'}" target="_blank" class="inline-block bg-white text-red-600 px-5 py-2 rounded-full mt-2"><i class="fab fa-youtube mr-2"></i> ANNU PLAY EXTRA</a>
                </div>
            </div>
        </div>
    `;
}

// ===== READ FILE AS DATA URL (with error handling) =====
function readFileAsDataURL(file, maxSizeMB) {
    return new Promise((resolve, reject) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
            reject(new Error(`File size exceeds ${maxSizeMB}MB`));
            return;
        }
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error || new Error('File read failed'));
        fr.readAsDataURL(file);
    });
}

// ===== GUILD REGISTRATION =====
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formMsg = document.getElementById('formMsg');
        try {
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const ign = document.getElementById('ign').value.trim();
            const rank = document.getElementById('rank').value;
            const msg = document.getElementById('message').value.trim();

            if (!name || !email || !ign) {
                formMsg.innerHTML = '<span class="text-red-500">❌ Name, Email, IGN required</span>';
                return;
            }

            // Profile picture
            let profilePic = '';
            const picFile = document.getElementById('profilePic').files[0];
            if (picFile) {
                try {
                    profilePic = await readFileAsDataURL(picFile, 2);
                } catch (err) {
                    formMsg.innerHTML = '<span class="text-red-500">❌ Image error: ' + err.message + '</span>';
                    return;
                }
            }

            // Gameplay video
            let video = '';
            const vidFile = document.getElementById('videoFile').files[0];
            if (vidFile) {
                if (!vidFile.type.includes('mp4')) {
                    formMsg.innerHTML = '<span class="text-red-500">❌ Only MP4 allowed</span>';
                    return;
                }
                try {
                    video = await readFileAsDataURL(vidFile, 10);
                } catch (err) {
                    formMsg.innerHTML = '<span class="text-red-500">❌ Video error: ' + err.message + '</span>';
                    return;
                }
            }

            // Safe read registrations
            const regs = safeGetJSON('registrations', []);
            regs.push({
                id: Date.now(),
                name,
                email,
                ign,
                rank,
                message: msg,
                profilePic,
                video,
                status: 'pending',
                submittedAt: new Date().toISOString()
            });
            localStorage.setItem('registrations', JSON.stringify(regs));

            formMsg.innerHTML = '<span class="text-green-500">✅ Registered! Admin will review.</span>';
            regForm.reset();
            setTimeout(() => formMsg.innerHTML = '', 4000);
        } catch (error) {
            formMsg.innerHTML = '<span class="text-red-500">❌ Unexpected error: ' + error.message + '</span>';
            console.error(error);
        }
    });
}

// ===== STATUS CHECK =====
const checkBtn = document.getElementById('checkStatusBtn');
if (checkBtn) {
    checkBtn.addEventListener('click', () => {
        const email = document.getElementById('checkEmail').value.trim();
        if (!email) {
            document.getElementById('statusResult').innerHTML = '<span class="text-red-500">Enter email</span>';
            return;
        }
        const regs = safeGetJSON('registrations', []);
        const found = regs.find(r => r.email === email);
        if (!found) {
            document.getElementById('statusResult').innerHTML = '<span class="text-red-500">Not found</span>';
        } else if (found.status === 'pending') {
            document.getElementById('statusResult').innerHTML = '<span class="text-yellow-600">⏳ Pending</span>';
        } else if (found.status === 'approved') {
            document.getElementById('statusResult').innerHTML = '<span class="text-green-600">✅ Approved! Welcome.</span>';
        } else {
            document.getElementById('statusResult').innerHTML = '<span class="text-red-600">❌ Rejected</span>';
        }
    });
}

// ===== INITIAL LOAD FOR HOME PAGE =====
loadVideos();
loadSocialLinks();