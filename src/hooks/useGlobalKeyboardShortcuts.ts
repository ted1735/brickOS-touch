import { useEffect, useState, useCallback } from 'react';

interface UseGlobalKeyboardShortcutsOptions {
  onNavigateToTab: (tab: string) => void;
  onTogglePlayPauseAudio: () => void;
  onToggleMuteAudio: () => void;
  onResetAudioEngine: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onOpenCreateProject: () => void;
  onOpenSunoBridge: () => void;
  onOpenSectionGuide: () => void;
  onToggleTheme: () => void;
  onToggleSideNav: () => void;
  onCloseModals?: () => void;
}

export function useGlobalKeyboardShortcuts({
  onNavigateToTab,
  onTogglePlayPauseAudio,
  onToggleMuteAudio,
  onResetAudioEngine,
  onPreviousTrack,
  onNextTrack,
  onOpenCreateProject,
  onOpenSunoBridge,
  onOpenSectionGuide,
  onToggleTheme,
  onToggleSideNav,
  onCloseModals
}: UseGlobalKeyboardShortcutsOptions) {
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  const openCheatSheet = useCallback(() => setIsCheatSheetOpen(true), []);
  const closeCheatSheet = useCallback(() => setIsCheatSheetOpen(false), []);
  const toggleCheatSheet = useCallback(() => setIsCheatSheetOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // ESCAPE: Closes cheat sheet or any open modal even when focused on an input
      if (e.key === 'Escape') {
        if (isCheatSheetOpen) {
          e.preventDefault();
          setIsCheatSheetOpen(false);
          return;
        }
        if (onCloseModals) {
          onCloseModals();
        }
        return;
      }

      // GLOBAL SHORTCUT OVERLAY: '?' or 'Shift + /' or 'Cmd/Ctrl + /'
      if (
        (e.key === '?' || (e.shiftKey && e.key === '/')) &&
        !isInput
      ) {
        e.preventDefault();
        toggleCheatSheet();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggleCheatSheet();
        return;
      }

      // If user is currently typing in an input field, do not trigger single-key or standard chords
      if (isInput) return;

      // F1: Contextual Section Guide
      if (e.key === 'F1') {
        e.preventDefault();
        onOpenSectionGuide();
        return;
      }

      // SPACE: Toggle Audio Play/Pause
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onTogglePlayPauseAudio();
        return;
      }

      // BRACKETS: Previous and Next Track
      if (e.key === '[') {
        e.preventDefault();
        onPreviousTrack();
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        onNextTrack();
        return;
      }

      // M: Master Mute
      if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onToggleMuteAudio();
          return;
        }
      }

      // R: Reset Synthesizers (without Ctrl/Cmd to avoid page reload)
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onResetAudioEngine();
        return;
      }

      // CMD/CTRL + B: Toggle Side Navigation
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onToggleSideNav();
        return;
      }

      // ALT + B: Toggle Side Navigation
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onToggleSideNav();
        return;
      }

      // SHIFT + T, ALT + T, or ALT + D: Cycle Studio Theme (Sun • Moon • Stars)
      if (
        (e.shiftKey && (e.key === 't' || e.key === 'T')) ||
        (e.altKey && (e.key === 't' || e.key === 'T' || e.key === 'd' || e.key === 'D'))
      ) {
        e.preventDefault();
        onToggleTheme();
        return;
      }

      // ALT + H: Section Guide
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        onOpenSectionGuide();
        return;
      }

      // ALT + Z: Suno Bridge
      if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        onOpenSunoBridge();
        return;
      }

      // NEW PROJECT: Alt + Shift + N or Cmd/Ctrl + Shift + N
      if ((e.altKey || e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onOpenCreateProject();
        return;
      }

      // NAVIGATION WORKSPACES:
      // ALT + Number OR pure numbers 1-0 (when not typing in an input)
      const isAlt = e.altKey;

      if ((isAlt && e.key === '1') || e.key === '1') {
        e.preventDefault();
        onNavigateToTab('kanban');
        return;
      }
      if ((isAlt && e.key === '2') || e.key === '2') {
        e.preventDefault();
        onNavigateToTab('lyrics');
        return;
      }
      if ((isAlt && e.key === '3') || e.key === '3') {
        e.preventDefault();
        onNavigateToTab('database');
        return;
      }
      if ((isAlt && e.key === '4') || e.key === '4') {
        e.preventDefault();
        onNavigateToTab('nextcloud_sync');
        return;
      }
      if ((isAlt && e.key === '5') || e.key === '5') {
        e.preventDefault();
        onNavigateToTab('mixer');
        return;
      }
      if ((isAlt && e.key === '6') || e.key === '6') {
        e.preventDefault();
        onNavigateToTab('mastering');
        return;
      }
      if ((isAlt && e.key === '7') || e.key === '7') {
        e.preventDefault();
        onNavigateToTab('ministry');
        return;
      }
      if ((isAlt && e.key === '8') || e.key === '8') {
        e.preventDefault();
        onNavigateToTab('veo_visuals');
        return;
      }
      if ((isAlt && e.key === '9') || e.key === '9') {
        e.preventDefault();
        onNavigateToTab('youtube');
        return;
      }
      if ((isAlt && e.key === '0') || e.key === '0') {
        e.preventDefault();
        onNavigateToTab('omnipost');
        return;
      }

      // Letter navigation shortcuts with Alt
      if (isAlt && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        onNavigateToTab('prompt_library');
        return;
      }
      if (isAlt && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onNavigateToTab('nightcafe');
        return;
      }
      if (isAlt && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        onNavigateToTab('video_express');
        return;
      }
      if (isAlt && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        onNavigateToTab('telemetry');
        return;
      }
      if (isAlt && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        onNavigateToTab('coproducer');
        return;
      }
      if (isAlt && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        onNavigateToTab('search');
        return;
      }

      // KANBAN COLLAPSIBLE CONTROLS:
      // ALT + E: Toggle Collapse Empty Columns
      if (isAlt && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('brickos:toggle-collapse-empty'));
        return;
      }

      // ALT + W: Toggle Collapse With Contents Columns
      if (isAlt && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('brickos:toggle-collapse-contents'));
        return;
      }

      // ALT + A: Toggle Collapse All Columns
      if (isAlt && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('brickos:toggle-collapse-all'));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isCheatSheetOpen,
    toggleCheatSheet,
    onNavigateToTab,
    onTogglePlayPauseAudio,
    onToggleMuteAudio,
    onResetAudioEngine,
    onPreviousTrack,
    onNextTrack,
    onOpenCreateProject,
    onOpenSunoBridge,
    onOpenSectionGuide,
    onToggleTheme,
    onToggleSideNav,
    onCloseModals
  ]);

  return {
    isCheatSheetOpen,
    setIsCheatSheetOpen,
    openCheatSheet,
    closeCheatSheet,
    toggleCheatSheet
  };
}
