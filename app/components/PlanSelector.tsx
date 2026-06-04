"use client";

import { useState } from "react";

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  maxWhatsApps: number;
  maxAgentes: number;
  maxConversacionesMes: number;
}

interface PlanSelectorProps {
  planes: Plan[];
  planActualId: string | null;
}

export default function PlanSelector({ planes, planActualId }: PlanSelectorProps) {
  const [seleccionado, setSeleccionado] = useState(planActualId);

  return (
    <div
      className="plan-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: '16px'
      }}
    >
      <style jsx>{`
        @media (min-width: 768px) {
          .plan-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      {planes.map((plan) => {
        const isSelected = seleccionado === plan.id;
        return (
          <div
            key={plan.id}
            onClick={(e) => {
              e.preventDefault();
              setSeleccionado(plan.id);
            }}
            style={{
              width: '100%',
              height: '300px',
              padding: '20px',
              border: '3px solid',
              borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
              backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
              borderRadius: '12px',
              cursor: 'pointer',
              position: 'relative',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}
          >
            {/* Input oculto para el form */}
            <input
              type="radio"
              name="planId"
              value={plan.id}
              checked={isSelected}
              onChange={() => {}}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              required
            />

            {/* Badge en posición absoluta - no afecta layout */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 8px',
                backgroundColor: isSelected ? '#DBEAFE' : 'transparent',
                color: isSelected ? '#1E40AF' : 'transparent',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                pointerEvents: 'none',
                width: '80px',
                textAlign: 'center'
              }}
            >
              Seleccionado
            </div>

            {/* Contenido */}
            <div style={{ paddingTop: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
                {plan.nombre}
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: '1' }}>
                  ${plan.precio}
                </p>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                  USD/mes
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: '#374151' }}>
                    {plan.maxWhatsApps === -1
                      ? "WhatsApp ilimitados"
                      : `${plan.maxWhatsApps} WhatsApp${plan.maxWhatsApps > 1 ? "s" : ""}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: '#374151' }}>
                    {plan.maxAgentes === -1
                      ? "Agentes ilimitados"
                      : `${plan.maxAgentes} agentes`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ color: '#374151' }}>
                    {plan.maxConversacionesMes.toLocaleString()} conversaciones/mes
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
