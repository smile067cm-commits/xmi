/**
 * Frontend Single Page Application (SPA) HTML Generator
 * Served directly by Cloudflare Worker at GET / and GET /app
 */

export function getAppHtml(env) {
  const botUsername = env.BOT_USERNAME || 'Xminty_bot';
  const adminId = env.ADMIN_ID || '';

  return `<!DOCTYPE html>
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
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-gradient);
      background-attachment: fixed;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
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
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-main);
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .brand-title {
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.72rem;
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
      border: 1px solid rgba(251, 191, 36, 0.35);
      color: #fbbf24;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
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

    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.07);
      padding: 5px 12px;
      border-radius: 9999px;
      border: 1px solid var(--card-border);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
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

    .btn-telegram {
      background: #229ed9;
      color: white;
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
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
      max-width: 920px;
      width: 100%;
      margin: 0 auto;
      padding: 16px 16px 60px 16px;
    }

    /* Admin Toolbar */
    .admin-tabs-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
    }

    .admin-tabs-bar::-webkit-scrollbar { display: none; }

    .admin-tab {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }

    .admin-tab.active {
      background: var(--primary);
      color: #04101e;
      border-color: var(--primary);
    }

    /* Feed Navigation / Views Tabs */
    .user-nav-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
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
    }

    .categories-bar::-webkit-scrollbar { display: none; }

    .category-chip {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
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

    /* Controls Bar (Search & Sort) */
    .controls-bar {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 18px;
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

    .sort-select {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 9px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }

    /* Sponsored In-App Banner */
    .sponsored-banner-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95));
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: var(--border-radius);
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15);
      text-decoration: none;
      color: inherit;
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .sponsored-banner-card:hover {
      transform: translateY(-2px);
      border-color: rgba(245, 158, 11, 0.8);
      box-shadow: 0 12px 30px rgba(245, 158, 11, 0.25);
    }

    .sponsor-tag {
      position: absolute;
      top: 8px;
      right: 10px;
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sponsor-img {
      width: 56px;
      height: 56px;
      border-radius: 12px;
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
      font-size: 0.95rem;
      color: #ffffff;
      margin-bottom: 2px;
    }

    .sponsor-desc {
      font-size: 0.78rem;
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
      gap: 18px;
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
    }

    .post-card.is-promoted {
      border: 1px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 8px 30px rgba(245, 158, 11, 0.2);
    }

    .post-card:hover {
      transform: translateY(-3px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    }

    /* Ambient Backdrop for Images */
    .post-image-container {
      width: 100%;
      height: 200px;
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
      font-size: 40px;
      opacity: 0.4;
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
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
    }

    .status-promoted {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
      color: #0f172a;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    .status-draft {
      background: rgba(245, 158, 11, 0.25);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .status-scheduled {
      background: rgba(168, 85, 247, 0.25);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.4);
    }

    .category-badge-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .post-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .post-title {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .post-meta {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Admin Action Toolbar on Cards */
    .admin-card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .admin-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .admin-btn:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .admin-btn-promote {
      color: var(--accent-admin);
      border-color: rgba(251, 191, 36, 0.3);
    }

    .admin-btn-delete {
      color: #f87171;
      border-color: rgba(248, 113, 113, 0.3);
    }

    .admin-btn-delete:hover {
      background: rgba(248, 113, 113, 0.2);
    }

    .post-actions-row {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .social-counters {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 5px 7px;
      border-radius: 8px;
      transition: var(--transition);
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
    }

    .action-btn.liked {
      color: var(--accent-heart);
    }

    .action-btn.liked svg {
      fill: var(--accent-heart);
      stroke: var(--accent-heart);
    }

    .action-btn.saved {
      color: var(--primary);
    }

    .action-btn.saved svg {
      fill: var(--primary);
      stroke: var(--primary);
    }

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
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: var(--transition);
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
      font-size: 0.8rem;
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
    }

    /* Modal / Drawer */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    @media (min-width: 640px) {
      .modal-overlay {
        align-items: center;
        padding: 20px;
      }
    }

    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-content {
      background: #192338;
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--card-border);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @media (min-width: 640px) {
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
      padding: 16px 20px;
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
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .folders-badge-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .folder-badge {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .comment-item {
      background: rgba(15, 23, 42, 0.6);
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
    }

    .comment-item.is-hidden {
      opacity: 0.6;
      border: 1px dashed #f87171;
    }

    .comment-author {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .comment-username {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--primary);
    }

    .comment-time {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .comment-text {
      font-size: 0.88rem;
      line-height: 1.4;
      color: #e2e8f0;
      white-space: pre-wrap;
    }

    .comment-admin-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }

    .comment-mod-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
    }

    .comment-mod-btn:hover {
      color: white;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Analytics UI */
    .analytics-summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }

    .stat-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 10px;
      text-align: center;
    }

    .stat-value {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .analytics-tabs {
      display: flex;
      gap: 6px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .analytics-tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
    }

    .analytics-tab-btn.active {
      background: var(--primary);
      color: #04101e;
    }

    .log-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px;
      background: rgba(15, 23, 42, 0.5);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.8rem;
    }

    .log-user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--card-border);
      background: #111a2d;
    }

    .comment-form {
      display: flex;
      gap: 8px;
    }

    .comment-input, .form-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--card-border);
      color: white;
      font-family: inherit;
      font-size: 0.88rem;
      outline: none;
    }

    .comment-input:focus, .form-input:focus {
      border-color: var(--primary);
    }

    /* Leaderboard in Stats */
    .leaderboard-section {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 12px;
      padding: 12px;
      border: 1px solid var(--card-border);
      margin-top: 12px;
    }

    .leaderboard-title {
      font-size: 0.85rem;
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
      font-size: 0.8rem;
    }

    .leaderboard-item:last-child {
      border-bottom: none;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .skeleton {
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    #toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0ea5e9;
      color: #031424;
      padding: 10px 20px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.88rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      z-index: 200;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #toast.show {
      transform: translateX(-50%) translateY(0);
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <a href="#" class="brand">
      <div class="brand-icon">⚡</div>
      <div>
        <div class="brand-title">xmi</div>
        <div class="brand-subtitle">Telegram Content Hub</div>
      </div>
    </a>

    <div class="user-auth-area" id="authArea"></div>
  </header>

  <!-- Main Content Area -->
  <main>
    <!-- Admin Filter Tabs (Admin Only) -->
    <div class="admin-tabs-bar" id="adminTabsBar" style="display: none;">
      <button class="admin-tab active" data-filter="all">📑 All Posts</button>
      <button class="admin-tab" data-filter="published">🟢 Published</button>
      <button class="admin-tab" data-filter="draft">🟡 Drafts</button>
      <button class="admin-tab" data-filter="scheduled">🟣 Scheduled</button>
      <button class="admin-tab" id="btnAdminStatsTab" style="background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); color: #60a5fa;">📊 Hub Stats</button>
      <button class="admin-tab" id="btnAdminSettingsTab" style="background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.4); color: #c084fc;">⚙️ Settings</button>
      <button class="admin-tab" id="btnAdminBroadcastTab" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.4); color: #fbbf24;">📢 Broadcast</button>
    </div>

    <!-- User Nav / Filter Bar -->
    <div class="user-nav-bar" id="userNavBar">
      <button class="nav-pill active" data-nav="all">🌐 All Feed</button>
      <button class="nav-pill" data-nav="popular">🔥 Most Popular</button>
      <button class="nav-pill" data-nav="saved">🔖 Saved Posts</button>
      <button class="nav-pill" id="btnReferralInvite" style="display: none; margin-left: auto; background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.4); color: #fbbf24;">🎁 Invite & Earn</button>
    </div>

    <!-- Categories Pills Bar -->
    <div class="categories-bar" id="categoriesBar">
      <button class="category-chip active" data-cat="All">All</button>
      <button class="category-chip" data-cat="Movies">🎬 Movies</button>
      <button class="category-chip" data-cat="Series">📺 Series</button>
      <button class="category-chip" data-cat="Courses">🎓 Courses</button>
      <button class="category-chip" data-cat="Software">💻 Software</button>
      <button class="category-chip" data-cat="Music">🎵 Music</button>
      <button class="category-chip" data-cat="Tutorials">📖 Tutorials</button>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" class="search-input" placeholder="Search posts by title or tags..." />
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <select id="sortSelect" class="sort-select">
          <option value="latest">🕒 Latest</option>
          <option value="popular">🔥 Most Views</option>
          <option value="likes">❤️ Most Liked</option>
        </select>
        <button class="btn btn-ghost btn-sm" id="btnRefresh" title="Refresh feed">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- In-App Sponsor Banner (Rendered if enabled) -->
    <div id="sponsorBannerContainer"></div>

    <!-- Feed Container -->
    <div id="postsFeed" class="posts-grid"></div>
  </main>

  <!-- Comments Modal / Drawer -->
  <div class="modal-overlay" id="commentsModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" id="modalPostTitle">Comments</h3>
        <button class="modal-close" id="btnModalClose">&times;</button>
      </div>

      <div class="modal-body" id="modalCommentsBody">
        <div id="foldersContainer" style="display: none; margin-bottom: 12px;"></div>
        <div class="comments-list" id="commentsList"></div>
      </div>

      <div class="modal-footer">
        <form class="comment-form" id="commentForm">
          <input
            type="text"
            id="commentTextInput"
            class="comment-input"
            placeholder="Write a comment..."
            autocomplete="off"
            required
          />
          <button type="submit" class="btn btn-primary btn-sm">Post</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Admin Post Analytics Modal -->
  <div class="modal-overlay" id="analyticsModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" id="analyticsPostTitle">Post Analytics</h3>
        <button class="modal-close" id="btnAnalyticsClose">&times;</button>
      </div>

      <div class="modal-body">
        <div class="analytics-summary-cards">
          <div class="stat-card">
            <div class="stat-value" id="statViews">0</div>
            <div class="stat-label">👁️ Views</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="statAccesses">0</div>
            <div class="stat-label">📥 Accesses</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="statLikes">0</div>
            <div class="stat-label">❤️ Likes</div>
          </div>
        </div>

        <div class="analytics-tabs">
          <button class="analytics-tab-btn active" data-atab="views">👁️ Viewers</button>
          <button class="analytics-tab-btn" data-atab="accesses">📥 File / Link Downloads</button>
          <button class="analytics-tab-btn" data-atab="likes">❤️ Likers</button>
        </div>

        <div id="analyticsList" style="display: flex; flex-direction: column; gap: 8px;"></div>
      </div>
    </div>
  </div>

  <!-- Global Hub Stats Modal & Leaderboards -->
  <div class="modal-overlay" id="globalStatsModal">
    <div class="modal-content" style="max-width: 560px;">
      <div class="modal-header">
        <h3 class="modal-title">📊 Hub Analytics & Leaderboards</h3>
        <button class="modal-close" id="btnGlobalStatsClose">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div class="stat-card">
            <div class="stat-value" id="gStatUsers">0</div>
            <div class="stat-label">👥 Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="gStatPosts">0</div>
            <div class="stat-label">📄 Total Posts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #4ade80;" id="gStatPublished">0</div>
            <div class="stat-label">🟢 Published</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #fbbf24;" id="gStatDrafts">0</div>
            <div class="stat-label">🟡 Drafts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #c084fc;" id="gStatScheduled">0</div>
            <div class="stat-label">🟣 Scheduled</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #f59e0b;" id="gStatFeatured">0</div>
            <div class="stat-label">⭐ Featured</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #38bdf8;" id="gStatViews">0</div>
            <div class="stat-label">👁️ Total Views</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #a78bfa;" id="gStatAccesses">0</div>
            <div class="stat-label">📥 File Accesses</div>
          </div>
        </div>

        <!-- Top Popular Posts Leaderboard -->
        <div class="leaderboard-section">
          <div class="leaderboard-title">🔥 Top 5 Most Popular Posts (Views)</div>
          <div id="topViewsLeaderboard"></div>
        </div>

        <!-- Top Liked Posts Leaderboard -->
        <div class="leaderboard-section">
          <div class="leaderboard-title">❤️ Top 5 Most Liked Posts</div>
          <div id="topLikesLeaderboard"></div>
        </div>

        <button class="btn btn-secondary" style="width: 100%;" id="btnRefreshHubStats">
          🔄 Refresh Statistics
        </button>
      </div>
    </div>
  </div>

  <!-- Edit Post Modal -->
  <div class="modal-overlay" id="editPostModal">
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title">✏️ Edit Post</h3>
        <button class="modal-close" id="btnEditPostClose">&times;</button>
      </div>
      <div class="modal-body">
        <form id="editPostForm" style="display: flex; flex-direction: column; gap: 12px;">
          <input type="hidden" id="editPostId" />
          
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Title</label>
            <input type="text" id="editPostTitle" class="comment-input" style="width: 100%;" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Category</label>
              <input type="text" id="editPostCategory" class="comment-input" style="width: 100%;" placeholder="e.g. Movies, Courses" />
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Tags</label>
              <input type="text" id="editPostTags" class="comment-input" style="width: 100%;" placeholder="e.g. #hd, #notes" />
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Preview Image URL</label>
            <input type="url" id="editPostImage" class="comment-input" style="width: 100%;" placeholder="https://example.com/image.jpg" />
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Direct Download / External Link</label>
            <input type="url" id="editPostLink" class="comment-input" style="width: 100%;" placeholder="https://mega.nz/... or https://drive.google.com/..." />
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Button Label</label>
            <input type="text" id="editPostLinkLabel" class="comment-input" style="width: 100%;" placeholder="e.g. Download HD Pack" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Status</label>
              <select id="editPostStatus" class="comment-input" style="width: 100%; background: #1e293b; color: #fff;">
                <option value="published">🟢 Published</option>
                <option value="draft">🟡 Draft</option>
                <option value="scheduled">🟣 Scheduled</option>
              </select>
            </div>
            
            <div id="editScheduledGroup" style="display: none;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Publish Date (UTC)</label>
              <input type="datetime-local" id="editPostScheduledAt" class="comment-input" style="width: 100%;" />
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <input type="checkbox" id="editPostPromoted" style="width: 18px; height: 18px; cursor: pointer;" />
            <label for="editPostPromoted" style="font-size: 0.88rem; font-weight: 600; cursor: pointer;">⭐ Feature / Pin to Top</label>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="submit" class="btn btn-primary" style="flex: 1;" id="btnSavePostEdit">
              💾 Save Changes
            </button>
            <button type="button" class="btn btn-ghost" style="color: #f87171;" id="btnDeleteFromEdit">
              🗑️ Delete Post
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Hub Settings Modal (Admin Only) -->
  <div class="modal-overlay" id="hubSettingsModal">
    <div class="modal-content" style="max-width: 580px;">
      <div class="modal-header">
        <h3 class="modal-title">⚙️ Hub Settings & Monetization</h3>
        <button class="modal-close" id="btnSettingsClose">&times;</button>
      </div>
      <div class="modal-body">
        <form id="settingsForm" style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- 1. Referrals & Points Section -->
          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--card-border);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">🎁 Referral & Points System</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Users earn points for inviting new users via deep link.</div>
              </div>
              <input type="checkbox" id="setReferralEnabled" style="width: 20px; height: 20px;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Points Awarded Per Referral</label>
              <input type="number" id="setReferralPoints" class="comment-input" style="width: 100%;" min="1" />
            </div>
          </div>

          <!-- 2. Monetized Shorteners Section -->
          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--card-border);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">🔗 Monetized Shortener Locker (CPM)</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Require users to verify short link before downloading files.</div>
              </div>
              <input type="checkbox" id="setShortenerEnabled" style="width: 20px; height: 20px;" />
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Pass Type</label>
                <select id="setShortenerMode" class="comment-input" style="width: 100%; background: #1e293b;">
                  <option value="time">⏱️ Time Based (Hours)</option>
                  <option value="count">📦 Post Count</option>
                </select>
              </div>
              <div id="shortenerDurationGroup">
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Pass Duration (Hours)</label>
                <input type="number" id="setShortenerHours" class="comment-input" style="width: 100%;" min="1" value="24" />
              </div>
              <div id="shortenerCountGroup" style="display: none;">
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Number of Posts</label>
                <input type="number" id="setShortenerCount" class="comment-input" style="width: 100%;" min="1" value="5" />
              </div>
            </div>

            <div style="margin-bottom: 10px;">
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Shortener API URL (Optional e.g. https://gplinks.com/api)</label>
              <input type="url" id="setShortenerApiUrl" class="comment-input" style="width: 100%;" placeholder="https://..." />
            </div>
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Shortener API Key (Optional)</label>
              <input type="text" id="setShortenerApiKey" class="comment-input" style="width: 100%;" placeholder="API Key" />
            </div>
          </div>

          <!-- 3. In-App Banner Section -->
          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--card-border);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">🖼️ In-App Sponsor Banner</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Display custom native ad banner in the Mini App feed.</div>
              </div>
              <input type="checkbox" id="setBannerEnabled" style="width: 20px; height: 20px;" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input type="text" id="setBannerTitle" class="comment-input" placeholder="Banner Title / Brand Name" />
              <input type="text" id="setBannerText" class="comment-input" placeholder="Short Promo Description" />
              <input type="url" id="setBannerImage" class="comment-input" placeholder="Banner Image Icon URL" />
              <input type="url" id="setBannerLink" class="comment-input" placeholder="Target Destination URL" />
            </div>
          </div>

          <!-- 4. Force Join Channels Section -->
          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--card-border);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">📢 Force Join Channels & Groups</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Users must join these before accessing posts.</div>
              </div>
              <input type="checkbox" id="setForceJoinEnabled" style="width: 20px; height: 20px;" />
            </div>

            <div id="forceChannelsList" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;"></div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
              <input type="text" id="newChannelId" class="comment-input" placeholder="Chat ID (-100...)" />
              <input type="text" id="newChannelTitle" class="comment-input" placeholder="Channel Name" />
            </div>
            <div style="display: flex; gap: 6px;">
              <input type="url" id="newChannelLink" class="comment-input" placeholder="Invite Link (https://t.me/...)" />
              <button type="button" class="btn btn-secondary btn-sm" id="btnAddForceChannel">➕ Add</button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 6px;" id="btnSaveSettings">
            💾 Save Settings
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- Broadcast Announcement Modal (Admin Only) -->
  <div class="modal-overlay" id="broadcastModal">
    <div class="modal-content" style="max-width: 520px;">
      <div class="modal-header">
        <h3 class="modal-title">📢 Broadcast Announcement</h3>
        <button class="modal-close" id="btnBroadcastClose">&times;</button>
      </div>
      <div class="modal-body">
        <form id="broadcastForm" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Message Text (Markdown)</label>
            <textarea id="broadcastMsgText" class="comment-input" style="width: 100%; min-height: 100px; resize: vertical;" placeholder="Write message to send to all users..." required></textarea>
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Photo URL (Optional)</label>
            <input type="url" id="broadcastPhotoUrl" class="comment-input" style="width: 100%;" placeholder="https://example.com/banner.jpg" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Button Label (Optional)</label>
              <input type="text" id="broadcastBtnLabel" class="comment-input" style="width: 100%;" placeholder="e.g. Open Post" />
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted);">Button URL (Optional)</label>
              <input type="url" id="broadcastBtnLink" class="comment-input" style="width: 100%;" placeholder="https://..." />
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;" id="btnSubmitBroadcast">
            🚀 Send Broadcast to All Users
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- Referral Modal for Users -->
  <div class="modal-overlay" id="referralModal">
    <div class="modal-content" style="max-width: 450px;">
      <div class="modal-header">
        <h3 class="modal-title">🎁 Invite Friends & Earn Points</h3>
        <button class="modal-close" id="btnReferralClose">&times;</button>
      </div>
      <div class="modal-body" style="text-align: center;">
        <div style="font-size: 44px; margin-bottom: 8px;">🪙</div>
        <h3 style="margin-bottom: 6px;">Earn Free Points</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Share your referral link with friends. When they open the bot, you will automatically earn bonus points!
        </p>
        
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 12px; margin-bottom: 16px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Your Personal Invite Link:</div>
          <div id="refLinkText" style="font-size: 0.85rem; font-weight: 700; color: var(--primary); word-break: break-all;"></div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" style="flex: 1;" id="btnCopyRefLink">📋 Copy Link</button>
          <a class="btn btn-telegram" style="flex: 1;" id="btnShareTelegram" target="_blank">✈️ Share</a>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast">Message</div>

  <script>
    const API_BASE_URL = window.location.origin;
    const BOT_USERNAME = '${botUsername}';
    const ADMIN_ID = '${adminId}';

    let currentUser = null;
    let isAdmin = false;
    let appSettings = {};
    let allPosts = [];
    let activeNav = 'all'; // 'all', 'popular', 'saved'
    let currentAdminFilter = 'all';
    let currentCategory = 'All';
    let currentSort = 'latest';
    let currentModalPostId = null;
    let currentAnalyticsData = null;
    let currentAnalyticsTab = 'views';

    async function init() {
      // 1. Initialize Telegram WebApp User
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser && tgUser.id) {
          currentUser = {
            id: tgUser.id,
            first_name: tgUser.first_name || '',
            last_name: tgUser.last_name || '',
            username: tgUser.username || tgUser.first_name || 'User'
          };
          localStorage.setItem('tg_user', JSON.stringify(currentUser));
        }
      }

      if (!currentUser) {
        const saved = localStorage.getItem('tg_user');
        if (saved) {
          try { currentUser = JSON.parse(saved); } catch (e) {}
        }
      }

      checkAdminStatus();
      await loadAppSettings();
      renderAuthUI();
      loadPosts();
      setupEventListeners();
    }

    function checkAdminStatus() {
      if (currentUser && ADMIN_ID && String(currentUser.id) === String(ADMIN_ID)) {
        isAdmin = true;
        document.getElementById('adminTabsBar').style.display = 'flex';
      }
    }

    async function loadAppSettings() {
      try {
        const userParam = currentUser ? \`?user_id=\${currentUser.id}\` : '';
        const res = await fetch(\`\${API_BASE_URL}/api/settings\${userParam}\`);
        if (res.ok) {
          const data = await res.json();
          appSettings = data.settings || {};
          if (data.user && currentUser) {
            currentUser.points = data.user.points || 0;
            currentUser.referral_count = data.user.referral_count || 0;
          }
          renderSponsoredBanner();
          if (appSettings.referral_enabled) {
            document.getElementById('btnReferralInvite').style.display = 'inline-flex';
          }
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    }

    function renderSponsoredBanner() {
      const container = document.getElementById('sponsorBannerContainer');
      if (appSettings.banner_enabled && appSettings.banner_title && appSettings.banner_link) {
        container.innerHTML = \`
          <a href="\${escapeHtml(appSettings.banner_link)}" target="_blank" class="sponsored-banner-card">
            <span class="sponsor-tag">Sponsored</span>
            \${appSettings.banner_image ? \`<img src="\${escapeHtml(appSettings.banner_image)}" class="sponsor-img" alt="Sponsor" />\` : ''}
            <div class="sponsor-content">
              <div class="sponsor-title">\${escapeHtml(appSettings.banner_title)}</div>
              <div class="sponsor-desc">\${escapeHtml(appSettings.banner_text || 'Tap to learn more & explore exclusive sponsor deals.')}</div>
            </div>
            <div style="font-size: 1.2rem; color: var(--primary);">↗</div>
          </a>
        \`;
      } else {
        container.innerHTML = '';
      }
    }

    window.onTelegramAuth = function(user) {
      currentUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || '',
        username: user.username || user.first_name,
        points: 0
      };
      localStorage.setItem('tg_user', JSON.stringify(currentUser));
      checkAdminStatus();
      loadAppSettings().then(() => {
        renderAuthUI();
        loadPosts();
      });
      showToast('Welcome, ' + currentUser.first_name + '!');
    };

    function renderAuthUI() {
      const authArea = document.getElementById('authArea');
      if (currentUser) {
        const showPoints = Boolean(appSettings.referral_enabled);
        authArea.innerHTML = \`
          \${showPoints ? \`<div class="points-badge" id="btnHeaderPoints" title="Your Points">🪙 \${currentUser.points || 0} pts</div>\` : ''}
          \${isAdmin ? '<span class="admin-badge">👑 Admin</span>' : ''}
          <div class="user-profile-badge">
            <div class="user-avatar">\${(currentUser.first_name || 'U')[0].toUpperCase()}</div>
            <span>\${escapeHtml(currentUser.first_name)}</span>
          </div>
        \`;
        if (showPoints) {
          document.getElementById('btnHeaderPoints')?.addEventListener('click', openReferralModal);
        }
      } else {
        authArea.innerHTML = \`
          <button class="btn btn-telegram" id="btnLogin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            Login
          </button>
        \`;
        document.getElementById('btnLogin').addEventListener('click', promptTelegramLogin);
      }
    }

    function promptTelegramLogin() {
      const name = prompt("Enter your Telegram Username or Name:");
      if (name && name.trim()) {
        const mockId = Math.floor(10000000 + Math.random() * 90000000);
        window.onTelegramAuth({
          id: mockId,
          first_name: name.trim(),
          username: name.trim()
        });
      }
    }

    // =========================================================
    // POSTS LOADING & FILTERING
    // =========================================================
    async function loadPosts() {
      const feed = document.getElementById('postsFeed');
      
      feed.innerHTML = Array(4).fill(0).map(() => \`
        <div class="post-card">
          <div class="post-image-container skeleton"></div>
          <div class="post-body">
            <div class="skeleton" style="height: 20px; width: 80%; margin-bottom: 10px;"></div>
            <div class="skeleton" style="height: 14px; width: 40%; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 32px; width: 100%; margin-top: auto;"></div>
          </div>
        </div>
      \`).join('');

      try {
        let endpoint = '';
        if (activeNav === 'saved' && currentUser) {
          endpoint = \`\${API_BASE_URL}/api/saved-posts?user_id=\${currentUser.id}\`;
        } else if (isAdmin) {
          endpoint = \`\${API_BASE_URL}/api/admin/posts?user_id=\${currentUser.id}\`;
        } else {
          const userQuery = currentUser ? \`?user_id=\${currentUser.id}\` : '';
          endpoint = \`\${API_BASE_URL}/api/posts\${userQuery}\`;
        }

        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || \`HTTP \${res.status}\`);
        }
        
        allPosts = data.posts || [];
        filterAndRenderPosts();

        // Track view impressions
        if (currentUser && !isAdmin && activeNav !== 'saved') {
          allPosts.forEach(p => {
            fetch(\`\${API_BASE_URL}/api/posts/\${p.id}/view\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: currentUser.id,
                username: currentUser.username,
                first_name: currentUser.first_name
              })
            }).catch(() => {});
          });
        }
      } catch (err) {
        console.error('Failed to load posts:', err);
        feed.innerHTML = \`
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">⚡</div>
            <h3>Could not load posts</h3>
            <p style="margin-top: 6px; font-size: 0.9rem; color: #f87171;">\${escapeHtml(err.message)}</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="loadPosts()">Retry</button>
          </div>
        \`;
      }
    }

    function filterAndRenderPosts() {
      let posts = [...allPosts];

      // Admin Status Filter
      if (isAdmin && currentAdminFilter !== 'all') {
        posts = posts.filter(p => p.status === currentAdminFilter);
      }

      // Category Filter
      if (currentCategory !== 'All') {
        posts = posts.filter(p => (p.category || 'All').toLowerCase() === currentCategory.toLowerCase());
      }

      // Search Query Filter
      const query = document.getElementById('searchInput').value.toLowerCase().trim();
      if (query) {
        posts = posts.filter(p => 
          (p.title || '').toLowerCase().includes(query) || 
          (p.tags || '').toLowerCase().includes(query)
        );
      }

      // Sort
      if (activeNav === 'popular' || currentSort === 'popular') {
        posts.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      } else if (currentSort === 'likes') {
        posts.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      } else {
        // Latest (with promoted pinned to top)
        posts.sort((a, b) => {
          if (Boolean(b.is_promoted) !== Boolean(a.is_promoted)) {
            return b.is_promoted ? 1 : -1;
          }
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
      }

      renderPosts(posts);
    }

    function renderPosts(posts) {
      const feed = document.getElementById('postsFeed');
      
      if (!posts || posts.length === 0) {
        feed.innerHTML = \`
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">\${activeNav === 'saved' ? '🔖' : '📭'}</div>
            <h3>\${activeNav === 'saved' ? 'No Saved Posts Yet' : 'No Posts Found'}</h3>
            <p style="margin-top: 6px;">\${activeNav === 'saved' ? 'Tap the bookmark icon on any post to save it here.' : 'New posts will appear here live.'}</p>
          </div>
        \`;
        return;
      }

      feed.innerHTML = posts.map(post => {
        const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : '';

        const botLink = \`https://t.me/\${BOT_USERNAME}?start=post_\${post.id}\`;
        const hasImage = Boolean(post.preview_image);
        const isPromoted = Boolean(post.is_promoted);
        const isSaved = Boolean(post.is_saved);

        return \`
          <div class="post-card \${isPromoted ? 'is-promoted' : ''}" data-id="\${post.id}">
            <!-- Full Image with Ambient Blurred Backdrop -->
            <div class="post-image-container">
              <div class="post-badges-top">
                \${isPromoted ? '<span class="post-status-badge status-promoted">⭐ Featured</span>' : '<span></span>'}
                <div style="display: flex; gap: 4px;">
                  \${(isAdmin && post.status === 'draft') ? '<span class="post-status-badge status-draft">📝 Draft</span>' : ''}
                  \${(isAdmin && post.status === 'scheduled') ? '<span class="post-status-badge status-scheduled">⏰ Scheduled</span>' : ''}
                  \${(post.category && post.category !== 'All') ? \`<span class="category-badge-card">\${escapeHtml(post.category)}</span>\` : ''}
                </div>
              </div>
              
              \${hasImage ? \`
                <div class="post-image-backdrop" style="background-image: url('\${escapeHtml(post.preview_image)}');"></div>
                <img src="\${escapeHtml(post.preview_image)}" class="post-image-fg" alt="\${escapeHtml(post.title)}" onerror="this.style.display='none';" />
              \` : \`
                <div class="post-image-placeholder">📂</div>
              \`}
            </div>

            <div class="post-body">
              \${isAdmin ? \`
                <div class="admin-card-actions">
                  <button class="admin-btn" onclick="openEditPostModal(\${post.id})">
                    ✏️ Edit
                  </button>
                  <button class="admin-btn admin-btn-promote" onclick="togglePromote(\${post.id}, \${!isPromoted})">
                    \${isPromoted ? '⭐ Unfeature' : '⭐ Promote'}
                  </button>
                  <button class="admin-btn" onclick="openAnalyticsModal(\${post.id}, '\${escapeHtml(post.title)}')">
                    📊 Stats (\${post.view_count || 0})
                  </button>
                  <button class="admin-btn admin-btn-delete" onclick="deletePostItem(\${post.id}, '\${escapeHtml(post.title)}')">
                    🗑️ Delete
                  </button>
                </div>
              \` : ''}

              <h2 class="post-title">\${escapeHtml(post.title)}</h2>
              <div class="post-meta">
                <span>📅 \${dateStr}</span>
                <span>• 👁️ \${post.view_count || 0} views</span>
              </div>

              <div class="post-actions-row">
                <div class="social-counters">
                  <!-- Like Button -->
                  <button class="action-btn btn-like \${post.liked ? 'liked' : ''}" onclick="handleLikeClick(\${post.id}, this)" title="Like">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span class="like-count">\${post.like_count || 0}</span>
                  </button>

                  <!-- Comments Button -->
                  <button class="action-btn" onclick="openCommentsModal(\${post.id})" title="Comments">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>\${post.comment_count || 0}</span>
                  </button>

                  <!-- Save Bookmark Button -->
                  <button class="action-btn btn-save \${isSaved ? 'saved' : ''}" onclick="handleSaveClick(\${post.id}, this)" title="Save Post">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  </button>
                </div>

                <div class="post-buttons-group">
                  \${post.direct_link ? \`
                    <a href="\${escapeHtml(post.direct_link)}" target="_blank" class="btn-direct-link" onclick="trackLinkClick(\${post.id}, '\${escapeHtml(post.direct_link_title || 'Direct Link')}')">
                      <span>\${escapeHtml(post.direct_link_title || '🔗 Link')}</span>
                    </a>
                  \` : ''}

                  <a href="\${botLink}" target="_blank" class="btn-open-bot">
                    <span>Open in Bot</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function trackLinkClick(postId, linkTitle) {
      if (!currentUser) return;
      fetch(\`\${API_BASE_URL}/api/posts/\${postId}/access-log\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: linkTitle,
          user_id: currentUser.id,
          username: currentUser.username,
          first_name: currentUser.first_name
        })
      }).catch(() => {});
    }

    // =========================================================
    // LIKE & BOOKMARK HANDLERS
    // =========================================================
    async function handleLikeClick(postId, btnElement) {
      if (!currentUser) {
        showToast('Please login to like this post!');
        promptTelegramLogin();
        return;
      }

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/likes\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: postId,
            user_id: currentUser.id
          })
        });

        if (!res.ok) throw new Error('Failed to toggle like');
        const data = await res.json();

        const countSpan = btnElement.querySelector('.like-count');
        if (countSpan) countSpan.textContent = data.like_count;
        
        if (data.liked) {
          btnElement.classList.add('liked');
        } else {
          btnElement.classList.remove('liked');
        }

        const post = allPosts.find(p => p.id === postId);
        if (post) {
          post.liked = data.liked;
          post.like_count = data.like_count;
        }

      } catch (err) {
        console.error('Like error:', err);
        showToast('Error updating like.');
      }
    }

    async function handleSaveClick(postId, btnElement) {
      if (!currentUser) {
        showToast('Please login to bookmark posts!');
        promptTelegramLogin();
        return;
      }

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/posts/\${postId}/save\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id })
        });

        if (!res.ok) throw new Error('Failed to toggle bookmark');
        const data = await res.json();

        if (data.saved) {
          btnElement.classList.add('saved');
          showToast('🔖 Saved to your bookmarks!');
        } else {
          btnElement.classList.remove('saved');
          showToast('Bookmark removed.');
        }

        const post = allPosts.find(p => p.id === postId);
        if (post) post.is_saved = data.saved;

        if (activeNav === 'saved') {
          loadPosts();
        }

      } catch (err) {
        console.error('Save error:', err);
        showToast('Error saving post.');
      }
    }

    // =========================================================
    // ADMIN ACTIONS (Promote, Status, Delete, Moderation)
    // =========================================================
    async function togglePromote(postId, isPromoted) {
      if (!isAdmin) return;
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}/promote\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id, is_promoted: isPromoted })
        });
        if (!res.ok) throw new Error('Promote failed');
        showToast(isPromoted ? '⭐ Post Featured & Pinned!' : 'Post unpromoted');
        loadPosts();
      } catch (e) {
        showToast('Error updating promotion');
      }
    }

    async function deletePostItem(postId, title) {
      if (!isAdmin) return;
      if (!confirm(\`⚠️ Are you sure you want to permanently delete "\${title || 'this post'}"?\nThis cannot be undone.\`)) return;
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}?user_id=\${currentUser.id}\`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');
        showToast('🗑️ Post deleted successfully!');
        loadPosts();
      } catch (e) {
        showToast('Error deleting post');
      }
    }

    async function moderateCommentAction(commentId, action) {
      if (!isAdmin) return;
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/comments/moderate\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment_id: commentId, user_id: currentUser.id, action })
        });
        if (!res.ok) throw new Error('Moderation failed');
        showToast(\`Comment \${action === 'delete' ? 'deleted' : action === 'hide' ? 'hidden' : 'visible'}!\`);
        openCommentsModal(currentModalPostId);
        loadPosts();
      } catch (e) {
        showToast('Error moderating comment');
      }
    }

    // =========================================================
    // ADMIN ANALYTICS MODAL
    // =========================================================
    async function openAnalyticsModal(postId, postTitle) {
      if (!isAdmin) return;
      const modal = document.getElementById('analyticsModal');
      const titleEl = document.getElementById('analyticsPostTitle');
      const listEl = document.getElementById('analyticsList');

      modal.classList.add('active');
      titleEl.textContent = 'Analytics: ' + postTitle;
      listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading stats...</div>';

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}/analytics?user_id=\${currentUser.id}\`);
        if (!res.ok) throw new Error('Failed to load analytics');

        const data = await res.json();
        currentAnalyticsData = data.analytics;

        document.getElementById('statViews').textContent = (currentAnalyticsData.views || []).length;
        document.getElementById('statAccesses').textContent = (currentAnalyticsData.accesses || []).length;
        document.getElementById('statLikes').textContent = (currentAnalyticsData.likes || []).length;

        renderAnalyticsTabContent();
      } catch (e) {
        listEl.innerHTML = '<div style="color: #f87171; text-align: center;">Failed to load analytics.</div>';
      }
    }

    function renderAnalyticsTabContent() {
      const listEl = document.getElementById('analyticsList');
      if (!currentAnalyticsData) return;

      if (currentAnalyticsTab === 'views') {
        const views = currentAnalyticsData.views || [];
        if (views.length === 0) {
          listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No view logs recorded yet.</div>';
          return;
        }
        listEl.innerHTML = views.map(v => \`
          <div class="log-item">
            <div class="log-user-info">
              <span style="font-weight: 700; color: var(--primary);">👤 \${escapeHtml(v.first_name || 'User')}</span>
              \${v.username ? \`<span style="color: var(--text-muted);">(@\${escapeHtml(v.username)})</span>\` : ''}
            </div>
            <span style="color: var(--text-muted); font-size: 0.72rem;">\${new Date(v.viewed_at).toLocaleString()}</span>
          </div>
        \`).join('');
      } else if (currentAnalyticsTab === 'accesses') {
        const accesses = currentAnalyticsData.accesses || [];
        if (accesses.length === 0) {
          listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No downloads or link clicks recorded yet.</div>';
          return;
        }
        listEl.innerHTML = accesses.map(a => \`
          <div class="log-item">
            <div>
              <div class="log-user-info">
                <span style="font-weight: 700; color: #4ade80;">📥 \${escapeHtml(a.first_name || 'User')}</span>
                \${a.username ? \`<span style="color: var(--text-muted);">(@\${escapeHtml(a.username)})</span>\` : ''}
              </div>
              <div style="font-size: 0.75rem; color: #cbd5e1; margin-top: 2px;">Item: <b>\${escapeHtml(a.item_name)}</b></div>
            </div>
            <span style="color: var(--text-muted); font-size: 0.72rem;">\${new Date(a.accessed_at).toLocaleString()}</span>
          </div>
        \`).join('');
      } else if (currentAnalyticsTab === 'likes') {
        const likes = currentAnalyticsData.likes || [];
        if (likes.length === 0) {
          listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No likes yet.</div>';
          return;
        }
        listEl.innerHTML = likes.map(l => \`
          <div class="log-item">
            <div class="log-user-info">
              <span style="font-weight: 700; color: var(--accent-heart);">❤️ \${escapeHtml(l.first_name || 'User')}</span>
              \${l.username ? \`<span style="color: var(--text-muted);">(@\${escapeHtml(l.username)})</span>\` : ''}
            </div>
            <span style="color: var(--text-muted); font-size: 0.72rem;">\${new Date(l.created_at).toLocaleString()}</span>
          </div>
        \`).join('');
      }
    }

    // =========================================================
    // COMMENTS MODAL HANDLERS
    // =========================================================
    async function openCommentsModal(postId) {
      currentModalPostId = postId;
      const modal = document.getElementById('commentsModal');
      const commentsList = document.getElementById('commentsList');
      const modalTitle = document.getElementById('modalPostTitle');
      const foldersContainer = document.getElementById('foldersContainer');

      modal.classList.add('active');
      modalTitle.textContent = 'Post Details & Comments';
      commentsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading comments...</div>';

      try {
        const userIdParam = currentUser ? \`?user_id=\${currentUser.id}\` : '';
        const res = await fetch(\`\${API_BASE_URL}/api/posts/\${postId}\${userIdParam}\`);
        if (!res.ok) throw new Error('Failed to fetch post details');

        const data = await res.json();
        const post = data.post;
        modalTitle.textContent = post.title;

        if (post.folders && post.folders.length > 0) {
          foldersContainer.style.display = 'block';
          foldersContainer.innerHTML = \`
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;">Available Content Folders:</div>
            <div class="folders-badge-container">
              \${post.folders.map(f => \`<span class="folder-badge">📁 \${escapeHtml(f.name)} (\${f.files ? f.files.length : 0} items)</span>\`).join('')}
            </div>
          \`;
        } else {
          foldersContainer.style.display = 'none';
        }

        renderCommentsList(post.comments || []);
      } catch (err) {
        console.error('Failed to load comments:', err);
        commentsList.innerHTML = '<div style="color: #f87171; text-align: center; padding: 10px;">Failed to load comments.</div>';
      }
    }

    function renderCommentsList(comments) {
      const commentsList = document.getElementById('commentsList');
      if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No comments yet. Be the first to leave a comment!</div>';
        return;
      }

      commentsList.innerHTML = comments.map(c => {
        const timeStr = c.created_at ? new Date(c.created_at).toLocaleString() : '';
        return \`
          <div class="comment-item \${c.is_hidden ? 'is-hidden' : ''}">
            <div class="comment-author">
              <span class="comment-username">@\${escapeHtml(c.username)} \${c.is_hidden ? '<span style="color:#f87171; font-size:0.75rem;">(Hidden from users)</span>' : ''}</span>
              <span class="comment-time">\${timeStr}</span>
            </div>
            <div class="comment-text">\${escapeHtml(c.text)}</div>
            
            \${isAdmin ? \`
              <div class="comment-admin-actions">
                <button class="comment-mod-btn" onclick="moderateCommentAction(\${c.id}, '\${c.is_hidden ? 'unhide' : 'hide'}')">
                  \${c.is_hidden ? '👁️ Unhide' : '🚫 Hide'}
                </button>
                <button class="comment-mod-btn" style="color: #f87171;" onclick="moderateCommentAction(\${c.id}, 'delete')">
                  🗑️ Delete
                </button>
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }

    // =========================================================
    // GLOBAL HUB STATS MODAL & LEADERBOARD
    // =========================================================
    async function openGlobalStatsModal() {
      if (!isAdmin || !currentUser) return;
      const modal = document.getElementById('globalStatsModal');
      modal.classList.add('active');

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/stats?user_id=\${currentUser.id}\`);
        if (!res.ok) throw new Error('Failed to load stats');
        const data = await res.json();
        const s = data.stats || {};

        document.getElementById('gStatUsers').textContent = s.total_users || 0;
        document.getElementById('gStatPosts').textContent = s.total_posts || 0;
        document.getElementById('gStatPublished').textContent = s.published_posts || 0;
        document.getElementById('gStatDrafts').textContent = s.draft_posts || 0;
        document.getElementById('gStatScheduled').textContent = s.scheduled_posts || 0;
        document.getElementById('gStatFeatured').textContent = s.promoted_posts || 0;
        document.getElementById('gStatViews').textContent = s.total_views || 0;
        document.getElementById('gStatAccesses').textContent = s.total_file_accesses || 0;

        // Render Leaderboards
        const sortedByViews = [...allPosts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
        document.getElementById('topViewsLeaderboard').innerHTML = sortedByViews.length ? sortedByViews.map((p, i) => \`
          <div class="leaderboard-item">
            <span>\${i + 1}. \${escapeHtml(p.title)}</span>
            <span style="color: var(--primary); font-weight: 700;">👁️ \${p.view_count || 0}</span>
          </div>
        \`).join('') : '<div style="color: var(--text-muted); font-size: 0.8rem;">No view data yet.</div>';

        const sortedByLikes = [...allPosts].sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 5);
        document.getElementById('topLikesLeaderboard').innerHTML = sortedByLikes.length ? sortedByLikes.map((p, i) => \`
          <div class="leaderboard-item">
            <span>\${i + 1}. \${escapeHtml(p.title)}</span>
            <span style="color: var(--accent-heart); font-weight: 700;">❤️ \${p.like_count || 0}</span>
          </div>
        \`).join('') : '<div style="color: var(--text-muted); font-size: 0.8rem;">No like data yet.</div>';

      } catch (err) {
        showToast('Error loading stats: ' + err.message);
      }
    }

    // =========================================================
    // EDIT POST MODAL
    // =========================================================
    function openEditPostModal(postId) {
      if (!isAdmin) return;
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;

      document.getElementById('editPostId').value = post.id;
      document.getElementById('editPostTitle').value = post.title || '';
      document.getElementById('editPostCategory').value = post.category || 'All';
      document.getElementById('editPostTags').value = post.tags || '';
      document.getElementById('editPostImage').value = post.preview_image || '';
      document.getElementById('editPostLink').value = post.direct_link || '';
      document.getElementById('editPostLinkLabel').value = post.direct_link_title || '';
      document.getElementById('editPostStatus').value = post.status || 'published';
      document.getElementById('editPostPromoted').checked = Boolean(post.is_promoted);

      const schedGroup = document.getElementById('editScheduledGroup');
      if (post.status === 'scheduled') {
        schedGroup.style.display = 'block';
        if (post.scheduled_at) {
          try {
            document.getElementById('editPostScheduledAt').value = new Date(post.scheduled_at).toISOString().slice(0, 16);
          } catch (e) {}
        }
      } else {
        schedGroup.style.display = 'none';
      }

      document.getElementById('editPostModal').classList.add('active');
    }

    async function submitEditPostForm(e) {
      e.preventDefault();
      if (!isAdmin || !currentUser) return;

      const postId = document.getElementById('editPostId').value;
      const title = document.getElementById('editPostTitle').value.trim();
      const category = document.getElementById('editPostCategory').value.trim() || 'All';
      const tags = document.getElementById('editPostTags').value.trim();
      const preview_image = document.getElementById('editPostImage').value.trim();
      const direct_link = document.getElementById('editPostLink').value.trim();
      const direct_link_title = document.getElementById('editPostLinkLabel').value.trim();
      const status = document.getElementById('editPostStatus').value;
      const is_promoted = document.getElementById('editPostPromoted').checked;
      const scheduledVal = document.getElementById('editPostScheduledAt').value;

      let scheduled_at = null;
      if (status === 'scheduled' && scheduledVal) {
        scheduled_at = new Date(scheduledVal).toISOString();
      }

      const saveBtn = document.getElementById('btnSavePostEdit');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/posts/\${postId}/edit\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            title,
            category,
            tags,
            preview_image,
            direct_link,
            direct_link_title,
            status,
            scheduled_at,
            is_promoted
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update post');
        }

        showToast('✅ Post updated successfully!');
        document.getElementById('editPostModal').classList.remove('active');
        loadPosts();
      } catch (err) {
        showToast('⚠️ ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Changes';
      }
    }

    // =========================================================
    // HUB SETTINGS MODAL (Admin Only)
    // =========================================================
    async function openSettingsModal() {
      if (!isAdmin || !currentUser) return;
      const modal = document.getElementById('hubSettingsModal');
      modal.classList.add('active');

      document.getElementById('setReferralEnabled').checked = Boolean(appSettings.referral_enabled);
      document.getElementById('setReferralPoints').value = appSettings.referral_points || 10;
      document.getElementById('setShortenerEnabled').checked = Boolean(appSettings.shortener_enabled);
      document.getElementById('setShortenerMode').value = appSettings.shortener_mode || 'time';
      document.getElementById('setShortenerHours').value = appSettings.shortener_duration_hours || 24;
      document.getElementById('setShortenerCount').value = appSettings.shortener_posts_count || 5;
      document.getElementById('setShortenerApiUrl').value = appSettings.shortener_api_url || '';
      document.getElementById('setShortenerApiKey').value = appSettings.shortener_api_key || '';
      document.getElementById('setBannerEnabled').checked = Boolean(appSettings.banner_enabled);
      document.getElementById('setBannerTitle').value = appSettings.banner_title || '';
      document.getElementById('setBannerText').value = appSettings.banner_text || '';
      document.getElementById('setBannerImage').value = appSettings.banner_image || '';
      document.getElementById('setBannerLink').value = appSettings.banner_link || '';
      document.getElementById('setForceJoinEnabled').checked = Boolean(appSettings.force_join_enabled);

      toggleShortenerFields();
      loadForceChannelsList();
    }

    function toggleShortenerFields() {
      const mode = document.getElementById('setShortenerMode').value;
      if (mode === 'time') {
        document.getElementById('shortenerDurationGroup').style.display = 'block';
        document.getElementById('shortenerCountGroup').style.display = 'none';
      } else {
        document.getElementById('shortenerDurationGroup').style.display = 'none';
        document.getElementById('shortenerCountGroup').style.display = 'block';
      }
    }

    async function loadForceChannelsList() {
      const container = document.getElementById('forceChannelsList');
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.75rem;">Loading channels...</div>';
      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/force-channels?user_id=\${currentUser.id}\`);
        const data = await res.json();
        const channels = data.channels || [];
        if (channels.length === 0) {
          container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.75rem;">No force-join channels added yet.</div>';
          return;
        }
        container.innerHTML = channels.map(ch => \`
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(30, 41, 59, 0.5); border-radius: 8px;">
            <div>
              <div style="font-size: 0.82rem; font-weight: 700;">\${escapeHtml(ch.channel_title)}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">\${escapeHtml(ch.channel_id)}</div>
            </div>
            <button type="button" class="comment-mod-btn" style="color: #f87171;" onclick="deleteForceChannelItem(\${ch.id})">🗑️</button>
          </div>
        \`).join('');
      } catch (e) {
        container.innerHTML = '<div style="color: #f87171; font-size: 0.75rem;">Failed to load channels.</div>';
      }
    }

    async function deleteForceChannelItem(id) {
      if (!confirm('Remove this channel from force join list?')) return;
      try {
        await fetch(\`\${API_BASE_URL}/api/admin/force-channels/\${id}?user_id=\${currentUser.id}\`, { method: 'DELETE' });
        showToast('Channel removed');
        loadForceChannelsList();
      } catch (e) {
        showToast('Failed to remove channel');
      }
    }

    async function submitSettingsForm(e) {
      e.preventDefault();
      if (!isAdmin || !currentUser) return;

      const newSettings = {
        referral_enabled: document.getElementById('setReferralEnabled').checked,
        referral_points: Number(document.getElementById('setReferralPoints').value) || 10,
        shortener_enabled: document.getElementById('setShortenerEnabled').checked,
        shortener_mode: document.getElementById('setShortenerMode').value,
        shortener_duration_hours: Number(document.getElementById('setShortenerHours').value) || 24,
        shortener_posts_count: Number(document.getElementById('setShortenerCount').value) || 5,
        shortener_api_url: document.getElementById('setShortenerApiUrl').value.trim(),
        shortener_api_key: document.getElementById('setShortenerApiKey').value.trim(),
        banner_enabled: document.getElementById('setBannerEnabled').checked,
        banner_title: document.getElementById('setBannerTitle').value.trim(),
        banner_text: document.getElementById('setBannerText').value.trim(),
        banner_image: document.getElementById('setBannerImage').value.trim(),
        banner_link: document.getElementById('setBannerLink').value.trim(),
        force_join_enabled: document.getElementById('setForceJoinEnabled').checked
      };

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/settings\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id, settings: newSettings })
        });
        if (!res.ok) throw new Error('Failed to save settings');
        showToast('✅ Settings updated successfully!');
        appSettings = newSettings;
        renderSponsoredBanner();
        renderAuthUI();
        document.getElementById('hubSettingsModal').classList.remove('active');
      } catch (err) {
        showToast('⚠️ Error saving settings');
      }
    }

    // =========================================================
    // BROADCAST MODAL (Admin Only)
    // =========================================================
    function openBroadcastModal() {
      if (!isAdmin || !currentUser) return;
      document.getElementById('broadcastModal').classList.add('active');
    }

    async function submitBroadcastForm(e) {
      e.preventDefault();
      if (!isAdmin || !currentUser) return;

      const message = document.getElementById('broadcastMsgText').value.trim();
      const photo_url = document.getElementById('broadcastPhotoUrl').value.trim();
      const button_text = document.getElementById('broadcastBtnLabel').value.trim();
      const button_url = document.getElementById('broadcastBtnLink').value.trim();

      const btn = document.getElementById('btnSubmitBroadcast');
      btn.disabled = true;
      btn.textContent = 'Broadcasting...';

      try {
        const res = await fetch(\`\${API_BASE_URL}/api/admin/broadcast\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            message,
            photo_url,
            button_text,
            button_url
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Broadcast failed');

        showToast(\`📢 Broadcast sent to \${data.sent_count} users!\`);
        document.getElementById('broadcastModal').classList.remove('active');
        document.getElementById('broadcastMsgText').value = '';
      } catch (err) {
        showToast('⚠️ ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Send Broadcast to All Users';
      }
    }

    // =========================================================
    // REFERRAL MODAL FOR USERS
    // =========================================================
    function openReferralModal() {
      if (!currentUser) {
        promptTelegramLogin();
        return;
      }
      const link = \`https://t.me/\${BOT_USERNAME}?start=ref_\${currentUser.id}\`;
      document.getElementById('refLinkText').textContent = link;
      document.getElementById('btnShareTelegram').href = \`https://t.me/share/url?url=\${encodeURIComponent(link)}&text=\${encodeURIComponent('Join ' + BOT_USERNAME + ' to access premium files & content!')}\`;
      document.getElementById('referralModal').classList.add('active');
    }

    // =========================================================
    // EVENT LISTENERS SETUP
    // =========================================================
    function setupEventListeners() {
      // Admin filter tabs
      document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          if (e.target.id === 'btnAdminStatsTab') {
            openGlobalStatsModal();
            return;
          }
          if (e.target.id === 'btnAdminSettingsTab') {
            openSettingsModal();
            return;
          }
          if (e.target.id === 'btnAdminBroadcastTab') {
            openBroadcastModal();
            return;
          }
          document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
          currentAdminFilter = e.target.getAttribute('data-filter');
          filterAndRenderPosts();
        });
      });

      // User Navigation Pills
      document.querySelectorAll('.nav-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          if (e.target.id === 'btnReferralInvite') {
            openReferralModal();
            return;
          }
          document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          activeNav = e.target.getAttribute('data-nav');
          loadPosts();
        });
      });

      // Category Chips
      document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
          e.target.classList.add('active');
          currentCategory = e.target.getAttribute('data-cat');
          filterAndRenderPosts();
        });
      });

      // Sort Select
      document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderPosts();
      });

      // Search Filter
      document.getElementById('searchInput').addEventListener('input', () => {
        filterAndRenderPosts();
      });

      // Refresh Button
      document.getElementById('btnRefresh').addEventListener('click', () => {
        showToast('Refreshing...');
        loadPosts();
      });

      // Analytics Tabs
      document.querySelectorAll('.analytics-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.analytics-tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          currentAnalyticsTab = e.target.getAttribute('data-atab');
          renderAnalyticsTabContent();
        });
      });

      // Hub Stats Refresh
      document.getElementById('btnRefreshHubStats').addEventListener('click', () => {
        showToast('Refreshing stats...');
        openGlobalStatsModal();
      });

      // Modal Close Buttons
      document.getElementById('btnModalClose').addEventListener('click', () => {
        document.getElementById('commentsModal').classList.remove('active');
      });
      document.getElementById('btnAnalyticsClose').addEventListener('click', () => {
        document.getElementById('analyticsModal').classList.remove('active');
      });
      document.getElementById('btnGlobalStatsClose').addEventListener('click', () => {
        document.getElementById('globalStatsModal').classList.remove('active');
      });
      document.getElementById('btnEditPostClose').addEventListener('click', () => {
        document.getElementById('editPostModal').classList.remove('active');
      });
      document.getElementById('btnSettingsClose').addEventListener('click', () => {
        document.getElementById('hubSettingsModal').classList.remove('active');
      });
      document.getElementById('btnBroadcastClose').addEventListener('click', () => {
        document.getElementById('broadcastModal').classList.remove('active');
      });
      document.getElementById('btnReferralClose').addEventListener('click', () => {
        document.getElementById('referralModal').classList.remove('active');
      });

      // Modal Overlay Background Clicks
      ['commentsModal', 'analyticsModal', 'globalStatsModal', 'editPostModal', 'hubSettingsModal', 'broadcastModal', 'referralModal'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('click', (e) => {
          if (e.target.id === id) el.classList.remove('active');
        });
      });

      // Edit Post Form Submit
      document.getElementById('editPostStatus').addEventListener('change', (e) => {
        document.getElementById('editScheduledGroup').style.display = e.target.value === 'scheduled' ? 'block' : 'none';
      });
      document.getElementById('editPostForm').addEventListener('submit', submitEditPostForm);
      document.getElementById('btnDeleteFromEdit').addEventListener('click', () => {
        const id = document.getElementById('editPostId').value;
        const title = document.getElementById('editPostTitle').value;
        if (id) {
          document.getElementById('editPostModal').classList.remove('active');
          deletePostItem(Number(id), title);
        }
      });

      // Settings Form
      document.getElementById('setShortenerMode').addEventListener('change', toggleShortenerFields);
      document.getElementById('settingsForm').addEventListener('submit', submitSettingsForm);
      document.getElementById('btnAddForceChannel').addEventListener('click', async () => {
        const channel_id = document.getElementById('newChannelId').value.trim();
        const channel_title = document.getElementById('newChannelTitle').value.trim();
        const invite_link = document.getElementById('newChannelLink').value.trim();
        if (!channel_id || !channel_title || !invite_link) {
          showToast('Please enter Chat ID, Channel Title, and Invite Link');
          return;
        }
        try {
          const res = await fetch(\`\${API_BASE_URL}/api/admin/force-channels\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id, channel_id, channel_title, invite_link })
          });
          if (!res.ok) throw new Error('Failed to add channel');
          showToast('✅ Channel added to Force Join!');
          document.getElementById('newChannelId').value = '';
          document.getElementById('newChannelTitle').value = '';
          document.getElementById('newChannelLink').value = '';
          loadForceChannelsList();
        } catch (err) {
          showToast('Failed to add channel');
        }
      });

      // Broadcast Form
      document.getElementById('broadcastForm').addEventListener('submit', submitBroadcastForm);

      // Copy Referral Link
      document.getElementById('btnCopyRefLink').addEventListener('click', () => {
        const link = document.getElementById('refLinkText').textContent;
        navigator.clipboard.writeText(link).then(() => showToast('📋 Link copied to clipboard!'));
      });

      // Comment Form Submit
      document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
          showToast('Please login to comment!');
          promptTelegramLogin();
          return;
        }

        const input = document.getElementById('commentTextInput');
        const text = input.value.trim();
        if (!text || !currentModalPostId) return;

        try {
          const res = await fetch(\`\${API_BASE_URL}/api/comments\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: currentModalPostId,
              user_id: currentUser.id,
              username: currentUser.username || currentUser.first_name,
              text
            })
          });

          if (!res.ok) throw new Error('Failed to post comment');
          input.value = '';
          showToast('Comment posted!');
          
          openCommentsModal(currentModalPostId);
          loadPosts();
        } catch (err) {
          console.error('Comment submit error:', err);
          showToast('Error posting comment.');
        }
      });
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
