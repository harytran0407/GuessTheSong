import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, RotateCcw } from 'lucide-react';
import { saveAudioFile, getAllAudioFiles, deleteAudioFile, clearAllAudioFiles } from './audioStorage';

// Default track list — generic placeholders, users can customize via the Edit Questions modal
const DEFAULT_TRACK_COUNT = 12;

const DEFAULT_SONGS = Array.from({ length: DEFAULT_TRACK_COUNT }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  audioFile: `/songs/${i + 1}.mp3`,
  title: `Track ${i + 1}`,
  artist: '',
  maxSeconds: 15,
  played: false
}));

// Danh sách các nốt nhạc bay lơ lửng ngẫu nhiên trên nền tất cả các trang
// Danh sách các nốt nhạc rơi liên tục (snowfall) ngẫu nhiên trên nền tất cả các trang
// Dùng delay âm để ngay khi mở trang, các nốt đã rải đều khắp màn hình và rơi liên tục, không bị đọng ở trần
const AMBIENT_NOTES = [
  { id: 1, symbol: '♪', left: '4%', size: 'text-xs sm:text-sm', duration: '12s', delay: '-2s', drift: '30px', rot: '35deg', opacity: '0.28', color: 'text-stone-700' },
  { id: 2, symbol: '♫', left: '11%', size: 'text-sm sm:text-base', duration: '15s', delay: '-8s', drift: '-25px', rot: '-40deg', opacity: '0.22', color: 'text-[#c59b27]' },
  { id: 3, symbol: '♬', left: '19%', size: 'text-xs sm:text-sm', duration: '11s', delay: '-4s', drift: '22px', rot: '30deg', opacity: '0.26', color: 'text-stone-800' },
  { id: 4, symbol: '♩', left: '27%', size: 'text-base sm:text-lg', duration: '17s', delay: '-13s', drift: '-30px', rot: '-20deg', opacity: '0.20', color: 'text-stone-600' },
  { id: 5, symbol: '♪', left: '35%', size: 'text-xs sm:text-sm', duration: '13s', delay: '-6s', drift: '26px', rot: '45deg', opacity: '0.25', color: 'text-[#c59b27]' },
  { id: 6, symbol: '♫', left: '44%', size: 'text-sm sm:text-base', duration: '16s', delay: '-11s', drift: '-24px', rot: '-35deg', opacity: '0.22', color: 'text-stone-700' },
  { id: 7, symbol: '♬', left: '52%', size: 'text-base sm:text-xl', duration: '12s', delay: '-3s', drift: '35px', rot: '25deg', opacity: '0.20', color: 'text-[#c59b27]' },
  { id: 8, symbol: '♩', left: '60%', size: 'text-xs sm:text-sm', duration: '14s', delay: '-9s', drift: '-22px', rot: '-30deg', opacity: '0.24', color: 'text-stone-800' },
  { id: 9, symbol: '♪', left: '68%', size: 'text-sm sm:text-base', duration: '18s', delay: '-15s', drift: '28px', rot: '40deg', opacity: '0.22', color: 'text-stone-600' },
  { id: 10, symbol: '♫', left: '76%', size: 'text-xs sm:text-sm', duration: '11s', delay: '-1s', drift: '-28px', rot: '-25deg', opacity: '0.25', color: 'text-[#c59b27]' },
  { id: 11, symbol: '𝄞', left: '83%', size: 'text-base sm:text-xl', duration: '16s', delay: '-7s', drift: '20px', rot: '20deg', opacity: '0.20', color: 'text-stone-800' },
  { id: 12, symbol: '♬', left: '91%', size: 'text-xs sm:text-sm', duration: '13s', delay: '-10s', drift: '-20px', rot: '-35deg', opacity: '0.26', color: 'text-stone-700' },
  { id: 13, symbol: '♭', left: '97%', size: 'text-sm sm:text-base', duration: '15s', delay: '-5s', drift: '18px', rot: '30deg', opacity: '0.20', color: 'text-stone-600' },
  { id: 14, symbol: '♪', left: '15%', size: 'text-xs sm:text-sm', duration: '14s', delay: '-12s', drift: '-18px', rot: '-20deg', opacity: '0.24', color: 'text-[#c59b27]' },
  { id: 15, symbol: '♫', left: '39%', size: 'text-sm sm:text-base', duration: '12s', delay: '-8.5s', drift: '25px', rot: '35deg', opacity: '0.22', color: 'text-stone-700' },
  { id: 16, symbol: '♬', left: '63%', size: 'text-xs sm:text-sm', duration: '16s', delay: '-4.5s', drift: '-26px', rot: '-25deg', opacity: '0.25', color: 'text-[#c59b27]' },
  { id: 17, symbol: '♩', left: '72%', size: 'text-sm sm:text-base', duration: '13s', delay: '-11.5s', drift: '22px', rot: '20deg', opacity: '0.22', color: 'text-stone-800' },
  { id: 18, symbol: '♪', left: '88%', size: 'text-xs sm:text-sm', duration: '15s', delay: '-6.5s', drift: '-24px', rot: '-30deg', opacity: '0.25', color: 'text-stone-600' }
];

const getGridCols = (count) => {
  if (count <= 4) return 'grid-cols-2 max-w-md';
  if (count <= 6) return 'grid-cols-2 sm:grid-cols-3 max-w-xl';
  if (count <= 9) return 'grid-cols-3 max-w-xl';
  if (count <= 12) return 'grid-cols-3 sm:grid-cols-4 max-w-2xl';
  if (count <= 16) return 'grid-cols-3 sm:grid-cols-4 max-w-2xl';
  return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 max-w-3xl';
};

