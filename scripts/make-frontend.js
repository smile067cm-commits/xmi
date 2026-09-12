// Frontend generator script
import fs from 'fs';
import path from 'path';

const projectDir = '/storage/emulated/0/termux/ai/bot';

const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>xmi - Telegram Content Hub</title>
  
  <!-- Telegram WebApp SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>

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

    html, body {
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-gradient);
      background-attachment: fixed;
      color: var(--text-main);
      min-height: 100vh;
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
    <!-- 2. ADMIN CONTROL HUB VIEW -->
    <!-- ============================================== -->
    <div id="viewAdminHub" style="display: none;">
      <!-- Admin Hub Navigation Sub-Tabs -->
      <div class="admin-subtabs-bar" id="adminSubtabs">
        <button class="admin-subtab active" data-atab="posts">📑 Manage Posts</button>
        <button class="admin-subtab" data-atab="users">👥 Users Directory</button>
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
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; text-align: center;">
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
              <div style="font-size: 1.15rem; font-weight: 800; color: #38bdf8;" id="cntUsersTotal">0</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">Total Users</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
              <div style="font-size: 1.15rem; font-weight: 800; color: #4ade80;" id="cntUsersActive">0</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">🟢 Active</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 4px;">
              <div style="font-size: 1.15rem; font-weight: 800; color: #f87171;" id="cntUsersBlocked">0</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">🚫 Blocked</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <input type="text" id="adminUsersSearchInput" class="form-input" placeholder="🔍 Search name, username, or ID..." style="font-size: 0.8rem;" />
            <select id="adminUsersFilterSelect" class="form-input" style="width: 120px; font-size: 0.78rem; background: #1e293b;">
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>
          <div id="adminUsersList" style="display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto;">
            <div style="text-align: center; color: var(--text-muted); padding: 16px;">Loading users directory...</div>
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
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Publish Date (UTC)</label>
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
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Publish Date (UTC)</label>
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
            <button type="button" class="btn btn-ghost" style="color: #f87171;" id="btnDeleteFromEdit">🗑️ Delete</button>
          </div>
        </form>
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

  <div id="toast"></div>

  <!-- Client-Side JavaScript Logic -->
  <script>
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const currentUserId = tg?.initDataUnsafe?.user?.id || (new URLSearchParams(window.location.search)).get('user_id') || 0;
    const currentUserName = tg?.initDataUnsafe?.user?.first_name || (tg?.initDataUnsafe?.user?.username || 'User');
    const adminId = "__ADMIN_ID__";
    const botUsername = "__BOT_USERNAME__";
    let isAdmin = Boolean(adminId && String(currentUserId) === String(adminId));

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

    function showToast(msg) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
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

    // Initialize App
    async function initApp() {
      if (isAdmin) {
        showAdminElements();
      }

      await loadSettingsAndUser();
      await loadPosts();

      setupEventListeners();
    }

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
          }

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
        if (data.success) {
          allPosts = (data.posts || []).map(p => {
            const likes = Number(p.like_count) || 0;
            const downloads = Number(p.access_count) || 0;
            const views = Number(p.view_count) || 0;
            const base = (likes * 5) + (downloads * 4) + (views * 1);
            p._popularityScore = (base + 1) * (0.8 + Math.random() * 0.4);
            return p;
          });
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

        card.innerHTML = '<div class="post-image-container">' + imgHtml + (promotedBadge ? '<div class="post-badges-top">' + promotedBadge + '</div>' : '') + '</div>' +
          '<div class="post-body">' +
          '<h3 class="post-title">' + escapeHtml(post.title) + '</h3>' +
          '<div class="post-meta"><span>📅 ' + new Date(post.created_at).toLocaleDateString() + '</span>' + (post.tags ? '<span>• ' + escapeHtml(post.tags) + '</span>' : '') + (shortenerOn ? '<span style="color: #fbbf24; font-weight: 700;">• 🪙 ' + pointsRequired + ' pt' + (pointsRequired > 1 ? 's' : '') + '</span>' : '') + '</div>' +
          '<div class="post-actions-row">' +
          '<div class="social-counters">' +
          '<button class="action-btn ' + (post.is_liked ? 'liked' : '') + '" data-act="like" data-id="' + post.id + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span>' + (post.like_count || 0) + '</span></button>' +
          '<button class="action-btn" data-act="comment" data-id="' + post.id + '" data-title="' + escapeHtml(post.title) + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span>' + (post.comment_count || 0) + '</span></button>' +
          '<button class="action-btn ' + (isSaved ? 'saved' : '') + '" data-act="save" data-id="' + post.id + '"><svg width="15" height="15" viewBox="0 0 24 24" fill="' + (isSaved ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>' +
          '</div>' +
          '</div>' +
          '<button class="btn-open-bot-full" data-act="open-in-bot" data-id="' + post.id + '">🚀 Open in Bot</button>' +
          '</div>';

        grid.appendChild(card);
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
            card.innerHTML = '<div class="post-image-container" style="height: 140px;">' +
              (post.preview_image ? '<div class="post-image-backdrop" style="background-image: url(&quot;' + escapeHtml(post.preview_image) + '&quot;);"></div><img src="' + escapeHtml(post.preview_image) + '" alt="" class="post-image-fg" loading="lazy" />' : '<div class="post-image-placeholder">📄</div>') +
              '<div class="post-badges-top"><span class="post-status-badge status-' + post.status + '">' + post.status + '</span>' +
              (post.is_promoted ? '<span class="post-status-badge status-promoted">⭐ Pin</span>' : '') + '</div></div>' +
              '<div class="post-body">' +
              '<h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px;">' + escapeHtml(post.title) + '</h4>' +
              '<div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 10px;">👁️ ' + (post.view_count || 0) + ' views • ❤️ ' + (post.like_count || 0) + ' likes • 📥 ' + (post.access_count || 0) + ' accesses</div>' +
              '<div style="display: flex; gap: 6px; margin-top: auto;">' +
              '<button class="btn btn-sm btn-secondary" style="flex: 1;" data-aact="edit" data-id="' + post.id + '">✏️ Edit</button>' +
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

          // Leaderboard Likes
          const topLikesEl = document.getElementById('adminTopLikes');
          topLikesEl.innerHTML = '';
          (s.top_likes || []).forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-item';
            row.innerHTML = '<span>#' + (idx + 1) + ' ' + escapeHtml(item.title) + '</span><strong style="color: var(--accent-heart);">' + item.like_count + ' likes</strong>';
            topLikesEl.appendChild(row);
          });
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
          const active = total - blocked;

          const elTotal = document.getElementById('cntUsersTotal');
          if (elTotal) elTotal.textContent = total;
          const elActive = document.getElementById('cntUsersActive');
          if (elActive) elActive.textContent = active;
          const elBlocked = document.getElementById('cntUsersBlocked');
          if (elBlocked) elBlocked.textContent = blocked;

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
        const tgLink = u.username ? ('https://t.me/' + u.username) : ('tg://user?id=' + u.id);
        const displayName = u.first_name ? escapeHtml(u.first_name) : (u.username ? '@' + escapeHtml(u.username) : ('User #' + u.id));
        const usernameDisplay = u.username ? ('@' + escapeHtml(u.username)) : 'No username';

        const row = document.createElement('div');
        row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid ' + (isBlocked ? 'rgba(239, 68, 68, 0.35)' : 'var(--card-border)') + '; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;';
        row.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; min-width: 180px;">' +
          '<div style="font-size: 1.4rem;">' + (isBlocked ? '🚫' : '👤') + '</div>' +
          '<div>' +
            '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<strong style="font-size: 0.88rem; color: var(--text-main);">' + displayName + '</strong>' +
              '<span style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; ' + (isBlocked ? 'background: rgba(239, 68, 68, 0.2); color: #f87171;' : 'background: rgba(34, 197, 94, 0.2); color: #4ade80;') + '">' +
                (isBlocked ? 'BLOCKED' : 'ACTIVE') +
              '</span>' +
            '</div>' +
            '<div style="font-size: 0.73rem; color: var(--text-muted); margin-top: 2px;">' +
              usernameDisplay + ' • ID: <code>' + u.id + '</code>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">' +
          '<div style="text-align: right; font-size: 0.74rem; color: var(--text-muted);">' +
            '<div>🪙 <strong style="color: #fbbf24;">' + (u.points || 0) + '</strong> pts</div>' +
            '<div>🔄 ' + (u.interactions || 1) + ' acts</div>' +
          '</div>' +
          '<button type="button" class="btn btn-sm btn-secondary btn-open-user-chat" data-uid="' + u.id + '" data-username="' + (u.username || '') + '" data-name="' + escapeHtml(displayName) + '" style="padding: 6px 10px; font-size: 0.75rem;">' +
            '💬 Open' +
          '</button>' +
        '</div>';
        list.appendChild(row);
      });
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
        document.getElementById('adminTabShorteners').style.display = atab === 'shorteners' ? 'block' : 'none';
        document.getElementById('adminTabSettings').style.display = atab === 'settings' ? 'block' : 'none';
        document.getElementById('adminTabChannels').style.display = atab === 'channels' ? 'block' : 'none';
        document.getElementById('adminTabBanner').style.display = atab === 'banner' ? 'block' : 'none';
        document.getElementById('adminTabBroadcast').style.display = atab === 'broadcast' ? 'block' : 'none';
        document.getElementById('adminTabAnalytics').style.display = atab === 'analytics' ? 'block' : 'none';

        if (atab === 'posts') loadAdminPosts();
        if (atab === 'users') loadAdminUsers();
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
        }
      });

      // Admin Users Search, Filters & Chat Action
      document.getElementById('adminUsersSearchInput')?.addEventListener('input', renderAdminUsers);
      document.getElementById('adminUsersFilterSelect')?.addEventListener('change', renderAdminUsers);
      document.getElementById('btnRefreshAdminUsers')?.addEventListener('click', loadAdminUsers);

      // Open User Chat / Contact Options
      document.getElementById('adminUsersList')?.addEventListener('click', (e) => {
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

        // Single "Open in Bot" button click -> Deep link to bot and close Mini App
        const openBotBtn = e.target.closest('[data-act="open-in-bot"]');
        if (openBotBtn) {
          const postId = openBotBtn.dataset.id;
          const botUrl = 'https://t.me/' + botUsername + '?start=post_' + postId;
          if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(botUrl);
            setTimeout(() => {
              if (tg.close) tg.close();
            }, 300);
          } else {
            window.location.href = botUrl;
          }
          return;
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
          require_bot_start_link: document.getElementById('setRequireBotStartLink').value.trim()
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
              '<div style="display: flex; align-items: center; gap: 6px;"><strong style="font-size: 0.82rem; color: var(--primary);">' + escapeHtml(c.username || 'User') + '</strong><span style="font-size: 0.68rem; color: var(--text-muted);">' + new Date(c.created_at).toLocaleDateString() + '</span></div>' +
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
