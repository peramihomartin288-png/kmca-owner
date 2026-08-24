// ============================================
// KMCA OWNER - QUESTIONS MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadQuestions();
    setupEvents(owner);
});

// ========== LOAD QUESTIONS ==========
async function loadQuestions() {
    try {
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*')
            .order('tarehe_send', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('questionsList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna maswali bado</p>';
            return;
        }
        
        for (const question of data) {
            const { count: answersCount } = await supabaseClient
                .from('question_answers')
                .select('*', { count: 'exact', head: true })
                .eq('question_id', question.id);
            
            const item = document.createElement('div');
            item.style.cssText = 'padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
                '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + question.swali + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + 
                'Send: ' + formatDate(question.tarehe_send) + ' | Futa: ' + formatDate(question.tarehe_delete) + ' | Majibu: ' + (answersCount || 0) + 
                '</p>' +
                '</div>' +
                '<div style="display: flex; gap: 5px;">' +
                '<button type="button" class="btn-view-answers" data-question-id="' + question.id + '" style="background: #2563eb; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-eye"></i></button>' +
                '<button type="button" class="btn-delete-question" data-question-id="' + question.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                '</div>' +
                '</div>';
            
            list.appendChild(item);
        }
        
        // View answers
        document.querySelectorAll('.btn-view-answers').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                const questionId = this.getAttribute('data-question-id');
                
                const { data: answers } = await supabaseClient
                    .from('question_answers')
                    .select('*, users(jina)')
                    .eq('question_id', questionId)
                    .order('created_at', { ascending: true });
                
                if (answers && answers.length > 0) {
                    let answersText = 'MAJIBU:\n\n';
                    answers.forEach(function(answer) {
                        answersText += (answer.users ? answer.users.jina : 'Unknown') + ': ' + answer.answer + '\n\n';
                    });
                    alert(answersText);
                } else {
                    alert('Hakuna majibu bado');
                }
            });
        });
        
        // Delete
        document.querySelectorAll('.btn-delete-question').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa swali hili?')) {
                    await supabaseClient.from('questions').delete().eq('id', this.getAttribute('data-question-id'));
                    loadQuestions();
                }
            });
        });
    } catch (e) {
        document.getElementById('questionsList').innerHTML = '<p class="no-data">Imeshindikana kupakia maswali</p>';
    }
}

// ========== SETUP EVENTS ==========
function setupEvents(owner) {
    document.getElementById('menuToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logoutOwner();
    });
    
    document.getElementById('addQuestionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const swali = document.getElementById('questionText').value.trim();
        const tareheSend = document.getElementById('questionSendDate').value;
        const tareheDelete = document.getElementById('questionDeleteDate').value;
        
        if (!swali || !tareheSend || !tareheDelete) {
            alert('Jaza vipengele vyote');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatuma...';
        
        try {
            await supabaseClient.from('questions').insert([{
                owner_id: owner.id,
                swali: swali,
                tarehe_send: tareheSend,
                tarehe_delete: tareheDelete
            }]);
            
            // Send notification to users
            const { data: users } = await supabaseClient.from('users').select('id');
            
            for (const user of users) {
                await supabaseClient.from('notifications').insert([{
                    title: 'Swali Jipya kutoka kwa Kwaya',
                    content: swali,
                    type: 'question',
                    is_read: false
                }]);
            }
            
            alert('Swali limetumwa kwa users wote!');
            document.getElementById('addQuestionForm').reset();
            loadQuestions();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Swali';
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'questions') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'questions') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}