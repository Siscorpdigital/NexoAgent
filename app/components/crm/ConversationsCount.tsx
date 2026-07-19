"use client";

import Tooltip from "@/app/components/help/Tooltip";

interface ConversationsCountProps {
  count: number;
}

export default function ConversationsCount({ count }: ConversationsCountProps) {
  const tooltipText = count === 0
    ? "Aún no hay conversaciones con este contacto"
    : count === 1
    ? "1 conversación de WhatsApp"
    : `${count} conversaciones de WhatsApp registradas`;

  return (
    <Tooltip content={tooltipText} position="bottom">
      <span className="text-xs cursor-help" style={{ color: "#5C7872" }}>
        {count} conv.
      </span>
    </Tooltip>
  );
}
