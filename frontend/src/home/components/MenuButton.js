import * as React from 'react';
import PropTypes from 'prop-types';
import Badge, { badgeClasses } from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

function MenuButton({ showBadge = false, ...props }) {
  return (
    <Tooltip title="Menú">
      <Badge
        color="error"
        variant="dot"
        invisible={!showBadge}
        sx={{ [`& .${badgeClasses.badge}`]: { right: 2, top: 2 } }}
      >
        <IconButton size="small" {...props} sx={{ '&:hover': { backgroundColor: 'action.hover' } }} />
      </Badge>
    </Tooltip>
  );
}

MenuButton.propTypes = {
  showBadge: PropTypes.bool,
};

export default MenuButton;
