import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendContent = `/**
 * Frontend Single Page Application (SPA) HTML Generator
 * Served directly by Cloudflare Worker at GET / and GET /app
 */

export function getAppHtml(env) {
  const botUsername = env.BOT_USERNAME || 'Xminty_bot';
  const adminId = env.ADMIN_ID || '';

  return \`<!DOCTYPE html>
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
      --accent-save: #38bdf8;
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
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
      color: #0f172a;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.3);
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

    .post-buttons-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-open-bot {
      background: rgba(56, 189, 248, 0.12);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: var(--transition);
      cursor: pointer;
    }

    .btn-open-bot:hover {
      background: var(--primary);
      color: #04101e;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .btn-direct-link {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: var(--transition);
    }

    .btn-direct-link:hover {
      background: #22c55e;
      color: #04101e;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
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
      </div>

      <!-- Categories Bar -->
      <div class="categories-bar" id="categoriesBar">
        <div class="category-chip active" data-cat="All">✨ All</div>
        <div class="category-chip" data-cat="Movies">🎬 Movies</div>
        <div class="category-chip" data-cat="Series">📺 Series</div>
        <div class="category-chip" data-cat="Courses">🎓 Courses</div>
        <div class="category-chip" data-cat="Software">💻 Software</div>
        <div class="category-chip" data-cat="Music">🎵 Music</div>
        <div class="category-chip" data-cat="Tutorials">📚 Tutorials</div>
      </div>

      <!-- Controls Bar (Search & Modern Segmented Sort) -->
      <div class="controls-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" class="search-input" placeholder="Search posts, tags, or topics..." autocomplete="off" />
        </div>

        <div class="sort-segmented-control" id="sortControl">
          <button class="sort-segment active" data-sort="latest">🕒 Latest</button>
          <button class="sort-segment" data-sort="views">🔥 Most Views</button>
          <button class="sort-segment" data-sort="likes">❤️ Most Liked</button>
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
        <button class="admin-subtab" data-atab="shorteners">🔗 Multiple Shorteners</button>
        <button class="admin-subtab" data-atab="settings">⚙️ Points & Rules</button>
        <button class="admin-subtab" data-atab="channels">🛡️ Force Channels</button>
        <button class="admin-subtab" data-atab="banner">🖼️ In-App Banner</button>
        <button class="admin-subtab" data-atab="broadcast">📢 Push Broadcast</button>
        <button class="admin-subtab" data-atab="analytics">📊 Analytics</button>
      </div>

      <!-- Admin Tab 1: Manage Posts -->
      <div id="adminTabPosts">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-size: 1rem; font-weight: 700;">📑 Post Management</h3>
          <a href="https://t.me/\` + botUsername + \`" class="btn btn-sm btn-primary">➕ Create Post in Bot</a>
        </div>
        <div class="posts-grid" id="adminPostsGrid"></div>
      </div>

      <!-- Admin Tab 2: Multiple Shorteners -->
      <div id="adminTabShorteners" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 16px; margin-bottom: 16px;">
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">➕ Add Monetized Shortener Service</h3>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">
            Add multiple shorteners (GPLinks, Droplink, Shareus, etc.). Users will be randomly distributed across active shorteners.
          </p>
          <form id="formAddShortener" style="display: flex; flex-direction: column; gap: 10px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Shortener Name</label>
              <input type="text" id="addShName" class="form-input" placeholder="e.g. GPLinks, Droplink" required />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">API URL Template (supports {KEY} and {URL} or standard ?api=&url=)</label>
              <input type="url" id="addShUrl" class="form-input" placeholder="https://api.gplinks.in/api?api={KEY}&url={URL}" required />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">API Key</label>
              <input type="text" id="addShKey" class="form-input" placeholder="Your API Key from shortener dashboard" />
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 4px;">➕ Save Shortener</button>
          </form>
        </div>

        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Active Shorteners List</h4>
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

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">💾 Save Hub Settings</button>
        </form>
      </div>

      <!-- Admin Tab 4: Force Join Channels -->
      <div id="adminTabChannels" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
          <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">➕ Add Required Channel / Group</h3>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">
            Make sure @\` + botUsername + \` is an administrator in the channel.
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
            🔄 Generate / Refresh Verify Link
          </button>

          <button class="btn btn-ghost" id="btnCopyInviteLink">
            🎁 Copy Invite Link (+<span id="inviteRewardPts">10</span> Pts)
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. Edit Post Modal (Admin Only) -->
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
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Category</label>
              <input type="text" id="editPostCategory" class="form-input" />
            </div>
            <div>
              <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Tags</label>
              <input type="text" id="editPostTags" class="form-input" />
            </div>
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
            <span style="font-size: 0.85rem; font-weight: 600;">⭐ Pin / Feature Post</span>
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
    const adminId = "\` + adminId + \`";
    const botUsername = "\` + botUsername + \`";
    const isAdmin = Boolean(adminId && String(currentUserId) === String(adminId));

    let allPosts = [];
    let savedPostIds = new Set();
    let currentCategory = 'All';
    let currentSort = 'latest';
    let currentSearch = '';
    let currentView = 'feed';
    let globalSettings = {};
    let userPoints = 0;
    let activeCommentPostId = null;

    function showToast(msg) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // Initialize App
    async function initApp() {
      if (isAdmin) {
        document.getElementById('badgeAdmin').style.display = 'inline-block';
        document.getElementById('adminModeBar').style.display = 'flex';
        document.getElementById('btnAdminQuick').style.display = 'inline-flex';
      }

      await loadSettingsAndUser();
      await loadPosts();

      setupEventListeners();
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
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    }

    // Load Published Posts
    async function loadPosts() {
      try {
        const res = await fetch('/api/posts?user_id=' + currentUserId);
        const data = await res.json();
        if (data.success) {
          allPosts = data.posts || [];
          savedPostIds = new Set(allPosts.filter(p => p.is_saved).map(p => p.id));
          renderFeed();
        }
      } catch (e) {
        console.error('Failed to load posts:', e);
      }
    }

    // Render Public Feed with Category & Segmented Sort Filter
    function renderFeed() {
      const grid = document.getElementById('postsGrid');
      grid.innerHTML = '';

      let list = [...allPosts];

      if (currentView === 'saved') {
        list = list.filter(p => savedPostIds.has(p.id));
      }

      if (currentCategory !== 'All') {
        list = list.filter(p => (p.category || 'All').toLowerCase() === currentCategory.toLowerCase());
      }

      if (currentSearch.trim()) {
        const q = currentSearch.toLowerCase();
        list = list.filter(p =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.tags || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        );
      }

      // Sort
      if (currentSort === 'views') {
        list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      } else if (currentSort === 'likes') {
        list.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      } else {
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      if (list.length === 0) {
        grid.innerHTML = \`
          <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 0; text-align: center; color: var(--text-muted);">
            <div style="font-size: 38px; margin-bottom: 8px;">🔍</div>
            <div style="font-weight: 600;">No posts found</div>
            <div style="font-size: 0.8rem; margin-top: 4px;">Try a different search term or category.</div>
          </div>
        \`;
        return;
      }

      list.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card' + (post.is_promoted ? ' is-promoted' : '');

        const isSaved = savedPostIds.has(post.id);
        const pointsRequired = Number(globalSettings.points_per_post) || 0;
        const shortenerOn = Boolean(globalSettings.shortener_enabled && pointsRequired > 0);

        card.innerHTML = \`
          <div class="post-image-container">
            \${post.preview_image ? \`
              <div class="post-image-backdrop" style="background-image: url('\${post.preview_image}');"></div>
              <img src="\${post.preview_image}" alt="" class="post-image-fg" loading="lazy" />
            \` : \`
              <div class="post-image-placeholder">📄</div>
            \`}
            <div class="post-badges-top">
              \${post.is_promoted ? '<span class="post-status-badge status-promoted">⭐ Featured</span>' : '<span></span>'}
              <span class="category-badge-card">\${post.category || 'All'}</span>
            </div>
          </div>
          <div class="post-body">
            <h3 class="post-title">\${escapeHtml(post.title)}</h3>
            <div class="post-meta">
              <span>📅 \${new Date(post.created_at).toLocaleDateString()}</span>
              \${post.tags ? \`<span>• \${escapeHtml(post.tags)}</span>\` : ''}
              \${shortenerOn ? \`<span style="color: #fbbf24; font-weight: 700;">• 🪙 \${pointsRequired} pt\${pointsRequired > 1 ? 's' : ''}</span>\` : ''}
            </div>

            <div class="post-actions-row">
              <div class="social-counters">
                <button class="action-btn \${post.is_liked ? 'liked' : ''}" data-act="like" data-id="\${post.id}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  <span>\${post.like_count || 0}</span>
                </button>
                <button class="action-btn" data-act="comment" data-id="\${post.id}" data-title="\${escapeHtml(post.title)}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  <span>\${post.comment_count || 0}</span>
                </button>
                <button class="action-btn \${isSaved ? 'saved' : ''}" data-act="save" data-id="\${post.id}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="\${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </button>
              </div>

              <div class="post-buttons-group">
                \${post.direct_link ? \`
                  <button class="btn-direct-link" data-act="unlock-direct" data-id="\${post.id}" data-url="\${post.direct_link}">
                    🔗 \${escapeHtml(post.direct_link_title || 'Get Link')}
                  </button>
                \` : ''}
                <button class="btn-open-bot" data-act="unlock-bot" data-id="\${post.id}">
                  📂 Files
                </button>
              </div>
            </div>
          </div>
        \`;

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
            card.innerHTML = \`
              <div class="post-image-container" style="height: 140px;">
                \${post.preview_image ? \`<img src="\${post.preview_image}" alt="" class="post-image-fg" />\` : '<div class="post-image-placeholder">📄</div>'}
                <div class="post-badges-top">
                  <span class="post-status-badge status-\${post.status}">\${post.status}</span>
                  \${post.is_promoted ? '<span class="post-status-badge status-promoted">⭐ Pin</span>' : ''}
                </div>
              </div>
              <div class="post-body">
                <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px;">\${escapeHtml(post.title)}</h4>
                <div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 10px;">
                  👁️ \${post.post_views?.length || 0} views • ❤️ \${post.likes?.length || 0} likes • 📥 \${post.file_access_logs?.length || 0} accesses
                </div>
                <div style="display: flex; gap: 6px; margin-top: auto;">
                  <button class="btn btn-sm btn-secondary" style="flex: 1;" data-aact="edit" data-id="\${post.id}">✏️ Edit</button>
                  <button class="btn btn-sm btn-ghost" style="color: #f87171;" data-aact="del" data-id="\${post.id}">🗑️</button>
                </div>
              </div>
            \`;
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
            list.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted);">No monetized shorteners added yet. Add one above!</div>';
            return;
          }

          list.innerHTML = '';
          shorteners.forEach(sh => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--card-border);';
            item.innerHTML = \`
              <div>
                <div style="font-weight: 700; font-size: 0.88rem;">\${escapeHtml(sh.name)}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); word-break: break-all;">\${escapeHtml(sh.api_url)}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn btn-sm btn-ghost" style="color: #f87171;" data-delsh="\${sh.id}">🗑️ Delete</button>
              </div>
            \`;
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
            row.innerHTML = \`<span>#\${idx + 1} \${escapeHtml(item.title)}</span><strong style="color: var(--primary);">\${item.view_count} views</strong>\`;
            topViewsEl.appendChild(row);
          });

          // Leaderboard Likes
          const topLikesEl = document.getElementById('adminTopLikes');
          topLikesEl.innerHTML = '';
          (s.top_likes || []).forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-item';
            row.innerHTML = \`<span>#\${idx + 1} \${escapeHtml(item.title)}</span><strong style="color: var(--accent-heart);">\${item.like_count} likes</strong>\`;
            topLikesEl.appendChild(row);
          });
        }
      } catch (e) {
        console.warn('Failed to load admin analytics:', e);
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
        document.getElementById('adminTabShorteners').style.display = atab === 'shorteners' ? 'block' : 'none';
        document.getElementById('adminTabSettings').style.display = atab === 'settings' ? 'block' : 'none';
        document.getElementById('adminTabChannels').style.display = atab === 'channels' ? 'block' : 'none';
        document.getElementById('adminTabBanner').style.display = atab === 'banner' ? 'block' : 'none';
        document.getElementById('adminTabBroadcast').style.display = atab === 'broadcast' ? 'block' : 'none';
        document.getElementById('adminTabAnalytics').style.display = atab === 'analytics' ? 'block' : 'none';

        if (atab === 'posts') loadAdminPosts();
        if (atab === 'shorteners') loadShorteners();
        if (atab === 'analytics') loadAdminAnalytics();
        if (atab === 'settings') {
          document.getElementById('setShortenerToggle').checked = Boolean(globalSettings.shortener_enabled);
          document.getElementById('setPointsPerVerify').value = globalSettings.points_per_verify || 5;
          document.getElementById('setPointsPerPost').value = globalSettings.points_per_post ?? 1;
          document.getElementById('setReferralToggle').checked = Boolean(globalSettings.referral_enabled);
          document.getElementById('setReferralPointsVal').value = globalSettings.referral_points || 10;
          document.getElementById('setForceJoinToggle').checked = Boolean(globalSettings.force_join_enabled);
        }
      });

      // User Nav Bar (Browse vs Saved vs Earn Points)
      document.querySelector('.user-nav-bar')?.addEventListener('click', (e) => {
        const pill = e.target.closest('.nav-pill');
        if (!pill) return;
        const view = pill.dataset.view;
        if (view === 'earn') {
          openPointsModal();
          return;
        }
        document.querySelectorAll('.user-nav-bar .nav-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentView = view;
        renderFeed();
      });

      // Category filter
      document.getElementById('categoriesBar')?.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCategory = chip.dataset.cat;
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

      // Post Card Actions (Like, Save, Comments, Unlock)
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
            const res = await fetch(\`/api/posts/\${postId}/save\`, {
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

        // Direct link unlock
        const directBtn = e.target.closest('[data-act="unlock-direct"]');
        if (directBtn) {
          const postId = directBtn.dataset.id;
          const url = directBtn.dataset.url;
          await handlePostUnlock(postId, () => {
            window.open(url, '_blank');
          });
          return;
        }

        // Files unlock -> Open bot
        const botBtn = e.target.closest('[data-act="unlock-bot"]');
        if (botBtn) {
          const postId = botBtn.dataset.id;
          await handlePostUnlock(postId, () => {
            window.location.href = \`https://t.me/\` + botUsername + \`?start=post_\` + postId;
          });
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
            showToast('✅ Verification link generated!');
          }
        } catch (e) {
          showToast('Failed to generate link');
        } finally {
          btn.textContent = '🔄 Generate / Refresh Verify Link';
          btn.disabled = false;
        }
      });

      document.getElementById('btnCopyInviteLink')?.addEventListener('click', () => {
        const inviteUrl = \`https://t.me/\` + botUsername + \`?start=ref_\` + currentUserId;
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
          referral_enabled: document.getElementById('setReferralToggle').checked,
          referral_points: Number(document.getElementById('setReferralPointsVal').value) || 10,
          force_join_enabled: document.getElementById('setForceJoinToggle').checked
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

      // Add Shortener Form
      document.getElementById('formAddShortener')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('addShName').value.trim();
        const api_url = document.getElementById('addShUrl').value.trim();
        const api_key = document.getElementById('addShKey').value.trim();

        try {
          const res = await fetch('/api/admin/shorteners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, name, api_url, api_key, enabled: true })
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ Shortener added!');
            document.getElementById('formAddShortener').reset();
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
          const res = await fetch(\`/api/admin/shorteners/\${shId}?user_id=\${currentUserId}\`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('Shortener removed');
            loadShorteners();
          }
        } catch (err) {
          showToast('Failed to remove shortener');
        }
      });

      // Refresh Stats
      document.getElementById('btnRefreshAdminStats')?.addEventListener('click', loadAdminAnalytics);
    }

    // Points-Based Content Unlock Check
    async function handlePostUnlock(postId, onUnlocked) {
      if (isAdmin) {
        onUnlocked();
        return;
      }

      const pointsCost = Number(globalSettings.points_per_post) || 0;
      if (!globalSettings.shortener_enabled || pointsCost <= 0) {
        onUnlocked();
        return;
      }

      try {
        const res = await fetch(\`/api/posts/\${postId}/unlock\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUserId })
        });
        const data = await res.json();
        if (data.success && data.allowed) {
          if (data.remaining_points !== undefined) {
            userPoints = data.remaining_points;
            document.getElementById('headerPointsVal').textContent = userPoints;
          }
          onUnlocked();
        } else {
          // Insufficient points -> Open Points Modal
          openPointsModal(\`⚠️ You need \` + data.required_points + \` Point\` + (data.required_points > 1 ? 's' : '') + \` to download this content.\`);
        }
      } catch (err) {
        onUnlocked();
      }
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
        const res = await fetch(\`/api/posts/\${postId}\`);
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
            item.style.cssText = 'background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px; border: 1px solid var(--card-border);';
            item.innerHTML = \`
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong style="font-size: 0.82rem; color: var(--primary);">\${escapeHtml(c.username)}</strong>
                <span style="font-size: 0.7rem; color: var(--text-muted);">\${new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <div style="font-size: 0.85rem; color: #e2e8f0; word-break: break-word;">\${escapeHtml(c.text)}</div>
            \`;
            list.appendChild(item);
          });
        }
      } catch (e) {
        list.innerHTML = '<div style="color: #f87171;">Failed to load comments.</div>';
      }
    }

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
    window.addEventListener('DOMContentLoaded', initApp);
  </script>
</body>
</html>\`;
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'frontend.js'), frontendContent, 'utf8');
console.log('✅ Generated src/frontend.js with zero horizontal scroll, modern toggles, segmented sort control, multiple shorteners, and points economy!');
