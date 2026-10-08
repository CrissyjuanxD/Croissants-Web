// Utilidades compartidas por la web y el panel: iconos, texto seguro, markdown y normalización del contenido.

export const SOCIAL_TYPES = {
  twitch: { label: 'Twitch', icon: 'twitch' },
  youtube: { label: 'YouTube', icon: 'youtube' },
  tiktok: { label: 'TikTok', icon: 'tiktok' },
  x: { label: 'X', icon: 'x' },
  instagram: { label: 'Instagram', icon: 'instagram' },
  discord: { label: 'Discord', icon: 'discord' },
  kick: { label: 'Kick', icon: 'kick' },
};

const BRAND = {
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  twitch: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  discord: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z',
  kick: 'M3 3h5v5h2V6h2V3h7v6h-2v2h-2v2h2v2h2v6h-7v-3h-2v-2h-2v-2H8v7H3z',
  windows: 'M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z',
  apple: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701',
};

const UI = {
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  alert: '<path d="M12 3.5L22 20.5H2L12 3.5z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  cube: '<path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5L12 2.5z"/><path d="M3.5 7.25L12 12l8.5-4.75M12 12v9.5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  home: '<path d="M3 11l9-7.5 9 7.5M5.5 9.5V20h13V9.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.9 3.9L20 16M20 20v-4h-4"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  key: '<circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13l9-9M16 7l2 2M14 9l2 2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  drag: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/>',
  verified: '<path d="M12 2.5l2.4 1.8 3-.2.9 2.9 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.9-3-.2L12 21.5l-2.4-1.8-3 .2-.9-2.9-2.4-1.8.9-2.9-.9-2.9 2.4-1.8.9-2.9 3 .2L12 2.5z"/><path d="M8.5 12l2.4 2.4 4.6-4.8"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
  linux: '<path d="M12 2.8c-2.2 0-3.6 1.8-3.6 4.3 0 1.6-.4 2.6-1.3 3.9C5.9 12.7 5 14.5 5 16.6 5 19.6 8 21.2 12 21.2s7-1.6 7-4.6c0-2.1-.9-3.9-2.1-5.6-.9-1.3-1.3-2.3-1.3-3.9 0-2.5-1.4-4.3-3.6-4.3z"/><path d="M9.3 13.2c.5 1.9 1.4 2.9 2.7 2.9s2.2-1 2.7-2.9"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"/>',
  server: '<rect x="3.5" y="4" width="17" height="7" rx="2"/><rect x="3.5" y="13" width="17" height="7" rx="2"/><path d="M7.5 7.5h.01M7.5 16.5h.01M11 7.5h5M11 16.5h5"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 2 2v1h-4M7 4a2 2 0 0 0-2 2v12a2 2 0 0 1-2-2v-1h2M7 4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h11a2 2 0 0 0 2-2V9"/><path d="M11 9h5M11 13h5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 11h6"/>',
  map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z"/><path d="M9 4v13.5M15 6.5V20"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8L12 3.5z"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M14.5 9.5c-.6-.8-1.5-1.2-2.6-1.2-1.4 0-2.4.8-2.4 1.9 0 2.6 5.2 1.3 5.2 3.9 0 1.2-1.1 1.9-2.7 1.9-1.2 0-2.2-.5-2.8-1.3"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3.5-5-3.5-5-1.5S10 8 12 8zM12 8c1.5-3.5 5-3.5 5-1.5S14 8 12 8z"/>',
  megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  gamepad: '<path d="M7.5 7h9a5 5 0 0 1 4.8 6.4l-1 3.5a2.3 2.3 0 0 1-3.9.9L14 15.5h-4l-2.4 2.3a2.3 2.3 0 0 1-3.9-.9l-1-3.5A5 5 0 0 1 7.5 7z"/><path d="M8 10v3M6.5 11.5h3M15.5 11h.01M17.5 12.5h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  filter: '<path d="M4 5h16l-6 7.5V19l-4 1.5v-8L4 5z"/>',
  sword: '<path d="M14.5 4H20v5.5L10 19.5l-5.5-5.5L14.5 4zM7 17l-3 3M5.5 13.5l5 5"/>',
  pickaxe: '<path d="M4 9.5C7.5 5 13 3.5 19.5 4.5 15 6 12.5 8 11 10M14 13c2 1.5 4 4.5 5.5 9-1-6.5-2.5-12-7-15.5M10.5 13.5L3 21"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  bolt: '<path d="M13 2.5L4.5 13.5h6l-1 8 8.5-11h-6l1-8z"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-4.5 4.5-6.5 4.5-11 3 2 7.5 5.5 7.5 11 0 3.4-1.6 6-5.5 6z"/><path d="M12 21c-1.6 0-2.7-1.1-2.7-2.6 0-1.9 1.9-2.7 1.9-4.6 1.3.8 3.5 2.3 3.5 4.6 0 1.5-1.1 2.6-2.7 2.6z"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
  skull: '<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><path d="M11 20v-2M13 20v-2"/>',
  flag: '<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
  play: '<path d="M7 4.5v15l12-7.5-12-7.5z"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8 21h8M9.5 18h5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 17.5l9 5 9-5"/>',
  chest: '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M3 9a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5M3 13h18M11 12h2v3h-2z"/>',
  hammer: '<path d="M14 6l4 4M3 21l9.5-9.5M12 4l2-2 8 8-2 2-3-3-1.5 1.5-4.5-4.5L12 4z"/>',
  fish: '<path d="M3 12c3-4.5 7-6 11-6 3 0 5.5 2.5 7 6-1.5 3.5-4 6-7 6-4 0-8-1.5-11-6z"/><path d="M3 12l-1-3.5M3 12l-1 3.5M16.5 10.5h.01"/>',
  tomb: '<path d="M6 21V10a6 6 0 0 1 12 0v11M4 21h16M12 9v6M9.5 11.5h5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5z"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/><circle cx="8.5" cy="15.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
  portal: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7a3 3 0 0 1 0 10M12 17a3 3 0 0 1 0-10"/>',
  crafting: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>',
  signal: '<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V5"/>',
};

