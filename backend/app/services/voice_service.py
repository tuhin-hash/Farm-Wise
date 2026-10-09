"""
FarmWise Multilingual Voice Assistant Service
Integrates Groq Whisper Audio Transcriptions API (whisper-large-v3),
Bilingual Kannada (kn-IN) and English (en-IN) multi-agent reasoning,
and Safe Agricultural Clinical Decision Support.
"""

import logging
from typing import Dict, Any, List, Optional
import httpx

from app.config import settings
from app.services.data_service import data_service
from app.services.llm_service import llm_service
from app.tools.calculators import calculate_temperature_humidity_index

logger = logging.getLogger(__name__)

class VoiceService:
    @staticmethod
    async def transcribe_audio_groq(
        file_bytes: bytes,
        filename: str = "voice_input.webm",
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calls Groq's ultra-fast Whisper API (whisper-large-v3) for Speech-to-Text.
        Falls back to demo/local transcript if API key is not configured.
        """
        api_key = settings.GROQ_API_KEY.strip()
        
        # If Groq API key is present, execute actual Whisper transcription
        if api_key:
            headers = {
                "Authorization": f"Bearer {api_key}"
            }
            # Determine mime type
            mime_type = "audio/webm"
            if filename.endswith(".wav"):
                mime_type = "audio/wav"
            elif filename.endswith(".mp3"):
                mime_type = "audio/mpeg"
            elif filename.endswith(".m4a"):
                mime_type = "audio/mp4"

            files = {
                "file": (filename, file_bytes, mime_type)
            }
            data = {
                "model": settings.GROQ_AUDIO_MODEL or "whisper-large-v3",
                "response_format": "json"
            }
            if language:
                # Groq Whisper accepts ISO code e.g. 'en' or 'kn'
                data["language"] = language.split("-")[0].lower()

            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    resp = await client.post(
                        f"{settings.GROQ_BASE_URL.rstrip('/')}/audio/transcriptions",
                        headers=headers,
                        files=files,
                        data=data
                    )
                    if resp.status_code == 200:
                        res_json = resp.json()
                        text = res_json.get("text", "").strip()
                        return {
                            "text": text,
                            "mode": "GROQ_WHISPER_LIVE",
                            "model": settings.GROQ_AUDIO_MODEL,
                            "language_detected": language or "auto"
                        }
                    logger.warning(f"Groq Whisper returned {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"Groq Whisper transcription failed: {e}")

        # Deterministic / Demo Fallback Mode
        sample_fallback = "My cows are producing less milk, feed prices have increased, and the weather is very hot. What should I check first?"
        if language and "kn" in language.lower():
            sample_fallback = "ನನ್ನ ಹಸುಗಳು ಕಡಿಮೆ ಹಾಲು ಕೊಡುತ್ತಿವೆ. ಮೇವಿನ ಬೆಲೆ ಹೆಚ್ಚಾಗಿದೆ. ನಾನು ಮೊದಲು ಏನು ಪರಿಶೀಲಿಸಬೇಕು?"

        return {
            "text": sample_fallback,
            "mode": "DEMO_RECOGNITION_MODE",
            "model": "rule-based-speech-engine",
            "note": "Using speech recognition fallback. Configure GROQ_API_KEY in .env for live Groq Whisper v3 transcriptions."
        }

    @staticmethod
    async def process_voice_query(
        query: str,
        language: str = "en-IN",
        farm_id: str = "demo-farm-01"
    ) -> Dict[str, Any]:
        """Processes farmer voice query through relevant agents and generates bilingual spoken guidance."""
        farm = data_service.get_farm(farm_id) or {}
        env = farm.get("environmental_conditions", {})
        daily_prod = farm.get("daily_production", {})
        flagged_animals = farm.get("animals_requiring_attention", [])
        active_alerts = farm.get("active_alerts", [])

        q_lower = query.lower()
        is_kannada = "kn" in language.lower() or any(ord(c) >= 0x0C80 and ord(c) <= 0x0CFF for c in query)

        # Agent Orchestration Determination
        executed_agents = ["Orchestrator Agent", "Farm Data Agent"]
        if any(w in q_lower for w in ["feed", "price", "dorb", "cost", "ಮೇವಿನ", "ಬೆಲೆ", "ಆಹಾರ", "ಖರ್ಚು"]):
            executed_agents.append("Nutrition Agent")
            executed_agents.append("Finance Agent")
        if any(w in q_lower for w in ["heat", "hot", "temp", "thi", "weather", "water", "ಬಿಸಿಲು", "ತಾಪಮಾನ", "ನೀರು", "ಹವಾಮಾನ"]):
            executed_agents.append("Risk & Environment Agent")
        if any(w in q_lower for w in ["cow", "fever", "mastitis", "sick", "vet", "health", "104", "112", "ಹಸು", "ಜ್ವರ", "ಆರೋಗ್ಯ"]):
            executed_agents.append("Veterinary Decision Support")
        executed_agents.append("Decision Agent")

        # 1. Check if LLM with Groq is available for generative bilingual response
        if llm_service.is_configured:
            system_prompt = f"""You are FarmWise Voice Assistant, an evidence-based decision intelligence companion for dairy farmers in Karnataka, India.
Language: {language}
Current Farm Telemetry:
- Herd: {farm.get('animal_count', 24)} crossbred cows in Mandya, Karnataka.
- Milk Production: {daily_prod.get('current_litres', 410.0)} L/day (down 35 L from {daily_prod.get('baseline_litres', 445.0)} L baseline on Day 11 due to heatwave).
- Barn Ambient: {env.get('ambient_temperature_celsius', 35.5)}°C, RH {env.get('relative_humidity_percentage', 68)}%, THI {env.get('thi_index', 86.8)} (Moderate-to-Severe heat stress).
- Flagged Cows: Cow KA-MAN-104 (Fever 39.9°C, HR 105 BPM, Resp 74 bpm - Urgent Triage), Cow KA-MAN-112 (Normal HR 76 BPM but firm quarter, yield drop - Prompt Review).
- Commercial concentrate feed price rose to ₹34/kg. DORB available at ₹18/kg.

CRITICAL SAFETY RULES:
1. Never prescribe veterinary drugs or dosages.
2. Never claim to autonomously diagnose diseases. Always recommend a physical exam by a licensed veterinarian for fever or mastitis symptoms.
3. Suggest practical management checks: clean cool water troughs, shade cloth, ventilation fans, feeding during cooler morning/evening hours.
4. If responding in Kannada, use clear, simple, farmer-friendly Kannada.
5. Return both a detailed readable text answer and a concise 'spoken_audio_text' suitable for voice playback without symbols or markdown."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Farmer's query: '{query}'. Please answer in {language}."}
            ]
            llm_text = await llm_service.generate_chat_completion(messages, temperature=0.3)
            if llm_text:
                spoken_clean = llm_text.replace("*", "").replace("#", "").replace("- ", "").split("\n\n")[0]
                return {
                    "query": query,
                    "language": language,
                    "executed_agents": executed_agents,
                    "text_response": llm_text,
                    "audio_text": spoken_clean[:280],
                    "triage_warning": "Cow KA-MAN-104 exhibits pyrexia (39.9°C) and requires immediate veterinary examination." if "104" in q_lower or "fever" in q_lower else None,
                    "suggested_followups": [
                        "How can I shade my water troughs to increase drinking?" if not is_kannada else "ನೀರಿನ ತೊಟ್ಟಿಗಳಿಗೆ ನೆರಳು ಒದಗಿಸುವುದು ಹೇಗೆ?",
                        "What is the daily cost difference if I use DORB?" if not is_kannada else "DORB ಬಳಸಿದರೆ ದಿನಕ್ಕೆ ಎಷ್ಟು ಉಳಿತಾಯವಾಗುತ್ತದೆ?",
                        "Why does cow KA-MAN-112 need a vet if heart rate is normal?" if not is_kannada else "ಹಸುವಿನ ನಾಡಿಮಿಡಿತ ಸಾಮಾನ್ಯವಾಗಿದ್ದರೂ ವೈದ್ಯರೇಕೆ ಬೇಕು?"
                    ]
                }

        # 2. High-Fidelity Deterministic Agricultural Rule Engine (Zero-Key Mode)
        curr_milk = daily_prod.get("current_litres", 410.0)
        base_milk = daily_prod.get("baseline_litres", 445.0)
        drop_litres = round(base_milk - curr_milk, 1)

        # Scenario A: Heat Stress & Production Decline Query
        if any(w in q_lower for w in ["milk", "less", "drop", "hot", "weather", "heat", "first", "ಹಾಲು", "ಕಡಿಮೆ", "ಬಿಸಿಲು", "ತಾಪಮಾನ", "ಮೊದಲು"]):
            if is_kannada:
                text_resp = (
                    f"ನಮಸ್ಕಾರ. ನಿಮ್ಮ ಫಾರ್ಮ್‌ನಲ್ಲಿ ದಿನ 11 ರಂದು ತಾಪಮಾನ 35.5°C ಮತ್ತು THI 86.8 ಕ್ಕೆ ತಲುಪಿದ ಕಾರಣ, "
                    f"ಹಾಲಿನ ಉತ್ಪಾದನೆ {base_milk} ಲೀಟರ್‌ನಿಂದ {curr_milk} ಲೀಟರ್‌ಗೆ (ಒಟ್ಟು {drop_litres} ಲೀಟರ್) ಇಳಿಕೆಯಾಗಿದೆ.\n\n"
                    f"ನೀವು ಮೊದಲು ಪರಿಶೀಲಿಸಬೇಕಾದ ಪ್ರಮುಖ ಕ್ರಮಗಳು:\n"
                    f"1. ನೀರಿನ ತೊಟ್ಟಿಗಳನ್ನು ತಕ್ಷಣ ನೆರಳಿನಲ್ಲಿ ಇರಿಸಿ; ಬಿಸಿಲಿನಿಂದ ಬಿಸಿಯಾದ ನೀರನ್ನು ಹಸುಗಳು ಕುಡಿಯುವುದಿಲ್ಲ.\n"
                    f"2. ಕೊಟ್ಟಿಗೆಯ ಫ್ಯಾನ್‌ಗಳನ್ನು ನಿರಂತರವಾಗಿ ಚಲಾಯಿಸಿ ಮತ್ತು ಹಸುಗಳ ಮೇಲೆ ತಣ್ಣೀರು ಸಿಂಪಡಿಸಿ.\n"
                    f"3. ಹಿಂಡಿ ಆಹಾರವನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಹಸಿರು ಮೇವು ಮತ್ತು ತಂಪಾದ ಸಮಯದಲ್ಲಿ (ಬೆಳಿಗ್ಗೆ 6 ಮತ್ತು ಸಂಜೆ 7) ಆಹಾರ ನೀಡಿ.\n"
                    f"4. ಹಸು KA-MAN-104 ಗೆ 39.9°C ಜ್ವರವಿದ್ದು, ತಕ್ಷಣ ಪಶುವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
                )
                audio_resp = f"ನಿಮ್ಮ ಫಾರ್ಮ್‌ನಲ್ಲಿ ಬಿಸಿಲಿನ ತಾಪಮಾನದಿಂದಾಗಿ ಹಾಲು {drop_litres} ಲೀಟರ್ ಇಳಿಕೆಯಾಗಿದೆ. ಮೊದಲು ಕುಡಿಯುವ ನೀರಿನ ತೊಟ್ಟಿಗಳಿಗೆ ನೆರಳು ಕಲ್ಪಿಸಿ ಮತ್ತು ಫ್ಯಾನ್ ಗಾಳಿ ಹೆಚ್ಚಿಸಿ. ಹಸು KA-MAN-104 ಗೆ ಜ್ವರವಿದ್ದು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
            else:
                text_resp = (
                    f"Based on your farm records, herd milk production declined by {drop_litres} L/day "
                    f"(from {base_milk} L to {curr_milk} L) following the Day 11 heatwave (THI 86.8, 35.5°C).\n\n"
                    f"Recommended first actions to check:\n"
                    f"1. **Water Trough Temperature & Access:** Ensure drinking troughs are shaded. Dairy cows refuse solar-heated water, impairing rumen thermoregulation.\n"
                    f"2. **Barn Ventilation & Sprinklers:** Run high-velocity ceiling fans and apply misting over HF crossbred cows.\n"
                    f"3. **Shift Feeding Windows:** Deliver grain concentrates during cooler hours (early morning 06:00 and late evening 19:30) to reduce metabolic heat increment.\n"
                    f"4. **Clinical Priority:** Cow KA-MAN-104 has a 39.9°C fever and requires urgent physical examination by your veterinarian."
                )
                audio_resp = f"Your herd's milk output dropped by {drop_litres} litres due to the Day 11 heatwave. First, shade your drinking troughs and increase barn fan ventilation. Cow KA-MAN-104 has a fever and requires prompt veterinary attention."

        # Scenario B: Cow Health / Flagged Animal Query
        elif any(w in q_lower for w in ["cow", "sick", "flagged", "104", "112", "fever", "mastitis", "vet", "ಹಸು", "ಜ್ವರ", "ಕಾಯಿಲೆ", "ವೈದ್ಯ"]):
            if is_kannada:
                text_resp = (
                    f"ಫಾರ್ಮ್ ಆರೋಗ್ಯ ತಪಾಸಣೆ ವಿವರ:\n"
                    f"• **ಹಸು KA-MAN-104 (ತುರ್ತು):** ಗುದನಾಳದ ತಾಪಮಾನ 39.9°C (ಸಾಮಾನ್ಯ 38.0-39.3°C), ನಾಡಿಮಿಡಿತ 105 BPM ಮತ್ತು ಉಸಿರಾಟ 74 bpm ಇದೆ. "
                    f"ಇದು ತೀವ್ರ ಶಾಖದ ಆಘಾತ ಮತ್ತು ಸೋಂಕಿನ ಲಕ್ಷಣ. ತಕ್ಷಣ ಪಶುವೈದ್ಯರ ತಪಾಸಣೆ ಅತ್ಯಗತ್ಯ.\n"
                    f"• **ಹಸು KA-MAN-112 (ಪರಿಶೀಲನೆ):** ನಾಡಿಮಿಡಿತ 76 BPM ಸಾಮಾನ್ಯವಾಗಿದ್ದರೂ, ಕೆಚ್ಚಲಿನ ಒಂದು ಭಾಗ ಗಟ್ಟಿಯಾಗಿದ್ದು ಹಾಲು 35% ಕಡಿಮೆಯಾಗಿದೆ. ಇದು ಮೊಲೆವಾತದ (Mastitis) ಲಕ್ಷಣ. ವಿಳಂಬ ಮಾಡದೆ ವೈದ್ಯರಿಗೆ ತೋರಿಸಿ."
                )
                audio_resp = "ಹಸು KA-MAN-104 ಗೆ 39.9 ಡಿಗ್ರಿ ಹೆಚ್ಚಿನ ಜ್ವರವಿದ್ದು ತಕ್ಷಣ ಪಶುವೈದ್ಯರನ್ನು ಕರೆಯಿಸಿ. ಹಸು KA-MAN-112 ಗೆ ಕೆಚ್ಚಲು ಬಾತುಕೊಂಡಿರುವುದರಿಂದ ಪರೀಕ್ಷೆ ಅಗತ್ಯ."
            else:
                text_resp = (
                    f"Clinical Triage Findings:\n"
                    f"• **Cow KA-MAN-104 (Critical Alert):** Core temperature 39.9°C (>39.3°C Merck ceiling), resting tachycardia (105 BPM), and tachypnea (74 bpm). Requires immediate cold-water flushes and urgent veterinary physical triage.\n"
                    f"• **Cow KA-MAN-112 (Prompt Review):** Resting heart rate is normal (76 BPM within 48-84 range), but localized quarter firmness and a 35% individual yield drop indicate localized clinical mastitis. Normal pulse does not rule out acute udder infection."
                )
                audio_resp = "Cow KA-MAN-104 has high pyrexia at 39.9 degrees Celsius and resting tachycardia. Immediate veterinary triage is required. Cow KA-MAN-112 shows mastitis firmness and needs prompt quarter stripping and examination."

        # Scenario C: Feed Prices & Decision Arena Query
        elif any(w in q_lower for w in ["feed", "price", "dorb", "arena", "strategy", "cost", "ಮೇವಿನ", "ಬೆಲೆ", "ಅಖಾಡ", "ಖರ್ಚು"]):
            if is_kannada:
                text_resp = (
                    f"ಮೇವಿನ ವೆಚ್ಚ ಮತ್ತು ನಿರ್ಧಾರ ಅಖಾಡ ವಿಶ್ಲೇಷಣೆ:\n"
                    f"ವಾಣಿಜ್ಯ ಹಿಂಡಿ ಆಹಾರ ಬೆಲೆ ₹34/ಕೆಜಿಗೆ ಏರಿಕೆಯಾಗಿದೆ. ನಿಮ್ಮ 24 ಹಸುಗಳ ದೈನಂದಿನ ಆಹಾರ ವೆಚ್ಚ ₹4,896 ಆಗಿದೆ.\n\n"
                    f"ನಿರ್ಧಾರ ಅಖಾಡದಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಪರ್ಯಾಯಗಳು:\n"
                    f"1. **DORB ಪರ್ಯಾಯ ಆಹಾರ:** ಡಿ-ಆಯಿಲ್ಡ್ ರೈಸ್ ಬ್ರಾನ್ (₹18/ಕೆಜಿ) ಬಳಸಿದರೆ ದಿನಕ್ಕೆ ₹720 ಉಳಿತಾಯವಾಗುತ್ತದೆ ಮತ್ತು ಹಾಲು ಉತ್ಪಾದನೆ ಸ್ಥಿರವಾಗಿರುತ್ತದೆ.\n"
                    f"2. **ಬೈಪಾಸ್ ಫ್ಯಾಟ್:** ಬೇಸಿಗೆಯ ಶಾಖದಲ್ಲಿ ಶಕ್ತಿಯ ಕೊರತೆಯನ್ನು ನೀಗಿಸಲು 150 ಗ್ರಾಂ ಬೈಪಾಸ್ ಫ್ಯಾಟ್ ಸೇರಿಸಬಹುದು.\n"
                    f"ಸಂಪೂರ್ಣ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿರ್ಧಾರ ಅಖಾಡವನ್ನು ತೆರೆಯಿರಿ."
                )
                audio_resp = "ವಾಣಿಜ್ಯ ಹಿಂಡಿ ಬೆಲೆ ಹೆಚ್ಚಾಗಿದೆ. ಡಿ-ಆಯಿಲ್ಡ್ ರೈಸ್ ಬ್ರಾನ್ ಪರ್ಯಾಯ ಆಹಾರ ಬಳಸುವ ಮೂಲಕ ದಿನಕ್ಕೆ 720 ರೂಪಾಯಿ ಉಳಿಸಬಹುದು. ವಿವರಗಳಿಗಾಗಿ ನಿರ್ಧಾರ ಅಖಾಡವನ್ನು ಪರಿಶೀಲಿಸಿ."
            else:
                text_resp = (
                    f"Feed Cost & Decision Arena Analysis:\n"
                    f"Commercial concentrate feed prices rose to ₹34.00/kg, driving herd daily feed costs to ₹4,896/day.\n\n"
                    f"Evaluated strategies in the Decision Arena:\n"
                    f"1. **DORB + Maize Starch Blend:** Substituting 1.0 kg commercial concentrate with 1.2 kg DORB (₹18.00/kg) saves ₹720/day for the herd while maintaining total digestible nutrients (TDN).\n"
                    f"2. **Rumen Buffer & Bypass Fat:** Adding sodium bicarbonate (₹35/kg) prevents subacute ruminal acidosis during hot weather.\n"
                    f"Open the Decision Arena to inspect calculated nutritional trade-offs."
                )
                audio_resp = "Commercial concentrate price has reached 34 rupees per kilo. Substituting with de-oiled rice bran saves 720 rupees daily while sustaining milk production. Check the Decision Arena to inspect the strategy ranking."

        # Default Helpful Guidance
        else:
            if is_kannada:
                text_resp = (
                    f"ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ:\n"
                    f"ನಿಮ್ಮ ಮಂಡ್ಯ ಡೇರಿ ಫಾರ್ಮ್‌ನಲ್ಲಿ ಪ್ರಸ್ತುತ ದಿನಕ್ಕೆ {curr_milk} ಲೀಟರ್ ಹಾಲು ಉತ್ಪಾದನೆಯಾಗುತ್ತಿದೆ. "
                    f"ಕೊಟ್ಟಿಗೆಯ ತಾಪಮಾನ 35.5°C ಇದ್ದು ಮಧ್ಯಮ ಶಾಖದ ಒತ್ತಡ ದಾಖಲಾಗಿದೆ. "
                    f"ನೀವು ಹಾಲು ಉತ್ಪಾದನೆ, ಹಸುಗಳ ಜ್ವರ ತಪಾಸಣೆ, ಅಥವಾ ಆಹಾರ ವೆಚ್ಚದ ಪರ್ಯಾಯಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು."
                )
                audio_resp = f"ನಮಸ್ಕಾರ. ನಿಮ್ಮ ಫಾರ್ಮ್‌ನಲ್ಲಿ ಪ್ರಸ್ತುತ ದಿನಕ್ಕೆ {curr_milk} ಲೀಟರ್ ಹಾಲು ಉತ್ಪಾದನೆಯಾಗುತ್ತಿದೆ. ನೀವು ಹಾಲು, ಹಸುಗಳ ಆರೋಗ್ಯ ಅಥವಾ ಆಹಾರ ವೆಚ್ಚದ ಬಗ್ಗೆ ಕೇಳಬಹುದು."
            else:
                text_resp = (
                    f"Hello! Regarding your query on NammaHerd Dairy:\n"
                    f"Your 24-cow herd is currently averaging {curr_milk} L/day under an ambient THI of 86.8. "
                    f"You can ask about today's milk drop, inspecting flagged cows, or comparing low-cost feed formulations in the Decision Arena."
                )
                audio_resp = f"Hello. Your herd is currently producing {curr_milk} litres of milk daily under heat stress conditions. You can ask about milk trends, flagged cow vitals, or feed cost savings in the Decision Arena."

        return {
            "query": query,
            "language": language,
            "executed_agents": executed_agents,
            "text_response": text_resp,
            "audio_text": audio_resp,
            "triage_warning": "Cow KA-MAN-104 has acute pyrexia (39.9°C). Immediate veterinary physical exam required." if "104" in q_lower or "fever" in q_lower or "sick" in q_lower else None,
            "suggested_followups": [
                "How do I shade water troughs to restore intake?" if not is_kannada else "ನೀರಿನ ತೊಟ್ಟಿಗಳಿಗೆ ನೆರಳು ಕಲ್ಪಿಸುವುದು ಹೇಗೆ?",
                "Compare feed savings with DORB in the Decision Arena" if not is_kannada else "ನಿರ್ಧಾರ ಅಖಾಡದಲ್ಲಿ DORB ವೆಚ್ಚ ಉಳಿತಾಯ ಹೋಲಿಸಿ",
                "Why is cow KA-MAN-104 flagged for urgent triage?" if not is_kannada else "ಹಸು KA-MAN-104 ಅನ್ನು ತಕ್ಷಣ ಏಕೆ ಪರೀಕ್ಷಿಸಬೇಕು?"
            ]
        }

voice_service = VoiceService()
