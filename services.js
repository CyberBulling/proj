// ========== ФУНКЦИИ ДЛЯ СТРАНИЦЫ SERVICES.HTML ==========

let messageInput, chatMessages, sendButton;

// Отправка сообщения в чат
async function sendMessage() {
    if (!messageInput || !chatMessages) {
        messageInput = document.getElementById('messageInput');
        chatMessages = document.getElementById('chatMessages');
        if (!messageInput || !chatMessages) return;
    }

    const message = messageInput.value.trim();
    if (message === '') return;

    if (sendButton) {
        sendButton.style.transform = 'scale(0.9)';
        setTimeout(() => { if (sendButton) sendButton.style.transform = ''; }, 200);
    }

    addMessage(message, 'user');
    messageInput.value = '';

    // Показываем индикатор загрузки
    const loadingId = addLoadingMessage();

    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: message,
                top_n: 5   // количество фрагментов для контекста
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const answer = data.answer || 'Не удалось получить ответ.';

        removeLoadingMessage(loadingId);
        addMessage(answer, 'bot');
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        removeLoadingMessage(loadingId);
        let errorMsg = 'Произошла ошибка при обращении к помощнику. ';
        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Проверьте, запущен ли Python‑сервер (команда: uvicorn api:app --host 0.0.0.0 --port 8000).';
        } else {
            errorMsg += error.message;
        }
        addMessage(errorMsg, 'bot error');
    }
}

// Добавление сообщения в чат
function addMessage(text, sender) {
    if (!chatMessages) {
        chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;

    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    messageElement.innerHTML = `
        <div>${escapeHtml(text)}</div>
        <div class="message-time">${time}</div>
    `;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

// Добавление сообщения-загрузки
function addLoadingMessage() {
    if (!chatMessages) return null;
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot loading';
    loadingDiv.id = 'loading-' + Date.now();
    loadingDiv.innerHTML = '<div>Мими думает...</div><div class="message-time">...</div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    return loadingDiv.id;
}

// Удаление сообщения-загрузки
function removeLoadingMessage(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) loadingDiv.remove();
}

// Быстрые действия в чате
function quickAction(action) {
    if (!messageInput) {
        messageInput = document.getElementById('messageInput');
        if (!messageInput) return;
    }

    let message = '';
    switch(action) {
        case 'report':
            message = 'Создать отчет по городской инфраструктуре за последний квартал';
            break;
        case 'analyze':
            message = 'Проанализировать данные о транспортной доступности в центральном округе';
            break;
        case 'help':
            message = 'Какие возможности у помощника МИМИ?';
            break;
    }

    messageInput.value = message;
    messageInput.focus();
    sendMessage(); // автоматически отправляем сообщение
}

// Простейшая защита от XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}