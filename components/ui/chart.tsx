
import * as React from "react"
import { ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "../../utils/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Record<string, string>
  }
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

// Added optional children to ChartContainer props
export const ChartContainer = ({
  config,
  children,
  className,
}: {
  config: ChartConfig
  children?: React.ReactNode
  className?: string
}) => {
  const chartId = React.useId()

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-grid-horizontal_line]:stroke-zinc-200 [&_.recharts-cartesian-grid-vertical_line]:stroke-zinc-200 [&_.recharts-curve.recharts-area]:stroke-width-2 [&_.recharts-dot]:stroke-width-2 [&_.recharts-grid-line]:stroke-zinc-200 [&_.recharts-layer]:outline-none [&_.recharts-polar-grid-concentric-path]:stroke-zinc-200 [&_.recharts-polar-grid-radial-line]:stroke-zinc-200 [&_.recharts-sector]:stroke-zinc-200 [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-tooltip-cursor]:stroke-zinc-200",
          className
        )}
      >
        <style>
          {Object.entries(config)
            .map(([key, item]) => {
              const color = item.color
              if (!color) return null
              return `[data-chart="${chartId}"] { --color-${key}: ${color}; }`
            })
            .join("\n")}
        </style>
        <ResponsiveContainer>{children as any}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export const ChartTooltip = Tooltip

export const ChartTooltipContent = ({
  active,
  payload,
  label,
  labelFormatter,
  indicator = "dot",
}: any) => {
  const context = React.useContext(ChartContext)
  if (!active || !payload?.length || !context) return null

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-md">
      <div className="mb-1 text-[10px] font-bold uppercase text-zinc-500">
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      <div className="grid gap-1.5">
        {payload.map((item: any, index: number) => {
          const key = item.dataKey
          const config = context.config[key]
          const color = config?.color || item.fill || item.color

          return (
            <div key={index} className="flex items-center gap-2">
              {indicator === "dot" && (
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="text-[11px] font-bold text-zinc-900">
                {config?.label || key}:
              </span>
              <span className="text-[11px] font-black tabular-nums text-zinc-900">
                {item.value.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
