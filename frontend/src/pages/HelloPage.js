import React, { useState, useEffect, useRef } from 'react';
import {
    AppBar, Toolbar, Button, Container, Typography, Box, Grid,
    Card, CardContent, Switch, IconButton, Drawer, List, ListItem,
    ListItemText, useMediaQuery, useTheme, Avatar, Chip
} from '@mui/material';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import { getDesignTokens } from '../shared-theme/themePrimitives';
import { inputsCustomizations } from '../shared-theme/customizations/inputs';
import { dataDisplayCustomizations } from '../shared-theme/customizations/dataDisplay';
import { feedbackCustomizations } from '../shared-theme/customizations/feedback';
import { navigationCustomizations } from '../shared-theme/customizations/navigation';
import { surfacesCustomizations } from '../shared-theme/customizations/surfaces';
import MenuIcon from '@mui/icons-material/Menu';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import HubIcon from '@mui/icons-material/Hub';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EmailIcon from '@mui/icons-material/Email';
import InstagramIcon from '@mui/icons-material/Instagram';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../shared-components/Logo';

// --- CONFIG & STYLES ---
const COLORS = {
    primary: '#008375',
    primaryDark: '#04564c',
    background: '#FAFAFA',
    white: '#FFFFFF',
    accentLight: '#e6f3f1',
    textPrimary: '#1A1C1E',
    textSecondary: '#5A5C5E',
    footerDark: '#033832',
};

const TRANSITION = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
const SHADOWS = {
    sutil: '0 4px 20px rgba(0, 0, 0, 0.06)',
    media: '0 12px 32px rgba(0, 131, 117, 0.12)',
    pronunciada: '0 30px 80px rgba(0, 131, 117, 0.25)',
};

const keyframes = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
    @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
