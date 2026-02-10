import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';

interface ChartDataPoint {
    period: string;
    revenue: number;
    expenses: number;
    netProfit: number;
}

interface RevenueChartProps {
    data: ChartDataPoint[];
    className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(800);
    
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const maxProfit = Math.max(...data.map(d => d.netProfit));
    const maxValue = Math.max(maxRevenue, maxProfit);
    
    const chartHeight = 300;
    const chartPadding = 60;
    const chartWidth = containerWidth;
    const availableWidth = chartWidth - (chartPadding * 2);
    const groupWidth = availableWidth / data.length;
    const barWidth = Math.min(groupWidth * 0.35, 50);

    const formatPeso = (value: number) => {
        if (value >= 1000000) {
            return `₱${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `₱${(value / 1000).toFixed(0)}K`;
        }
        return `₱${value.toLocaleString()}`;
    };

    const getYPosition = (value: number) => {
        return chartHeight - chartPadding - ((value / maxValue) * (chartHeight - chartPadding * 2));
    };

    // Generate grid lines
    const gridLines = [];
    for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * i;
        const y = getYPosition(value);
        gridLines.push({ value, y });
    }

    return (
        <div ref={containerRef} className={cn("w-full", className)}>
            <div className="mb-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                    <span>Net Profit</span>
                </div>
            </div>
            
            <div className="relative w-full">
                <svg
                    width="100%"
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="border rounded-lg bg-white dark:bg-neutral-950"
                >
                    {/* Grid lines */}
                    {gridLines.map((line, index) => (
                        <g key={index}>
                            <line
                                x1={chartPadding}
                                y1={line.y}
                                x2={chartWidth - chartPadding}
                                y2={line.y}
                                stroke="currentColor"
                                strokeWidth="1"
                                className="stroke-gray-200 dark:stroke-gray-700"
                                strokeDasharray={index === 0 ? "none" : "2,2"}
                            />
                            <text
                                x={chartPadding - 10}
                                y={line.y + 4}
                                textAnchor="end"
                                className="fill-gray-500 dark:fill-gray-400 text-xs"
                            >
                                {formatPeso(line.value)}
                            </text>
                        </g>
                    ))}

                    {/* Bars */}
                    {data.map((item, index) => {
                        const x = chartPadding + (index * groupWidth) + (groupWidth - barWidth * 2) / 2;
                        const revenueHeight = ((item.revenue / maxValue) * (chartHeight - chartPadding * 2));
                        const profitHeight = ((item.netProfit / maxValue) * (chartHeight - chartPadding * 2));
                        
                        return (
                            <g key={index}>
                                {/* Revenue bar */}
                                <rect
                                    x={x}
                                    y={chartHeight - chartPadding - revenueHeight}
                                    width={barWidth - 4}
                                    height={revenueHeight}
                                    fill="rgb(59, 130, 246)"
                                    className="hover:fill-blue-600 transition-colors"
                                    rx="2"
                                />
                                
                                {/* Profit bar */}
                                <rect
                                    x={x + barWidth}
                                    y={chartHeight - chartPadding - profitHeight}
                                    width={barWidth - 4}
                                    height={profitHeight}
                                    fill="rgb(34, 197, 94)"
                                    className="hover:fill-emerald-600 transition-colors"
                                    rx="2"
                                />

                                {/* Month label */}
                                <text
                                    x={x + barWidth}
                                    y={chartHeight - 10}
                                    textAnchor="middle"
                                    className="fill-gray-600 dark:fill-gray-400 text-xs"
                                >
                                    {item.period.split(' ')[0]}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

interface ServiceData {
    service: string;
    revenue: number;
    count: number;
    growth: number;
}

interface DonutChartProps {
    data: ServiceData[];
    className?: string;
}

export function ServiceDonutChart({ data, className }: DonutChartProps) {
    // Always use count for chart segment sizes (visual distribution)
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    
    const chartSize = 280;
    const centerX = chartSize / 2;
    const centerY = chartSize / 2;
    const radius = 90;
    const innerRadius = 55;
    
    const colors = [
        '#3B82F6', // blue
        '#10B981', // emerald
        '#F59E0B', // amber
        '#EF4444', // red
        '#8B5CF6', // purple
        '#06B6D4'  // cyan
    ];

    const formatPeso = (value: number) => {
        if (value >= 1000000) {
            return `₱${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `₱${(value / 1000).toFixed(0)}K`;
        }
        return `₱${value.toLocaleString()}`;
    };

    // If no data or total count is 0, show empty state
    if (data.length === 0 || totalCount === 0) {
        return (
            <div className={cn("w-full", className)}>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">No service data available</p>
                </div>
            </div>
        );
    }

    // Calculate angles for each segment based on count (procedure count)
    let currentAngle = -90; // Start from top
    const segments = data.map((item, index) => {
        const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
        const angle = totalCount > 0 ? (item.count / totalCount) * 360 : 0;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        // Calculate arc path
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        
        const outerStartX = centerX + radius * Math.cos(startAngleRad);
        const outerStartY = centerY + radius * Math.sin(startAngleRad);
        const outerEndX = centerX + radius * Math.cos(endAngleRad);
        const outerEndY = centerY + radius * Math.sin(endAngleRad);
        
        const innerStartX = centerX + innerRadius * Math.cos(startAngleRad);
        const innerStartY = centerY + innerRadius * Math.sin(startAngleRad);
        const innerEndX = centerX + innerRadius * Math.cos(endAngleRad);
        const innerEndY = centerY + innerRadius * Math.sin(endAngleRad);
        
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const pathData = [
            `M ${outerStartX} ${outerStartY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
            `L ${innerEndX} ${innerEndY}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
            'Z'
        ].join(' ');
        
        // Calculate label position
        const labelAngle = (startAngle + endAngle) / 2;
        const labelAngleRad = (labelAngle * Math.PI) / 180;
        const labelRadius = (radius + innerRadius) / 2;
        const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
        const labelY = centerY + labelRadius * Math.sin(labelAngleRad);
        
        currentAngle = endAngle;
        
        return {
            ...item,
            pathData,
            color: colors[index % colors.length],
            percentage,
            labelX,
            labelY
        };
    });

    return (
        <div className={cn("w-full", className)}>
            <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Chart */}
                <div className="relative">
                    <svg
                        width={chartSize}
                        height={chartSize}
                        className="drop-shadow-sm"
                    >
                        {segments.map((segment, index) => (
                            <g key={index}>
                                <path
                                    d={segment.pathData}
                                    fill={segment.color}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                                {segment.percentage > 8 && (
                                    <text
                                        x={segment.labelX}
                                        y={segment.labelY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-white text-xs font-medium pointer-events-none"
                                    >
                                        {segment.percentage.toFixed(0)}%
                                    </text>
                                )}
                            </g>
                        ))}
                        
                        {/* Center text */}
                        <text
                            x={centerX}
                            y={centerY - 8}
                            textAnchor="middle"
                            className="fill-gray-700 dark:fill-gray-300 text-xs font-medium"
                        >
                            Total Revenue
                        </text>
                        <text
                            x={centerX}
                            y={centerY + 8}
                            textAnchor="middle"
                            className="fill-gray-900 dark:fill-gray-100 text-sm font-bold"
                        >
                            {formatPeso(totalRevenue)}
                        </text>
                    </svg>
                </div>
                
                {/* Legend */}
                <div className="space-y-3 flex-1 min-w-0">
                    {segments.map((segment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: segment.color }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{segment.service}</p>
                                    <p className="text-xs text-muted-foreground">{segment.count} procedures</p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm">{formatPeso(segment.revenue)}</p>
                                <div className="flex items-center gap-1">
                                    {segment.growth > 0 ? (
                                        <span className="text-xs text-emerald-600">↗ {segment.growth.toFixed(1)}%</span>
                                    ) : (
                                        <span className="text-xs text-red-600">↘ {Math.abs(segment.growth).toFixed(1)}%</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}