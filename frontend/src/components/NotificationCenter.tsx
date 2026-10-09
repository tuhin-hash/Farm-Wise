import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  Phone,
  Send,
  Settings,
  Sparkles,
  ArrowRight,
  Globe,
  RefreshCw,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import type { NotificationItem, NotificationSettings, SMSLogItem } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenVoiceAssistant?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenVoiceAssistant: _onOpenVoiceAssistant
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'UNREAD'>('ALL');
  const [lang, setLang] = useState<'en' | 'kn'>('en');

  // Settings & Test SMS modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    farm_id: 'demo-farm-01',
    phone_number: '+919876543210',
    country_code: '+91',
    sms_enabled: true,
    preferred_language: 'en-IN',
    notify_milk_drop: true,
    notify_heat_stress: true,
    notify_vet_triage: true,
    notify_decision_review: true
  });
  const [phoneInput, setPhoneInput] = useState('+919876543210');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // Test SMS state
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsResult, setSmsResult] = useState<{
    status: string;
    message_preview: string;
    provider: string;
    to: string;
    timestamp: string;
  } | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  // SMS Logs state
  const [showLogs, setShowLogs] = useState(false);
  const [smsLogs, setSmsLogs] = useState<SMSLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications('demo-farm-01');
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Failed to load notifications from API, using fallback data:', err);
      // Fallback seed notifications
      setNotifications([
        {
          id: 'notif-milk-001',
          farm_id: 'demo-farm-01',
          title: 'Day 11 Milk Drop Alert (-35 L)',
          title_kn: 'ದಿನ 11 ರ ಹಾಲಿನ ಇಳಿಕೆ ಎಚ್ಚರಿಕೆ (-35 ಲೀಟರ್)',
          message: 'Herd milk production dropped from 445 L to 410 L (-35 L / -7.9%) following severe heat stress (THI 86.8).',
          message_kn: 'ತೀವ್ರ ಶಾಖದ ಒತ್ತಡದ (THI 86.8) ನಂತರ ಹಿಂಡಿನ ಹಾಲು ಉತ್ಪಾದನೆ 445 ಲೀಟರ್‌ನಿಂದ 410 ಲೀಟರ್‌ಗೆ (-35 ಲೀಟರ್ / -7.9%) ಕುಸಿದಿದೆ.',
          severity: 'HIGH',
          category: 'MILK_PRODUCTION',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          action_url: 'arena'
        },
        {
          id: 'notif-thi-002',
          farm_id: 'demo-farm-01',
          title: 'Extreme Heat Stress (THI 86.8)',
          title_kn: 'ತೀವ್ರ ಶಾಖದ ಒತ್ತಡ ಎಚ್ಚರಿಕೆ (THI 86.8)',
          message: 'Ambient temp 36.5°C and 48% RH exceeded the critical comfort threshold (THI 72). Activate shed fans and sprinklers.',
          message_kn: 'ತಾಪಮಾನ 36.5°C ಮತ್ತು 48% ಆರ್ದ್ರತೆಯು ನಿರ್ಣಾಯಕ ಮಿತಿಯನ್ನು ಮೀರಿದೆ. ಶೆಡ್ ಫ್ಯಾನ್‌ಗಳು ಮತ್ತು ಸ್ಪ್ರಿಂಕ್ಲರ್‌ಗಳನ್ನು ಚಾಲೂ ಮಾಡಿ.',
          severity: 'HIGH',
          category: 'HEAT_STRESS',
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          action_url: 'overview'
        },
        {
          id: 'notif-vet-003',
          farm_id: 'demo-farm-01',
          title: 'Urgent Vet Triage: Cow KA-MAN-104 Pyrexia',
          title_kn: 'ತುರ್ತು ಪಶುವೈದ್ಯಕೀಯ ಎಚ್ಚರಿಕೆ: ಹಸು KA-MAN-104 ಜ್ವರ',
          message: 'Rectal temp 39.9°C with tachycardia (105 BPM) and tachypnea. Immediate professional veterinary evaluation required.',
          message_kn: 'ಗುದನಾಳದ ತಾಪಮಾನ 39.9°C, ಹೃದಯ ಬಡಿತ 105 BPM ಮತ್ತು ತೀವ್ರ ಉಸಿರಾಟ. ತಕ್ಷಣ ಪಶುವೈದ್ಯರಿಂದ ತಪಾಸಣೆ ಅಗತ್ಯವಿದೆ.',
          severity: 'CRITICAL',
          category: 'VET_ATTENTION',
          is_read: false,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          action_url: 'overview'
        },
        {
          id: 'notif-feed-004',
          farm_id: 'demo-farm-01',
          title: 'Commercial Feed Price Surge (+16.7%)',
          title_kn: 'ವಾಣಿಜ್ಯ ಫೀಡ್ ಬೆಲೆ ಏರಿಕೆ (+16.7%)',
          message: 'Commercial cattle feed rose from ₹24 to ₹28/kg. Evaluate DORB + Bypass Fat in Decision Arena to save ₹144/day.',
          message_kn: 'ವಾಣಿಜ್ಯ ದನದ ಮೇವು ₹24 ರಿಂದ ₹28/ಕೆಜಿಗೆ ಏರಿಕೆಯಾಗಿದೆ. ದಿನಕ್ಕೆ ₹144 ಉಳಿಸಲು ನಿರ್ಧಾರ ಅಖಾಡದಲ್ಲಿ DORB ಪರ್ಯಾಯವನ್ನು ಪರಿಶೀಲಿಸಿ.',
          severity: 'WARNING',
          category: 'FEED_PRICE',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          action_url: 'arena'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getNotificationSettings('demo-farm-01');
      if (res && res.phone_number) {
        setSettings(res);
        setPhoneInput(res.phone_number);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  };

  const loadSMSLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.getSMSLogs(20);
      if (res && res.logs) {
        setSmsLogs(res.logs);
      }
    } catch (err) {
      console.warn('Failed to load SMS logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
    } catch (_) {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead('demo-farm-01');
    } catch (_) {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSaveMsg(null);
    try {
      const updated = await api.updateNotificationSettings(
        {
          ...settings,
          phone_number: phoneInput
        },
        'demo-farm-01'
      );
      setSettings(updated);
      setSettingsSaveMsg('Settings saved successfully!');
      setTimeout(() => setSettingsSaveMsg(null), 3000);
    } catch (err: any) {
      setSettingsSaveMsg(err.message || 'Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendTestSMS = async (customMessage?: string, notifId?: string) => {
    setIsSendingSMS(true);
    setSmsResult(null);
    setSmsError(null);
    try {
      const res = await api.sendTestSMS({
        phone_number: phoneInput,
        message: customMessage,
        language: lang,
        notification_id: notifId
      });
      setSmsResult(res);
    } catch (err: any) {
      setSmsError(err.message || 'SMS dispatch failed');
    } finally {
      setIsSendingSMS(false);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'CRITICAL') return n.severity === 'CRITICAL';
    if (filter === 'WARNING') return n.severity === 'WARNING' || n.severity === 'HIGH';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Indian phone number regex test (+91 followed by 6, 7, 8, 9 and 9 more digits)
  const isPhoneValid = /^\+91[6-9]\d{9}$/.test(phoneInput.replace(/\s+/g, ''));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Slide-over Drawer */}
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Farm Alerts & SMS</h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300">
                Mandya herd telemetry & notification center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/10 flex items-center gap-1.5 transition"
              title="Toggle notification language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'English' : 'ಕನ್ನಡ'}</span>
            </button>

            {/* SMS Settings Toggle */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition border border-white/10"
              title="SMS Settings & Test Dispatch"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions & Filter Bar */}
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'UNREAD', 'CRITICAL', 'WARNING'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition ${
                  filter === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-200/80 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafaf8]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
              <span>Loading telemetry notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400 text-xs space-y-2">
              <Check className="w-8 h-8 text-emerald-500" />
              <p className="font-bold text-stone-700">No alerts in this category</p>
              <p className="text-[11px]">All herd operations within normal parameters.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const title = lang === 'kn' && notif.title_kn ? notif.title_kn : notif.title;
              const msg = lang === 'kn' && notif.message_kn ? notif.message_kn : notif.message;

              const isCritical = notif.severity === 'CRITICAL';
              const isHigh = notif.severity === 'HIGH';

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    !notif.is_read
                      ? isCritical
                        ? 'bg-rose-50/70 border-rose-200 shadow-xs ring-1 ring-rose-200'
                        : isHigh
                        ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                        : 'bg-white border-emerald-200 shadow-xs ring-1 ring-emerald-100'
                      : 'bg-white/80 border-stone-200/70 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isCritical ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : isHigh ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-black tracking-tight ${
                          isCritical ? 'text-rose-900' : isHigh ? 'text-amber-900' : 'text-stone-900'
                        }`}
                      >
                        {title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {notif.severity}
                      </span>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="p-1 text-stone-400 hover:text-emerald-700 rounded-md"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 mt-2 leading-relaxed">{msg}</p>

                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-stone-400">
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Send via SMS button */}
                      <button
                        onClick={() => handleSendTestSMS(msg, notif.id)}
                        disabled={isSendingSMS}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 text-[10px] font-bold flex items-center gap-1 transition"
                        title="Send this alert to configured phone"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>SMS Alert</span>
                      </button>

                      {/* Action Link button */}
                      {notif.action_url && (
                        <button
                          onClick={() => {
                            onNavigateTab(notif.action_url!);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Launch to Decision Arena */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-stone-200"
          >
            <Settings className="w-3.5 h-3.5 text-stone-600" />
            <span>Configure SMS Alerts</span>
          </button>

          <button
            onClick={() => {
              onNavigateTab('arena');
              onClose();
            }}
            className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Decision Arena</span>
          </button>
        </div>
      </div>

      {/* SMS Configuration & Test Dispatch Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900">SMS Alerts & Gateway Settings</h3>
                  <p className="text-[11px] text-stone-500">
                    Indian mobile notifications (DLT compliant & demo simulator)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span>Farmer Mobile Number</span>
                <span className={`text-[10px] font-bold ${isPhoneValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isPhoneValid ? '✓ Valid Indian Mobile' : 'Requires +91 10-digit number'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+919876543210"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono border focus:outline-hidden focus:ring-2 ${
                    isPhoneValid
                      ? 'border-emerald-300 focus:ring-emerald-500 bg-white'
                      : 'border-amber-300 focus:ring-amber-500 bg-amber-50/30'
                  }`}
                />
              </div>
              <p className="text-[10px] text-stone-400">
                Format: <code className="text-stone-600 font-bold">+91XXXXXXXXXX</code> (starts with 6, 7, 8, or 9)
              </p>
            </div>

            {/* Notification Category Checkboxes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-800">Alert Triggers</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_milk_drop}
                    onChange={(e) => setSettings({ ...settings, notify_milk_drop: e.target.checked })}
                    className="accent-emerald-700 w-4 h-4 rounded-sm"
                  />
                  <div>
                    <p className="font-bold text-stone-800">Milk Drop Alerts</p>
                    <p className="text-[10px] text-stone-500">&gt;25 L/day decline</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_heat_stress}
                    onChange={(e) => setSettings({ ...settings, notify_heat_stress: e.target.checked })}
                    className="accent-emerald-700 w-4 h-4 rounded-sm"
                  />
                  <div>
                    <p className="font-bold text-stone-800">Heat Stress (THI)</p>
                    <p className="text-[10px] text-stone-500">THI &gt; 80 thermal alert</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_vet_triage}
                    onChange={(e) => setSettings({ ...settings, notify_vet_triage: e.target.checked })}
                    className="accent-emerald-700 w-4 h-4 rounded-sm"
                  />
                  <div>
                    <p className="font-bold text-rose-800">Vet Triage Urgent</p>
                    <p className="text-[10px] text-stone-500">Pyrexia &gt; 39.5°C</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_decision_review}
                    onChange={(e) => setSettings({ ...settings, notify_decision_review: e.target.checked })}
                    className="accent-emerald-700 w-4 h-4 rounded-sm"
                  />
                  <div>
                    <p className="font-bold text-stone-800">Arena Reviews</p>
                    <p className="text-[10px] text-stone-500">Feed optimization ready</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Test SMS Dispatcher */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Send Immediate Test SMS</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Demo & Gateway Ready
                </span>
              </div>

              <p className="text-[11px] text-stone-600 leading-tight">
                Dispatches an alert in {lang === 'kn' ? 'Kannada' : 'English'} to your mobile or logs to demo audit.
              </p>

              <button
                onClick={() => handleSendTestSMS()}
                disabled={isSendingSMS || !isPhoneValid}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:text-stone-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                {isSendingSMS ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching SMS...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Test SMS to {phoneInput}</span>
                  </>
                )}
              </button>

              {/* SMS Dispatch Result Feedback */}
              {smsResult && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-emerald-800">
                    <span>✓ SMS Successfully {smsResult.status}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-200/60 font-mono">
                      {smsResult.provider}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-mono truncate">
                    &quot;{smsResult.message_preview}&quot;
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    Recipient: {smsResult.to} • {new Date(smsResult.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}

              {smsError && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                  <strong>SMS Error:</strong> {smsError}
                </div>
              )}
            </div>

            {/* Audit Logs Drawer Trigger */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowLogs(!showLogs);
                  if (!showLogs) loadSMSLogs();
                }}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showLogs ? 'Hide SMS Audit Logs' : 'View SMS Audit Logs'}</span>
              </button>

              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings || !isPhoneValid}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {settingsSaveMsg && (
              <p className="text-xs font-bold text-emerald-700 text-center animate-in fade-in">
                {settingsSaveMsg}
              </p>
            )}

            {/* SMS Logs Table */}
            {showLogs && (
              <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>Recent SMS Transmissions</span>
                  <button onClick={loadSMSLogs} className="text-emerald-700 hover:underline text-[11px]">
                    Refresh
                  </button>
                </div>

                {isLoadingLogs ? (
                  <p className="text-xs text-stone-400 py-2">Loading logs...</p>
                ) : smsLogs.length === 0 ? (
                  <p className="text-xs text-stone-400 py-2">No past SMS transmissions recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {smsLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2 bg-white rounded-lg border border-stone-200 text-[11px] flex items-center justify-between gap-2"
                      >
                        <div className="truncate flex-1">
                          <span className="font-bold text-stone-800">{log.phone_number}</span>: &quot;
                          {log.message_text}&quot;
                        </div>
                        <div className="flex items-center gap-1 text-[10px] shrink-0">
                          <span className="text-emerald-700 font-bold uppercase">{log.status}</span>
                          <span className="text-stone-400 font-mono">({log.provider})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
