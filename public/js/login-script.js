document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!email || !password) {
        alert('กรุณากรอกอีเมลและรหัสผ่าน');
        return;
    }

    if (!email.includes('@')) {
        alert('กรุณาใส่อีเมลที่ถูกต้อง');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('currentUser', data.user.full_name);
            localStorage.setItem('currentUserId', data.user.user_id);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('roleId', data.user.role_id || 2);
            if (Number(data.user.role_id) === 1) {
                window.location.href = "/admin.html";
            } else {
                alert("ยินดีต้อนรับคุณ " + data.user.full_name);
                window.location.href = "/index.html";
            }
        } else {
            alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
});