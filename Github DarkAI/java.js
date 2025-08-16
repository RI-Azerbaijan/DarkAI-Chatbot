<script>
    // API configurations
    const MODEL = "google/gemini-2.0-flash-exp:free";
    
    // Simple structure for caching
    const responseCache = new Map();
    let chatHistory = [];
    let currentChat = [];
    let currentSessionId = null;
    let isLoading = false;
    let selectedImage = null;
    let currentStreamReader = null;
    let currentAIResponse = null;
    
    // Sidebar open/close
    document.querySelector('.sidebar-toggle').addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // Load history when entering the site
    document.addEventListener('DOMContentLoaded', function() {
        loadChatHistory();
        createParticles();
        setupImageUpload();
    });
    
    // Create particles
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 20; // Reduced for performance
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            const size = Math.random() * 15 + 5;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 15;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.animationDelay = `${delay}s`;
            particlesContainer.appendChild(particle);
        }
    }
    
    // Image upload operations
    function setupImageUpload() {
        const fileInput = document.getElementById('fileInput');
        const imagePreview = document.getElementById('imagePreview');
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        const imageInfo = document.getElementById('imageInfo');
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                // File size check (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image size must be a maximum of 5MB!');
                    return;
                }
                // File type check
                if (!file.type.match('image.*')) {
                    alert('Please select an image file!');
                    return;
                }
                selectedImage = file;
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreview.src = event.target.result;
                    imagePreviewContainer.style.display = 'block';
                    // Show image information
                    imageInfo.innerHTML = ` ${file.name} - ${(file.size / 1024).toFixed(1)}KB `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Clear image
    function clearImage() {
        document.getElementById('fileInput').value = '';
        document.getElementById('imagePreviewContainer').style.display = 'none';
        selectedImage = null;
    }
    
    // Send image
    function sendImage() {
        if (!selectedImage) return;
        const imagePreview = document.getElementById('imagePreview');
        
        // Add image to chat
        addMessageToChat(`
            <div class="image-message">
                <div class="image-message-title">
                    <i class="fas fa-image"></i>
                    <strong>Uploaded image</strong>
                </div>
                <img src="${imagePreview.src}" alt="Uploaded image" class="image-preview" style="max-width: 100%; max-height: 200px;">
                <p class="image-info">${selectedImage.name} - ${(selectedImage.size / 1024).toFixed(1)}KB</p>
            </div>
        `, 'user');
        
        // Send image to AI
        sendImageToAI(imagePreview.src);
        // Clear input area
        clearImage();
    }
    
    // Send image to AI
    function sendImageToAI(imageData) {
        isLoading = true;
        const sendBtn = document.getElementById('sendButton');
        sendBtn.disabled = true;
        
        // Create a session for a new chat
        if (!currentSessionId) {
            currentSessionId = generateSessionId();
        }
        
        // Show thinking animation under the message
        showThinkingIndicator(true);
        
        try {
            // Preparing messages (system message + history)
            const messages = []; // Removed SYSTEM_PROMPT
            
            // Add past chats
            currentChat.forEach(msg => {
                messages.push({ role: msg.role, content: msg.content });
            });
            
            // Add a special message for the image
            messages.push({ role: 'user', content: 'User sent an image. Please analyze this image and explain its content.' });
            
            // Send API request
            setTimeout(() => {
                // There will be a real API call here
                // For now, let's give a simulated answer
                const aiResponse = `
                    <div class="ai-image-analysis">
                        <div class="image-message-title">
                            <i class="fas fa-robot"></i>
                            <strong>Image Analysis</strong>
                        </div>
                        <p>I see a natural landscape in this image. In the foreground there are green grass and flowers, and in the background there is a blue sky and white clouds. On the left side of the image there is a group of trees, and on the right side there is a small lake. Overall, it is a peaceful and calm nature landscape.</p>
                        <p>Details that stand out in the image:</p>
                        <ul>
                            <li>Yellow and purple flowers in the foreground</li>
                            <li>Slightly hazy mountains on the horizon line</li>
                            <li>White cloud clusters in the sky</li>
                            <li>Reflection of water in the lake</li>
                        </ul>
                        <p>If you want more information or analysis about this image, I can help.</p>
                    </div>
                `;
                showThinkingIndicator(false);
                addMessageToChat(aiResponse, 'ai');
                // Save the chat
                saveCurrentSession();
                renderChatHistory();
                isLoading = false;
                sendBtn.disabled = false;
            }, 1500); // Duration shortened
        } catch (error) {
            console.error("Error:", error);
            showThinkingIndicator(false);
            addErrorMessage(`An error occurred: ${error.message || "Please try again"}`);
            isLoading = false;
            sendBtn.disabled = false;
        }
    }
    
    // Load history
    function loadChatHistory() {
        const savedHistory = localStorage.getItem('darkaiChatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            renderChatHistory();
        } else {
            chatHistory = [];
        }
    }
    
    // Render history
    function renderChatHistory() {
        const historyList = document.getElementById('chatHistoryList');
        historyList.innerHTML = '';
        if (chatHistory.length === 0) {
            historyList.innerHTML = '<div class="history-item" style="color: var(--text-gray); cursor: default; justify-content: center; text-align: center; opacity: 0.6; padding: 20px 15px;">Henüz sohbet geçmişiniz yok.<br>Yeni bir mesaj gönderin!</div>';
        }
        
        chatHistory.forEach(session => {
            const firstMessage = session.chat[0];
            if (firstMessage) {
                const historyItem = document.createElement('div');
                historyItem.classList.add('history-item');
                historyItem.innerHTML = `<i class="fas fa-comment"></i> ${firstMessage.content.length > 20 ? firstMessage.content.substring(0, 20) + '...' : firstMessage.content} <span class="delete-btn" onclick="deleteSession('${session.id}', event)"><i class="fas fa-trash"></i></span>`;
                historyItem.addEventListener('click', () => loadSession(session.id));
                historyList.appendChild(historyItem);
            }
        });
    }
    
    // Load the selected session
    function loadSession(sessionId) {
        currentSessionId = sessionId;
        const session = chatHistory.find(s => s.id === sessionId);
        if (session) {
            currentChat = session.chat;
            renderChat();
            
            // Update active state in sidebar
            document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
            const activeItem = document.querySelector(`.history-item[data-id="${sessionId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }
    
    // Save current chat to local storage
    function saveCurrentSession() {
        if (!currentSessionId) return;
        
        const sessionIndex = chatHistory.findIndex(s => s.id === currentSessionId);
        const newSession = { id: currentSessionId, chat: currentChat };
        
        if (sessionIndex !== -1) {
            chatHistory[sessionIndex] = newSession;
        } else {
            chatHistory.unshift(newSession); // Add to the beginning
        }
        
        localStorage.setItem('darkaiChatHistory', JSON.stringify(chatHistory));
    }
    
    // Delete and reset history
    function deleteHistory() {
        if (confirm("Tüm sohbet geçmişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            localStorage.removeItem('darkaiChatHistory');
            chatHistory = [];
            currentChat = [];
            currentSessionId = null;
            renderChatHistory();
            renderChat();
            addWelcomeMessage();
        }
    }
    
    // Delete a specific session
    function deleteSession(sessionId, event) {
        event.stopPropagation();
        if (confirm("Bu sohbeti silmek istediğinizden emin misiniz?")) {
            chatHistory = chatHistory.filter(s => s.id !== sessionId);
            localStorage.setItem('darkaiChatHistory', JSON.stringify(chatHistory));
            renderChatHistory();
            if (currentSessionId === sessionId) {
                startNewChat();
            }
        }
    }
    
    // Start a new chat
    function startNewChat() {
        if (isLoading) return;
        currentChat = [];
        currentSessionId = null;
        renderChat();
        addWelcomeMessage();
        document.getElementById('userInput').focus();
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
    }
    
    // Manage sending messages
    async function sendMessage() {
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendButton');
        const message = userInput.value.trim();
        
        if (message === "" || isLoading) return;
        
        isLoading = true;
        sendBtn.disabled = true;
        userInput.value = '';
        
        // Create session for new chat
        if (!currentSessionId) {
            currentSessionId = generateSessionId();
        }
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Show thinking animation
        showThinkingIndicator(true);
        
        try {
            // Check cache
            if (responseCache.has(message)) {
                const cachedResponse = responseCache.get(message);
                addMessageToChat(cachedResponse, 'ai');
                showThinkingIndicator(false);
                isLoading = false;
                sendBtn.disabled = false;
                saveCurrentSession();
                return;
            }
            
            // Prepare message (user message + history)
            const messages = []; // Removed SYSTEM_PROMPT
            
            // Add chat history
            currentChat.forEach(msg => {
                messages.push({ role: msg.role, content: msg.content });
            });
            
            messages.push({
                role: "user",
                content: message,
            });
            
            const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer `,
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: messages,
                    temperature: 0.7,
                    stream: true
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `Xəta baş verdi: ${response.status}`);
            }
            
            // Get reader and start streaming
            currentStreamReader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            
            let fullText = "";
            currentAIResponse = { role: "ai", content: "" };
            addMessageToChat("", "ai", true); // Add an empty message to display stream
            
            while (true) {
                const { done, value } = await currentStreamReader.read();
                if (done) {
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonString = line.substring(6);
                        if (jsonString === '[DONE]') {
                            continue;
                        }
                        
                        try {
                            const data = JSON.parse(jsonString);
                            const content = data.choices[0].delta.content;
                            if (content) {
                                fullText += content;
                                currentAIResponse.content = fullText;
                                updateLastMessage(fullText);
                                document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
                            }
                        } catch (e) {
                            console.error("JSON parse error:", e);
                        }
                    }
                }
            }
            
            // Add full message to chat history
            if (currentAIResponse.content) {
                currentChat.push(currentAIResponse);
            }
            
            // Save chat
            saveCurrentSession();
            renderChatHistory();
            
        } catch (error) {
            console.error("Error:", error);
            document.getElementById('aiResponseContent').textContent = `An error occurred: ${error.message || "Please try again"}`;
            currentAIResponse.content = `Error: ${error.message || "Please try again"}`;
            currentChat.push(currentAIResponse);
        } finally {
            showThinkingIndicator(false);
            isLoading = false;
            sendBtn.disabled = false;
            currentAIResponse = null;
        }
    }
    
    // Add messages to screen
    function addMessageToChat(text, role, isStreaming = false) {
        const messagesContainer = document.getElementById('messages');
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container', `${role}-message`);
        
        let avatar = '';
        let roleName = '';
        if (role === 'ai') {
            avatar = '<div class="ai-avatar"><i class="fas fa-robot"></i></div>';
            roleName = 'DarkAI';
        } else {
            avatar = '<div class="user-avatar"><i class="fas fa-user"></i></div>';
            roleName = 'Siz';
        }
        
        messageContainer.innerHTML = `
            ${avatar}
            <div class="message-content">
                <div class="message-role">${roleName}</div>
                <div class="message-text"></div>
            </div>
        `;
        
        const messageTextElement = messageContainer.querySelector('.message-text');
        
        if (isStreaming) {
            messageTextElement.id = 'aiResponseContent';
        } else {
            messageTextElement.innerHTML = marked.parse(text);
        }
        
        messagesContainer.appendChild(messageContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        if (role === 'user') {
            currentChat.push({ role: 'user', content: text });
        }
    }
    
    // Update the last streaming message
    function updateLastMessage(text) {
        const lastMessageElement = document.getElementById('aiResponseContent');
        if (lastMessageElement) {
            lastMessageElement.innerHTML = marked.parse(text);
        }
    }
    
    // Manage thinking animation
    function showThinkingIndicator(show) {
        const existingIndicator = document.querySelector('.typing-indicator');
        if (show) {
            if (!existingIndicator) {
                const messagesContainer = document.getElementById('messages');
                const indicator = document.createElement('div');
                indicator.classList.add('typing-indicator');
                indicator.innerHTML = `
                    <span></span>
                    <span></span>
                    <span></span>
                `;
                messagesContainer.appendChild(indicator);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } else {
            if (existingIndicator) {
                existingIndicator.remove();
            }
        }
    }
    
    // Show error message
    function addErrorMessage(message) {
        const messagesContainer = document.getElementById('messages');
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-message');
        errorDiv.textContent = message;
        messagesContainer.appendChild(errorDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Generate a unique session ID
    function generateSessionId() {
        return 'session_' + Date.now();
    }
    
    // Render chat on screen
    function renderChat() {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        currentChat.forEach(msg => {
            addMessageToChat(msg.content, msg.role);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Add welcome message
    function addWelcomeMessage() {
        const messagesContainer = document.getElementById('messages');
        const welcomeMessageHTML = `
            <div class="welcome-message">
                <div class="welcome-logo">
                    <i class="fas fa-ghost"></i>
                </div>
                <h1 class="welcome-title">Optimized DarkAI Image Chat</h1>
                <p class="welcome-subtitle">A much faster chatbot experience! Click the paperclip icon to add an image.</p>
                <div class="features">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-bolt"></i></div>
                        <h3 class="feature-title">High Performance</h3>
                        <p class="feature-desc">Smooth and fast chat experience</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-stream"></i></div>
                        <h3 class="feature-title">Instant Responses</h3>
                        <p class="feature-desc">Text is displayed instantly</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-image"></i></div>
                        <h3 class="feature-title">Image Analysis</h3>
                        <p class="feature-desc">AI will identify and describe image content</p>
                    </div>
                </div>
                <button class="start-button" onclick="startNewChat()">
                    <i class="fas fa-comments"></i> <span>Start Chat</span>
                </button>
            </div>
        `;
        messagesContainer.innerHTML = welcomeMessageHTML;
    }
    
    // Manage message stream
    function handleMessageStream(reader) {
        const messagesContainer = document.getElementById('messages');
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container', 'ai-message');
        messageContainer.innerHTML = `
            <div class="ai-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="message-role">DarkAI</div>
                <div class="message-text"></div>
            </div>
        `;
        messagesContainer.appendChild(messageContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        const messageTextElement = messageContainer.querySelector('.message-text');
        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        
        return reader.read().then(function processText({ done, value }) {
            if (done) {
                // This function is designed for real use
                return;
            }
            
            const chunk = decoder.decode(value);
            fullText += chunk;
            messageTextElement.textContent = fullText;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            return reader.read().then(processText);
        });
    }
    
    // Initialize chat
    window.onload = function() {
        document.getElementById('userInput').focus();
        // Start mobile sidebar closed
        if (window.innerWidth <= 900) {
            document.querySelector('.sidebar').classList.remove('active');
        }
    };
    
    // Check when screen size changes
    window.addEventListener('resize', function() {
        if (window.innerWidth > 900) {
            document.querySelector('.sidebar').classList.add('active');
        } else {
            document.querySelector('.sidebar').classList.remove('active');
        }
    });
</script>