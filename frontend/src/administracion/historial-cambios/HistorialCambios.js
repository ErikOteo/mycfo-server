import * as React from 'react';
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";

export default function HistorialCambios(props) {
  const chatbotContext = React.useMemo(
    () => ({
      screen: "historial-cambios",
      estado: "sin-datos",
    }),
    []
  );

  useChatbotScreenContext(chatbotContext);

  return (
    <>

    </>
  );
}
