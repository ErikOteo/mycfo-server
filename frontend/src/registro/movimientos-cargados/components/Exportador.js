import * as React from 'react';
import {
  Drawer,
  IconButton,
  Button,
  Stack,
  Box,
  Typography
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';

export default function Exportador() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
      <IconButton onClick={toggleDrawer} color="primary" sx={{ border: '1px solid', borderRadius: 1 }}>
        <MenuOpenIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer}
        PaperProps={{
          sx: { width: 240, padding: 2 }
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Exportar
        </Typography>
        <Stack spacing={2}>
          <Button variant="contained" color="primary" startIcon={<PictureAsPdfIcon />}>
            Exportar PDF
          </Button>
          <Button variant="outlined" color="success" startIcon={<FileDownloadIcon />}>
            Exportar Excel
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}
