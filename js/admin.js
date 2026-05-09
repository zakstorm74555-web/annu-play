// ===== ADMIN PANEL GUARD =====
if (!localStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin-login.html';
}

// ===== REPLACE WITH YOUR EMAILJS KEYS (optional) =====
const EMAILJS_USER_ID = "Cx_0hU_rlhb3mvDT0";
const EMAILJS_SERVICE_ID = "service_xdgfif6";
const EMAILJS_TEMPLATE_ID = "template_xkcqd68";
emailjs.init(EMAILJS_USER_ID);

async function sendEmail(to_email, to_name, status) {
    const social = JSON.parse(localStorage.getItem('socialLinks')) || {};
    const params = {
        to_name,
        to_email,
        status: status === 'approved' ? 'APPROVED ✅' : 'REJECTED ❌',
        message: status === 'approved' ? 'Welcome to the guild! Join Discord.' : 'Sorry, not accepted.',
        discord_link: social.discord || ''
    };
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
    } catch (e) {
        console.log('Email error:', e);
    }
}

function loadPending() {
    const regs = JSON.parse(localStorage.getItem('registrations')) || [];
    const pending = regs.filter(r => r.status === 'pending');
    const container = document.getElementById('pendingList');
    if (pending.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-6">No pending registrations</div>';
        return;
    }
    container.innerHTML = pending.map(req => `
        <div class="border rounded-xl p-4 bg-white shadow-md">
            <div class="flex flex-wrap gap-4 items-start">
                ${req.profilePic ? `<img src="${req.profilePic}" class="w-16 h-16 rounded-full object-cover">` : '<div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center"><i class="fas fa-user text-gray-500 text-2xl"></i></div>'}
                <div class="flex-1">
                    <strong>${escapeHtml(req.name)}</strong> (${escapeHtml(req.email)})<br>
                    IGN: ${escapeHtml(req.ign)} | Rank: ${escapeHtml(req.rank)}<br>
                    ${req.video ? `<video controls class="max-h-32 max-w-xs mt-2 rounded-lg"><source src="${req.video}" type="video/mp4"></video>` : '<span class="text-gray-500">No video</span>'}<br>
                    <span class="text-gray-600">${escapeHtml(req.message || '')}</span><br>
                    <span class="text-xs text-gray-400">${new Date(req.submittedAt).toLocaleString()}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="updateRequest(${req.id}, 'approved')" class="bg-green-500 text-white px-2 py-1 text-sm rounded-full hover:bg-green-600"><i class="fas fa-check mr-1"></i> Accept</button>
                    <button onclick="updateRequest(${req.id}, 'rejected')" class="bg-red-500 text-white px-2 py-1 text-sm rounded-full hover:bg-red-600"><i class="fas fa-times mr-1"></i> Reject</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.updateRequest = async function(id, status) {
    let regs = JSON.parse(localStorage.getItem('registrations')) || [];
    let members = JSON.parse(localStorage.getItem('members')) || [];
    const idx = regs.findIndex(r => r.id === id);
    if (idx !== -1) {
        const req = regs[idx];
        req.status = status;
        if (status === 'approved') {
            members.push({
                id: Date.now(),
                name: req.name,
                ign: req.ign,
                rank: req.rank,
                joinDate: new Date().toISOString().split('T')[0],
                profilePic: req.profilePic || ''
            });
            localStorage.setItem('members', JSON.stringify(members));
        }
        localStorage.setItem('registrations', JSON.stringify(regs));
        await sendEmail(req.email, req.name, status);
        loadPending();
        loadMembersAdmin();
        alert(`${status === 'approved' ? 'Accepted' : 'Rejected'} ${req.name}`);
    }
};

function loadMembersAdmin() {
    const members = JSON.parse(localStorage.getItem('members')) || [];
    const container = document.getElementById('adminMemberList');
    if (members.length === 0) {
        container.innerHTML = '<div class="text-gray-500">No members</div>';
        return;
    }
    container.innerHTML = members.map(m => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div class="flex items-center gap-2">
                ${m.profilePic ? `<img src="${m.profilePic}" class="w-8 h-8 rounded-full">` : '<i class="fas fa-user-circle text-2xl text-gray-400"></i>'}
                <span><strong>${escapeHtml(m.name)}</strong> (${escapeHtml(m.ign)}) - ${escapeHtml(m.rank)}</span>
            </div>
            <button onclick="removeMember(${m.id})" class="text-red-500 text-sm"><i class="fas fa-trash"></i> Remove</button>
        </div>
    `).join('');
}

