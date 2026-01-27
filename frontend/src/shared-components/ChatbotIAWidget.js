import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Fab, CircularProgress, useTheme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// Asegúrate de configurar la URL correcta de tu backend de IA
const IA_API_URL = 'http://localhost:8083/api/chat';

const ChatbotWidget = ({ currentModule = 'general' }) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hola, soy tu asistente virtual. ¿En qué puedo ayudarte con este módulo?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(IA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.text,
                    module: currentModule
                }),
            });

            if (!response.ok) throw new Error('Error en la comunicación');

            const data = await response.json();
            const botMessage = { sender: 'bot', text: data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Lo siento, tuve un problema al procesar tu consulta.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Definición de colores según el modo
    const isDarkMode = theme.palette.mode === 'dark';

    const botBubbleColor = isDarkMode ? theme.palette.grey[800] : '#ffffff';
    const botTextColor = theme.palette.text.primary; // Blanco en dark, Negro en light

    const userBubbleColor = theme.palette.primary.main;
    const userTextColor = theme.palette.primary.contrastText;

    const chatBackgroundColor = isDarkMode ? theme.palette.grey[900] : '#f5f5f5';
    const inputAreaColor = isDarkMode ? theme.palette.grey[800] : '#ffffff';

    return (
        <>
            {/* Botón flotante */}
            {!isOpen && (
                <Fab
                    color="primary"
                    aria-label="chat"
                    onClick={() => setIsOpen(true)}
                    sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
                >
                    <ChatIcon />
                </Fab>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <Paper
                    elevation={12}
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        width: 350,
                        height: 500,
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1000,
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        border: isDarkMode ? `1px solid ${theme.palette.grey[700]}` : 'none'
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: 1
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToyIcon />
                            <Typography variant="subtitle1" fontWeight="bold">Asistente MyCFO</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'inherit' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Área de mensajes */}
                    <Box sx={{
                        flex: 1,
                        p: 2,
                        overflowY: 'auto',
                        bgcolor: chatBackgroundColor,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                    }}>
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    bgcolor: msg.sender === 'user' ? userBubbleColor : botBubbleColor,
                                    color: msg.sender === 'user' ? userTextColor : botTextColor,
                                    p: 1.5,
                                    borderRadius: 2,
                                    boxShadow: 1,
                                    borderTopLeftRadius: msg.sender === 'bot' ? 0 : 2,
                                    borderTopRightRadius: msg.sender === 'user' ? 0 : 2,
                                }}
                            >
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                    {msg.text}
                                </Typography>
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ alignSelf: 'flex-start', p: 1 }}>
                                <CircularProgress size={20} />
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{
                        p: 2,
                        bgcolor: inputAreaColor,
                        borderTop: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center'
                    }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Escribe tu duda..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: isDarkMode ? theme.palette.background.default : 'white',
                                    color: theme.palette.text.primary
                                }
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            sx={{
                                bgcolor: isDarkMode ? theme.palette.action.hover : 'transparent',
                                '&:hover': { bgcolor: isDarkMode ? theme.palette.action.selected : 'action.hover' }
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </>
    );
};

export default ChatbotWidget;