import type { WeatherReport } from "@/lib/open-meteo";
import {
	backgroundForCode,
	describeWeather,
	windDirArrow,
	windDirText,
} from "@/lib/weather-codes";
import { fmtTemp, fmtWind, fmtPrecip, type UnitPrefs } from "@/lib/units";
import { shiftColor } from "@/lib/color";

interface Props {
	report: WeatherReport;
	prefs: UnitPrefs;
	bg?: string | null;
	fg?: string | null;
}

function dayLabel(dateStr: string, i: number): string {
	if (i === 0) return "Today";
	if (i === 1) return "Tomorrow";
	return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

function WeatherIcon({
	code,
	isDay,
	size,
}: {
	code: number;
	isDay: boolean;
	size: number;
}) {
	const info = describeWeather(code);
	const emoji = !isDay && (code === 0 || code === 1) ? "🌙" : info.emoji;
	return <div style={{ fontSize: size, lineHeight: 1 }}>{emoji}</div>;
}

export function WeatherCard({
	report,
	prefs,
	bg: bgOverride,
	fg: fgOverride,
}: Props) {
	const { current, daily, location } = report;
	const info = describeWeather(current.weatherCode);
	const bg =
		bgOverride ?? backgroundForCode(current.weatherCode, current.isDay);
	const textColor = fgOverride ?? (current.isDay ? "#0f172a" : "#f8fafc");
	const subtle = fgOverride
		? shiftColor(fgOverride, current.isDay ? -0.35 : 0.35)
		: current.isDay
			? "#334155"
			: "#cbd5e1";
	const cardBg = current.isDay
		? "rgba(255,255,255,0.42)"
		: "rgba(15,23,42,0.42)";

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				padding: "48px 64px",
				background: bg,
				color: textColor,
				fontFamily: "Geist Mono",
			}}
		>
			<div
				style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}
			>
				<div style={{ fontSize: 28, color: subtle, letterSpacing: 2 }}>
					WEATHER FOR
				</div>
				<div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
					<div style={{ fontSize: 72, fontWeight: 700 }}>
						{location.name || "Unknown"}
					</div>
					{location.country ? (
						<div style={{ fontSize: 32, color: subtle }}>
							{location.country}
						</div>
					) : null}
				</div>
				<div style={{ fontSize: 22, color: subtle, marginTop: 6 }}>
					{location.lat.toFixed(3)}, {location.lon.toFixed(3)} •{" "}
					{location.timezone}
				</div>
			</div>

			<div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48 }}>
				<div
					style={{ display: "flex", alignItems: "center", gap: 28, flex: 1 }}
				>
					<WeatherIcon
						code={current.weatherCode}
						isDay={current.isDay}
						size={180}
					/>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<div style={{ fontSize: 130, fontWeight: 800, lineHeight: 1 }}>
							{fmtTemp(current.tempC, prefs)}
						</div>
						<div style={{ fontSize: 32, color: subtle, marginTop: 8 }}>
							{info.label}
						</div>
						<div style={{ fontSize: 24, color: subtle }}>
							Feels like {fmtTemp(current.feelsLikeC, prefs)}
						</div>
					</div>
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						background: cardBg,
						borderRadius: 24,
						padding: "20px 28px",
						gap: 8,
						minWidth: 280,
					}}
				>
					<Stat label="Humidity" value={`${current.humidity}%`} />
					<Stat
						label="Wind"
						value={`${windDirArrow(current.windDirDeg)} ${windDirText(current.windDirDeg)} ${fmtWind(current.windKmh, prefs)}`}
					/>
					<Stat
						label="Pressure"
						value={`${Math.round(current.pressureHpa)} hPa`}
					/>
					<Stat
						label="Precip"
						value={fmtPrecip(current.precipitationMm, prefs)}
					/>
					{current.uvIndex != null ? (
						<Stat label="UV index" value={current.uvIndex.toFixed(1)} />
					) : null}
				</div>
			</div>

			<div style={{ display: "flex", gap: 16, marginTop: 24 }}>
				{daily.map((d, i) => {
					const di = describeWeather(d.weatherCode);
					return (
						<div
							key={d.date}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								flex: 1,
								background: cardBg,
								borderRadius: 20,
								padding: "16px 12px",
							}}
						>
							<div style={{ fontSize: 22, color: subtle }}>
								{dayLabel(d.date, i)}
							</div>
							<div style={{ fontSize: 56, lineHeight: 1.1 }}>{di.emoji}</div>
							<div style={{ fontSize: 28, fontWeight: 600 }}>
								{fmtTemp(d.maxC, prefs)}
							</div>
							<div style={{ fontSize: 22, color: subtle }}>
								{fmtTemp(d.minC, prefs)}
							</div>
						</div>
					);
				})}
			</div>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: 18,
					color: subtle,
					marginTop: 16,
				}}
			>
				<div style={{ display: "flex" }}>powered by open-meteo.com</div>
				<div style={{ display: "flex" }}>{current.time}</div>
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "baseline",
				gap: 16,
				fontSize: 24,
			}}
		>
			<div style={{ display: "flex", color: "inherit", opacity: 0.7 }}>
				{label}
			</div>
			<div style={{ display: "flex", fontWeight: 700 }}>{value}</div>
		</div>
	);
}
