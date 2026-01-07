import { alpha } from '@mui/material/styles';

const GREEN = '#2e7d32';
const RED = '#d32f2f';

export const buildTipoSelectSx = (tipo) => (theme) => {
  const isIngreso = String(tipo).toLowerCase() === 'ingreso';
  const base = isIngreso ? GREEN : RED;

  const bg = alpha(base, 0.12);
  const bgHover = alpha(base, 0.16);
  const bgFocus = alpha(base, 0.20);

  const palette = (theme.vars || theme).palette;
  const textColor = palette.text.primary;
  const textChannel =
  palette.text?.primaryChannel ?? (theme.palette.mode === 'dark' ? '255 255 255' : '0 0 0');
  
  const rootSelector = '&& .MuiOutlinedInput-root';
  //const textChannel = theme.palette.mode === 'dark' ? '255 255 255' : '0 0 0';
  const inputSelectors = [
    `${rootSelector} .MuiSelect-select`,
    `${rootSelector} .MuiSelect-select.MuiSelect-outlined`,
    `${rootSelector} .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input`,
    `${rootSelector} .MuiInputBase-input`,
    `${rootSelector} .MuiOutlinedInput-input`,
  ].join(', ');
  const iconSelectors = [
    `${rootSelector} .MuiSelect-icon`,
    `${rootSelector} .MuiSelect-iconOutlined`,
    `${rootSelector} .MuiSvgIcon-root`,
  ].join(', ');

  return {
    [rootSelector]: {
      borderRadius: 1,
      color: textColor,
      backgroundColor: bg,
      '--mui-palette-text-primary': textColor,
      '--mui-palette-text-secondary': textColor,
      '--mui-palette-action-active': textColor,
      '--mui-palette-text-primaryChannel': textChannel,
      '--mui-palette-text-secondaryChannel': textChannel,
      '--mui-palette-action-activeChannel': textChannel,
      '&:hover': { backgroundColor: bgHover },
      '&.Mui-focused': { backgroundColor: bgFocus },
      '& fieldset': { borderColor: palette.divider },
      '&:hover fieldset': { borderColor: palette.divider },
      '&.Mui-focused fieldset': { borderColor: palette.divider },
    },
    [inputSelectors]: {
      color: textColor,
      WebkitTextFillColor: textColor,
      fontWeight: 200,
    },
    [iconSelectors]: {
      color: textColor,
    },
    '&& .MuiInputLabel-root, && .MuiInputLabel-root.Mui-focused': {
      color: textColor,
      WebkitTextFillColor: textColor,
    },
  };
};
