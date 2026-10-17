'use client';

import React, { useEffect, useRef, useState } from 'react';
import type {
  AgeAdaptiveLevelEnum,
  ChatMessageDTO,
  ChatSessionDTO,
  CurriculumCodeEnum,
  RegionCode,
  SupportedImageMimeType,
} from '@rekasains/shared-types';
import { streamChatWithSTEMTutor } from '../lib/api-client';
import {
  getChatSessionLocally,
  listChatSessionsLocally,
  saveChatSessionLocally,
} from '../lib/offline-db';
import { LatexText } from './LatexRenderer';

export interface ChatSTEMAssistantProps {
  region: RegionCode;
  ageLevel: AgeAdaptiveLevelEnum;
  onAgeLevelChange: (lvl: AgeAdaptiveLevelEnum) => void;
  isOfflineMode: boolean;
}

export function ChatSTEMAssistant({
  region,
  ageLevel,
  onAgeLevelChange,
  isOfflineMode,
}: ChatSTEMAssistantProps) {
  const [sessionId, setSessionId] = useState<string>('session-default-01');
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<SupportedImageMimeType | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingBuffer, setStreamingBuffer] = useState<string>('');
  const [sessionsList, setSessionsList] = useState<ChatSessionDTO[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const curriculumCode: CurriculumCodeEnum =
    region === 'MY'
      ? ageLevel === 'HIGHER_ED_UNI'
        ? 'MY_MATRIKULASI_UNI'
        : ageLevel === 'SD_ELEMENTARY'
        ? 'MY_KSSR'
        : 'MY_KSSM'
      : ageLevel === 'HIGHER_ED_UNI'
      ? 'ID_DIKTI_HIGHER_ED'
      : 'ID_KURIKULUM_MERDEKA';

  // Load chat history from IndexedDB on mount
  useEffect(() => {
    (async () => {
      const savedSessions = await listChatSessionsLocally();
      setSessionsList(savedSessions);

      const existingSession = await getChatSessionLocally(sessionId);
      if (existingSession && existingSession.messages.length > 0) {
        setMessages(existingSession.messages);
      } else {
        // Initial welcoming message
        const welcomeMessage: ChatMessageDTO = {
          id: 'welcome-01',
          role: 'assistant',
          content:
            region === 'MY'
              ? 'Hai! Saya **Tanya Lab AI**, pembantu makmal STEM interaktif anda dengan teknologi Google ADK. Anda boleh bertanya sebarang konsep fizik, kimia, matematik atau melampirkan gambar bahan makmal anda untuk analisis interaktif berformat LaTeX!'
              : 'Halo! Saya **Tanya Lab AI**, asisten laboratorium STEM interaktif Anda berbasis Google ADK. Silakan tanyakan konsep sains, rumus fisika/kimia, atau unggah foto eksperimen Anda untuk analisis langsung dengan formula matematis LaTeX!',
          created_at: new Date().toISOString(),
          has_image: false,
        };
        setMessages([welcomeMessage]);
      }
    })();
  }, [sessionId, region]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingBuffer]);

  // Compress and handle image upload from camera or local gallery
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rawType = file.type;
    const safeType: SupportedImageMimeType =
      rawType === 'image/webp' || rawType === 'image/png' ? rawType : 'image/jpeg';
    setImageMimeType(safeType);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageBase64(null);
    setImageMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend && !imageBase64) return;
    if (isStreaming) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const newUserMessage: ChatMessageDTO = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      has_image: Boolean(imageBase64),
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputPrompt('');
    const sentImageBase64 = imageBase64;
    const sentImageMime = imageMimeType;
    handleClearImage();

    setIsStreaming(true);
    setStreamingBuffer('');

    let accumulatedText = '';

    await streamChatWithSTEMTutor(
      {
        session_id: sessionId,
        region,
        age_adaptive_level: ageLevel,
        curriculum_code: curriculumCode,
        message: textToSend,
        image_base64: sentImageBase64 || undefined,
        mime_type: sentImageMime || undefined,
      },
      (chunk) => {
        accumulatedText += chunk;
        setStreamingBuffer(accumulatedText);
      },
      async () => {
        setIsStreaming(false);
        const assistantMessageId = `msg-assistant-${Date.now()}`;
        const newAssistantMessage: ChatMessageDTO = {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedText || 'Tidak ada respons yang diterima dari model.',
          created_at: new Date().toISOString(),
          has_image: false,
        };

        const finalMessages = [...updatedMessages, newAssistantMessage];
        setMessages(finalMessages);
        setStreamingBuffer('');

        // Persist session to local IndexedDB
        const sessionRecord: ChatSessionDTO = {
          id: sessionId,
          title: textToSend.slice(0, 40) || 'Percakapan STEM Lab',
          region,
          age_adaptive_level: ageLevel,
          curriculum_code: curriculumCode,
          messages: finalMessages,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveChatSessionLocally(sessionRecord);
        const updatedList = await listChatSessionsLocally();
        setSessionsList(updatedList);
      }
    );
  };

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    setSessionId(newId);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content:
          region === 'MY'
            ? 'Sesi baharu dimulakan! Apa yang ingin kita kaji hari ini?'
            : 'Sesi baru dimulai! Konsep sains apa yang ingin kita bahas hari ini?',
        created_at: new Date().toISOString(),
        has_image: false,
      },
    ]);
    setStreamingBuffer('');
  };

  const quickPrompts =
    region === 'MY'
      ? [
          'Mengapa tin aluminium boleh mengalirkan arus elektrik?',
          'Adakah selamat mencampurkan peluntur pakaian dengan asid pembersih?',
          'Jelaskan formula Hukum Ohm dan graf perkadaran terus',
          'Bagaimana bateri menghasilkan beza keupayaan?',
        ]
      : [
          'Mengapa kaleng aluminium bisa menghantarkan arus listrik?',
          'Bolehkah saya campur pemutih baju dan pembersih asam lantai?',
          'Jelaskan formula Hukum Ohm dan grafik hubungannya',
          'Bagaimana reaksi redoks menghasilkan arus listrik?',
        ];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden min-h-[640px]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xl font-bold shadow-lg shadow-cyan-500/20">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Tanya Lab AI — STEM Tutor</h2>
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-cyan-300 border border-cyan-500/30">
                Google ADK • Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {region === 'MY' ? 'Kurikulum KSSR / KSSM' : 'Kurikulum Merdeka'} • Formula LaTeX &amp; Penjaga Keselamatan Bahan Kimia
            </p>
          </div>
        </div>

        {/* Action Controls & Age Selector */}
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
          <div className="flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700">
            {(['SD_ELEMENTARY', 'SMP_LOWER_SEC', 'SMA_UPPER_SEC', 'HIGHER_ED_UNI'] as AgeAdaptiveLevelEnum[]).map((lvl) => {
              const label =
                lvl === 'SD_ELEMENTARY'
                  ? 'SD'
                  : lvl === 'SMP_LOWER_SEC'
                  ? 'SMP'
                  : lvl === 'SMA_UPPER_SEC'
                  ? 'SMA'
                  : 'Uni';
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onAgeLevelChange(lvl)}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    ageLevel === lvl
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            + Chat Baru
          </button>
        </div>
      </div>

      {/* Offline Mode Banner Warning */}
      {isOfflineMode && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <span>
            ⚠️ <strong>Mode Offline Aktif:</strong> Riwayat chat tersimpan di perangkat lokal. Pertanyaan baru membutuhkan koneksi internet &amp; `GEMINI_API_KEY` aktif.
          </span>
          <span className="text-[10px] text-amber-400/80">IndexedDB Synced</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[500px]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-sm font-bold">
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md ${
                  isUser
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                }`}
              >
                {msg.has_image && isUser && (
                  <div className="mb-2 text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                    <span>📷 Lampiran Foto Eksperimen Terkirim</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed break-words">
                  <LatexText text={msg.content} />
                </div>
                <div
                  className={`mt-2 text-[10px] ${
                    isUser ? 'text-cyan-200/70 text-right' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-slate-200 text-xs font-bold">
                  Anda
                </div>
              )}
            </div>
          );
        })}

        {/* Live Streaming Message Bubble */}
        {isStreaming && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-sm font-bold animate-pulse">
              AI
            </div>
            <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md bg-slate-800/90 border border-cyan-500/40 text-slate-100 rounded-tl-none">
              <div className="text-sm leading-relaxed break-words">
                <LatexText text={streamingBuffer} />
                <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-ping align-middle" />
              </div>
              <div className="mt-2 text-[10px] text-cyan-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Menganalisis konsep STEM &amp; formula...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="border-t border-slate-800 bg-slate-950/40 px-4 py-2.5 overflow-x-auto flex gap-2 no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isStreaming}
            className="whitespace-nowrap rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            💡 {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-950/80 p-4">
        {/* Image Preview Box if attached */}
        {imageBase64 && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-2.5">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-cyan-500/50 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageBase64}
                alt="Upload Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-cyan-300 truncate">
                Foto Bahan Lab Siap Dianalisis
              </p>
              <p className="text-[10px] text-slate-400">
                AI akan membaca komponen fisik dari foto bersama pertanyaan Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearImage}
              className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/30"
            >
              Hapus
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Camera / Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            title="Ambil / Unggah Foto Bahan Laboratorium"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-700 hover:text-cyan-400 transition disabled:opacity-50"
          >
            📷
          </button>

          {/* Text Input */}
          <textarea
            rows={1}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              region === 'MY'
                ? 'Tanya konsep sains, formula LaTeX, atau bincang eksperimen...'
                : 'Tanya konsep sains, rumus LaTeX, atau bahas hasil eksperimen...'
            }
            disabled={isStreaming}
            className="flex-1 max-h-32 min-h-[44px] rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none disabled:opacity-50"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isStreaming || (!inputPrompt.trim() && !imageBase64)}
            className="flex h-11 px-5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" />
                <span>Stream...</span>
              </span>
            ) : (
              'Kirim 🚀'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