export function icon(name, cls = '') {
  const c = `i${cls ? ' ' + cls : ''}`;
  if (BRAND[name]) {
    return `<svg class="${c}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="${BRAND[name]}"/></svg>`;
  }
  const body = UI[name] || UI.info;
  return `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const ICON_NAMES = [...Object.keys(UI), ...Object.keys(BRAND)].sort();

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.outerHTML = icon(el.dataset.icon, el.className || '');
  });
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeUrl(value) {
  let s = String(value ?? '').trim();
  if (!s) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(s)) s = 'https://' + s;
    else return '';
  }
  try {
    const url = new URL(s);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch {}
  return '';
}

export function safeImage(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  if (/^https:\/\//i.test(s)) {
    try { return new URL(s).href; } catch { return ''; }
  }
  if (/^[\w][\w\-./ %]*$/.test(s) && !s.includes('..')) return s;
  return '';
}

export function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function handleFromUrl(url, type) {
  try {
    const u = new URL(url);
    const first = u.pathname.split('/').filter(Boolean)[0] || '';
    if (type === 'youtube' && first.startsWith('@')) return first;
    if (['x', 'twitch', 'tiktok', 'instagram', 'kick'].includes(type) && first) {
      return first.startsWith('@') ? first : (type === 'twitch' || type === 'kick' ? first : '@' + first);
    }
    return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname.replace(/\/$/, '') : '');
  } catch {
    return url;
  }
}

export const pad2 = (n) => String(n).padStart(2, '0');
export const nf = new Intl.NumberFormat('es-ES');
export const fmt = (n) => nf.format(Math.round(Number(n) || 0));
export const fmt1 = (n) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(Number(n) || 0);

export function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
}

export function uid(prefix = 'id') {
  const rnd = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now().toString(36)}${rnd}`;
}

export const deepClone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

export function fmtDate(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', opts);
}

export function ago(iso) {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 45) return 'hace unos segundos';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
  return fmtDate(iso);
}

export function hours(h) {
  const n = Number(h) || 0;
  if (n < 1) return `${Math.round(n * 60)} min`;
  return `${fmt1(n)} h`;
}

// ------------------------------------------------------------------ markdown

const CALLOUTS = { info: 'info', tip: 'sparkle', warn: 'alert', nota: 'info', consejo: 'sparkle', ojo: 'alert' };

