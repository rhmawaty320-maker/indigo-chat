const socket = io();
let username, room, profilePic = "";
let mediaRecorder, audioChunks = [], isRecording = false;

// LOGIN
function startChat() {
    username = document.getElementById('username').value;
    room = document.getElementById('room').value;
    if (username && room) {
        document.getElementById('login-area').style.display = 'none';
        document.getElementById('chat-area').style.display = 'flex';
        document.getElementById('room-display').innerText = "Room: " + room;
        socket.emit('join-room', { username, room });
    }
}

// FOTO PROFIL LOGIN
document.getElementById('profile-input').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => { profilePic = reader.result; document.getElementById('img-preview').src = profilePic; };
    reader.readAsDataURL(e.target.files[0]);
};

// FITUR EMOJI
function toggleEmoji(e) {
    e.stopPropagation();
    const el = document.getElementById('emoji-container');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function closeEmoji() { document.getElementById('emoji-container').style.display = 'none'; }
document.querySelector('emoji-picker').addEventListener('emoji-click', e => {
    document.getElementById('msg').value += e.detail.unicode;
});

// FITUR KAMERA (KIRIM FOTO)
document.getElementById('photo-input').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => socket.emit('send-chat', { sender:username, room, type:'image', content:reader.result, profile:profilePic });
    reader.readAsDataURL(e.target.files[0]);
};

// FITUR VOICE NOTE (VN)
const recordBtn = document.getElementById('record-btn');
async function startRecording(e) {
    if (e) e.preventDefault();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (ev) => audioChunks.push(ev.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => socket.emit('send-chat', { sender:username, room, type:'audio', content:reader.result, profile:profilePic });
            stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        isRecording = true;
        recordBtn.style.color = "red";
        document.getElementById('record-timer').style.display = 'block';
    } catch (err) { alert("Akses Mic Ditolak!"); }
}
function stopRecording() {
    if (isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.style.color = "";
        document.getElementById('record-timer').style.display = 'none';
    }
}
recordBtn.onmousedown = startRecording; window.onmouseup = stopRecording;
recordBtn.ontouchstart = startRecording; recordBtn.ontouchend = stopRecording;

// KIRIM TEKS
function send() {
    const input = document.getElementById('msg');
    if (input.value) {
        socket.emit('send-chat', { sender: username, room, type: 'text', content: input.value, profile: profilePic });
        input.value = '';
        document.getElementById('snd-send').play();
    }
}

// NOTIFIKASI BERGABUNG + BUNYI
socket.on('user-joined', (name) => {
    const chatBox = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.innerHTML = `<span>👋 ${name.toUpperCase()} BERGABUNG</span>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    document.getElementById('snd-receive').play();
});

// TERIMA CHAT
socket.on('receive-chat', data => {
    const isMe = data.sender === username;
    const chatBox = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `msg-wrapper ${isMe ? 'me' : 'others'}`;
    let c = data.type==='text' ? `<div class="bubble">${data.content}</div>` : 
            data.type==='audio' ? `<div class="bubble"><audio controls src="${data.content}"></audio></div>` : 
            `<div class="bubble"><img src="${data.content}" style="width:100%; border-radius:10px;"></div>`;
    div.innerHTML = `<div style="display:flex; gap:10px; ${isMe?'flex-direction:row-reverse':''}; align-items:flex-end;">
        <img src="${data.profile || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
        <div><small style="display:block; font-size:10px; color:#888;">${data.sender}</small>${c}</div>
    </div>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    if(!isMe) document.getElementById('snd-receive').play();
});

function toggleDarkMode() { document.body.classList.toggle('dark-theme'); }