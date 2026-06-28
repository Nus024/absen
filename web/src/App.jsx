import React, { useState, useEffect, useCallback, memo } from "react";
import * as authApi from "./api/auth.js";
import * as scheduleApi from "./api/schedule.js";
import * as attendanceApi from "./api/attendance.js";
import * as reportApi from "./api/report.js";
import * as settingsApi from "./api/settings.js";


// MUI Icons (SF Symbols equivalent outlines)
import {
  CalendarMonthOutlined as CalendarMonthOutlinedIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  TuneOutlined as TuneOutlinedIcon,
  PersonOutlineOutlined as PersonOutlineOutlinedIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
  ErrorOutlined as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  WarningAmberOutlined as WarningAmberOutlinedIcon,
  NotificationsNoneOutlined as NotificationsNoneOutlinedIcon,
  CampaignOutlined as CampaignOutlinedIcon,
  LogoutOutlined as LogoutOutlinedIcon,
  SyncOutlined as SyncOutlinedIcon,
  PictureAsPdfOutlined as PictureAsPdfOutlinedIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  SearchOutlined as SearchOutlinedIcon,
  CloseOutlined as CloseOutlinedIcon,
  SendOutlined as SendOutlinedIcon,
  FiberManualRecord as FiberManualRecordIcon,
  PhoneAndroidOutlined as PhoneAndroidOutlinedIcon,
  SchoolOutlined as SchoolOutlinedIcon,
  ChevronRightOutlined as ChevronRightOutlinedIcon,
  TableRowsOutlined as SidebarToggleIcon
} from "@mui/icons-material";

const capitalize = (s) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getFormattedTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