window.removeMember = function(id) {
    let members = JSON.parse(localStorage.getItem('members')) || [];
    members = members.filter(m => m.id !== id);
    localStorage.setItem('members', JSON.stringify(members));
    loadMembersAdmin();
};

function loadVideosAdmin() {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    const container = document.getElementById('videosAdminList');
    if (videos.length === 0) {
        container.innerHTML = '<div class="text-gray-500">No videos. Add new.</div>';
        return;
    }
    container.innerHTML = videos.map(v => `
        <div class="border p-4 rounded-xl bg-white flex flex-wrap gap-4 items-start">
            <img src="${v.thumb}" class="w-28 h-20 object-cover rounded">
            <div class="flex-1 grid md:grid-cols-2 gap-2">
                <input type="text" id="title_${v.id}" value="${escapeHtml(v.title)}" class="form-input text-sm">
                <input type="text" id="url_${v.id}" value="${v.url}" class="form-input text-sm">
                <input type="text" id="thumb_${v.id}" value="${v.thumb}" class="form-input text-sm">
                <input type="text" id="desc_${v.id}" value="${escapeHtml(v.desc || '')}" class="form-input text-sm">
            </div>
            <div class="flex gap-2">
                <button onclick="updateVideo(${v.id})" class="bg-blue-500 text-white px-3 py-1 rounded-full text-sm"><i class="fas fa-save"></i> Save</button>
                <button onclick="deleteVideo(${v.id})" class="bg-red-500 text-white px-3 py-1 rounded-full text-sm"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `).join('');
}

window.updateVideo = function(id) {
    let videos = JSON.parse(localStorage.getItem('videos')) || [];
    const idx = videos.findIndex(v => v.id === id);
    if (idx !== -1) {
        videos[idx].title = document.getElementById(`title_${id}`).value;
        videos[idx].url = document.getElementById(`url_${id}`).value;
        videos[idx].thumb = document.getElementById(`thumb_${id}`).value;
        videos[idx].desc = document.getElementById(`desc_${id}`).value;
        localStorage.setItem('videos', JSON.stringify(videos));
        loadVideosAdmin();
        if (window.loadVideos) window.loadVideos();
    }
};

window.deleteVideo = function(id) {
    let videos = JSON.parse(localStorage.getItem('videos')) || [];
    videos = videos.filter(v => v.id !== id);
    localStorage.setItem('videos', JSON.stringify(videos));
    loadVideosAdmin();
    if (window.loadVideos) window.loadVideos();
};

document.getElementById('addVideoBtn')?.addEventListener('click', () => {
    let videos = JSON.parse(localStorage.getItem('videos')) || [];
    videos.push({
        id: Date.now(),
        title: 'New Video',
        url: 'https://youtu.be/example',
        thumb: 'https://img.youtube.com/vi/example/maxresdefault.jpg',
        desc: '',
        date: Date.now()
    });
    localStorage.setItem('videos', JSON.stringify(videos));
    loadVideosAdmin();
    if (window.loadVideos) window.loadVideos();
});

function loadSocialAdmin() {
    const s = JSON.parse(localStorage.getItem('socialLinks'));
    if (!s) return;
    document.getElementById('discordAdmin').value = s.discord || '';
    document.getElementById('instagramAdmin').value = s.instagram || '';
    document.getElementById('broadcastAdmin').value = s.broadcast || '';
    document.getElementById('secondChannelAdmin').value = s.secondChannel || '';
}

document.getElementById('saveSocialBtn')?.addEventListener('click', () => {
    const newLinks = {
        discord: document.getElementById('discordAdmin').value,
        instagram: document.getElementById('instagramAdmin').value,
        broadcast: document.getElementById('broadcastAdmin').value,
        secondChannel: document.getElementById('secondChannelAdmin').value,
        secondChannelImage: 'https://img.sanishtech.com/u/0df2b2128a37e8baf3347bf36198a2e7.jpg'
    };
    localStorage.setItem('socialLinks', JSON.stringify(newLinks));
    alert('Social links saved!');
    if (window.loadSocialLinks) window.loadSocialLinks();
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin-login.html';
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Initial load
loadPending();
loadMembersAdmin();
loadVideosAdmin();
loadSocialAdmin();