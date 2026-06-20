import React from "react";

interface Step {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface ProgressBarProps {
  steps: Step[];
}

const G = "#58674a";

const ProgressBar: React.FC<ProgressBarProps> = ({ steps }) => {
  const currentIndex = (steps.find((s) => s.isActive)?.id ?? 1) - 1;

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Dots + connecting lines */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: step.isCompleted || step.isActive ? G : "rgba(88,103,74,0.12)",
                transition: "background 0.3s ease",
              }}
            >
              {step.isCompleted ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="#f5f1e6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span style={{ fontSize: "0.7rem", color: step.isActive ? "#f5f1e6" : "#9a9a8a", fontWeight: 600 }}>
                  {step.id}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: currentIndex > i ? G : "rgba(88,103,74,0.18)",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Labels — separate row so they don't affect dot alignment */}
      <div style={{ display: "flex", marginTop: 8 }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <div style={{ width: 28, flexShrink: 0, display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: step.isActive ? G : "#9a9a8a",
                  fontWeight: step.isActive ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1 }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
