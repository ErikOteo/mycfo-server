import * as React from "react";
import dayjs from "dayjs";
import { useForkRef } from "@mui/material/utils";
import Button from "@mui/material/Button";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import {
  useParsedFormat,
  usePickerContext,
  useSplitFieldProps,
} from "@mui/x-date-pickers";

function ButtonField(props) {
  const { forwardedProps } = useSplitFieldProps(props, "time");
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
      startIcon={<AccessTimeRoundedIcon fontSize="small" />}
      sx={{ minWidth: "fit-content", width: "100%" }}
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

export default function CustomTimePicker({ value, onChange, disabled = false }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        value={value}
        label={
          value == null || !dayjs(value).isValid()
            ? null
            : dayjs(value).format("HH:mm")
        }
        onChange={onChange}
        disabled={disabled}
        slots={{ field: ButtonField }}
        slotProps={{
          field: { disabled },
        }}
        minutesStep={5}
        sx={{ width: "100%" }}
      />
    </LocalizationProvider>
  );
}
