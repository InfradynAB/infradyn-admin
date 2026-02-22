import { cn } from "@/lib/utils";
import { TrendUp, TrendDown, DotsThree } from "@phosphor-icons/react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ElementType;
    sparklineData?: { value: number }[];
    gradient?: {
        from: string;
        to: string;
        glow: string;
        text: string;
    };
    change?: {
        value: string;
        direction: "up" | "down" | "neutral";
        label?: string;
    };
    className?: string;
}

const defaultGradient: StatCardProps["gradient"] = {
    from: "from-violet-600",
    to: "to-violet-800",
    glow: "shadow-violet-900/40",
    text: "text-violet-400",
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    sparklineData,
    gradient = defaultGradient,
    change,
    className,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "relative rounded-2xl border border-white/[0.05] bg-[#16162A]/60 backdrop-blur-xl overflow-hidden p-6 transition-all duration-300",
                "hover:border-white/[0.1] hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
                className
            )}
        >
            <div className="relative flex justify-between items-start mb-6">
                <div>
                    <p className="text-[13px] font-medium text-white/50 tracking-wide mb-1">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-2xl font-bold text-white tracking-tight">
                            {value}
                        </h4>
                        {subtitle && (
                            <span className="text-xs text-white/30">{subtitle}</span>
                        )}
                    </div>
                </div>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/40 transition-colors">
                    <DotsThree weight="bold" className="h-5 w-5" />
                </button>
            </div>

            <div className="flex items-end justify-between gap-4 mt-auto">
                {change && (
                    <div
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit",
                            change.direction === "up"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : change.direction === "down"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-white/5 text-white/40"
                        )}
                    >
                        {change.direction === "up" ? (
                            <TrendUp weight="bold" className="h-3 w-3" />
                        ) : change.direction === "down" ? (
                            <TrendDown weight="bold" className="h-3 w-3" />
                        ) : null}
                        <span>{change.value}</span>
                        {change.label && (
                            <span className="opacity-60 font-normal">
                                {change.label}
                            </span>
                        )}
                    </div>
                )}

                {sparklineData && (
                    <div className="h-10 w-24 ml-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={change?.direction === "down" ? "#f87171" : "#8b5cf6"}
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={true}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {Icon && !sparklineData && (
                    <div
                        className={cn(
                            "flex items-center justify-center h-10 w-10 rounded-xl shrink-0",
                            "bg-gradient-to-br shadow-lg",
                            gradient?.from || defaultGradient!.from,
                            gradient?.to || defaultGradient!.to,
                            gradient?.glow || defaultGradient!.glow
                        )}
                    >
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}
