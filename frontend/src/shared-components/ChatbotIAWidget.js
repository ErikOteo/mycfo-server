import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Fab, CircularProgress, useTheme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useChatbotContext } from './ChatbotContext';
import API_CONFIG from '../config/api-config';

// Asegúrate de configurar la URL correcta de tu backend de IA
//const IA_API_URL = 'http://localhost:8083/api/chat';
//const IA_API_URL = `${process.env.REACT_APP_URL_IA}/chat`;
const IA_API_URL = `${process.env.REACT_APP_API_URL}/ia/chat`;

const ChatbotWidget = ({ currentModule = 'general' }) => {
    const theme = useTheme();
    const { context } = useChatbotContext();
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
                    module: currentModule,
                    context: context || null
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

    const palette = theme.vars?.palette ?? theme.palette;

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
                    sx={(theme) => ({
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
                        bgcolor: (theme.vars || theme).palette.background.paper,
                        border: `1px solid ${(theme.vars || theme).palette.divider}`,
                        color: (theme.vars || theme).palette.text.primary,
                    })}
                >
                    {/* Header */}
                    <Box sx={(theme) => ({
                        p: 2,
                        bgcolor: (theme.vars || theme).palette.primary.main,
                        color: (theme.vars || theme).palette.primary.contrastText,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: 1
                    })}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToyIcon />
                            <Typography variant="subtitle1" fontWeight="bold">Asistente MyCFO</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'inherit' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Área de mensajes */}
                    <Box sx={(theme) => ({
                        flex: 1,
                        p: 2,
                        overflowY: 'auto',
                        bgcolor: (theme.vars || theme).palette.background.default,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                    })}>
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={(theme) => ({
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    bgcolor: msg.sender === 'user'
                                        ? (theme.vars || theme).palette.primary.main
                                        : (theme.vars || theme).palette.background.paper,
                                    color: msg.sender === 'user'
                                        ? (theme.vars || theme).palette.primary.contrastText
                                        : (theme.vars || theme).palette.text.primary,
                                    p: 1.5,
                                    borderRadius: 2,
                                    boxShadow: 2,
                                    borderTopLeftRadius: msg.sender === 'bot' ? 0 : 2,
                                    borderTopRightRadius: msg.sender === 'user' ? 0 : 2,
                                    border: `1px solid ${(theme.vars || theme).palette.divider}`
                                })}
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
                    <Box sx={(theme) => ({
                        p: 2,
                        bgcolor: (theme.vars || theme).palette.background.paper,
                        borderTop: `1px solid ${(theme.vars || theme).palette.divider}`,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center'
                    })}>
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
                                    bgcolor: palette.background.default,
                                    color: palette.text.primary,
                                    '& fieldset': {
                                        borderColor: palette.divider,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: palette.text.secondary,
                                    },
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: palette.text.secondary,
                                    opacity: 1,
                                },
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            sx={(theme) => ({
                                bgcolor: (theme.vars || theme).palette.primary.dark,
                                color: (theme.vars || theme).palette.primary.contrastText,
                                '&:hover': {
                                    bgcolor: (theme.vars || theme).palette.primary.main,
                                },
                                '&.Mui-disabled': {
                                    bgcolor: (theme.vars || theme).palette.primary.dark,
                                    color: (theme.vars || theme).palette.primary.contrastText,
                                    opacity: 0.6,
                                },
                            })}
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