function inline(text, ctx) {
  const codes = [];
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = s.replace(/\[\[(\w+):([^\]]+?)\]\]/g, (m, kind, arg) => {
    const html = ctx?.inline?.(kind.toLowerCase(), arg.trim());
    return html ?? m;
  });
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    const url = safeImage(src.replace(/&amp;/g, '&'));
    return url ? `<img src="${escapeHtml(ctx?.resolve ? ctx.resolve(url) : url)}" alt="${alt}" loading="lazy" decoding="async">` : '';
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const raw = href.replace(/&amp;/g, '&');
    if (raw.startsWith('#')) return `<a href="${escapeHtml(raw)}">${label}</a>`;
    const url = safeUrl(raw);
    return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
  });
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[\s(])_(?!\s)(.+?)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

function cells(row) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// Markdown sencillo y seguro: títulos, listas, tablas, citas con aviso, imágenes, enlaces y componentes [[...]]
export function md(text, ctx = {}) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const para = [];
  const flush = () => {
    if (!para.length) return;
    out.push(`<p>${para.map((l) => inline(l, ctx)).join('<br>')}</p>`);
    para.length = 0;
  };
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { flush(); i++; continue; }
    if (t.startsWith('```')) {
      flush();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(`<pre class="code"><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = t.match(/^(#{2,4})\s+(.+)$/);
    if (h) {
      flush();
      const level = h[1].length;
      const id = slugify(h[2].replace(/\[\[.*?\]\]/g, ''));
      out.push(`<h${level} id="${ctx.idPrefix || ''}${id}">${inline(h[2], ctx)}</h${level}>`);
      i++;
      continue;
    }
    if (/^-{3,}$/.test(t)) { flush(); out.push('<hr>'); i++; continue; }
    const block = t.match(/^\[\[(\w+)(?::([^\]]*))?\]\]$/);
    if (block && ctx.block) {
      const html = ctx.block(block[1].toLowerCase(), (block[2] || '').trim());
      if (html != null) { flush(); out.push(html); i++; continue; }
    }
    if (t.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      flush();
      const head = cells(t);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c, ctx)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((_, k) => `<td>${inline(r[k] ?? '', ctx)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (t.startsWith('>')) {
      flush();
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) buf.push(lines[i++].trim().replace(/^>\s?/, ''));
      const kind = buf[0]?.match(/^\[!(\w+)\]\s*(.*)$/i);
      if (kind) {
        const k = kind[1].toLowerCase();
        buf[0] = kind[2];
        const cls = k === 'tip' || k === 'consejo' ? 'tip' : k === 'warn' || k === 'ojo' ? 'warn' : 'info';
        out.push(`<blockquote class="callout callout--${cls}">${icon(CALLOUTS[k] || 'info')}<div>${md(buf.join('\n'), ctx)}</div></blockquote>`);
      } else {
        out.push(`<blockquote>${md(buf.join('\n'), ctx)}</blockquote>`);
      }
      continue;
    }
    const li = t.match(/^([-*]|\d+[.)])\s+(.*)$/);
    if (li) {
      flush();
      const ordered = /\d/.test(li[1]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+[.)])\s+(.*)$/);
        if (!m) {
          if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) { items[items.length - 1].text += '\n' + lines[i].trim(); i++; continue; }
          break;
        }
        const depth = m[1].replace(/\t/g, '  ').length >= 2 ? 1 : 0;
        if (depth && items.length) items[items.length - 1].sub.push(m[3]);
        else items.push({ text: m[3], sub: [] });
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((it) => `<li>${inline(it.text, ctx).replace(/\n/g, '<br>')}${it.sub.length ? `<ul>${it.sub.map((s) => `<li>${inline(s, ctx)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</${tag}>`);
      continue;
    }
    const img = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      flush();
      const url = safeImage(img[2]);
      if (url) out.push(`<figure><img src="${escapeHtml(ctx.resolve ? ctx.resolve(url) : url)}" alt="${escapeHtml(img[1])}" loading="lazy" decoding="async">${img[1] ? `<figcaption>${inline(img[1], ctx)}</figcaption>` : ''}</figure>`);
      i++;
      continue;
    }
    para.push(t);
    i++;
  }
  flush();
  return out.join('\n');
}

