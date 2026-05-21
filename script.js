function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
}

function copyGuideCode() {
    const code = document.getElementById('vCode').innerText;
    navigator.clipboard.writeText(code);
    alert("Vencord kodu kopyalandı!");
}

// --- YOKLAMA ---
let yData = [];
function loadYoklama() {
    try {
        const val = document.getElementById('inp-json').value;
        yData = JSON.parse(val);
        yData.sort((a,b) => a.name.localeCompare(b.name));
        const list = document.getElementById('m-list');
        list.innerHTML = "";
        yData.forEach((p, i) => {
            list.innerHTML += `
            <div class="row">
                <span class="name">${p.name}</span>
                <div class="opts">
                    <input type="radio" name="r_${i}" id="g_${i}" value="gelen" checked onchange="statsYok()"><label for="g_${i}">Gelen</label>
                    <input type="radio" name="r_${i}" id="m_${i}" value="mazeret" onchange="statsYok()"><label for="m_${i}">Mazeret</label>
                    <input type="radio" name="r_${i}" id="i_${i}" value="izinli" onchange="statsYok()"><label for="i_${i}">İzinli</label>
                    <input type="radio" name="r_${i}" id="y_${i}" value="yok" onchange="statsYok()"><label for="y_${i}">Yok</label>
                </div>
            </div>`;
        });
        document.getElementById('btn-rep').style.display = "block";
        statsYok();
    } catch(e) { alert("JSON Hatası! Veriyi eksiksiz kopyalayın."); }
}

function statsYok() {
    let s = { gelen:0, mazeret:0, izinli:0, yok:0 };
    yData.forEach((_, i) => {
        const rad = document.querySelector(`input[name="r_${i}"]:checked`);
        if(rad) s[rad.value]++;
    });
    document.getElementById('s-total').innerText = yData.length;
    document.getElementById('s-gelen').innerText = s.gelen;
    document.getElementById('s-mazeret').innerText = s.mazeret;
    document.getElementById('s-izinli').innerText = s.izinli;
    document.getElementById('s-yok').innerText = s.yok;
}

function makeReport() {
    let lines = [];
    lines.push("**Yunus Şube Müdürlüğü " + new Date().toLocaleDateString('tr-TR') + " İÇTİMA RAPORU**\n");

    yData.forEach((p, i) => {
        const v = document.querySelector(`input[name="r_${i}"]:checked`).value;
        let statusText = "";
        
        if (v === 'gelen') {
            statusText = "KATILDI";
        } else if (v === 'mazeret') {
            statusText = "MAZERETLİ";
        } else if (v === 'izinli') {
            statusText = "İZİNLİ";
        } else {
            statusText = "**KATILMADI**";
        }
        
        lines.push(`${p.name} : ${statusText}`);
    });

    let res = lines.join('\n');
    navigator.clipboard.writeText(res);
    alert("Rapor kopyalandı!");
}

// --- CEZA ANALİZİ (EN STABİL VERSİYON) ---
let cData = {};
function loadCezalar() {
    const unit = document.getElementById('sel-unit').value;
    const rawText = document.getElementById('inp-logs').value;
    
    // Satırları temizleyerek diziye al
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    cData = {};
    let currentOfficer = null;
    let currentPunish = null;
    let isReadingCrime = false;

    lines.forEach(line => {
        const lowerLine = line.toLowerCase();

        // 1. PERSONEL YAKALA
        const offMatch = line.match(new RegExp(`^\\[(${unit}-\\d{2})\\]\\s+([^—\\[,]+)`));
        if (offMatch) {
            currentOfficer = `[${offMatch[1]}] ${offMatch[2].trim()}`;
            if (!cData[currentOfficer]) cData[currentOfficer] = [];
            isReadingCrime = false;
            return;
        }

        if (!currentOfficer) return;

        // 2. AD SOYAD YAKALA (Yeni Ceza Başlangıcı)
        if (lowerLine.includes("ad soyad")) {
            const parts = line.split(/ad soyad\s*[:\s-]*\s*/i);
            const name = parts[1] ? parts[1].trim() : "Bilinmiyor";
            
            currentPunish = { isim: name, sebep: "", fiyat: 0 };
            cData[currentOfficer].push(currentPunish);
            
            // Ad soyad'dan sonra suç okumaya hazırız
            isReadingCrime = true; 
            return;
        }

        // 3. PARA CEZASI YAKALA (Okumayı Burada Bitir)
        if (lowerLine.includes("ceza") && /\d/.test(line)) {
            isReadingCrime = false;
            const digits = line.match(/\d+/g);
            if (currentPunish && digits) {
                currentPunish.fiyat = parseInt(digits.join("")) || 0;
            }
            return;
        }

        // 4. TARİH SATIRI (Güvenlik Önlemi)
        if (lowerLine.includes("tarih")) {
            isReadingCrime = false;
            return;
        }

        // 5. ARADA KALAN HER ŞEYİ SUÇ OLARAK EKLE
        if (isReadingCrime && currentPunish) {
            // "İşlenen suç" başlığını metinden temizle (eğer o satırdaysak)
            let cleanLine = line.replace(/işlenen suç[:\s-]*/i, "").replace(/islenen suc[:\s-]*/i, "").trim();
            
            if (cleanLine) {
                currentPunish.sebep += (currentPunish.sebep ? " " : "") + cleanLine;
            }
        }
    });

    // Boş kalan sebep varsa temizle
    Object.values(cData).forEach(offArr => {
        offArr.forEach(p => {
            p.sebep = p.sebep.replace(/-+$/, "").trim() || "Belirtilmedi";
        });
    });

    renderCezalar();
}

function renderCezalar() {
    const d = document.getElementById('res-ceza'); 
    d.innerHTML = "";
    let gT = 0;
    
    for (let off in cData) {
        let oT = cData[off].reduce((a, b) => a + b.fiyat, 0); 
        gT += oT;
        
        d.innerHTML += `
            <div class="off-card">
                <div class="off-head" onclick="toggleDetails('${off}')">
                    <span>${off}</span>
                    <span style="color:var(--success)">${oT.toLocaleString()} TL</span>
                </div>
                <div id="l-${off}" class="p-list">
                    ${cData[off].map((p, i) => `
                        <div class="punish-item">
                            <div class="punish-text">
                                <b>${i+1}.</b> ${p.isim} | ${p.sebep}
                            </div>
                            <div class="punish-price-zone">
                                <span style="color:var(--warning); font-weight:700;">${p.fiyat.toLocaleString()} TL</span>
                                <button class="del-btn" onclick="remPunish('${off}', ${i})">X</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }
    const b = document.getElementById('banner-ceza');
    b.innerText = `BİRİM GENEL TOPLAM: ${gT.toLocaleString()} TL`;
    b.style.display = gT > 0 ? "block" : "none";
}

function toggleDetails(id) {
    const e = document.getElementById(`l-${id}`);
    e.style.display = (e.style.display === 'block' ? 'none' : 'block');
}

function remPunish(off, i) {
    cData[off].splice(i,1);
    if(!cData[off].length) delete cData[off];
    renderCezalar();
}