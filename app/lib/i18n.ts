/**
 * Translations for the labels and condition names
 */

export type Lang =
	| "en"
	| "fr"
	| "de"
	| "es"
	| "it"
	| "pt"
	| "ru"
	| "zh"
	| "ja"
	| "ko"
	| "nl"
	| "pl"
	| "tr"
	| "uk";

const LABELS: Record<string, Partial<Record<Lang, string>>> = {
	weather_report: {
		en: "Weather report",
		fr: "Bulletin météo",
		de: "Wetterbericht",
		es: "Informe meteorológico",
		it: "Bollettino meteo",
		pt: "Boletim meteorológico",
		ru: "Прогноз погоды",
		zh: "天气预报",
		ja: "天気予報",
		ko: "날씨 예보",
		nl: "Weerbericht",
		pl: "Prognoza pogody",
		tr: "Hava durumu",
		uk: "Прогноз погоди",
	},
	morning: {
		en: "Morning",
		fr: "Matin",
		de: "Morgen",
		es: "Mañana",
		it: "Mattina",
		pt: "Manhã",
		ru: "Утро",
		zh: "早晨",
		ja: "朝",
		ko: "아침",
		nl: "Ochtend",
		pl: "Rano",
		tr: "Sabah",
		uk: "Ранок",
	},
	noon: {
		en: "Noon",
		fr: "Midi",
		de: "Mittag",
		es: "Mediodía",
		it: "Mezzogiorno",
		pt: "Meio-dia",
		ru: "День",
		zh: "中午",
		ja: "昼",
		ko: "정오",
		nl: "Middag",
		pl: "Południe",
		tr: "Öğle",
		uk: "Полудень",
	},
	evening: {
		en: "Evening",
		fr: "Soir",
		de: "Abend",
		es: "Tarde",
		it: "Sera",
		pt: "Tarde",
		ru: "Вечер",
		zh: "傍晚",
		ja: "夕方",
		ko: "저녁",
		nl: "Avond",
		pl: "Wieczór",
		tr: "Akşam",
		uk: "Вечір",
	},
	night: {
		en: "Night",
		fr: "Nuit",
		de: "Nacht",
		es: "Noche",
		it: "Notte",
		pt: "Noite",
		ru: "Ночь",
		zh: "夜间",
		ja: "夜",
		ko: "밤",
		nl: "Nacht",
		pl: "Noc",
		tr: "Gece",
		uk: "Ніч",
	},
	location_not_found: {
		en: "We were unable to find your location",
		fr: "Lieu introuvable",
		de: "Ort nicht gefunden",
		es: "Ubicación no encontrada",
		zh: "未找到该地点",
		ja: "場所が見つかりません",
	},
};

