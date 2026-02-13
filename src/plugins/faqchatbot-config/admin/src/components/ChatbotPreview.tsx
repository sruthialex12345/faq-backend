import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Typography, Flex, Button, TextInput } from '@strapi/design-system';
import { Message, Cross, PaperPlane, ArrowClockwise, ChevronDown } from '@strapi/icons';

const ChatWindowWrapper = styled(Box)<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 380px;
  height: 500px;
  z-index: 1000;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  transform-origin: bottom right;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${({ $isOpen }) => ($isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)')};
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
`;

const FloatingButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.primary600};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};
  transition: transform 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary700};
    transform: scale(1.05);
  }
`;

const ChatbotPreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Hello! You can test the chatbot preview here.", isUser: false }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { text: chatInput, isUser: true }]);
    setChatInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Preview mode active.", isUser: false }]);
    }, 800);
  };

  const handleClearHistory = () => {
    setMessages([{ text: "Hello! You can test the chatbot preview here.", isUser: false }]);
  };

  return (
    <>
      {/* TRIGGER BUTTON: Now shows ChevronDown when open */}
      <FloatingButton onClick={() => setIsOpen(!isOpen)} title="Toggle Chatbot Preview">
        {isOpen ? <ChevronDown width={24} height={24} /> : <Message width={28} height={28} />}
      </FloatingButton>

      <ChatWindowWrapper $isOpen={isOpen} background="neutral0" hasRadius>
        <Flex direction="column" alignItems="stretch" style={{ height: '100%' }}>
          {/* Header */}
          <Box padding={4} background="primary600">
            <Flex justifyContent="space-between" alignItems="center">
              <Flex gap={2}>
                <Message color="neutral0" width={18} />
                <Typography fontWeight="bold" textColor="neutral0">Chatbot Preview</Typography>
                <Box as="button" onClick={handleClearHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Clear History">
                  <ArrowClockwise color="neutral0" width={14} />
                </Box>
              </Flex>

              {/* NEW: Close button in top right of header */}
              <Box as="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Close Chat">
                <Cross color="neutral0" width={14} />
              </Box>
            </Flex>
          </Box>

          {/* Messages */}
          <Box ref={scrollRef} padding={4} background="neutral100" style={{ flex: 1, overflowY: 'auto' }}>
            <Flex direction="column" alignItems="stretch" gap={3}>
              {messages.map((msg, idx) => (
                <Box key={idx} padding={3} hasRadius background={msg.isUser ? "primary600" : "neutral0"} shadow="filterShadow" style={{ alignSelf: msg.isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <Typography textColor={msg.isUser ? "neutral0" : "neutral800"}>{msg.text}</Typography>
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Input */}
          <Box padding={3} background="neutral0" style={{ borderTop: '1px solid #f0f0f5' }}>
            <Flex gap={2} alignItems="center">
              <Box style={{ flexGrow: 1 }}>
                <TextInput placeholder="Type a message..." value={chatInput} onChange={(e: any) => setChatInput(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleSendMessage()} />
              </Box>
              <Button onClick={handleSendMessage} style={{ height: '40px' }} startIcon={<PaperPlane />}>Send</Button>
            </Flex>
          </Box>
        </Flex>
      </ChatWindowWrapper>
    </>
  );
};

export default ChatbotPreview;
