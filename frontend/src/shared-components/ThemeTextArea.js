// src/components/ThemedTextarea.js
import * as React from 'react';
import { styled } from '@mui/material/styles';
import TextareaAutosize from '@mui/material/TextareaAutosize';

const ThemedTextarea = styled(TextareaAutosize)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.body1.fontSize,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper, // usa color del theme
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`, // usa divider del theme
  outline: 'none',
  width: '100%',
  resize: 'vertical',
  transition: theme.transitions.create(
    ['border-color', 'box-shadow', 'background-color'],
    { duration: theme.transitions.duration.short }
  ),
  '&:hover': {
    borderColor: theme.palette.text.secondary,
  },
  '&:focus': {
    borderColor: theme.palette.primary.main,
    boxShadow: `${theme.palette.primary.main}40 0 0 0 2px`,
  },
  '&::placeholder': {
    color: theme.palette.text.disabled,
  },
}));

export default function ThemeTextArea(props) {
  return (
    <ThemedTextarea
      minRows={3}
      placeholder="Escribe aquí..."
      {...props}
    />
  );
}
