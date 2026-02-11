let currentSection = 'pending'; 
window.addEventListener('load', () => {
    const roleId = localStorage.getItem('roleId');
    if (!roleId || Number(roleId) !== 1) {
        alert('เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้');
        window.location.href = '/';
        return;
    }
    showSection('pending');
}); 

function showSection(section) {
    currentSection = section;
    document.getElementById('manage-section').style.display = 'none';
    document.getElementById('create-section').style.display = 'none';
    
    const faqSec = document.getElementById('faq-section');
    if(faqSec) faqSec.style.display = 'none';
    const reportSec = document.getElementById('site-report-section');
    if(reportSec) reportSec.style.display = 'none';

    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    const menuId = section === 'siteReport' ? 'menu-site-report' : 'menu-' + section;
    const activeMenu = document.getElementById(menuId);
    if(activeMenu) activeMenu.classList.add('active');

    if (section === 'create') {
        document.getElementById('create-section').style.display = 'block';
    } 
    else if (section === 'faq') {
        if(faqSec) faqSec.style.display = 'block';
        loadFaqListAdmin();     
        loadUserQuestions();   
    } 
    else if (section === 'siteReport') {
        if(reportSec) {
            reportSec.style.display = 'block'; 
            loadSiteReports(); 
        }
    }
    else {
        document.getElementById('manage-section').style.display = 'block';
        renderPosts(section);
        document.getElementById('section-title').innerText = 
            section === 'pending' ? 'จัดการโพสต์: รออนุมัติ' : 'จัดการโพสต์: อนุมัติแล้ว';
    }
}

async function renderPosts(filterStatus) {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '<p style="text-align:center;">กำลังโหลด...</p>';
    try {
        const response = await fetch('/api/posts');
        const allPosts = await response.json();
        postList.innerHTML = '';
        const filtered = allPosts.filter(p => p.status === filterStatus).reverse();

        if (filtered.length === 0) {
            postList.innerHTML = '<p style="color:#888; text-align:center; margin-top:50px;">ไม่มีรายการในขณะนี้</p>';
            return;
        }

        filtered.forEach(p => {
            postList.innerHTML += `
                <div class="manage-card">
                    <div style="display:flex; justify-content:space-between;">
                        <strong><i class="fas fa-user"></i> ผู้โพสต์: ${p.full_name || 'Unknown'}</strong>
                        <small>${new Date(p.created_at).toLocaleString('th-TH')}</small>
                    </div>
                    <p style="margin: 15px 0;">${p.content}</p>
                    ${p.image_data ? `<img src="${p.image_data}" style="max-width:200px; border-radius:8px; display:block; margin-bottom:10px;">` : ''}
                    <div class="action-btns">
                        ${p.status === 'pending' ? `
                            <button class="btn-approve" onclick="updateStatus(${p.post_id}, 'approved')">อนุมัติ</button>
                            <button class="btn-reject" onclick="updateStatus(${p.post_id}, 'rejected')">ไม่อนุมัติ</button>
                        ` : ''}
                        <button class="btn-delete" onclick="deletePost(${p.post_id})"><i class="fas fa-trash"></i> ลบโพสต์นี้</button>
                    </div>
                </div>`;
        });
    } catch (error) {
        postList.innerHTML = '<p style="color:#e74c3c; text-align:center;">เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
    }
}

async function updateStatus(postId, newStatus) {
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            renderPosts(currentSection);
        } else {
            alert("เกิดข้อผิดพลาดในการอัปเดต");
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
}

async function deletePost(postId) {
    if (confirm("ยืนยันการลบโพสต์นี้ถาวร?")) {
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                renderPosts(currentSection);
            } else {
                alert("เกิดข้อผิดพลาดในการลบ");
            }
        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    }
}

window.addEventListener('load', () => {
    const roleId = localStorage.getItem('roleId');
    if (!roleId || Number(roleId) !== 1) {
        alert('เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้');
        window.location.href = '/';
        return;
    }
    showSection('pending');
});

document.getElementById('adminPostForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const text = document.getElementById('adminMsg').value;
    const file = document.getElementById('adminFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => saveAdminPost(text, reader.result);
        reader.readAsDataURL(file);
    } else {
        saveAdminPost(text, null);
    }
});

function saveAdminPost(text, imgData) {
    const currentUserId = localStorage.getItem('currentUserId') || null;
    
    fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: currentUserId, 
            content: text, 
            image_data: imgData, 
            status: 'approved' 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("โพสต์เรียบร้อย!");
            document.getElementById('adminPostForm').reset();
            document.getElementById('adminFileName').innerText = "ยังไม่ได้เลือกไฟล์";
            renderPosts('approved');
        } else {
            alert("เกิดข้อผิดพลาด: " + (data.message || 'ไม่สามารถโพสต์ได้'));
        }
    })
    .catch(err => {
        alert("เกิดข้อผิดพลาด");
        console.error(err);
    });
}

let currentEditingFaqId = null;

