document.getElementById('mainPostForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg = document.getElementById('msg').value;
    const file = document.getElementById('mediaFile').files[0];
    const userId = localStorage.getItem('currentUserId');

    if (!userId) {
        alert("กรุณาเข้าสู่ระบบก่อนทำการโพสต์ครับ");
        window.location.href = "login.html";
        return;
    }

    let imageData = null;
    if (file) {
        imageData = await readFileAsBase64(file);
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: userId, 
                content: msg, 
                image_data: imageData,
                status: 'pending'
            })
        });

        const data = await response.json();
        if (data.success) {
            alert("ส่งข้อมูลสำเร็จ! รอแอดมินตรวจสอบสถานะ");
            document.getElementById('mainPostForm').reset();
            document.getElementById('fileName').innerText = "ยังไม่ได้เลือกไฟล์";
            displayContent();
        } else {
            alert("เกิดข้อผิดพลาด");
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
});

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function displayContent() {
    const myStatusList = document.getElementById('myStatusList');
    const newsContainer = document.getElementById('news-container');
    const currentUserId = localStorage.getItem('currentUserId');

    try {
        const response = await fetch('/api/posts');
        const allPosts = await response.json();

        const statusCol = document.getElementById('status-column');
        const newsCol = document.getElementById('news-column');

        if (statusCol && newsCol) {
            if (!currentUserId) {
                statusCol.style.display = 'none';
                newsCol.style.flex = '1';
            } else {
                statusCol.style.display = 'block';
                newsCol.style.flex = '0.75';
            }
        }

        if(myStatusList) myStatusList.innerHTML = '';
        if(newsContainer) newsContainer.innerHTML = '';

        const approvedPosts = allPosts.filter(p => p.status === 'approved');
        if (approvedPosts.length > 0) {
            approvedPosts.reverse().forEach(p => {
                newsContainer.innerHTML += `
                    <div class="news-card">
                        ${p.image_data ? `<img src="${p.image_data}" class="news-image">` : ''}
                        <div class="news-content">
                            <strong><i class="fas fa-user-circle"></i> ${p.full_name || 'Unknown'}</strong>
                            <p>${p.content}</p>
                            <small style="color:#999;">${new Date(p.created_at).toLocaleString('th-TH')}</small>
                        </div>
                    </div>`;
            });
        } else {
            newsContainer.innerHTML = '<p style="color:#aaa;">ยังไม่มีข่าวสารประชาสัมพันธ์ในขณะนี้</p>';
        }

        if(currentUserId) {
            const userPosts = allPosts.filter(p => p.user_id == currentUserId);
            if (userPosts.length > 0) {
                userPosts.reverse().forEach(p => {
                    let sColor = '#f39c12'; let sText = 'รออนุมัติ';
                    if (p.status === 'approved') { sColor = '#27ae60'; sText = 'อนุมัติแล้ว'; }
                    else if (p.status === 'rejected') { sColor = '#e74c3c'; sText = 'ไม่อนุมัติ'; }
                    
                    myStatusList.innerHTML += `
                        <div class="status-card" style="border-left-color: ${sColor}">
                            <div style="display:flex; justify-content:space-between; font-size:11px;">
                                <span>${new Date(p.created_at).toLocaleDateString('th-TH')}</span>
                                <b style="color:${sColor}">${sText}</b>
                            </div>
                            <p style="margin-top:8px;">${p.content}</p>
                            ${p.image_data ? `<img src="${p.image_data}" class="status-img-small">` : ''}
                        </div>`;
                });
            }
        }
    } catch (error) {
        newsContainer.innerHTML = '<p style="color:#aaa;">เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
    }
}

function checkAuth() {
    const authMenu = document.getElementById('auth-menu');
    const user = localStorage.getItem('currentUser');
    if (user) {
        authMenu.innerHTML = `
            <a href="/profile.html" class="user-display" style="text-decoration:none; color:inherit;">
                <i class="fas fa-user-circle"></i> ${user}
            </a>
            <button class="logout-btn" onclick="logout()">ออกจากระบบ</button>`;
    } else {
        authMenu.innerHTML = `<a href="/login.html" class="logout-btn" style="text-decoration:none; display:inline-block; text-align:center;">เข้าสู่ระบบ</a>`;
    }
}

function updateAdminButton() {
    const roleId = localStorage.getItem('roleId');
    const adminBtn = document.getElementById('admin-link-item');

    if (adminBtn) {
        if (Number(roleId) === 1) {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('roleId');
    location.reload();
}

window.addEventListener('load', () => {
    checkAuth();
    displayContent();
    updateAdminButton();
});