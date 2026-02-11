document.getElementById('regForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value.trim();
    const full_name = document.getElementById('regName').value.trim();
    const id_card = document.getElementById('regIdCard').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const gender = document.getElementById('regGender').value;
    const blood_type = document.getElementById('regBlood').value;

    if (!email || !password || !full_name || !id_card || !phone || !gender || !blood_type) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    if (!email.includes('@')) {
        alert('กรุณาใส่อีเมลที่ถูกต้อง');
        return;
    }

    if (password.length < 6) {
        alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
    }

    if (id_card.length !== 13 || !/^\d+$/.test(id_card)) {
        alert('เลขบัตรประชาชนต้องเป็น 13 หลักตัวเลข');
        return;
    }

    if (!/^\d{10}$/.test(phone.replace('-', '').replace(' ', ''))) {
        alert('เบอร์โทรศัพท์ไม่ถูกต้อง');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                full_name,
                id_card,
                phone,
                gender,
                blood_type,
                role_id: 2
            })
        });

        const data = await response.json();

        if (data.success) {
            alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
            window.location.href = "/login.html";
        } else {
            alert("เกิดข้อผิดพลาด: " + (data.message || "ไม่สามารถสมัครสมาชิกได้"));
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
    }
});