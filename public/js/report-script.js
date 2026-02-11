document.getElementById('reportForm').onsubmit = (e) => {
    e.preventDefault();

    const type = document.getElementById('type').value;
    const detail = document.getElementById('detail').value;

    if(!type) {
        alert("กรุณาเลือกหัวข้อปัญหา");
        return;
    }

    const currentUserId = localStorage.getItem('currentUserId') || null;

    fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, issue_type: type, detail: detail })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('ได้รับแจ้งปัญหาแล้ว แอดมินจะรีบตรวจสอบครับ');
            e.target.reset();
        } else {
            alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถส่งได้'));
        }
    })
    .catch(err => { alert('เกิดข้อผิดพลาด'); });
};

 