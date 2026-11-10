"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AdherenceDataPoint {
  weekLabel: string;
  completedSessions: number;
  targetSessions: number;
  adherencePercentage: number;
}

export interface ProgressionDataPoint {
  date: string;
  maxLoadKg: number;
  estimated1RmKg: number;
  volumeKg: number;
  bestSet: string;
}

export interface MuscleVolumeDataPoint {
  groupName: string;
  totalVolumeKg: number;
  setsCount: number;
}

export interface BodyCompositionDataPoint {
  date: string;
  weightKg: number;
  bodyFatPercentage: number | null;
  muscleMassPercentage: number | null;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#111419",
  borderColor: "#232934",
  borderRadius: "6px",
  color: "#F3F5F7",
  fontSize: "12px",
};

export function AdherenceChart({ data }: { data: AdherenceDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">
        Sem dados de adesão para o período.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232934" vertical={false} />
          <XAxis dataKey="weekLabel" stroke="#6B7280" fontSize={11} tickLine={false} />
          <YAxis stroke="#6B7280" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(val) =>
              val === "completedSessions" ? "Treinos realizados" : "Meta semanal"
            }
          />
          <Bar dataKey="completedSessions" fill="#10B981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="targetSessions" fill="#323B49" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExerciseProgressionChart({ data }: { data: ProgressionDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">
        Nenhum registro de carga para este exercício ainda.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232934" vertical={false} />
          <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#6B7280"
            fontSize={11}
            tickLine={false}
            unit="kg"
            domain={["dataMin - 5", "dataMax + 10"]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [
              `${value} kg`,
              name === "maxLoadKg" ? "Carga máxima" : "1RM estimada (Epley)",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(val) =>
              val === "maxLoadKg" ? "Carga máxima (kg)" : "1RM estimada (kg)"
            }
          />
          <Line
            type="monotone"
            dataKey="maxLoadKg"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 3.5 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="estimated1RmKg"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ fill: "#F59E0B", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MuscleVolumeChart({ data }: { data: MuscleVolumeDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">
        Sem dados de volume acumulado no período.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#232934" horizontal={false} />
          <XAxis type="number" stroke="#6B7280" fontSize={11} tickLine={false} unit="kg" />
          <YAxis
            type="category"
            dataKey="groupName"
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toLocaleString("pt-BR")} kg`, "Tonelagem"]}
          />
          <Bar dataKey="totalVolumeKg" fill="#10B981" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BodyCompositionChart({ data }: { data: BodyCompositionDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">
        Nenhuma avaliação física registrada para este aluno.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232934" vertical={false} />
          <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
          <YAxis
            yAxisId="weight"
            stroke="#10B981"
            fontSize={11}
            tickLine={false}
            unit="kg"
            domain={["dataMin - 2", "dataMax + 2"]}
          />
          <YAxis
            yAxisId="fat"
            orientation="right"
            stroke="#F59E0B"
            fontSize={11}
            tickLine={false}
            unit="%"
            domain={[0, 50]}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(val) =>
              val === "weightKg" ? "Peso corporal (kg)" : "Gordura corporal (%)"
            }
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weightKg"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 3.5 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="fat"
            type="monotone"
            dataKey="bodyFatPercentage"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: "#F59E0B", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
