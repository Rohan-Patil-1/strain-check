const GUIDANCE = {
  en: {
    name: "English",
    title: "Plain-language review",
    insufficient: "Not enough visible body landmarks were available for a dependable posture review.",
    low: "The sampled posture is in the lower screening range. Keep reviewing the original video and normal work conditions.",
    medium: "The sampled posture suggests a moderate screening concern. Consider adjusting the work height, reach, or task pace.",
    high: "The sampled posture suggests a high screening concern. Review the task promptly with a qualified ergonomics professional.",
    very_high: "The sampled posture suggests a very high screening concern. Stop and seek qualified ergonomics guidance before changing the task.",
    disclaimer: "This is a prototype screening signal, not medical, legal, or workplace-safety advice.",
  },
  es: {
    name: "Español",
    title: "Revisión en lenguaje sencillo",
    insufficient: "No se observaron suficientes puntos corporales para una revisión postural confiable.",
    low: "La postura muestreada está en el rango inferior de detección. Revise el video y las condiciones normales de trabajo.",
    medium: "La postura muestreada sugiere una preocupación moderada. Considere ajustar la altura, el alcance o el ritmo de la tarea.",
    high: "La postura muestreada sugiere una preocupación alta. Revise la tarea pronto con un profesional de ergonomía.",
    very_high: "La postura muestreada sugiere una preocupación muy alta. Deténgase y busque orientación de ergonomía calificada.",
    disclaimer: "Esta es una señal de detección de prototipo, no asesoramiento médico, legal ni de seguridad laboral.",
  },
  hi: {
    name: "हिन्दी",
    title: "सरल भाषा में समीक्षा",
    insufficient: "विश्वसनीय मुद्रा समीक्षा के लिए पर्याप्त शरीर-बिंदु दिखाई नहीं दिए।",
    low: "विश्लेषित मुद्रा कम जोखिम वाली स्क्रीनिंग सीमा में है। मूल वीडियो और सामान्य कार्य परिस्थितियों की समीक्षा करते रहें।",
    medium: "विश्लेषित मुद्रा मध्यम चिंता दिखाती है। कार्य की ऊंचाई, पहुंच या गति बदलने पर विचार करें।",
    high: "विश्लेषित मुद्रा अधिक चिंता दिखाती है। योग्य एर्गोनॉमिक्स विशेषज्ञ के साथ कार्य की जल्द समीक्षा करें।",
    very_high: "विश्लेषित मुद्रा बहुत अधिक चिंता दिखाती है। कार्य बदलने से पहले योग्य एर्गोनॉमिक्स सलाह लें।",
    disclaimer: "यह केवल प्रोटोटाइप स्क्रीनिंग संकेत है, चिकित्सा, कानूनी या कार्य-सुरक्षा सलाह नहीं।",
  },
};

export function availableLanguages() {
  return Object.entries(GUIDANCE).map(([code, content]) => ({ code, name: content.name }));
}

export function buildGuidance(riskLevel, language = "en") {
  const content = GUIDANCE[language] ?? GUIDANCE.en;
  const key = ["low", "medium", "high", "very_high"].includes(riskLevel)
    ? riskLevel
    : "insufficient";
  return {
    language,
    languageName: content.name,
    title: content.title,
    message: content[key],
    disclaimer: content.disclaimer,
  };
}
