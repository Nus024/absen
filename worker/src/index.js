import { GoogleSheetsHelper } from "./sheets.js";
import { 
  verifyPassword, 
  generateToken, 
  verifyToken,
  normalizePhoneNumber, 
  createResponse, 
  createErrorResponse 
} from "./auth.js";

async function authenticate(request, env) {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new Error("Missing or invalid token");
	}
	const token = authHeader.split(" ")[1];
	const payload = await verifyToken(token, env.JWT_SECRET);
	return payload;
}

function getIndoDayName(dateStr) {
	const d = new Date(dateStr);
	const days = ["ahad", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
	return days[d.getDay()];
}

function getWeekdayCount(year, month) {
	const counts = { ahad: 0, senin: 0, selasa: 0, rabu: 0, kamis: 0, jumat: 0, sabtu: 0 };
	const daysInMonth = new Date(year, month, 0).getDate();
	const dayNames = ['ahad', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']; 
	for (let i = 1; i <= daysInMonth; i++) {
		const date = new Date(year, month - 1, i);
		const dayIdx = date.getDay(); 
		if (dayIdx === 5) continue; // Jumat Libur
		counts[dayNames[dayIdx]]++;
	}
	return counts;
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
				},
			});
		}

		const corsHeaders = { "Access-Control-Allow-Origin": "*" };

		const handleRequest = async () => {
			
			// 1. ENDPOINT STATUS & LOGIN (No Auth)
			if (url.pathname === '/api/status' && request.method === 'GET') {
				return createResponse({ botReady: true });
			}

			if (url.pathname === '/api/login' && request.method === 'POST') {
				try {
					const body = await request.json();
					const { phone, password } = body;
					if (!phone || !password) return createErrorResponse("Nomor WhatsApp dan Password wajib diisi", 422);

					const normalizedPhone = normalizePhoneNumber(phone);
					const sheets = new GoogleSheetsHelper(env);
					
					let data = [];
					try { data = await sheets.readData('Guru!A:D'); }
					catch (e) { data = await sheets.readData('no_wa!A:D'); }

					const rows = data.slice(1); 
					const userRow = rows.find(row => normalizePhoneNumber(row[1]) === normalizedPhone);
					if (!userRow) return createErrorResponse("Nomor WhatsApp tidak terdaftar", 401);

					const namaGuru = userRow[0] || "Guru";
					const passwordHash = userRow[2] || "";
					const role = userRow[3] || "USER";

					if (!passwordHash) return createErrorResponse("Akun belum memiliki password terkonfigurasi. Silakan hubungi admin.", 401);

					const isValid = await verifyPassword(password, passwordHash);
					if (!isValid) return createErrorResponse("Password salah", 401);

					const payload = { phone: normalizedPhone, name: namaGuru, role };
					const token = await generateToken(payload, env.JWT_SECRET);
					return createResponse({ status: "success", message: "Login berhasil", data: { token, user: payload } });
				} catch (error) {
					console.error("[Login Error]", error.message);
					return createErrorResponse("Terjadi kesalahan sistem: " + error.message, 500);
				}
			}

			// ==========================================
			// PROTECTED ENDPOINTS
			// ==========================================
			let user;
			try {
				user = await authenticate(request, env);
			} catch (err) {
				return createErrorResponse("Sesi login berakhir atau tidak valid", 401);
			}

			const sheets = new GoogleSheetsHelper(env);

			// ================= BATCH 1 ==================
			if (url.pathname === '/api/jadwal' && request.method === 'GET') {
				try {
					const reqHari = url.searchParams.get('hari')?.toLowerCase();
					if (!reqHari) return createErrorResponse("Parameter hari wajib diisi", 400);

					const data = await sheets.readData('Jadwal!A:E');
					const rows = data.slice(1); 
					const result = rows.filter(r => (r[0] || "").trim().toLowerCase() === reqHari).map(r => ({
						hari: r[0], jam: r[1], nama_guru: r[2], kelas: r[3], mapel: r[4]
					}));
					
					return createResponse({ meta: { day: reqHari, count: result.length }, data: result });
				} catch (error) {
					return createErrorResponse("Gagal mengambil jadwal: " + error.message, 500);
				}
			}

			if (url.pathname === '/api/kontak' && request.method === 'GET') {
				try {
					let data = [];
					try { data = await sheets.readData('Guru!A:B'); }
					catch (e) { data = await sheets.readData('no_wa!A:B'); }

					const rows = data.slice(1);
					const result = rows.map(r => ({ nama_guru: r[0], nomor_wa: r[1] }));
					return createResponse(result);
				} catch (error) {
					return createErrorResponse("Gagal mengambil kontak: " + error.message, 500);
				}
			}

			if (url.pathname === '/api/rekap' && request.method === 'GET') {
				try {
					const reqTanggal = url.searchParams.get('tanggal');
					const data = await sheets.readData('rekap!A:G');
					const rows = data.slice(1);

					let result = rows.map(r => ({
						tanggal: r[0], hari: r[1], jam: r[2], nama_guru: r[3], kelas: r[4], mapel: r[5], status: r[6]
					}));

					if (reqTanggal) {
						result = result.filter(r => r.tanggal === reqTanggal);
					}
					return createResponse({ meta: { count: result.length }, data: result });
				} catch (error) {
					return createErrorResponse("Gagal mengambil rekap: " + error.message, 500);
				}
			}

			// ================= BATCH 2 ==================
			
			// 1. POST /api/absen
			if (url.pathname === '/api/absen' && request.method === 'POST') {
				try {
					const body = await request.json();
					const { jam, tanggal, data: submitData } = body;
					if (!jam || !tanggal || !Array.isArray(submitData)) {
						return createErrorResponse("Payload tidak lengkap", 400);
					}
					const hari = getIndoDayName(tanggal);
					const valuesToAppend = submitData.map(item => [
						tanggal, hari, jam, item.nama_guru, item.kelas, item.mapel, item.status
					]);

					await sheets.appendData('rekap!A:G', valuesToAppend);
					return createResponse({ status: "success", message: `${valuesToAppend.length} data absensi disimpan` });
				} catch (error) {
					return createErrorResponse("Gagal menyimpan absen: " + error.message, 500);
				}
			}

			// 2. POST /api/koreksi
			if (url.pathname === '/api/koreksi' && request.method === 'POST') {
				try {
					const { nama_guru, jam, tanggal, status_baru } = await request.json();
					if (!nama_guru || !jam || !tanggal || !status_baru) {
						return createErrorResponse("Payload koreksi tidak lengkap", 400);
					}

					// Baca semua rekap untuk mencari baris
					const data = await sheets.readData('rekap!A:G');
					
					// Cari baris yang sesuai (1-based index)
					let rowIndex = -1;
					for (let i = 1; i < data.length; i++) {
						const r = data[i];
						if (r[0] === tanggal && String(r[2]).trim() === String(jam).trim() && (r[3] || "").trim().toLowerCase() === nama_guru.toLowerCase()) {
							rowIndex = i + 1; // Array = 0-based, Header = row 1, Data = i+1
							break;
						}
					}

					if (rowIndex === -1) {
						return createErrorResponse("Data absensi tidak ditemukan untuk dikoreksi", 404);
					}

					// Update baris kolom G (status)
					await sheets.updateData(`rekap!G${rowIndex}:G${rowIndex}`, [[status_baru]]);
					
					return createResponse({ status: "success", message: "Koreksi berhasil" });
				} catch (error) {
					return createErrorResponse("Gagal mengoreksi absen: " + error.message, 500);
				}
			}

			// 3. GET /api/rekap-bulanan
			if (url.pathname === '/api/rekap-bulanan' && request.method === 'GET') {
				try {
					const reqMonth = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1), 10);
					const reqYear = parseInt(url.searchParams.get('year') || new Date().getFullYear(), 10);

					const [jadwalData, rekapData] = await Promise.all([
						sheets.readData('Jadwal!A:E'),
						sheets.readData('rekap!A:G')
					]);

					const jRows = jadwalData.slice(1);
					const lRows = rekapData.slice(1);

					// A. Hitung Beban Jadwal Guru per Hari
					const teacherDayLoad = {};
					jRows.forEach(row => {
						const hari = (row[0] || "").trim().toLowerCase();
						const nama = (row[2] || "").trim();
						if (!nama || hari === "hari") return;

						if (!teacherDayLoad[nama]) teacherDayLoad[nama] = {};
						if (!teacherDayLoad[nama][hari]) teacherDayLoad[nama][hari] = 0;
						teacherDayLoad[nama][hari]++;
					});

					// B. Init tableData
					const tableData = {};
					Object.keys(teacherDayLoad).forEach(nama => {
						tableData[nama] = {
							nama_guru: nama,
							hadir: 0, izin: 0, sakit: 0, libur: 0, alpha: 0,
							total_wajib: 0
						};
					});

					// C. Hitung Total Wajib (Jumat Libur)
					const dayCounts = getWeekdayCount(reqYear, reqMonth);
					Object.keys(teacherDayLoad).forEach(nama => {
						let total = 0;
						Object.keys(teacherDayLoad[nama]).forEach(hari => {
							const countDay = dayCounts[hari] || 0;
							total += (teacherDayLoad[nama][hari] * countDay);
						});
						if (tableData[nama]) tableData[nama].total_wajib = total;
					});

					// D. Proses Rekap (Log Absensi)
					lRows.forEach(row => {
						const rawDate = row[0];
						if (!rawDate || rawDate.toLowerCase() === 'tanggal') return;
						const d = new Date(rawDate);
						if (isNaN(d.getTime())) return;
						if (d.getFullYear() !== reqYear || (d.getMonth() + 1) !== reqMonth) return;

						const nama = String(row[3]).trim();
						let status = String(row[6]).trim().toLowerCase();
						if (status === 'alpa') status = 'alpha';

						if (tableData[nama]) {
							if (['izin', 'sakit', 'libur', 'alpha'].includes(status)) {
								tableData[nama][status]++;
							}
						}
					});

					// E. Finalisasi Hadir
					Object.values(tableData).forEach(t => {
						const absen = t.izin + t.sakit + t.libur + t.alpha;
						t.hadir = Math.max(0, t.total_wajib - absen);
					});

					return createResponse({
						meta: { year: reqYear, month: reqMonth },
						data: Object.values(tableData)
					});
				} catch (error) {
					return createErrorResponse("Gagal mengambil rekap bulanan: " + error.message, 500);
				}
			}

			// 4. GET & POST /api/settings
			if (url.pathname === '/api/settings') {
				try {
					if (request.method === 'GET') {
						let autoRekapActive = true;
						try {
							const data = await sheets.readData('Setting!A1:B10');
							const row = data.find(r => r[0] === 'autoRekapActive');
							if (row && String(row[1]).toUpperCase() === 'FALSE') autoRekapActive = false;
						} catch (e) { /* ignore if sheet missing */ }
						return createResponse({ autoRekapActive });
					}
					else if (request.method === 'POST') {
						const body = await request.json();
						// We'll just assume Setting sheet exists, or we catch
						try {
							// Clear and append
							await sheets.clearData('Setting!A:B');
							await sheets.appendData('Setting!A:B', [['autoRekapActive', String(body.autoRekapActive).toUpperCase()]]);
						} catch (e) { 
							return createErrorResponse("Sheet 'Setting' tidak ditemukan atau gagal diakses. Pastikan Sheet 'Setting' ada.", 404);
						}
						return createResponse({ autoRekapActive: body.autoRekapActive });
					}
				} catch (error) {
					return createErrorResponse("Gagal memproses settings: " + error.message, 500);
				}
			}

			// 8. Broadcast Endpoint
			if (url.pathname === '/api/broadcast' && request.method === 'POST') {
				try {
					const body = await request.json();
					const payload = JSON.stringify(body);
					const id = Date.now().toString();
					const ts = new Date().toISOString();
					await sheets.appendData('Task_Queue!A:F', [[
						id, 'SEND_WHATSAPP', payload, 'PENDING', ts, ''
					]]);
					return createResponse({ message: "Broadcast task queued" });
				} catch (error) {
					return createErrorResponse("Gagal menambahkan task broadcast: " + error.message, 500);
				}
			}

			// 9. Alarm Endpoint
			if (url.pathname === '/api/alarm' && request.method === 'POST') {
				try {
					const id = Date.now().toString();
					const ts = new Date().toISOString();
					await sheets.appendData('Task_Queue!A:F', [[
						id, 'ALARM', '{}', 'PENDING', ts, ''
					]]);
					return createResponse({ message: "Alarm task queued" });
				} catch (error) {
					return createErrorResponse("Gagal menambahkan task alarm: " + error.message, 500);
				}
			}

			// Endpoint Tidak Ditemukan
			return createErrorResponse("Endpoint tidak ditemukan", 404);
		};

		const response = await handleRequest();
		const newHeaders = new Headers(response.headers);
		for (const [key, value] of Object.entries(corsHeaders)) {
			newHeaders.set(key, value);
		}
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders
		});
	},
};
