// Frontend generator script
import fs from 'fs';
import path from 'path';

const projectDir = '/storage/emulated/0/termux/ai/bot';

const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>xmi - Telegram Content Hub</title>
  
  <!-- Telegram WebApp SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>

  <!-- Adsgram SDK for Telegram Mini Apps -->
  <script src="https://sad.adsgram.ai/js/sad.min.js"></script>

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0b1120 0%, #171d36 50%, #070a12 100%);
      --card-bg: rgba(26, 36, 56, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --accent-heart: #f43f5e;
      --accent-admin: #fbbf24;
      --accent-promoted: #f59e0b;
      --border-radius: 16px;
      --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      max-width: 100%;
    }

    html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
    }

    body {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-gradient);
      background-attachment: fixed;
      color: var(--text-main);
      display: flex;
      flex-direction: column;
    }

    /* Modern Animated iOS Switch Toggle */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 34px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 50%;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: linear-gradient(135deg, #0ea5e9, #38bdf8);
      border-color: #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
    }

    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(20px);
      background-color: #04101e;
    }

    /* Header */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background: rgba(11, 17, 32, 0.9);
      border-bottom: 1px solid var(--card-border);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      box-sizing: border-box;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-main);
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .brand-title {
      font-weight: 800;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.7rem;
      color: var(--primary);
      font-weight: 500;
    }

    .user-auth-area {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .points-badge {
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.4);
      color: #fbbf24;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: var(--transition);
    }

    .points-badge:hover {
      background: rgba(251, 191, 36, 0.25);
      transform: scale(1.03);
    }

    .admin-badge {
      background: rgba(251, 191, 36, 0.2);
      border: 1px solid rgba(251, 191, 36, 0.4);
      color: var(--accent-admin);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .btn {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      font-weight: 600;
      border-radius: 12px;
      transition: var(--transition);
      border: none;
      outline: none;
      text-decoration: none;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.82rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: #04101e;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px var(--primary-glow);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
      border: 1px solid var(--card-border);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--card-border);
    }

    .btn-ghost:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
    }

    /* Main Container */
    main {
      flex: 1;
      max-width: 960px;
      width: 100%;
      margin: 0 auto;
      padding: 14px 14px 60px 14px;
      box-sizing: border-box;
    }

    /* Mode Switcher for Admin */
    .admin-mode-bar {
      display: flex;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(251, 191, 36, 0.35);
      border-radius: 14px;
      padding: 4px;
      margin-bottom: 14px;
      gap: 4px;
      width: 100%;
      box-sizing: border-box;
    }

    .mode-tab {
      flex: 1;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.84rem;
      font-weight: 700;
      text-align: center;
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--text-muted);
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .mode-tab.active {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9));
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    /* Admin Hub Sub-Tabs */
    .admin-subtabs-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 14px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
      width: 100%;
      box-sizing: border-box;
    }

    .admin-subtabs-bar::-webkit-scrollbar { display: none; }

    .admin-subtab {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 7px 12px;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }

    .admin-subtab.active {
      background: var(--primary);
      color: #04101e;
      border-color: var(--primary);
    }

    /* User Nav Bar */
    .user-nav-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
      width: 100%;
      box-sizing: border-box;
    }

    .user-nav-bar::-webkit-scrollbar { display: none; }

    .nav-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .nav-pill.active {
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: #04101e;
      border-color: var(--primary);
      font-weight: 700;
    }

    /* Categories Bar */
    .categories-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 14px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
      width: 100%;
      box-sizing: border-box;
    }

    .categories-bar::-webkit-scrollbar { display: none; }

    .category-chip {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }

    .category-chip.active {
      background: rgba(56, 189, 248, 0.2);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* Controls Bar: Search & Modern Segmented Sort Control */
    .controls-bar {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 18px;
      width: 100%;
      box-sizing: border-box;
    }

    @media (min-width: 640px) {
      .controls-bar {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      width: 100%;
    }

    .search-input {
      width: 100%;
      padding: 10px 16px 10px 38px;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      font-size: 0.88rem;
      outline: none;
      transition: var(--transition);
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      color: var(--text-muted);
      pointer-events: none;
    }

    /* Modern Segmented Control for Sorting */
    .sort-segmented-control {
      display: inline-flex;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 3px;
      gap: 3px;
      max-width: 100%;
      overflow-x: auto;
      scrollbar-width: none;
      box-sizing: border-box;
    }

    .sort-segmented-control::-webkit-scrollbar { display: none; }

    .sort-segment {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 6px 11px;
      border-radius: 9px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      transition: var(--transition);
    }

    .sort-segment.active {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.25));
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(56, 189, 248, 0.15);
    }

    /* Sponsored In-App Banner */
    .sponsored-banner-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95));
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: var(--border-radius);
      padding: 14px 16px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15);
      text-decoration: none;
      color: inherit;
      transition: var(--transition);
      position: relative;
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .sponsored-banner-card:hover {
      transform: translateY(-2px);
      border-color: rgba(245, 158, 11, 0.8);
      box-shadow: 0 12px 30px rgba(245, 158, 11, 0.25);
    }

    .sponsor-tag {
      position: absolute;
      top: 6px;
      right: 8px;
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      font-size: 0.62rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sponsor-img {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
      background: #090d16;
    }

    .sponsor-content {
      flex: 1;
      min-width: 0;
    }

    .sponsor-title {
      font-weight: 700;
      font-size: 0.92rem;
      color: #ffffff;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sponsor-desc {
      font-size: 0.76rem;
      color: var(--text-muted);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Posts Grid */
    .posts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      width: 100%;
      box-sizing: border-box;
    }

    @media (min-width: 640px) {
      .posts-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Video Player Fullscreen Fallback for Mobile WebViews */
    #postVideoPlayerWrap.fullscreen-fallback {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-height: 100vh !important;
      z-index: 999999 !important;
      background: #000 !important;
      border-radius: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    #postVideoPlayerWrap.fullscreen-fallback video {
      max-height: 100vh !important;
      height: 100% !important;
      width: 100% !important;
      object-fit: contain !important;
      border-radius: 0 !important;
    }
    #postVideoPlayerWrap.fullscreen-fallback #btnVideoExitFullscreen {
      display: flex !important;
    }
    #postVideoPlayerWrap.fullscreen-fallback #btnVideoFullscreen {
      display: none !important;
    }

    /* Post Card */
    .post-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: var(--border-radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: var(--transition);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }

    .post-card.is-promoted {
      border: 1px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 8px 30px rgba(245, 158, 11, 0.2);
    }

    .post-image-container {
      width: 100%;
      height: 190px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #090d16;
    }

    .post-image-backdrop {
      position: absolute;
      inset: -15px;
      background-size: cover;
      background-position: center;
      filter: blur(20px) brightness(0.55);
      transform: scale(1.15);
      z-index: 1;
    }

    .post-image-fg {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.4s ease;
    }

    .post-card:hover .post-image-fg {
      transform: scale(1.03);
    }

    .post-image-placeholder {
      font-size: 36px;
      opacity: 0.35;
      z-index: 2;
    }

    .post-badges-top {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }

    .post-status-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
    }

    .status-promoted {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
    }

    .post-card.is-promoted {
      border: 1px solid rgba(245, 158, 11, 0.45);
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.12);
    }

    .category-badge-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.68rem;
      font-weight: 700;
    }

    .post-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .post-title {
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 6px;
      color: #ffffff;
      word-break: break-word;
    }

    .post-meta {
      font-size: 0.76rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .post-actions-row {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .social-counters {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 5px 6px;
      border-radius: 8px;
      transition: var(--transition);
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
    }

    .action-btn.liked { color: var(--accent-heart); }
    .action-btn.liked svg { fill: var(--accent-heart); stroke: var(--accent-heart); }
    .action-btn.saved { color: var(--primary); }
    .action-btn.saved svg { fill: var(--primary); stroke: var(--primary); }

    /* Single Open In Bot Button */
    .btn-open-bot-full {
      width: 100%;
      padding: 10px 14px;
      margin-top: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #04101e;
      box-shadow: 0 4px 14px var(--primary-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      border: none;
      transition: var(--transition);
    }

    .btn-open-bot-full:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px var(--primary-glow);
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: none;
      align-items: flex-end;
      justify-content: center;
      z-index: 100;
      padding: 0;
      box-sizing: border-box;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-content {
      background: #111a2d;
      border: 1px solid var(--card-border);
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      width: 100%;
      max-width: 580px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      overflow: hidden;
    }

    @media (min-width: 640px) {
      .modal-overlay {
        align-items: center;
        padding: 20px;
      }
      .modal-content {
        border-radius: 20px;
        transform: scale(0.95);
      }
      .modal-overlay.active .modal-content {
        transform: scale(1);
      }
    }

    .modal-overlay.active .modal-content {
      transform: translateY(0);
    }

    .modal-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1.05rem;
      font-weight: 700;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 22px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      background: rgba(255, 255, 255, 0.08);
      color: white;
    }

    .modal-body {
      padding: 16px 18px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-sizing: border-box;
    }

    .form-input, .comment-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--card-border);
      color: white;
      font-family: inherit;
      font-size: 0.88rem;
      outline: none;
      box-sizing: border-box;
    }

    .form-input:focus, .comment-input:focus {
      border-color: var(--primary);
    }

    /* Analytics UI */
    .stat-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    @media (min-width: 480px) {
      .stat-cards-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .stat-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 10px;
      text-align: center;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.68rem;
      color: var(--text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .leaderboard-section {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 12px;
      padding: 12px;
      border: 1px solid var(--card-border);
      margin-top: 10px;
    }

    .leaderboard-title {
      font-size: 0.84rem;
      font-weight: 700;
      margin-bottom: 8px;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.78rem;
    }

    .leaderboard-item:last-child {
      border-bottom: none;
    }

    #toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0ea5e9;
      color: #031424;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.88rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 9999;
      pointer-events: none;
      white-space: nowrap;
    }

    #toast.show {
      transform: translateX(-50%) translateY(0);
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <a href="/" class="brand">
      <div class="brand-icon">⚡</div>
      <div>
        <div class="brand-title">xmi</div>
        <div class="brand-subtitle">CONTENT HUB</div>
      </div>
    </a>

    <div class="user-auth-area">
      <div class="points-badge" id="btnHeaderPoints" style="display: none;" title="Your Points Balance">
        🪙 <span id="headerPointsVal">0</span> pts
      </div>
      <div class="admin-badge" id="badgeAdmin" style="display: none;">Admin</div>
      <button class="btn btn-sm btn-primary" id="btnAdminQuick" style="display: none;">
        ⚙️ Admin
      </button>
    </div>
  </header>

  <main>
    <!-- Admin View Switcher (Only visible to Admin) -->
    <div id="adminModeBar" class="admin-mode-bar" style="display: none;">
      <button class="mode-tab active" id="tabModePublic">📰 Feed Preview</button>
      <button class="mode-tab" id="tabModeAdmin">👑 Admin Control Hub</button>
    </div>

    <!-- ============================================== -->
    <!-- 1. PUBLIC FEED VIEW -->
    <!-- ============================================== -->
    <div id="viewPublicFeed">
      <!-- User Feed Navigation -->
      <div class="user-nav-bar">
        <div class="nav-pill active" data-view="feed">🔍 Browse Posts</div>
        <div class="nav-pill" data-view="saved">🔖 Saved Posts</div>
        <div class="nav-pill" id="navEarnPoints" style="display: none;" data-view="earn">🎁 Earn Points</div>
        <div class="nav-pill" id="navAdminPill" style="display: none; background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.4); color: #fbbf24; font-weight: 700;" data-view="admin">👑 Admin Hub</div>
      </div>

      <!-- Controls Bar (Search & Modern Segmented Sort) -->
      <div class="controls-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" class="search-input" placeholder="Search posts, tags, or topics..." autocomplete="off" />
        </div>

        <div class="sort-segmented-control" id="sortControl">
          <button class="sort-segment active" data-sort="all">✨ All</button>
          <button class="sort-segment" data-sort="latest">🕒 Latest</button>
          <button class="sort-segment" data-sort="views">🔥 Most Views</button>
          <button class="sort-segment" data-sort="likes">❤️ Most Liked</button>
          <button class="sort-segment" data-sort="downloads">📥 Most Downloads</button>
        </div>
      </div>

      <!-- In-App Sponsored Banner Card -->
      <a href="#" target="_blank" rel="noopener noreferrer" class="sponsored-banner-card" id="sponsoredBanner" style="display: none;">
        <span class="sponsor-tag">Sponsored</span>
        <img src="" alt="Sponsor" class="sponsor-img" id="sponsorImg" />
        <div class="sponsor-content">
          <div class="sponsor-title" id="sponsorTitle">Featured Partner</div>
          <div class="sponsor-desc" id="sponsorDesc">Discover exclusive deals and resources.</div>
        </div>
        <div style="font-size: 18px; color: #fbbf24; flex-shrink: 0;">➔</div>
      </a>

      <!-- Posts Grid -->
      <div class="posts-grid" id="postsGrid">
        <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 0;">
          <div style="font-size: 32px; margin-bottom: 8px;">⏳</div>
          <div>Loading content...</div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 1B. DEDICATED POST DETAIL PAGE VIEW (IN PAGE, NOT POPUP) -->
    <!-- ============================================== -->
    <div id="viewPostDetail" style="display: none; padding-bottom: 40px;" oncontextmenu="return false;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px;">
        <button type="button" class="btn btn-secondary" id="btnBackToFeed" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.85rem; font-weight: 700; border-radius: 10px; cursor: pointer; background: rgba(255,255,255,0.08); border: 1px solid var(--card-border);">
          <span>←</span> <span>Back to Posts</span>
        </button>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-sm" id="btnPostDetailSave" style="padding: 7px 12px; border-radius: 8px; font-weight: 600;">🔖 Save</button>
        </div>
      </div>

      <div id="postDetailPageBody">
        <!-- Rendered dynamically -->
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 2. ADMIN CONTROL HUB VIEW -->
    <!-- ============================================== -->
    <div id="viewAdminHub" style="display: none;">
      <!-- Admin Hub Navigation Sub-Tabs -->
      <div class="admin-subtabs-bar" id="adminSubtabs">
        <button class="admin-subtab active" data-atab="posts">📑 Manage Posts</button>
        <button class="admin-subtab" data-atab="users">👥 Users Directory</button>
        <button class="admin-subtab" data-atab="comments">💬 Comments</button>
        <button class="admin-subtab" data-atab="shorteners">🔗 Multiple Shorteners</button>
        <button class="admin-subtab" data-atab="settings">⚙️ Points & Rules</button>
        <button class="admin-subtab" data-atab="channels">🛡️ Force Channels</button>
        <button class="admin-subtab" data-atab="banner">🖼️ In-App Banner</button>
        <button class="admin-subtab" data-atab="broadcast">📢 Push Broadcast</button>
        <button class="admin-subtab" data-atab="analytics">📊 Analytics</button>
      </div>

      <!-- Admin Tab 1: Manage Posts -->
      <div id="adminTabPosts">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 8px;">
          <h3 style="font-size: 1rem; font-weight: 700;">📑 Post Management</h3>
          <button type="button" class="btn btn-sm btn-primary" id="btnOpenCreatePost">➕ Create Post</button>
        </div>
        <div class="posts-grid" id="adminPostsGrid"></div>
      </div>

      <!-- Admin Tab: Registered Users Directory -->
      <div id="adminTabUsers" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <h3 style="font-size: 0.95rem; font-weight: 700;">👥 Registered Users Directory</h3>
            <button type="button" class="btn btn-sm btn-secondary" id="btnRefreshAdminUsers">🔄 Refresh Users</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; text-align: center;">
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
              <div style="font-size: 1.15rem; font-weight: 800; color: #38bdf8;" id="cntUsersTotal">0</div>
              <div style="font-size: 0.65rem; color: var(--text-muted);">Total</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
              <div style="font-size: 1.15rem; font-weight: 800; color: #4ade80;" id="cntUsersActive">0</div>
              <div style="font-size: 0.65rem; color: var(--text-muted);">🟢 Active</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
              <div style="font-size: 1.15rem; font-weight: 800; color: #22d3ee;" id="cntUsersOnline">0</div>
              <div style="font-size: 0.65rem; color: var(--text-muted);">🌐 Online</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
              <div style="font-size: 1.15rem; font-weight: 800; color: #f87171;" id="cntUsersBlocked">0</div>
              <div style="font-size: 0.65rem; color: var(--text-muted);">🚫 Blocked</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <input type="text" id="adminUsersSearchInput" class="form-input" placeholder="🔍 Search name, username, or ID..." style="font-size: 0.8rem;" />
            <select id="adminUsersFilterSelect" class="form-input" style="width: 130px; font-size: 0.78rem; background: #1e293b;">
              <option value="all">All Users</option>
              <option value="online">🟢 Online Now</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>
          <div id="adminUsersList" style="display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto;">
            <div style="text-align: center; color: var(--text-muted); padding: 16px;">Loading users directory...</div>
          </div>
        </div>
      </div>

      <!-- Admin Tab: Comments Moderation -->
      <div id="adminTabComments" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div>
              <h3 style="font-size: 0.95rem; font-weight: 700;">💬 Comments Moderation</h3>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Manage, hide, or delete user comments across all posts</p>
            </div>
            <button type="button" class="btn btn-sm btn-secondary" id="btnRefreshAdminComments">🔄 Refresh Comments</button>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <input type="text" id="adminCommentsSearchInput" class="form-input" placeholder="Search comments by user or text..." style="flex: 2; padding: 7px 10px; font-size: 0.8rem;" />
            <select id="adminCommentsFilterSelect" class="form-select" style="flex: 1; padding: 7px 10px; font-size: 0.8rem;">
              <option value="all">All Comments</option>
              <option value="active">Active Only</option>
              <option value="hidden">Hidden Only</option>
            </select>
          </div>
          <div id="adminCommentsList" style="display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto;">
            <div style="text-align: center; color: var(--text-muted); padding: 16px;">Loading comments...</div>
          </div>
        </div>
      </div>

      <!-- Admin Tab 2: Multiple Manual Shorteners -->
      <div id="adminTabShorteners" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 16px; margin-bottom: 16px;">
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 6px;">➕ Create / Add Manual Shortener</h3>
          <p style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
            1. Copy the auto-generated Destination / Verify Link below.<br/>
            2. Shorten it on your preferred shortener site (e.g. GPLinks, Droplink).<br/>
            3. Paste the resulting shortened link below and save!
          </p>

          <form id="formAddShortener" style="display: flex; flex-direction: column; gap: 10px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Shortener Title / Name</label>
              <input type="text" id="addShTitle" class="form-input" placeholder="e.g. GPLinks Main, Droplink VIP" required />
            </div>

            <!-- Destination Verify Link Generator -->
            <div style="background: rgba(30, 41, 59, 0.5); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <label style="font-size: 0.74rem; font-weight: 700; color: var(--primary);">🎯 Bot Destination / Verify Link (To Shorten)</label>
                <button type="button" class="btn btn-sm btn-ghost" id="btnRefreshDestLink" style="font-size: 0.72rem; padding: 2px 6px;">🔄 New Link</button>
              </div>
              <div style="display: flex; gap: 6px;">
                <input type="text" id="addShDestLink" class="form-input" style="font-size: 0.78rem; font-family: monospace;" readonly />
                <button type="button" class="btn btn-secondary btn-sm" id="btnCopyDestLink" style="flex-shrink: 0;">📋 Copy</button>
              </div>
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Final Shortened URL (Paste link from your shortener website)</label>
              <input type="url" id="addShUrl" class="form-input" placeholder="https://gplinks.co/xyz123 or https://droplink.co/..." required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">🪙 Reward Points</label>
                <input type="number" id="addShPoints" class="form-input" min="1" value="5" />
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 18px;">
                <span style="font-size: 0.8rem; font-weight: 600;">Active</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="addShEnabled" checked />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 6px; padding: 12px;">➕ Save Shortener</button>
          </form>
        </div>

        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Active Shorteners Pool</h4>
        <div id="shortenersList" style="display: flex; flex-direction: column; gap: 8px;"></div>
      </div>

      <!-- Admin Tab 3: Points & Settings -->
      <div id="adminTabSettings" style="display: none;">
        <form id="formAdminSettings" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Shorteners & Points Rule -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.92rem;">🔗 Shortener Locker & Verify Links</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">Require users to verify short link to earn points and unlock posts.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setShortenerToggle" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">🪙 Points Earned Per Verify</label>
                <input type="number" id="setPointsPerVerify" class="form-input" min="1" value="5" />
              </div>
              <div>
                <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">🪙 Points Cost Per Post</label>
                <input type="number" id="setPointsPerPost" class="form-input" min="0" value="1" />
              </div>
            </div>
          </div>

          <!-- Auto-Delete Configuration -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
            <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 2px;">⏳ Auto-Delete Files & Links Timer</div>
            <div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 8px;">Automatically deletes sent files and links from Telegram chat after specified minutes (0 to disable).</div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">⏱️ Auto-Delete After (Minutes)</label>
              <input type="number" id="setAutoDeleteMinutes" class="form-input" min="0" value="30" />
            </div>
          </div>

          <!-- Referral System -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.92rem;">🎁 Referral & Invite Rewards</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">Award points to users who invite friends via deep link.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setReferralToggle" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">🪙 Points Awarded Per Referral</label>
              <input type="number" id="setReferralPointsVal" class="form-input" min="1" value="10" />
            </div>
          </div>

          <!-- Force Join Toggle -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; font-size: 0.92rem;">🛡️ Force Join Channels Verification</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">Ensure users join required channels before unlocking content.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setForceJoinToggle" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Require Bot Start Gate -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.92rem;">🛑 Require Users to Start Bot in Telegram</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">Show center lock screen for users who have not started @__BOT_USERNAME__.</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setRequireBotStartToggle" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div>
                <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">Prompt Message to Display</label>
                <textarea id="setRequireBotStartMsg" class="form-input" rows="2" placeholder="Please start our official bot to unlock full access and view content."></textarea>
              </div>
              <div>
                <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">Custom Button Link (Optional - defaults to official bot start)</label>
                <input type="url" id="setRequireBotStartLink" class="form-input" placeholder="https://t.me/__BOT_USERNAME__?start=start" />
              </div>
            </div>
          </div>

          <!-- Video Streaming & Render Tier Settings -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.92rem; color: #38bdf8;">🎥 In-App Video Streaming</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">Stream videos inside Mini App (&lt;20MB Worker, 20-100MB Render, &gt;100MB Chat).</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setStreamToggle" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div>
                <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">🚀 Render Streaming Service URL (for 20MB–100MB)</label>
                <input type="url" id="setRenderStreamUrl" class="form-input" placeholder="https://xmi-stream-bot.onrender.com" />
              </div>
            </div>
          </div>

          <!-- Adsgram Monetization Settings -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 14px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.92rem; color: #fbbf24;">💰 Adsgram Ad Monetization</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">Monetize app with partner.adsgram.ai (Rewarded video &amp; Pre-roll).</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setAdsgramToggle" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div>
                <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">🎬 Rewarded Video Block ID</label>
                <input type="text" id="setAdsgramRewardedId" class="form-input" placeholder="e.g. 1234" />
              </div>
              <div>
                <label style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted);">📱 Interstitial Ad Block ID</label>
                <input type="text" id="setAdsgramInterstitialId" class="form-input" placeholder="e.g. 5678" />
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <span style="font-size: 0.74rem; color: var(--text-muted);">Watch Ad Before Video Stream (Pre-Roll)</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="setAdsgramPrerollToggle" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Metrics Management (Reset Likes, Views & Downloads) -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 14px; padding: 14px;">
            <div style="font-weight: 700; font-size: 0.92rem; color: #f87171; margin-bottom: 4px;">🧹 Reset Metrics &amp; Logs</div>
            <div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 10px;">
              Permanently clear all likes, views, and downloads across all posts. Admin views and downloads are never counted.
            </div>
            <button type="button" id="btnResetAllMetrics" class="btn" style="width: 100%; border: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 10px; font-weight: 700; border-radius: 10px; cursor: pointer;">
              🗑️ Clear All Likes, Views &amp; Downloads
            </button>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">💾 Save Hub Settings</button>
        </form>
      </div>

      <!-- Admin Tab 4: Force Join Channels -->
      <div id="adminTabChannels" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
          <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">➕ Add Required Channel / Group</h3>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">
            Make sure @__BOT_USERNAME__ is an administrator in the channel.
          </p>
          <form id="formAddChannel" style="display: flex; flex-direction: column; gap: 8px;">
            <input type="text" id="addChId" class="form-input" placeholder="Channel ID (e.g. -1001234567890 or @channel)" required />
            <input type="text" id="addChTitle" class="form-input" placeholder="Channel Name / Title" required />
            <input type="url" id="addChLink" class="form-input" placeholder="Invite Link (https://t.me/...)" required />
            <button type="submit" class="btn btn-primary btn-sm">➕ Add Channel</button>
          </form>
        </div>
        <div id="forceChannelsList" style="display: flex; flex-direction: column; gap: 8px;"></div>
      </div>

      <!-- Admin Tab 5: In-App Sponsored Banner -->
      <div id="adminTabBanner" style="display: none;">
        <form id="formAdminBanner" style="display: flex; flex-direction: column; gap: 12px; background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; font-size: 0.92rem;">🖼️ Display In-App Banner</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Shows sponsored promotion card on Mini App feed.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="setBannerToggle" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <input type="text" id="setBannerTitle" class="form-input" placeholder="Banner Title (e.g. 🔥 Best Deals)" />
          <input type="text" id="setBannerText" class="form-input" placeholder="Short description or tagline" />
          <input type="url" id="setBannerImg" class="form-input" placeholder="Image URL (square or thumbnail)" />
          <input type="url" id="setBannerLink" class="form-input" placeholder="Destination Link (https://...)" />
          <button type="submit" class="btn btn-primary" style="width: 100%;">💾 Save Banner</button>
        </form>
      </div>

      <!-- Admin Tab 6: Push Broadcast -->
      <div id="adminTabBroadcast" style="display: none;">
        <form id="formAdminBroadcast" style="display: flex; flex-direction: column; gap: 12px; background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px;">
          <h3 style="font-size: 0.95rem; font-weight: 700;">📢 Broadcast to All Telegram Users</h3>
          <textarea id="bcMessage" class="form-input" rows="4" placeholder="Enter broadcast message in Markdown format..." required></textarea>
          <input type="url" id="bcPhoto" class="form-input" placeholder="Optional Photo URL" />
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" id="bcBtnText" class="form-input" placeholder="Button Text (Optional)" />
            <input type="url" id="bcBtnUrl" class="form-input" placeholder="Button Link URL (Optional)" />
          </div>
          <button type="submit" class="btn btn-primary" id="btnSendBroadcast">🚀 Send Broadcast Now</button>
        </form>
      </div>

      <!-- Admin Tab 7: Analytics & Leaderboards -->
      <div id="adminTabAnalytics" style="display: none;">
        <div class="stat-cards-grid">
          <div class="stat-card">
            <div class="stat-value" id="gaUsers">0</div>
            <div class="stat-label">👥 Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="gaViews">0</div>
            <div class="stat-label">👁️ Views</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #4ade80;" id="gaVerifies">0</div>
            <div class="stat-label">🔗 Verifications</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #fbbf24;" id="gaRefers">0</div>
            <div class="stat-label">🎁 Referrals</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #38bdf8;" id="gaPosts">0</div>
            <div class="stat-label">📄 Posts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #c084fc;" id="gaForceJoins">0</div>
            <div class="stat-label">🛡️ Force Joins</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #f43f5e;" id="gaLikes">0</div>
            <div class="stat-label">❤️ Likes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #a78bfa;" id="gaDownloads">0</div>
            <div class="stat-label">📥 Downloads</div>
          </div>
        </div>

        <div id="adminHighestDownloadCard" style="display: none; background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(74, 222, 128, 0.1)); border: 1px solid rgba(251, 191, 36, 0.35); border-radius: 14px; padding: 14px 16px; margin: 12px 0;"></div>

        <div class="leaderboard-section">
          <div class="leaderboard-title">📥 Top 5 Most Downloaded Posts (Highest Downloads)</div>
          <div id="adminTopDownloads"></div>
        </div>

        <div class="leaderboard-section">
          <div class="leaderboard-title">🔥 Top 5 Most Popular Posts (Views)</div>
          <div id="adminTopViews"></div>
        </div>

        <div class="leaderboard-section">
          <div class="leaderboard-title">❤️ Top 5 Most Liked Posts</div>
          <div id="adminTopLikes"></div>
        </div>

        <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" id="btnRefreshAdminStats">
          🔄 Refresh Analytics
        </button>
      </div>
    </div>
  </main>

  <!-- ============================================== -->
  <!-- MODALS -->
  <!-- ============================================== -->

  <!-- 1. Points & Verify Modal (User Unlock & Task Generator) -->
  <div class="modal-overlay" id="pointsModal">
    <div class="modal-content" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="modal-title">🪙 Points & Content Access</h3>
        <button class="modal-close" id="btnPointsClose">&times;</button>
      </div>
      <div class="modal-body" style="text-align: center;">
        <div style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 16px; padding: 18px; margin-bottom: 12px;">
          <div style="font-size: 0.8rem; color: #fbbf24; font-weight: 700; text-transform: uppercase;">Your Current Balance</div>
          <div style="font-size: 2.2rem; font-weight: 800; color: #ffffff; margin: 4px 0;">🪙 <span id="modalPointsVal">0</span> pts</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);" id="modalPointsStatusMsg">Complete shortener tasks or invite friends to earn points!</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <a href="#" target="_blank" class="btn btn-primary" id="btnCompleteShortener" style="padding: 12px; display: none;">
            🔗 Complete Shortener Task (+<span id="taskRewardPts">5</span> Pts)
          </a>

          <button class="btn btn-secondary" id="btnRegenerateVerify">
            🔄 Generate / Next Task Link
          </button>

          <button class="btn btn-ghost" id="btnCopyInviteLink">
            🎁 Copy Invite Link (+<span id="inviteRewardPts">10</span> Pts)
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 2A. Create Post Modal (Admin Only) -->
  <div class="modal-overlay" id="createPostModal">
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title">➕ Create New Post</h3>
        <button class="modal-close" id="btnCreatePostClose">&times;</button>
      </div>
      <div class="modal-body">
        <form id="createPostForm" style="display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Post Title (Default: Post #N)</label>
            <input type="text" id="createPostTitle" class="form-input" placeholder="e.g. Post #76 (226.8 MB)" required />
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Size (e.g. 226.8 MB)</label>
            <input type="text" id="createPostSize" class="form-input" placeholder="e.g. 226.8 MB" />
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Preview Image URL (Optional)</label>
            <input type="url" id="createPostImage" class="form-input" placeholder="https://catbox.moe/... or image url" />
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Direct / Mega Folder Link URL (Optional)</label>
            <input type="url" id="createPostLink" class="form-input" placeholder="https://mega.nz/... or file url" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Button Text</label>
              <input type="text" id="createPostLinkLabel" class="form-input" value="🔗 Open File / Folder" />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Tags</label>
              <input type="text" id="createPostTags" class="form-input" placeholder="#file" />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Status</label>
              <select id="createPostStatus" class="form-input" style="background: #1e293b;">
                <option value="published">🟢 Published</option>
                <option value="draft">🟡 Draft</option>
                <option value="scheduled">🟣 Scheduled</option>
              </select>
            </div>
            <div id="createScheduledGroup" style="display: none;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Publish Date (IST)</label>
              <input type="datetime-local" id="createPostScheduledAt" class="form-input" />
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0;">
            <span style="font-size: 0.85rem; font-weight: 600;">⭐ Exclusive / Promoted (Show at Top)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="createPostPromoted" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" class="btn btn-primary" id="btnSubmitCreatePost" style="flex: 1;">🚀 Publish Post</button>
            <button type="button" class="btn btn-ghost" id="btnCancelCreatePost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 2B. Edit Post Modal (Admin Only) -->
  <div class="modal-overlay" id="editPostModal">
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title">✏️ Edit Post</h3>
        <button class="modal-close" id="btnEditPostClose">&times;</button>
      </div>
      <div class="modal-body">
        <form id="editPostForm" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="hidden" id="editPostId" />
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Title</label>
            <input type="text" id="editPostTitle" class="form-input" required />
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Tags</label>
            <input type="text" id="editPostTags" class="form-input" />
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Preview Image URL</label>
            <input type="url" id="editPostImage" class="form-input" />
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Direct Link URL</label>
            <input type="url" id="editPostLink" class="form-input" />
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Direct Link Button Text</label>
            <input type="text" id="editPostLinkLabel" class="form-input" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Status</label>
              <select id="editPostStatus" class="form-input" style="background: #1e293b;">
                <option value="published">🟢 Published</option>
                <option value="draft">🟡 Draft</option>
                <option value="scheduled">🟣 Scheduled</option>
              </select>
            </div>
            <div id="editScheduledGroup" style="display: none;">
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Publish Date (IST)</label>
              <input type="datetime-local" id="editPostScheduledAt" class="form-input" />
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0;">
            <span style="font-size: 0.85rem; font-weight: 600;">⭐ Exclusive / Promoted (Show at Top)</span>
            <label class="toggle-switch">
              <input type="checkbox" id="editPostPromoted" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">💾 Save</button>
            <button type="button" class="btn btn-ghost" style="color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);" id="btnLinksFromEdit">🔗 Links</button>
            <button type="button" class="btn btn-ghost" style="color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3);" id="btnBroadcastFromEdit">📢 Broadcast</button>
            <button type="button" class="btn btn-ghost" style="color: #f87171;" id="btnDeleteFromEdit">🗑️</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 2D. Post Links Modal (Direct Bot and Mini App Links with 1-Tap Copy) -->
  <div class="modal-overlay" id="postLinksModal">
    <div class="modal-content" style="max-width: 480px;">
      <div class="modal-header">
        <h3 class="modal-title" id="postLinksModalTitle">🔗 Post Direct Links</h3>
        <button class="modal-close" id="btnPostLinksClose">&times;</button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="font-size: 0.8rem; color: var(--text-muted);" id="postLinksDesc">
          Share these links in channels, groups, or messages. Tapping either link opens this exact post directly.
        </div>

        <!-- Bot Link Section -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 12px; padding: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #38bdf8;">🤖 Telegram Bot Link</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Opens in bot chat</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <input type="text" id="postLinkBotInput" class="form-input" readonly style="font-size: 0.78rem; font-family: monospace; background: rgba(0,0,0,0.3);" />
            <button type="button" class="btn btn-sm btn-primary" id="btnCopyBotLink" style="white-space: nowrap;">📋 Copy</button>
          </div>
        </div>

        <!-- Mini App Link Section -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 12px; padding: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #a78bfa;">📱 Mini App Direct Link</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Opens inside Mini App</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <input type="text" id="postLinkAppInput" class="form-input" readonly style="font-size: 0.78rem; font-family: monospace; background: rgba(0,0,0,0.3);" />
            <button type="button" class="btn btn-sm btn-primary" id="btnCopyAppLink" style="white-space: nowrap;">📋 Copy</button>
          </div>
        </div>

        <!-- Web Direct Link Section -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 12px; padding: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #10b981;">🌐 Web Browser Link</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Opens in browser</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <input type="text" id="postLinkWebInput" class="form-input" readonly style="font-size: 0.78rem; font-family: monospace; background: rgba(0,0,0,0.3);" />
            <button type="button" class="btn btn-sm btn-primary" id="btnCopyWebLink" style="white-space: nowrap;">📋 Copy</button>
          </div>
        </div>

        <!-- Action Row -->
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button type="button" class="btn btn-secondary" style="flex: 1;" id="btnShareTelegramFromModal">📤 Share Link</button>
          <button type="button" class="btn btn-ghost" style="color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3);" id="btnBroadcastFromLinksModal">📢 Broadcast Post</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 2C. User Action Modal (Contact Options for users with/without username) -->
  <div class="modal-overlay" id="userActionModal">
    <div class="modal-content" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="modal-title" id="userActionModalTitle">👤 User Contact Options</h3>
        <button class="modal-close" id="btnUserActionClose">&times;</button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
        <div style="font-size: 0.85rem; color: var(--text-muted);" id="userActionModalNotice">
          This user does not have a public Telegram @username.
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 10px; font-size: 0.82rem; display: flex; align-items: center; justify-content: space-between;">
          <span>User ID: <strong id="userActionUidDisplay" style="color: #fbbf24; font-family: monospace;"></strong></span>
          <button type="button" class="btn btn-sm btn-ghost" id="btnUserActionCopyId">📋 Copy</button>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" id="btnUserActionOpenDirect" style="flex: 1; font-size: 0.8rem;">
            💬 Open Telegram Chat
          </button>
          <button type="button" class="btn btn-secondary" id="btnUserActionOpenProfile" style="flex: 1; font-size: 0.8rem;">
            👤 User Profile
          </button>
        </div>
        <div style="border-top: 1px solid var(--card-border); padding-top: 12px;">
          <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">✉️ Send Direct Message via Bot</label>
          <textarea id="userActionDmText" class="form-input" rows="2" placeholder="Type a message to send directly to this user..."></textarea>
          <button type="button" class="btn btn-primary" id="btnUserActionSendDm" style="width: 100%; margin-top: 8px;">📤 Send Message</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Comments Modal -->
  <div class="modal-overlay" id="commentsModal">
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title" id="commentsPostTitle">Comments</h3>
        <button class="modal-close" id="btnCommentsClose">&times;</button>
      </div>
      <div class="modal-body" id="commentsList" style="max-height: 50vh;"></div>
      <div style="padding: 12px 18px; border-top: 1px solid var(--card-border); background: #111a2d;">
        <form id="formAddComment" style="display: flex; gap: 8px;">
          <input type="text" id="commentInput" class="form-input" placeholder="Write a comment..." required />
          <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>
      </div>
    </div>
  </div>

  <!-- 4. Require Bot Start Modal (Middle Alert / Lock Screen) -->
  <div class="modal-overlay" id="requireBotStartModal" style="z-index: 99999; backdrop-filter: blur(8px); background: rgba(5, 8, 18, 0.88);">
    <div class="modal-content" style="max-width: 420px; text-align: center; border: 1px solid rgba(56, 189, 248, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
      <div style="font-size: 3.2rem; margin-bottom: 8px;">🤖</div>
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 10px; color: #38bdf8;" id="reqStartModalTitle">Telegram Bot Required</h3>
      <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 20px;" id="reqStartModalMsg">
        Please start our official Telegram bot first to unlock access and view content.
      </p>
      <a href="#" target="_blank" class="btn btn-primary" id="btnReqStartAction" style="width: 100%; padding: 14px; font-size: 0.95rem; font-weight: 700; text-decoration: none; justify-content: center; box-shadow: 0 4px 20px var(--primary-glow);">
        🚀 Open Bot & Start
      </a>
    </div>
  </div>

  <!-- 5. Post Stats Modal (Admin Only) -->
  <div class="modal-overlay" id="postStatsModal">
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title" id="postStatsTitle">📊 Post Stats</h3>
        <button class="modal-close" id="btnPostStatsClose">&times;</button>
      </div>
      <div class="modal-body" style="padding: 16px;">
        <!-- Metrics Counters -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 14px; text-align: center;">
          <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
            <div style="font-size: 1.15rem; font-weight: 800; color: #38bdf8;" id="postStatViewsCnt">0</div>
            <div style="font-size: 0.68rem; color: var(--text-muted);">👁️ Views</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
            <div style="font-size: 1.15rem; font-weight: 800; color: #4ade80;" id="postStatAccessCnt">0</div>
            <div style="font-size: 0.68rem; color: var(--text-muted);">📥 Downloads</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
            <div style="font-size: 1.15rem; font-weight: 800; color: #fbbf24;" id="postStatConversionCnt">0%</div>
            <div style="font-size: 0.68rem; color: var(--text-muted);">📊 D/L Rate</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
            <div style="font-size: 1.15rem; font-weight: 800; color: #f43f5e;" id="postStatLikesCnt">0</div>
            <div style="font-size: 0.68rem; color: var(--text-muted);">❤️ Likes</div>
          </div>
        </div>

        <!-- Subtabs inside modal -->
        <div style="display: flex; gap: 6px; border-bottom: 1px solid var(--card-border); padding-bottom: 8px; margin-bottom: 12px;" id="postStatSubtabs">
          <button type="button" class="btn btn-sm btn-primary post-stat-tab active" data-pstab="downloads" style="padding: 5px 12px; font-size: 0.76rem;">📥 Downloads</button>
          <button type="button" class="btn btn-sm btn-ghost post-stat-tab" data-pstab="views" style="padding: 5px 12px; font-size: 0.76rem;">👁️ Views</button>
          <button type="button" class="btn btn-sm btn-ghost post-stat-tab" data-pstab="likes" style="padding: 5px 12px; font-size: 0.76rem;">❤️ Likes</button>
        </div>

        <!-- Log List -->
        <div id="postStatLogsList" style="display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto;">
          <div style="text-align: center; color: var(--text-muted); padding: 16px;">Loading stats...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 6. User Activity Inspector Modal (Admin Only) -->
  <div class="modal-overlay" id="userActivityModal">
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title" id="userActivityTitle">🔍 User Activity</h3>
        <button class="modal-close" id="btnUserActivityClose">&times;</button>
      </div>
      <div class="modal-body" style="padding: 16px;">
        <!-- User Info Header Card -->
        <div id="userActivityHeaderCard" style="background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 12px; padding: 12px; margin-bottom: 14px;">
        </div>

        <!-- Subtabs inside modal -->
        <div style="display: flex; gap: 6px; border-bottom: 1px solid var(--card-border); padding-bottom: 8px; margin-bottom: 12px; overflow-x: auto;" id="userActivitySubtabs">
          <button type="button" class="btn btn-sm btn-primary user-act-tab active" data-uact="timeline" style="padding: 5px 12px; font-size: 0.76rem; white-space: nowrap;">📜 All Actions</button>
          <button type="button" class="btn btn-sm btn-ghost user-act-tab" data-uact="downloads" style="padding: 5px 12px; font-size: 0.76rem; white-space: nowrap;">📥 Files Got</button>
          <button type="button" class="btn btn-sm btn-ghost user-act-tab" data-uact="views" style="padding: 5px 12px; font-size: 0.76rem; white-space: nowrap;">👁️ Posts Watched</button>
          <button type="button" class="btn btn-sm btn-ghost user-act-tab" data-uact="messages" style="padding: 5px 12px; font-size: 0.76rem; white-space: nowrap;">💬 Bot Messages</button>
        </div>

        <!-- Content Container -->
        <div id="userActivityContentList" style="display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto;">
          <div style="text-align: center; color: var(--text-muted); padding: 16px;">Loading user activity...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 7. Fullscreen Image Lightbox with Zoom Modal -->
  <div class="modal-overlay" id="imageLightboxModal" style="background: rgba(0, 0, 0, 0.95); z-index: 100000; padding: 0; backdrop-filter: blur(12px);">
    <div style="position: fixed; top: 12px; left: 14px; right: 14px; display: flex; align-items: center; justify-content: space-between; z-index: 100002; pointer-events: auto;">
      <div id="lightboxTitle" style="color: #ffffff; font-weight: 700; font-size: 0.92rem; text-shadow: 0 2px 6px rgba(0,0,0,0.9); max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🖼️ Preview Image</div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <button type="button" id="btnLightboxZoomOut" style="background: rgba(255,255,255,0.16); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; user-select: none;">−</button>
        <span id="lightboxZoomLevel" style="color: #fff; font-size: 0.74rem; font-weight: 700; min-width: 36px; text-align: center; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">100%</span>
        <button type="button" id="btnLightboxZoomIn" style="background: rgba(255,255,255,0.16); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; user-select: none;">+</button>
        <button type="button" id="btnLightboxReset" style="background: rgba(255,255,255,0.16); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; cursor: pointer; user-select: none;" title="Reset Zoom">↺</button>
        <button type="button" id="btnLightboxClose" style="background: rgba(239,68,68,0.4); color: #fff; border: 1px solid rgba(239,68,68,0.7); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; margin-left: 4px;" title="Close">✕</button>
      </div>
    </div>
    <!-- Previous & Next Arrow Buttons on Lightbox -->
    <button type="button" id="btnLightboxPrev" class="lightbox-nav-btn" style="position: fixed; left: 12px; top: 50%; transform: translateY(-50%); z-index: 100003; background: rgba(0,0,0,0.65); color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 44px; height: 44px; font-size: 1.6rem; display: none; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(6px); user-select: none;">‹</button>
    <button type="button" id="btnLightboxNext" class="lightbox-nav-btn" style="position: fixed; right: 12px; top: 50%; transform: translateY(-50%); z-index: 100003; background: rgba(0,0,0,0.65); color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 44px; height: 44px; font-size: 1.6rem; display: none; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(6px); user-select: none;">›</button>
    <div id="lightboxBackdrop" style="width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 60px 14px 20px 14px; cursor: pointer; -webkit-overflow-scrolling: touch;">
      <img id="lightboxImg" src="" alt="Preview" style="max-width: 95vw; max-height: 85vh; object-fit: contain; border-radius: 8px; transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1); cursor: zoom-in; box-shadow: 0 12px 48px rgba(0,0,0,0.9); user-select: none;" />
    </div>
  </div>

  <div id="toast"></div>

  <!-- Client-Side JavaScript Logic -->
  <script>
    // Global safety error handlers to protect Mini App lifecycle
    window.addEventListener('error', function(e) {
      console.warn('Mini App caught error:', e?.message || e);
    });
    window.addEventListener('unhandledrejection', function(e) {
      console.warn('Mini App caught unhandled rejection:', e?.reason || e);
    });

    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        // Enable vertical swipes so users and admins can freely scroll pages
        if (typeof tg.enableVerticalSwipes === 'function') {
          tg.enableVerticalSwipes();
        }
        // Enable closing confirmation to prevent accidental background dismissal
        if (typeof tg.enableClosingConfirmation === 'function') {
          tg.enableClosingConfirmation();
        }
      } catch (err) {
        console.warn('Telegram WebApp setup error:', err);
      }

      // Handle Telegram viewport changes and keep app expanded
      try {
        if (typeof tg.onEvent === 'function') {
          tg.onEvent('viewportChanged', function() {
            try {
              if (tg && !tg.isExpanded && typeof tg.expand === 'function') {
                tg.expand();
              }
            } catch (_) {}
          });
          tg.onEvent('activated', function() {
            try {
              if (tg && typeof tg.expand === 'function') tg.expand();
              if (typeof tg.enableClosingConfirmation === 'function') tg.enableClosingConfirmation();
              if (typeof tg.enableVerticalSwipes === 'function') tg.enableVerticalSwipes();
            } catch (_) {}
          });
        }
      } catch (_) {}
    }

    try { localStorage.removeItem('xmi_user_id'); } catch (_) {}
    const currentUserId = Number(tg?.initDataUnsafe?.user?.id || (new URLSearchParams(window.location.search)).get('user_id')) || 0;
    const currentUserName = tg?.initDataUnsafe?.user?.first_name || (tg?.initDataUnsafe?.user?.username || 'User');
    const adminId = "__ADMIN_ID__";
    const botUsername = "__BOT_USERNAME__";
    let isAdmin = Boolean(adminId && currentUserId > 0 && String(currentUserId) === String(adminId));

    let allPosts = [];
    let savedPostIds = new Set();
    let currentSort = 'all';
    let currentSearch = '';
    let currentView = 'feed';
    let globalSettings = {};
    let userPoints = 0;
    let activeCommentPostId = null;
    let basePostNumber = 76;
    let selectedUserForAction = null;
    let currentDetailPost = null;
    let currentPostPictures = [];
    let currentPostVideos = [];
    let activePhotoIndex = 0;
    let activeVideoIndex = 0;

    function showToast(msg) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // Indian Standard Time (IST, UTC+5:30) Formatting Helpers
    function formatISTDateTime(isoString) {
      if (!isoString) return '';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) + ' IST';
    }

    function formatISTTime(isoString) {
      if (!isoString) return '';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) + ' IST';
    }

    function formatISTDate(isoString) {
      if (!isoString) return '';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    // ==========================================
    // Analytics: Post View & Download Tracking
    // ==========================================
    const trackedViewPostIds = new Set();

    function trackPostView(postId) {
      if (!postId || !currentUserId || isAdmin) return;
      const pid = Number(postId);
      if (trackedViewPostIds.has(pid)) return;
      trackedViewPostIds.add(pid);

      fetch('/api/posts/' + pid + '/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          username: currentUserName || null,
          first_name: tg?.initDataUnsafe?.user?.first_name || ''
        })
      }).catch(() => {});
    }

    function trackPostDownload(postId, itemName) {
      if (!postId || !currentUserId || isAdmin) return;
      fetch('/api/posts/' + postId + '/access-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          username: currentUserName || null,
          first_name: tg?.initDataUnsafe?.user?.first_name || '',
          item_name: itemName || ('Post #' + postId)
        })
      }).catch(() => {});
    }

    // ==========================================
    // Fullscreen Image Lightbox with Pinch, Zoom & Swiping
    // ==========================================
    let lightboxScale = 1.0;
    let isLightboxOpen = false;

    function openImageLightbox(imageUrl, title, optIdx) {
      if (typeof optIdx === 'number') {
        activePhotoIndex = optIdx;
      }
      if (!imageUrl && currentPostPictures && currentPostPictures[activePhotoIndex]) {
        imageUrl = currentPostPictures[activePhotoIndex].url;
        title = currentPostPictures[activePhotoIndex].title;
      }
      if (!imageUrl) return;
      const modal = document.getElementById('imageLightboxModal');
      const img = document.getElementById('lightboxImg');
      const titleEl = document.getElementById('lightboxTitle');
      if (!modal || !img) return;

      img.src = imageUrl;
      const count = (currentPostPictures && currentPostPictures.length > 1) ? ' (' + (activePhotoIndex + 1) + '/' + currentPostPictures.length + ')' : '';
      if (titleEl) titleEl.textContent = '🖼️ ' + (title || 'Preview Image') + count;
      setLightboxZoom(1.0);
      modal.classList.add('active');
      isLightboxOpen = true;

      // Show navigation arrows on lightbox if multiple photos
      const navBtns = modal.querySelectorAll('.lightbox-nav-btn');
      navBtns.forEach(btn => {
        btn.style.display = (currentPostPictures && currentPostPictures.length > 1) ? 'flex' : 'none';
      });

      // Enable Telegram Native Back Button or browser back button
      if (tg?.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(closeImageLightbox);
      }
      try {
        window.history.pushState({ modal: 'lightbox' }, '');
      } catch (e) {}
    }

    function switchLightboxPhoto(newIdx) {
      if (!currentPostPictures || currentPostPictures.length === 0) return;
      if (newIdx < 0) newIdx = currentPostPictures.length - 1;
      if (newIdx >= currentPostPictures.length) newIdx = 0;
      activePhotoIndex = newIdx;
      const pic = currentPostPictures[activePhotoIndex];
      if (!pic) return;

      const img = document.getElementById('lightboxImg');
      if (img) img.src = pic.url;
      const titleEl = document.getElementById('lightboxTitle');
      if (titleEl) {
        titleEl.textContent = '🖼️ ' + (pic.title || 'Photo') + ' (' + (activePhotoIndex + 1) + '/' + currentPostPictures.length + ')';
      }
      setLightboxZoom(1.0);

      // Keep post detail main photo & thumbnails synced
      const mainImg = document.getElementById('postDetailMainPhoto');
      if (mainImg) mainImg.src = pic.url;
      const badge = document.getElementById('postPhotoCounterBadge');
      if (badge) badge.textContent = (activePhotoIndex + 1) + ' / ' + currentPostPictures.length;
      document.querySelectorAll('.photo-thumb-item').forEach((t, idx) => {
        if (idx === activePhotoIndex) {
          t.style.borderColor = '#38bdf8';
          t.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        } else {
          t.style.borderColor = 'rgba(255,255,255,0.12)';
        }
      });
    }

    function switchPostDetailPhoto(newIdx) {
      if (!currentPostPictures || currentPostPictures.length === 0) return;
      if (newIdx < 0) newIdx = currentPostPictures.length - 1;
      if (newIdx >= currentPostPictures.length) newIdx = 0;
      activePhotoIndex = newIdx;
      const pic = currentPostPictures[activePhotoIndex];
      if (!pic) return;

      const mainImg = document.getElementById('postDetailMainPhoto');
      if (mainImg) mainImg.src = pic.url;

      const badge = document.getElementById('postPhotoCounterBadge');
      if (badge) badge.textContent = (activePhotoIndex + 1) + ' / ' + currentPostPictures.length;

      const photoViewsEl = document.getElementById('postActivePhotoViews');
      if (photoViewsEl) {
        photoViewsEl.textContent = pic.view_count || 0;
        if (pic.id) photoViewsEl.setAttribute('data-fview-id', pic.id);
      }

      document.querySelectorAll('.photo-thumb-item').forEach((t, idx) => {
        if (idx === activePhotoIndex) {
          t.style.borderColor = '#38bdf8';
          t.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        } else {
          t.style.borderColor = 'rgba(255,255,255,0.12)';
        }
      });

      if (pic.id && currentDetailPost) {
        trackFileView(currentDetailPost.id, pic.id);
      }
    }

    function closeImageLightbox() {
      const modal = document.getElementById('imageLightboxModal');
      if (!modal || !isLightboxOpen) return;
      modal.classList.remove('active');
      isLightboxOpen = false;
      setLightboxZoom(1.0);

      // Hide Telegram Native Back Button
      if (tg?.BackButton) {
        tg.BackButton.offClick(closeImageLightbox);
        tg.BackButton.hide();
      }

      try {
        if (window.history.state?.modal === 'lightbox') {
          window.history.back();
        }
      } catch (e) {}
    }

    function setLightboxZoom(scale) {
      lightboxScale = Math.max(0.5, Math.min(3.5, scale));
      const img = document.getElementById('lightboxImg');
      const zoomText = document.getElementById('lightboxZoomLevel');
      if (img) {
        img.style.transform = 'scale(' + lightboxScale + ')';
        img.style.cursor = lightboxScale > 1 ? 'grab' : 'zoom-in';
      }
      if (zoomText) {
        zoomText.textContent = Math.round(lightboxScale * 100) + '%';
      }
    }

    function showAdminElements() {
      isAdmin = true;
      const bAdmin = document.getElementById('badgeAdmin');
      if (bAdmin) bAdmin.style.display = 'inline-block';
      const mBar = document.getElementById('adminModeBar');
      if (mBar) mBar.style.display = 'flex';
      const bQuick = document.getElementById('btnAdminQuick');
      if (bQuick) bQuick.style.display = 'inline-flex';
      const nAdmin = document.getElementById('navAdminPill');
      if (nAdmin) nAdmin.style.display = 'inline-flex';
      generateNewDestLink();
    }

    function hideAdminElements() {
      isAdmin = false;
      const bAdmin = document.getElementById('badgeAdmin');
      if (bAdmin) bAdmin.style.display = 'none';
      const mBar = document.getElementById('adminModeBar');
      if (mBar) mBar.style.display = 'none';
      const bQuick = document.getElementById('btnAdminQuick');
      if (bQuick) bQuick.style.display = 'none';
      const nAdmin = document.getElementById('navAdminPill');
      if (nAdmin) nAdmin.style.display = 'none';
      const vAdmin = document.getElementById('viewAdminHub');
      if (vAdmin) vAdmin.style.display = 'none';
      const vFeed = document.getElementById('viewPublicFeed');
      if (vFeed) vFeed.style.display = 'block';
    }

    // Send periodic presence heartbeat while user is active in Mini App (every 60s)
    function sendAppHeartbeat() {
      if (!currentUserId || Number(currentUserId) <= 0) return;
      fetch('/api/user/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, action: '📱 Active in Mini App' })
      }).catch(() => {});
    }

    function getTargetPostId() {
      try {
        // 1. Hash match: #post=104, #post_104, #104
        const hash = window.location.hash || '';
        if (hash === '#home' || hash === '#feed') return null;
        const hashMatch = hash.match(/post[=_](\d+)|^#(\d+)$/i);
        if (hashMatch) return hashMatch[1] || hashMatch[2];

        // 2. Query param: ?post=104 or ?post_id=104
        const urlParams = new URLSearchParams(window.location.search);
        let pid = urlParams.get('post') || urlParams.get('post_id');
        if (pid) return pid;

        // 3. Telegram WebApp start_param (e.g. from bot link)
        const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
        if (startParam) {
          const spMatch = String(startParam).match(/post_?(\d+)|^(\d+)$/i);
          if (spMatch) return spMatch[1] || spMatch[2];
        }

        // 4. SessionStorage ONLY if hash already indicates post detail (prevent regular app launch traps)
        try {
          const stored = sessionStorage.getItem('active_post_id');
          if (stored && /^\d+$/.test(stored) && hash && hash.startsWith('#post')) {
            return stored;
          }
        } catch (_) {}
      } catch (_) {}
      return null;
    }

    function checkInitialPostRoute() {
      const targetPostId = getTargetPostId();
      if (targetPostId) {
        openPostDetailPage(targetPostId);
      }
    }

    // Initialize App
    async function initApp() {
      // Clear any legacy localStorage post locks so regular open always lands on clean feed
      try { localStorage.removeItem('active_post_id'); } catch (_) {}

      if (isAdmin) {
        showAdminElements();
      }

      setupEventListeners();

      // Check initial route if user came directly via a post link or start_param
      checkInitialPostRoute();

      // Start presence heartbeat
      sendAppHeartbeat();
      setInterval(sendAppHeartbeat, 60000);

      // Instant Feed Restore (0ms): render from session cache immediately if available
      try {
        const cached = sessionStorage.getItem('cached_feed_posts');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allPosts = parsed;
            savedPostIds = new Set(allPosts.filter(p => p.is_saved).map(p => p.id));
            renderFeed();
          }
        }
      } catch (_) {}

      // Concurrently fetch posts and settings without blocking each other
      Promise.all([
        loadPosts(),
        loadSettingsAndUser()
      ]).catch(() => {});
    }

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash || '';
      const m = hash.match(/post[=_](\d+)|^#(\d+)$/i);
      if (m) {
        openPostDetailPage(m[1] || m[2]);
      } else if (hash === '#home' || hash === '#feed') {
        goBackToFeed();
      }
    });

    // Handle App Re-opening / Resuming after Telegram minimization or closing
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        try {
          if (tg) {
            if (!tg.isExpanded && typeof tg.expand === 'function') tg.expand();
            if (typeof tg.enableVerticalSwipes === 'function') tg.enableVerticalSwipes();
            if (typeof tg.enableClosingConfirmation === 'function') tg.enableClosingConfirmation();
          }
          sendAppHeartbeat();
        } catch (_) {}
      } else {
        // App is being minimized / backgrounded: safely pause active video to avoid browser errors
        try {
          const player = document.getElementById('postActiveVideoPlayer');
          if (player && !player.paused) {
            player.pause();
          }
        } catch (_) {}
      }
    });

    window.addEventListener('pageshow', () => {
      try {
        if (tg) {
          if (!tg.isExpanded && typeof tg.expand === 'function') tg.expand();
          if (typeof tg.enableVerticalSwipes === 'function') tg.enableVerticalSwipes();
        }
      } catch (_) {}
    });

    window.addEventListener('focus', () => {
      try {
        if (tg && !tg.isExpanded && typeof tg.expand === 'function') {
          tg.expand();
        }
      } catch (_) {}
    });

    // Generate Destination Link for Admin to Shorten
    async function generateNewDestLink() {
      try {
        const res = await fetch('/api/admin/shorteners/generate-link?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success && data.bot_verify_link) {
          const input = document.getElementById('addShDestLink');
          if (input) input.value = data.bot_verify_link;
        }
      } catch (e) {
        const fallback = 'https://t.me/' + botUsername + '?start=verify_v_' + Math.random().toString(36).substring(2, 10);
        const input = document.getElementById('addShDestLink');
        if (input) input.value = fallback;
      }
    }

    // Load Settings & User Balance
    async function loadSettingsAndUser() {
      try {
        const res = await fetch('/api/settings?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          globalSettings = data.settings || {};
          if (data.user) {
            userPoints = Number(data.user.points) || 0;
          }

          if (data.is_admin) {
            showAdminElements();
          } else {
            hideAdminElements();
          }
          document.body.style.overflowY = 'auto';
          document.documentElement.style.overflowY = 'auto';

          // Show points badge if referrals or shorteners enabled
          if (globalSettings.referral_enabled || globalSettings.shortener_enabled) {
            document.getElementById('btnHeaderPoints').style.display = 'inline-flex';
            document.getElementById('headerPointsVal').textContent = userPoints;
            document.getElementById('navEarnPoints').style.display = 'inline-flex';
          }

          // Setup In-App Banner
          if (globalSettings.banner_enabled && globalSettings.banner_title) {
            const banner = document.getElementById('sponsoredBanner');
            banner.href = globalSettings.banner_link || '#';
            document.getElementById('sponsorTitle').textContent = globalSettings.banner_title;
            document.getElementById('sponsorDesc').textContent = globalSettings.banner_text || '';
            const img = document.getElementById('sponsorImg');
            if (globalSettings.banner_image) {
              img.src = globalSettings.banner_image;
              img.style.display = 'block';
            } else {
              img.style.display = 'none';
            }
            banner.style.display = 'flex';
          }


          // Check Require Bot Start Gate
          checkRequireBotStart(data.has_started_bot);
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    }

    function checkRequireBotStart(hasStartedBot) {
      if (isAdmin) return; // Admins bypass start requirement
      if (!globalSettings.require_bot_start_enabled) return;

      if (!hasStartedBot) {
        const modal = document.getElementById('requireBotStartModal');
        const msgEl = document.getElementById('reqStartModalMsg');
        const actionBtn = document.getElementById('btnReqStartAction');

        if (globalSettings.require_bot_start_message) {
          msgEl.textContent = globalSettings.require_bot_start_message;
        }

        const startLink = globalSettings.require_bot_start_link || ('https://t.me/' + botUsername + '?start=start');
        actionBtn.href = startLink;

        // Display locked middle screen modal
        modal.classList.add('active');
      }
    }

    // Load Published Posts
    async function loadPosts() {
      try {
        const res = await fetch('/api/posts?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) {
          allPosts = data.posts.map(p => {
            const likes = Number(p.like_count) || 0;
            const downloads = Number(p.access_count) || 0;
            const views = Number(p.view_count) || 0;
            const base = (likes * 5) + (downloads * 4) + (views * 1);
            p._popularityScore = (base + 1) * (0.8 + Math.random() * 0.4);
            return p;
          });
          try {
            sessionStorage.setItem('cached_feed_posts', JSON.stringify(allPosts));
          } catch (_) {}
          savedPostIds = new Set(allPosts.filter(p => p.is_saved).map(p => p.id));
          renderFeed();
        }
      } catch (e) {
        console.error('Failed to load posts:', e);
      }
    }

    // Render Public Feed (Only 1 primary action button: Open in Bot)
    function renderFeed() {
      const grid = document.getElementById('postsGrid');
      grid.innerHTML = '';

      let list = [...allPosts];

      if (currentView === 'saved') {
        list = list.filter(p => savedPostIds.has(p.id));
      }

      if (currentSearch.trim()) {
        const q = currentSearch.toLowerCase();
        list = list.filter(p =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.tags || '').toLowerCase().includes(q)
        );
      }

      // Sort: Promoted / Exclusive posts ALWAYS appear at top!
      list.sort((a, b) => {
        if (a.is_promoted && !b.is_promoted) return -1;
        if (!a.is_promoted && b.is_promoted) return 1;

        if (currentSort === 'views') {
          return (Number(b.view_count) || 0) - (Number(a.view_count) || 0);
        } else if (currentSort === 'likes') {
          return (Number(b.like_count) || 0) - (Number(a.like_count) || 0);
        } else if (currentSort === 'downloads') {
          return (Number(b.access_count) || 0) - (Number(a.access_count) || 0);
        } else if (currentSort === 'latest') {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        } else {
          // Default 'all': Organic engagement ranking as per highest likes, views, and downloads with dynamic variety
          return (b._popularityScore || 0) - (a._popularityScore || 0);
        }
      });

      if (list.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; padding: 40px 0; text-align: center; color: var(--text-muted);"><div style="font-size: 38px; margin-bottom: 8px;">🔍</div><div style="font-weight: 600;">No posts found</div><div style="font-size: 0.8rem; margin-top: 4px;">Try a different search term.</div></div>';
        return;
      }

      list.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card' + (post.is_promoted ? ' is-promoted' : '');

        const isSaved = savedPostIds.has(post.id);
        const pointsRequired = Number(globalSettings.points_per_post) || 0;
        const shortenerOn = Boolean(globalSettings.shortener_enabled && pointsRequired > 0);

        let imgHtml = '<div class="post-image-placeholder">📄</div>';
        if (post.preview_image) {
          imgHtml = '<div class="post-image-backdrop" style="background-image: url(&quot;' + escapeHtml(post.preview_image) + '&quot;);"></div><img src="' + escapeHtml(post.preview_image) + '" alt="" class="post-image-fg" loading="lazy" />';
        }

        let promotedBadge = post.is_promoted ? '<span class="post-status-badge status-promoted" style="color: #fff; font-weight: 800; background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);">⭐ Exclusive</span>' : '';
        const zoomHint = post.preview_image ? '<div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.65); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; pointer-events: none; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 3px;">🔍 Tap to Zoom</div>' : '';

        const actionButtonHtml = '<button class="btn-open-bot-full" data-act="open-post" data-id="' + post.id + '" data-title="' + escapeHtml(post.title) + '" style="background: linear-gradient(135deg, #0284c7, #38bdf8); color: #fff; font-weight: 700; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.25);">📂 Open Post</button>';

        card.innerHTML = '<div class="post-image-container" style="cursor: pointer;" data-act="open-post" data-id="' + post.id + '" data-title="' + escapeHtml(post.title) + '">' + imgHtml + zoomHint + (promotedBadge ? '<div class="post-badges-top">' + promotedBadge + '</div>' : '') + '</div>' +
          '<div class="post-body">' +
          '<h3 class="post-title">' + escapeHtml(post.title) + '</h3>' +
          '<div class="post-meta"><span>📅 ' + formatISTDate(post.created_at) + '</span>' + (post.tags ? '<span>• ' + escapeHtml(post.tags) + '</span>' : '') + (shortenerOn ? '<span style="color: #fbbf24; font-weight: 700;">• 🪙 ' + pointsRequired + ' pt' + (pointsRequired > 1 ? 's' : '') + '</span>' : '') + '</div>' +
          '<div class="post-actions-row">' +
          '<div class="social-counters">' +
          '<button class="action-btn ' + (post.is_liked ? 'liked' : '') + '" data-act="like" data-id="' + post.id + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span>' + (post.like_count || 0) + '</span></button>' +
          '<button class="action-btn" data-act="comment" data-id="' + post.id + '" data-title="' + escapeHtml(post.title) + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span>' + (post.comment_count || 0) + '</span></button>' +
          '<button class="action-btn ' + (isSaved ? 'saved' : '') + '" data-act="save" data-id="' + post.id + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="' + (isSaved ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>' +
          '</div>' +
          '</div>' +
          actionButtonHtml +
          '</div>';

        grid.appendChild(card);
        trackPostView(post.id);
      });
    }

    // Render Admin Hub Posts List
    async function loadAdminPosts() {
      if (!isAdmin) return;
      const grid = document.getElementById('adminPostsGrid');
      grid.innerHTML = '<div style="padding: 20px; text-align: center;">Loading admin posts...</div>';

      try {
        const res = await fetch('/api/admin/posts?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          const posts = data.posts || [];
          if (posts.length === 0) {
            grid.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No posts in database.</div>';
            return;
          }

          grid.innerHTML = '';
          posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            const zoomHintAdmin = post.preview_image ? '<div style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.65); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; pointer-events: none; backdrop-filter: blur(4px);">🔍 Zoom</div>' : '';
            card.innerHTML = '<div class="post-image-container" style="height: 140px; cursor: pointer;" data-act="preview-image" data-img="' + escapeHtml(post.preview_image || '') + '" data-title="' + escapeHtml(post.title) + '">' +
              (post.preview_image ? '<div class="post-image-backdrop" style="background-image: url(&quot;' + escapeHtml(post.preview_image) + '&quot;);"></div><img src="' + escapeHtml(post.preview_image) + '" alt="" class="post-image-fg" loading="lazy" />' : '<div class="post-image-placeholder">📄</div>') +
              zoomHintAdmin +
              '<div class="post-badges-top"><span class="post-status-badge status-' + post.status + '">' + post.status + '</span>' +
              (post.is_promoted ? '<span class="post-status-badge status-promoted">⭐ Pin</span>' : '') + '</div></div>' +
              '<div class="post-body">' +
              '<h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px;">' + escapeHtml(post.title) + '</h4>' +
              '<div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 10px;">👁️ ' + (post.view_count || 0) + ' views • ❤️ ' + (post.like_count || 0) + ' likes • 📥 ' + (post.access_count || 0) + ' accesses</div>' +
              '<div style="display: flex; gap: 6px; margin-top: auto;">' +
              '<button class="btn btn-sm btn-secondary" style="flex: 1;" data-aact="edit" data-id="' + post.id + '">✏️ Edit</button>' +
              '<button class="btn btn-sm btn-ghost" style="color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);" data-aact="links" data-id="' + post.id + '" data-title="' + escapeHtml(post.title) + '" title="Get Bot & App Links">🔗 Links</button>' +
              '<button class="btn btn-sm btn-ghost" style="color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);" data-aact="stats" data-id="' + post.id + '" title="View Stats">📊</button>' +
              '<button class="btn btn-sm btn-ghost" style="color: #f87171;" data-aact="del" data-id="' + post.id + '">🗑️</button>' +
              '</div></div>';
            grid.appendChild(card);
          });
        }
      } catch (e) {
        grid.innerHTML = '<div style="color: #f87171; padding: 20px;">Failed to load admin posts.</div>';
      }
    }

    // Render Shorteners List in Admin Hub
    async function loadShorteners() {
      if (!isAdmin) return;
      const list = document.getElementById('shortenersList');
      list.innerHTML = '<div style="padding: 10px;">Loading shorteners...</div>';

      try {
        const res = await fetch('/api/admin/shorteners?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          const shorteners = data.shorteners || [];
          if (shorteners.length === 0) {
            list.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted);">No manual shorteners added yet. Create one above!</div>';
            return;
          }

          list.innerHTML = '';
          shorteners.forEach(sh => {
            const item = document.createElement('div');
            item.style.cssText = 'background: rgba(15, 23, 42, 0.6); padding: 12px 14px; border-radius: 12px; border: 1px solid var(--card-border); display: flex; flex-direction: column; gap: 6px;';
            item.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;">' +
              '<strong style="font-size: 0.9rem; color: #ffffff;">' + escapeHtml(sh.title || sh.name) + '</strong>' +
              '<div style="display: flex; align-items: center; gap: 8px;">' +
              '<span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 6px;">🪙 +' + (sh.reward_points || 5) + ' pts</span>' +
              '<button class="btn btn-sm btn-ghost" style="color: #f87171; padding: 3px 8px;" data-delsh="' + sh.id + '">🗑️ Delete</button>' +
              '</div></div>' +
              '<div style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">🔗 Short Link: <a href="' + escapeHtml(sh.shortener_url) + '" target="_blank" style="color: var(--primary);">' + escapeHtml(sh.shortener_url) + '</a></div>' +
              (sh.bot_verify_link ? '<div style="font-size: 0.72rem; color: var(--text-muted); word-break: break-all;">🎯 Target Bot: <code style="color: #cbd5e1;">' + escapeHtml(sh.bot_verify_link) + '</code></div>' : '');
            list.appendChild(item);
          });
        }
      } catch (e) {
        list.innerHTML = '<div style="color: #f87171;">Failed to load shorteners.</div>';
      }
    }

    // Render Global Stats in Admin Hub
    async function loadAdminAnalytics() {
      if (!isAdmin) return;
      try {
        const res = await fetch('/api/admin/stats?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          const s = data.stats || {};
          document.getElementById('gaUsers').textContent = s.total_users || 0;
          document.getElementById('gaViews').textContent = s.total_views || 0;
          document.getElementById('gaVerifies').textContent = s.total_verifications || 0;
          document.getElementById('gaRefers').textContent = s.total_referrals || 0;
          document.getElementById('gaPosts').textContent = s.total_posts || 0;
          document.getElementById('gaForceJoins').textContent = s.total_force_joins || 0;
          document.getElementById('gaLikes').textContent = s.total_likes || 0;
          document.getElementById('gaDownloads').textContent = s.total_file_accesses || 0;

          // Leaderboard Views
          const topViewsEl = document.getElementById('adminTopViews');
          topViewsEl.innerHTML = '';
          (s.top_views || []).forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-item';
            row.innerHTML = '<span>#' + (idx + 1) + ' ' + escapeHtml(item.title) + '</span><strong style="color: var(--primary);">' + item.view_count + ' views</strong>';
            topViewsEl.appendChild(row);
          });

          // Highest Downloaded Post Hero Card
          const highestCard = document.getElementById('adminHighestDownloadCard');
          if (highestCard) {
            if (s.highest_download_post && s.highest_download_post.download_count > 0) {
              const h = s.highest_download_post;
              highestCard.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
                '<div>' +
                  '<div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; color: #4ade80; font-weight: 700;">🏆 Most Downloaded Post</div>' +
                  '<strong style="font-size: 0.95rem; color: #ffffff;">' + escapeHtml(h.title || ('Post #' + h.id)) + '</strong>' +
                  '<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Post ID: <code>' + h.id + '</code></div>' +
                '</div>' +
                '<div style="text-align: right;">' +
                  '<div style="font-size: 1.25rem; font-weight: 800; color: #4ade80;">' + h.download_count + '</div>' +
                  '<div style="font-size: 0.7rem; color: var(--text-muted);">Total Downloads</div>' +
                '</div>' +
              '</div>';
            } else {
              highestCard.innerHTML = '<div style="color: var(--text-muted); font-size: 0.78rem; text-align: center;">No downloads recorded yet</div>';
            }
          }

          // Leaderboard Downloads
          const topDownloadsEl = document.getElementById('adminTopDownloads');
          if (topDownloadsEl) {
            topDownloadsEl.innerHTML = '';
            if (s.top_downloads && s.top_downloads.length > 0) {
              s.top_downloads.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'leaderboard-item';
                row.innerHTML = '<span>#' + (idx + 1) + ' ' + escapeHtml(item.title || ('Post #' + item.id)) + '</span><strong style="color: #4ade80;">' + item.download_count + ' downloads</strong>';
                topDownloadsEl.appendChild(row);
              });
            } else {
              topDownloadsEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.75rem; text-align: center; padding: 6px;">No file downloads yet</div>';
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load admin analytics:', e);
      }
    }

    // Render Force Channels List in Admin Hub
    async function loadChannels() {
      if (!isAdmin) return;
      const list = document.getElementById('forceChannelsList');
      if (!list) return;
      list.innerHTML = '<div style="padding: 10px;">Loading force channels...</div>';

      try {
        const res = await fetch('/api/admin/force-channels?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          const channels = data.channels || [];
          if (channels.length === 0) {
            list.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px 0;">No mandatory channels added yet.</div>';
            return;
          }

          list.innerHTML = '';
          channels.forEach(ch => {
            const item = document.createElement('div');
            item.style.cssText = 'background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 12px; border: 1px solid var(--card-border); display: flex; align-items: center; justify-content: space-between; gap: 8px;';
            item.innerHTML = '<div><strong style="font-size: 0.88rem; color: #ffffff;">' + escapeHtml(ch.channel_title) + '</strong><div style="font-size: 0.74rem; color: var(--text-muted);">' + escapeHtml(ch.channel_id) + '</div></div>' +
              '<div style="display: flex; align-items: center; gap: 6px;"><a href="' + escapeHtml(ch.invite_link) + '" target="_blank" class="btn btn-sm btn-secondary" style="padding: 3px 8px;">🔗 View</a><button class="btn btn-sm btn-ghost" style="color: #f87171; padding: 3px 8px;" data-delch="' + ch.id + '">🗑️</button></div>';
            list.appendChild(item);
          });
        }
      } catch (e) {
        list.innerHTML = '<div style="color: #f87171;">Failed to load channels.</div>';
      }
    }

    function formatRelativeTime(isoString) {
      if (!isoString) return '';
      const now = Date.now();
      const past = new Date(isoString).getTime();
      if (isNaN(past)) return '';
      const diffSec = Math.floor((now - past) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return diffMin + 'm ago';
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return diffHr + 'h ago';
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 30) return diffDays + 'd ago';
      return formatISTDate(isoString);
    }

    // Render Registered Users Directory in Admin Hub
    let cachedAdminUsers = [];
    async function loadAdminUsers() {
      if (!isAdmin) return;
      const list = document.getElementById('adminUsersList');
      if (!list) return;
      list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 16px;">⏳ Fetching registered users...</div>';

      try {
        const res = await fetch('/api/admin/users?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          cachedAdminUsers = data.users || [];
          const total = cachedAdminUsers.length;
          const blocked = cachedAdminUsers.filter(u => Boolean(u.is_blocked)).length;
          const online = cachedAdminUsers.filter(u => Boolean(u.is_online)).length;
          const active = total - blocked;

          const elTotal = document.getElementById('cntUsersTotal');
          if (elTotal) elTotal.textContent = total;
          const elActive = document.getElementById('cntUsersActive');
          if (elActive) elActive.textContent = active;
          const elBlocked = document.getElementById('cntUsersBlocked');
          if (elBlocked) elBlocked.textContent = blocked;
          const elOnline = document.getElementById('cntUsersOnline');
          if (elOnline) elOnline.textContent = online;

          renderAdminUsers();
        } else {
          list.innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Failed to load users: ' + escapeHtml(data.error || 'Unknown error') + '</div>';
        }
      } catch (e) {
        list.innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Network error loading users</div>';
      }
    }

    function renderAdminUsers() {
      const list = document.getElementById('adminUsersList');
      if (!list) return;
      const filter = document.getElementById('adminUsersFilterSelect')?.value || 'all';
      const search = (document.getElementById('adminUsersSearchInput')?.value || '').toLowerCase().trim();

      let filtered = [...cachedAdminUsers];
      if (filter === 'active') {
        filtered = filtered.filter(u => !u.is_blocked);
      } else if (filter === 'blocked') {
        filtered = filtered.filter(u => Boolean(u.is_blocked));
      } else if (filter === 'online') {
        filtered = filtered.filter(u => Boolean(u.is_online));
      }

      if (search) {
        filtered = filtered.filter(u => {
          const idMatch = String(u.id || '').includes(search);
          const nameMatch = (u.first_name || '').toLowerCase().includes(search);
          const userMatch = (u.username || '').toLowerCase().includes(search);
          return idMatch || nameMatch || userMatch;
        });
      }

      list.innerHTML = '';
      if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No users matching filter / search.</div>';
        return;
      }

      filtered.forEach(u => {
        const isBlocked = Boolean(u.is_blocked);
        const isOnline = Boolean(u.is_online);
        const tgLink = u.username ? ('https://t.me/' + u.username) : ('tg://user?id=' + u.id);
        const displayName = u.first_name ? escapeHtml(u.first_name) : (u.username ? '@' + escapeHtml(u.username) : ('User #' + u.id));
        const usernameDisplay = u.username ? ('@' + escapeHtml(u.username)) : 'No username';
        const lastActiveText = isOnline ? '🟢 Active in Mini App' : (u.last_activity ? ('🕒 Active ' + formatRelativeTime(u.last_activity)) : '');

        let statusBadge = '<span style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: rgba(34, 197, 94, 0.2); color: #4ade80;">ACTIVE</span>';
        if (isBlocked) {
          statusBadge = '<span style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: rgba(239, 68, 68, 0.2); color: #f87171;">BLOCKED</span>';
        } else if (isOnline) {
          statusBadge = '<span style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; display: inline-flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; display: inline-block;"></span>ONLINE</span>';
        }

        const row = document.createElement('div');
        row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid ' + (isBlocked ? 'rgba(239, 68, 68, 0.35)' : (isOnline ? 'rgba(56, 189, 248, 0.35)' : 'var(--card-border)')) + '; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;';
        row.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; min-width: 180px;">' +
          '<div style="font-size: 1.4rem;">' + (isBlocked ? '🚫' : (isOnline ? '🟢' : '👤')) + '</div>' +
          '<div>' +
            '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<strong style="font-size: 0.88rem; color: var(--text-main);">' + displayName + '</strong>' +
              statusBadge +
            '</div>' +
            '<div style="font-size: 0.73rem; color: var(--text-muted); margin-top: 2px;">' +
              usernameDisplay + ' • ID: <code>' + u.id + '</code>' +
              (lastActiveText ? (' • <span style="color: ' + (isOnline ? '#38bdf8; font-weight: 600;' : 'var(--text-muted);') + '">' + lastActiveText + '</span>') : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">' +
          '<div style="text-align: right; font-size: 0.74rem; color: var(--text-muted);">' +
            '<div>🪙 <strong style="color: #fbbf24;">' + (u.points || 0) + '</strong> pts</div>' +
            '<div>🔄 ' + (u.interactions || 1) + ' acts</div>' +
          '</div>' +
          '<button type="button" class="btn btn-sm btn-info btn-open-user-activity" data-uid="' + u.id + '" data-username="' + (u.username || '') + '" data-name="' + escapeHtml(displayName) + '" style="padding: 6px 10px; font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8;">' +
            '🔍 Activity' +
          '</button>' +
          '<button type="button" class="btn btn-sm btn-secondary btn-open-user-chat" data-uid="' + u.id + '" data-username="' + (u.username || '') + '" data-name="' + escapeHtml(displayName) + '" style="padding: 6px 10px; font-size: 0.75rem;">' +
            '💬 Open' +
          '</button>' +
        '</div>';
        list.appendChild(row);
      });
    }

    // Render Comments Moderation in Admin Hub
    let cachedAdminComments = [];
    async function loadAdminComments() {
      if (!isAdmin) return;
      const list = document.getElementById('adminCommentsList');
      if (!list) return;
      list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 16px;">⏳ Fetching comments...</div>';

      try {
        const res = await fetch('/api/admin/comments?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          cachedAdminComments = data.comments || [];
          renderAdminComments();
        } else {
          list.innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Failed to load comments: ' + escapeHtml(data.error || 'Unknown error') + '</div>';
        }
      } catch (e) {
        list.innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Network error loading comments</div>';
      }
    }

    function renderAdminComments() {
      const list = document.getElementById('adminCommentsList');
      if (!list) return;
      const filter = document.getElementById('adminCommentsFilterSelect')?.value || 'all';
      const search = (document.getElementById('adminCommentsSearchInput')?.value || '').toLowerCase().trim();

      let filtered = [...cachedAdminComments];
      if (filter === 'active') {
        filtered = filtered.filter(c => !c.is_hidden);
      } else if (filter === 'hidden') {
        filtered = filtered.filter(c => Boolean(c.is_hidden));
      }

      if (search) {
        filtered = filtered.filter(c => {
          const userMatch = (c.username || '').toLowerCase().includes(search);
          const textMatch = (c.text || '').toLowerCase().includes(search);
          const postMatch = (c.posts?.title || '').toLowerCase().includes(search);
          return userMatch || textMatch || postMatch;
        });
      }

      list.innerHTML = '';
      if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No comments matching filter / search.</div>';
        return;
      }

      filtered.forEach(c => {
        const isHidden = Boolean(c.is_hidden);
        const dateStr = c.created_at ? formatISTDateTime(c.created_at) : '';
        const postTitle = c.posts?.title ? escapeHtml(c.posts.title) : ('Post #' + c.post_id);
        const userDisplay = c.username ? ('@' + escapeHtml(c.username)) : ('User #' + c.user_id);

        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid ' + (isHidden ? 'rgba(239, 68, 68, 0.35)' : 'var(--card-border)') + '; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;';
        card.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">' +
          '<div style="display: flex; align-items: center; gap: 6px;">' +
            '<span style="font-size: 1.1rem;">💬</span>' +
            '<strong style="font-size: 0.85rem; color: var(--text-main);">' + userDisplay + '</strong>' +
            '<span style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; ' + (isHidden ? 'background: rgba(239, 68, 68, 0.2); color: #f87171;' : 'background: rgba(34, 197, 94, 0.2); color: #4ade80;') + '">' +
              (isHidden ? 'HIDDEN' : 'ACTIVE') +
            '</span>' +
          '</div>' +
          '<div style="font-size: 0.7rem; color: var(--text-muted);">' + dateStr + '</div>' +
        '</div>' +
        '<div style="font-size: 0.74rem; color: var(--primary);">📌 On Post: <strong>' + postTitle + '</strong></div>' +
        '<div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; color: #f1f5f9; line-height: 1.4; word-break: break-word;">' +
          escapeHtml(c.text) +
        '</div>' +
        '<div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 4px;">' +
          '<button type="button" class="btn btn-sm btn-ghost" data-cact="toggle-hide" data-id="' + c.id + '" data-hidden="' + (isHidden ? '1' : '0') + '" style="font-size: 0.74rem; padding: 4px 10px; border: 1px solid var(--card-border);">' +
            (isHidden ? '👁️ Unhide' : '🙈 Hide') +
          '</button>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-cact="delete" data-id="' + c.id + '" style="font-size: 0.74rem; padding: 4px 10px; color: #f87171; border: 1px solid rgba(239,68,68,0.3);">' +
            '🗑️ Delete' +
          '</button>' +
        '</div>';
        list.appendChild(card);
      });
    }

    // Post Stats Modal logic
    let currentPostStatsData = null;
    let currentPostStatsActiveTab = 'downloads';

    async function openPostStatsModal(postId) {
      const modal = document.getElementById('postStatsModal');
      if (!modal) return;
      document.getElementById('postStatsTitle').textContent = '📊 Loading Post Stats...';
      document.getElementById('postStatViewsCnt').textContent = '0';
      document.getElementById('postStatAccessCnt').textContent = '0';
      document.getElementById('postStatLikesCnt').textContent = '0';
      document.getElementById('postStatLogsList').innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">⏳ Loading stats...</div>';
      modal.classList.add('active');

      try {
        const res = await fetch('/api/admin/posts/' + postId + '/analytics?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success && data.analytics) {
          currentPostStatsData = data.analytics;
          const viewsCnt = currentPostStatsData.views ? currentPostStatsData.views.length : 0;
          const accessCnt = currentPostStatsData.accesses ? currentPostStatsData.accesses.length : 0;
          const likesCnt = currentPostStatsData.likes ? currentPostStatsData.likes.length : 0;
          const convRate = viewsCnt > 0 ? ((accessCnt / viewsCnt) * 100).toFixed(1) + '%' : '0%';

          document.getElementById('postStatsTitle').textContent = '📊 Stats: ' + (data.post_title || ('Post #' + postId));
          document.getElementById('postStatViewsCnt').textContent = viewsCnt;
          document.getElementById('postStatAccessCnt').textContent = accessCnt;
          document.getElementById('postStatConversionCnt').textContent = convRate;
          document.getElementById('postStatLikesCnt').textContent = likesCnt;
          renderPostStatLogs(currentPostStatsActiveTab);
        } else {
          document.getElementById('postStatLogsList').innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Failed to load stats: ' + escapeHtml(data.error || 'Unknown error') + '</div>';
        }
      } catch (err) {
        document.getElementById('postStatLogsList').innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Network error loading post stats</div>';
      }
    }

    function renderPostStatLogs(tab) {
      currentPostStatsActiveTab = tab;
      const list = document.getElementById('postStatLogsList');
      if (!list) return;

      document.querySelectorAll('.post-stat-tab').forEach(b => {
        if (b.dataset.pstab === tab) {
          b.className = 'btn btn-sm btn-primary post-stat-tab active';
        } else {
          b.className = 'btn btn-sm btn-ghost post-stat-tab';
        }
      });

      if (!currentPostStatsData) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 16px;">No data loaded</div>';
        return;
      }

      list.innerHTML = '';
      if (tab === 'downloads') {
        const logs = currentPostStatsData.accesses || [];
        if (logs.length === 0) {
          list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No downloads / file accesses recorded yet.</div>';
          return;
        }
        logs.forEach(item => {
          const row = document.createElement('div');
          row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 8px; padding: 8px 10px; font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
          const uName = item.username ? ('@' + escapeHtml(item.username)) : (item.first_name ? escapeHtml(item.first_name) : ('User #' + item.user_id));
          const timeStr = item.accessed_at ? formatISTDateTime(item.accessed_at) : '';
          row.innerHTML = '<div>' +
            '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<strong style="color: #4ade80;">📥 ' + escapeHtml(item.item_name || 'Resource') + '</strong>' +
              '<span style="font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; background: rgba(34, 197, 94, 0.2); color: #4ade80;">Downloaded</span>' +
            '</div>' +
            '<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">' + uName + ' • ID: <code>' + item.user_id + '</code></div>' +
          '</div>' +
          '<div style="font-size: 0.7rem; color: var(--text-muted); text-align: right;">' + timeStr + '</div>';
          list.appendChild(row);
        });
      } else if (tab === 'views') {
        const logs = currentPostStatsData.views || [];
        if (logs.length === 0) {
          list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No views recorded yet.</div>';
          return;
        }
        const downloadedUserIds = new Set((currentPostStatsData.accesses || []).map(a => String(a.user_id)));
        logs.forEach(item => {
          const row = document.createElement('div');
          const hasDownloaded = downloadedUserIds.has(String(item.user_id));
          const actionBadge = hasDownloaded
            ? '<span style="font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4);">✅ Downloaded</span>'
            : '<span style="font-size: 0.65rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3);">👁️ Viewed Only</span>';

          row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid ' + (hasDownloaded ? 'rgba(34, 197, 94, 0.3)' : 'var(--card-border)') + '; border-radius: 8px; padding: 8px 10px; font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
          const uName = item.username ? ('@' + escapeHtml(item.username)) : (item.first_name ? escapeHtml(item.first_name) : ('User #' + item.user_id));
          const timeStr = item.viewed_at ? formatISTDateTime(item.viewed_at) : '';
          row.innerHTML = '<div>' +
            '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<strong style="color: #ffffff;">👁️ ' + uName + '</strong>' +
              actionBadge +
            '</div>' +
            '<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">ID: <code>' + item.user_id + '</code></div>' +
          '</div>' +
          '<div style="font-size: 0.7rem; color: var(--text-muted); text-align: right;">' + timeStr + '</div>';
          list.appendChild(row);
        });
      } else if (tab === 'likes') {
        const logs = currentPostStatsData.likes || [];
        if (logs.length === 0) {
          list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No likes recorded yet.</div>';
          return;
        }
        logs.forEach(item => {
          const row = document.createElement('div');
          row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 8px 10px; font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
          const uName = item.username ? ('@' + escapeHtml(item.username)) : (item.first_name ? escapeHtml(item.first_name) : ('User #' + item.user_id));
          const timeStr = item.created_at ? formatISTDateTime(item.created_at) : '';
          row.innerHTML = '<div>' +
            '<div><strong style="color: #f43f5e;">❤️ ' + uName + '</strong></div>' +
            '<div style="font-size: 0.7rem; color: var(--text-muted);">ID: <code>' + item.user_id + '</code></div>' +
          '</div>' +
          '<div style="font-size: 0.7rem; color: var(--text-muted); text-align: right;">' + timeStr + '</div>';
          list.appendChild(row);
        });
      }
    }

    // User Activity Inspector Modal
    let currentUserActivityData = null;
    let currentUserActivityTab = 'timeline';

    async function openUserActivityModal(userId, displayName, username) {
      const modal = document.getElementById('userActivityModal');
      if (!modal) return;
      currentUserActivityTab = 'timeline';
      document.getElementById('userActivityTitle').textContent = '🔍 Activity: ' + displayName;
      const headerCard = document.getElementById('userActivityHeaderCard');
      headerCard.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between;">' +
        '<div><strong style="color: #ffffff; font-size: 0.95rem;">' + escapeHtml(displayName) + '</strong>' +
        '<div style="font-size: 0.74rem; color: var(--text-muted);">' + (username ? ('@' + escapeHtml(username)) : 'No username') + ' • ID: <code>' + userId + '</code></div></div>' +
        '<div style="font-size: 0.75rem; color: #fbbf24;">Loading activity profile...</div></div>';

      document.getElementById('userActivityContentList').innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">⏳ Loading user activity timeline...</div>';
      modal.classList.add('active');

      try {
        const res = await fetch('/api/admin/users/' + userId + '/activity?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          currentUserActivityData = data;
          const u = data.user || {};
          const isBlocked = Boolean(u.is_blocked);
          const isOnline = Boolean(u.is_online);
          const lastSeenText = isOnline ? '🟢 ACTIVE IN MINI APP NOW' : (u.last_activity ? ('Last active: ' + formatRelativeTime(u.last_activity) + ' (' + formatISTTime(u.last_activity) + ')') : ('Joined: ' + (u.first_seen ? formatISTDate(u.first_seen) : (u.created_at ? formatISTDate(u.created_at) : ''))));

          let blockBannerHtml = '';
          if (isBlocked) {
            const reasonAction = data.last_action_before_block || data.last_action;
            const reasonTitle = reasonAction ? (reasonAction.title || reasonAction.description || 'Interacted with bot') : 'Unknown';
            const reasonSource = reasonAction ? (reasonAction.source_name || '🤖 Bot') : '🤖 Bot';
            blockBannerHtml = '<div style="margin-top: 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 9px 12px; font-size: 0.76rem; color: #fca5a5;">' +
              '<div style="font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 6px;">' +
                '<span>⚠️</span> <span>User Stopped / Blocked Bot!</span>' +
              '</div>' +
              '<div style="margin-top: 4px; color: #fecaca; line-height: 1.35;">' +
                '<strong>Exact Action Before Blocking:</strong> ' + escapeHtml(reasonTitle) + ' ' +
                '<span style="font-size: 0.68rem; padding: 1px 5px; border-radius: 4px; background: rgba(255,255,255,0.1);">' + escapeHtml(reasonSource) + '</span>' +
              '</div>' +
            '</div>';
          }

          headerCard.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
            '<div>' +
              '<strong style="color: #ffffff; font-size: 0.95rem;">' + escapeHtml(displayName) + '</strong>' +
              '<div style="font-size: 0.74rem; color: var(--text-muted);">' + (u.username ? ('@' + escapeHtml(u.username)) : 'No username') + ' • ID: <code>' + userId + '</code></div>' +
              '<div style="font-size: 0.73rem; color: ' + (isOnline ? '#38bdf8; font-weight: 600;' : 'var(--text-muted);') + ' margin-top: 3px;">' + lastSeenText + '</div>' +
            '</div>' +
            '<div style="text-align: right;">' +
              '<span style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; ' + (isBlocked ? 'background: rgba(239, 68, 68, 0.2); color: #f87171;' : (isOnline ? 'background: rgba(56, 189, 248, 0.2); color: #38bdf8;' : 'background: rgba(34, 197, 94, 0.2); color: #4ade80;')) + '">' +
                (isBlocked ? '🚫 BLOCKED BOT' : (isOnline ? '🟢 ONLINE' : 'ACTIVE')) +
              '</span>' +
              '<div style="font-size: 0.74rem; color: #fbbf24; margin-top: 4px;">🪙 ' + (u.points || 0) + ' pts</div>' +
            '</div>' +
          '</div>' + blockBannerHtml;

          renderUserActivityContent('timeline');
        } else {
          document.getElementById('userActivityContentList').innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Failed to load user activity: ' + escapeHtml(data.error || 'Unknown error') + '</div>';
        }
      } catch (err) {
        console.error('Error in openUserActivityModal:', err);
        document.getElementById('userActivityContentList').innerHTML = '<div style="color: #f87171; text-align: center; padding: 12px;">Failed to load user activity: ' + escapeHtml(err.message || 'Network error') + '</div>';
      }
    }

    function formatActivityActionTitle(title) {
      if (!title) return 'Activity recorded';
      let t = String(title).trim();

      // Clean nested titles like "Post #69 (Post #64 (16.9 MB))"
      const nestedView = t.match(/^Viewed Post:\s*Post\s*#\d+\s*\((Post\s*#\d+.*?)\)$/i);
      if (nestedView && nestedView[1]) {
        return 'Viewed Post: ' + nestedView[1];
      }
      const nestedDl = t.match(/^Downloaded:\s*Post\s*#\d+\s*\((Post\s*#\d+.*?)\)$/i);
      if (nestedDl && nestedDl[1]) {
        return 'Downloaded: ' + nestedDl[1];
      }
      const rawNested = t.match(/^Post\s*#\d+\s*\((Post\s*#\d+.*?)\)$/i);
      if (rawNested && rawNested[1]) {
        return rawNested[1];
      }

      // Convert button callbacks into plain friendly English
      if (t.startsWith('[Button] user_view_post_')) {
        const pid = t.replace('[Button] user_view_post_', '').trim();
        return '🔘 Clicked: "View Post #' + pid + '"';
      }
      if (t.startsWith('[Button] user_browse_page_')) {
        const page = t.replace('[Button] user_browse_page_', '').trim();
        return '🔘 Clicked: "Browse Page ' + page + '"';
      }
      if (t.startsWith('[Button] bot_get_post_')) {
        const pid = t.replace('[Button] bot_get_post_', '').trim();
        return '📥 Clicked: "Download Post #' + pid + '"';
      }
      if (t.startsWith('[Button] bot_like_')) {
        const pid = t.replace('[Button] bot_like_', '').trim();
        return '❤️ Clicked: "Like Post #' + pid + '"';
      }
      if (t.startsWith('[Button] bot_feed_page_')) {
        const page = t.replace('[Button] bot_feed_page_', '').trim();
        return '🔘 Clicked: "Next/Prev Feed Page ' + page + '"';
      }
      if (t.startsWith('[Button]')) {
        return '🔘 Clicked: "' + t.replace('[Button]', '').trim() + '"';
      }
      if (t.startsWith('/start post_')) {
        const pid = t.replace('/start post_', '').trim();
        return '🔗 Opened Direct Post Link: Post #' + pid;
      }
      if (t === '/start') {
        return '🟢 Started / Opened Telegram Bot';
      }
      return t;
    }

    function renderUserActivityContent(tab) {
      currentUserActivityTab = tab || 'timeline';
      const list = document.getElementById('userActivityContentList');
      if (!list) return;

      document.querySelectorAll('.user-act-tab').forEach(b => {
        if (b.dataset.uact === currentUserActivityTab) {
          b.className = 'btn btn-sm btn-primary user-act-tab active';
        } else {
          b.className = 'btn btn-sm btn-ghost user-act-tab';
        }
      });

      if (!currentUserActivityData) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 16px;">No activity loaded</div>';
        return;
      }

      const allTimeline = currentUserActivityData.timeline || [];
      const allDownloads = currentUserActivityData.downloads || [];
      const allViews = currentUserActivityData.views || [];
      const allMsgs = currentUserActivityData.messages || [];

      // Update badge counts on modal subtabs dynamically
      const tabTimeline = document.querySelector('[data-uact="timeline"]');
      if (tabTimeline) tabTimeline.innerHTML = '📜 All Actions <span style="background: rgba(255,255,255,0.18); padding: 1px 6px; border-radius: 10px; font-size: 0.68rem; margin-left: 3px;">' + allTimeline.length + '</span>';

      const tabDownloads = document.querySelector('[data-uact="downloads"]');
      if (tabDownloads) tabDownloads.innerHTML = '📥 Files Got <span style="background: rgba(34,197,94,0.25); color: #4ade80; padding: 1px 6px; border-radius: 10px; font-size: 0.68rem; margin-left: 3px;">' + allDownloads.length + '</span>';

      const tabViews = document.querySelector('[data-uact="views"]');
      if (tabViews) tabViews.innerHTML = '👁️ Posts Watched <span style="background: rgba(56,189,248,0.25); color: #38bdf8; padding: 1px 6px; border-radius: 10px; font-size: 0.68rem; margin-left: 3px;">' + allViews.length + '</span>';

      const tabMsgs = document.querySelector('[data-uact="messages"]');
      if (tabMsgs) tabMsgs.innerHTML = '💬 Bot Messages <span style="background: rgba(192,132,252,0.25); color: #c084fc; padding: 1px 6px; border-radius: 10px; font-size: 0.68rem; margin-left: 3px;">' + allMsgs.length + '</span>';

      // Summary strip
      let summaryStrip = '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 0.76rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
        '<div>📥 <strong style="color: #4ade80;">' + allDownloads.length + '</strong> Downloads</div>' +
        '<div>👁️ <strong style="color: #38bdf8;">' + allViews.length + '</strong> Views</div>' +
        '<div>💬 <strong style="color: #c084fc;">' + allMsgs.length + '</strong> Messages</div>' +
        '<div>📜 <strong style="color: #fbbf24;">' + allTimeline.length + '</strong> Total Events</div>' +
      '</div>';

      list.innerHTML = summaryStrip;

      if (currentUserActivityTab === 'timeline') {
        if (allTimeline.length === 0) {
          list.innerHTML += '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No actions recorded yet for this user.</div>';
          return;
        }

        const triggerAction = currentUserActivityData.last_action_before_block;

        allTimeline.forEach(item => {
          const row = document.createElement('div');
          const isApp = item.source === 'app' || item.type === 'app';
          const isBlock = item.type === 'block';
          const isTrigger = currentUserActivityData.user?.is_blocked && triggerAction && (item.date === triggerAction.date || item.title === triggerAction.title);

          const borderClr = isBlock ? 'rgba(239, 68, 68, 0.5)' : (isTrigger ? 'rgba(245, 158, 11, 0.5)' : 'var(--card-border)');
          row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid ' + borderClr + '; border-radius: 8px; padding: 9px 12px; font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px;';
          
          const timeStr = item.date ? formatRelativeTime(item.date) + ' (' + formatISTTime(item.date) + ')' : '';
          const sourceBadge = isApp
            ? '<span style="font-size: 0.65rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">📱 Mini App</span>'
            : '<span style="font-size: 0.65rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">🤖 Telegram Bot</span>';

          const triggerBadge = isTrigger ? '<span style="font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);">⚠️ Action before block</span>' : '';

          const displayActionTitle = formatActivityActionTitle(item.title);

          row.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 0.7rem; color: var(--text-muted); flex-wrap: wrap;">' +
            '<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">' +
              '<span>' + (item.icon || '📌') + '</span>' +
              '<span style="font-weight: 600; color: #cbd5e1;">' + escapeHtml(item.description || item.type) + '</span>' +
              sourceBadge +
              triggerBadge +
            '</div>' +
            '<span>' + timeStr + '</span>' +
          '</div>' +
          '<div style="color: ' + (isBlock ? '#f87171;' : '#ffffff;') + ' font-weight: 500; word-break: break-word; margin-top: 2px;">' + escapeHtml(displayActionTitle) + '</div>';
          list.appendChild(row);
        });
      } else if (currentUserActivityTab === 'messages') {
        if (allMsgs.length === 0) {
          list.innerHTML += '<div style="text-align: center; color: var(--text-muted); padding: 16px;">No messages sent to bot recorded yet.</div>';
          return;
        }
        allMsgs.forEach(m => {
          const row = document.createElement('div');
          row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 8px 10px; font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px;';
          const timeStr = m.date ? formatRelativeTime(m.date) + ' (' + formatISTTime(m.date) + ')' : '';
          const isApp = m.source === 'app' || m.type === 'app';
          const sourceBadge = isApp
            ? '<span style="font-size: 0.65rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;">📱 Mini App</span>'
            : '<span style="font-size: 0.65rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(168, 85, 247, 0.15); color: #c084fc;">🤖 Bot</span>';

          const displayMsg = formatActivityActionTitle(m.text);

          row.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted);">' +
            '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<span>' + (m.type === 'callback' ? '🔘 Button Click' : (m.type === 'app' ? '📱 App Action' : '💬 User Message')) + '</span>' +
              sourceBadge +
            '</div>' +
            '<span>' + timeStr + '</span>' +
          '</div>' +
          '<div style="color: #ffffff; font-weight: 500; word-break: break-word;">' + escapeHtml(displayMsg) + '</div>';
          list.appendChild(row);
        });
      } else if (currentUserActivityTab === 'downloads') {
        if (allDownloads.length === 0) {
          list.innerHTML += '<div style="text-align: center; color: var(--text-muted); padding: 16px;">No post files accessed / downloaded yet.</div>';
          return;
        }
        allDownloads.forEach(d => {
          const row = document.createElement('div');
          row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 8px 10px; font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;';
          const timeStr = d.accessed_at ? formatRelativeTime(d.accessed_at) + ' (' + formatISTTime(d.accessed_at) + ')' : '';
          const postTitle = formatActivityActionTitle(d.posts?.title ? escapeHtml(d.posts.title) : ('Post #' + d.post_id));
          const itemName = formatActivityActionTitle(d.item_name || 'Resource');
          const isStreamWatch = (d.item_name && (d.item_name.includes('Watched') || d.item_name.startsWith('🎬')));
          const badgeHtml = isStreamWatch
            ? '<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;">🎬 Video Stream</span>'
            : '<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: rgba(168, 85, 247, 0.15); color: #c084fc;">🤖 Bot Delivery</span>';

          row.innerHTML = '<div>' +
            '<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">' +
              '<strong style="color: ' + (isStreamWatch ? '#38bdf8' : '#4ade80') + ';">' + (isStreamWatch ? '' : '📥 ') + escapeHtml(itemName) + '</strong>' +
              badgeHtml +
            '</div>' +
            '<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">From Post: ' + postTitle + '</div>' +
          '</div>' +
          '<div style="font-size: 0.7rem; color: var(--text-muted); text-align: right; flex-shrink: 0;">' + timeStr + '</div>';
          list.appendChild(row);
        });
      } else if (currentUserActivityTab === 'views') {
        if (allViews.length === 0) {
          list.innerHTML += '<div style="text-align: center; color: var(--text-muted); padding: 16px;">No posts watched / viewed yet.</div>';
          return;
        }
        allViews.forEach(v => {
          const row = document.createElement('div');
          row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 8px 10px; font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;';
          const timeStr = v.viewed_at ? formatRelativeTime(v.viewed_at) + ' (' + formatISTTime(v.viewed_at) + ')' : '';
          const postTitle = formatActivityActionTitle(v.posts?.title ? escapeHtml(v.posts.title) : ('Post #' + v.post_id));

          row.innerHTML = '<div>' +
            '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<strong style="color: #38bdf8;">👁️ ' + postTitle + '</strong>' +
              '<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;">📱 Mini App</span>' +
            '</div>' +
            '<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Post ID: <code>' + v.post_id + '</code></div>' +
          '</div>' +
          '<div style="font-size: 0.7rem; color: var(--text-muted); text-align: right;">' + timeStr + '</div>';
          list.appendChild(row);
        });
      }
    }

    // Event Handlers
    function setupEventListeners() {
      // Admin Mode Switcher
      document.getElementById('tabModePublic')?.addEventListener('click', () => {
        document.getElementById('tabModePublic').classList.add('active');
        document.getElementById('tabModeAdmin').classList.remove('active');
        document.getElementById('viewPublicFeed').style.display = 'block';
        document.getElementById('viewAdminHub').style.display = 'none';
      });

      document.getElementById('tabModeAdmin')?.addEventListener('click', () => {
        document.getElementById('tabModeAdmin').classList.add('active');
        document.getElementById('tabModePublic').classList.remove('active');
        document.getElementById('viewPublicFeed').style.display = 'none';
        document.getElementById('viewAdminHub').style.display = 'block';
        loadAdminPosts();
      });

      document.getElementById('btnAdminQuick')?.addEventListener('click', () => {
        document.getElementById('tabModeAdmin').click();
      });

      // Admin Subtabs
      document.getElementById('adminSubtabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.admin-subtab');
        if (!btn) return;
        document.querySelectorAll('.admin-subtab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const atab = btn.dataset.atab;

        document.getElementById('adminTabPosts').style.display = atab === 'posts' ? 'block' : 'none';
        document.getElementById('adminTabUsers').style.display = atab === 'users' ? 'block' : 'none';
        document.getElementById('adminTabComments').style.display = atab === 'comments' ? 'block' : 'none';
        document.getElementById('adminTabShorteners').style.display = atab === 'shorteners' ? 'block' : 'none';
        document.getElementById('adminTabSettings').style.display = atab === 'settings' ? 'block' : 'none';
        document.getElementById('adminTabChannels').style.display = atab === 'channels' ? 'block' : 'none';
        document.getElementById('adminTabBanner').style.display = atab === 'banner' ? 'block' : 'none';
        document.getElementById('adminTabBroadcast').style.display = atab === 'broadcast' ? 'block' : 'none';
        document.getElementById('adminTabAnalytics').style.display = atab === 'analytics' ? 'block' : 'none';

        if (atab === 'posts') loadAdminPosts();
        if (atab === 'users') loadAdminUsers();
        if (atab === 'comments') loadAdminComments();
        if (atab === 'shorteners') {
          loadShorteners();
          generateNewDestLink();
        }
        if (atab === 'channels') loadChannels();
        if (atab === 'analytics') loadAdminAnalytics();
        if (atab === 'banner') {
          document.getElementById('setBannerToggle').checked = Boolean(globalSettings.banner_enabled);
          document.getElementById('setBannerTitle').value = globalSettings.banner_title || '';
          document.getElementById('setBannerText').value = globalSettings.banner_text || '';
          document.getElementById('setBannerImg').value = globalSettings.banner_image || '';
          document.getElementById('setBannerLink').value = globalSettings.banner_link || '';
        }
        if (atab === 'settings') {
          document.getElementById('setShortenerToggle').checked = Boolean(globalSettings.shortener_enabled);
          document.getElementById('setPointsPerVerify').value = globalSettings.points_per_verify || 5;
          document.getElementById('setPointsPerPost').value = globalSettings.points_per_post ?? 1;
          document.getElementById('setAutoDeleteMinutes').value = globalSettings.auto_delete_minutes ?? 30;
          document.getElementById('setReferralToggle').checked = Boolean(globalSettings.referral_enabled);
          document.getElementById('setReferralPointsVal').value = globalSettings.referral_points || 10;
          document.getElementById('setForceJoinToggle').checked = Boolean(globalSettings.force_join_enabled);
          document.getElementById('setRequireBotStartToggle').checked = Boolean(globalSettings.require_bot_start_enabled);
          document.getElementById('setRequireBotStartMsg').value = globalSettings.require_bot_start_message || '';
          document.getElementById('setRequireBotStartLink').value = globalSettings.require_bot_start_link || '';

          // Stream & Adsgram Settings
          if (document.getElementById('setStreamToggle')) document.getElementById('setStreamToggle').checked = globalSettings.stream_enabled !== false;
          if (document.getElementById('setRenderStreamUrl')) document.getElementById('setRenderStreamUrl').value = globalSettings.render_stream_url || '';
          if (document.getElementById('setAdsgramToggle')) document.getElementById('setAdsgramToggle').checked = Boolean(globalSettings.adsgram_enabled);
          if (document.getElementById('setAdsgramRewardedId')) document.getElementById('setAdsgramRewardedId').value = globalSettings.adsgram_rewarded_block_id || '';
          if (document.getElementById('setAdsgramInterstitialId')) document.getElementById('setAdsgramInterstitialId').value = globalSettings.adsgram_interstitial_block_id || '';
          if (document.getElementById('setAdsgramPrerollToggle')) document.getElementById('setAdsgramPrerollToggle').checked = Boolean(globalSettings.adsgram_preroll_enabled);
        }
      });

      // Admin Comments Search, Filters & Action Listeners
      document.getElementById('adminCommentsSearchInput')?.addEventListener('input', renderAdminComments);
      document.getElementById('adminCommentsFilterSelect')?.addEventListener('change', renderAdminComments);
      document.getElementById('btnRefreshAdminComments')?.addEventListener('click', loadAdminComments);

      document.getElementById('adminCommentsList')?.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('[data-cact="toggle-hide"]');
        if (toggleBtn) {
          const commentId = toggleBtn.dataset.id;
          const isCurrentlyHidden = toggleBtn.dataset.hidden === '1';
          const nextAction = isCurrentlyHidden ? 'unhide' : 'hide';
          try {
            const res = await fetch('/api/admin/comments/' + commentId + '/moderate?user_id=' + currentUserId, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: nextAction, user_id: currentUserId })
            });
            const data = await res.json();
            if (data.success) {
              showToast(isCurrentlyHidden ? '👁️ Comment unhidden' : '🙈 Comment hidden');
              const item = cachedAdminComments.find(c => String(c.id) === String(commentId));
              if (item) item.is_hidden = !isCurrentlyHidden;
              renderAdminComments();
            } else {
              showToast(data.error || 'Failed to moderate comment');
            }
          } catch (err) {
            showToast('Error moderating comment');
          }
          return;
        }

        const delBtn = e.target.closest('[data-cact="delete"]');
        if (delBtn) {
          const commentId = delBtn.dataset.id;
          if (!confirm('⚠️ Permanently delete this comment? This cannot be undone.')) return;
          try {
            const res = await fetch('/api/admin/comments/' + commentId + '?user_id=' + currentUserId, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'delete', user_id: currentUserId })
            });
            const data = await res.json();
            if (data.success) {
              showToast('🗑️ Comment permanently deleted');
              cachedAdminComments = cachedAdminComments.filter(c => String(c.id) !== String(commentId));
              renderAdminComments();
            } else {
              showToast(data.error || 'Failed to delete comment');
            }
          } catch (err) {
            showToast('Error deleting comment');
          }
          return;
        }
      });

      // Admin Users Search, Filters & Chat Action
      document.getElementById('adminUsersSearchInput')?.addEventListener('input', renderAdminUsers);
      document.getElementById('adminUsersFilterSelect')?.addEventListener('change', renderAdminUsers);
      document.getElementById('btnRefreshAdminUsers')?.addEventListener('click', loadAdminUsers);

      // Open User Chat / Contact Options or Activity Inspector
      document.getElementById('adminUsersList')?.addEventListener('click', (e) => {
        const actBtn = e.target.closest('.btn-open-user-activity');
        if (actBtn) {
          const uid = actBtn.dataset.uid;
          const name = actBtn.dataset.name || ('User #' + uid);
          const username = actBtn.dataset.username || '';
          openUserActivityModal(uid, name, username);
          return;
        }

        const btn = e.target.closest('.btn-open-user-chat');
        if (!btn) return;
        const uid = btn.dataset.uid;
        const username = btn.dataset.username;
        const name = btn.dataset.name || ('User #' + uid);

        if (username && username !== 'none' && username.trim() !== '') {
          const cleanUser = username.replace(/^@/, '');
          const tgUrl = 'https://t.me/' + cleanUser;
          if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(tgUrl);
          } else {
            window.open(tgUrl, '_blank');
          }
        } else {
          // No username set! Open contact options modal
          selectedUserForAction = { id: uid, name: name };
          document.getElementById('userActionModalTitle').textContent = '👤 ' + name;
          document.getElementById('userActionUidDisplay').textContent = uid;
          document.getElementById('userActionModalNotice').textContent = 'This user does not have a public @username set in Telegram.';
          document.getElementById('userActionDmText').value = '';
          document.getElementById('userActionModal').classList.add('active');
        }
      });

      // User Activity Modal Listeners
      document.getElementById('btnUserActivityClose')?.addEventListener('click', () => {
        document.getElementById('userActivityModal')?.classList.remove('active');
      });

      document.getElementById('userActivitySubtabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.user-act-tab');
        if (!btn) return;
        renderUserActivityContent(btn.dataset.uact);
      });

      // User Action Modal Handlers
      document.getElementById('btnUserActionOpenDirect')?.addEventListener('click', () => {
        if (!selectedUserForAction) return;
        const uid = selectedUserForAction.id;
        window.location.href = 'tg://openmessage?user_id=' + uid;
      });

      document.getElementById('btnUserActionOpenProfile')?.addEventListener('click', () => {
        if (!selectedUserForAction) return;
        const uid = selectedUserForAction.id;
        window.location.href = 'tg://user?id=' + uid;
      });

      document.getElementById('btnUserActionCopyId')?.addEventListener('click', () => {
        if (!selectedUserForAction) return;
        navigator.clipboard?.writeText(String(selectedUserForAction.id));
        showToast('📋 User ID copied to clipboard!');
      });

      document.getElementById('btnUserActionClose')?.addEventListener('click', () => {
        document.getElementById('userActionModal').classList.remove('active');
      });

      document.getElementById('btnUserActionSendDm')?.addEventListener('click', async () => {
        if (!selectedUserForAction) return;
        const text = document.getElementById('userActionDmText').value.trim();
        if (!text) {
          showToast('⚠️ Please enter a message');
          return;
        }

        const btn = document.getElementById('btnUserActionSendDm');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
          const res = await fetch('/api/admin/users/' + selectedUserForAction.id + '/message?user_id=' + currentUserId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to send message');
          }
          showToast('✅ Message sent to user!');
          document.getElementById('userActionDmText').value = '';
          document.getElementById('userActionModal').classList.remove('active');
        } catch (e) {
          showToast('⚠️ ' + e.message);
        } finally {
          btn.disabled = false;
          btn.textContent = '📤 Send Message';
        }
      });

      // Open Create Post Modal
      document.getElementById('btnOpenCreatePost')?.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/admin/posts/next-info?user_id=' + currentUserId);
          const data = await res.json();
          basePostNumber = data.next_number || 1;
          document.getElementById('createPostTitle').value = data.default_title || ('Post #' + basePostNumber);
        } catch (e) {
          basePostNumber = (allPosts.length || 0) + 1;
          document.getElementById('createPostTitle').value = 'Post #' + basePostNumber;
        }
        document.getElementById('createPostSize').value = '';
        document.getElementById('createPostImage').value = '';
        document.getElementById('createPostLink').value = '';
        document.getElementById('createPostLinkLabel').value = '🔗 Open File / Folder';
        document.getElementById('createPostTags').value = '#file #' + basePostNumber;
        document.getElementById('createPostStatus').value = 'published';
        document.getElementById('createPostPromoted').checked = false;
        document.getElementById('createScheduledGroup').style.display = 'none';

        document.getElementById('createPostModal').classList.add('active');
      });

      // Auto-format title when typing size
      document.getElementById('createPostSize')?.addEventListener('input', (e) => {
        const size = e.target.value.trim();
        const curTitle = document.getElementById('createPostTitle').value;
        if (/^Post\s*#\d+/i.test(curTitle) || !curTitle.trim()) {
          document.getElementById('createPostTitle').value = size ? ('Post #' + basePostNumber + ' (' + size + ')') : ('Post #' + basePostNumber);
        }
      });

      // Toggle scheduled date in create
      document.getElementById('createPostStatus')?.addEventListener('change', (e) => {
        document.getElementById('createScheduledGroup').style.display = e.target.value === 'scheduled' ? 'block' : 'none';
      });

      // Close Create Modal
      document.getElementById('btnCreatePostClose')?.addEventListener('click', () => {
        document.getElementById('createPostModal').classList.remove('active');
      });
      document.getElementById('btnCancelCreatePost')?.addEventListener('click', () => {
        document.getElementById('createPostModal').classList.remove('active');
      });

      // Submit Create Post Form
      document.getElementById('createPostForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitCreatePost');
        btn.disabled = true;
        btn.textContent = 'Publishing...';

        try {
          const payload = {
            title: document.getElementById('createPostTitle').value.trim(),
            size: document.getElementById('createPostSize').value.trim(),
            category: 'All',
            preview_image: document.getElementById('createPostImage').value.trim() || null,
            direct_link: document.getElementById('createPostLink').value.trim() || null,
            direct_link_title: document.getElementById('createPostLinkLabel').value.trim() || null,
            tags: document.getElementById('createPostTags').value.trim() || '',
            status: document.getElementById('createPostStatus').value,
            scheduled_at: document.getElementById('createPostScheduledAt').value || null,
            is_promoted: document.getElementById('createPostPromoted').checked
          };

          const res = await fetch('/api/admin/posts?user_id=' + currentUserId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to create post');
          }

          document.getElementById('createPostModal').classList.remove('active');
          showToast('🚀 Post published successfully!');
          if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
          }
          await loadPosts();
          await loadAdminPosts();
        } catch (err) {
          showToast('⚠️ ' + err.message);
          if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
          }
        } finally {
          btn.disabled = false;
          btn.textContent = '🚀 Publish Post';
        }
      });

      // Admin Posts Grid: Edit and Delete Actions
      document.getElementById('adminPostsGrid')?.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('[data-aact="edit"]');
        if (editBtn) {
          const postId = editBtn.dataset.id;
          try {
            const res = await fetch('/api/posts/' + postId + '?user_id=' + currentUserId);
            const data = await res.json();
            if (data.success && data.post) {
              const post = data.post;
              document.getElementById('editPostId').value = post.id;
              document.getElementById('editPostTitle').value = post.title || '';
              document.getElementById('editPostTags').value = post.tags || '';
              document.getElementById('editPostImage').value = post.preview_image || '';
              document.getElementById('editPostLink').value = post.direct_link || '';
              document.getElementById('editPostLinkLabel').value = post.direct_link_title || '';
              document.getElementById('editPostStatus').value = post.status || 'published';
              document.getElementById('editPostPromoted').checked = Boolean(post.is_promoted);
              if (post.scheduled_at) {
                document.getElementById('editPostScheduledAt').value = post.scheduled_at.substring(0, 16);
              } else {
                document.getElementById('editPostScheduledAt').value = '';
              }
              document.getElementById('editScheduledGroup').style.display = post.status === 'scheduled' ? 'block' : 'none';
              document.getElementById('editPostModal').classList.add('active');
            } else {
              showToast('Post details not found');
            }
          } catch (err) {
            showToast('Failed to load post for editing');
          }
          return;
        }

        const linksBtn = e.target.closest('[data-aact="links"]');
        if (linksBtn) {
          const postId = linksBtn.dataset.id;
          const postTitle = linksBtn.dataset.title || ('Post #' + postId);
          openPostLinksModal(postId, postTitle);
          return;
        }

        const statsBtn = e.target.closest('[data-aact="stats"]');
        if (statsBtn) {
          const postId = statsBtn.dataset.id;
          openPostStatsModal(postId);
          return;
        }

        const delBtn = e.target.closest('[data-aact="del"]');
        if (delBtn) {
          const postId = delBtn.dataset.id;
          if (!confirm('⚠️ Are you sure you want to permanently delete this post? This cannot be undone.')) return;
          try {
            const res = await fetch('/api/admin/posts/' + postId + '?user_id=' + currentUserId, {
              method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
              showToast('🗑️ Post deleted successfully!');
              loadAdminPosts();
              loadPosts();
            } else {
              showToast(data.error || 'Failed to delete post');
            }
          } catch (err) {
            showToast('Error deleting post');
          }
          return;
        }
      });

      // Post Stats Modal Listeners
      document.getElementById('btnPostStatsClose')?.addEventListener('click', () => {
        document.getElementById('postStatsModal')?.classList.remove('active');
      });

      document.getElementById('postStatSubtabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.post-stat-tab');
        if (!btn) return;
        renderPostStatLogs(btn.dataset.pstab);
      });

      // Status selector change inside Edit Post Modal
      document.getElementById('editPostStatus')?.addEventListener('change', (e) => {
        document.getElementById('editScheduledGroup').style.display = e.target.value === 'scheduled' ? 'block' : 'none';
      });

      // Close Edit Post Modal
      document.getElementById('btnEditPostClose')?.addEventListener('click', () => {
        document.getElementById('editPostModal').classList.remove('active');
      });

      // Submit Edit Post Form
      document.getElementById('editPostForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postId = document.getElementById('editPostId').value;
        const payload = {
          user_id: currentUserId,
          title: document.getElementById('editPostTitle').value.trim(),
          category: 'All',
          tags: document.getElementById('editPostTags').value.trim(),
          preview_image: document.getElementById('editPostImage').value.trim(),
          direct_link: document.getElementById('editPostLink').value.trim(),
          direct_link_title: document.getElementById('editPostLinkLabel').value.trim(),
          status: document.getElementById('editPostStatus').value,
          is_promoted: document.getElementById('editPostPromoted').checked,
          scheduled_at: document.getElementById('editPostScheduledAt').value || null
        };

        try {
          const res = await fetch('/api/admin/posts/' + postId + '/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            document.getElementById('editPostModal').classList.remove('active');
            showToast('✅ Post updated successfully!');
            loadAdminPosts();
            loadPosts();
          } else {
            showToast(data.error || 'Failed to update post');
          }
        } catch (err) {
          showToast('Error saving post updates');
        }
      });

      // Delete Button inside Edit Modal
      document.getElementById('btnDeleteFromEdit')?.addEventListener('click', async () => {
        const postId = document.getElementById('editPostId').value;
        if (!postId) return;
        if (!confirm('⚠️ Are you sure you want to permanently delete this post?')) return;

        try {
          const res = await fetch('/api/admin/posts/' + postId + '?user_id=' + currentUserId, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            document.getElementById('editPostModal').classList.remove('active');
            showToast('🗑️ Post deleted successfully!');
            loadAdminPosts();
            loadPosts();
          } else {
            showToast(data.error || 'Failed to delete post');
          }
        } catch (err) {
          showToast('Error deleting post');
        }
      });

      // Open Post Links Modal Helper
      function openPostLinksModal(postId, postTitle = '') {
        const botUrl = 'https://t.me/' + botUsername + '?start=post_' + postId;
        const appUrl = 'https://t.me/' + botUsername + '/app?startapp=post_' + postId;
        const webUrl = window.location.origin + '?post_id=' + postId;

        const titleEl = document.getElementById('postLinksModalTitle');
        if (titleEl) titleEl.textContent = '🔗 Links: ' + (postTitle || ('Post #' + postId));

        const botInput = document.getElementById('postLinkBotInput');
        if (botInput) botInput.value = botUrl;

        const appInput = document.getElementById('postLinkAppInput');
        if (appInput) appInput.value = appUrl;

        const webInput = document.getElementById('postLinkWebInput');
        if (webInput) webInput.value = webUrl;

        const modal = document.getElementById('postLinksModal');
        if (modal) {
          modal.dataset.currentPostId = postId;
          modal.dataset.currentPostTitle = postTitle || ('Post #' + postId);
          modal.classList.add('active');
        }
      }

      // Trigger Post Broadcast Helper
      async function triggerPostBroadcast(postId, postTitle = '') {
        if (!confirm('📢 Broadcast post "' + (postTitle || '#' + postId) + '" to all active bot users now?')) return;
        showToast('📡 Broadcasting post to all users...');
        try {
          const res = await fetch('/api/admin/posts/' + postId + '/broadcast?user_id=' + currentUserId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: currentUserId })
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ Broadcast sent! Success: ' + data.sent_count + ', Failed: ' + data.failed_count);
          } else {
            showToast('❌ Broadcast error: ' + (data.error || 'Failed'));
          }
        } catch (err) {
          showToast('❌ Broadcast network error');
        }
      }

      // Close Post Links Modal
      document.getElementById('btnPostLinksClose')?.addEventListener('click', () => {
        document.getElementById('postLinksModal')?.classList.remove('active');
      });

      // Copy Bot Link
      document.getElementById('btnCopyBotLink')?.addEventListener('click', () => {
        const input = document.getElementById('postLinkBotInput');
        if (input && input.value) {
          navigator.clipboard.writeText(input.value);
          showToast('🤖 Bot link copied to clipboard!');
        }
      });

      // Copy App Link
      document.getElementById('btnCopyAppLink')?.addEventListener('click', () => {
        const input = document.getElementById('postLinkAppInput');
        if (input && input.value) {
          navigator.clipboard.writeText(input.value);
          showToast('📱 Mini App link copied to clipboard!');
        }
      });

      // Copy Web Link
      document.getElementById('btnCopyWebLink')?.addEventListener('click', () => {
        const input = document.getElementById('postLinkWebInput');
        if (input && input.value) {
          navigator.clipboard.writeText(input.value);
          showToast('🌐 Web link copied to clipboard!');
        }
      });

      // Share Link from Modal to Telegram
      document.getElementById('btnShareTelegramFromModal')?.addEventListener('click', () => {
        const modal = document.getElementById('postLinksModal');
        const postId = modal?.dataset.currentPostId;
        const postTitle = modal?.dataset.currentPostTitle || 'Post';
        const botUrl = 'https://t.me/' + botUsername + '?start=post_' + postId;
        const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(botUrl) + '&text=' + encodeURIComponent('Check out "' + postTitle + '" on @' + botUsername + '!');
        window.open(shareUrl, '_blank');
      });

      // Broadcast from Post Links Modal
      document.getElementById('btnBroadcastFromLinksModal')?.addEventListener('click', () => {
        const modal = document.getElementById('postLinksModal');
        const postId = modal?.dataset.currentPostId;
        const postTitle = modal?.dataset.currentPostTitle;
        if (postId) {
          triggerPostBroadcast(postId, postTitle);
        }
      });

      // Links Button inside Edit Modal
      document.getElementById('btnLinksFromEdit')?.addEventListener('click', () => {
        const postId = document.getElementById('editPostId').value;
        const postTitle = document.getElementById('editPostTitle').value;
        if (postId) {
          openPostLinksModal(postId, postTitle);
        }
      });

      // Broadcast Button inside Edit Modal
      document.getElementById('btnBroadcastFromEdit')?.addEventListener('click', () => {
        const postId = document.getElementById('editPostId').value;
        const postTitle = document.getElementById('editPostTitle').value;
        if (postId) {
          triggerPostBroadcast(postId, postTitle);
        }
      });

      // Destination Link Copy & Refresh in Shortener Form
      document.getElementById('btnCopyDestLink')?.addEventListener('click', () => {
        const link = document.getElementById('addShDestLink').value;
        if (link) {
          navigator.clipboard.writeText(link);
          showToast('📋 Destination link copied!');
        }
      });

      document.getElementById('btnRefreshDestLink')?.addEventListener('click', generateNewDestLink);

      // User Nav Bar (Browse vs Saved vs Earn Points vs Admin Hub)
      document.querySelector('.user-nav-bar')?.addEventListener('click', (e) => {
        const pill = e.target.closest('.nav-pill');
        if (!pill) return;
        const view = pill.dataset.view;
        if (view === 'earn') {
          openPointsModal();
          return;
        }
        if (view === 'admin') {
          document.getElementById('tabModeAdmin')?.click();
          return;
        }
        document.querySelectorAll('.user-nav-bar .nav-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentView = view;
        renderFeed();
      });


      // Segmented Sort Control
      document.getElementById('sortControl')?.addEventListener('click', (e) => {
        const seg = e.target.closest('.sort-segment');
        if (!seg) return;
        document.querySelectorAll('.sort-segment').forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
        currentSort = seg.dataset.sort;
        renderFeed();
      });

      // Search input
      document.getElementById('searchInput')?.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderFeed();
      });

      // Post Card Actions (Like, Save, Comments, Single Open-in-Bot)
      document.getElementById('postsGrid')?.addEventListener('click', async (e) => {
        const likeBtn = e.target.closest('[data-act="like"]');
        if (likeBtn) {
          const postId = likeBtn.dataset.id;
          try {
            const res = await fetch('/api/likes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ post_id: postId, user_id: currentUserId })
            });
            const data = await res.json();
            if (data.success) {
              const p = allPosts.find(x => String(x.id) === String(postId));
              if (p) {
                p.like_count = data.like_count;
                p.is_liked = data.liked;
              }
              renderFeed();
            }
          } catch (err) {
            console.warn('Like error:', err);
          }
          return;
        }

        const saveBtn = e.target.closest('[data-act="save"]');
        if (saveBtn) {
          const postId = saveBtn.dataset.id;
          try {
            const res = await fetch('/api/posts/' + postId + '/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: currentUserId })
            });
            const data = await res.json();
            if (data.success) {
              if (data.saved) {
                savedPostIds.add(Number(postId));
                showToast('🔖 Post saved to bookmarks');
              } else {
                savedPostIds.delete(Number(postId));
                showToast('Removed from saved posts');
              }
              renderFeed();
            }
          } catch (err) {
            console.warn('Save error:', err);
          }
          return;
        }

        const commentBtn = e.target.closest('[data-act="comment"]');
        if (commentBtn) {
          const postId = commentBtn.dataset.id;
          const postTitle = commentBtn.dataset.title;
          openCommentsModal(postId, postTitle);
          return;
        }

        // Open Post Detail Page Click (In-Page View)
        const openPostBtn = e.target.closest('[data-act="open-post"]');
        if (openPostBtn) {
          const postId = openPostBtn.dataset.id;
          openPostDetailPage(postId);
          return;
        }

        // Single "Open in Bot" button click -> Deep link to bot and close Mini App
        const openBotBtn = e.target.closest('[data-act="open-in-bot"]');
        if (openBotBtn) {
          const postId = openBotBtn.dataset.id;
          trackPostDownload(postId, openBotBtn.dataset.title || ('Post #' + postId));
          forwardToTelegram(postId);
          return;
        }
      });

      // =============================================================
      // POST DETAIL PAGE (IN-PAGE VIEW, NOT POPUP)
      // =============================================================
      const postDetailCache = new Map();
      currentDetailPost = null;
      currentPostPictures = [];
      currentPostVideos = [];
      activePhotoIndex = 0;
      activeVideoIndex = 0;

      async function triggerAdsgramAd(blockId) {
        if (!window.Adsgram || !blockId) return true;
        try {
          const AdController = window.Adsgram.init({ blockId: String(blockId) });
          await AdController.show();
          return true;
        } catch (e) {
          console.warn('Adsgram ad notice:', e);
          return true;
        }
      }

      function goBackToFeed() {
        const player = document.getElementById('postActiveVideoPlayer');
        if (player) {
          try {
            player.pause();
            player.removeAttribute('src');
            while (player.firstChild) player.removeChild(player.firstChild);
            player.load();
          } catch (_) {}
        }
        currentDetailPost = null;
        const viewDetail = document.getElementById('viewPostDetail');
        const viewFeed = document.getElementById('viewPublicFeed');
        if (viewDetail) viewDetail.style.display = 'none';
        if (viewFeed) viewFeed.style.display = 'block';

        if (tg?.BackButton) {
          try { tg.BackButton.offClick(goBackToFeed); } catch (_) {}
          tg.BackButton.hide();
        }

        try {
          if (window.location.hash.startsWith('#post')) {
            history.replaceState(null, '', window.location.pathname + (window.location.search || ''));
          }
          sessionStorage.removeItem('active_post_id');
          localStorage.removeItem('active_post_id');
        } catch (_) {}
      }

      function renderPostDetailPage(post) {
        try {
          const bodyEl = document.getElementById('postDetailPageBody');
          if (!bodyEl) return;
          currentDetailPost = post;

          const allFiles = (post.folders || []).flatMap(f => f.files || []);

          // 1. Gather all pictures (Cover + Image files)
          const pictures = [];
          if (post.preview_image) {
            pictures.push({ id: 0, url: post.preview_image, title: post.title + ' (Cover)', view_count: post.view_count || 0 });
          }
          allFiles.forEach(f => {
            const isImg = (f.mime_type && f.mime_type.startsWith('image/')) || (f.file_name && /\.(jpe?g|png|webp|gif)$/i.test(f.file_name));
            if (isImg && f.file_id) {
              pictures.push({
                id: f.id || f.channel_message_id,
                url: '/api/stream?post_id=' + post.id + '&file_id=' + encodeURIComponent(f.file_id),
                title: f.file_name || 'Photo',
                view_count: f.view_count || 0
              });
            }
          });
          currentPostPictures = pictures;
          activePhotoIndex = 0;

          // 2. Separate into streamable videos and large files
          const nonImageFiles = allFiles.filter(f => {
            const isImg = (f.mime_type && f.mime_type.startsWith('image/')) || (f.file_name && /\.(jpe?g|png|webp|gif)$/i.test(f.file_name));
            return !isImg;
          });

          const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100 MB

          // All video files
          const allVideoFiles = nonImageFiles.filter(f => {
            return (f.mime_type && f.mime_type.startsWith('video/')) || (f.file_name && /\.(mp4|mkv|mov|webm|avi)$/i.test(f.file_name));
          });

          // Large files (> 100MB) OR non-streamable files
          const largeFiles = nonImageFiles.filter(f => {
            const isVid = (f.mime_type && f.mime_type.startsWith('video/')) || (f.file_name && /\.(mp4|mkv|mov|webm|avi)$/i.test(f.file_name));
            const sz = Number(f.size) || 0;
            return !isVid || sz > LARGE_FILE_THRESHOLD;
          });

          // Streamable videos (<= 100MB)
          const streamableVideos = allVideoFiles.filter(f => {
            const sz = Number(f.size) || 0;
            return sz <= LARGE_FILE_THRESHOLD;
          });

          // Video list for player: only streamable videos
          const videosForPlayer = streamableVideos;

          // Store streamable videos for player indexing
          currentPostVideos = streamableVideos;
          activeVideoIndex = 0;

          let html = '';

          // Post Header: Title, Tags, Stats
          const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString() : '';
          html += '<div style="margin-bottom: 16px;">' +
            '<div style="font-size: 1.25rem; font-weight: 800; color: #f8fafc; line-height: 1.35; margin-bottom: 6px;">' + escapeHtml(post.title) + '</div>' +
            '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.78rem; color: var(--text-muted);">' +
            (post.is_promoted ? '<span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-weight: 800; padding: 2px 7px; border-radius: 6px;">⭐ Exclusive</span>' : '') +
            '<span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 6px;">🏷️ ' + escapeHtml(post.category || 'All') + '</span>' +
            (dateStr ? '<span>🕒 ' + dateStr + '</span>' : '') +
            '<span>👁️ ' + (post.view_count || 0) + '</span>' +
            '<span>❤️ ' + (post.like_count || 0) + '</span>' +
            '</div>' +
            '</div>';

          // SECTION 1: PICTURES CONTAINER (FIRST!)
          if (pictures.length > 0) {
            const curPic = pictures[0];
            html += '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 16px; overflow: hidden; margin-bottom: 18px;">' +
              '<div style="padding: 12px 16px; font-weight: 700; font-size: 0.88rem; color: #38bdf8; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06);">' +
              '<span>🖼️ Photos (' + pictures.length + ')</span>' +
              '<div style="display: flex; align-items: center; gap: 8px;">' +
              '<span style="font-size: 0.74rem; background: rgba(255,255,255,0.06); color: #cbd5e1; padding: 2px 8px; border-radius: 10px; font-weight: 600;">👁️ <span id="postActivePhotoViews" data-fview-id="' + (curPic.id || 0) + '">' + (curPic.view_count || 0) + '</span> views</span>' +
              '<span style="font-size: 0.75rem; color: var(--text-muted);">' + (pictures.length > 1 ? '‹ Swipe or tap arrows ›' : 'Tap photo to Zoom') + '</span>' +
              '</div>' +
              '</div>' +
              '<div style="position: relative; user-select: none; max-height: 380px; display: flex; align-items: center; justify-content: center; background: #000; overflow: hidden;" id="postDetailMainPhotoWrap">' +
              '<img id="postDetailMainPhoto" src="' + escapeHtml(curPic.url) + '" alt="" style="max-height: 380px; width: 100%; object-fit: contain; cursor: pointer;" />' +
              (pictures.length > 1 ? (
                '<div id="postPhotoCounterBadge" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 12px; backdrop-filter: blur(4px); pointer-events: none; z-index: 2;">1 / ' + pictures.length + '</div>' +
                '<button type="button" class="post-photo-arrow btn-photo-prev" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; backdrop-filter: blur(4px); z-index: 3; line-height: 1;">‹</button>' +
                '<button type="button" class="post-photo-arrow btn-photo-next" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; backdrop-filter: blur(4px); z-index: 3; line-height: 1;">›</button>'
              ) : '') +
              '<div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; backdrop-filter: blur(4px); pointer-events: none; z-index: 2;">' +
              '🔍 Tap to Zoom' +
              '</div>' +
              '</div>';

            if (pictures.length > 1) {
              html += '<div style="padding: 10px 14px; background: rgba(10, 16, 31, 0.9); display: flex; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch;" id="postPhotoThumbnails">' +
                pictures.map((pic, idx) => {
                  return '<div class="photo-thumb-item" data-idx="' + idx + '" style="flex-shrink: 0; width: 62px; height: 62px; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid ' + (idx === 0 ? '#38bdf8' : 'rgba(255,255,255,0.12)') + '; background: #000;">' +
                    '<img src="' + escapeHtml(pic.url) + '" alt="" style="width: 100%; height: 100%; object-fit: cover;" />' +
                    '</div>';
                }).join('') +
                '</div>';
            }

            html += '</div>';
          }

          // SECTION 2: VIDEO STREAM PLAYER (STREAMABLE VIDEOS ONLY)
          if (videosForPlayer.length > 0) {
            const firstVid = videosForPlayer[0];
            const firstSize = Number(firstVid.size) || 0;
            const firstSizeMB = (firstSize / (1024 * 1024)).toFixed(1);
            const firstTitle = firstVid.file_name || 'Video 1';
            const firstVidKey = firstVid.id || firstVid.channel_message_id || 0;
            const firstStreamSrc = '/api/stream?post_id=' + post.id + (firstVid.file_id ? ('&file_id=' + encodeURIComponent(firstVid.file_id)) : '') + (firstVid.channel_message_id ? ('&msg_id=' + encodeURIComponent(firstVid.channel_message_id)) : '') + (firstVid.size ? ('&size=' + encodeURIComponent(firstVid.size)) : '');

            html += '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 16px; overflow: hidden; margin-bottom: 18px; padding: 14px;">' +
              '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 8px;">' +
              '<div style="font-weight: 700; font-size: 0.92rem; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 58%;" id="postActiveVideoTitle">🎬 ' + escapeHtml(firstTitle) + '</div>' +
              '<div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">' +
              '<div style="font-size: 0.74rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 12px; font-weight: 700;" id="postActiveVideoSize">' + firstSizeMB + ' MB</div>' +
              '<div style="font-size: 0.74rem; background: rgba(255, 255, 255, 0.08); color: #cbd5e1; padding: 2px 8px; border-radius: 12px; font-weight: 600;" id="postActiveVideoViews">👁️ <span class="vcount" data-fview-id="' + firstVidKey + '">' + (firstVid.view_count || 0) + '</span> views</div>' +
              '</div>' +
              '</div>' +

              // LIVE INTERNET SPEED & REQUIRED BITRATE METER
              '<div id="videoSpeedMeterBar" style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 7px 12px; margin-bottom: 10px; font-size: 0.74rem; flex-wrap: wrap; gap: 6px;">' +
              '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<span id="speedIndicatorDot" style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; box-shadow: 0 0 8px #22c55e; transition: all 0.3s ease;"></span>' +
              '<span style="color: var(--text-muted);">Net Speed:</span>' +
              '<span id="userNetSpeedText" style="font-weight: 700; color: #22c55e;">Measuring...</span>' +
              '</div>' +
              '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<span style="color: var(--text-muted);">Required:</span>' +
              '<span id="requiredNetSpeedText" style="font-weight: 700; color: #f8fafc;">~150 KB/s</span>' +
              '<span id="speedQualityBadge" style="font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: rgba(34,197,94,0.15); color: #22c55e;">🟢 Smooth</span>' +
              '</div>' +
              '</div>' +

              // EXACTLY 1 VIDEO PLAYER IN THE DOM WITH FULLSCREEN CAPABILITY
              '<div style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #000;" id="postVideoPlayerWrap" oncontextmenu="return false;">' +
              '<video id="postActiveVideoPlayer" playsinline webkit-playsinline controls controlsList="nodownload noplaybackrate" oncontextmenu="return false;" preload="metadata" style="width: 100%; max-height: 360px; outline: none; background: #000; display: block;">' +
              '<source src="' + firstStreamSrc + '" type="video/mp4">' +
              'Your browser does not support HTML5 video.' +
              '</video>' +
              '<div id="videoErrorOverlay" style="display: none; position: absolute; inset: 0; background: rgba(0,0,0,0.88); align-items: center; justify-content: center; flex-direction: column; gap: 10px; z-index: 6; padding: 16px; text-align: center;">' +
              '<div style="color: #f87171; font-weight: 700; font-size: 0.88rem;">⚠️ Video stream delayed or loading slowly</div>' +
              '<div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">' +
              '<button type="button" class="btn btn-secondary btn-sm" id="btnVideoRetry" style="padding: 6px 14px; font-size: 0.78rem;">🔄 Retry</button>' +
              '<button type="button" class="btn btn-primary btn-sm" data-act="send-single-file" data-pid="' + post.id + '" data-fid="' + firstVidKey + '" style="padding: 6px 14px; font-size: 0.78rem;">📥 Get File in Bot</button>' +
              '</div>' +
              '</div>' +
              '<button type="button" id="btnVideoFullscreen" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(0,0,0,0.7); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 5px 10px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; backdrop-filter: blur(4px);">⛶ Fullscreen</button>' +
              '<button type="button" id="btnVideoExitFullscreen" style="display: none; position: absolute; top: 16px; right: 16px; z-index: 1000000; background: rgba(239,68,68,0.85); color: #fff; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; cursor: pointer; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">✕</button>' +
              '</div>' +

              // Fullscreen bar below the player
              '<div style="display: flex; gap: 8px; margin-top: 10px;">' +
              '<button type="button" id="btnVideoFullscreenBar" class="btn btn-secondary btn-sm" style="flex: 1; padding: 10px; font-weight: 700; font-size: 0.82rem; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8;">⛶ Watch in Full Screen</button>' +
              '</div>';

            // 2-PER-ROW THUMBNAIL BOXES GRID (Tapping any box switches & plays that video)
            if (videosForPlayer.length > 0) {
              html += '<div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">' +
                '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">' +
                '<div style="font-weight: 700; font-size: 0.85rem; color: #f8fafc; display: flex; align-items: center; gap: 6px;">🎬 Select Video (' + videosForPlayer.length + ')</div>' +
                '<span style="font-size: 0.72rem; color: var(--text-muted);">Tap box to play</span>' +
                '</div>' +
                '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;" id="postVideoFilesList">' +
                videosForPlayer.map((vid, idx) => {
                  const vSize = Number(vid.size) || 0;
                  const vSizeMB = (vSize / (1024 * 1024)).toFixed(1);
                  const vName = vid.file_name || ('Video ' + (idx + 1));
                  const vKey = vid.id || vid.channel_message_id || 0;
                  const isActive = idx === 0;
                  const thumbSrc = post.preview_image ? escapeHtml(post.preview_image) : ('/api/thumbnail?msg_id=' + encodeURIComponent(vid.channel_message_id || '') + '&post_id=' + encodeURIComponent(post.id) + (vid.file_id ? ('&file_id=' + encodeURIComponent(vid.file_id)) : ''));
                  const fallbackImg = post.preview_image ? escapeHtml(post.preview_image) : '';

                  return '<div class="video-file-card ' + (isActive ? 'active' : '') + '" data-vidx="' + idx + '" style="background: ' + (isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.7)') + '; border: 1.5px solid ' + (isActive ? '#38bdf8' : 'rgba(255,255,255,0.08)') + '; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; box-shadow: ' + (isActive ? '0 0 12px rgba(56,189,248,0.25)' : 'none') + ';">' +
                    // Thumbnail aspect ratio container
                    '<div style="position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; overflow: hidden;">' +
                    '<img src="' + thumbSrc + '" loading="lazy" alt="Thumbnail" ' + (fallbackImg ? ('onerror="if(this.src!=\'' + fallbackImg + '\'){this.src=\'' + fallbackImg + '\';}"') : '') + ' style="width: 100%; height: 100%; object-fit: cover; display: block;">' +
                    // Play icon overlay
                    '<div class="vid-play-badge" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: ' + (isActive ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)') + '; transition: all 0.2s ease;">' +
                    '<div style="width: 32px; height: 32px; border-radius: 50%; background: ' + (isActive ? '#38bdf8' : 'rgba(0,0,0,0.65)') + '; border: 1.5px solid ' + (isActive ? '#fff' : 'rgba(255,255,255,0.7)') + '; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">' + (isActive ? '▶' : '▶') + '</div>' +
                    '</div>' +
                    // Size badge
                    '<span style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.75); color: #38bdf8; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; backdrop-filter: blur(4px);">' + vSizeMB + ' MB</span>' +
                    // Views badge
                    '<span style="position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.75); color: #cbd5e1; font-size: 0.65rem; font-weight: 600; padding: 2px 6px; border-radius: 6px; backdrop-filter: blur(4px);">👁️ <span data-fview-id="' + vKey + '">' + (vid.view_count || 0) + '</span></span>' +
                    '</div>' +
                    // Card Bottom Info
                    '<div style="padding: 8px 10px; display: flex; flex-direction: column; gap: 2px;">' +
                    '<div class="vid-card-title" style="font-weight: 700; font-size: 0.78rem; color: ' + (isActive ? '#38bdf8' : '#f8fafc') + '; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🎬 ' + escapeHtml(vName) + '</div>' +
                    '<div class="vid-card-status" style="font-size: 0.68rem; color: ' + (isActive ? '#38bdf8' : 'var(--text-muted)') + '; font-weight: 600;">' + (isActive ? '🟢 Playing' : 'Tap to stream') + '</div>' +
                    '</div>' +
                    '</div>';
                }).join('') +
                '</div>' +
                '</div>';
            }

            html += '</div>';
          }

          // SECTION 3: LARGE FILES (> 100 MB / NOT STREAMABLE) — FAST DIRECT GET BUTTON FOR EACH
          if (largeFiles.length > 0) {
            html += '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 16px; padding: 14px; margin-bottom: 18px;">' +
              '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">' +
              '<div style="font-weight: 700; font-size: 0.9rem; color: #fbbf24; display: flex; align-items: center; gap: 6px;">📦 Large Files (&gt; 100 MB)</div>' +
              '<span style="font-size: 0.72rem; color: #fbbf24; background: rgba(245, 158, 11, 0.15); padding: 2px 8px; border-radius: 10px; font-weight: 700;">' + largeFiles.length + ' file(s)</span>' +
              '</div>' +
              '<div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 12px;">Fast native Telegram delivery — tap below to get each large file directly:</div>' +
              '<div style="display: flex; flex-direction: column; gap: 10px;">' +
              largeFiles.map((lf, lIdx) => {
                const lfSize = Number(lf.size) || 0;
                const lfSizeMB = (lfSize / (1024 * 1024)).toFixed(1);
                const lfName = lf.file_name || ('Large File ' + (lIdx + 1));
                const fKey = lf.id || lf.channel_message_id || 0;
                const isVid = (lf.mime_type && lf.mime_type.startsWith('video/')) || /\.(mp4|mkv|mov|webm|avi)$/i.test(lfName);

                return '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">' +
                  '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">' +
                  '<div style="font-weight: 700; font-size: 0.85rem; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55%;">' + (isVid ? '🎬 ' : '📁 ') + escapeHtml(lfName) + '</div>' +
                  '<div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">' +
                  '<span style="font-size: 0.72rem; background: rgba(255, 255, 255, 0.06); color: #cbd5e1; padding: 2px 8px; border-radius: 8px; font-weight: 600;">👁️ <span data-fview-id="' + fKey + '">' + (lf.view_count || 0) + '</span> views</span>' +
                  '<span style="font-size: 0.74rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 2px 8px; border-radius: 8px; font-weight: 700;">' + lfSizeMB + ' MB</span>' +
                  '</div>' +
                  '</div>' +
                  '<div style="display: flex; gap: 8px; align-items: center;">' +
                  '<button type="button" class="btn btn-primary btn-sm" data-act="send-single-file" data-pid="' + post.id + '" data-fid="' + fKey + '" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.82rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">📥 Get File (' + lfSizeMB + ' MB)</button>' +
                  '</div>' +
                  '</div>';
              }).join('') +
              '</div>' +
              '</div>';
          }

          // SECTION 4: MEGA LINK / DIRECT LINK
          if (post.direct_link) {
            const linkTitle = post.direct_link_title || 'Open Mega Link / Direct File';
            html += '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 12px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 8px;">' +
              '<div style="font-weight: 700; font-size: 0.82rem; color: #34d399;">🔗 External Cloud Link</div>' +
              '<a href="' + escapeHtml(post.direct_link) + '" target="_blank" rel="noopener noreferrer" class="btn" style="width: 100%; padding: 11px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; color: #fff; background: linear-gradient(135deg, #10b981, #059669); border-radius: 10px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">' +
              '☁️ ' + escapeHtml(linkTitle) + ' ↗️' +
              '</a>' +
              '</div>';
          }

          // SECTION 5: PRIMARY BOT ACTION (ALL FILES)
          html += '<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 8px;">' +
            '<div style="font-size: 0.78rem; color: var(--text-muted); text-align: center;">Want all files forwarded directly to your Telegram chat?</div>' +
            '<button type="button" class="btn btn-secondary" data-act="send-file-bot" data-id="' + post.id + '" style="width: 100%; padding: 11px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px; border-radius: 10px;">' +
            '🚀 Open &amp; Deliver All Files in Bot Chat' +
            '</button>' +
            '</div>';

          bodyEl.innerHTML = html;

          // Attach safe event handling and fallback for resilient video playback
          const playerEl = document.getElementById('postActiveVideoPlayer');
          const errorOverlayEl = document.getElementById('videoErrorOverlay');
          let videoRetryCount = 0;

          let lastMeasuredDownlinkMbps = null;
          let speedTestInProgress = false;

          async function getLiveInternetSpeed() {
            if (lastMeasuredDownlinkMbps && (Date.now() - lastMeasuredDownlinkMbps.time < 30000)) {
              return lastMeasuredDownlinkMbps.speed;
            }
            if (speedTestInProgress) {
              return lastMeasuredDownlinkMbps ? lastMeasuredDownlinkMbps.speed : 5.0;
            }
            speedTestInProgress = true;
            try {
              const t0 = performance.now();
              const res = await fetch('/api/user/speed-test?t=' + Date.now(), { cache: 'no-store' });
              if (res.ok) {
                const buf = await res.arrayBuffer();
                const t1 = performance.now();
                const durSec = (t1 - t0) / 1000;
                if (durSec > 0 && buf.byteLength > 0) {
                  const mbps = Number(((buf.byteLength * 8) / (durSec * 1000000)).toFixed(1));
                  lastMeasuredDownlinkMbps = { speed: Math.max(0.1, mbps), time: Date.now() };
                  speedTestInProgress = false;
                  return lastMeasuredDownlinkMbps.speed;
                }
              }
            } catch (_) {}
            speedTestInProgress = false;
            if (navigator.connection && navigator.connection.downlink) {
              const dl = Number(navigator.connection.downlink.toFixed(1));
              lastMeasuredDownlinkMbps = { speed: dl, time: Date.now() };
              return dl;
            }
            return 5.0;
          }

          function calculateRequiredSpeed(vid, player) {
            const vSize = Number(vid?.size) || 0;
            let duration = (player && player.duration && isFinite(player.duration) && player.duration > 0)
              ? player.duration
              : 0;
            if (!duration && vSize > 0) {
              // Estimate duration: assume typical mobile video bitrate of ~150 KB/s (~1.2 Mbps)
              duration = Math.max(30, (vSize / (150 * 1024)));
            }
            if (duration > 0 && vSize > 0) {
              const bytesPerSec = vSize / duration;
              const kbps = Math.round(bytesPerSec / 1024);
              const mbps = Number(((bytesPerSec * 8) / 1000000).toFixed(2));
              return { kbps: Math.max(25, kbps), mbps: Math.max(0.2, mbps) };
            }
            return { kbps: 150, mbps: 1.2 };
          }

          function updateVideoSpeedBadge(userMbps, req) {
            const dot = document.getElementById('speedIndicatorDot');
            const userText = document.getElementById('userNetSpeedText');
            const reqText = document.getElementById('requiredNetSpeedText');
            const badge = document.getElementById('speedQualityBadge');
            if (!dot || !userText || !reqText || !badge) return;

            let userSpeedDisplay = '';
            if (userMbps >= 1.0) {
              userSpeedDisplay = userMbps.toFixed(1) + ' Mbps';
            } else {
              userSpeedDisplay = Math.round(userMbps * 125) + ' KB/s';
            }
            userText.textContent = userSpeedDisplay;

            let reqDisplay = '';
            if (req.kbps >= 1000) {
              reqDisplay = '~' + (req.kbps / 1024).toFixed(1) + ' MB/s';
            } else {
              reqDisplay = '~' + req.kbps + ' KB/s';
            }
            reqText.textContent = reqDisplay;

            if (userMbps >= req.mbps * 1.1) {
              dot.style.background = '#22c55e';
              dot.style.boxShadow = '0 0 8px #22c55e';
              userText.style.color = '#22c55e';
              badge.style.background = 'rgba(34, 197, 94, 0.15)';
              badge.style.color = '#22c55e';
              badge.textContent = '🟢 Smooth';
            } else if (userMbps >= req.mbps * 0.7) {
              dot.style.background = '#f59e0b';
              dot.style.boxShadow = '0 0 8px #f59e0b';
              userText.style.color = '#f59e0b';
              badge.style.background = 'rgba(245, 158, 11, 0.15)';
              badge.style.color = '#f59e0b';
              badge.textContent = '🟡 Moderate';
            } else {
              dot.style.background = '#ef4444';
              dot.style.boxShadow = '0 0 8px #ef4444';
              userText.style.color = '#ef4444';
              badge.style.background = 'rgba(239, 68, 68, 0.15)';
              badge.style.color = '#ef4444';
              badge.textContent = '🔴 Slow Net';
            }
          }

          function refreshSpeedMeter(vid, player) {
            getLiveInternetSpeed().then(userSpeed => {
              const reqSpeed = calculateRequiredSpeed(vid, player);
              updateVideoSpeedBadge(userSpeed, reqSpeed);
            });
          }

          let activeVideoHalfWatched = false;

          if (playerEl && videosForPlayer.length > 0) {
            const curVid = () => currentPostVideos[activeVideoIndex] || videosForPlayer[0];

            refreshSpeedMeter(curVid(), playerEl);

            playerEl.onloadedmetadata = () => {
              refreshSpeedMeter(curVid(), playerEl);
            };

            playerEl.oncanplay = () => {
              if (errorOverlayEl) errorOverlayEl.style.display = 'none';
            };
            playerEl.onplaying = () => {
              if (errorOverlayEl) errorOverlayEl.style.display = 'none';
            };
            playerEl.ontimeupdate = () => {
              // Only count view if user played or skipped to at least half (50%) of video duration
              if (!activeVideoHalfWatched && !isAdmin) {
                const dur = playerEl.duration;
                const cur = playerEl.currentTime;
                if (dur > 0 && isFinite(dur) && cur >= (dur * 0.5)) {
                  activeVideoHalfWatched = true;
                  const v = curVid();
                  if (v) {
                    const vKey = v.id || v.channel_message_id;
                    const vSize = Number(v.size) || 0;
                    const mbConsumed = ((vSize * (cur / dur)) / (1024 * 1024)).toFixed(1);
                    const watchSec = Math.round(cur);
                    trackFileView(post.id, vKey, watchSec, mbConsumed, v.file_name);
                  }
                }
              }
            };
            playerEl.onerror = () => {
              if (document.hidden) return; // Prevent crashes on app minimization
              const v = curVid();
              if (v && v.channel_message_id && videoRetryCount === 0) {
                videoRetryCount++;
                const directUrl = 'https://xmi-stream-bot.onrender.com/stream?channel_id=-1004415998750&msg_id=' + encodeURIComponent(v.channel_message_id);
                console.log('Video stream notice, attempting direct Render stream fallback:', directUrl);
                playerEl.src = directUrl;
                playerEl.load();
                playerEl.play().catch(() => {});
                return;
              }
              if (errorOverlayEl) errorOverlayEl.style.display = 'flex';
            };

            const retryBtn = document.getElementById('btnVideoRetry');
            if (retryBtn) {
              retryBtn.onclick = () => {
                videoRetryCount = 0;
                if (errorOverlayEl) errorOverlayEl.style.display = 'none';
                refreshSpeedMeter(curVid(), playerEl);
                playerEl.load();
                playerEl.play().catch(() => {});
              };
            }
          }

          if (typeof trackPostView === 'function' && post.id) {
            trackPostView(post.id);
          }
        } catch (rErr) {
          console.error('renderPostDetailPage error:', rErr);
          const bodyEl = document.getElementById('postDetailPageBody');
          if (bodyEl) {
            bodyEl.innerHTML = '<div style="padding: 30px; text-align: center; color: #f87171;">Failed to display post: ' + escapeHtml(rErr.message) + '</div>';
          }
        }
      }

      async function openPostDetailPage(postId) {
        const viewFeed = document.getElementById('viewPublicFeed');
        const viewDetail = document.getElementById('viewPostDetail');
        const bodyEl = document.getElementById('postDetailPageBody');
        if (!viewDetail || !bodyEl) return;

        // If this post is already currently open and displayed, do nothing to prevent reload thrashing
        if (currentDetailPost && String(currentDetailPost.id) === String(postId) && viewDetail.style.display === 'block') {
          return;
        }

        // Cleanly destroy any existing video player to free hardware decoders
        const prevPlayer = document.getElementById('postActiveVideoPlayer');
        if (prevPlayer) {
          try {
            prevPlayer.pause();
            prevPlayer.removeAttribute('src');
            while (prevPlayer.firstChild) prevPlayer.removeChild(prevPlayer.firstChild);
            prevPlayer.load();
          } catch (_) {}
        }

        if (viewFeed) viewFeed.style.display = 'none';
        viewDetail.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
          history.replaceState(null, '', '#post=' + postId);
          sessionStorage.setItem('active_post_id', String(postId));
          localStorage.setItem('active_post_id', String(postId));
          localStorage.setItem('last_active_time', String(Date.now()));
        } catch (_) {}

        if (tg?.BackButton) {
          try { tg.BackButton.offClick(goBackToFeed); } catch (_) {}
          tg.BackButton.show();
          tg.BackButton.onClick(goBackToFeed);
        }

        try {
          const strId = String(postId);

          // 1. Instant cache check for 0ms transition
          if (postDetailCache.has(strId)) {
            renderPostDetailPage(postDetailCache.get(strId));
            return;
          }

          // 2. Instant feed preview if post is already in feed list
          const feedPost = (typeof allPosts !== 'undefined' && Array.isArray(allPosts))
            ? allPosts.find(p => String(p.id) === strId)
            : null;

          if (feedPost) {
            bodyEl.innerHTML = '<div style="margin-bottom: 16px;">' +
              '<div style="font-size: 1.25rem; font-weight: 800; color: #f8fafc; line-height: 1.35; margin-bottom: 6px;">' + escapeHtml(feedPost.title) + '</div>' +
              '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.78rem; color: var(--text-muted);">' +
              (feedPost.is_promoted ? '<span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-weight: 800; padding: 2px 7px; border-radius: 6px;">⭐ Exclusive</span>' : '') +
              '<span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 6px;">🏷️ ' + escapeHtml(feedPost.category || 'All') + '</span>' +
              '</div>' +
              '</div>' +
              (feedPost.preview_image ? '<div style="border-radius: 14px; overflow: hidden; background: #000; margin-bottom: 16px; text-align: center;"><img src="' + escapeHtml(feedPost.preview_image) + '" style="max-height: 280px; width: 100%; object-fit: contain;" /></div>' : '') +
              '<div style="padding: 30px 0; text-align: center; color: var(--text-muted);"><div style="font-size: 28px; margin-bottom: 8px;">⏳</div>Loading media &amp; files...</div>';
          } else {
            bodyEl.innerHTML = '<div style="padding: 50px 0; text-align: center; color: var(--text-muted);"><div style="font-size: 36px; margin-bottom: 12px;">⏳</div>Loading post...</div>';
          }

          const res = await fetch('/api/posts/' + postId + '?user_id=' + currentUserId);
          const data = await res.json();
          if (!data.success || !data.post) {
            bodyEl.innerHTML = '<div style="padding: 30px; text-align: center; color: #f87171;">Failed to load post. <button type="button" class="btn btn-secondary btn-sm" onclick="goBackToFeed()" style="margin-top:10px;">← Back to feed</button></div>';
            return;
          }

          postDetailCache.set(strId, data.post);
          renderPostDetailPage(data.post);
        } catch (e) {
          console.error('openPostDetailPage error:', e);
          bodyEl.innerHTML = '<div style="padding: 30px; text-align: center; color: #f87171;">Failed to load post details: ' + escapeHtml(e.message) + '</div>';
        }
      }

      function forwardToTelegram(postId) {
        const botUrl = 'https://t.me/' + botUsername + '?start=post_' + postId;
        if (tg && tg.openTelegramLink) {
          tg.openTelegramLink(botUrl);
        } else {
          window.open(botUrl, '_blank');
        }
      }

      function forwardToTelegramSingleFile(postId, fileId) {
        const botUrl = 'https://t.me/' + botUsername + '?start=file_' + postId + '_' + fileId;
        if (tg && tg.openTelegramLink) {
          tg.openTelegramLink(botUrl);
        } else {
          window.open(botUrl, '_blank');
        }
      }

      const trackedFileViewKeys = new Set();

      function trackFileView(postId, fileId, watchSec, mbConsumed, fileName) {
        if (!postId || !fileId || isAdmin) return;
        const viewKey = String(postId) + '_' + String(fileId);
        if (trackedFileViewKeys.has(viewKey)) return;
        trackedFileViewKeys.add(viewKey);

        fetch('/api/file-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: postId,
            file_id: fileId,
            user_id: currentUserId,
            username: currentUserName,
            first_name: tg?.initDataUnsafe?.user?.first_name || '',
            watch_seconds: watchSec !== undefined ? watchSec : null,
            mb_consumed: mbConsumed !== undefined ? mbConsumed : null,
            file_name: fileName || null
          })
        }).then(r => r.json()).then(data => {
          if (data && data.success && data.view_count !== undefined) {
            document.querySelectorAll('[data-fview-id="' + fileId + '"]').forEach(el => {
              el.textContent = data.view_count;
            });
          }
        }).catch(() => {});
      }

      async function deliverFileInApp(postId, fileId, btnElement) {
        if (!postId || !fileId) return;
        const origText = btnElement ? btnElement.innerHTML : '📥 Get File';
        if (btnElement) {
          btnElement.innerHTML = '⏳ Delivering to chat...';
          btnElement.disabled = true;
        }

        try {
          const res = await fetch('/api/deliver-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: postId,
              file_id: fileId,
              user_id: currentUserId,
              username: currentUserName
            })
          });
          const data = await res.json();

          if (data && data.delivered) {
            showToast('✅ File sent to your Telegram chat! Check messages.');
            if (btnElement) {
              btnElement.innerHTML = '✅ Sent to Chat';
              btnElement.style.background = 'linear-gradient(135deg, #10b981, #059669)';
              setTimeout(() => {
                btnElement.disabled = false;
                btnElement.innerHTML = origText;
                btnElement.style.background = '';
              }, 4000);
            }
            if (data.view_count !== undefined) {
              document.querySelectorAll('[data-fview-id="' + fileId + '"]').forEach(el => {
                el.textContent = data.view_count;
              });
            }
            return;
          }

          if (data && data.fallback_url) {
            showToast('🚀 Opening bot chat to deliver file...');
            forwardToTelegramSingleFile(postId, fileId);
            if (btnElement) {
              btnElement.disabled = false;
              btnElement.innerHTML = origText;
            }
            return;
          }

          showToast('⚠️ Delivery notice: ' + (data?.error || 'Could not send file'));
          forwardToTelegramSingleFile(postId, fileId);
        } catch (e) {
          console.warn('deliverFileInApp error:', e);
          forwardToTelegramSingleFile(postId, fileId);
        } finally {
          if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = origText;
          }
        }
      }

      // In-Page Back Button Listener
      document.getElementById('btnBackToFeed')?.addEventListener('click', goBackToFeed);

      // Bookmark / Save button on Post Page
      document.getElementById('btnPostDetailSave')?.addEventListener('click', async () => {
        if (!currentDetailPost) return;
        const postId = currentDetailPost.id;
        try {
          const res = await fetch('/api/saved?post_id=' + postId + '&user_id=' + currentUserId, {
            method: 'POST'
          });
          const data = await res.json();
          if (data.success) {
            if (data.saved) {
              savedPostIds.add(Number(postId));
              showToast('🔖 Post saved to bookmarks');
            } else {
              savedPostIds.delete(Number(postId));
              showToast('Removed from saved posts');
            }
            renderFeed();
          }
        } catch (err) {
          console.warn('Save error:', err);
        }
      });

      // Post Detail Dynamic Interactions (Photos, Videos & Single File Delivery)
      document.getElementById('postDetailPageBody')?.addEventListener('click', (e) => {
        // 1. Photo thumbnail clicked -> switch main photo
        const thumb = e.target.closest('.photo-thumb-item');
        if (thumb) {
          const idx = parseInt(thumb.dataset.idx, 10);
          switchPostDetailPhoto(idx);
          return;
        }

        // 2. Photo Prev / Next arrow buttons clicked
        const prevArrow = e.target.closest('.btn-photo-prev');
        if (prevArrow) {
          e.stopPropagation();
          switchPostDetailPhoto(activePhotoIndex - 1);
          return;
        }
        const nextArrow = e.target.closest('.btn-photo-next');
        if (nextArrow) {
          e.stopPropagation();
          switchPostDetailPhoto(activePhotoIndex + 1);
          return;
        }

        // 3. Main photo clicked -> zoom lightbox
        const photoWrap = e.target.closest('#postDetailMainPhotoWrap');
        if (photoWrap && currentPostPictures && currentPostPictures[activePhotoIndex]) {
          openImageLightbox(currentPostPictures[activePhotoIndex].url, currentPostPictures[activePhotoIndex].title, activePhotoIndex);
          return;
        }

        // 4. Send Single File to Bot Chat (Large files)
        const singleBtn = e.target.closest('[data-act="send-single-file"]');
        if (singleBtn) {
          e.stopPropagation();
          const pId = singleBtn.dataset.pid;
          const fId = singleBtn.dataset.fid;
          if (pId && fId) deliverFileInApp(pId, fId, singleBtn);
          return;
        }

        // 5. Video card clicked -> switch active video (only 1 video plays at once!)
        const vCard = e.target.closest('.video-file-card');
        if (vCard) {
          const vIdx = parseInt(vCard.dataset.vidx, 10);
          const vid = currentPostVideos[vIdx];
          if (vid && currentDetailPost) {
            activeVideoIndex = vIdx;
            activeVideoHalfWatched = false; // Reset 50% watch flag for new video
            const player = document.getElementById('postActiveVideoPlayer');
            if (player) {
              try { player.pause(); } catch (_) {}
              const vSize = Number(vid.size) || 0;
              const vSizeMB = (vSize / (1024 * 1024)).toFixed(1);
              const vTitle = vid.file_name || ('Video ' + (vIdx + 1));
              const vKey = vid.id || vid.channel_message_id || 0;
              const streamSrc = '/api/stream?post_id=' + currentDetailPost.id + (vid.file_id ? ('&file_id=' + encodeURIComponent(vid.file_id)) : '') + (vid.channel_message_id ? ('&msg_id=' + encodeURIComponent(vid.channel_message_id)) : '') + (vid.size ? ('&size=' + encodeURIComponent(vid.size)) : '');

              const titleEl = document.getElementById('postActiveVideoTitle');
              if (titleEl) titleEl.textContent = '🎬 ' + vTitle;
              const sizeEl = document.getElementById('postActiveVideoSize');
              if (sizeEl) sizeEl.textContent = vSizeMB + ' MB';
              const viewsEl = document.getElementById('postActiveVideoViews');
              if (viewsEl) {
                viewsEl.innerHTML = '👁️ <span class="vcount" data-fview-id="' + vKey + '">' + (vid.view_count || 0) + '</span> views';
              }

              // Update grid cards styling
              document.querySelectorAll('.video-file-card').forEach((c, idx) => {
                const titleEl = c.querySelector('.vid-card-title');
                const statusEl = c.querySelector('.vid-card-status');
                const badgeEl = c.querySelector('.vid-play-badge > div');
                if (idx === vIdx) {
                  c.style.background = 'rgba(56, 189, 248, 0.12)';
                  c.style.borderColor = '#38bdf8';
                  c.style.boxShadow = '0 0 12px rgba(56,189,248,0.25)';
                  if (titleEl) titleEl.style.color = '#38bdf8';
                  if (statusEl) {
                    statusEl.textContent = '🟢 Playing';
                    statusEl.style.color = '#38bdf8';
                  }
                  if (badgeEl) {
                    badgeEl.style.background = '#38bdf8';
                    badgeEl.style.borderColor = '#fff';
                  }
                } else {
                  c.style.background = 'rgba(15, 23, 42, 0.7)';
                  c.style.borderColor = 'rgba(255,255,255,0.08)';
                  c.style.boxShadow = 'none';
                  if (titleEl) titleEl.style.color = '#f8fafc';
                  if (statusEl) {
                    statusEl.textContent = 'Tap to stream';
                    statusEl.style.color = 'var(--text-muted)';
                  }
                  if (badgeEl) {
                    badgeEl.style.background = 'rgba(0,0,0,0.65)';
                    badgeEl.style.borderColor = 'rgba(255,255,255,0.7)';
                  }
                }
              });

              videoRetryCount = 0;
              const errOverlay = document.getElementById('videoErrorOverlay');
              if (errOverlay) errOverlay.style.display = 'none';

              player.preload = 'metadata';
              player.src = streamSrc;
              player.load();
              const pPromise = player.play();
              if (pPromise !== undefined) {
                pPromise.catch(e => console.log('Autoplay notice:', e));
              }

              if (typeof refreshSpeedMeter === 'function') {
                refreshSpeedMeter(vid, player);
              }

              // Smooth scroll to top of video player wrap
              const playerWrap = document.getElementById('postVideoPlayerWrap');
              if (playerWrap) {
                playerWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }

              player.onerror = () => {
                if (document.hidden) return; // Prevent crashes on app minimization
                if (vid.channel_message_id && videoRetryCount === 0) {
                  videoRetryCount++;
                  const directUrl = 'https://xmi-stream-bot.onrender.com/stream?channel_id=-1004415998750&msg_id=' + encodeURIComponent(vid.channel_message_id);
                  console.log('Video error, switching to direct Render stream fallback:', directUrl);
                  player.src = directUrl;
                  player.load();
                  player.play().catch(() => {});
                  return;
                }
                if (errOverlay) errOverlay.style.display = 'flex';
              };
            }
          }
          return;
        }

        // 6. Fullscreen button clicked
        const fsBtn = e.target.closest('#btnVideoFullscreen, #btnVideoFullscreenBar');
        if (fsBtn) {
          e.stopPropagation();
          toggleVideoFullscreen();
          return;
        }

        // 7. Fullscreen exit button clicked
        const exitFsBtn = e.target.closest('#btnVideoExitFullscreen');
        if (exitFsBtn) {
          e.stopPropagation();
          const wrap = document.getElementById('postVideoPlayerWrap');
          if (wrap) wrap.classList.remove('fullscreen-fallback');
          return;
        }

        // 8. Send entire post / all files to bot
        const sendBotBtn = e.target.closest('[data-act="send-file-bot"]');
        if (sendBotBtn) {
          const postId = sendBotBtn.dataset.id || (currentDetailPost ? currentDetailPost.id : null);
          if (postId) forwardToTelegram(postId);
          return;
        }
      });

      // Double-click on video to toggle fullscreen
      document.getElementById('postDetailPageBody')?.addEventListener('dblclick', (e) => {
        if (e.target.id === 'postActiveVideoPlayer') {
          toggleVideoFullscreen();
        }
      });

      function toggleVideoFullscreen() {
        const player = document.getElementById('postActiveVideoPlayer');
        const wrap = document.getElementById('postVideoPlayerWrap');
        if (!player) return;

        // Exit fallback fullscreen if active
        if (wrap && wrap.classList.contains('fullscreen-fallback')) {
          wrap.classList.remove('fullscreen-fallback');
          return;
        }

        // Exit native document fullscreen if active
        if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
          const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
          if (exitFs) exitFs.call(document).catch(() => {});
          return;
        }

        // 1. Try iOS / Safari WebKit native video fullscreen
        if (typeof player.webkitEnterFullscreen === 'function') {
          try {
            player.webkitEnterFullscreen();
            return;
          } catch (_) {}
        }

        // 2. Try standard or webkit requestFullscreen
        const reqFs = player.requestFullscreen || player.webkitRequestFullscreen || player.webkitRequestFullScreen || player.mozRequestFullScreen || player.msRequestFullscreen;
        if (reqFs) {
          reqFs.call(player).catch(() => {
            if (wrap) wrap.classList.add('fullscreen-fallback');
          });
        } else if (wrap) {
          wrap.classList.add('fullscreen-fallback');
        }
      }

      // Touch swipe gestures for main photos in post detail page
      let pSwipeStartX = 0;
      let pSwipeStartY = 0;
      document.getElementById('postDetailPageBody')?.addEventListener('touchstart', (e) => {
        const wrap = e.target.closest('#postDetailMainPhotoWrap');
        if (wrap && e.touches.length === 1) {
          pSwipeStartX = e.touches[0].clientX;
          pSwipeStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      document.getElementById('postDetailPageBody')?.addEventListener('touchend', (e) => {
        const wrap = e.target.closest('#postDetailMainPhotoWrap');
        if (wrap && currentPostPictures && currentPostPictures.length > 1 && e.changedTouches.length === 1) {
          const diffX = e.changedTouches[0].clientX - pSwipeStartX;
          const diffY = e.changedTouches[0].clientY - pSwipeStartY;
          if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
            if (diffX < 0) {
              // Swipe left -> next photo
              switchPostDetailPhoto(activePhotoIndex + 1);
            } else {
              // Swipe right -> previous photo
              switchPostDetailPhoto(activePhotoIndex - 1);
            }
          }
        }
      }, { passive: true });

      // Lightbox Controls & Dismissal Listeners
      document.getElementById('btnLightboxClose')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeImageLightbox();
      });

      document.getElementById('btnLightboxPrev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        switchLightboxPhoto(activePhotoIndex - 1);
      });

      document.getElementById('btnLightboxNext')?.addEventListener('click', (e) => {
        e.stopPropagation();
        switchLightboxPhoto(activePhotoIndex + 1);
      });

      // Touch swipe gestures in Fullscreen Lightbox
      let lbSwipeStartX = 0;
      let lbSwipeStartY = 0;
      const lbModal = document.getElementById('imageLightboxModal');
      lbModal?.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && lightboxScale <= 1.05) {
          lbSwipeStartX = e.touches[0].clientX;
          lbSwipeStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      lbModal?.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1 && lightboxScale <= 1.05 && currentPostPictures && currentPostPictures.length > 1) {
          const diffX = e.changedTouches[0].clientX - lbSwipeStartX;
          const diffY = e.changedTouches[0].clientY - lbSwipeStartY;
          if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
            if (diffX < 0) {
              // Swipe left -> next photo
              switchLightboxPhoto(activePhotoIndex + 1);
            } else {
              // Swipe right -> previous photo
              switchLightboxPhoto(activePhotoIndex - 1);
            }
          }
        }
      }, { passive: true });

      // Keyboard arrow navigation for lightbox
      window.addEventListener('keydown', (e) => {
        if (isLightboxOpen) {
          if (e.key === 'ArrowRight') switchLightboxPhoto(activePhotoIndex + 1);
          if (e.key === 'ArrowLeft') switchLightboxPhoto(activePhotoIndex - 1);
          if (e.key === 'Escape') closeImageLightbox();
        }
      });

      document.getElementById('btnLightboxZoomIn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        setLightboxZoom(lightboxScale + 0.3);
      });

      document.getElementById('btnLightboxZoomOut')?.addEventListener('click', (e) => {
        e.stopPropagation();
        setLightboxZoom(lightboxScale - 0.3);
      });

      document.getElementById('btnLightboxReset')?.addEventListener('click', (e) => {
        e.stopPropagation();
        setLightboxZoom(1.0);
      });

      // Tap outside image on blank space / backdrop to dismiss
      document.getElementById('lightboxBackdrop')?.addEventListener('click', (e) => {
        if (e.target.id === 'lightboxBackdrop') {
          closeImageLightbox();
        }
      });
      document.getElementById('imageLightboxModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'imageLightboxModal') {
          closeImageLightbox();
        }
      });

      // Double-click/tap to zoom and touch pinch support
      const lbImg = document.getElementById('lightboxImg');
      if (lbImg) {
        lbImg.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          setLightboxZoom(lightboxScale > 1.2 ? 1.0 : 2.2);
        });

        let initialDistance = 0;
        let startScale = 1.0;
        lbImg.addEventListener('touchstart', (e) => {
          if (e.touches.length === 2) {
            initialDistance = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
            );
            startScale = lightboxScale;
          }
        }, { passive: true });

        lbImg.addEventListener('touchmove', (e) => {
          if (e.touches.length === 2 && initialDistance > 0) {
            const currentDistance = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
            );
            const ratio = currentDistance / initialDistance;
            setLightboxZoom(startScale * ratio);
          }
        }, { passive: true });

        lbImg.addEventListener('touchend', (e) => {
          if (e.touches.length < 2) {
            initialDistance = 0;
          }
        });
      }

      // Universal listener for preview image clicks across feed & admin cards
      document.addEventListener('click', (e) => {
        const previewEl = e.target.closest('[data-act="preview-image"]');
        if (previewEl) {
          const img = previewEl.dataset.img;
          const title = previewEl.dataset.title;
          if (img) {
            openImageLightbox(img, title);
          }
        }
      });

      // Device / Telegram back button popstate listener
      window.addEventListener('popstate', () => {
        if (isLightboxOpen) {
          closeImageLightbox();
        }
      });

      // Header Points Button
      document.getElementById('btnHeaderPoints')?.addEventListener('click', openPointsModal);

      // Points Modal Events
      document.getElementById('btnPointsClose')?.addEventListener('click', () => {
        document.getElementById('pointsModal').classList.remove('active');
      });

      document.getElementById('btnRegenerateVerify')?.addEventListener('click', async () => {
        const btn = document.getElementById('btnRegenerateVerify');
        btn.textContent = '⏳ Generating...';
        btn.disabled = true;

        try {
          const res = await fetch('/api/verify/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId })
          });
          const data = await res.json();
          if (data.success) {
            const shortBtn = document.getElementById('btnCompleteShortener');
            shortBtn.href = data.verify_url;
            document.getElementById('taskRewardPts').textContent = data.reward_points || 5;
            shortBtn.style.display = 'flex';
            showToast('✅ Shortener task link ready!');
          }
        } catch (e) {
          showToast('Failed to generate link');
        } finally {
          btn.textContent = '🔄 Generate / Next Task Link';
          btn.disabled = false;
        }
      });

      document.getElementById('btnCopyInviteLink')?.addEventListener('click', () => {
        const inviteUrl = 'https://t.me/' + botUsername + '?start=ref_' + currentUserId;
        navigator.clipboard.writeText(inviteUrl);
        showToast('📋 Invite link copied to clipboard!');
      });

      // Save Admin Settings Form
      document.getElementById('formAdminSettings')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const settings = {
          shortener_enabled: document.getElementById('setShortenerToggle').checked,
          points_per_verify: Number(document.getElementById('setPointsPerVerify').value) || 5,
          points_per_post: Number(document.getElementById('setPointsPerPost').value) || 1,
          auto_delete_minutes: Number(document.getElementById('setAutoDeleteMinutes').value) ?? 30,
          referral_enabled: document.getElementById('setReferralToggle').checked,
          referral_points: Number(document.getElementById('setReferralPointsVal').value) || 10,
          force_join_enabled: document.getElementById('setForceJoinToggle').checked,
          require_bot_start_enabled: document.getElementById('setRequireBotStartToggle').checked,
          require_bot_start_message: document.getElementById('setRequireBotStartMsg').value.trim(),
          require_bot_start_link: document.getElementById('setRequireBotStartLink').value.trim(),

          stream_enabled: document.getElementById('setStreamToggle') ? document.getElementById('setStreamToggle').checked : true,
          render_stream_url: document.getElementById('setRenderStreamUrl') ? document.getElementById('setRenderStreamUrl').value.trim() : '',
          adsgram_enabled: document.getElementById('setAdsgramToggle') ? document.getElementById('setAdsgramToggle').checked : false,
          adsgram_rewarded_block_id: document.getElementById('setAdsgramRewardedId') ? document.getElementById('setAdsgramRewardedId').value.trim() : '',
          adsgram_interstitial_block_id: document.getElementById('setAdsgramInterstitialId') ? document.getElementById('setAdsgramInterstitialId').value.trim() : '',
          adsgram_preroll_enabled: document.getElementById('setAdsgramPrerollToggle') ? document.getElementById('setAdsgramPrerollToggle').checked : false
        };


        try {
          const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, settings })
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ Hub Settings saved successfully!');
            await loadSettingsAndUser();
          }
        } catch (err) {
          showToast('Failed to save settings');
        }
      });

      // Clear All Likes, Views & Downloads
      document.getElementById('btnResetAllMetrics')?.addEventListener('click', async () => {
        if (!confirm('⚠️ Are you sure you want to permanently reset and clear all likes, views, and downloads across all posts?')) {
          return;
        }
        const btn = document.getElementById('btnResetAllMetrics');
        btn.disabled = true;
        btn.textContent = 'Clearing metrics...';
        try {
          const res = await fetch('/api/admin/metrics/reset?user_id=' + currentUserId, {
            method: 'POST'
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ All likes, views & downloads cleared!');
            await loadPosts();
            await loadAdminPosts();
          } else {
            showToast(data.error || 'Failed to clear metrics');
          }
        } catch (e) {
          showToast('Failed to clear metrics');
        } finally {
          btn.disabled = false;
          btn.textContent = '🗑️ Clear All Likes, Views & Downloads';
        }
      });

      // Add Shortener Form
      document.getElementById('formAddShortener')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('addShTitle').value.trim();
        const shortener_url = document.getElementById('addShUrl').value.trim();
        const bot_verify_link = document.getElementById('addShDestLink').value.trim();
        const reward_points = Number(document.getElementById('addShPoints').value) || 5;
        const enabled = document.getElementById('addShEnabled').checked;

        try {
          const res = await fetch('/api/admin/shorteners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, title, shortener_url, bot_verify_link, reward_points, enabled })
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ Shortener saved!');
            document.getElementById('addShTitle').value = '';
            document.getElementById('addShUrl').value = '';
            generateNewDestLink();
            loadShorteners();
          }
        } catch (err) {
          showToast('Failed to add shortener');
        }
      });

      // Delete Shortener
      document.getElementById('shortenersList')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-delsh]');
        if (!btn) return;
        const shId = btn.dataset.delsh;
        if (!confirm('Are you sure you want to remove this shortener?')) return;

        try {
          const res = await fetch('/api/admin/shorteners/' + shId + '?user_id=' + currentUserId, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('Shortener removed');
            loadShorteners();
          }
        } catch (err) {
          showToast('Failed to remove shortener');
        }
      });

      // Add Force Channel Form
      document.getElementById('formAddChannel')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const channel_id = document.getElementById('addChId').value.trim();
        const channel_title = document.getElementById('addChTitle').value.trim();
        const invite_link = document.getElementById('addChLink').value.trim();

        try {
          const res = await fetch('/api/admin/force-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, channel_id, channel_title, invite_link })
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ Force channel added!');
            document.getElementById('addChId').value = '';
            document.getElementById('addChTitle').value = '';
            document.getElementById('addChLink').value = '';
            loadChannels();
          }
        } catch (err) {
          showToast('Failed to add channel');
        }
      });

      // Delete Force Channel
      document.getElementById('forceChannelsList')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-delch]');
        if (!btn) return;
        const chId = btn.dataset.delch;
        if (!confirm('Remove this mandatory force channel?')) return;

        try {
          const res = await fetch('/api/admin/force-channels/' + chId + '?user_id=' + currentUserId, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('Channel removed');
            loadChannels();
          }
        } catch (err) {
          showToast('Failed to delete channel');
        }
      });

      // Save Banner Form
      document.getElementById('formAdminBanner')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const settings = {
          banner_enabled: document.getElementById('setBannerToggle').checked,
          banner_title: document.getElementById('setBannerTitle').value.trim(),
          banner_text: document.getElementById('setBannerText').value.trim(),
          banner_image: document.getElementById('setBannerImg').value.trim(),
          banner_link: document.getElementById('setBannerLink').value.trim()
        };

        try {
          const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, settings })
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ Sponsored Banner saved!');
            await loadSettingsAndUser();
          }
        } catch (err) {
          showToast('Failed to save banner');
        }
      });

      // Push Broadcast Form
      document.getElementById('formAdminBroadcast')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSendBroadcast');
        const message = document.getElementById('bcMessage').value.trim();
        const photo_url = document.getElementById('bcPhoto').value.trim();
        const button_text = document.getElementById('bcBtnText').value.trim();
        const button_url = document.getElementById('bcBtnUrl').value.trim();

        if (!message) return;
        if (!confirm('🚀 Send this broadcast message to ALL users now?')) return;

        btn.disabled = true;
        btn.textContent = '⏳ Sending broadcast...';

        try {
          const res = await fetch('/api/admin/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, message, photo_url, button_text, button_url })
          });
          const data = await res.json();
          if (data.success) {
            showToast('🎉 Broadcast sent! Sent: ' + (data.sent_count || 0) + ', Failed: ' + (data.failed_count || 0));
            document.getElementById('bcMessage').value = '';
            document.getElementById('bcPhoto').value = '';
            document.getElementById('bcBtnText').value = '';
            document.getElementById('bcBtnUrl').value = '';
          } else {
            showToast(data.error || 'Failed to send broadcast');
          }
        } catch (err) {
          showToast('Error broadcasting message');
        } finally {
          btn.disabled = false;
          btn.textContent = '🚀 Send Broadcast Now';
        }
      });

      // Refresh Stats
      document.getElementById('btnRefreshAdminStats')?.addEventListener('click', loadAdminAnalytics);
    }

    function openPointsModal(customMsg = null) {
      document.getElementById('modalPointsVal').textContent = userPoints;
      document.getElementById('taskRewardPts').textContent = globalSettings.points_per_verify || 5;
      document.getElementById('inviteRewardPts').textContent = globalSettings.referral_points || 10;
      if (customMsg) {
        document.getElementById('modalPointsStatusMsg').textContent = customMsg;
      }
      document.getElementById('pointsModal').classList.add('active');
    }

    // Comments Modal
    async function openCommentsModal(postId, postTitle) {
      activeCommentPostId = postId;
      document.getElementById('commentsPostTitle').textContent = postTitle || 'Comments';
      const list = document.getElementById('commentsList');
      list.innerHTML = '<div style="padding: 14px; text-align: center;">Loading comments...</div>';
      document.getElementById('commentsModal').classList.add('active');

      try {
        const res = await fetch('/api/posts/' + postId + '?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          const comments = data.post?.comments || [];
          if (comments.length === 0) {
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No comments yet. Be the first!</div>';
            return;
          }
          list.innerHTML = '';
          comments.forEach(c => {
            const item = document.createElement('div');
            item.style.cssText = 'background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px; border: 1px solid ' + (c.is_hidden ? 'rgba(239, 68, 68, 0.45)' : 'var(--card-border)') + ';';

            let adminControlsHtml = '';
            if (isAdmin) {
              const hideToggleBtn = c.is_hidden
                ? '<button class="btn-comment-mod" data-cid="' + c.id + '" data-cact="unhide" style="padding: 3px 8px; font-size: 0.72rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 6px; cursor: pointer; font-weight: 600;">👁️ Unhide</button>'
                : '<button class="btn-comment-mod" data-cid="' + c.id + '" data-cact="hide" style="padding: 3px 8px; font-size: 0.72rem; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; cursor: pointer; font-weight: 600;">🙈 Hide</button>';
              const deleteBtn = '<button class="btn-comment-mod" data-cid="' + c.id + '" data-cact="delete" style="padding: 3px 7px; font-size: 0.72rem; background: rgba(148, 163, 184, 0.12); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 6px; cursor: pointer;" title="Delete permanently">🗑️</button>';
              const hiddenBadge = c.is_hidden ? '<span style="font-size: 0.68rem; font-weight: 700; color: #f87171; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 4px;">HIDDEN</span>' : '';
              adminControlsHtml = '<div style="display: flex; gap: 6px; align-items: center;">' + hiddenBadge + hideToggleBtn + deleteBtn + '</div>';
            }

            item.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">' +
              '<div style="display: flex; align-items: center; gap: 6px;"><strong style="font-size: 0.82rem; color: var(--primary);">' + escapeHtml(c.username || 'User') + '</strong><span style="font-size: 0.68rem; color: var(--text-muted);">' + formatISTDateTime(c.created_at) + '</span></div>' +
              adminControlsHtml +
              '</div>' +
              '<div style="font-size: 0.85rem; color: ' + (c.is_hidden ? '#94a3b8; font-style: italic;' : '#e2e8f0;') + ' word-break: break-word;">' + escapeHtml(c.text) + '</div>';
            list.appendChild(item);
          });
        }
      } catch (e) {
        list.innerHTML = '<div style="color: #f87171;">Failed to load comments.</div>';
      }
    }

    // Comment Moderation Actions (Hide / Unhide / Delete)
    document.getElementById('commentsList')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-comment-mod');
      if (!btn || !activeCommentPostId) return;
      const commentId = btn.dataset.cid;
      const action = btn.dataset.cact;
      if (action === 'delete' && !confirm('⚠️ Are you sure you want to permanently delete this comment?')) {
        return;
      }
      btn.disabled = true;
      try {
        const res = await fetch('/api/comments/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment_id: commentId,
            action,
            user_id: currentUserId
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast(action === 'delete' ? '🗑️ Comment deleted' : (action === 'hide' ? '🙈 Comment hidden from public' : '👁️ Comment unhidden'));
          await openCommentsModal(activeCommentPostId);
          await loadPosts();
        } else {
          showToast(data.error || 'Failed to moderate comment');
        }
      } catch (err) {
        showToast('Error moderating comment');
      }
    });

    document.getElementById('btnCommentsClose')?.addEventListener('click', () => {
      document.getElementById('commentsModal').classList.remove('active');
    });

    document.getElementById('formAddComment')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('commentInput');
      const text = input.value.trim();
      if (!text || !activeCommentPostId) return;

      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: activeCommentPostId,
            user_id: currentUserId,
            username: currentUserName,
            text
          })
        });
        const data = await res.json();
        if (data.success) {
          input.value = '';
          openCommentsModal(activeCommentPostId);
          showToast('Comment posted!');
        }
      } catch (err) {
        showToast('Failed to post comment');
      }
    });

    function escapeHtml(text) {
      if (!text) return '';
      return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Start App
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  </script>
</body>
</html>`;

const frontendJs = `/**
 * Frontend Single Page Application (SPA) HTML Generator
 * Served directly by Cloudflare Worker at GET / and GET /app
 */

export function getAppHtml(env) {
  const botUsername = env.BOT_USERNAME || 'Xminty_bot';
  const adminId = env.ADMIN_ID || '';

  const html = ${JSON.stringify(rawHtml)};
  return html.replaceAll('__BOT_USERNAME__', botUsername).replaceAll('__ADMIN_ID__', String(adminId));
}
`;

fs.writeFileSync(path.join(projectDir, 'src', 'frontend.js'), frontendJs, 'utf8');
// Self write removed

console.log('✅ Generated clean and syntax-valid src/frontend.js and scripts/make-frontend.js!');