document.getElementById('faqAdminForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const q = document.getElementById('faqQuest').value;
    const a = document.getElementById('faqAns').value;
    const currentUserId = localStorage.getItem('currentUserId') || null;

    if (currentEditingFaqId) {
        fetch(`/api/faqs/${currentEditingFaqId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: a, status: 'approved' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('ตอบคำถามแล้ว!');
                document.getElementById('faqAdminForm').reset();
                currentEditingFaqId = null;
                loadFaqListAdmin();
                loadUserQuestions();
            } else {
                alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถบันทึกได้'));
            }
        })
        .catch(err => {
            alert('เกิดข้อผิดพลาด');
            console.error(err);
        });
    } else {
        fetch('/api/faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, question: q, answer: a, status: 'approved' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('บันทึก FAQ ลงหน้าเว็บสำเร็จ!');
                document.getElementById('faqAdminForm').reset();
                loadFaqListAdmin();
            } else {
                alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถบันทึกได้'));
            }
        })
        .catch(err => {
            alert('เกิดข้อผิดพลาด');
            console.error(err);
        });
    }
});

function loadFaqListAdmin() {
    const container = document.getElementById('faq-list-admin');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;">กำลังโหลด...</p>';

    fetch('/api/faqs')
        .then(res => res.json())
        .then(faqs => {
            container.innerHTML = '';
            container.innerHTML = faqs.map(f => `
                <div class="manage-card" style="border-left: 5px solid #27ae60;">
                    <strong>Q: ${f.question}</strong>
                    <p style="color:#555; margin:10px 0;">A: ${f.answer || ''}</p>
                    <div class="action-btns">
                        <button class="btn-approve" onclick="copyFaqToForm('${f.question.replace(/'/g, "\\'")}', ${f.faq_id})"><i class="fas fa-edit"></i> ตอบคำถามนี้</button>
                        <button class="btn-delete" onclick="deleteFaq(${f.faq_id})"><i class="fas fa-trash"></i> ลบ</button>
                    </div>
                </div>`).join('');
        })
        .catch(err => {
            container.innerHTML = '<p style="color:#e74c3c;">เกิดข้อผิดพลาด</p>';
            console.error(err);
        });
}

function copyFaqToForm(question, faqId) {
    currentEditingFaqId = faqId;
    document.getElementById('faqQuest').value = question;
    document.getElementById('faqAns').value = '';
    document.getElementById('faqAns').focus();
    alert('คัดลอกคำถามไปแล้ว กรุณาเขียนคำตอบและกดบันทึก');
}

function deleteFaq(faqId) {
    if (!confirm('คุณต้องการลบคำถามนี้ใช่หรือไม่?')) return;
    
    fetch(`/api/faqs/${faqId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('ลบคำถามสำเร็จ');
            loadFaqListAdmin();
        } else {
            alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถลบได้'));
        }
    })
    .catch(err => {
        alert('เกิดข้อผิดพลาด');
        console.error(err);
    });
}

function loadSiteReports() {
    const reportList = document.getElementById('site-report-list-admin');
    if (!reportList) return;
    reportList.innerHTML = '<p style="text-align:center;">กำลังโหลด...</p>';
    
    fetch('/api/reports')
        .then(res => res.json())
        .then(reports => {
            reportList.innerHTML = '';
            if (reports.length === 0) {
                reportList.innerHTML = '<p style="text-align:center; padding:20px;">ไม่มีรายการแจ้งปัญหา</p>';
                return;
            }
            reports.reverse().forEach(report => {
                reportList.innerHTML += `
                    <div class="manage-card" style="border-left: 5px solid #d32f2f;">
                        <strong>หัวข้อ: ${report.issue_type}</strong>
                        <p>รายละเอียด: ${report.detail}</p>
                        <small>จาก: ${report.full_name || 'Anonymous'}</small>
                        <small style="display:block; margin-top:5px;">เวลา: ${new Date(report.created_at).toLocaleString('th-TH')}</small>
                    </div>`;
            });
        })
        .catch(err => {
            reportList.innerHTML = '<p style="color:#e74c3c; text-align:center;">เกิดข้อผิดพลาดในการดึงข้อมูล</p>';
            console.error(err);
        });
}

function loadUserQuestions() {
    const container = document.getElementById('user-questions-list');
    if(!container) return;
    const questions = JSON.parse(localStorage.getItem('userQuestions')) || [];

    if (questions.length === 0) {
        container.innerHTML = '<p style="color:#888; text-align:center;">ไม่มีคำถามใหม่จากผู้ใช้งาน</p>';
        return;
    }

    container.innerHTML = questions.map((q, index) => `
        <div class="manage-card" style="background:#fff9f4; border-left: 5px solid #e67e22; margin-bottom: 10px;">
            <div style="display:flex; justify-content:space-between;">
                <strong><i class="fas fa-comment-dots"></i> คำถามใหม่จาก User</strong>
                <small>${q.time || ''}</small>
            </div>
            <p style="margin:10px 0;">${q.text}</p>
            <div class="action-btns">
                <button class="btn-approve" onclick="copyToFaqForm(${index})">นำไปสร้างคำตอบ</button>
                <button class="btn-delete" onclick="deleteUserQ(${index})">ลบคำถามทิ้ง</button>
            </div>
        </div>
    `).join('');
}

function copyToFaqForm(index) {
    let questions = JSON.parse(localStorage.getItem('userQuestions'));
    document.getElementById('faqQuest').value = questions[index].text;
    document.getElementById('faqAns').focus();
    alert('คัดลอกคำถามไปแล้ว กรุณาเขียนคำตอบและกดบันทึก');
}

function deleteUserQ(index) {
    if(confirm('ลบคำถามจากผู้ใช้รายนี้?')) {
        let questions = JSON.parse(localStorage.getItem('userQuestions'));
        questions.splice(index, 1);
        localStorage.setItem('userQuestions', JSON.stringify(questions));
        loadUserQuestions();
    }
}

function updateFileName(input) {
    const fileNameDisplay = document.getElementById('adminFileName');
    if (input.files && input.files.length > 0) {
        fileNameDisplay.innerText = input.files[0].name;
    } else {
        fileNameDisplay.innerText = "ยังไม่ได้เลือกไฟล์";
    }
}