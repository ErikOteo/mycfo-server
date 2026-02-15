import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
};
const userPool = new CognitoUserPool(poolData);

function ForgotPassword({ open, handleClose }) {
  const [step, setStep] = React.useState(1); // 1: Pedir email, 2: Pedir código y nueva clave
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const resetStates = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setLoading(false);
    setError('');
    setMessage('');
  };

  const handleCustomClose = () => {
    resetStates();
    handleClose();
  };

  const handleSendCode = (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.forgotPassword({
      onSuccess: (data) => {
        console.log('Code delivery success:', data);
        setStep(2);
        setMessage('Código enviado con éxito. Revisá tu email.');
        setLoading(false);
      },
      onFailure: (err) => {
        console.error('Code delivery failure:', err);
        setError(err.message || 'Error al enviar el código.');
        setLoading(false);
      },
    });
  };

  const handleConfirmPassword = (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        console.log('Password reset success');
        setMessage('¡Contraseña actualizada con éxito! Ya podés iniciar sesión.');
        setTimeout(() => {
          handleCustomClose();
        }, 3000);
      },
      onFailure: (err) => {
        console.error('Password reset failure:', err);
        setError(err.message || 'Error al restablecer la contraseña.');
        setLoading(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleCustomClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: step === 1 ? handleSendCode : handleConfirmPassword,
          sx: { backgroundImage: 'none' },
        },
      }}
    >
      <DialogTitle>
        {step === 1 ? 'Restablecer contraseña' : 'Nueva contraseña'}
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          {step === 1
            ? 'Ingresa el correo electrónico de tu cuenta y te enviaremos un código para restablecer tu contraseña.'
            : 'Ingresa el código que recibiste por mail y tu nueva contraseña.'}
        </DialogContentText>

        {step === 1 ? (
          <OutlinedInput
            autoFocus
            required
            margin="dense"
            id="email"
            name="email"
            placeholder="Correo electrónico"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <>
            <OutlinedInput
              autoFocus
              required
              margin="dense"
              id="code"
              name="code"
              placeholder="Código de 6 dígitos"
              type="text"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <OutlinedInput
              required
              margin="dense"
              id="newPassword"
              name="newPassword"
              placeholder="Nueva contraseña"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        {message && (
          <Typography color="primary" variant="body2" sx={{ mt: 1 }}>
            {message}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleCustomClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" type="submit" disabled={loading}>
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : step === 1 ? (
            'Enviar código'
          ) : (
            'Restablecer'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
