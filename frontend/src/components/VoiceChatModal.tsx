import React, { useState, useEffect, useRef } from 'react';
import type { DashboardData } from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  Globe,
  AlertCircle
} from 'lucide-react';

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  dashboardData: DashboardData | null;
  onAnalyzeQuery?: (query: string) => void;
}

type Language = 'kn-IN' | 'en-IN';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  dashboardData,
  onAnalyzeQuery
}) => {
  const [lang, setLang] = useState<Language>('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Namaskara! I am FarmWise Voice Assistant. You can speak in English or Kannada to ask about milk production, heat stress alerts, or compare feed strategies.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition start failed:', e);
      }
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95; // Clear natural pace for farmers

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const generateAnswer = (queryText: string): { response: string; action?: () => void } => {
    const q = queryText.toLowerCase();

    // 1. Milk production queries
    if (q.includes('milk') || q.includes('production') || q.includes('ಹಾಲು') || q.includes('ಉತ್ಪಾದನೆ')) {
      const curr = dashboardData?.daily_production.current_litres ?? 410.0;
      const base = dashboardData?.daily_production.baseline_litres ?? 445.0;
      const drop = base - curr;
      const resp = lang === 'kn-IN'
        ? `ಇಂದು ನಿಮ್ಮ ಫಾರ್ಮ್‌ನಲ್ಲಿ ${curr} ಲೀಟರ್ ಹಾಲು ಉತ್ಪಾದನೆಯಾಗಿದೆ. ಹಿಂದಿನ ಸಾಮಾನ್ಯ ಮಟ್ಟ ${base} ಲೀಟರ್ ಆಗಿತ್ತು. ಬಿಸಿಲಿನ ತಾಪಮಾನದಿಂದಾಗಿ ${drop} ಲೀಟರ್ ಇಳಿಕೆಯಾಗಿದೆ.`
        : `Today your herd produced ${curr} litres of milk, down by ${drop} litres from the ${base} litre baseline due to the Day 11 heatwave.`;
      return { response: resp };
    }

    // 2. Cow KA-MAN-104 / Flagged cow queries
    if (q.includes('104') || q.includes('flagged') || q.includes('cow') || q.includes('ಹಸು') || q.includes('ಜ್ವರ')) {
      const resp = lang === 'kn-IN'
        ? `ಹಸು KA-MAN-104 ಗೆ ಹೆಚ್ಚಿನ ಜ್ವರ (39.9°C), ನಾಡಿಮಿಡಿತ 105 ಮತ್ತು ಉಸಿರಾಟ 74 ಇದೆ. ತಕ್ಷಣ ಪಶುವೈದ್ಯರ ತಪಾಸಣೆ ಮತ್ತು ತಣ್ಣನೆಯ ನೀರಿನ ಸಿಂಪಡಣೆ ಅಗತ್ಯವಿದೆ.`
        : `Cow KA-MAN-104 is flagged for urgent veterinary triage with pyrexia (39.9°C), resting tachycardia (105 BPM vs 48-84 normal), and rapid panting (74 bpm). Immediate cooling and vet examination are required.`;
      return { response: resp };
    }

    // 3. Navigation to Decision Arena / Compare strategies
    if (
      q.includes('arena') ||
      q.includes('strategy') ||
      q.includes('compare') ||
      q.includes('ಅಖಾಡ') ||
      q.includes('ತಂತ್ರ') ||
      q.includes('ಫೀಡ್')
    ) {
      const resp = lang === 'kn-IN'
        ? `ನಿರ್ಧಾರ ಅಖಾಡವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ. ಇಲ್ಲಿ ನೀವು ಕಡಿಮೆ ವೆಚ್ಚದ ಪರ್ಯಾಯ ಆಹಾರ ಸೂತ್ರಗಳನ್ನು ಹೋಲಿಸಬಹುದು.`
        : `Opening the Decision Arena. Here you can evaluate cost-saving feed blends, including DORB and bypass fat, against rising commercial feed prices.`;
      return {
        response: resp,
        action: () => {
          onNavigateTab('arena');
          if (onAnalyzeQuery) {
            onAnalyzeQuery(queryText);
          }
        }
      };
    }

    // 4. Default helpful answer
    const defaultResp = lang === 'kn-IN'
      ? `ನಮಸ್ಕಾರ, ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಹಾಲು ಉತ್ಪಾದನೆ, ಹಸುಗಳ ಆರೋಗ್ಯ ಅಥವಾ ನಿರ್ಧಾರ ಅಖಾಡದ ಬಗ್ಗೆ ಕೇಳಬಹುದು.`
      : `I recorded your query: "${queryText}". You can ask about today's milk yield, check flagged cows, or ask to compare feed alternatives in the Decision Arena.`;
    return { response: defaultResp };
  };

  const handleSendMessage = (customText?: string) => {
    const textToSend = (customText || transcript).trim();
    if (!textToSend) return;

    const userMsg: VoiceMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setTranscript('');

    const answer = generateAnswer(textToSend);

    const botMsg: VoiceMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: answer.response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, botMsg]);
      speakText(answer.response);
      if (answer.action) {
        setTimeout(answer.action, 1500);
      }
    }, 400);
  };

  const quickPrompts = lang === 'kn-IN'
    ? [
        { label: 'ಹಾಲು ಉತ್ಪಾದನೆ', query: 'ಇಂದು ನನ್ನ ಫಾರ್ಮ್‌ನಲ್ಲಿ ಎಷ್ಟು ಹಾಲು ಉತ್ಪಾದನೆಯಾಗಿದೆ?' },
        { label: 'KA-MAN-104 ಹಸು', query: 'ಹಸು KA-MAN-104 ಅನ್ನು ಏಕೆ ಪರಿಶೀಲಿಸಬೇಕು?' },
        { label: 'ನಿರ್ಧಾರ ಅಖಾಡ', query: 'ನಿರ್ಧಾರ ಅಖಾಡವನ್ನು ತೆರೆಯಿರಿ' }
      ]
    : [
        { label: 'Today\'s Milk Yield', query: 'How much milk did my farm produce today?' },
        { label: 'Why is KA-MAN-104 flagged?', query: 'Why is cow KA-MAN-104 flagged for a vet?' },
        { label: 'Compare Feed Strategies', query: 'Compare feed strategies in the Decision Arena' }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border transition-all ${
              isListening
                ? 'bg-rose-500/30 text-rose-300 border-rose-500 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">FarmWise Voice Assistant</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Multilingual AI
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Voice interaction in Kannada and English
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en-IN' ? 'kn-IN' : 'en-IN')}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/10 flex items-center gap-1.5 transition"
              title="Switch language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en-IN' ? 'English (EN)' : 'ಕನ್ನಡ (KN)'}</span>
            </button>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`p-2 rounded-xl transition border ${
                voiceEnabled
                  ? 'bg-white/10 text-emerald-300 border-white/10'
                  : 'bg-stone-800 text-stone-500 border-stone-700'
              }`}
              title={voiceEnabled ? 'Voice output enabled' : 'Voice output muted'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              aria-label="Close voice modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-stone-50/50">
          {!speechSupported && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Microphone speech recognition is not supported in this browser. You can type queries below in English or Kannada.
              </span>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-xs'
                    : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isListening && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Listening in {lang === 'kn-IN' ? 'Kannada' : 'English'}... Speak now</span>
            </div>
          )}

          {isSpeaking && (
            <div className="flex items-center justify-between p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-sky-600 animate-bounce" />
                <span>Speaking response...</span>
              </div>
              <button
                onClick={stopSpeaking}
                className="text-[10px] font-bold text-sky-700 hover:text-sky-900 underline"
              >
                Stop Audio
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2.5 bg-white border-t border-stone-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Try:</span>
          </span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp.query)}
              className="text-[11px] font-medium px-3 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 rounded-full border border-stone-200 hover:border-emerald-300 transition whitespace-nowrap shrink-0"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input & Microphone Controls */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder={
                  lang === 'kn-IN'
                    ? 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ...'
                    : 'Speak or type your question here...'
                }
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition pr-10"
              />
              {transcript && (
                <button
                  onClick={() => setTranscript('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mic Toggle Button */}
            {speechSupported && (
              <button
                onClick={toggleListening}
                className={`p-3 rounded-2xl font-bold transition flex items-center justify-center shadow-xs ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200 animate-pulse'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
                title={isListening ? 'Stop listening' : 'Start microphone listening'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!transcript.trim()}
              className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold transition flex items-center justify-center shadow-xs"
              title="Submit message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>
              {speechSupported ? 'Tap mic to talk or edit text above before sending' : 'Type message and press Enter'}
            </span>
            <span className="font-semibold text-stone-500">
              {lang === 'kn-IN' ? 'ಕನ್ನಡ (kn-IN)' : 'English (en-IN)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