`;

// --- COMPONENTS ---

const FeatureCard = ({ icon, title, desc, index }) => (
    <Box
        sx={{
            p: 4,
            bgcolor: index % 2 === 0 ? COLORS.background : COLORS.white,
            borderRadius: 4,
            border: '1px solid transparent',
            transition: TRANSITION,
            height: '100%',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: SHADOWS.media,
                borderColor: alpha(COLORS.primary, 0.2),
            }
        }}
    >
        <Avatar sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, width: 56, height: 56, mb: 2, borderRadius: 3 }}>
            {icon}
        </Avatar>
        <Typography variant="h6" fontWeight="700" gutterBottom color={COLORS.textPrimary}>
            {title}
        </Typography>
        <Typography variant="body1" color={COLORS.textSecondary} sx={{ lineHeight: 1.7 }}>
            {desc}
        </Typography>
    </Box>
);

const PricingCard = ({ title, price, features, recommended, isAnnual }) => {
    const displayPrice = isAnnual ? (price * 10).toFixed(0) : price;
    const period = isAnnual ? '/año' : '/mes';

    return (
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                borderRadius: 4,
                transition: TRANSITION,
                bgcolor: COLORS.primaryDark,
                color: COLORS.white,
                border: recommended ? `2px solid ${COLORS.accentLight}` : '1px solid rgba(255,255,255,0.1)',
                transform: recommended ? 'scale(1.05)' : 'scale(1)',
                boxShadow: recommended ? SHADOWS.media : SHADOWS.sutil,
                overflow: 'visible',
                '&:hover': {
                    transform: recommended ? 'scale(1.08)' : 'scale(1.03)',
                    boxShadow: SHADOWS.pronunciada,
                }
            }}
        >
            {recommended && (
                <Chip
                    label="Recomendado"
                    sx={{
                        position: 'absolute',
                        top: -16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: COLORS.accentLight,
                        color: COLORS.primaryDark,
                        fontWeight: 'bold',
                    }}
                />
            )}
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" sx={{ color: alpha(COLORS.white, 0.7) }} gutterBottom fontWeight="600" align="center">
                    {title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 3 }}>
                    <Typography variant="h3" fontWeight="800" color={COLORS.white}>
                        ${displayPrice}
                    </Typography>
                    <Typography variant="h6" sx={{ color: alpha(COLORS.white, 0.7), ml: 1 }}>
                        {period}
                    </Typography>
                </Box>
                <List sx={{ mb: 'auto' }}>
                    {features.map((feature, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 1 }}>
                            <CheckCircleOutlineIcon sx={{ color: COLORS.accentLight, mr: 2, fontSize: 20 }} />
                            <ListItemText primary={feature} primaryTypographyProps={{ color: alpha(COLORS.white, 0.9) }} />
                        </ListItem>
                    ))}
                </List>
                <Button
                    variant={recommended ? "contained" : "outlined"}
                    fullWidth
                    size="large"
                    sx={{
                        mt: 4,
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: recommended ? COLORS.white : 'transparent',
                        borderColor: COLORS.white,
                        color: recommended ? COLORS.primaryDark : COLORS.white,
                        '&:hover': {
                            bgcolor: COLORS.white,
                            color: COLORS.primaryDark,
                            borderColor: COLORS.white,
                        }
                    }}
                >
                    Elegir Plan
                </Button>
            </CardContent>
        </Card>
    );
};

const helloPageTheme = createTheme({
    ...getDesignTokens('light'),
    components: {
        ...inputsCustomizations,
        ...dataDisplayCustomizations,
        ...feedbackCustomizations,
        ...navigationCustomizations,
        ...surfacesCustomizations,
    }
});

const HelloPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Detectar PWA / Standalone de forma síncrona para evitar "flash"
    const [isPwa] = useState(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone
            || document.referrer.includes('android-app://');
        const isPwaParam = new URLSearchParams(window.location.search).get('mode') === 'pwa';
        return isStandalone || isPwaParam;
    });

    useEffect(() => {
        if (isPwa) {
            navigate('/signin');
        }
    }, [isPwa, navigate]);

    // Detectar si está autenticado de forma síncrona
    const [isAuthenticated] = useState(() => {
        return !!(sessionStorage.getItem('accessToken') || sessionStorage.getItem('sub'));
    });

    useEffect(() => {
        if (isAuthenticated && !isPwa) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, isPwa, navigate]);


    const [activeFeature, setActiveFeature] = useState(0);
    const [isAnnual, setIsAnnual] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);


    // Redirección si ya está logueado


    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const features = [
        {
            icon: <PsychologyIcon />,
            title: "CFO con Inteligencia Artificial",
            desc: "Tu analista financiero 24/7. Preguntale a nuestra IA por desvíos, tendencias y proyecciones como si hablaras con un experto.",
            visual: (
                <Box sx={{ width: '100%', height: 400, bgcolor: COLORS.white, p: 3, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, position: 'absolute', top: 20, left: 20, right: 20 }}>
                        <Box sx={{ width: 100, height: 10, bgcolor: '#eee', borderRadius: 1 }} />
                        <Box sx={{ width: 30, height: 30, bgcolor: alpha(COLORS.primary, 0.1), borderRadius: '50%' }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 200 }}>
                        {[40, 70, 50, 90, 60, 80, 100].map((h, i) => (
                            <Box key={i} sx={{ flex: 1, bgcolor: i === 6 ? COLORS.primary : '#eee', borderRadius: '8px 8px 0 0', height: `${h}%`, transition: 'all 0.5s', '&:hover': { height: `${h + 10}%` } }} />
                        ))}
                    </Box>
                </Box>
            )
        },
        {
            icon: <TimelineIcon />,
            title: "Predicción de Flujo de Caja",
            desc: "No mires solo el pasado. Proyecta tu liquidez a 12 meses y detecta faltantes de caja antes de que ocurran.",
            visual: (
                <Box sx={{ width: '100%', height: 400, bgcolor: COLORS.white, p: 3, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOWS.sutil }}>
                        <Box sx={{ width: 40, height: 40, bgcolor: '#2196F3', borderRadius: '50%' }} />
                    </Box>
                    <Box sx={{ flex: 1, height: 4, bgcolor: '#eee', mx: 4, position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: -5, left: '50%', width: 14, height: 14, bgcolor: COLORS.success, borderRadius: '50%', animation: 'float 2s infinite' }} />
                    </Box>
                    <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOWS.sutil }}>
                        <Box sx={{ width: 40, height: 40, bgcolor: '#4CAF50', borderRadius: '50%' }} />
                    </Box>
                </Box>
            )
        },
        {
            icon: <AccountBalanceIcon />,
            title: "Conciliación Automática",
            desc: "Olvídate de puntear Excel. Nuestro motor inteligente cruza tus bancos, Mercado Pago y facturas en segundos.",
            visual: (
                <Box sx={{ width: '100%', height: 400, bgcolor: COLORS.white, p: 3, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: 150, height: 180, border: `4px solid ${COLORS.primary}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SecurityIcon sx={{ fontSize: 80, color: COLORS.primary }} />
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 40, bgcolor: '#E0F2F1', color: COLORS.primaryDark, px: 3, py: 1, borderRadius: 20, fontWeight: 'bold' }}>
                        Match 100%
                    </Box>
                </Box>
            )
        },
        {
            icon: <CurrencyExchangeIcon />,
            title: "Gestión Bimonetaria",
            desc: "Tu realidad financiera es en dos monedas. Gestiona, proyecta y analiza tu negocio en ARS y USD de forma nativa.",
            visual: (
                <Box sx={{ width: '100%', height: 400, bgcolor: COLORS.white, p: 0, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: COLORS.primary, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: COLORS.white, color: COLORS.primary }}>$</Avatar>
                        <Box sx={{ width: 150, height: 12, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
                    </Box>
                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ bgcolor: '#eee', p: 3, borderRadius: '0 20px 20px 20px', maxWidth: '80%' }}>
                            <Box sx={{ width: '100%', height: 12, bgcolor: '#ccc', borderRadius: 1 }} />
                        </Box>
                        <Box sx={{ bgcolor: alpha(COLORS.primary, 0.1), p: 3, borderRadius: '20px 0 20px 20px', alignSelf: 'flex-end', maxWidth: '80%' }}>
                            <Box sx={{ width: '100%', height: 12, bgcolor: COLORS.primary, borderRadius: 1, opacity: 0.5 }} />
                        </Box>
                    </Box>
                </Box>
            )
        },
        {
            icon: <HubIcon />,
            title: "Ecosistema Integrado",
            desc: "Tu dinero centralizado automáticamente. Conectamos tus cuentas bancarias, Mercado Pago y facturación en un solo lugar.",
            visual: (
                <Box sx={{ width: '100%', height: 400, bgcolor: COLORS.white, p: 3, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Central Node */}
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,131,117,0.3)', zIndex: 2 }}>
                        <HubIcon sx={{ fontSize: 40, color: COLORS.white }} />
                    </Box>
                    {/* Orbiting Nodes */}
                    {[0, 120, 240].map((deg, i) => (
                        <Box key={i} sx={{
                            position: 'absolute',
                            width: 50, height: 50, borderRadius: '50%', bgcolor: '#E0F2F1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transform: `rotate(${deg}deg) translate(100px) rotate(-${deg}deg)`,
                        }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.primaryDark }} />
                        </Box>
                    ))}
                    {/* Connecting Lines (Simulated with absolute Boxes) */}
                    {[0, 120, 240].map((deg, i) => (
                        <Box key={`line-${i}`} sx={{
                            position: 'absolute',
                            width: 100, height: 2, bgcolor: '#B2DFDB',
                            transform: `rotate(${deg}deg) translate(50px)`,
                            zIndex: 1
                        }} />
                    ))}
                </Box>
            )
        },
        {
            icon: <AutoFixHighIcon />,
            title: "Carga Instantánea Inteligente",
            desc: "Dictale a la App o sácale una foto a tu factura. Nuestra IA procesa audios, imágenes y archivos al instante.",
            visual: (
                <Box sx={{ width: '100%', height: 400, bgcolor: COLORS.white, p: 3, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Pulse Waves */}
                        {[1, 2, 3].map((s) => (
                            <Box key={s} sx={{
                                position: 'absolute',
                                width: '100%', height: '100%',
                                borderRadius: '50%',
                                border: `2px solid ${COLORS.primary}`,
                                opacity: 0,
                                animation: `pulse 2s infinite ${s * 0.5}s`
                            }} />
                        ))}
                        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: COLORS.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: SHADOWS.media }}>
                            <AutoFixHighIcon sx={{ fontSize: 40, color: COLORS.white }} />
                        </Box>
                    </Box>
                    {/* Floating particles */}
                    <Box sx={{ position: 'absolute', top: 80, right: 60, width: 10, height: 10, bgcolor: COLORS.warning, borderRadius: '50%', opacity: 0.6 }} />
                    <Box sx={{ position: 'absolute', bottom: 100, left: 80, width: 8, height: 8, bgcolor: COLORS.primary, borderRadius: '50%', opacity: 0.4 }} />
                </Box>
            )
        }
    ];

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));


    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollRef = useRef(null);

    // Auto-scroll for mobile carousel
    useEffect(() => {
        let interval;
        if (isMobile && scrollRef.current) {
            interval = setInterval(() => {
                const container = scrollRef.current;
                if (container) {
                    const { scrollLeft, scrollWidth, clientWidth } = container;
                    const cardWidth = 280; // 260px width + 20px gap approx

                    // Allow a small margin of error (10px) for "end of scroll" detection
                    if (scrollLeft + clientWidth >= scrollWidth - 10) {
                        // Loop back to start
                        container.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        // Scroll to next
                        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
                    }
                }
            }, 3500); // 3.5 seconds interval
        }
        return () => clearInterval(interval);
    }, [isMobile]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 280; // Phone width (260) + gap (20 approx)
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setMobileMenuOpen(false);
    };

    const navItems = [
        { label: 'Características', id: 'features' },
        { label: 'Integraciones', id: 'integrations' },
        { label: 'Segmentos', id: 'scale' },
        { label: 'App', id: 'app' },
    ];

    if (isPwa || isAuthenticated) return null;

    return (
        <ThemeProvider theme={helloPageTheme}>
            <Box sx={{ bgcolor: COLORS.background, minHeight: '100vh', overflowX: 'hidden' }}>
                <style>{keyframes}</style>

                {/* 1. NAVBAR */}
                <AppBar
                    position="fixed"
                    elevation={0}
                    sx={{
                        bgcolor: scrolled ? alpha(COLORS.white, 0.8) : 'transparent',
                        backdropFilter: scrolled ? 'blur(20px)' : 'none',
                        borderBottom: scrolled ? `1px solid ${alpha(COLORS.textSecondary, 0.1)}` : 'none',
                        transition: TRANSITION,
                        py: 1
                    }}
                >
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                            {/* Logo */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    cursor: 'pointer'
                                }}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                <Logo size={40} />
                                <Typography
                                    variant="h5"
                                    fontWeight="800"
                                    sx={{
                                        color: scrolled ? COLORS.primary : COLORS.primary, // Always primary for visibility
                                        letterSpacing: '-1px'
                                    }}
                                >
                                    MyCFO
                                </Typography>
                            </Box>

                            {/* Desktop Nav */}
                            {!isMobile && (
                                <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {navItems.map((item) => (
                                        <Button
                                            key={item.label}
                                            onClick={() => scrollToSection(item.id)}
                                            sx={{
                                                color: COLORS.textSecondary,
                                                textTransform: 'none',
                                                fontSize: '1rem',
                                                fontWeight: 500,
                                                '&:hover': { color: COLORS.primary, bgcolor: 'transparent' }
                                            }}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </Box>
                            )}

                            {/* CTAs */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                {!isMobile && (
                                    <Button
                                        component={Link}
                                        to="/signin"
                                        variant="outlined"
                                        sx={{
                                            borderColor: COLORS.primary,
                                            color: COLORS.primary,
                                            borderRadius: '50px',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            '&:hover': { borderColor: COLORS.primaryDark, bgcolor: alpha(COLORS.primary, 0.05) }
                                        }}
                                    >
                                        Iniciar Sesión
                                    </Button>
                                )}
                                <Button
                                    component={Link}
                                    to="/signup" // Asume ruta de sign up o usar misma redirección si no existe
                                    variant="contained"
                                    sx={{
                                        bgcolor: COLORS.primary,
                                        borderRadius: '50px',
                                        boxShadow: SHADOWS.media,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        '&:hover': { bgcolor: COLORS.primaryDark, boxShadow: SHADOWS.pronunciada }
                                    }}
                                >
                                    Comenzar Gratis
                                </Button>

                                {isMobile && (
                                    <IconButton
                                        edge="end"
                                        onClick={() => setMobileMenuOpen(true)}
                                        color="primary"
                                    >
                                        <MenuIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>

                {/* Mobile Drawer */}
                <Drawer
                    anchor="right"
                    open={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    PaperProps={{ sx: { width: '80%', padding: 4 } }}
                >
                    <List>
                        {navItems.map((item) => (
                            <ListItem
                                key={item.label}
                                button
                                onClick={() => scrollToSection(item.id)}
                                sx={{ mb: 2, borderRadius: 2 }}
                            >
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '1.2rem' }} />
                            </ListItem>
                        ))}
                        <ListItem button component={Link} to="/signin" sx={{ mt: 2 }}>
                            <ListItemText primary="Iniciar Sesión" primaryTypographyProps={{ color: COLORS.primary, fontWeight: 700 }} />
                        </ListItem>
                    </List>
                </Drawer>

                {/* 2. HERO SECTION */}
                <Box
                    sx={{
                        pt: { xs: 13, md: 18 },
                        pb: { xs: 10, md: 18 },
                        // Fondo con gradiente y patrón de puntos
                        background: `
            radial-gradient(circle at 50% 50%, ${alpha(COLORS.accentLight, 0.8)} 0%, transparent 70%),
            radial-gradient(${alpha(COLORS.primary, 0.1)} 1px, transparent 1px)
          `,
                        backgroundSize: '100% 100%, 20px 20px',
                        overflow: 'hidden'
                    }}
                >
                    <Container maxWidth="lg">
                        <Grid container spacing={6} alignItems="center">
                            {/* Text */}
                            <Grid item xs={12} md={6} sx={{ animation: 'fadeInUp 0.8s ease-out' }}>
                                <Typography variant="h1" sx={{
                                    fontSize: { xs: '2.5rem', md: '4rem' },
                                    fontWeight: 800,
                                    letterSpacing: '-1.5px',
                                    color: COLORS.textPrimary,
                                    lineHeight: 1.1,
                                    mb: 3
                                }}>
                                    Gestión financiera <br />
                                    <Box component="span" sx={{
                                        background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        inteligente y simple
                                    </Box>
                                </Typography>
                                <Typography variant="h5" sx={{
                                    color: COLORS.textSecondary,
                                    mb: 5,
                                    fontWeight: 400,
                                    maxWidth: '90%'
                                }}>
                                    Toma el control de las finanzas de tu negocio con herramientas de análisis avanzadas y reportes en tiempo real.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Button
                                        component={Link}
                                        to="/signup"
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            bgcolor: COLORS.primary,
                                            borderRadius: '50px',
                                            py: 1.5, px: 4,
                                            fontSize: '1.1rem',
                                            boxShadow: SHADOWS.media,
                                            '&:hover': { bgcolor: COLORS.primaryDark, transform: 'translateY(-2px)' }
                                        }}
                                    >
                                        Empezar Ahora
                                    </Button>

                                </Box>
                            </Grid>

                            {/* Image */}
                            <Grid item xs={12} md={6} sx={{
                                animation: 'fadeIn 1s ease-out 0.2s backwards',
                                perspective: '1000px'
                            }}>
                                <Box
                                    component="img"
                                    src="/mycfo-flujodecaja4.png"
                                    alt="Dashboard MyCFO"
                                    sx={{
                                        width: '100%',
                                        borderRadius: 4,
                                        boxShadow: SHADOWS.pronunciada,
                                        transform: 'rotateY(-5deg) rotateX(2deg)',
                                        transition: 'all 0.5s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'rotateY(0deg) rotateX(0deg) scale(1.02)',
                                            boxShadow: '0 40px 100px rgba(0, 131, 117, 0.3)',
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* 4. SOCIAL PROOF (Moved up as is customary) */}
                <Box id="integrations" sx={{ py: 6, bgcolor: COLORS.white }}>
                    <Container maxWidth="lg">
                        <Typography variant="body1" align="center" color={COLORS.textSecondary} sx={{ mb: 4, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Integrado con las mejores herramientas
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, md: 5 }, flexWrap: 'wrap' }}>
                            {['Mercado Pago', 'Excel / CSV', 'PDF', 'Google Sheets', 'Home Banking',].map((brand) => (
                                <Chip
                                    key={brand}
                                    label={brand}
                                    sx={{
                                        bgcolor: COLORS.background,
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        py: 3, px: 1,
                                        borderRadius: '16px',
                                        boxShadow: SHADOWS.sutil,
                                        transition: TRANSITION,
                                        cursor: 'default',
                                        '&:hover': { transform: 'translateY(-2px)' }
                                    }}
                                />
                            ))}
                        </Box>
                    </Container>
                </Box>

                {/* 3. FEATURES SECTION */}
                <Box id="features" sx={{ py: { xs: 10, md: 14 }, bgcolor: COLORS.accentLight }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 8 }}>
                            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, mb: 2, color: COLORS.textPrimary }}>
                                Todo lo que necesitas
                            </Typography>
                            <Typography variant="h5" sx={{ color: COLORS.textSecondary, maxWidth: '700px', mx: 'auto' }}>
                                Una plataforma integral que evoluciona con vos. Explora nuestras funcionalidades.
                            </Typography>
                        </Box>

                        <Grid container spacing={4} justifyContent="center">
                            {/* Static Features List */}
                            <Grid item xs={12} md={8} lg={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {features.map((feature, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                p: 3,
                                                borderRadius: 4,
                                                bgcolor: COLORS.white,
                                                boxShadow: SHADOWS.media,
                                                transition: TRANSITION,
                                                border: `1px solid ${alpha(COLORS.primary, 0.2)}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                '&:hover': { transform: 'translateY(-2px)', boxShadow: SHADOWS.pronunciada }
                                            }}
                                        >
                                            <Avatar sx={{
                                                bgcolor: COLORS.primary,
                                                color: COLORS.white,
                                                transition: TRANSITION
                                            }}>
                                                {feature.icon}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} color={COLORS.textPrimary}>
                                                    {feature.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.5, opacity: 0.8 }}>
                                                    {feature.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* 4. USER TYPES - DESIGNED FOR EVERYONE */}
                <Box id="scale" sx={{ py: 6, bgcolor: COLORS.white, borderTop: `1px solid ${alpha(COLORS.textSecondary, 0.1)}` }}>
                    <Container maxWidth="lg">
                        <Typography variant="body1" align="center" color={COLORS.textSecondary} sx={{ mb: 4, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Diseñado para escalar con vos
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, md: 5 }, flexWrap: 'wrap' }}>
                            {['Freelancers', 'Startups', 'PyMEs', 'Consultores'].map((type) => (
                                <Chip
                                    key={type}
                                    label={type}
                                    sx={{
                                        bgcolor: COLORS.background,
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        py: 3, px: 3,
                                        borderRadius: '16px',
                                        boxShadow: SHADOWS.sutil,
                                        transition: TRANSITION,
                                        cursor: 'default',
                                        '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha(COLORS.primary, 0.05), color: COLORS.primary }
                                    }}
                                />
                            ))}
                        </Box>
                    </Container>
                </Box>

                {/* 5. PRICING SECTION */}
                {false && <Box id="pricing" sx={{ py: { xs: 10, md: 14 }, bgcolor: COLORS.white }}>
                    <Container maxWidth="lg">
                        <Typography variant="h2" align="center" sx={{ mb: 2, fontWeight: 800, color: COLORS.textPrimary }}>
                            Planes a tu medida
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 8, gap: 2 }}>
                            <Typography color={isAnnual ? COLORS.textSecondary : COLORS.primary} fontWeight="600">Mensual</Typography>
                            <Switch
                                checked={isAnnual}
                                onChange={() => setIsAnnual(!isAnnual)}
                                sx={{
                                    transform: 'scale(1.2)',
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: COLORS.primary,
                                        '&:hover': { backgroundColor: alpha(COLORS.primary, 0.04) },
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: COLORS.primary,
                                    },
                                    '& .MuiSwitch-track': {
                                        backgroundColor: '#e0e0e0',
                                        opacity: 1
                                    },
                                    '& .MuiSwitch-thumb': {
                                        boxShadow: '0px 2px 4px rgba(0,0,0,0.2)', // Sharper shadow
                                    }
                                }}
                            />
                            <Typography color={isAnnual ? COLORS.primary : COLORS.textSecondary} fontWeight="600">Anual (2 meses off)</Typography>
                        </Box>

                        <Grid container spacing={4} alignItems="stretch" justifyContent="center">
                            <Grid item xs={12} md={4}>
                                <PricingCard
                                    title="Emprendedor"
                                    price={29}
                                    isAnnual={isAnnual}
                                    features={["1 Usuario", "Dashboard Básico", "Conexión Manual", "Soporte por Email"]}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <PricingCard
                                    title="Pyme"
                                    price={79}
                                    isAnnual={isAnnual} // Pass isAnnual prop
                                    features={["5 Usuarios", "Dashboard Full", "Conexión Automática", "Soporte Prioritario", "Conciliación IA"]}
                                    recommended
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <PricingCard
                                    title="Empresa"
                                    price={199}
                                    isAnnual={isAnnual}
                                    features={["Usuarios Ilimitados", "API Access", "Account Manager", "SLA 99.9%", "Auditoría"]}
                                />
                            </Grid>
                        </Grid>
                    </Container>
                </Box>}

                {/* 6. MOBILE APP SECTION */}
                <Box id="app" sx={{ py: { xs: 10, md: 14 }, bgcolor: COLORS.accentLight }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={8} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography variant="h2" gutterBottom sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                                    Lleva tu CFO en el bolsillo
                                </Typography>
                                <Typography variant="h6" paragraph color={COLORS.textSecondary}>
                                    Accede a tus métricas clave desde cualquier lugar. Recibe alertas inteligentes y aprueba movimientos con un solo tap.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleInstallClick}
                                    sx={{
                                        bgcolor: COLORS.primary,
                                        mt: 2,
                                        px: 4, py: 1.5,
                                        borderRadius: '50px',
                                        boxShadow: SHADOWS.media,
                                        '&:hover': { bgcolor: COLORS.primaryDark }
                                    }}
                                >
                                    Instalar MyCFO
                                </Button>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                                {/* Mobile Left Arrow */}
                                {isMobile && (
                                    <IconButton
                                        onClick={() => scroll('left')}
                                        sx={{
                                            position: 'absolute', left: 0, zIndex: 2, top: '50%', transform: 'translateY(-50%)',
                                            bgcolor: alpha(COLORS.white, 0.8), boxShadow: SHADOWS.media,
                                            '&:hover': { bgcolor: COLORS.white }
                                        }}
                                    >
                                        <ArrowBackIcon />
                                    </IconButton>
                                )}

                                <Box
                                    ref={scrollRef}
                                    sx={{
                                        display: 'flex',
                                        gap: isMobile ? 2 : 4,
                                        alignItems: 'center',
                                        justifyContent: isMobile ? 'flex-start' : 'center',
                                        overflowX: isMobile ? 'auto' : 'visible',
                                        scrollSnapType: isMobile ? 'x mandatory' : 'none',
                                        width: '100%',
                                        px: isMobile ? 'calc(50% - 130px)' : 0, // Center the 260px card
                                        pb: isMobile ? 2 : 0, // Space for shadow
                                        '&::-webkit-scrollbar': { display: 'none' }, // Safari/Chrome
                                        scrollbarWidth: 'none', // Firefox
                                    }}
                                >
                                    {/* First Phone */}
                                    <Box sx={{
                                        minWidth: 260, // Ensure width is respected in flex
                                        width: 260,
                                        height: 520,
                                        bgcolor: COLORS.textPrimary,
                                        borderRadius: '40px',
                                        border: '8px solid #1A1C1E',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: SHADOWS.sutil,
                                        transform: 'scale(1)',
                                        transition: TRANSITION,
                                        scrollSnapAlign: 'center', // Snap center
                                        '&:hover': {
                                            transform: 'translateY(-10px)',
                                        }
                                    }}>
                                        <Box
                                            component="img"
                                            src="/inicio-sesion-mycfo.jpeg"
                                            alt="Inicio Sesión MyCFO"
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 20, bgcolor: '#1A1C1E', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />
                                    </Box>

                                    {/* Second Phone */}
                                    <Box sx={{
                                        minWidth: 260,
                                        width: 260,
                                        height: 520,
                                        bgcolor: COLORS.textPrimary,
                                        borderRadius: '40px',
                                        border: '8px solid #1A1C1E',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: SHADOWS.pronunciada,
                                        transition: TRANSITION,
                                        transform: 'scale(1)',
                                        scrollSnapAlign: 'center',
                                        '&:hover': {
                                            transform: 'translateY(-10px)',
                                        }
                                    }}>
                                        {/* Screen Content */}
                                        <Box
                                            component="img"
                                            src="/ampliada.png"
                                            alt="App MyCFO"
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {/* Notch */}
                                        <Box sx={{
                                            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                                            width: 100, height: 20, bgcolor: '#1A1C1E',
                                            borderBottomLeftRadius: 16, borderBottomRightRadius: 16
                                        }} />
                                    </Box>

                                    {/* Third Phone - Logo */}
                                    <Box sx={{
                                        minWidth: 260,
                                        width: 260,
                                        height: 520,
                                        bgcolor: COLORS.textPrimary,
                                        borderRadius: '40px',
                                        border: '8px solid #1A1C1E',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: SHADOWS.pronunciada,
                                        transition: TRANSITION,
                                        transform: 'scale(1)',
                                        scrollSnapAlign: 'center',
                                        '&:hover': {
                                            transform: 'translateY(-10px)',
                                        }
                                    }}>
                                        {/* Screen Content */}
                                        <Box
                                            component="img"
                                            src="/logo-celu.png"
                                            alt="MyCFO Logo Screen"
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {/* Notch */}
                                        <Box sx={{
                                            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                                            width: 100, height: 20, bgcolor: '#1A1C1E',
                                            borderBottomLeftRadius: 16, borderBottomRightRadius: 16
                                        }} />
                                    </Box>
                                </Box>

                                {/* Mobile Right Arrow */}
                                {isMobile && (
                                    <IconButton
                                        onClick={() => scroll('right')}
                                        sx={{
                                            position: 'absolute', right: 0, zIndex: 2, top: '50%', transform: 'translateY(-50%)',
                                            bgcolor: alpha(COLORS.white, 0.8), boxShadow: SHADOWS.media,
                                            '&:hover': { bgcolor: COLORS.white }
                                        }}
                                    >
                                        <ArrowForwardIcon />
                                    </IconButton>
                                )}
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* 7. FOOTER */}
                <Box component="footer" sx={{ bgcolor: COLORS.footerDark, color: 'white', py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={4} justifyContent="space-between">
                            <Grid item xs={12} md={3}>
                                <Typography variant="h6" fontWeight="800" gutterBottom>MyCFO</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7, maxWidth: 300 }}>
                                    La plataforma integral para la gestión financiera de tu empresa. Simple, potente y segura.
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Producto</Typography>
                                {[
                                    { label: 'Características', id: 'features' },
                                    { label: 'Segmentos', id: 'scale' },
                                    { label: 'Integraciones', id: 'integrations' },
                                    { label: 'App', id: 'app' }
                                ].map((item) => (
                                    <Typography
                                        key={item.label}
                                        variant="body2"
                                        onClick={() => scrollToSection(item.id)}
                                        sx={{ mb: 1, opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1, color: COLORS.accentLight } }}
                                    >
                                        {item.label}
                                    </Typography>
                                ))}
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Contacto</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7, '&:hover': { opacity: 1, color: COLORS.accentLight }, cursor: 'pointer' }}>
                                        <EmailIcon fontSize="small" />
                                        <Typography component="a" href="mailto:mycfoar@gmail.com" variant="body2" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                            mycfoar@gmail.com
                                        </Typography>
                                    </Box>
                                    <Box component="a" href="https://instagram.com/mycfo.ar" target="_blank" sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7, textDecoration: 'none', color: 'inherit', '&:hover': { opacity: 1, color: COLORS.accentLight } }}>
                                        <InstagramIcon fontSize="small" />
                                        <Typography variant="body2">
                                            @mycfo.ar
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                                        <LocationOnIcon fontSize="small" />
                                        <Typography variant="body2">
                                            Argentina
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tu Cuenta</Typography>
                                {[
                                    { label: 'Iniciar Sesión', path: '/signin' },
                                    { label: 'Registrarse', path: '/signup' },
                                    { label: 'Recuperar Contraseña', path: '/signin' },
                                    { label: 'Soporte', path: 'mailto:mycfoar@gmail.com', isExternal: true }
                                ].map((item) => (
                                    item.isExternal ? (
                                        <Typography
                                            key={item.label}
                                            component="a"
                                            href={item.path}
                                            variant="body2"
                                            sx={{
                                                mb: 1,
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                opacity: 0.7,
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 1, color: COLORS.accentLight }
                                            }}
                                        >
                                            {item.label}
                                        </Typography>
                                    ) : (
                                        <Typography
                                            key={item.label}
                                            component={Link}
                                            to={item.path}
                                            variant="body2"
                                            sx={{
                                                mb: 1,
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                opacity: 0.7,
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 1, color: COLORS.accentLight }
                                            }}
                                        >
                                            {item.label}
                                        </Typography>
                                    )
                                ))}
                            </Grid>
                        </Grid>
                        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 8, pt: 4, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ opacity: 0.5 }}>
                                © {new Date().getFullYear()} MyCFO. Todos los derechos reservados.
                            </Typography>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default HelloPage;
