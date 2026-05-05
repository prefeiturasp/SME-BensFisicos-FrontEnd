import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    isAfter,
    isBefore,
    isToday,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export interface DateRange {
    from: Date | undefined
    to: Date | undefined
}

// Fix: props readonly + id
interface DateRangePickerProps {
    readonly id?: string
    readonly value: DateRange | undefined
    readonly onChange: (range: DateRange | undefined) => void
    readonly placeholder?: string
    readonly className?: string
}

const GREEN = "#2F7D57"
const GREEN_LIGHT = "#e8f5ee"
const GREEN_DARK = "#256947"

// Fix: extrai função para resolver Cognitive Complexity e ternários aninhados
function getDayColor(isSelected: boolean, inMonth: boolean, today: boolean): string {
    if (isSelected) return "#fff"
    if (!inMonth) return "#d1d5db"
    if (today) return GREEN
    return "#1a1a1a"
}

function getBorderRadius(isRangeLeft: boolean, isRangeRight: boolean): string {
    if (isRangeLeft && isRangeRight) return "50%"
    if (isRangeLeft) return "50% 0 0 50%"
    if (isRangeRight) return "0 50% 50% 0"
    return "0"
}

export function DateRangePicker({
    id,
    value,
    onChange,
    placeholder = "Selecione o período",
    className,
}: DateRangePickerProps) {
    const [open, setOpen] = useState(false)
    const [leftMonth, setLeftMonth] = useState(() => startOfMonth(new Date()))
    const [hovered, setHovered] = useState<Date | null>(null)
    const [selecting, setSelecting] = useState<"from" | "to">("from")
    const ref = useRef<HTMLDivElement>(null)

    const rightMonth = addMonths(leftMonth, 1)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (open) setSelecting(value?.from && !value?.to ? "to" : "from")
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    const formatLabel = () => {
        if (value?.from && value?.to)
            return `${format(value.from, "dd/MM/yyyy")} → ${format(value.to, "dd/MM/yyyy")}`
        if (value?.from) return `${format(value.from, "dd/MM/yyyy")} → ...`
        return placeholder
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(undefined)
        setSelecting("from")
    }

    const handleDayClick = (day: Date) => {
        if (selecting === "from") {
            onChange({ from: day, to: undefined })
            setSelecting("to")
        } else {
            if (value?.from && isBefore(day, value.from)) {
                onChange({ from: day, to: value.from })
            } else {
                onChange({ from: value?.from, to: day })
            }
            setSelecting("from")
            setOpen(false)
        }
    }

    const isInRange = (day: Date) => {
        const from = value?.from
        const to = value?.to ?? (selecting === "to" && hovered ? hovered : undefined)
        if (!from || !to) return false
        const [start, end] = isAfter(to, from) ? [from, to] : [to, from]
        return isWithinInterval(day, { start, end }) && !isSameDay(day, start) && !isSameDay(day, end)
    }

    const isRangeStart = (day: Date) => value?.from ? isSameDay(day, value.from) : false

    const isRangeEnd = (day: Date) => {
        const end = value?.to ?? (selecting === "to" && hovered ? hovered : undefined)
        if (!end || !value?.from) return false
        return isSameDay(day, end) && !isSameDay(day, value.from)
    }

    const isHoveredEnd = (day: Date) =>
        selecting === "to" && hovered && value?.from
            ? isSameDay(day, hovered) && !isSameDay(day, value.from)
            : false

    function buildCalendar(month: Date) {
        const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
        const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
        return eachDayOfInterval({ start, end })
    }

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    // Fix: extraído para função separada para reduzir Cognitive Complexity
    function renderDay(day: Date, i: number, month: Date) {
        const inMonth = isSameMonth(day, month)
        const isStart = isRangeStart(day)
        const isEnd = isRangeEnd(day) || isHoveredEnd(day)
        const inRng = isInRange(day)
        const today = isToday(day)
        const isSelected = isStart || isEnd
        const colIndex = i % 7
        const isRangeLeft = isStart || (inRng && colIndex === 0)
        const isRangeRight = isEnd || (inRng && colIndex === 6)

        // Fix: extraído para evitar ternários aninhados
        const dayColor = getDayColor(isSelected, inMonth, today)
        const borderRadius = getBorderRadius(isRangeLeft, isRangeRight)

        const handleDayMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isSelected) {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = dayColor
                e.currentTarget.style.fontWeight = today ? "700" : "400"
            }
        }

        return (
            // Fix: wrapper div com onMouse não é interativo — mover hover state para o button
            <div
                key={day.toISOString()}
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 40,
                    background: inRng ? GREEN_LIGHT : "transparent",
                    borderRadius,
                }}
            >
                <button
                    type="button"
                    onClick={() => inMonth && handleDayClick(day)}
                    onMouseEnter={e => {
                        setHovered(day)
                        if (inMonth && !isSelected) {
                            e.currentTarget.style.background = GREEN_LIGHT
                            e.currentTarget.style.color = GREEN
                            e.currentTarget.style.fontWeight = "600"
                        }
                    }}
                    onMouseLeave={(e) => {
                        setHovered(null)
                        handleDayMouseLeave(e)
                    }}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: today && !isSelected ? `2px solid ${GREEN}` : "2px solid transparent",
                        background: isSelected ? GREEN : "transparent",
                        color: dayColor,
                        fontSize: 13,
                        fontWeight: isSelected || today ? 700 : 400,
                        cursor: inMonth ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        position: "relative",
                        zIndex: 1,
                        outline: "none",
                        fontFamily: "inherit",
                    }}
                >
                    {format(day, "d")}
                </button>
            </div>
        )
    }

    const renderMonth = (month: Date) => {
        const days = buildCalendar(month)

        return (
            <div style={{ minWidth: 280 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    {month === leftMonth ? (
                        <button
                            type="button"
                            onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
                            style={navBtnStyle}
                            onMouseEnter={e => (e.currentTarget.style.background = GREEN_LIGHT)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            <ChevronLeft size={16} color={GREEN} />
                        </button>
                    ) : <div style={{ width: 32 }} />}

                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
                        {format(month, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
                    </span>

                    {month === rightMonth ? (
                        <button
                            type="button"
                            onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
                            style={navBtnStyle}
                            onMouseEnter={e => (e.currentTarget.style.background = GREEN_LIGHT)}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                            <ChevronRight size={16} color={GREEN} />
                        </button>
                    ) : <div style={{ width: 32 }} />}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
                    {weekDays.map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af", paddingBottom: 8, letterSpacing: "0.5px" }}>
                            {d}
                        </div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
                    {days.map((day, i) => renderDay(day, i, month))}
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: "relative", display: "inline-block" }} className={className} ref={ref}>
            <button
                id={id}
                type="button"
                onClick={() => setOpen(!open)}
                style={{
                    height: 40,
                    minWidth: 260,
                    border: open ? `1.5px solid ${GREEN}` : "1.5px solid #d1d5db",
                    borderRadius: 3,
                    padding: "0 12px",
                    fontSize: 13,
                    color: value?.from ? "#1a1a1a" : "#9ca3af",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                    outline: "none",
                    boxShadow: open ? `0 0 0 3px ${GREEN}22` : "none",
                    fontFamily: "inherit",
                    width: "100%",
                }}
            >
                <CalendarDays size={14} color={value?.from ? GREEN : "#9ca3af"} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: "left" }}>{formatLabel()}</span>
                {value?.from && (
                    <X
                        size={14}
                        color="#9ca3af"
                        style={{ flexShrink: 0, cursor: "pointer" }}
                        onClick={handleClear}
                    />
                )}
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 50,
                        top: 48,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                        padding: 20,
                        display: "flex",
                        gap: 32,
                        flexDirection: "row",
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                >
                    {renderMonth(leftMonth)}
                    <div style={{ width: 1, background: "#f0f0f0", margin: "0 -8px" }} />
                    {renderMonth(rightMonth)}

                    {value?.from && value?.to && (
                        <div style={{
                            position: "absolute",
                            bottom: 16,
                            right: 20,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                        }}>
                            <button
                                type="button"
                                onClick={() => { onChange(undefined); setSelecting("from") }}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    fontSize: 13,
                                    color: "#6b7280",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    padding: "6px 10px",
                                    fontFamily: "inherit",
                                }}
                            >
                                Limpar
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                style={{
                                    background: GREEN,
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "8px 18px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = GREEN_DARK)}
                                onMouseLeave={e => (e.currentTarget.style.background = GREEN)}
                            >
                                Confirmar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const navBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.15s",
    outline: "none",
}