
// 重新生成消息
window.regenerateChatMsg = function (index) {
    if (index < 0 || index >= chatConversation.length) return;

    // 确保是 AI 消息
    const msg = chatConversation[index];
    if (msg.role !== 'model') return;

    // 获取上一条用户消息
    const prevMsg = chatConversation[index - 1];
    if (!prevMsg || prevMsg.role !== 'user') return;

    // 删除这条 AI 消息
    chatConversation.splice(index, 1);
    refreshChatDisplay();

    // 重新发送上一条用户的消息
    if (chatInput) {
        chatInput.value = prevMsg.content;
        // 如果有图片，也需要恢复（这里简化处理，暂不支持图片重新生成，除非重构 sendChatMessage 接受参数）
        // 触发发送
        sendChatMessage();
    }
};

// 删除消息
window.deleteChatMsg = function (index) {
    if (confirm('确定要删除这条消息吗？')) {
        chatConversation.splice(index, 1);
        refreshChatDisplay();
        saveChatToStorage();
    }
};
