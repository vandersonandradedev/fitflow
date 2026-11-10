"use client";

import {
  Area,
  AreaChart,
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

export function AdherenceChart({ data }: { data: AdherenceDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-[#9BA3AF]">
        Sem dados de adesão para o período.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#242C3A" vertical={false} />
          <XAxis dataKey="weekLabel" stroke="#647082" fontSize={11} tickLine={false} />
          <YAxis stroke="#647082" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12161D",
              borderColor: "#242C3A",
              borderRadius: "8px",
              color: "#F3F5F7",
              fontSize: "12px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(val) =>
              val === "completedSessions" ? "Treinos Realizados" : "Meta Semanal"
            }
          />
          <Bar dataKey="completedSessions" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="targetSessions" fill="#3B82F6" opacity={0.35} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExerciseProgressionChart({ data }: { data: ProgressionDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-[#9BA3AF]">
        Nenhum registro de carga para este exercício ainda.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#242C3A" vertical={false} />
          <XAxis dataKey="date" stroke="#647082" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#647082"
            fontSize={11}
            tickLine={false}
            unit="kg"
            domain={["dataMin - 5", "dataMax + 10"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12161D",
              borderColor: "#242C3A",
              borderRadius: "8px",
              color: "#F3F5F7",
              fontSize: "12px",
            }}
            formatter={(value, name) => [
              `${value} kg`,
              name === "maxLoadKg" ? "Carga Máxima" : "1RM Estimada (Epley)",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(val) =>
              val === "maxLoadKg" ? "Carga Máxima (kg)" : "1RM Estimada (kg)"
            }
          />
          <Line
            type="monotone"
            dataKey="maxLoadKg"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ r: 6 }}
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
      <div className="flex h-56 items-center justify-center text-xs text-[#9BA3AF]">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#242C3A" horizontal={false} />
          <XAxis type="number" stroke="#647082" fontSize={11} tickLine={false} unit="kg" />
          <YAxis
            type="category"
            dataKey="groupName"
            stroke="#9BA3AF"
            fontSize={11}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12161D",
              borderColor: "#242C3A",
              borderRadius: "8px",
              color: "#F3F5F7",
              fontSize: "12px",
            }}
            formatter={(value) => [`${Number(value).toLocaleString("pt-BR")} kg`, "Tonelagem"]}
          />
          <Bar dataKey="totalVolumeKg" fill="#10B981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BodyCompositionChart({ data }: { data: BodyCompositionDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-[#9BA3AF]">
        Nenhuma avaliação física registrada para este aluno.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#242C3A" vertical={false} />
          <XAxis dataKey="date" stroke="#647082" fontSize={11} tickLine={false} />
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
          <Tooltip
            contentStyle={{
              backgroundColor: "#12161D",
              borderColor: "#242C3A",
              borderRadius: "8px",
              color: "#F3F5F7",
              fontSize: "12px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(val) =>
              val === "weightKg" ? "Peso Corporal (kg)" : "Gordura Corporal (%)"
            }
          />
          <Area
            yAxisId="weight"
            type="monotone"
            dataKey="weightKg"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#weightGrad)"
          />
          <Area
            yAxisId="fat"
            type="monotone"
            dataKey="bodyFatPercentage"
            stroke="#F59E0B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#fatGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