// WMO weather code -> localized label
const CONDITION_LABELS: Record<number, Partial<Record<Lang, string>>> = {
	0: {
		en: "Clear",
		fr: "Ciel dégagé",
		de: "Klar",
		es: "Despejado",
		zh: "晴",
		ja: "快晴",
	},
	1: {
		en: "Mainly clear",
		fr: "Plutôt dégagé",
		de: "Überwiegend klar",
		es: "Mayormente despejado",
		zh: "大部晴",
		ja: "概ね晴れ",
	},
	2: {
		en: "Partly cloudy",
		fr: "Partiellement nuageux",
		de: "Teils bewölkt",
		es: "Parcialmente nublado",
		zh: "局部多云",
		ja: "晴れ時々曇り",
	},
	3: {
		en: "Overcast",
		fr: "Couvert",
		de: "Bedeckt",
		es: "Nublado",
		zh: "阴",
		ja: "曇り",
	},
	45: {
		en: "Fog",
		fr: "Brouillard",
		de: "Nebel",
		es: "Niebla",
		zh: "雾",
		ja: "霧",
	},
	48: {
		en: "Rime fog",
		fr: "Brouillard givrant",
		de: "Reifnebel",
		es: "Niebla helada",
		zh: "雾凇",
		ja: "霧氷",
	},
	51: {
		en: "Light drizzle",
		fr: "Bruine légère",
		de: "Leichter Nieselregen",
		es: "Llovizna ligera",
		zh: "小毛毛雨",
		ja: "弱い霧雨",
	},
	53: {
		en: "Drizzle",
		fr: "Bruine",
		de: "Nieselregen",
		es: "Llovizna",
		zh: "毛毛雨",
		ja: "霧雨",
	},
	55: {
		en: "Heavy drizzle",
		fr: "Bruine forte",
		de: "Starker Nieselregen",
		es: "Llovizna intensa",
		zh: "大毛毛雨",
		ja: "強い霧雨",
	},
	56: {
		en: "Freezing drizzle",
		fr: "Bruine verglaçante",
		de: "Gefrierender Niesel",
		zh: "冻毛毛雨",
	},
	57: {
		en: "Heavy freezing drizzle",
		fr: "Bruine verglaçante forte",
		de: "Starker gefrierender Niesel",
		zh: "强冻毛毛雨",
	},
	61: {
		en: "Light rain",
		fr: "Pluie légère",
		de: "Leichter Regen",
		es: "Lluvia ligera",
		zh: "小雨",
		ja: "弱い雨",
	},
	63: {
		en: "Rain",
		fr: "Pluie",
		de: "Regen",
		es: "Lluvia",
		zh: "雨",
		ja: "雨",
	},
	65: {
		en: "Heavy rain",
		fr: "Pluie forte",
		de: "Starker Regen",
		es: "Lluvia intensa",
		zh: "大雨",
		ja: "強い雨",
	},
	66: {
		en: "Freezing rain",
		fr: "Pluie verglaçante",
		de: "Gefrierender Regen",
		zh: "冻雨",
	},
	67: {
		en: "Heavy freezing rain",
		fr: "Pluie verglaçante forte",
		de: "Starker gefrierender Regen",
		zh: "强冻雨",
	},
	71: {
		en: "Light snow",
		fr: "Neige légère",
		de: "Leichter Schnee",
		es: "Nevada ligera",
		zh: "小雪",
		ja: "弱い雪",
	},
	73: {
		en: "Snow",
		fr: "Neige",
		de: "Schnee",
		es: "Nieve",
		zh: "雪",
		ja: "雪",
	},
	75: {
		en: "Heavy snow",
		fr: "Neige forte",
		de: "Starker Schnee",
		es: "Nevada intensa",
		zh: "大雪",
		ja: "強い雪",
	},
	77: {
		en: "Snow grains",
		fr: "Grains de neige",
		de: "Schneegriesel",
		zh: "雪粒",
	},
	80: {
		en: "Rain showers",
		fr: "Averses",
		de: "Regenschauer",
		es: "Chubascos",
		zh: "阵雨",
		ja: "にわか雨",
	},
	81: {
		en: "Heavy rain showers",
		fr: "Fortes averses",
		de: "Starke Regenschauer",
		es: "Chubascos intensos",
		zh: "强阵雨",
	},
	82: {
		en: "Violent rain showers",
		fr: "Averses violentes",
		de: "Heftige Regenschauer",
		zh: "暴雨",
	},
	85: {
		en: "Snow showers",
		fr: "Averses de neige",
		de: "Schneeschauer",
		zh: "阵雪",
	},
	86: {
		en: "Heavy snow showers",
		fr: "Fortes averses de neige",
		de: "Starke Schneeschauer",
		zh: "强阵雪",
	},
	95: {
		en: "Thunderstorm",
		fr: "Orage",
		de: "Gewitter",
		es: "Tormenta",
		zh: "雷暴",
		ja: "雷雨",
	},
	96: {
		en: "Thunderstorm w/ hail",
		fr: "Orage avec grêle",
		de: "Gewitter mit Hagel",
		zh: "雷暴伴冰雹",
	},
	99: {
		en: "Severe thunderstorm",
		fr: "Violent orage",
		de: "Schweres Gewitter",
		zh: "强雷暴",
	},
};

export function isLang(s: string): s is Lang {
	return [
		"en",
		"fr",
		"de",
		"es",
		"it",
		"pt",
		"ru",
		"zh",
		"ja",
		"ko",
		"nl",
		"pl",
		"tr",
		"uk",
	].includes(s);
}

export function t(key: string, lang: Lang): string {
	return LABELS[key]?.[lang] ?? LABELS[key]?.en ?? key;
}

export function conditionLabel(code: number, lang: Lang): string {
	return (
		CONDITION_LABELS[code]?.[lang] ?? CONDITION_LABELS[code]?.en ?? "Unknown"
	);
}