export default function App() {
  // Navigation: 'READY' (Trang chủ) | 'BOARD' (Bảng câu hỏi) | 'DETAIL' (Chi tiết câu hỏi)
  const [currentScreen, setCurrentScreen] = useState('READY');

  const customObjectUrlsRef = useRef([]);

  // Danh sách bài hát (hỗ trợ custom config từ localStorage và fallback sang DEFAULT_SONGS)
  const [songs, setSongs] = useState(() => {
    const customConfigStr = localStorage.getItem('guess_music_custom_config_v1');
    if (customConfigStr) {
      try {
        const config = JSON.parse(customConfigStr);
        if (config && Array.isArray(config.songs) && config.songs.length > 0) {
          return config.songs.map(s => ({
            id: s.id,
            number: s.number || s.id,
            audioFile: `/songs/${s.id}.mp3`,
            title: s.title || `Track ${s.id}`,
            artist: "Thánh ca",
            maxSeconds: s.maxSeconds || 15,
            played: !!s.played,
            hasCustomAudio: !!s.hasCustomAudio,
            customAudioName: s.customAudioName || ''
          }));
        }
      } catch (e) { }
    }

    const saved = localStorage.getItem('guess_music_songs_v3') || localStorage.getItem('guess_music_songs_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return DEFAULT_SONGS.map(defSong => {
          const found = parsed.find(s => s.id === defSong.id);
          return found ? { ...defSong, played: !!found.played, maxSeconds: found.maxSeconds || defSong.maxSeconds } : defSong;
        });
      } catch (e) {
        return DEFAULT_SONGS;
      }
    }
    return DEFAULT_SONGS;
  });

  // Modal chỉnh sửa câu hỏi / bài hát cá nhân hóa
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [modalTrackCount, setModalTrackCount] = useState(songs.length || 12);
  const [modalDraftSongs, setModalDraftSongs] = useState([]);
  const [pendingAudioFiles, setPendingAudioFiles] = useState({}); // { [songId]: File }
  const [pendingAudioDeletes, setPendingAudioDeletes] = useState({}); // { [songId]: boolean }
  const [previewingSongId, setPreviewingSongId] = useState(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const previewAudioRef = useRef(null);
  const importInputRef = useRef(null);

  // Hydrate custom audio files from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const audioMap = await getAllAudioFiles();
        if (!isMounted) return;

        setSongs(prevSongs => {
          let hasUpdated = false;
          const updated = prevSongs.map(song => {
            const stored = audioMap[song.id];
            if (stored && stored.blob) {
              hasUpdated = true;
              const blobUrl = URL.createObjectURL(stored.blob);
              customObjectUrlsRef.current.push(blobUrl);
              return {
                ...song,
                audioFile: blobUrl,
                hasCustomAudio: true,
                customAudioName: stored.name
              };
            }
            return song;
          });
          return hasUpdated ? updated : prevSongs;
        });
      } catch (err) {
        console.warn("Could not load audio from IndexedDB:", err);
      }
    })();

    return () => {
      isMounted = false;
      customObjectUrlsRef.current.forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) { }
      });
      customObjectUrlsRef.current = [];
    };
  }, []);

  // Mở modal chỉnh sửa câu hỏi: sao chép snapshot dữ liệu hiện tại
  const openCustomModal = () => {
    setModalTrackCount(songs.length);
    setModalDraftSongs(songs.map(s => ({
      ...s,
      previewUrl: s.audioFile
    })));
    setPendingAudioFiles({});
    setPendingAudioDeletes({});
    setPreviewingSongId(null);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setIsCustomModalOpen(true);
  };

  // Đổi số lượng câu hỏi / ô bài hát trong modal
  const handleTrackCountChange = (newCount) => {
    const count = Math.max(1, Math.min(30, Number(newCount) || 1));
    setModalTrackCount(count);
    setModalDraftSongs(prev => {
      if (count > prev.length) {
        const added = [];
        for (let i = prev.length + 1; i <= count; i++) {
          const defaultTitle = SONG_TITLES[i - 1] || `Track ${i}`;
          added.push({
            id: i,
            number: i,
            audioFile: `/songs/${i}.mp3`,
            previewUrl: `/songs/${i}.mp3`,
            title: defaultTitle,
            artist: "Thánh ca",
            maxSeconds: 15,
            played: false,
            hasCustomAudio: false,
            customAudioName: ''
          });
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, count);
      }
    });
  };

  // Đổi tiêu đề bài hát
  const handleSongTitleChange = (songId, newTitle) => {
    setModalDraftSongs(prev => prev.map(s => (s.id === songId ? { ...s, title: newTitle } : s)));
  };

  // Upload file âm thanh riêng cho câu hỏi
  const handleFileUpload = (songId, file) => {
    if (!file) return;
    setPendingAudioFiles(prev => ({
      ...prev,
      [songId]: file
    }));
    setPendingAudioDeletes(prev => {
      const next = { ...prev };
      delete next[songId];
      return next;
    });

    const filePreviewUrl = URL.createObjectURL(file);
    customObjectUrlsRef.current.push(filePreviewUrl);

    setModalDraftSongs(prev => prev.map(s => {
      if (s.id === songId) {
        return {
          ...s,
          hasCustomAudio: true,
          customAudioName: file.name,
          customAudioSize: file.size,
          previewUrl: filePreviewUrl,
          audioFile: filePreviewUrl
        };
      }
      return s;
    }));
  };

  // Khôi phục bài hát về file mặc định (/songs/{id}.mp3)
  const handleRevertAudio = (songId) => {
    setPendingAudioFiles(prev => {
      const next = { ...prev };
      delete next[songId];
      return next;
    });
    setPendingAudioDeletes(prev => ({
      ...prev,
      [songId]: true
    }));
    setModalDraftSongs(prev => prev.map(s => {
      if (s.id === songId) {
        return {
          ...s,
          hasCustomAudio: false,
          customAudioName: '',
          customAudioSize: 0,
          previewUrl: `/songs/${s.id}.mp3`,
          audioFile: `/songs/${s.id}.mp3`
        };
      }
      return s;
    }));
  };

  // Nghe thử / dừng phát âm thanh trong modal
  const handleTogglePreview = (song) => {
    if (previewingSongId === song.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setPreviewingSongId(null);
      return;
    }

    const audioSrc = song.previewUrl || song.audioFile || `/songs/${song.id}.mp3`;
    if (previewAudioRef.current) {
      previewAudioRef.current.src = audioSrc;
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current.play().then(() => {
        setPreviewingSongId(song.id);
      }).catch(err => {
        console.warn("Could not play audio preview:", err);
        setPreviewingSongId(null);
      });
    }
  };

  // Lưu cấu hình vào localStorage & IndexedDB
  const handleSaveCustomization = async () => {
    // 1. Lưu các file mới upload vào IndexedDB
    for (const [idStr, file] of Object.entries(pendingAudioFiles)) {
      const songId = Number(idStr);
      try {
        await saveAudioFile(songId, file);
      } catch (err) {
        console.error("Failed to save audio to IndexedDB:", err);
      }
    }

    // 2. Xóa các file đã revert khỏi IndexedDB
    for (const [idStr, shouldDelete] of Object.entries(pendingAudioDeletes)) {
      if (shouldDelete) {
        try {
          await deleteAudioFile(Number(idStr));
        } catch (err) {
          console.error("Failed to delete audio from IndexedDB:", err);
        }
      }
    }

    // 3. Đọc lại toàn bộ audio blobs từ IndexedDB
    let audioMap = {};
    try {
      audioMap = await getAllAudioFiles();
    } catch (e) {
      console.warn("Failed to read audio from IndexedDB:", e);
    }

    const finalSongs = modalDraftSongs.map(draftSong => {
      const storedAudio = audioMap[draftSong.id];
      let resolvedAudioFile = `/songs/${draftSong.id}.mp3`;
      let hasCustom = false;
      let customName = '';

      if (storedAudio && storedAudio.blob) {
        resolvedAudioFile = URL.createObjectURL(storedAudio.blob);
        customObjectUrlsRef.current.push(resolvedAudioFile);
        hasCustom = true;
        customName = storedAudio.name;
      } else if (draftSong.previewUrl && draftSong.previewUrl.startsWith('blob:') && !pendingAudioDeletes[draftSong.id]) {
        resolvedAudioFile = draftSong.previewUrl;
        hasCustom = draftSong.hasCustomAudio;
        customName = draftSong.customAudioName;
      }

      return {
        id: draftSong.id,
        number: draftSong.id,
        title: (draftSong.title || '').trim() || `Track ${draftSong.id}`,
        artist: draftSong.artist || "Thánh ca",
        maxSeconds: draftSong.maxSeconds || 15,
        played: !!draftSong.played,
        audioFile: resolvedAudioFile,
        hasCustomAudio: hasCustom,
        customAudioName: customName
      };
    });

    // 4. Lưu metadata vào localStorage
    const configToSave = {
      trackCount: finalSongs.length,
      songs: finalSongs.map(s => ({
        id: s.id,
        number: s.number,
        title: s.title,
        maxSeconds: s.maxSeconds,
        played: s.played,
        hasCustomAudio: s.hasCustomAudio,
        customAudioName: s.customAudioName
      }))
    };
    localStorage.setItem('guess_music_custom_config_v1', JSON.stringify(configToSave));

    // 5. Cập nhật state chính
    setSongs(finalSongs);
    if (!finalSongs.some(s => s.id === selectedSongId)) {
      setSelectedSongId(finalSongs[0]?.id || 1);
    }

    // Tắt preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingSongId(null);
    setIsCustomModalOpen(false);

    // Toast thông báo lưu thành công
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 2500);
  };

  // ====== EXPORT GAME ======
  // Đóng gói toàn bộ metadata + audio blobs (từ IndexedDB) thành 1 file .guessgame để chia sẻ cho máy khác
  const handleExportGame = async () => {
    setExportLoading(true);
    try {
      const audioMap = await getAllAudioFiles();

      // Chuyển từng Blob thành base64
      const blobToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // chỉ lấy phần data, bỏ prefix
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const audioFiles = {};
      for (const [idStr, entry] of Object.entries(audioMap)) {
        if (entry && entry.blob) {
          audioFiles[idStr] = {
            base64: await blobToBase64(entry.blob),
            name: entry.name,
            type: entry.type || 'audio/mpeg',
            size: entry.size
          };
        }
      }

      const configStr = localStorage.getItem('guess_music_custom_config_v1');
      const config = configStr ? JSON.parse(configStr) : null;

      const exportPackage = {
        version: 1,
        exportedAt: new Date().toISOString(),
        appName: 'GuessTheSong',
        config: config || { trackCount: songs.length, songs: songs.map(s => ({ id: s.id, number: s.number, title: s.title, maxSeconds: s.maxSeconds, played: s.played, hasCustomAudio: s.hasCustomAudio, customAudioName: s.customAudioName })) },
        audioFiles
      };

      const blob = new Blob([JSON.stringify(exportPackage)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GuessTheSong_${new Date().toISOString().slice(0, 10)}.guessgame`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // ====== IMPORT GAME ======
  // Đọc file .guessgame, khôi phục IndexedDB + localStorage + state
  const handleImportGame = async (file) => {
    if (!file) return;
    setImportLoading(true);
    setImportError('');
    try {
      const text = await file.text();
      const pkg = JSON.parse(text);

      if (!pkg.appName || pkg.appName !== 'GuessTheSong' || !pkg.config) {
        throw new Error('Invalid .guessgame file.');
      }

      // 1. Xóa audio cũ và lưu audio mới vào IndexedDB
      await clearAllAudioFiles();

      const base64ToBlob = (b64, type) => {
        const bytes = atob(b64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        return new Blob([arr], { type });
      };

      for (const [idStr, entry] of Object.entries(pkg.audioFiles || {})) {
        const blob = base64ToBlob(entry.base64, entry.type || 'audio/mpeg');
        const fakeFile = new File([blob], entry.name || `audio-${idStr}`, { type: entry.type || 'audio/mpeg' });
        await saveAudioFile(Number(idStr), fakeFile);
      }

      // 2. Khôi phục metadata vào localStorage
      localStorage.setItem('guess_music_custom_config_v1', JSON.stringify(pkg.config));
      localStorage.removeItem('guess_music_songs_v3');
      localStorage.removeItem('guess_music_songs_v2');

      // 3. Revoke old object URLs
      customObjectUrlsRef.current.forEach(url => { try { URL.revokeObjectURL(url); } catch (e) { } });
      customObjectUrlsRef.current = [];

      // 4. Reload songs from new IndexedDB + config
      const audioMap = await getAllAudioFiles();
      const importedSongs = pkg.config.songs.map(s => {
        const stored = audioMap[s.id];
        let audioFile = `/songs/${s.id}.mp3`;
        let hasCustom = false;
        let customName = '';
        if (stored && stored.blob) {
          audioFile = URL.createObjectURL(stored.blob);
          customObjectUrlsRef.current.push(audioFile);
          hasCustom = true;
          customName = stored.name;
        }
        return {
          id: s.id,
          number: s.number || s.id,
          title: s.title || `Track ${s.id}`,
          artist: 'Thánh ca',
          maxSeconds: s.maxSeconds || 15,
          played: !!s.played,
          audioFile,
          hasCustomAudio: hasCustom,
          customAudioName: customName
        };
      });

      setSongs(importedSongs);
      setSelectedSongId(importedSongs[0]?.id || 1);
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPreviewingSongId(null);

      // Refresh modal draft with imported songs (keep modal open)
      setModalTrackCount(importedSongs.length);
      setModalDraftSongs(importedSongs.map(s => ({ ...s, previewUrl: s.audioFile })));
      setPendingAudioFiles({});
      setPendingAudioDeletes({});

      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 2500);
    } catch (err) {
      console.error('Import failed:', err);
      setImportError('Import failed: ' + err.message);
    } finally {
      setImportLoading(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  // Khôi phục tất cả về mặc định 12 bài thánh ca
  const handleResetToDefaults = async () => {
    if (!confirm("Are you sure you want to reset all tracks, titles, and custom audio back to defaults?")) {
      return;
    }

    try {
      await clearAllAudioFiles();
    } catch (e) {
      console.error(e);
    }

    customObjectUrlsRef.current.forEach(url => {
      try { URL.revokeObjectURL(url); } catch (e) { }
    });
    customObjectUrlsRef.current = [];

    localStorage.removeItem('guess_music_custom_config_v1');
    localStorage.removeItem('guess_music_songs_v3');
    localStorage.removeItem('guess_music_songs_v2');

    const resetSongs = DEFAULT_SONGS.map(s => ({ ...s, played: false }));
    setSongs(resetSongs);
    setSelectedSongId(1);
    setModalDraftSongs(resetSongs);
    setModalTrackCount(12);
    setPendingAudioFiles({});
    setPendingAudioDeletes({});

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingSongId(null);
    setIsCustomModalOpen(false);

    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 2500);
  };

  // Bài hát đang chọn
  const [selectedSongId, setSelectedSongId] = useState(1);
  const [maxSeconds, setMaxSeconds] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [remainingTime, setRemainingTime] = useState(15);
  const [progressPercent, setProgressPercent] = useState(100);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Trạng thái rê chuột để kích hoạt xoay đĩa than
  const [isIntroHovered, setIsIntroHovered] = useState(false);
  const [isReadyHovered, setIsReadyHovered] = useState(false);
  const [isDetailHovered, setIsDetailHovered] = useState(false);

  // Refs
  const audioRef = useRef(null);
  const playbackTimerRef = useRef(null);
  const synthTimerRef = useRef(null);
  const audioCtxRef = useRef(null);

  // === CÔNG CỤ ĐỒNG HỒ ĐẾM NGƯỢC (CIRCULAR COUNTDOWN TIMER THEO ẢNH MẪU) ===
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(60); // 1 phút mặc định như ảnh
  const [timerRemaining, setTimerRemaining] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSound, setTimerSound] = useState(true);
  const [timerFinished, setTimerFinished] = useState(false);
  const [isEditingTimerPart, setIsEditingTimerPart] = useState(null); // 'min' | 'sec' | null
  const [editPartValue, setEditPartValue] = useState('');
  const countdownIntervalRef = useRef(null);

  // Âm thanh tick cho đồng hồ đếm ngược
  const playTimerTick = (urgent = false) => {
    if (!timerSound) return;
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = urgent ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(urgent ? 880 : 540, ctx.currentTime);
      gain.gain.setValueAtTime(urgent ? 0.08 : 0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
  };

  // Âm thanh báo hết giờ của đồng hồ đếm ngược
  const playTimerAlarm = () => {
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      [0, 0.14, 0.28, 0.42].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const freq = idx % 2 === 0 ? 587.33 : 783.99;
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.13);
      });
    } catch (e) { }
  };

  const handleStartTimer = (secondsToStart) => {
    initAudioCtx();
    const sec = secondsToStart !== undefined ? secondsToStart : timerRemaining;
    if (sec <= 0) return;
    setTimerFinished(false);
    setIsTimerRunning(true);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const targetEndTime = Date.now() + sec * 1000;

    countdownIntervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      setTimerRemaining(left);
      if (left === 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setIsTimerRunning(false);
        setTimerFinished(true);
        playTimerAlarm();
      }
    }, 250);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleResetTimer = (newSeconds) => {
    handlePauseTimer();
    const dur = newSeconds !== undefined ? newSeconds : timerTotalSeconds;
    setTimerTotalSeconds(dur);
    setTimerRemaining(dur);
    setTimerFinished(false);
  };

  // Mốc thời gian khi bấm nút - / +
  const STEP_TIMES = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300];

  const handleDecreaseDuration = () => {
    let nextVal = STEP_TIMES[0];
    for (let i = STEP_TIMES.length - 1; i >= 0; i--) {
      if (STEP_TIMES[i] < timerTotalSeconds) {
        nextVal = STEP_TIMES[i];
        break;
      }
    }
    handleResetTimer(nextVal);
  };

  const handleIncreaseDuration = () => {
    let nextVal = STEP_TIMES[STEP_TIMES.length - 1];
    for (let i = 0; i < STEP_TIMES.length; i++) {
      if (STEP_TIMES[i] > timerTotalSeconds) {
        nextVal = STEP_TIMES[i];
        break;
      }
    }
    handleResetTimer(nextVal);
  };

  const handleCycleDuration = () => {
    const currIdx = STEP_TIMES.indexOf(timerTotalSeconds);
    const nextIdx = (currIdx + 1) % STEP_TIMES.length;
    handleResetTimer(STEP_TIMES[nextIdx]);
  };

  const getTimerDurationLabel = (sec) => {
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return s > 0 ? `${m}m ${s}s` : `${m} min`;
    }
    return `${sec} sec`;
  };

  const formatTimerDisplay = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Chỉnh sửa riêng phần Phút
  const handleStartEditMin = () => {
    handlePauseTimer();
    const m = Math.floor(timerRemaining / 60);
    setEditPartValue(String(m).padStart(2, '0'));
    setIsEditingTimerPart('min');
  };

  const handleCommitEditMin = () => {
    setIsEditingTimerPart(null);
    const parsed = parseInt(editPartValue, 10);
    const m = isNaN(parsed) ? Math.floor(timerRemaining / 60) : Math.max(0, Math.min(60, parsed));
    const s = timerRemaining % 60;
    const total = Math.max(1, m * 60 + s);
    handleResetTimer(total);
  };

  // Chỉnh sửa riêng phần Giây
  const handleStartEditSec = () => {
    handlePauseTimer();
    const s = timerRemaining % 60;
    setEditPartValue(String(s).padStart(2, '0'));
    setIsEditingTimerPart('sec');
  };

  const handleCommitEditSec = () => {
    setIsEditingTimerPart(null);
    const parsed = parseInt(editPartValue, 10);
    const s = isNaN(parsed) ? timerRemaining % 60 : Math.max(0, Math.min(59, parsed));
    const m = Math.floor(timerRemaining / 60);
    const total = Math.max(1, m * 60 + s);
    handleResetTimer(total);
  };

  // Dọn dẹp interval khi unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, []);

  // Âm thanh tick khi chỉnh số giây
  const playTickSound = () => {
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch (e) { }
  };

  const handleSelectSeconds = (sec) => {
    if (isPlaying) return;
    const val = Math.min(60, Math.max(3, Number(sec)));
    setMaxSeconds(val);
    setRemainingTime(val);
    playTickSound();
  };

  // Lưu bài hát vào localStorage
  useEffect(() => {
    localStorage.setItem('guess_music_songs_v3', JSON.stringify(songs));
  }, [songs]);

  // Âm thanh Web Audio API
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playBuzzer = () => {
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) { }
  };

  const playChime = () => {
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.55);
      });
    } catch (e) { }
  };

  // Âm thanh Fanfare kèn đồng chiến thắng hoành tráng
  const playGrandFanfare = () => {
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const chords = [
        { time: 0.0, notes: [261.63, 329.63, 392.00], dur: 0.18 },
        { time: 0.20, notes: [261.63, 329.63, 392.00], dur: 0.18 },
        { time: 0.40, notes: [261.63, 329.63, 392.00], dur: 0.18 },
        { time: 0.60, notes: [349.23, 440.00, 523.25], dur: 0.35 },
        { time: 0.98, notes: [392.00, 493.88, 587.33], dur: 0.35 },
        { time: 1.36, notes: [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50], dur: 2.2 }
      ];

      chords.forEach(chord => {
        chord.notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + chord.time);

          const vol = chord.dur > 1 ? 0.22 : 0.16;
          gain.gain.setValueAtTime(0.001, now + chord.time);
          gain.gain.linearRampToValueAtTime(vol, now + chord.time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + chord.time + chord.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + chord.time);
          osc.stop(now + chord.time + chord.dur + 0.05);
        });
      });

      const sparkleNotes = [783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51];
      sparkleNotes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + 1.4 + i * 0.07);
        gain.gain.setValueAtTime(0.12, now + 1.4 + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4 + i * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 1.4 + i * 0.07);
        osc.stop(now + 1.4 + i * 0.07 + 0.55);
      });
    } catch (e) { }
  };

  // Pháo hoa giấy Confetti
  const triggerConfetti = () => {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#111111', '#c7c2b5', '#e11d48', '#2563eb', '#16a34a', '#ca8a04', '#9333ea'];
    for (let i = 0; i < 110; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * 0.5,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 4 + 3.5,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6
      });
    }

    const start = Date.now();
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (Date.now() - start < 2800) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(render);
  };

  // Mở màn hình chi tiết bài hát
  const openSongDetail = (song) => {
    setSelectedSongId(song.id);
    setMaxSeconds(song.maxSeconds || 15);
    setRemainingTime(song.maxSeconds || 15);
    setProgressPercent(100);
    setShowAnswer(false);
    setShowCelebrationModal(false);
    stopPlayback();
    setCurrentScreen('DETAIL');
  };

  // Mở đáp án -> Dừng ngay phát nhạc + kích hoạt Fanfare + pháo hoa + modal chúc mừng
  const handleRevealAnswer = () => {
    stopPlayback(); // Dừng ngay tiếng nhạc đang phát khi bấm xem đáp án
    if (!showAnswer) {
      setShowAnswer(true);
      setShowCelebrationModal(true);
      playGrandFanfare();
      triggerConfetti();
    } else {
      setShowAnswer(false);
    }
  };

  // Phát nhạc (Đúng số giây tối đa đã nhập)
  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const duration = Number(maxSeconds) || 15;
    setIsPlaying(true);
    setRemainingTime(duration);
    setProgressPercent(100);

    const currentSong = songs.find(s => s.id === selectedSongId) || songs[0];
    const baseUrl = currentSong.audioFile || `/songs/${selectedSongId}.mp3`;
    const audioUrl = (baseUrl.startsWith('blob:') || baseUrl.startsWith('data:'))
      ? baseUrl
      : `${baseUrl}?t=${Date.now()}`; // Chống cache trình duyệt cho file tĩnh

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;

      audioRef.current.play().then(() => {
        const startTime = Date.now();
        const totalMs = duration * 1000;

        playbackTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remain = Math.max(0, (totalMs - elapsed) / 1000);
          const pct = (remain / duration) * 100;

          setRemainingTime(remain);
          setProgressPercent(pct);

          if (elapsed >= totalMs) {
            stopPlayback();
            playBuzzer();
          }
        }, 50);

      }).catch(err => {
        console.warn("Chưa tìm thấy file mp3, phát âm thanh mô phỏng:", err);
        const startTime = Date.now();
        const totalMs = duration * 1000;

        synthTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remain = Math.max(0, (totalMs - elapsed) / 1000);
          const pct = (remain / duration) * 100;

          setRemainingTime(remain);
          setProgressPercent(pct);

          if (elapsed >= totalMs) {
            stopPlayback();
            playBuzzer();
          }
        }, 50);
      });
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) { }
    }
  };

  // Chơi lại từ đầu: đặt lại tất cả các ô về chưa chơi
  const handleRestartGame = () => {
    stopPlayback();
    setSongs(prev => prev.map(s => ({ ...s, played: false })));
    setShowGameOverModal(false);
    setCurrentScreen('BOARD');
  };

  // Đánh dấu hoàn thành ô bài hát
  const markCompleted = () => {
    stopPlayback();
    const updated = songs.map(s => s.id === selectedSongId ? { ...s, played: true } : s);
    setSongs(updated);
    const isAllDone = updated.length > 0 && updated.every(s => s.played);
    setCurrentScreen('BOARD');

    if (isAllDone) {
      setTimeout(() => {
        playGrandFanfare();
        triggerConfetti();
        setTimeout(triggerConfetti, 450);
        setShowGameOverModal(true);
      }, 350);
    }
  };

  const allCompleted = songs.length > 0 && songs.every(s => s.played);
  const completedCount = songs.filter(s => s.played).length;
  const currentSong = songs.find(s => s.id === selectedSongId) || songs[0];

  return (
    <div className="flex-1 flex flex-col justify-between items-center p-3 sm:p-5 md:p-6 max-w-5xl mx-auto w-full min-h-screen">
      <canvas id="confettiCanvas"></canvas>
      <audio ref={audioRef} preload="auto" className="hidden"></audio>

      {/* =========================================================
          COUNTDOWN TIMER TOOL (SHOWN ON BOARD & DETAIL SCREENS ONLY)
         ========================================================= */}
      {currentScreen !== 'READY' && (
        <>
          {/* PINNED TIMER ICON TAB ON THE RIGHT EDGE */}
          <div
            className={`fixed right-0 top-28 sm:top-32 z-40 select-none transition-all duration-300 ease-in-out ${isTimerOpen
              ? 'translate-x-full opacity-0 pointer-events-none'
              : 'translate-x-0 opacity-100 pointer-events-auto'
              }`}
          >
            <button
              onClick={() => setIsTimerOpen(true)}
              className={`flex items-center gap-1 pl-3 pr-2 py-2.5 rounded-l-2xl border-l-2 border-y-2 shadow-xl transition-all duration-200 active:scale-95 cursor-pointer ${timerFinished
                ? 'bg-amber-100 text-amber-800 border-amber-400 shadow-amber-500/30 animate-pulse'
                : isTimerRunning
                  ? 'bg-[#ede7d9] text-[#8b6508] border-[#c59b27] shadow-amber-500/20'
                  : 'bg-[#ede7d9] hover:bg-[#f5efe6] text-stone-800 border-[#c4baa6] hover:border-[#b8860b]'
                }`}
              title="Open countdown timer"
            >
              <span className="text-xl sm:text-2xl leading-none">⏱</span>
              {(isTimerRunning || timerFinished) && (
                <span
                  className={`font-outfit font-black text-xs tracking-tight ml-0.5 ${timerFinished ? 'text-amber-700 animate-pulse' : 'text-[#8b6508]'
                    }`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatTimerDisplay(timerRemaining)}
                </span>
              )}
            </button>
          </div>

          {/* =========================================================
          ĐỒNG HỒ ĐẾM NGƯỢC THUẦN HÌNH TRÒN MÀU BE (KHÔNG CẦN NÚT ÂM THANH)
         ========================================================= */}
          <div
            className={`fixed right-3 sm:right-6 top-24 sm:top-28 z-50 select-none transition-all duration-300 ease-out transform origin-top-right ${isTimerOpen
              ? 'translate-x-0 opacity-100 scale-100 pointer-events-auto'
              : 'translate-x-12 opacity-0 scale-90 pointer-events-none'
              }`}
          >
            {/* KHỐI MẶT ĐỒNG HỒ TRÒN HOÀN TOÀN MÀU BE */}
            <div
              className={`w-48 h-48 sm:w-52 sm:h-52 aspect-square rounded-full bg-gradient-to-br from-[#f8f4ec] via-[#ede7d9] to-[#e4dcce] border-2 shadow-2xl flex flex-col items-center justify-center p-3 text-stone-900 transition-colors duration-300 relative ${timerFinished
                ? 'border-[#c59b27] shadow-[0_0_24px_rgba(197,155,39,0.7)] animate-pulse'
                : isTimerRunning
                  ? 'border-[#c59b27] shadow-[0_0_18px_rgba(197,155,39,0.35)]'
                  : 'border-[#c8bfae] shadow-stone-800/20'
                }`}
            >
              {/* Close button ✕ */}
              <button
                onClick={() => setIsTimerOpen(false)}
                className="absolute top-2.5 right-3.5 w-6 h-6 rounded-full bg-black/5 hover:bg-black/15 text-stone-600 hover:text-black flex items-center justify-center text-xs font-bold transition active:scale-90 cursor-pointer"
                title="Close timer"
              >
                ✕
              </button>

              {/* Time's up alert */}
              {timerFinished ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-400 text-[11px] font-bold text-amber-800 mb-0.5 animate-pulse shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>TIME'S UP!</span>
                </div>
              ) : (
                /* Duration capsule [- 1 min +] */
                <div className="bg-[#dfd5c2] hover:bg-[#d7ccb7] rounded-full px-2.5 py-0.5 flex items-center gap-2 text-xs text-stone-800 border border-[#cbbeaa] shadow-xs mb-0.5 sm:mb-1">
                  <button
                    onClick={handleDecreaseDuration}
                    className="text-stone-600 hover:text-black font-bold px-1.5 active:scale-90 text-sm transition cursor-pointer"
                    title="Decrease time"
                  >
                    -
                  </button>
                  <span
                    onClick={handleCycleDuration}
                    className="font-bold text-[11px] text-stone-900 select-none cursor-pointer tracking-wide"
                    title="Click to cycle preset duration"
                  >
                    {getTimerDurationLabel(timerTotalSeconds)}
                  </span>
                  <button
                    onClick={handleIncreaseDuration}
                    className="text-stone-600 hover:text-black font-bold px-1.5 active:scale-90 text-sm transition cursor-pointer"
                    title="Increase time"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Big countdown digits: Minutes and seconds editable separately */}
              <div
                className={`flex items-center justify-center my-1 select-none font-outfit font-black text-4xl sm:text-5xl tracking-tight leading-none ${timerFinished
                  ? 'text-amber-600 animate-pulse'
                  : timerRemaining <= 5 && isTimerRunning
                    ? 'text-amber-600'
                    : 'text-stone-950'
                  }`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {/* MINUTES */}
                {isEditingTimerPart === 'min' ? (
                  <input
                    type="text"
                    autoFocus
                    maxLength={2}
                    value={editPartValue}
                    onChange={(e) => setEditPartValue(e.target.value.replace(/\D/g, ''))}
                    onFocus={(e) => e.target.select()}
                    onBlur={handleCommitEditMin}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitEditMin();
                      if (e.key === 'Escape') setIsEditingTimerPart(null);
                    }}
                    className="font-outfit font-black text-4xl sm:text-5xl text-center w-14 sm:w-16 bg-[#faf7f0] text-stone-900 border-2 border-[#b8860b] rounded-lg p-0 focus:outline-none focus:ring-1 focus:ring-[#c59b27] leading-none shadow-inner"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    title="Enter minutes, then press Enter"
                  />
                ) : (
                  <span
                    onClick={handleStartEditMin}
                    className="px-0.5 rounded hover:bg-black/5 hover:text-[#8b6508] cursor-pointer transition-colors"
                    title="Click to edit minutes"
                  >
                    {String(Math.floor(timerRemaining / 60)).padStart(2, '0')}
                  </span>
                )}

                {/* COLON */}
                <span className="mx-0.5 opacity-80 select-none">:</span>

                {/* SECONDS */}
                {isEditingTimerPart === 'sec' ? (
                  <input
                    type="text"
                    autoFocus
                    maxLength={2}
                    value={editPartValue}
                    onChange={(e) => setEditPartValue(e.target.value.replace(/\D/g, ''))}
                    onFocus={(e) => e.target.select()}
                    onBlur={handleCommitEditSec}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitEditSec();
                      if (e.key === 'Escape') setIsEditingTimerPart(null);
                    }}
                    className="font-outfit font-black text-4xl sm:text-5xl text-center w-14 sm:w-16 bg-[#faf7f0] text-stone-900 border-2 border-[#b8860b] rounded-lg p-0 focus:outline-none focus:ring-1 focus:ring-[#c59b27] leading-none shadow-inner"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    title="Enter seconds (0-59), then press Enter"
                  />
                ) : (
                  <span
                    onClick={handleStartEditSec}
                    className="px-0.5 rounded hover:bg-black/5 hover:text-[#8b6508] cursor-pointer transition-colors"
                    title="Click to edit seconds"
                  >
                    {String(timerRemaining % 60).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-24 sm:w-28 h-[2.5px] bg-[#d6ccb8] rounded-full my-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8b6508] via-[#c59b27] to-[#f3d978] shadow-[0_0_6px_rgba(197,155,39,0.5)] rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(0, Math.min(100, (timerRemaining / (timerTotalSeconds || 1)) * 100))}%` }}
                ></div>
              </div>

              {/* Controls: [ ▶ Play/Pause ] and [ ↺ Reset ] */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => (isTimerRunning ? handlePauseTimer() : handleStartTimer())}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#c59b27] hover:from-[#a07409] hover:to-[#b8860b] text-stone-950 font-black flex items-center justify-center shadow-md hover:shadow-lg border border-[#f3d978]/60 active:scale-95 transition cursor-pointer"
                  title={isTimerRunning ? "Pause" : "Start"}
                >
                  {isTimerRunning ? (
                    <span className="text-xs font-black leading-none">❚❚</span>
                  ) : (
                    <span className="text-xs ml-0.5 leading-none">▶</span>
                  )}
                </button>

                <button
                  onClick={() => handleResetTimer()}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#cbbeaa] bg-[#f8f4ec] hover:bg-[#ede5d6] text-stone-800 flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer text-sm font-bold"
                  title="Reset"
                >
                  ↺
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          HIỆU ỨNG CÁC NỐT NHẠC RƠI NHƯ TUYẾT TRÊN TẤT CẢ CÁC TRANG
         ========================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
        {AMBIENT_NOTES.map((note) => (
          <span
            key={note.id}
            className={`falling-note ${note.size} ${note.color} font-editorial font-bold drop-shadow-xs`}
            style={{
              left: note.left,
              '--note-duration': note.duration,
              '--note-delay': note.delay,
              '--note-drift': note.drift,
              '--note-rot': note.rot,
              '--note-opacity': isPlaying ? (Number(note.opacity) * 1.6).toFixed(2) : note.opacity
            }}
          >
            {note.symbol}
          </span>
        ))}
      </div>

      {/* =========================================================
          BODY CHÍNH: CĂN GIỮA MÀN HÌNH, HOÀN TOÀN RESPONSIVE
         ========================================================= */}
      <main className="flex-1 flex items-center justify-center w-full py-4 sm:py-6 relative z-10">

        {/* -----------------------------------------------------
            HOME SCREEN: LARGE VINYL "GUESS THE SONG" & "PLAY"
           ----------------------------------------------------- */}
        {currentScreen === 'READY' && (
          <div className="w-full flex items-center justify-center py-2 animate-screen select-none">
            {/* VINYL DISC + TONE-ARM CONTAINER */}
            <div className="relative flex items-center justify-center cursor-pointer">
              {/* LARGE BLACK VINYL DISC (SMOOTH PLAY-STATE SPIN ON HOVER - NO SCALE JITTER) */}
              <div
                onMouseEnter={() => setIsReadyHovered(true)}
                onMouseLeave={() => setIsReadyHovered(false)}
                className="relative w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] md:w-[620px] md:h-[620px] lg:w-[720px] lg:h-[720px] xl:w-[780px] xl:h-[780px] max-w-[95vw] shrink-0 aspect-square rounded-full shadow-[0_45px_100px_rgba(0,0,0,0.7)]"
              >
                {/* BLACK VINYL GROOVES & SPECULAR SHEEN (SPINS CONTINUOUSLY) */}
                <div
                  className="vinyl-disc spinning-disc is-spinning w-full h-full rounded-full flex items-center justify-center pointer-events-none"
                >
                  <div className="vinyl-grooves"></div>
                  <div className="vinyl-rotating-sheen"></div>
                  <div className="vinyl-rotating-gleam"></div>
                </div>

                {/* CENTER PAPER LABEL (STATIONARY - DOES NOT ROTATE WITH DISC) */}
                <div
                  className="absolute inset-0 m-auto w-[46%] h-[46%] rounded-full vinyl-center-paper border border-black/15 shadow-2xl flex flex-col items-center justify-center p-4 z-10 select-none pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentScreen('BOARD');
                  }}
                >
                  <span className="font-title font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight leading-[0.9] text-stone-950 select-none pointer-events-none text-center">
                    GUESS
                  </span>
                  <span className="font-title font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight leading-[0.9] text-stone-950 select-none pointer-events-none text-center mt-1 sm:mt-2">
                    THE SONG
                  </span>

                  {/* PLAY BUTTON (NO SCALE-105 JITTER OR DUPLICATE HOVER TOGGLES) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentScreen('BOARD');
                    }}
                    className="mt-4 sm:mt-7 px-7 sm:px-9 py-1.5 sm:py-2.5 rounded-full font-editorial font-bold text-xs sm:text-sm md:text-base lg:text-lg tracking-[0.35em] text-stone-800 hover:text-black active:scale-95 transition-colors duration-200 cursor-pointer hover:bg-black/10"
                    title="Start Playing"
                  >
                    PLAY
                  </button>
                </div>

                {/* TONE-ARM: BASE MOUNTED TIGHTLY ON DISC EDGE */}
                <div className="absolute top-[2%] right-[2%] w-[32%] h-[68%] pointer-events-none z-20 overflow-visible">
                  <svg
                    viewBox="0 0 160 340"
                    className="w-full h-full drop-shadow-2xl overflow-visible"
                  >
                    <defs>
                      <radialGradient id="pivotBaseGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ded7cb" />
                        <stop offset="60%" stopColor="#94a3b8" />
                        <stop offset="90%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e232a" />
                      </radialGradient>
                      <linearGradient id="chromeArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="25%" stopColor="#cbd5e1" />
                        <stop offset="50%" stopColor="#94a3b8" />
                        <stop offset="75%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#64748b" />
                      </linearGradient>
                      <linearGradient id="silverKnurl" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="50%" stopColor="#f1f5f9" />
                        <stop offset="100%" stopColor="#64748b" />
                      </linearGradient>
                    </defs>

                    {/* 1. PIVOT BASE SITTING TIGHTLY ON OUTER EDGE OF DISC */}
                    <circle cx="118" cy="48" r="32" fill="#1b1e23" stroke="#0f1115" strokeWidth="2" />
                    <circle cx="118" cy="48" r="26" fill="#333842" stroke="#64748b" strokeWidth="1.2" />
                    <circle cx="118" cy="48" r="20" fill="url(#pivotBaseGrad)" stroke="#cbd5e1" strokeWidth="1" />
                    <circle cx="118" cy="48" r="13" fill="#1e232a" />
                    <circle cx="118" cy="48" r="7.5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                    <circle cx="118" cy="48" r="3.5" fill="#0f172a" />

                    {/* 2. COUNTERWEIGHT */}
                    <g transform="rotate(22 118 48)">
                      <rect x="107" y="10" width="22" height="24" rx="2.5" fill="url(#silverKnurl)" stroke="#334155" strokeWidth="1.2" />
                      <line x1="107" y1="15" x2="129" y2="15" stroke="#475569" strokeWidth="1" />
                      <line x1="107" y1="20" x2="129" y2="20" stroke="#475569" strokeWidth="1" />
                      <line x1="107" y1="25" x2="129" y2="25" stroke="#475569" strokeWidth="1" />
                    </g>

                    {/* 3. TONE-ARM: RESTING ON BLACK GROOVE */}
                    <g
                      className="home-tonearm home-tonearm-active"
                    >
                      {/* Metal collar */}
                      <rect x="114" y="44" width="8" height="15" rx="1.5" fill="#334155" />

                      {/* Tone arm curved tube */}
                      <path
                        d="M 117 58 C 114 105, 106 155, 96 200 C 88 238, 78 268, 68 295"
                        fill="none"
                        stroke="url(#chromeArmGrad)"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                      />
                      {/* Highlight */}
                      <path
                        d="M 116 60 C 113 105, 105 155, 95 200 C 87 238, 77 268, 67 295"
                        fill="none"
                        stroke="rgba(255,255,255,0.75)"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />

                      {/* Arm connector joint */}
                      <circle cx="68" cy="295" r="4" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

                      {/* Headshell / Cartridge on the black groove */}
                      <g transform="rotate(-18 68 295)">
                        <path d="M 64 295 L 52 311 L 44 304 L 56 288 Z" fill="#1e242b" stroke="#64748b" strokeWidth="1.2" />
                        <circle cx="55" cy="301" r="1.2" fill="#cbd5e1" />
                        <circle cx="49" cy="306" r="1.2" fill="#cbd5e1" />
                        {/* Stylus needle resting on black vinyl groove */}
                        <line x1="45" y1="308" x2="40" y2="314" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------
            SCREEN 3: BOARD (TRACK NUMBER GRID)
           ----------------------------------------------------- */}
        {currentScreen === 'BOARD' && (
          <div className="w-full max-w-2xl flex flex-col items-center animate-screen mx-auto px-2 sm:px-4">
            {/* Main Header using font-title (Playfair Display) */}
            <div className="w-full py-3 sm:py-6 text-center mb-1 sm:mb-2">
              <h1 className="font-title font-black text-3xl sm:text-4xl md:text-5xl tracking-tight uppercase text-stone-900 select-none py-1">
                CHOOSE THE NUMBER
              </h1>
            </div>

            {/* Victory banner or instructions */}
            {allCompleted ? (
              <div className="w-full mb-4 p-3 sm:p-3.5 rounded-2xl bg-amber-50/95 border-2 border-[#d4af37] text-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-screen">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <span className="text-3xl sm:text-4xl animate-bounce">🏆</span>
                  <div>
                    <h3 className="font-title font-black text-sm sm:text-base uppercase tracking-wider text-black">
                      ALL TRACKS COMPLETED!
                    </h3>
                    <p className="text-xs text-stone-600 font-editorial">
                      Congratulations! You have completed all tracks.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRestartGame}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#c59b27] text-stone-950 text-xs font-editorial font-black uppercase tracking-wider transition active:scale-95 shadow-md whitespace-nowrap cursor-pointer"
                  >
                    ↺ Play Again
                  </button>
                </div>
              </div>
            ) : null}

            {/* Dynamic Track Grid with responsive columns */}
            <div className={`grid ${getGridCols(songs.length)} gap-2.5 sm:gap-3.5 w-full`}>
              {songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => openSongDetail(song)}
                  className={`aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center p-2 active:scale-95 shadow-sm relative overflow-hidden group cursor-pointer ${song.played
                    ? 'bg-stone-900 text-[#f3d978] border-2 border-[#d4af37] shadow-md hover:scale-105 hover:border-[#f3d978] hover:shadow-xl'
                    : 'bg-paper-card hover:bg-white border-2 border-black/15 hover:border-black/50 text-stone-900 hover:shadow-xl hover:-translate-y-1 hover:scale-105'
                    }`}
                  title={song.played ? `Track ${song.number}: ${song.title} (Completed)` : `Open track ${song.number}`}
                >
                  {/* Small gold checkmark for completed tracks */}
                  {song.played && (
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[#d4af37] text-[10px] sm:text-xs font-black select-none z-10">
                      ✓
                    </span>
                  )}
                  {song.played ? (
                    <div className="flex flex-col items-center justify-center w-full h-full p-1 sm:p-2 text-center select-none overflow-hidden">
                      <span className="font-editorial text-2xl sm:text-3xl font-black text-[#f3d978] leading-none mb-1 drop-shadow-xs">
                        {song.number}
                      </span>
                      <span
                        className="font-editorial text-[9px] min-[400px]:text-[10px] sm:text-xs font-bold text-stone-200 line-clamp-2 leading-tight uppercase tracking-tight text-center break-words px-0.5"
                        title={song.title}
                      >
                        {song.title}
                      </span>
                    </div>
                  ) : (
                    <span className="font-editorial text-3xl sm:text-4xl font-extrabold tracking-tight select-none">
                      {song.number}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
              <button
                onClick={() => {
                  setIsTimerOpen(false);
                  handlePauseTimer();
                  setCurrentScreen('READY');
                }}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-stone-400/80 bg-white/80 hover:bg-stone-100 text-stone-700 hover:text-black font-editorial text-xs sm:text-sm uppercase tracking-wider font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                ← Home
              </button>

              {/* Edit Questions / Customize Tracks Button */}
              <button
                onClick={openCustomModal}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-stone-800/30 bg-stone-900 hover:bg-black text-[#f3d978] hover:text-white font-editorial text-xs sm:text-sm uppercase tracking-wider font-bold shadow-md hover:shadow-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-2"
                title="Edit questions, titles and upload custom audio"
              >
                <span className="text-base leading-none">✎</span>
                <span>Edit Questions</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(allCompleted ? "Do you want to play again from the beginning?" : "Reset all tracks to unplayed?")) {
                    handleRestartGame();
                  }
                }}
                className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#c59b27] hover:from-[#a07409] hover:to-[#b8860b] text-stone-950 font-editorial text-xs sm:text-sm uppercase tracking-wider font-black shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap flex items-center justify-center gap-2 border border-[#f3d978]/60 cursor-pointer"
              >
                <span>{allCompleted ? 'Play Again' : 'Reset'}</span>
                <span className="text-base leading-none">↺</span>
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------
            SCREEN 4: DETAIL (VINYL SLEEVE, DISC & CONTROLS)
           ----------------------------------------------------- */}
        {currentScreen === 'DETAIL' && (
          <div className="w-full max-w-4xl flex flex-col items-center animate-screen mx-auto px-2 sm:px-4">

            {/* Main Header using font-title (Playfair Display) */}
            <div className="w-full max-w-xl py-3 sm:py-6 text-center mb-1">
              <h1 className="font-title font-black text-3xl sm:text-4xl md:text-5xl tracking-tight uppercase text-stone-900 drop-shadow-sm select-none py-1">
                GUESS THE SONG
              </h1>
            </div>

            {/* Vinyl Sleeve & Rotating Vinyl Record */}
            <div className="relative flex items-center justify-center my-2 sm:my-3 select-none w-full max-w-xl mx-auto px-1 sm:px-2">

              {/* Sleeve Cover (Z-20) */}
              <div
                className="relative z-20 w-[185px] h-[185px] min-[420px]:w-[215px] min-[420px]:h-[215px] sm:w-[255px] sm:h-[255px] md:w-[285px] md:h-[285px] paper-sleeve rounded-sm p-3.5 sm:p-4 md:p-5 flex flex-col items-center justify-between text-center border border-black/20 shadow-2xl shrink-0"
                onMouseEnter={() => setIsDetailHovered(true)}
                onMouseLeave={() => setIsDetailHovered(false)}
              >
                <div className="album-ring-wear"></div>
                <div className="album-spine"></div>
                <div className="album-opening-lip"></div>

                {/* Pill Capsule Badge */}
                <div className="z-10 flex items-center justify-center pt-0.5 sm:pt-1">
                  <div className="px-3 sm:px-3.5 py-0.5 rounded-full border border-[#d4af37]/40 bg-white/95 shadow-xs flex items-center justify-center gap-1.5 backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27]"></span>
                    <span className="font-editorial text-[10px] sm:text-[11px] font-black tracking-wider text-stone-900 uppercase select-none">
                      NO.{currentSong.number}
                    </span>
                  </div>
                </div>

                {/* Big Play Button with gold aura */}
                <div className="z-10 my-0.5 sm:my-1">
                  <button
                    onClick={togglePlayback}
                    className={`w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-[#141414] text-white flex items-center justify-center border-2 transition-all duration-300 transform active:scale-95 shadow-xl hover:scale-110 hover:border-[#d4af37] hover:shadow-[0_0_24px_rgba(212,175,55,0.45)] cursor-pointer ${isPlaying
                      ? 'border-[#d4af37] pulse-playing'
                      : 'border-[#d4af37]/40 shadow-black/40'
                      }`}
                    title={isPlaying ? "Stop playback" : `Play ${maxSeconds} seconds`}
                  >
                    {isPlaying ? (
                      <span className="text-xl sm:text-2xl text-[#f3d978]">❚❚</span>
                    ) : (
                      <span className="text-xl sm:text-2xl ml-1 text-[#fbf8f0]">▶</span>
                    )}
                  </button>
                </div>

                {/* Reveal Answer Area */}
                <div className="w-full z-10 px-0.5">
                  {!showAnswer ? (
                    <button
                      onClick={handleRevealAnswer}
                      className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-[#1c1a17] hover:bg-black text-[#fbf8f0] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 font-editorial text-xs sm:text-sm font-bold shadow-md hover:shadow-lg border border-[#d4af37]/35 hover:border-[#d4af37] hover:-translate-y-0.5 cursor-pointer"
                      title="Click to reveal answer"
                    >
                      <span className="text-[#d4af37] text-sm">👁</span>
                      <span className="uppercase tracking-wider text-[11px] sm:text-xs">Show Answer</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleRevealAnswer}
                      className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-[#141414] text-white border-2 border-[#d4af37]/60 shadow-lg flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
                      title="Click to toggle answer"
                    >
                      <span className="font-editorial text-[11px] sm:text-xs md:text-sm font-extrabold text-[#f3d978] max-w-full leading-snug px-1 text-center line-clamp-2">
                        {currentSong.title}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Vinyl Disc */}
              <div
                className="relative z-10 -ml-11 min-[420px]:-ml-14 sm:-ml-16 md:-ml-18 w-[185px] h-[185px] min-[420px]:w-[215px] min-[420px]:h-[215px] sm:w-[255px] sm:h-[255px] md:w-[285px] md:h-[285px] shrink-0 cursor-pointer select-none transition-transform duration-300"
                onClick={togglePlayback}
                title={isPlaying ? "Click to stop" : `Play ${maxSeconds} seconds`}
              >
                <div
                  className={`vinyl-disc w-full h-full rounded-full flex items-center justify-center shadow-2xl transition-transform duration-500 ${isPlaying ? 'spinning' : 'hover:scale-[1.01]'
                    }`}
                >
                  <div className="vinyl-grooves"></div>
                  <div className="vinyl-sheen"></div>

                  {/* Center paper disc label */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-[#faf7f2] border-2 border-[#d4af37]/35 flex flex-col items-center justify-center shadow-inner relative z-10">
                    <span className="font-editorial text-[10px] sm:text-xs md:text-sm font-black text-stone-900 tracking-wider leading-none select-none mb-1">
                      NO.{currentSong.number}
                    </span>
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-black border border-[#d4af37]/50"></div>
                  </div>
                </div>

                {/* Tonearm needle */}
                <div className="absolute -top-4 -right-3 sm:-top-5 sm:-right-4 md:-top-6 md:-right-5 w-22 sm:w-26 md:w-30 h-40 sm:h-48 md:h-54 pointer-events-none z-30">
                  <svg
                    viewBox="0 0 100 160"
                    className={`w-full h-full drop-shadow-2xl tone-arm-needle ${isPlaying ? 'tone-arm-active' : 'tone-arm-idle'
                      }`}
                  >
                    <circle cx="75" cy="25" r="16" fill="#cbd5e1" stroke="#64748b" strokeWidth="2.5" />
                    <circle cx="75" cy="25" r="9" fill="#1e293b" />
                    <circle cx="75" cy="25" r="3.5" fill="#d4af37" />
                    <path d="M 75 25 Q 60 70 32 115 L 20 135" fill="none" stroke="#94a3b8" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M 75 25 Q 60 70 32 115 L 20 135" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    <rect x="12" y="130" width="16" height="22" rx="3" transform="rotate(-30 20 140)" fill="#1c1917" stroke="#c59b27" strokeWidth="1.8" />
                    <polygon points="17,150 23,150 20,158" fill="#d4af37" transform="rotate(-30 20 140)" />
                  </svg>
                </div>
              </div>

            </div>

            {/* CONTROL PANEL */}
            <div className="w-full max-w-xl mt-2 bg-paper-card p-3.5 sm:p-4 rounded-2xl border border-black/15 shadow-sm space-y-3">

              {/* SLIDER FOR PLAYBACK DURATION */}
              <div className="space-y-1.5 pb-2 border-b border-black/10">
                <div className="flex items-center justify-between text-xs font-editorial">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <span className="text-[#c59b27]">⏱</span>
                    <span>Playback Duration:</span>
                    <span className="text-stone-950 font-black text-xs sm:text-sm ml-0.5 px-2 py-0.5 rounded bg-stone-200/80 border border-stone-300/80">{maxSeconds}s</span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 pt-0.5">
                  <span className="text-[10px] text-stone-500 font-bold">3s</span>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    value={maxSeconds}
                    disabled={isPlaying}
                    onChange={(e) => handleSelectSeconds(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-[#c59b27]"
                  />
                  <span className="text-[10px] text-stone-500 font-bold">60s</span>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-editorial">
                  <span className="whitespace-nowrap font-bold text-stone-800 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#c59b27] animate-ping' : 'bg-stone-400'}`}></span>
                    <span>{isPlaying ? 'Playing...' : 'Ready to play'}</span>
                  </span>
                  <span className="font-black text-stone-800 whitespace-nowrap">
                    <span className="text-[#b8860b]">{remainingTime.toFixed(1)}s</span> / {maxSeconds}s
                  </span>
                </div>
                <div className="w-full bg-stone-200/90 h-2.5 rounded-full overflow-hidden border border-black/10 p-0.5">
                  <div
                    className="bg-gradient-to-r from-[#8b6508] via-[#c59b27] to-[#f3d978] h-full rounded-full transition-all duration-75 shadow-xs"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* BOTTOM ACTIONS */}
              <div className="flex items-center justify-between pt-1.5 border-t border-black/10 gap-3">
                <button
                  onClick={() => { stopPlayback(); setCurrentScreen('BOARD'); }}
                  className="px-6 py-2 sm:py-2.5 rounded-full border border-stone-400/80 bg-white/80 hover:bg-stone-100 text-stone-700 hover:text-black font-editorial text-xs sm:text-sm uppercase tracking-wider font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  ← Back
                </button>

                <button
                  onClick={markCompleted}
                  className="px-6 sm:px-7 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#c59b27] hover:from-[#a07409] hover:to-[#b8860b] text-stone-950 font-editorial text-xs sm:text-sm uppercase tracking-wider font-black shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 border border-[#f3d978]/60 group cursor-pointer"
                >
                  <span>Done</span>
                  <svg className="w-4 h-4 text-stone-950 stroke-[3] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* =========================================================
          MODAL: CELEBRATION WHEN ANSWER IS REVEALED
         ========================================================= */}
      {showCelebrationModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-screen">
          <div className="bg-paper-card rounded-3xl p-6 sm:p-8 border-2 border-black max-w-lg w-full text-center relative shadow-2xl">
            <div className="text-5xl sm:text-6xl mb-2 animate-bounce">🎉</div>
            <div className="px-3.5 py-1 rounded-full bg-black text-white text-[11px] font-vintage uppercase tracking-widest inline-block mb-3 shadow whitespace-nowrap">
              CONGRATULATIONS
            </div>

            <h2 className="font-title font-black text-2xl sm:text-3xl md:text-4xl text-black uppercase tracking-tight mb-2 whitespace-nowrap">
              Correct Answer!
            </h2>

            <div className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-black/80 my-4 shadow-inner">
              <span className="text-xs text-stone-500 uppercase font-vintage tracking-widest block mb-1 whitespace-nowrap">
                TRACK NO. {currentSong.number}
              </span>
              <div className="font-editorial font-extrabold text-xl sm:text-2xl md:text-3xl text-black uppercase tracking-wide break-words text-center px-2">
                {currentSong.title}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center mt-5">
              <button
                onClick={() => setShowCelebrationModal(false)}
                className="px-6 py-2.5 rounded-full border border-black/70 font-editorial text-xs sm:text-sm uppercase tracking-wider hover:bg-black hover:text-white transition active:scale-95 whitespace-nowrap cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowCelebrationModal(false);
                  markCompleted();
                }}
                className="px-7 py-2.5 rounded-full bg-black text-white font-editorial text-xs sm:text-sm uppercase tracking-wider hover:bg-stone-800 transition active:scale-95 shadow-md whitespace-nowrap cursor-pointer"
              >
                Next Track →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ALL TRACKS COMPLETED VICTORY MODAL
         ========================================================= */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-screen">
          <div className="bg-paper-card rounded-3xl p-6 sm:p-8 border-2 border-black max-w-lg w-full text-center relative shadow-2xl overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative inline-block mb-2">
              <span className="text-5xl sm:text-6xl inline-block animate-bounce drop-shadow-md">🏆</span>
            </div>

            <div className="mb-2">
              <span className="px-3.5 py-1 rounded-full border border-[#d4af37]/60 bg-amber-50/80 text-[#967117] text-[11px] font-vintage uppercase tracking-widest inline-block shadow-xs font-bold">
                ★ ALL TRACKS COMPLETED ★
              </span>
            </div>

            <h2 className="py-1 font-title font-black text-3xl sm:text-4xl text-stone-900 mb-1 leading-tight uppercase tracking-tight select-none">
              Victory!
            </h2>

            <p className="font-editorial text-sm sm:text-base text-stone-600 mb-5 px-2 leading-relaxed">
              You have successfully completed all the tracks!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
              <button
                onClick={handleRestartGame}
                className="px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#c59b27] hover:from-[#a07409] hover:to-[#b8860b] text-stone-950 font-editorial text-xs sm:text-sm font-black uppercase tracking-wider shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 border border-[#f3d978]/60 cursor-pointer"
              >
                <span>↺</span>
                <span>Play Again</span>
              </button>

              <button
                onClick={() => setShowGameOverModal(false)}
                className="px-5 py-2.5 sm:py-3 rounded-full border border-stone-400/80 bg-white/80 hover:bg-stone-100 text-stone-700 hover:text-black font-editorial text-xs sm:text-sm font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs whitespace-nowrap cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: EDIT QUESTIONS / CUSTOMIZE TRACKS & AUDIO
         ========================================================= */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-screen">
          <div className="bg-[#fcfaf5] rounded-3xl p-4 sm:p-7 border-2 border-stone-900 max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 mb-1">

                </div>
                <h2 className="font-title font-black text-2xl sm:text-3xl text-stone-900 uppercase tracking-tight">
                  EDIT QUESTIONS
                </h2>

              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsCustomModalOpen(false);
                  if (previewAudioRef.current) previewAudioRef.current.pause();
                  setPreviewingSongId(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 hover:text-black flex items-center justify-center text-sm font-bold transition active:scale-90 cursor-pointer shrink-0 ml-2"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Track Count Config Bar */}
            <div className="py-3 px-3 sm:px-4 my-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div>
                  <span className="text-xs sm:text-sm font-black text-stone-900 font-editorial uppercase tracking-wider block">
                    Total Questions: {modalTrackCount}
                  </span>

                </div>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 self-end sm:self-center">
                {/* Quick Presets */}
                {[4, 6, 8, 12, 16, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleTrackCountChange(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-editorial font-bold transition cursor-pointer ${modalTrackCount === preset
                      ? 'bg-stone-900 text-[#f3d978] shadow-xs'
                      : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-300'
                      }`}
                  >
                    {preset}
                  </button>
                ))}

                {/* Stepper buttons */}
                <div className="flex items-center gap-1 ml-1 border-l border-amber-300/80 pl-2">
                  <button
                    type="button"
                    onClick={() => handleTrackCountChange(modalTrackCount - 1)}
                    disabled={modalTrackCount <= 1}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 disabled:opacity-40 text-stone-800 font-black flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95"
                    title="Decrease count"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrackCountChange(modalTrackCount + 1)}
                    disabled={modalTrackCount >= 30}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 disabled:opacity-40 text-stone-800 font-black flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95"
                    title="Increase count"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Track List */}
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 my-1 space-y-2.5 max-h-[50vh]">
              {modalDraftSongs.map((track) => (
                <div
                  key={track.id}
                  className="bg-white rounded-2xl p-3 sm:p-3.5 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-stone-400 transition"
                >
                  {/* Left: Track ID & Title Input (Elevated to align horizontally with buttons) */}
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-stone-900 text-[#f3d978] border border-[#d4af37]/60 flex items-center justify-center shrink-0 shadow-xs">
                      <span className="font-editorial text-xs sm:text-sm font-black">
                        #{track.number}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => handleSongTitleChange(track.id, e.target.value)}
                      placeholder={`Song title for Track ${track.number}...`}
                      className="flex-1 h-[32px] px-3.5 rounded-full bg-stone-50 border border-stone-300 focus:bg-white focus:border-[#c59b27] focus:ring-2 focus:ring-[#c59b27]/30 text-stone-900 font-editorial text-xs sm:text-sm font-semibold transition outline-none min-w-0"
                    />
                  </div>

                  {/* Right: Audio Info & Actions (Strictly vertically centered on the exact same baseline) */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                    {/* Audio Status Pill (Fixed size, same neutral frame color, marquee on hover) */}
                    <div
                      className="pill-marquee-container relative w-[130px] sm:w-[155px] h-[32px] rounded-full bg-stone-100 border border-stone-300 text-stone-700 text-[10px] sm:text-[11px] font-bold font-editorial flex items-center px-2.5 overflow-hidden select-none shrink-0"
                      title={track.hasCustomAudio ? (track.customAudioName || 'Custom Audio') : 'Default Track'}
                    >
                      <div className="relative flex-1 overflow-hidden h-full flex items-center">
                        <span className="pill-marquee">
                          {track.hasCustomAudio ? (track.customAudioName || 'Custom Audio') : 'Default Track'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Upload button with Lucide React icon */}
                      <label className="h-[32px] px-3.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-editorial font-bold cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs shrink-0">
                        <Upload className="w-3.5 h-3.5 text-stone-700 shrink-0" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(track.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      {/* Play Button with Lucide React icon */}
                      <button
                        type="button"
                        onClick={() => handleTogglePreview(track)}
                        className={`h-[32px] px-3.5 rounded-full text-xs font-editorial font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 ${previewingSongId === track.id
                          ? 'bg-[#c59b27] text-stone-950 animate-pulse'
                          : 'bg-stone-900 hover:bg-black text-[#f3d978]'
                          }`}
                        title={previewingSongId === track.id ? "Stop preview" : "Listen preview"}
                      >
                        {previewingSongId === track.id ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5 shrink-0" />
                            <span>Play</span>
                          </>
                        )}
                      </button>

                      {/* Reserved space for Revert icon on the right of Play - always reserves space */}
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        {track.hasCustomAudio ? (
                          <button
                            type="button"
                            onClick={() => handleRevertAudio(track.id)}
                            className="w-7 h-7 rounded-full bg-stone-300 hover:bg-stone-400 border border-stone-200 text-stone-600 hover:text-stone-800 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs"
                            title="Revert to default audio"
                          >
                            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3.5 mt-2 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left: Reset + Export/Import */}
              <div className="flex flex-wrap items-center gap-2 order-2 sm:order-1">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="text-xs font-editorial font-bold text-stone-500 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                  title="Reset all tracks to initial 12 hymns"
                >
                  <span>↺</span>
                  <span>Reset All</span>
                </button>

                <span className="text-stone-300 text-xs select-none">|</span>

                {/* Export button */}
                <button
                  type="button"
                  onClick={handleExportGame}
                  disabled={exportLoading}
                  className="text-xs font-editorial font-bold text-[#b8860b] hover:text-[#8B6914] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Export all tracks & audio as a shareable package file"
                >
                  {exportLoading ? (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-[#b8860b] border-t-transparent rounded-full" />
                  ) : (
                    <span>↓</span>
                  )}
                  <span>{exportLoading ? 'Exporting…' : 'Export Game'}</span>
                </button>

                {/* Import button */}
                <label
                  className="text-xs font-editorial font-bold text-stone-600 hover:text-stone-900 transition flex items-center gap-1 cursor-pointer"
                  title="Import a .guessgame package file from another device"
                >
                  {importLoading ? (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-stone-600 border-t-transparent rounded-full" />
                  ) : (
                    <span>↑</span>
                  )}
                  <span>{importLoading ? 'Importing…' : 'Import Game'}</span>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".guessgame,application/json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleImportGame(e.target.files[0]);
                    }}
                  />
                </label>

                {importError && (
                  <span className="text-rose-500 text-[10px] font-editorial font-bold ml-1">{importError}</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomModalOpen(false);
                    if (previewAudioRef.current) previewAudioRef.current.pause();
                    setPreviewingSongId(null);
                  }}
                  className="px-5 py-2 rounded-full border border-stone-400 text-stone-700 hover:bg-stone-100 text-xs font-editorial font-bold transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCustomization}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#c59b27] text-stone-950 text-xs font-editorial font-black uppercase tracking-wider shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition cursor-pointer border border-[#f3d978]/60"
                >
                  Save & Apply
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUCCESS TOAST NOTIFICATION */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-[#f3d978] border border-[#d4af37] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-screen font-editorial font-bold text-xs sm:text-sm">
          <span className="text-base text-[#d4af37]">✓</span>
          <span>Questions and tracks updated successfully!</span>
        </div>
      )}

      {/* HIDDEN AUDIO ELEMENT FOR IN-MODAL PREVIEWS */}
      <audio
        ref={previewAudioRef}
        onEnded={() => setPreviewingSongId(null)}
        className="hidden"
      ></audio>

    </div>
  );
}
