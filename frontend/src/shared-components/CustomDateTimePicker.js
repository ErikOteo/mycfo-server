import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useForkRef } from '@mui/material/utils';
import Button from '@mui/material/Button';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  useParsedFormat,
  usePickerContext,
  useSplitFieldProps,
} from '@mui/x-date-pickers';

dayjs.extend(utc);

function ButtonField(props) {
  const { forwardedProps } = useSplitFieldProps(props, 'date-time');
  const pickerContext = usePickerContext();
  const handleRef = useForkRef(pickerContext.triggerRef, pickerContext.rootRef);
  const parsedFormat = useParsedFormat();

  const valueStr =
    pickerContext.value == null
      ? parsedFormat
      : pickerContext.value.format(pickerContext.fieldFormat);

  return (
    <Button
      {...forwardedProps}
      variant="outlined"
      ref={handleRef}
      size="small"
      startIcon={<CalendarTodayRoundedIcon fontSize="small" />}
      sx={{ minWidth: 'fit-content', width: '100%' }}
      disabled={pickerContext.disabled || forwardedProps?.disabled}
      onClick={() => {
        if (pickerContext.disabled || forwardedProps?.disabled) return;
        pickerContext.setOpen((prev) => !prev);
      }}
    >
      {pickerContext.label ?? valueStr}
    </Button>
  );
}

export default function CustomDateTimePicker({ value, onChange, disabled = false }) {
  const handleChange = (newValue) => {
    if (!onChange) return;
    if (dayjs.isDayjs(newValue)) {
      // Normalizamos a UTC pero conservando fecha y hora
      const normalized = dayjs
        .utc(newValue.format('YYYY-MM-DDTHH:mm:ss'))
        .second(0)
        .millisecond(0);
      onChange(normalized);
    } else {
      onChange(newValue);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        value={value ? dayjs(value) : null}
        label={
          value == null
            ? null
            : dayjs(value).format('MMM DD, YYYY HH:mm')
        }
        onChange={handleChange}
        disabled={disabled}
        slots={{ field: ButtonField }}
        slotProps={{
          nextIconButton: { size: 'small', disabled },
          previousIconButton: { size: 'small', disabled },
          field: { disabled },
        }}
        sx={{ width: '100%' }}
      />
    </LocalizationProvider>
  );
}