const getFormattedDateIndo = (dateStr) => {
  const d = new Date(dateStr);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const indoMonths = [
  { value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
  { value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
  { value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
  { value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" }
];

// ═══════════════════════════════════════════
// REUSABLE NATIVE IOS COMPONENTS
// ═══════════════════════════════════════════

// 1. IOSButton
const IOSButton = memo(({ children, onClick, variant = "primary", disabled = false, loading = false, style, ariaLabel, type }) => {
  const btnClass = `ios-btn ios-btn-${variant}`;
  return (
    <button type={type} onClick={onClick} className={btnClass} disabled={disabled || loading} style={style} aria-label={ariaLabel}>
      {loading ? <IOSLoading /> : children}
    </button>
  );
});

// 2. IOSCard
const IOSCard = memo(({ children, interactive = false, style, onClick }) => {
  const cardClass = `ios-card ${interactive ? "interactive" : ""}`;
  return (
    <div className={cardClass} style={style} onClick={onClick}>
      {children}
    </div>
  );
});

// 3. IOSSection
const IOSSection = memo(({ children, title, footer }) => (
  <div className="ios-section">
    {title && <div className="ios-section-header">{title}</div>}
    {children}
    {footer && <div className="ios-section-footer">{footer}</div>}
  </div>
));

// 4. IOSList
const IOSList = memo(({ children, className = "", style }) => (
  <div className={`ios-list ${className}`.trim()} style={style}>
    {children}
  </div>
));

// 5. IOSListRow
const IOSListRow = memo(({ children, onClick, interactive = false, rightContent, chevron = false, className = "" }) => {
  const rowClass = `ios-list-row ${interactive ? "interactive" : ""} ${className}`.trim();
  return (
    <div className={rowClass} onClick={onClick}>
      <div className="ios-list-row-left">
        {children}
      </div>
      <div className="ios-list-row-right">
        {rightContent}
        {chevron && <ChevronRightOutlinedIcon className="ios-chevron" />}
      </div>
    </div>
  );
});

// 6. IOSInput
const IOSInput = memo(({ type = "text", value, onChange, placeholder, select = false, options = [], style, ariaLabel, maxLength }) => {
  if (select) {
    return (
      <select value={value} onChange={onChange} className="ios-input" style={style} aria-label={ariaLabel}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="ios-input" style={style} aria-label={ariaLabel} maxLength={maxLength} />
  );
});

// Custom Apple Select Dropdown Component
const AppleSelect = memo(({ value, onChange, options, style, ariaLabel, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  return (
    <div className={`apple-select-container ${className}`} ref={dropdownRef} style={style}>
      <button
        type="button"
        className="apple-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span>{selectedOption ? selectedOption.label : ""}</span>
        <ChevronRightOutlinedIcon className={`apple-select-chevron ${isOpen ? "open" : ""}`} />
      </button>
      {isOpen && (
        <div className="apple-select-dropdown" role="listbox">
          <div className="scroll-inertia" style={{ maxHeight: "200px" }}>
            {options.map(o => (
              <div
                key={o.value}
                className={`apple-select-option ${o.value === value ? "selected" : ""}`}
                role="option"
                aria-selected={o.value === value}
                onClick={() => handleSelect(o.value)}
              >
                <span>{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Custom iOS 17 Style Date Picker / Calendar Component
const AppleDatePicker = memo(({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [viewDate, setViewDate] = useState(new Date(value));
  useEffect(() => {
    setTempDate(value);
  }, [value]);

  const handleOpen = () => {
    setViewDate(new Date(value));
    setTempDate(value);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    onChange({ target: { value: tempDate } });
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + offset);
    setViewDate(d);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevTotalDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({
      day: d,
      dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      dateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: true
    });
  }

  const targetLength = cells.length > 35 ? 42 : 35;
  const fillerCount = targetLength - cells.length;
  for (let d = 1; d <= fillerCount; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({
      day: d,
      dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const getDisplayLabel = () => {
    const d = new Date(value);
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <>
      <button
        type="button"
        className="apple-date-trigger"
        onClick={handleOpen}
        aria-label="Pilih tanggal absensi"
      >
        <span>{getDisplayLabel()}</span>
        <ChevronRightOutlinedIcon className="apple-date-chevron" />
      </button>

      {isOpen && (
        <div className="apple-calendar-overlay" onClick={handleClose}>
          <div className="apple-calendar-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ios-sheet-grabber"></div>

            <div className="apple-calendar-header">
              <button type="button" className="apple-calendar-nav-btn" onClick={() => changeMonth(-1)}>
                <ChevronRightOutlinedIcon style={{ transform: "rotate(180deg)", fontSize: "1.2rem" }} />
              </button>
              <h3 className="apple-calendar-title">
                {monthNames[month]} {year}
              </h3>
              <button type="button" className="apple-calendar-nav-btn" onClick={() => changeMonth(1)}>
                <ChevronRightOutlinedIcon style={{ fontSize: "1.2rem" }} />
              </button>
            </div>

            <div className="apple-calendar-weekdays">
              {daysOfWeek.map(d => <div key={d} className="apple-calendar-weekday">{d}</div>)}
            </div>

            <div className="apple-calendar-grid">
              {cells.map((cell, index) => {
                const isSelected = cell.dateString === tempDate;
                const isToday = cell.dateString === todayStr;
                let btnCls = "apple-calendar-day-btn";
                if (!cell.isCurrentMonth) btnCls += " out-of-month";
                if (isSelected) btnCls += " selected";
                if (isToday && !isSelected) btnCls += " today";

                return (
                  <button
                    key={index}
                    type="button"
                    className={btnCls}
                    onClick={() => setTempDate(cell.dateString)}
                  >
                    <span>{cell.day}</span>
                  </button>
                );
              })}
            </div>

            <div className="apple-calendar-footer">
              <button type="button" className="apple-calendar-action-btn cancel" onClick={handleClose}>
                Batal
              </button>
              <button type="button" className="apple-calendar-action-btn save" onClick={handleSave}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

// 7. IOSSwitch
const IOSSwitch = memo(({ checked, onChange, ariaLabel }) => (
  <label className="ios-switch" aria-label={ariaLabel}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="ios-switch-slider"></span>
  </label>
));

// 8. IOSBadge
const IOSBadge = memo(({ status }) => {
  const map = { HADIR: "hadir", IZIN: "izin", SAKIT: "sakit", ALPHA: "alpha", LIBUR: "libur", BELUM: "belum" };
  const cls = map[status] || "belum";
  return <span className={`ios-badge ios-badge-${cls}`}>{status}</span>;
});

// 9. IOSAvatar
const IOSAvatar = memo(({ name }) => {
  const initials = name ? name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() : "MA";
  return <div className="ios-avatar">{initials}</div>;
});

// 10. IOSLoading
const IOSLoading = memo(() => <div className="ios-loading-spinner" />);

// 11. IOSSkeleton
const IOSSkeleton = memo(({ height = "20px", width = "100%", style }) => (
  <div className="ios-skeleton" style={{ height, width, ...style }} />
));

// 12. IOSEmptyState
const IOSEmptyState = memo(({ icon, title, description, action }) => (
  <div className="ios-empty-state">
    <div className="ios-empty-state-icon">{icon}</div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action}
  </div>
));

// 13. IOSSheet
const IOSSheet = memo(({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="ios-sheet-overlay" onClick={onClose}>
      <div className="ios-sheet" onClick={(e) => e.stopPropagation()} role="dialog" tabIndex={-1}>
        <div className="ios-sheet-grabber"></div>
        <div className="scroll-inertia" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
});

// 14. IOSAlert
const IOSAlert = memo(({ isOpen, title, description, actions = [] }) => {
  if (!isOpen) return null;
  return (
    <div className="ios-alert-overlay" role="alertdialog">
      <div className="ios-alert">
        <div className="ios-alert-content">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        <div className="ios-alert-actions">
          {actions.map((act, i) => (
            <button key={i} onClick={act.onClick} className={`ios-alert-action-btn ${act.bold ? "bold" : ""} ${act.destructive ? "destructive" : ""}`}>
              {act.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// 15. (Removed IOSNavigationBar as unused)

// 16. IOSSegmentedControl
const IOSSegmentedControl = memo(({ segments, selectedValue, onChange, disabled = false }) => {
  return (
    <div className="ios-segmented-control" role="radiogroup">
      {segments.map(seg => {
        const isSelected = seg.value === selectedValue;
        return (
          <button
            key={seg.value}
            type="button"
            onClick={() => onChange(seg.value)}
            disabled={disabled}
            className={`ios-segmented-segment ${seg.cls || ""} ${isSelected ? "selected" : ""}`}
            role="radio"
            aria-checked={isSelected}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
});

// ═══════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════
let toastIdCounter = 0;

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type} ${t.exiting ? "exiting" : ""}`}>
          {t.type === "success" && <CheckCircleOutlinedIcon style={{ color: "var(--ios-color-green)" }} />}
          {t.type === "error" && <ErrorOutlineIcon style={{ color: "var(--ios-color-red)" }} />}
          {t.type === "info" && <InfoOutlinedIcon style={{ color: "var(--ios-color-blue)" }} />}
          {t.type === "warning" && <WarningAmberOutlinedIcon style={{ color: "var(--ios-color-orange)" }} />}
          <span style={{ flex: 1, fontSize: "var(--ios-fs-footnote)" }}>{t.message}</span>
          <button className="btn-ghost" onClick={() => onRemove(t.id)} style={{ padding: "2px", minWidth: "auto" }} aria-label="Tutup notifikasi">
            <CloseOutlinedIcon style={{ fontSize: "1rem" }} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  
  // Login States
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // App Navigation
  const [activeTab, setActiveTab] = useState("absensi");
  const [serverStatus, setServerStatus] = useState(null);
  const [autoRekapActive, setAutoRekapActive] = useState(true);

  // Absensi Page States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedJam, setSelectedJam] = useState("1");
  const [schedule, setSchedule] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);


  // Sidebar Collapse State (desktop only)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebarCollapsed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  // Broadcast & Alarm States
  const [broadcastTarget, setBroadcastTarget] = useState("TODAY");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [alarmLoading, setAlarmLoading] = useState(false);

  // Modals / Dialogs
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [teacherDetail, setTeacherDetail] = useState(null);
  const [bulkTargetAction, setBulkTargetAction] = useState(null); // { status, targetsCount }
  const [removingTeachers, setRemovingTeachers] = useState(new Set());

  // Rekap Bulanan States
  const [rekapMonth, setRekapMonth] = useState(new Date().getMonth() + 1);
  const [rekapYear, setRekapYear] = useState(new Date().getFullYear());
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setToken(""); setUser(null); setPhone("");
    showToast("Berhasil logout", "info");
  }, [showToast]);

  // Unauthorized handler — dipanggil oleh API Client saat JWT kedaluwarsa
  useEffect(() => {
    const handler = () => handleLogout();
    window.addEventListener("api:unauthorized", handler);
    return () => window.removeEventListener("api:unauthorized", handler);
  }, [handleLogout]);

  const getStatus = async () => {
    try {
      setServerStatus(await authApi.getStatus());
    } catch { /* silent */ }
  };

  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await settingsApi.getSettings();
      setAutoRekapActive(data.autoRekapActive);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { getStatus(); const i = setInterval(getStatus, 25000); return () => clearInterval(i); }, []);
  useEffect(() => { if (token) loadSettings(); }, [token, loadSettings]);

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) return;
    setLoginLoading(true); setLoginError("");
    try {
      const { data } = await authApi.login(phone, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showToast("Berhasil masuk", "success");
    } catch (err) { 
      setLoginError(err.message); 
    } finally { 
      setLoginLoading(false); 
    }
  };

  const getIndoDayNameFromDate = useCallback((dateString) => {
    const dayNames = ["ahad", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    return dayNames[new Date(dateString).getDay()];
  }, []);

  // Load Absensi
  const loadAbsensiData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const dayName = getIndoDayNameFromDate(selectedDate);
      const [dJ, dR] = await Promise.all([
        scheduleApi.getJadwal(dayName),
        attendanceApi.getRekapHarian(selectedDate)
      ]);
      setSchedule(dJ.data || []);
      setAttendanceLogs(dR.data || []);
    } catch (err) { showToast(err.message, "error"); }
    finally { setDataLoading(false); }
  }, [token, selectedDate, getIndoDayNameFromDate, showToast]);

  useEffect(() => { if (token && activeTab === "absensi") loadAbsensiData(); }, [token, selectedDate, activeTab, loadAbsensiData]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setContacts(await settingsApi.getKontak());
      } catch { /* silent */ }
    })();
  }, [token]);

  // Absen Action
  const submitAbsence = async (teacherName, item, status) => {
    setActionLoading(true);
    try {
      setRemovingTeachers(prev => {
        const next = new Set(prev);
        next.add(teacherName.toLowerCase());
        return next;
      });

      const apiPromise = attendanceApi.submitAbsen({
        jam: selectedJam,
        tanggal: selectedDate,
        data: [{ nama_guru: teacherName, kelas: item.kelas || "", mapel: item.mapel || "", status }]
      });
      const delayPromise = new Promise(resolve => setTimeout(resolve, 250));
      await Promise.all([apiPromise, delayPromise]);

      showToast(`${teacherName} ditandai ${status}`, "success");
      await loadAbsensiData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRemovingTeachers(prev => {
        const next = new Set(prev);
        next.delete(teacherName.toLowerCase());
        return next;
      });
      setActionLoading(false);
    }
  };

  const handleStatusClick = (teacherName, item, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return;
    if (currentStatus === "BELUM") submitAbsence(teacherName, item, newStatus);
    else setCorrectionTarget({ teacherName, oldStatus: currentStatus, newStatus, item });
  };

  const confirmCorrection = async () => {
    if (!correctionTarget) return;
    setActionLoading(true);
    try {
      await attendanceApi.koreksiAbsen({
        nama_guru: correctionTarget.teacherName,
        jam: selectedJam,
        tanggal: selectedDate,
        status_baru: correctionTarget.newStatus
      });
      showToast(`Koreksi ${correctionTarget.teacherName} berhasil.`, "success");
      setCorrectionTarget(null);
      await loadAbsensiData();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleBulkActionInitiate = (targetStatus) => {
    const targets = getTeachersForSelectedJam().filter(t => t.currentStatus === "BELUM");
    if (targets.length === 0) { showToast("Semua guru di jam ini sudah diabsen.", "info"); return; }
    setBulkTargetAction({ status: targetStatus, targetsCount: targets.length });
  };

  const confirmBulkAction = async () => {
    if (!bulkTargetAction) return;
    const targets = getTeachersForSelectedJam().filter(t => t.currentStatus === "BELUM");
    setActionLoading(true);
    try {
      targets.forEach(t => {
        setRemovingTeachers(prev => {
          const next = new Set(prev);
          next.add(t.nama_guru.toLowerCase());
          return next;
        });
      });

      const apiPromise = attendanceApi.submitAbsen({
        jam: selectedJam,
        tanggal: selectedDate,
        data: targets.map(t => ({ nama_guru: t.nama_guru, kelas: t.kelas || "", mapel: t.mapel || "", status: bulkTargetAction.status }))
      });
      const delayPromise = new Promise(resolve => setTimeout(resolve, 250));
      await Promise.all([apiPromise, delayPromise]);

      showToast(`${targets.length} guru ditandai ${bulkTargetAction.status}`, "success");
      setBulkTargetAction(null);
      await loadAbsensiData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRemovingTeachers(new Set());
      setActionLoading(false);
    }
  };

  const getTeachersForSelectedJam = () => {
    const filtered = schedule.filter(r => String(r.jam).trim() === String(selectedJam).trim());
    const map = {};
    filtered.forEach(row => {
      const name = (row.nama_guru || "").trim();
      if (!name) return;
      const log = attendanceLogs.find(l => (l.nama_guru || "").trim().toLowerCase() === name.toLowerCase() && String(l.jam).trim() === String(selectedJam).trim());
      const status = log ? (log.status || "BELUM").toUpperCase() : "BELUM";
      if (!map[name.toLowerCase()]) map[name.toLowerCase()] = { nama_guru: name, kelas: row.kelas, mapel: row.mapel, currentStatus: status };
      else { map[name.toLowerCase()].kelas += `, ${row.kelas}`; map[name.toLowerCase()].mapel += `, ${row.mapel}`; }
    });
    attendanceLogs.filter(l => String(l.jam).trim() === String(selectedJam).trim()).forEach(log => {
      const name = (log.nama_guru || "").trim();
      if (!name || map[name.toLowerCase()]) return;
      map[name.toLowerCase()] = { nama_guru: name, kelas: log.kelas || "Pengganti", mapel: log.mapel || "Lainnya", currentStatus: (log.status || "BELUM").toUpperCase() };
    });
    let list = Object.values(map).sort((a, b) => a.nama_guru.localeCompare(b.nama_guru));
    list = list.filter(t => t.currentStatus === "BELUM");
    return list;
  };

  // Monthly stats loader
  const loadRekapBulanan = useCallback(async () => {
    if (!token) return;
    setMonthlyLoading(true);
    try {
      const data = await reportApi.getRekapBulanan(rekapMonth, rekapYear);
      setMonthlyStats(data.data || []);
    }
    catch { showToast("Gagal memuat rekap bulanan.", "error"); }
    finally { setMonthlyLoading(false); }
  }, [token, rekapMonth, rekapYear, showToast]);

  useEffect(() => { if (token && activeTab === "rekap-bulanan") loadRekapBulanan(); }, [token, rekapMonth, rekapYear, activeTab, loadRekapBulanan]);

  const filteredMonthlyStats = monthlyStats.filter(i => (i.nama_guru || "").toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSyncSheets = async () => {
    const m = indoMonths.find(x => x.value === rekapMonth);
    if (!m) return;
    setSyncLoading(true);
    try {
      const data = await reportApi.syncBulanan({ monthName: m.label, year: rekapYear });
      showToast(data.message || "Sinkronisasi Sheets berhasil!", "success");
      await loadRekapBulanan();
    } catch (e) { showToast(e.message, "error"); }
    finally { setSyncLoading(false); }
  };

  const handleExportBulanan = async (format) => {
    const m = indoMonths.find(x => x.value === rekapMonth);
    if (!m) return;
    setExportLoading(true);
    try {
      await reportApi.eksporBulanan({ format, monthName: m.label, year: rekapYear });
      showToast("Laporan terkirim ke WhatsApp Anda!", "success");
    } catch (e) { showToast(e.message, "error"); }
    finally { setExportLoading(false); }
  };

  // Settings
  const handleToggleAutoRekap = async () => {
    try {
      const data = await settingsApi.updateSettings({ autoRekapActive: !autoRekapActive });
      setAutoRekapActive(data.autoRekapActive);
      showToast(`Pengiriman otomatis ${data.autoRekapActive ? "aktif" : "nonaktif"}.`, "info");
    } catch { showToast("Gagal memperbarui pengaturan.", "error"); }
  };

  const handleSendAlarm = async () => {
    setAlarmLoading(true);
    try {
      await settingsApi.sendAlarm();
      showToast("Alarm berhasil disiarkan!", "success");
    } catch (e) { showToast(e.message, "error"); }
    finally { setAlarmLoading(false); }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastLoading(true);
    try {
      await settingsApi.sendBroadcast({ targetMode: broadcastTarget, message: broadcastMessage });
      showToast("Broadcast pengumuman sedang dikirim!", "success");
      setBroadcastMessage("");
    } catch (e) { showToast(e.message, "error"); }
    finally { setBroadcastLoading(false); }
  };

  // Profile click details
  const handleTeacherNameClick = async (name, activeRow = null) => {
    setDataLoading(true);
    try {
      const contact = contacts.find(c => c.nama_guru?.trim().toLowerCase() === name.toLowerCase());
      const waPhone = contact ? (contact.no_wa || contact.nomor_wa) : "Tidak terdaftar";
      const stats = monthlyStats.find(t => t.nama_guru?.trim().toLowerCase() === name.toLowerCase()) || { hadir: 0, izin: 0, sakit: 0, libur: 0, alpha: 0, jtm_7_hari: 0, jadwal_wajib: 0 };
      const logsData = await attendanceApi.getAllRekap();
      const logs = (logsData.data || []).filter(l => l.nama_guru?.trim().toLowerCase() === name.toLowerCase()).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 10);
      setTeacherDetail({ name, phone: waPhone, stats, logs, row: activeRow });
    } catch { showToast("Gagal memuat detail guru.", "error"); }
    finally { setDataLoading(false); }
  };

  const getBelumCount = () => {
    const keys = new Set();
    schedule.forEach(r => { const n = (r.nama_guru || "").trim(); const j = String(r.jam).trim(); if (n && j) keys.add(`${n.toLowerCase()}|||${j}`); });
    attendanceLogs.forEach(l => { const n = (l.nama_guru || "").trim(); const j = String(l.jam).trim(); if (n && j) keys.delete(`${n.toLowerCase()}|||${j}`); });
    return keys.size;
  };

  const getBelumList = () => {
    const list = []; const keys = new Set();
    schedule.forEach(row => {
      const name = (row.nama_guru || "").trim(); const jam = String(row.jam).trim();
      if (!name || !jam) return;
      const key = `${name.toLowerCase()}|||${jam}`;
      const done = attendanceLogs.some(l => (l.nama_guru || "").trim().toLowerCase() === name.toLowerCase() && String(l.jam).trim() === jam);
      if (!done && !keys.has(key)) { keys.add(key); list.push({ nama_guru: name, jam, kelas: row.kelas }); }
    });
    return list.sort((a, b) => a.jam.localeCompare(b.jam) || a.nama_guru.localeCompare(b.nama_guru));
  };

  const statusActionsList = [
    { key: "HADIR", label: "Hadir", cls: "hadir" },
    { key: "IZIN", label: "Izin", cls: "izin" },
    { key: "SAKIT", label: "Sakit", cls: "sakit" },
    { key: "ALPHA", label: "Alpa", cls: "alpha" },
    { key: "LIBUR", label: "Libur", cls: "libur" },
  ];

  return (
    <div className="app-layout">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ═══ 1. LOGIN SCREEN ═══ */}
      {!token ? (
        <div className="scroll-inertia" style={{ width: "100%", height: "100%" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100%", padding: "var(--ios-space-32) var(--ios-space-16)" }}>
            <IOSCard style={{ width: "100%", maxWidth: "380px", padding: "var(--ios-space-24)" }}>
              <div style={{ textAlign: "center", marginBottom: "var(--ios-space-24)" }}>
                <SchoolOutlinedIcon style={{ fontSize: "2.8rem", color: "var(--ios-color-blue)", marginBottom: "var(--ios-space-8)" }} />
                <h2 style={{ fontSize: "var(--ios-fs-title-1)", fontWeight: 700, letterSpacing: "-0.03em" }}>MA. Miftahul Ulum 2</h2>
              </div>

              {loginError && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ios-space-8)", background: "var(--ios-color-red-tint)", padding: "10px 14px", borderRadius: "var(--ios-radius-inner)", fontSize: "var(--ios-fs-footnote)", color: "var(--ios-color-red)", marginBottom: "var(--ios-space-16)" }}>
                  <ErrorOutlineIcon style={{ fontSize: "1.1rem" }} />
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-16)" }}>
                <div className="ios-input-wrapper">
                  <label style={{ fontSize: "var(--ios-fs-footnote)", fontWeight: "600", color: "var(--ios-color-text-secondary)" }}>
                    Nomor WhatsApp Pengawas
                  </label>
                  <IOSInput type="tel" placeholder="Contoh: 6285183192465" value={phone} onChange={(e) => setPhone(e.target.value)} ariaLabel="Nomor WhatsApp" />
                </div>
                
                <div className="ios-input-wrapper">
                  <label style={{ fontSize: "var(--ios-fs-footnote)", fontWeight: "600", color: "var(--ios-color-text-secondary)" }}>
                    Password
                  </label>
                  <IOSInput type="password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} ariaLabel="Password" />
                </div>

                <IOSButton type="submit" variant="primary" loading={loginLoading}>
                  <SendOutlinedIcon style={{ fontSize: "1rem", marginRight: "6px" }} /> Masuk
                </IOSButton>
              </form>
            </IOSCard>
          </div>
        </div>
      ) : (
        <>
          {/* ═══ 2. SIDEBAR (Desktop Settings List Style) ═══ */}
          <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-24)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <SchoolOutlinedIcon style={{ fontSize: "1.8rem", color: "var(--ios-color-blue)" }} />
                <div>
                  <h2 style={{ fontSize: "var(--ios-fs-headline)", fontWeight: "600", letterSpacing: "-0.02em" }}>MA. Miftahul Ulum 2</h2>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "var(--ios-radius-inner)", background: "var(--ios-color-bg-secondary)", border: "0.5px solid var(--ios-color-separator)", fontSize: "var(--ios-fs-footnote)" }}>
                <FiberManualRecordIcon style={{ fontSize: "0.6rem", color: serverStatus?.botReady ? "var(--ios-color-green)" : "var(--ios-color-red)" }} />
                <span style={{ color: "var(--ios-color-text-secondary)", fontWeight: 500 }}>WhatsApp Server · <strong style={{ color: serverStatus?.botReady ? "var(--ios-color-green)" : "var(--ios-color-red)" }}>{serverStatus?.botReady ? "Online" : "Offline"}</strong></span>
              </div>

              <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button onClick={() => setActiveTab("absensi")} className={`sidebar-nav-item ${activeTab === "absensi" ? "active" : ""}`} aria-label="Halaman Absen Harian">
                  <CalendarMonthOutlinedIcon /> Absen Harian
                </button>
                <button onClick={() => setActiveTab("rekap-bulanan")} className={`sidebar-nav-item ${activeTab === "rekap-bulanan" ? "active" : ""}`} aria-label="Halaman Rekap Bulanan">
                  <BarChartOutlinedIcon /> Rekap Bulanan
                </button>
                <button onClick={() => setActiveTab("admin")} className={`sidebar-nav-item ${activeTab === "admin" ? "active" : ""}`} aria-label="Halaman Panel Kontrol">
                  <TuneOutlinedIcon /> Panel Kontrol
                </button>
              </nav>
            </div>

            <div style={{ borderTop: "0.5px solid var(--ios-color-separator)", paddingTop: "var(--ios-space-16)", display: "flex", flexDirection: "column", gap: "var(--ios-space-12)" }}>
              <div style={{ padding: "0 4px" }}>
                <div style={{ fontSize: "var(--ios-fs-footnote)", fontWeight: "600", color: "var(--ios-color-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <PersonOutlineOutlinedIcon style={{ fontSize: "1rem" }} /> {user?.name}
                </div>
                <div style={{ fontSize: "var(--ios-fs-caption)", color: "var(--ios-color-text-secondary)", marginTop: "2px", paddingLeft: "22px" }}>{user?.phone}</div>
              </div>
              <IOSButton onClick={handleLogout} variant="danger" style={{ width: "100%" }} ariaLabel="Logout">
                <LogoutOutlinedIcon style={{ fontSize: "0.95rem" }} /> Logout
              </IOSButton>
            </div>
          </aside>

          {/* ═══ 3. BOTTOM TAB BAR (iOS Standard 49px) ═══ */}
          <nav className="bottom-nav">
            {[
              { key: "absensi", icon: <CalendarMonthOutlinedIcon />, label: "Absen" },
              { key: "rekap-bulanan", icon: <BarChartOutlinedIcon />, label: "Rekap" },
              { key: "admin", icon: <TuneOutlinedIcon />, label: "Kontrol" },
            ].map(item => (
              <button key={item.key} onClick={() => setActiveTab(item.key)} className={`bottom-nav-item ${activeTab === item.key ? "active" : ""}`} aria-label={item.label}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* ═══ 4. MAIN CONTAINER ═══ */}
          <main className={`main-content${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
            {/* Mobile Navigation Header */}
            <header className="mobile-header">
              <div style={{ width: "44px", display: "flex", alignItems: "center" }}>
                {/* Desktop sidebar toggle — mobile-only slot keeps SchoolIcon */}
                <button
                  className="desktop-only ios-nav-bar-action sidebar-toggle-btn"
                  onClick={() => setSidebarCollapsed(c => !c)}
                  aria-label={sidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
                  title={sidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
                >
                  <SidebarToggleIcon style={{ fontSize: "1.25rem" }} />
                </button>
                <SchoolOutlinedIcon className="mobile-only" style={{ fontSize: "1.2rem", color: "var(--ios-color-text-secondary)" }} />
              </div>
              <h2 className="ios-nav-bar-title">
                {activeTab === "absensi" && "Absensi Harian"}
                {activeTab === "rekap-bulanan" && "Rekap Bulanan"}
                {activeTab === "admin" && "Panel Kontrol"}
              </h2>
              <div style={{ width: "44px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", fontSize: "var(--ios-fs-caption)", fontWeight: "600", color: serverStatus?.botReady ? "var(--ios-color-green)" : "var(--ios-color-red)" }}>
                <FiberManualRecordIcon style={{ fontSize: "0.55rem" }} />
                <span>{serverStatus?.botReady ? "ON" : "OFF"}</span>
              </div>
            </header>

            {/* ═══ TAB: ABSENSI ═══ */}
            {activeTab === "absensi" && (
              <div className="scroll-inertia animate-slide-up" style={{ flex: 1 }}>
                <div className="main-content-scrollable">
                  <div style={{ fontSize: "var(--fs-caption-2)", color: "var(--label-secondary)", padding: "0 var(--sp-4)", letterSpacing: "var(--ls-caption)", textTransform: "uppercase" }}>
                    {getFormattedDateIndo(selectedDate)} · {getFormattedTime()} WIB
                  </div>
                  <div className="absensi-grid">
                    
                    {/* Left Grid: Attendance Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-16)" }}>
                      
                      {/* Configuration Controls Grouped List */}
                      <IOSSection title="Konfigurasi Sesi & Hari">
                        <IOSList>
                          <IOSListRow rightContent={
                            <AppleDatePicker value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                          }>
                            <span style={{ fontSize: "var(--fs-body)", fontWeight: 500, color: "var(--label-primary)" }}>Tanggal Absensi</span>
                          </IOSListRow>
                          <IOSListRow rightContent={
                            <IOSSegmentedControl
                              segments={[
                                { value: "1", label: "Jam 1" },
                                { value: "2", label: "Jam 2" },
                                { value: "3", label: "Jam 3" }
                              ]}
                              selectedValue={selectedJam}
                              onChange={setSelectedJam}
                            />
                          }>
                            <span style={{ fontSize: "var(--fs-body)", fontWeight: 500, color: "var(--label-primary)" }}>Sesi KBM Aktif</span>
                          </IOSListRow>
                        </IOSList>
                      </IOSSection>

                      {/* Bulk Actions Grouped List */}
                      <IOSSection title="Tindakan Massal Sesi Ini">
                        <IOSList>
                          <IOSListRow interactive onClick={() => handleBulkActionInitiate("HADIR")} chevron>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-12)", width: "100%", minHeight: "44px" }}>
                              <CheckCircleOutlinedIcon style={{ color: "var(--green)", fontSize: "1.3rem" }} />
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--green)" }}>Tandai Hadir Semua Guru</span>
                                <span style={{ fontSize: "var(--fs-caption-2)", color: "var(--label-secondary)", fontWeight: 400 }}>Semua guru tersisa akan ditandai hadir.</span>
                              </div>
                            </div>
                          </IOSListRow>
                          <IOSListRow interactive onClick={() => handleBulkActionInitiate("ALPHA")} chevron>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-12)", width: "100%", minHeight: "44px" }}>
                              <ErrorOutlineIcon style={{ color: "var(--red)", fontSize: "1.3rem" }} />
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--red)" }}>Tandai Alpa Semua Guru</span>
                                <span style={{ fontSize: "var(--fs-caption-2)", color: "var(--label-secondary)", fontWeight: 400 }}>Semua guru tersisa akan ditandai alpa.</span>
                              </div>
                            </div>
                          </IOSListRow>
                        </IOSList>
                      </IOSSection>

                      {/* Teachers Attendance Sheet */}
                      {(() => {
                        const activeTeachers = getTeachersForSelectedJam();
                        const pendingRemoveCount = activeTeachers.filter(t => removingTeachers.has(t.nama_guru.toLowerCase())).length;
                        const displayCount = Math.max(0, activeTeachers.length - pendingRemoveCount);
                        const hasScheduleForSelectedJam = schedule.some(r => String(r.jam).trim() === String(selectedJam).trim());
                        
                        const titleNode = (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "var(--ls-caption)", color: "var(--label-secondary)" }}>
                              Daftar Guru Belum Diabsen
                            </span>
                            <span style={{ fontSize: "var(--fs-subheadline)", color: "var(--label-secondary)", fontWeight: 400, textTransform: "none" }}>
                              {displayCount} Guru Tersisa
                            </span>
                          </div>
                        );

                        return (
                          <IOSSection title={titleNode}>
                            {dataLoading ? (
                              <IOSList>
                                <div style={{ padding: "var(--sp-16)", display: "flex", flexDirection: "column", gap: "var(--sp-12)" }}>
                                  <IOSSkeleton height="24px" width="80%" />
                                  <IOSSkeleton height="16px" width="50%" />
                                  <IOSSkeleton height="24px" width="90%" />
                                  <IOSSkeleton height="16px" width="40%" />
                                </div>
                              </IOSList>
                            ) : activeTeachers.length === 0 ? (
                              <IOSList>
                                {hasScheduleForSelectedJam ? (
                                  <IOSEmptyState 
                                    icon={<CheckCircleOutlinedIcon style={{ fontSize: "3.5rem", color: "var(--green)" }} />} 
                                    title="Semua guru telah diabsen" 
                                    description="Tidak ada guru yang perlu diproses pada sesi ini." 
                                    action={
                                      <IOSButton onClick={() => setActiveTab("rekap-bulanan")} variant="primary" style={{ marginTop: "12px", borderRadius: "14px" }} ariaLabel="Lihat Rekap">
                                        Lihat Rekap
                                      </IOSButton>
                                    }
                                  />
                                ) : (
                                  <IOSEmptyState 
                                    icon={<SchoolOutlinedIcon style={{ fontSize: "3.5rem", color: "var(--label-secondary)" }} />} 
                                    title="Tidak Ada Jadwal" 
                                    description={`Tidak ada guru yang terdaftar mengajar di KBM Jam ${selectedJam} pada hari ini.`} 
                                  />
                                )}
                              </IOSList>
                            ) : (
                              <IOSList style={{ overflow: "visible" }}>
                                {activeTeachers.map((row, idx) => {
                                  const isRemoving = removingTeachers.has(row.nama_guru.toLowerCase());
                                  return (
                                    <IOSListRow 
                                      key={idx} 
                                      chevron 
                                      interactive 
                                      className={isRemoving ? "removing" : ""}
                                      onClick={() => handleTeacherNameClick(row.nama_guru, row)}
                                      rightContent={
                                        <IOSBadge status={row.currentStatus} />
                                      }
                                    >
                                      <IOSAvatar name={row.nama_guru} />
                                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                        <span style={{ fontSize: "var(--fs-headline)", fontWeight: "600", color: "var(--label-primary)" }}>{row.nama_guru}</span>
                                        <span style={{ fontSize: "var(--fs-caption)", color: "var(--label-secondary)" }}>{row.kelas} · {row.mapel}</span>
                                      </div>
                                    </IOSListRow>
                                  );
                                })}
                              </IOSList>
                            )}
                          </IOSSection>
                        );
                      })()}

                      {/* Mobile Actions Container (Tapped row triggers action) */}
                      <div className="mobile-only" style={{ display: "none", flexDirection: "column", gap: "var(--sp-8)" }}>
                        {getTeachersForSelectedJam().length > 0 && !dataLoading && (
                          <IOSSection title="Ketuk Guru di Atas untuk Melihat Detail & Riwayat Absensi" />
                        )}
                      </div>

                    </div>

                    {/* Right Grid: Stats Ringkasan */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-16)" }}>
                      
                      {/* Statistik Harian */}
                      <IOSSection title="Informasi Sesi">
                        <IOSList>
                          <IOSListRow rightContent={<span style={{ fontWeight: 700, color: getBelumCount() > 0 ? "var(--ios-color-yellow)" : "var(--ios-color-green)" }}>{getBelumCount()} Sesi</span>}>
                            <span style={{ fontSize: "var(--ios-fs-body)", color: "var(--ios-color-text-primary)" }}>Belum Diabsen</span>
                          </IOSListRow>
                          <IOSListRow rightContent={<span style={{ fontWeight: 600 }}>{schedule.length} Sesi</span>}>
                            <span style={{ fontSize: "var(--ios-fs-body)", color: "var(--ios-color-text-primary)" }}>Total Sesi Hari Ini</span>
                          </IOSListRow>
                        </IOSList>
                      </IOSSection>

                      {/* Checklist Belum Absen */}
                      <IOSSection title="Daftar Belum Absen">
                        <IOSList>
                          {getBelumList().length === 0 ? (
                            <div style={{ padding: "var(--ios-space-24) var(--ios-space-16)", textAlign: "center" }}>
                              <CheckCircleOutlinedIcon style={{ fontSize: "2rem", color: "var(--ios-color-green)", marginBottom: "var(--ios-space-8)" }} />
                              <p style={{ fontSize: "var(--ios-fs-subheadline)", color: "var(--ios-color-text-secondary)" }}>Seluruh kehadiran guru telah lengkap diinput.</p>
                            </div>
                          ) : (
                            <div style={{ maxHeight: "350px", overflowY: "auto" }} className="scroll-inertia">
                              {getBelumList().map((item, i) => (
                                <IOSListRow key={i} interactive onClick={() => { setSelectedJam(item.jam); }}
                                  rightContent={<span style={{ background: "var(--ios-color-yellow-tint)", color: "var(--ios-color-yellow)", padding: "2px 8px", borderRadius: "var(--ios-radius-inner)", fontWeight: "700", fontSize: "var(--ios-fs-footnote)" }}>Jam {item.jam}</span>}>
                                  <span style={{ fontSize: "var(--ios-fs-footnote)", fontWeight: "600", color: "var(--ios-color-text-primary)" }}>{item.nama_guru}</span>
                                </IOSListRow>
                              ))}
                            </div>
                          )}
                        </IOSList>
                      </IOSSection>

                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB: REKAP BULANAN ═══ */}
            {activeTab === "rekap-bulanan" && (
              <div className="scroll-inertia animate-slide-up" style={{ flex: 1 }}>
                <div className="main-content-scrollable">
                  
                  {/* Period Filter & Search */}
                  <IOSSection title="Filter Periode & Pencarian">
                    <div className="ios-list rekap-minimal">
                      <IOSListRow rightContent={
                        <AppleSelect className="ios-picker" value={rekapMonth} onChange={(e) => setRekapMonth(parseInt(e.target.value))} options={indoMonths} ariaLabel="Pilih bulan rekap" />
                      }>
                        <span style={{ fontSize: "var(--ios-fs-body)", fontWeight: 500, color: "var(--ios-color-text-primary)" }}>Bulan</span>
                      </IOSListRow>
                      <IOSListRow rightContent={
                        <AppleSelect className="ios-picker" value={rekapYear} onChange={(e) => setRekapYear(parseInt(e.target.value))} options={[2025, 2026, 2027].map(y => ({ value: y, label: String(y) }))} ariaLabel="Pilih tahun rekap" />
                      }>
                        <span style={{ fontSize: "var(--ios-fs-body)", fontWeight: 500, color: "var(--ios-color-text-primary)" }}>Tahun</span>
                      </IOSListRow>
                      <IOSListRow rightContent={
                        <div className="ios-search-bar ios-search-minimal" style={{ maxWidth: "240px" }}>
                          <SearchOutlinedIcon />
                          <IOSInput type="text" placeholder="Cari nama guru..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} ariaLabel="Cari nama guru" />
                        </div>
                      }>
                        <span style={{ fontSize: "var(--ios-fs-body)", fontWeight: 500, color: "var(--ios-color-text-primary)" }}>Pencarian</span>
                      </IOSListRow>
                    </div>
                  </IOSSection>

                  {/* Actions List */}
                  <IOSSection title="Ekspor Data & Integrasi">
                    <IOSList style={{ overflow: "hidden" }}>
                      <IOSListRow 
                        interactive 
                        onClick={handleSyncSheets} 
                        disabled={syncLoading || monthlyLoading}
                        chevron
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-16)", width: "100%", minHeight: "56px", textAlign: "left" }}>
                          <div style={{ 
                            width: "32px", 
                            height: "32px", 
                            borderRadius: "8px", 
                            background: "var(--blue-tint)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            color: "var(--blue)" 
                          }}>
                            {syncLoading ? <IOSLoading /> : <SyncOutlinedIcon style={{ fontSize: "1.25rem" }} />}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--label-primary)" }}>Sinkronisasi Data</span>
                            <span style={{ fontSize: "var(--fs-caption-2)", color: "var(--label-secondary)", fontWeight: 400 }}>Perbarui data absensi dari Google Sheets.</span>
                          </div>
                        </div>
                      </IOSListRow>

                      <IOSListRow 
                        interactive 
                        onClick={() => handleExportBulanan("pdf")} 
                        disabled={exportLoading}
                        chevron
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-16)", width: "100%", minHeight: "56px", textAlign: "left" }}>
                          <div style={{ 
                            width: "32px", 
                            height: "32px", 
                            borderRadius: "8px", 
                            background: "var(--green-tint)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            color: "var(--green)" 
                          }}>
                            <PictureAsPdfOutlinedIcon style={{ fontSize: "1.25rem" }} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--label-primary)" }}>Kirim Laporan PDF</span>
                            <span style={{ fontSize: "var(--fs-caption-2)", color: "var(--label-secondary)", fontWeight: 400 }}>Kirim laporan bulanan dalam format PDF.</span>
                          </div>
                        </div>
                      </IOSListRow>

                      <IOSListRow 
                        interactive 
                        onClick={() => handleExportBulanan("xlsx")} 
                        disabled={exportLoading}
                        chevron
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-16)", width: "100%", minHeight: "56px", textAlign: "left" }}>
                          <div style={{ 
                            width: "32px", 
                            height: "32px", 
                            borderRadius: "8px", 
                            background: "var(--purple-tint)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            color: "var(--purple)" 
                          }}>
                            <TableChartOutlinedIcon style={{ fontSize: "1.25rem" }} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--label-primary)" }}>Kirim Laporan Excel</span>
                            <span style={{ fontSize: "var(--fs-caption-2)", color: "var(--label-secondary)", fontWeight: 400 }}>Kirim laporan bulanan dalam format Excel.</span>
                          </div>
                        </div>
                      </IOSListRow>
                    </IOSList>
                  </IOSSection>

                  {/* Summary Table Card */}
                  <IOSSection title={`Ringkasan Kehadiran Periode ${indoMonths.find(m => m.value === rekapMonth)?.label} ${rekapYear}`}>
                    {monthlyLoading ? (
                      <IOSCard>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-12)" }}>
                          <IOSSkeleton height="24px" width="100%" />
                          <IOSSkeleton height="24px" width="100%" />
                          <IOSSkeleton height="24px" width="100%" />
                        </div>
                      </IOSCard>
                    ) : filteredMonthlyStats.length === 0 ? (
                      <IOSCard>
                        <IOSEmptyState icon={<BarChartOutlinedIcon />} title="Data Kosong" description="Tidak ada riwayat statistik kehadiran guru pada bulan ini." />
                      </IOSCard>
                    ) : (
                      <>
                        {/* Desktop View: Table */}
                        <div className="desktop-only">
                          <IOSCard style={{ padding: 0, overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--ios-space-8) var(--ios-space-16) 0" }}>
                              <span style={{ fontSize: "var(--ios-fs-headline)", fontWeight: 600 }}>Statistik Guru</span>
                              <IOSButton onClick={loadRekapBulanan} disabled={monthlyLoading} variant="tertiary" style={{ minHeight: "36px" }} ariaLabel="Muat ulang rekap">
                                <SyncOutlinedIcon style={{ fontSize: "0.95rem" }} /> Segarkan
                              </IOSButton>
                            </div>
                            <div className="table-container">
                              <table>
                                <thead>
                                  <tr>
                                    <th style={{ width: "45px" }}>No</th>
                                    <th>Nama Guru</th>
                                    <th style={{ textAlign: "center" }}>JTM</th>
                                    <th style={{ textAlign: "center" }}>Jadwal</th>
                                    <th style={{ textAlign: "center", color: "var(--ios-color-green)" }}>Hadir</th>
                                    <th style={{ textAlign: "center", color: "var(--ios-color-yellow)" }}>Izin</th>
                                    <th style={{ textAlign: "center", color: "var(--ios-color-orange)" }}>Sakit</th>
                                    <th style={{ textAlign: "center", color: "var(--ios-color-purple)" }}>Libur</th>
                                    <th style={{ textAlign: "center", color: "var(--ios-color-red)" }}>Alpa</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredMonthlyStats.map((row, idx) => (
                                    <tr key={idx}>
                                      <td style={{ paddingLeft: "var(--ios-space-16)" }}>{idx + 1}</td>
                                      <td>
                                        <span onClick={() => handleTeacherNameClick(row.nama_guru)} style={{ fontWeight: "600", cursor: "pointer", color: "var(--ios-color-blue)", display: "inline-flex", alignItems: "center", gap: "6px" }} role="button" tabIndex={0}>
                                          <PersonOutlineOutlinedIcon style={{ fontSize: "0.9rem" }} /> {row.nama_guru}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: "center" }}>{row.jtm_7_hari}</td>
                                      <td style={{ textAlign: "center" }}>{row.jadwal_wajib}</td>
                                      <td style={{ textAlign: "center", fontWeight: "700", color: "var(--ios-color-green)" }}>{row.hadir}</td>
                                      <td style={{ textAlign: "center", color: "var(--ios-color-yellow)" }}>{row.izin}</td>
                                      <td style={{ textAlign: "center", color: "var(--ios-color-orange)" }}>{row.sakit}</td>
                                      <td style={{ textAlign: "center", color: "var(--ios-color-purple)" }}>{row.libur}</td>
                                      <td style={{ textAlign: "center", fontWeight: "700", color: "var(--ios-color-red)" }}>{row.alpha}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </IOSCard>
                        </div>

                        {/* Mobile View: Grouped List Row */}
                        <div className="mobile-only" style={{ flexDirection: "column", gap: "var(--ios-space-8)", width: "100%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 var(--ios-space-16)" }}>
                            <span style={{ fontSize: "var(--ios-fs-footnote)", color: "var(--ios-color-text-secondary)" }}>Ketuk guru untuk melihat detail kehadiran bulanan</span>
                            <IOSButton onClick={loadRekapBulanan} disabled={monthlyLoading} variant="tertiary" style={{ minHeight: "36px", padding: "0 4px" }} ariaLabel="Muat ulang rekap">
                              <SyncOutlinedIcon style={{ fontSize: "0.95rem" }} /> Segarkan
                            </IOSButton>
                          </div>
                          <IOSList>
                            {filteredMonthlyStats.map((row, idx) => (
                              <IOSListRow key={idx} chevron interactive onClick={() => handleTeacherNameClick(row.nama_guru)}
                                rightContent={
                                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ios-space-8)" }}>
                                    <span style={{ fontSize: "var(--ios-fs-footnote)", fontWeight: "600", color: "var(--ios-color-green)" }}>{row.hadir} H</span>
                                    {row.alpha > 0 && <span style={{ fontSize: "var(--ios-fs-footnote)", fontWeight: "600", color: "var(--ios-color-red)" }}>{row.alpha} A</span>}
                                  </div>
                                }>
                                <IOSAvatar name={row.nama_guru} />
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontSize: "var(--ios-fs-headline)", fontWeight: "600", color: "var(--ios-color-text-primary)" }}>{row.nama_guru}</span>
                                  <span style={{ fontSize: "var(--ios-fs-caption)", color: "var(--ios-color-text-secondary)" }}>{row.jtm_7_hari} JTM · {row.jadwal_wajib} Sesi Wajib</span>
                                </div>
                              </IOSListRow>
                            ))}
                          </IOSList>
                        </div>
                      </>
                    )}
                  </IOSSection>

                </div>
              </div>
            )}

            {/* ═══ TAB: ADMIN ═══ */}
            {activeTab === "admin" && (
              <div className="scroll-inertia animate-slide-up" style={{ flex: 1 }}>
                <div className="main-content-scrollable">
                  <div style={{ fontSize: "var(--ios-fs-footnote)", color: "var(--ios-color-text-secondary)", marginTop: "var(--ios-space-4)", marginBottom: "calc(-1 * var(--ios-space-8))" }}>
                    Manajemen scheduler, siaran pesan, dan alarm KBM
                  </div>
                  <div className="admin-grid">
                    
                    {/* Alarm Card */}
                    <IOSCard style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-16)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--ios-space-8)" }}>
                        <NotificationsNoneOutlinedIcon style={{ color: "var(--ios-color-orange)", fontSize: "1.4rem" }} />
                        <h3 style={{ fontSize: "var(--ios-fs-title-3)", fontWeight: 600 }}>Alarm KBM Manual</h3>
                      </div>
                      <div style={{ background: "var(--ios-color-bg-primary)", padding: "12px", borderRadius: "var(--ios-radius-inner)", border: "0.5px solid var(--ios-color-separator)", fontSize: "var(--ios-fs-footnote)", color: "var(--ios-color-text-secondary)" }}>
                        Sistem Waktu: <strong style={{ color: "var(--ios-color-text-primary)" }}>{getFormattedTime()} WIB</strong> · Sasaran: Guru belum absen jam aktif
                      </div>
                      <IOSButton onClick={handleSendAlarm} disabled={alarmLoading || !serverStatus?.botReady} variant="primary" style={{ width: "100%" }} ariaLabel="Kirim alarm pengingat KBM">
                        {alarmLoading ? <IOSLoading /> : <NotificationsNoneOutlinedIcon style={{ fontSize: "1rem" }} />}
                        {alarmLoading ? "Menyiarkan..." : "Kirim Alarm Pengingat"}
                      </IOSButton>
                      {!serverStatus?.botReady && (
                        <p style={{ color: "var(--ios-color-red)", fontSize: "var(--ios-fs-caption)", textAlign: "center" }}>
                          ⚠️ WhatsApp Server Offline. Fitur alarm dinonaktifkan.
                        </p>
                      )}
                    </IOSCard>

                    {/* Auto Rekap Scheduler */}
                    <IOSCard style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-16)", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--ios-space-8)", marginBottom: "var(--ios-space-8)" }}>
                          <TuneOutlinedIcon style={{ color: "var(--ios-color-blue)", fontSize: "1.4rem" }} />
                          <h3 style={{ fontSize: "var(--ios-fs-title-3)", fontWeight: 600 }}>Auto Rekap Harian</h3>
                        </div>
                        
                        <IOSList>
                          <IOSListRow rightContent={
                            <IOSSwitch checked={autoRekapActive} onChange={handleToggleAutoRekap} ariaLabel="Toggle pengiriman rekap otomatis" />
                          }>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "var(--ios-fs-body)", fontWeight: 600, color: "var(--ios-color-text-primary)" }}>Status Scheduler</span>
                              <span style={{ fontSize: "var(--ios-fs-caption)", color: "var(--ios-color-text-secondary)" }}>Kirim Pukul 14:30 WIB</span>
                            </div>
                          </IOSListRow>
                        </IOSList>
                      </div>
                    </IOSCard>

                    {/* Broadcast Card */}
                    <IOSCard style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "var(--ios-space-16)", overflow: "visible" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--ios-space-8)" }}>
                        <CampaignOutlinedIcon style={{ color: "var(--ios-color-blue)", fontSize: "1.4rem" }} />
                        <h3 style={{ fontSize: "var(--ios-fs-title-3)", fontWeight: 600 }}>Siaran Pengumuman Massal</h3>
                      </div>
                      
                      <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-16)" }}>
                        <div style={{ maxWidth: "320px" }}>
                          <label style={{ display: "block", marginBottom: "6px", fontSize: "var(--ios-fs-caption)", fontWeight: "600", color: "var(--ios-color-text-secondary)" }}>Pilih Penerima</label>
                          <AppleSelect
                            className="full-width"
                            value={broadcastTarget}
                            onChange={(e) => setBroadcastTarget(e.target.value)}
                            options={[
                              { value: "TODAY", label: "Guru Terjadwal Hari Ini" },
                              { value: "ALL", label: "Seluruh Kontak Guru Terdaftar" }
                            ]}
                            ariaLabel="Pilih penerima broadcast"
                          />
                        </div>
                        <div className="ios-input-wrapper">
                          <label style={{ fontSize: "var(--ios-fs-caption)", fontWeight: "600", color: "var(--ios-color-text-secondary)" }}>Isi Pesan Siaran</label>
                          <textarea placeholder="Tuliskan pengumuman penting di sini..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} required rows={4}
                            style={{ width: "100%", padding: "12px", background: "var(--ios-color-bg-tertiary)", border: "none", borderRadius: "var(--ios-radius-control)", color: "var(--ios-color-text-primary)", fontFamily: "inherit", fontSize: "var(--ios-fs-body)", resize: "vertical" }} aria-label="Isi pesan broadcast" />
                        </div>
                        <IOSButton type="submit" variant="primary" disabled={broadcastLoading || !broadcastMessage.trim() || !serverStatus?.botReady} style={{ alignSelf: "flex-end", padding: "0 24px" }} ariaLabel="Kirim broadcast sekarang">
                          {broadcastLoading ? <IOSLoading /> : <SendOutlinedIcon style={{ fontSize: "1rem" }} />}
                          {broadcastLoading ? "Mengirim..." : "Siarkan Sekarang"}
                        </IOSButton>
                      </form>
                      {!serverStatus?.botReady && (
                        <p style={{ color: "var(--ios-color-red)", fontSize: "var(--ios-fs-caption)" }}>
                          ⚠️ WhatsApp Server Offline. Fitur siaran dinonaktifkan.
                        </p>
                      )}
                    </IOSCard>

                  </div>
                </div>
              </div>
            )}

            {/* General Footer */}
            <footer style={{ textAlign: "center", color: "var(--ios-color-text-tertiary)", fontSize: "var(--ios-fs-caption)", padding: "var(--ios-space-24) 0", borderTop: "0.5px solid var(--ios-color-separator)" }}>
              MA. Miftahul Ulum 2 © {new Date().getFullYear()}
            </footer>
          </main>

          {/* ═══ 5. IOS SHEET: Detail Guru ═══ */}
          <IOSSheet isOpen={!!teacherDetail} onClose={() => setTeacherDetail(null)}>
            {teacherDetail && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ios-space-16)" }}>
                {/* 1. Header Ringkas */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ios-space-8)", color: "var(--ios-color-text-secondary)" }}>
                    <PersonOutlineOutlinedIcon style={{ fontSize: "1.25rem" }} />
                    <span style={{ fontSize: "var(--ios-fs-footnote)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profil Guru</span>
                  </div>
                  <button onClick={() => setTeacherDetail(null)} className="btn-ghost" aria-label="Tutup" style={{ display: "inline-flex", width: "30px", height: "30px", minWidth: "30px", minHeight: "30px", borderRadius: "50%", background: "var(--ios-color-bg-tertiary)", justifyContent: "center", alignItems: "center", cursor: "pointer", border: "none" }}>
                    <CloseOutlinedIcon style={{ fontSize: "1rem", color: "var(--ios-color-text-secondary)" }} />
                  </button>
                </div>

                {/* 2. Nama & Kontak Utama */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ios-space-16)", paddingBottom: "var(--ios-space-16)", borderBottom: "1px solid var(--ios-color-separator)" }}>
                  <IOSAvatar name={teacherDetail.name} />
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <h2 style={{ fontSize: "var(--ios-fs-title-2)", fontWeight: 600, color: "var(--ios-color-text-primary)", letterSpacing: "-0.2px", lineHeight: "1.25", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {teacherDetail.name}
                    </h2>
                    <span style={{ color: "var(--ios-color-text-secondary)", fontSize: "var(--ios-fs-footnote)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <PhoneAndroidOutlinedIcon style={{ fontSize: "0.9rem" }} /> {teacherDetail.phone || "-"}
                    </span>
                  </div>
                </div>

                {/* Optional Attendance Segmented Input */}
                {teacherDetail.row && (
                  <IOSSection title={`Input Absensi Jam ${selectedJam}`}>
                    <div style={{ width: "100%", marginTop: "var(--ios-space-4)" }}>
                      <IOSSegmentedControl
                        segments={statusActionsList.map(s => ({ value: s.key, label: s.label, cls: s.cls }))}
                        selectedValue={teacherDetail.row.currentStatus}
                        onChange={(newStatus) => {
                          handleStatusClick(teacherDetail.name, teacherDetail.row, teacherDetail.row.currentStatus, newStatus);
                          if (teacherDetail.row.currentStatus === "BELUM") {
                            setTeacherDetail(prev => ({
                              ...prev,
                              row: { ...prev.row, currentStatus: newStatus }
                            }));
                          }
                        }}
                        disabled={actionLoading}
                      />
                    </div>
                  </IOSSection>
                )}

                {/* 3. Ringkasan Kehadiran (Stat Chips) */}
                <IOSSection title="Ringkasan Kehadiran Bulan Ini">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--ios-space-8)", marginTop: "var(--ios-space-4)" }}>
                    {[
                      { l: "Hadir", v: teacherDetail.stats.hadir, c: "hadir", key: "green" },
                      { l: "Izin", v: teacherDetail.stats.izin, c: "izin", key: "yellow" },
                      { l: "Sakit", v: teacherDetail.stats.sakit, c: "sakit", key: "orange" },
                      { l: "Libur", v: teacherDetail.stats.libur, c: "libur", key: "purple" },
                      { l: "Alpa", v: teacherDetail.stats.alpha, c: "alpha", key: "red" }
                    ].map(s => (
                      <div key={s.c} style={{ background: `var(--ios-color-${s.key}-tint)`, border: "1px solid var(--ios-color-separator)", borderRadius: "var(--ios-radius-inner)", padding: "10px 4px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--ios-color-text-secondary)", marginBottom: "4px" }}>{s.l}</span>
                        <span className={`ios-badge ios-badge-${s.c}`} style={{ fontSize: "var(--ios-fs-subheadline)", padding: "2px 6px" }}>{s.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* 4. Informasi Kewajiban */}
                  <div style={{ marginTop: "var(--ios-space-12)", padding: "10px var(--ios-space-16)", background: "var(--ios-color-bg-secondary)", border: "1px solid var(--ios-color-separator)", borderRadius: "var(--ios-radius-inner)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--ios-fs-footnote)", color: "var(--ios-color-text-secondary)", fontWeight: 500 }}>Beban Kerja Wajib</span>
                    <span style={{ fontSize: "var(--ios-fs-footnote)", color: "var(--ios-color-text-primary)", fontWeight: 600 }}>
                      {teacherDetail.stats.jtm_7_hari} JTM/Minggu · {teacherDetail.stats.jadwal_wajib} JTM/Bulan
                    </span>
                  </div>
                </IOSSection>

                {/* 5. Log Terakhir */}
                <IOSSection title="Log Kehadiran Terbaru (Maks. 10)">
                  {teacherDetail.logs.length === 0 ? (
                    <div style={{ background: "var(--ios-color-bg-secondary)", border: "1px solid var(--ios-color-separator)", borderRadius: "var(--ios-radius-inner)", padding: "16px 0", textAlign: "center", color: "var(--ios-color-text-secondary)", fontSize: "var(--ios-fs-footnote)" }}>
                      Belum ada log absensi tercatat.
                    </div>
                  ) : (
                    <div className="ios-list scroll-inertia" style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--ios-color-separator)" }}>
                      {teacherDetail.logs.map((log, i) => (
                        <IOSListRow key={i} rightContent={<IOSBadge status={(log.status || "").toUpperCase()} />}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "var(--ios-color-text-primary)", fontSize: "var(--ios-fs-footnote)", fontWeight: 600 }}>
                              {log.tanggal} <span style={{ color: "var(--ios-color-text-secondary)", fontWeight: 400 }}>({capitalize(log.hari)})</span>
                            </span>
                            <span style={{ color: "var(--ios-color-text-secondary)", fontSize: "var(--ios-fs-caption)" }}>
                              Jam {log.jam} · Kelas {log.kelas || "-"} · {log.mapel || "-"}
                            </span>
                          </div>
                        </IOSListRow>
                      ))}
                    </div>
                  )}
                </IOSSection>
              </div>
            )}
          </IOSSheet>

          {/* ═══ 6. IOS ALERT: Konfirmasi Koreksi ═══ */}
          <IOSAlert isOpen={!!correctionTarget} title="Koreksi Absensi" description={
            correctionTarget ? `Ubah status kehadiran ${correctionTarget.teacherName} pada Jam ${selectedJam} menjadi ${correctionTarget.newStatus}?` : ""
          } actions={[
            { label: "Batal", onClick: () => setCorrectionTarget(null) },
            { label: "Ubah", bold: true, onClick: confirmCorrection }
          ]} />

          {/* ═══ 7. IOS ALERT: Konfirmasi Bulk Action ═══ */}
          <IOSAlert isOpen={!!bulkTargetAction} title="Aksi Absensi Massal" description={
            bulkTargetAction ? `Tandai status ${bulkTargetAction.status} untuk seluruh ${bulkTargetAction.targetsCount} guru yang belum diabsen di KBM Jam ${selectedJam}?` : ""
          } actions={[
            { label: "Batal", onClick: () => setBulkTargetAction(null) },
            { label: "Hadirkan", bold: true, onClick: confirmBulkAction }
          ]} />

        </>
      )}
    </div>
  );
}
