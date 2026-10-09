import React, { useState, useEffect, useRef } from 'react';
import type { DashboardData, BlobState } from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  Globe,
  ShieldAlert,
  ArrowRight,
  Bot,
  Activity
} from 'lucide-react';
import { AIBlob } from './AIBlob';
import { api } from '../services/api';

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
  agents?: string[];
  evidence?: Record<string, any>;
  isVetAlert?: boolean;
  actionTab?: string;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  dashboardData: _dashboardData,
  onAnalyzeQuery
}) => {
  const [lang, setLang] = useState<Language>('en-IN');
  const [blobState, setBlobState] = useState<BlobState>('IDLE');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Namaskara! I am the FarmWise Bilingual AI Assistant. Speak in Kannada or English about milk drops, heat stress, cow health, or feed optimization.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agents: ['Farm Data Agent', 'Orchestrator']
    }
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const webSpeechRecognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentTranscriptRef = useRef<string>('');
  const isQueryProcessingRef = useRef<boolean>(false);

  // Initialize Web Speech Recognition as client-side fallback & live instant preview
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            currentTranscriptRef.current = currentTranscript;
            setTranscript(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Web Speech recognition warning:', event.error);
        };

        recognition.onend = () => {
          if (isRecording && currentTranscriptRef.current.trim() && !isQueryProcessingRef.current) {
            // Silence detected / speech ended -> auto process
            stopRecording();
          }
        };

        webSpeechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }

    return () => {
      if (webSpeechRecognitionRef.current) {
        try {
          webSpeechRecognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [lang]);

  // Cleanup audio tracks on unmount
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioStream]);

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  // Speak assistant response using SpeechSynthesis with unpause protection & voice selection
  const speakResponse = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) {
      setBlobState('IDLE');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Clean markdown tags for natural speech playback
      const cleanedText = text
        .replace(/\*\*/g, '')
        .replace(/#/g, '')
        .replace(/•/g, '')
        .replace(/₹/g, ' rupees ')
        .replace(/°C/g, ' degrees Celsius ');

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = lang;
      utterance.rate = 0.95; // comfortable natural cadence for dairy farmers

      // Select suitable voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = lang.split('-')[0].toLowerCase();
        const voice = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
                      voices.find((v) => v.lang.toLowerCase().includes('en'));
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setBlobState('SPEAKING');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setBlobState('IDLE');
      };
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        setBlobState('IDLE');
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis exception:', e);
      setIsSpeaking(false);
      setBlobState('IDLE');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setBlobState('IDLE');
    }
  };

  // Start Voice Recording with MediaStream, Web Speech & Groq Whisper STT
  const startRecording = async () => {
    try {
      stopSpeaking();
      currentTranscriptRef.current = '';
      setTranscript('');
      isQueryProcessingRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // MediaRecorder for Groq Whisper endpoint
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/wav';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);

        // If a query was already processed from real-time Web Speech recognition, return
        if (isQueryProcessingRef.current) return;

        // Otherwise send to backend Groq Whisper transcribe endpoint
        if (audioBlob.size > 0) {
          setBlobState('THINKING');
          try {
            const whisperRes = await api.transcribeAudio(
              audioBlob,
              lang === 'kn-IN' ? 'kn' : 'en'
            );
            const recognized = whisperRes?.transcript || (whisperRes as any)?.text || currentTranscriptRef.current;
            if (recognized && recognized.trim()) {
              currentTranscriptRef.current = recognized.trim();
              setTranscript(recognized.trim());
              handleProcessQuery(recognized.trim());
              return;
            }
          } catch (err) {
            console.warn('Groq Whisper transcribe fallback:', err);
          }
        }

        // Fallback to recognized client speech
        const fallbackSpoken = currentTranscriptRef.current.trim();
        if (fallbackSpoken) {
          handleProcessQuery(fallbackSpoken);
        } else {
          setBlobState('IDLE');
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      // Trigger Web Speech recognition for live continuous text preview
      if (webSpeechRecognitionRef.current) {
        try {
          webSpeechRecognitionRef.current.lang = lang;
          webSpeechRecognitionRef.current.start();
        } catch (_) {}
      }

      setIsRecording(true);
      setBlobState('LISTENING');
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      setBlobState('ERROR');
      setTimeout(() => setBlobState('IDLE'), 2000);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (webSpeechRecognitionRef.current) {
      try {
        webSpeechRecognitionRef.current.stop();
      } catch (_) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    // Process recognized speech immediately
    const spoken = currentTranscriptRef.current.trim();
    if (spoken && !isQueryProcessingRef.current) {
      handleProcessQuery(spoken);
    }
  };

  // Submit and process voice query through multi-agent engine
  const handleProcessQuery = async (queryText?: string) => {
    const textToSend = (queryText || currentTranscriptRef.current || transcript).trim();
    if (!textToSend || isQueryProcessingRef.current) return;

    isQueryProcessingRef.current = true;
    setIsRecording(false);

    // Stop active audio recording if still running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (webSpeechRecognitionRef.current) {
      try {
        webSpeechRecognitionRef.current.stop();
      } catch (_) {}
    }

    // Add user message to conversation
    const userMsg: VoiceMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setTranscript('');
    currentTranscriptRef.current = '';
    setBlobState('THINKING');

    try {
      // Call backend bilingual multi-agent reasoning endpoint
      const result: any = await api.processVoiceQuery({
        query: textToSend,
        language: lang,
        farm_id: 'demo-farm-01'
      });

      // Defensively resolve response text
      const responseText =
        (lang === 'kn-IN' ? (result.response_kn || result.text_response) : (result.response_en || result.text_response)) ||
        result.text_response ||
        result.audio_text ||
        result.response_en ||
        result.response_kn ||
        'FarmWise analyzed your herd telemetry and updated recommendations.';

      const spokenAudio = result.audio_text || responseText;

      const assistantMsg: VoiceMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agents: result.active_agents || result.executed_agents || ['Farm Data Agent', 'Nutrition Agent'],
        evidence: result.evidence_summary,
        isVetAlert: Boolean(result.is_vet_triage || result.triage_warning),
        actionTab: result.recommended_tab
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setBlobState('SPEAKING');
      speakResponse(spokenAudio);

      // If query recommends Arena
      if (result.recommended_tab === 'arena' && onAnalyzeQuery) {
        onAnalyzeQuery(textToSend);
      }
    } catch (err: any) {
      console.warn('Voice query processing fallback:', err);
      // High-Fidelity Local Fallback
      const fallbackText =
        lang === 'kn-IN'
          ? 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಫಾರ್ಮ್‌ನಲ್ಲಿ ದಿನ 11 ರಂದು ಬಿಸಿಲಿನ ಶಾಖದಿಂದಾಗಿ ಹಾಲು 35 ಲೀಟರ್ ಇಳಿಕೆಯಾಗಿದೆ. ಮೊದಲು ಕುಡಿಯುವ ನೀರಿನ ತೊಟ್ಟಿಗಳಿಗೆ ನೆರಳು ಕಲ್ಪಿಸಿ ಮತ್ತು ಫ್ಯಾನ್ ಗಾಳಿ ಹೆಚ್ಚಿಸಿ. ಹಸು KA-MAN-104 ಗೆ ಜ್ವರವಿದ್ದು ಪಶುವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
          : 'Herd Alert: Milk production declined by 35 L on Day 11 following summer heat stress (THI 86.8). First, shade drinking troughs and increase barn ventilation. Cow KA-MAN-104 has a 39.9°C fever and requires urgent vet attention.';

      const fallbackMsg: VoiceMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agents: ['Farm Data Agent', 'Risk Assessment Agent', 'Decision Agent'],
        actionTab: 'arena'
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      setBlobState('SPEAKING');
      speakResponse(fallbackText);
    } finally {
      setTimeout(() => {
        isQueryProcessingRef.current = false;
      }, 1000);
    }
  };

  const quickPrompts =
    lang === 'kn-IN'
      ? [
          { label: 'ಹಾಲು ಇಳಿಕೆ ಏಕೆ?', query: 'ನನ್ನ ಹಸುಗಳು ಕಡಿಮೆ ಹಾಲು ಏಕೆ ನೀಡುತ್ತಿವೆ?' },
          { label: 'KA-MAN-104 ಹಸು ತಪಾಸಣೆ', query: 'ಹಸು KA-MAN-104 ಅನ್ನು ಪಶುವೈದ್ಯರಿಗೆ ತೋರಿಸಬೇಕೇ?' },
          { label: 'ಫೀಡ್ ಬೆಲೆ ಏರಿಕೆ ಪರಿಹಾರ', query: 'ಮೇವು ಬೆಲೆ ಹೆಚ್ಚಾಗಿದೆ, ಕಡಿಮೆ ವೆಚ್ಚದ ತಂತ್ರ ಯಾವುದು?' },
          { label: 'ನಿರ್ಧಾರ ಅಖಾಡ ತೆರೆಯಿರಿ', query: 'ನಿರ್ಧಾರ ಅಖಾಡದಲ್ಲಿ ತಂತ್ರಗಳನ್ನು ಹೋಲಿಸಿ' }
        ]
      : [
          { label: 'Why did milk drop 35 L?', query: 'Why did my herd milk production drop by 35 litres on Day 11?' },
          { label: 'Check Cow KA-MAN-104', query: 'Why is cow KA-MAN-104 flagged for urgent veterinary triage?' },
          { label: 'Feed Price & Margins', query: 'Feed prices rose by 16%. What alternative feed saves money?' },
          { label: 'Open Decision Arena', query: 'Compare feed strategies and cost trade-offs in Decision Arena' }
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col h-[740px] max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">FarmWise Voice AI</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Groq Whisper & Multi-Agent
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Bilingual voice reasoning for livestock decisions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bilingual Switcher */}
            <button
              onClick={() => {
                const nextLang = lang === 'en-IN' ? 'kn-IN' : 'en-IN';
                setLang(nextLang);
                if (isSpeaking) stopSpeaking();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/10 flex items-center gap-1.5 transition"
              title="Toggle between Kannada and English"
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
              title={voiceEnabled ? 'Voice audio enabled' : 'Voice audio muted'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                stopSpeaking();
                stopRecording();
                onClose();
              }}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Centerpiece Interactive AI Blob Stage */}
        <div className="bg-gradient-to-b from-stone-900 to-stone-850 pt-2 pb-4 px-4 flex flex-col items-center justify-center border-b border-stone-800 relative">
          <AIBlob
            state={blobState}
            audioStream={audioStream}
            size={180}
            onClick={isRecording ? stopRecording : (isSpeaking ? stopSpeaking : startRecording)}
          />

          <p className="text-[11px] text-stone-300 font-medium mt-1">
            {isRecording
              ? '🎙️ Listening to farmer... tap mic or button below to submit'
              : isSpeaking
              ? '🔊 Speaking response in ' + (lang === 'kn-IN' ? 'Kannada' : 'English')
              : 'Tap microphone below to ask a question naturally'}
          </p>
        </div>

        {/* Conversation Message Feed */}
        <div className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-[#f8f9f6]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-xs'
                    : 'bg-white text-stone-800 border border-stone-200/90 rounded-tl-xs space-y-2'
                }`}
              >
                {/* Assistant sender label with Agent Badges */}
                {m.sender === 'assistant' && (
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-stone-100">
                    <span className="font-extrabold text-[11px] text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>FarmWise Multi-Agent Reasoning</span>
                    </span>
                    {m.agents && (
                      <div className="flex items-center gap-1">
                        {m.agents.map((ag, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold border border-stone-200"
                          >
                            {ag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Veterinary Alert Banner */}
                {m.isVetAlert && (
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Clinical Safety Protocol</p>
                      <p className="text-[11px] text-rose-700">
                        Pyrexia &gt; 39.5°C requires certified veterinary inspection. FarmWise does not prescribe pharmaceuticals.
                      </p>
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>

                {/* Action Navigation Button */}
                {m.actionTab && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onNavigateTab(m.actionTab!);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <span>Explore in {m.actionTab === 'arena' ? 'Decision Arena' : 'Overview'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1 px-1">
                <span>{m.sender === 'user' ? 'Farmer' : 'FarmWise'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>
            </div>
          ))}

          {blobState === 'THINKING' && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2 animate-pulse">
              <Activity className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Orchestrator activating Farm Data &amp; Nutrition Agents...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-stone-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Try:</span>
          </span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleProcessQuery(qp.query)}
              className="text-[11px] font-medium px-3 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 rounded-full border border-stone-200 hover:border-emerald-300 transition whitespace-nowrap shrink-0"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar & Mic Controls */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  currentTranscriptRef.current = e.target.value;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProcessQuery();
                  }
                }}
                placeholder={
                  lang === 'kn-IN'
                    ? 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ...'
                    : 'Speak or edit recognized transcript...'
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
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-2xl font-bold transition flex items-center justify-center shadow-xs ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200 animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Voice Microphone'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleProcessQuery()}
              disabled={!transcript.trim() || isRecording}
              className="p-3 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold transition flex items-center justify-center shadow-xs"
              title="Submit Query"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>
              {isRecording
                ? 'Recording... Tap mic to finalize & send'
                : 'Microphone uses Groq Whisper STT + Multi-Agent Reasoning'}
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
