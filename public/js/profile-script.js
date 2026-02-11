window.onload = function() {
    const currentUserId = localStorage.getItem('currentUserId');
    const currentUser = localStorage.getItem('currentUser');
    const roleId = localStorage.getItem('roleId');
    
    if (!currentUserId) {
        window.location.href = '/login';
        return;
    }

    document.getElementById('profile-name').innerText = currentUser || 'User';
    
    
    const badge = document.getElementById('role-badge');
    if (roleId === '1') {
        badge.innerHTML = '<span class="badge admin-badge">ผู้ดูแลระบบ (Admin)</span>';
    } else {
        badge.innerHTML = '<span class="badge user-badge">สมาชิก (User)</span>';
    }
    
    
    fetchUserData(currentUserId);
    
    
    fetchUserPosts(currentUserId);
};

function fetchUserData(userId) {
    fetch('/api/users')
        .then(res => res.json())
        .then(users => {
            const userData = users.find(u => u.user_id === parseInt(userId));
            if (userData) {
                document.getElementById('full-name').innerText = userData.full_name || '-';
                document.getElementById('gender').innerText = userData.gender || '-';
                document.getElementById('blood-type').innerText = userData.blood_type || '-';
            }
        })
        .catch(err => {
            console.error('Error fetching user data:', err);
            document.getElementById('full-name').innerText = '-';
            document.getElementById('gender').innerText = '-';
            document.getElementById('blood-type').innerText = '-';
        });
}

function fetchUserPosts(userId) {
    fetch('/api/posts')
        .then(res => res.json())
        .then(allPosts => {
            const historyList = document.getElementById('user-history-list');
            const myPosts = allPosts.filter(p => p.user_id === parseInt(userId)).reverse();

            if (myPosts.length === 0) {
                historyList.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">ยังไม่มีประวัติการโพสต์</p>';
                return;
            }

            historyList.innerHTML = myPosts.map(p => {
                let sColor = p.status === 'approved' ? '#27ae60' : (p.status === 'rejected' ? '#e74c3c' : '#f39c12');
                let sText = p.status === 'approved' ? 'อนุมัติแล้ว' : (p.status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ');

                return `
                    <div class="post-card" style="border-left-color: ${sColor}">
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:#666;">
                            <span>${new Date(p.created_at).toLocaleString('th-TH')}</span>
                            <b style="color:${sColor}">${sText}</b>
                        </div>
                        <p style="margin-top:10px;">${p.content}</p>
                        ${p.image_data ? `<img src="${p.image_data}" style="max-width:150px; border-radius:5px; margin-top:5px;">` : ''}
                    </div>
                `;
            }).join('');
        })
        .catch(err => {
            console.error('Error fetching posts:', err);
            const historyList = document.getElementById('user-history-list');
            historyList.innerHTML = '<p style="color:#e74c3c; text-align:center;">เกิดข้อผิดพลาดในการโหลดประวัติการโพสต์</p>';
        });
}