export function plainText(text, max = 180) {
  const s = String(text ?? '')
    .replace(/\[\[(\w+):([^\]]+)\]\]/g, (_, k, a) => (k === 'cmd' ? a : a.replace(/\s+x\d+$/, '').replace(/_/g, ' ')))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function headings(text) {
  return String(text ?? '').split('\n').map((l) => l.trim().match(/^##\s+(.+)$/)).filter(Boolean)
    .map((m) => ({ title: m[1].replace(/\[\[.*?\]\]/g, '').trim(), id: slugify(m[1].replace(/\[\[.*?\]\]/g, '')) }));
}

// ------------------------------------------------------------------ normalización del contenido

const str = (v, d = '') => (typeof v === 'string' ? v : v == null ? d : String(v));
const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : d);
const list = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const bool = (v) => Boolean(v);

function normImages(v) {
  return list(v).map((im) => (typeof im === 'string' ? { src: im, titulo: '', texto: '' } : { src: str(im?.src), titulo: str(im?.titulo), texto: str(im?.texto) }))
    .filter((im) => im.src || im.titulo);
}

function normSection(s, i, prefix = 's') {
  const o = obj(s);
  return {
    id: slugify(str(o.id) || str(o.titulo) || `${prefix}-${i + 1}`),
    titulo: str(o.titulo, 'Sin título'),
    icono: str(o.icono, 'sparkle'),
    resumen: str(o.resumen),
    contenido: str(o.contenido),
    imagenes: normImages(o.imagenes),
    oculto: bool(o.oculto),
  };
}

export function normalizeSitio(raw) {
  const c = obj(raw);
  const g = obj(c.general);
  const live = obj(g.live);
  const redes = obj(g.redes);
  const vic = obj(g.viciont);
  const inicio = obj(c.inicio);
  const jug = obj(c.jugabilidad);
  return {
    meta: { version: num(c.meta?.version, 1), updatedAt: str(c.meta?.updatedAt), updatedBy: str(c.meta?.updatedBy) },
    general: {
      nombre: str(g.nombre, 'Croissants'),
      edicion: str(g.edicion, 'Segunda Edición'),
      lema: str(g.lema),
      descripcion: str(g.descripcion),
      anfitrion: str(g.anfitrion, 'Crosszy'),
      ipJava: str(g.ipJava).trim(),
      puertoJava: str(g.puertoJava).trim(),
      versionJava: str(g.versionJava),
      ipBedrock: str(g.ipBedrock).trim(),
      puertoBedrock: str(g.puertoBedrock).trim(),
      versionBedrock: str(g.versionBedrock),
      redes: Object.fromEntries(Object.keys(SOCIAL_TYPES).map((k) => [k, str(redes[k]).trim()])),
      viciont: {
        url: str(vic.url, 'https://viciontstudios.pages.dev/').trim(),
        discord: str(vic.discord).trim(),
        youtube: str(vic.youtube).trim(),
        x: str(vic.x).trim(),
      },
      launcherUrl: str(g.launcherUrl, 'https://viciontstudios.pages.dev/#launcher').trim(),
      launcherRepo: str(g.launcherRepo, 'CrissyjuanxD/Viciont-Studio-Launcher').trim(),
      creditos: str(g.creditos, 'CrissyjuanxD'),
      fondos: normImages(g.fondos),
      inicioTemporada: str(g.inicioTemporada),
      diaManual: num(g.diaManual, 0),
      live: {
        repo: str(live.repo).trim(),
        rama: str(live.rama, 'main').trim(),
        ntfy: str(live.ntfy).trim(),
        estadoApi: str(live.estadoApi, 'mcstatus'),
      },
    },
    inicio: {
      kicker: str(inicio.kicker),
      titulo: str(inicio.titulo),
      texto: str(inicio.texto),
      pasos: list(inicio.pasos).map((p) => ({ icono: str(p?.icono, 'sparkle'), titulo: str(p?.titulo), texto: str(p?.texto) })),
      destacados: list(inicio.destacados).map((d) => ({ icono: str(d?.icono, 'sparkle'), titulo: str(d?.titulo), texto: str(d?.texto), ruta: str(d?.ruta) })),
      calendario: list(inicio.calendario).map((d) => ({ dia: num(d?.dia, 1), titulo: str(d?.titulo), texto: str(d?.texto), icono: str(d?.icono, 'flag') })),
      viciont: str(inicio.viciont),
    },
    guia: {
      intro: str(c.guia?.intro),
      secciones: list(c.guia?.secciones).map((s, i) => normSection(s, i, 'guia')),
    },
    misiones: { intro: str(c.misiones?.intro), notas: str(c.misiones?.notas), mostrarBloqueadas: bool(c.misiones?.mostrarBloqueadas) },
    jugabilidad: {
      intro: str(jug.intro),
      etapas: list(jug.etapas).map((e, i) => ({
        ...normSection(e, i, 'etapa'),
        clave: str(e?.clave),
        dia: num(e?.dia, 1),
        color: str(e?.color, '#9d7bff'),
        imagen: str(e?.imagen),
      })),
      dimensiones: list(jug.dimensiones).map((d, i) => ({
        ...normSection(d, i, 'dimension'),
        dia: num(d?.dia, 1),
        color: str(d?.color, '#6c9dff'),
        imagen: str(d?.imagen),
        bloque: str(d?.bloque),
      })),
      jefes: list(jug.jefes).map((j, i) => ({
        ...normSection(j, i, 'jefe'),
        dia: num(j?.dia, 1),
        vida: str(j?.vida),
        donde: str(j?.donde),
        estado: str(j?.estado),
        imagen: str(j?.imagen),
        huevo: str(j?.huevo),
      })),
      mobs: list(jug.mobs).map((m, i) => ({
        id: slugify(str(m?.id) || str(m?.nombre) || `mob-${i + 1}`),
        nombre: str(m?.nombre, 'Mob'),
        color: str(m?.color, '#c4b5fd'),
        etapa: str(m?.etapa),
        donde: str(m?.donde),
        vida: str(m?.vida),
        texto: str(m?.texto),
        huevo: str(m?.huevo),
        imagen: str(m?.imagen),
      })),
    },
    launcher: {
      titulo: str(c.launcher?.titulo),
      texto: str(c.launcher?.texto),
      beneficios: list(c.launcher?.beneficios).map((b) => ({ icono: str(b?.icono, 'sparkle'), titulo: str(b?.titulo), texto: str(b?.texto) })),
      pasos: list(c.launcher?.pasos).map((p) => str(p)).filter(Boolean),
    },
    jugadores: { intro: str(c.jugadores?.intro) },
    anuncios: { intro: str(c.anuncios?.intro) },
    footer: { descripcion: str(c.footer?.descripcion), legal: str(c.footer?.legal) },
  };
}

export function normalizeAnuncios(raw) {
  const c = obj(raw);
  return {
    meta: { version: num(c.meta?.version, 1), updatedAt: str(c.meta?.updatedAt), updatedBy: str(c.meta?.updatedBy) },
    categorias: list(c.categorias).length ? list(c.categorias).map((k) => ({ id: slugify(str(k?.id || k?.nombre)), nombre: str(k?.nombre), color: str(k?.color, '#9d7bff') }))
      : [
        { id: 'actualizacion', nombre: 'Actualización', color: '#9d7bff' },
        { id: 'cambios', nombre: 'Cambios', color: '#6c9dff' },
        { id: 'misiones', nombre: 'Misiones', color: '#c9a7eb' },
        { id: 'tienda', nombre: 'Tienda', color: '#ffd27a' },
        { id: 'mantenimiento', nombre: 'Mantenimiento', color: '#ff9db4' },
      ],
    anuncios: list(c.anuncios).map((a, i) => ({
      id: slugify(str(a?.id) || str(a?.titulo) || `anuncio-${i + 1}`),
      titulo: str(a?.titulo, 'Sin título'),
      fecha: str(a?.fecha) || new Date().toISOString(),
      categoria: str(a?.categoria, 'actualizacion'),
      portada: str(a?.portada),
      resumen: str(a?.resumen),
      contenido: str(a?.contenido),
      autor: str(a?.autor),
      fijado: bool(a?.fijado),
      oculto: bool(a?.oculto),
    })),
  };
}

export function normalizeJuego(raw) {
  const c = obj(raw);
  const idioma = obj(c.idioma);
  const items = {};
  for (const [id, it] of Object.entries(obj(c.items))) {
    const o = obj(it);
    items[id] = { ...o, material: str(o.material, 'barrier'), lore: Array.isArray(o.lore) ? o.lore.map((l) => str(l)) : o.lore };
  }
  return {
    meta: { version: num(c.meta?.version, 1), updatedAt: str(c.meta?.updatedAt), updatedBy: str(c.meta?.updatedBy), fuente: str(c.meta?.fuente), catalogo: str(c.meta?.catalogo) },
    items,
    misiones: list(c.misiones).map((m) => ({
      n: num(m?.n),
      tipo: ['normal', 'extra', 'trabajo'].includes(m?.tipo) ? m.tipo : 'normal',
      nombre: str(m?.nombre, 'Misión'),
      descripcion: str(m?.descripcion),
      dificultad: ['facil', 'media', 'dificil', 'muy_dificil'].includes(m?.dificultad) ? m.dificultad : 'media',
      dinocoins: num(m?.dinocoins),
      dia: num(m?.dia),
      padre: num(m?.padre),
      objetivos: list(m?.objetivos).map((o) => ({ texto: str(o?.texto), meta: num(o?.meta, 1), formato: str(o?.formato, 'number') })),
      recompensas: list(m?.recompensas).map((g) => list(g)),
      nota: str(m?.nota),
      imagen: str(m?.imagen),
      oculto: bool(m?.oculto),
    })).sort((a, b) => a.n - b.n),
    recetas: list(c.recetas).map((r, i) => ({ ...obj(r), id: str(r?.id) || `receta-${i + 1}`, etapa: str(r?.etapa), nota: str(r?.nota), oculto: bool(r?.oculto) })),
    trabajos: list(c.trabajos).map((t) => ({ id: str(t?.id), nombre: str(t?.nombre), icono: str(t?.icono), color: str(t?.color, '#c8a27c'), item: str(t?.item, 'iron_pickaxe'), descripcion: str(t?.descripcion), fuentes: list(t?.fuentes).map((f) => str(f)) })),
    habilidades: list(c.habilidades).map((h) => ({ id: str(h?.id), nombre: str(h?.nombre), icono: str(h?.icono, 'star'), color: str(h?.color, '#9fd3ff'), niveles: list(h?.niveles).map((n) => str(n)) })),
    costosHabilidad: list(c.costosHabilidad).map((k) => ({ xp: num(k?.xp), bloque: str(k?.bloque), cantidad: num(k?.cantidad), nombre: str(k?.nombre), dinocoins: num(k?.dinocoins) })),
    rangos: list(c.rangos).map((r) => ({ id: str(r?.id), nombre: str(r?.nombre), color: str(r?.color, '#ffffff'), prefijo: str(r?.prefijo), como: str(r?.como), oculto: bool(r?.oculto) })),
    pesca: list(c.pesca).map((p) => ({ id: str(p?.id), rareza: str(p?.rareza), buena: str(p?.buena), perfecta: str(p?.perfecta), cambio: num(p?.cambio) })),
    mobs: list(c.mobs).map((m, i) => ({
      id: str(m?.id) || slugify(str(m?.nombre) || `mob-${i + 1}`),
      nombre: str(m?.nombre, 'Mob'),
      color: str(m?.color, '#c4b5fd'),
      etapa: str(m?.etapa),
      vida: str(m?.vida),
      donde: str(m?.donde),
      texto: str(m?.texto),
      huevo: str(m?.huevo),
      imagen: str(m?.imagen),
      oculto: bool(m?.oculto),
    })),
    idioma: {
      vanilla: obj(idioma.vanilla), encantamientos: obj(idioma.encantamientos), efectos: obj(idioma.efectos),
      atributos: obj(idioma.atributos), pociones: obj(idioma.pociones), pocionesArrojadizas: obj(idioma.pocionesArrojadizas),
      romanos: obj(idioma.romanos), ranuras: obj(idioma.ranuras),
    },
  };
}

export const visible = (arr) => arr.filter((x) => !x.oculto);

// ------------------------------------------------------------------ catálogo del plugin

// Lo que solo se decide en la web (el panel) y nunca lo pisa el plugin
const WEB_ITEM = ['categoria', 'descripcion', 'origen', 'textura', 'oculto'];
const SKILL_LOOK = { vitalidad: ['heart', '#ff9db4'], resistencia: ['shield', '#9fd3ff'], agilidad: ['wind', '#8ff0b8'] };

function pick(o, keys) {
  const out = {};
  for (const k of keys) {
    const v = o?.[k];
    if (v === true || (typeof v === 'string' && v.trim()) || (typeof v === 'number' && Number.isFinite(v))) out[k] = v;
  }
  return out;
}

// Categoría de un item nuevo que todavía no tiene una puesta desde el panel
export function guessCategory(id) {
  const s = String(id || '');
  if (['dinocoins', 'dinofichas', 'monedero', 'blood_fragment'].includes(s)) return 'economia';
  if (s.startsWith('mochila_') || s === 'enderbag') return 'mochilas';
  if (['chatarra', 'manzana_podrida', 'zanahoria_encantada', 'pepitas_hierro_oxidadas', 'pepitas_diamante', 'fragmentos_ambar', 'fosiles_pequenos', 'lingote_platino'].includes(s)) return 'pesca';
  if (s.startsWith('libro_') || s.startsWith('happy_ghast_enchant') || s === 'misiones') return 'libros';
  if (/^(mineral_crudo|fragmento_profundo|alma_infested|mejora_)/.test(s) || /warden|sculk|abisal|luminosa|lingote_profundo/.test(s)) return 'warden';
  if (s.endsWith('_celestita') || /astral|marchita|rey_ender|enderking/.test(s)) return 'end';
  if (/^(bar_|potion_|splash_|elixir_|frasco_)/.test(s) || /steak|tarta|apple|manzana|caldo|racion|galleta|liquido/.test(s)) return 'consumibles';
  if (/totem|amulet/.test(s)) return 'amuletos';
  if (/^arco_/.test(s) || ['excavator_pickaxe', 'perla_infinita', 'gancho'].includes(s)) return 'armas';
  return 'utilidad';
}

// Junta data/juego.json (lo que se edita en el panel) con el catálogo que sube el plugin (items, misiones, crafteos,
// trabajos, habilidades y mobs). Del plugin sale todo lo del juego; de la web, las texturas, descripciones, notas y
// lo que se ocultó. Sin catálogo se usa juego.json tal cual
export function mergeCatalog(raw, cat) {
  const base = obj(raw);
  const c = obj(cat);
  if (!c.items && !c.misiones && !c.recetas) return base;
  const out = { ...base };
  const byKey = (arr, key) => new Map(list(arr).map((x) => [x?.[key], x]));
  if (c.items && typeof c.items === 'object') {
    const prev = obj(base.items);
    const items = {};
    for (const [id, it] of Object.entries(c.items)) {
      items[id] = { ...obj(it), ...pick(obj(prev[id]), WEB_ITEM) };
      if (!items[id].categoria) items[id].categoria = guessCategory(id);
    }
    // Los items que se agregaron solo en la web (no existen en el plugin) se quedan
    for (const [id, it] of Object.entries(prev)) if (!items[id] && it?.soloWeb) items[id] = it;
    out.items = items;
  }
  if (Array.isArray(c.misiones) && c.misiones.length) {
    const prev = byKey(base.misiones, 'n');
    out.misiones = c.misiones.map((m) => ({ ...obj(m), ...pick(obj(prev.get(m?.n)), ['nota', 'imagen', 'oculto']) }));
  }
  if (Array.isArray(c.recetas)) {
    const prev = byKey(base.recetas, 'id');
    out.recetas = c.recetas.map((r) => ({ ...obj(r), ...pick(obj(prev.get(r?.id)), ['nota', 'oculto']) }));
  }
  if (Array.isArray(c.trabajos) && c.trabajos.length) {
    const prev = byKey(base.trabajos, 'id');
    out.trabajos = c.trabajos.map((t) => ({ ...obj(t), ...pick(obj(prev.get(t?.id)), ['item']) }));
  }
  if (Array.isArray(c.habilidades) && c.habilidades.length) {
    const prev = byKey(base.habilidades, 'id');
    out.habilidades = c.habilidades.map((h) => {
      const [ic, col] = SKILL_LOOK[h?.id] || ['star', '#9fd3ff'];
      return { icono: ic, color: col, ...obj(h), ...pick(obj(prev.get(h?.id)), ['icono', 'color']) };
    });
  }
  if (Array.isArray(c.costosHabilidad) && c.costosHabilidad.length) out.costosHabilidad = c.costosHabilidad;
  if (Array.isArray(c.mobs)) {
    const prev = byKey(base.mobs, 'id');
    out.mobs = c.mobs.map((m) => ({ ...obj(m), ...pick(obj(prev.get(m?.id)), ['imagen', 'oculto']) }));
  }
  out.meta = { ...obj(base.meta), catalogo: str(c.generado) };
  return out;
}
