import * as React from 'react';
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";

export default function Invitaciones(props) {
  const chatbotContext = React.useMemo(
    () => ({
      screen: "invitaciones",
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
