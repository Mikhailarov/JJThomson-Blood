function renderFaqs() {
    const form = document.getElementById('faqForm');
    const container = document.getElementById('faq-dynamic-list');
    if (!container || !form) return;

    container.innerHTML = '<p style="text-align:center;">กำลังโหลด...</p>';

    fetch('/api/faqs')
        .then(res => res.json())
        .then(faqs => {
            const shown = faqs.filter(f => f.status && f.status.toString().toLowerCase() !== 'pending');
            if (shown.length === 0) {
                container.innerHTML = '<p style="color:#888; text-align:center; margin-top:20px;">ยังไม่มี FAQ ที่ตอบแล้ว</p>';
                return;
            }

            const faqHtml = shown.map(f => `
                <div class="faq-item dynamic-faq" style="margin-top: 15px;">
                    <button class="quest">${f.question} ▾</button>
                    <div class="ans">
                        <div class="ans-content" style="padding: 20px; line-height: 1.8; color: #555; border-top: 1px solid #eee;">
                            ${f.answer || ''}
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = faqHtml;
            initAccordion();
        })
        .catch(err => {
            container.innerHTML = '<p style="color:#e74c3c; text-align:center;">เกิดข้อผิดพลาด</p>';
            console.error(err);
        });
}

function initAccordion() {
    document.querySelectorAll('.quest').forEach(button => {
        button.onclick = function() {
            const ans = this.nextElementSibling;
            this.classList.toggle('active');
            ans.style.maxHeight = this.classList.contains('active') ? ans.scrollHeight + "px" : 0;
            
            document.querySelectorAll('.quest').forEach(other => {
                if (other !== this) {
                    other.classList.remove('active');
                    other.nextElementSibling.style.maxHeight = 0;
                }
            });
        };
    });
}

document.getElementById('faqForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const questionText = document.getElementById('userQuestion').value;
    if (!questionText.trim()) return;

    const currentUserId = localStorage.getItem('currentUserId') || null;

    fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, question: questionText, answer: '', status: 'pending' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('ส่งคำถามเรียบร้อยแล้ว แอดมินจะตอบกลับโดยเร็วที่สุด');
            document.getElementById('faqForm').reset();
            renderFaqs();
        } else {
            alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถส่งคำถามได้'));
        }
    })
    .catch(err => { alert('เกิดข้อผิดพลาด'); console.error(err); });
});

window.onload = renderFaqs;