function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
}

function copyGuideCode() {
    const code = document.getElementById('vCode').innerText;
    navigator.clipboard.writeText(code);
    showToast("Vencord kodu kopyalandı!", "success");
}

function updateGuideCode() {
    const roleId = document.getElementById('guide-role-select').value;
    const code = `(async () => { 
    const rId = "${roleId}"; 
    const { GuildMemberStore, UserStore } = Vencord.Webpack.Common; 
    const gId = window.location.pathname.split('/')[2]; 
    const raw = GuildMemberStore.getMembers(gId); 
    const m = Object.values(raw).filter(x => x.roles.includes(rId)).map(x => ({ 
        id: x.userId, name: x.nick || UserStore.getUser(x.userId).username 
    })); 
    console.log(JSON.stringify(m)); 
    alert(m.length + " kişi hazır."); 
})();`;
    document.getElementById('vCode').innerText = code;
}

// --- YOKLAMA ---
let yData = [];
let izinData = {};
function loadYoklama() {
    try {
        const val = document.getElementById('inp-json').value;
        yData = JSON.parse(val);
        yData.sort((a,b) => a.name.localeCompare(b.name));
        const list = document.getElementById('m-list');
        list.innerHTML = "";
        yData.forEach((p, i) => {
            let v = 'yok';
            let today = new Date().toISOString().split('T')[0];
            if (izinData[p.name] && izinData[p.name] >= today) {
                v = 'izinli';
            }
            let g = v === 'gelen' ? 'checked' : '';
            let m = v === 'mazeret' ? 'checked' : '';
            let iz = v === 'izinli' ? 'checked' : '';
            let yk = v === 'yok' ? 'checked' : '';
            let iDate = izinData[p.name] || '';

            list.innerHTML += `
            <div class="row">
                <span class="name">${p.name}</span>
                <input type="date" class="izin-date" title="İzin Bitiş Tarihi" onchange="setIzin('${p.name}', this.value)" value="${iDate}">
                <div class="opts">
                    <input type="radio" name="r_${i}" id="g_${i}" value="gelen" ${g} onchange="statsYok()"><label for="g_${i}">Gelen</label>
                    <input type="radio" name="r_${i}" id="m_${i}" value="mazeret" ${m} onchange="statsYok()"><label for="m_${i}">Mazeret</label>
                    <input type="radio" name="r_${i}" id="i_${i}" value="izinli" ${iz} onchange="statsYok()"><label for="i_${i}">İzinli</label>
                    <input type="radio" name="r_${i}" id="y_${i}" value="yok" ${yk} onchange="statsYok()"><label for="y_${i}">Yok</label>
                </div>
            </div>`;
        });
        document.getElementById('btn-rep').style.display = "block";
        statsYok();
        saveState();
    } catch(e) { showToast("JSON Hatası! Veriyi eksiksiz kopyalayın.", "error"); }
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
    saveState();
}

function setIzin(name, dateVal) {
    if(dateVal) {
        izinData[name] = dateVal;
    } else {
        delete izinData[name];
    }
    localStorage.setItem('ictima_izinler', JSON.stringify(izinData));
    
    let today = new Date().toISOString().split('T')[0];
    let isIzinli = (dateVal && dateVal >= today);
    
    yData.forEach((p, i) => {
        if(p.name === name) {
            if(isIzinli) {
                document.getElementById(`i_${i}`).checked = true;
            } else {
                document.getElementById(`y_${i}`).checked = true;
            }
            statsYok();
        }
    });
}

function resetList() {
    let today = new Date().toISOString().split('T')[0];
    yData.forEach((p, i) => {
        let isIzinli = false;
        if(izinData[p.name] && izinData[p.name] >= today) {
            isIzinli = true;
        }
        
        if (isIzinli) {
            document.getElementById(`i_${i}`).checked = true;
        } else {
            document.getElementById(`y_${i}`).checked = true;
        }
    });
    statsYok();
    showToast("Liste sıfırlandı!", "info");
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
    showToast("Rapor kopyalandı!", "success");
}

// --- GÜN SONU RAPORU ---
function generateGunSonu() {
    const tarih = document.getElementById('gs-tarih').value;
    const faaliyet = document.getElementById('gs-faaliyet').value;
    const gbt = document.getElementById('gs-gbt').value;
    const islem = document.getElementById('gs-islem').value;
    let ele = document.getElementById('gs-ele').value.trim();

    let formatliTarih = new Date().toLocaleDateString('tr-TR');
    if (tarih) {
        const parts = tarih.split('-');
        formatliTarih = `${parts[2]}.${parts[1]}.${parts[0]}`;
    }

    let eleGecirilenText = "";
    if (ele === "") {
        eleGecirilenText = "Herhangi bir suç unsuruna rastlanmamıştır.";
    } else {
        eleGecirilenText = `${ele} ele geçirilmiştir.`;
    }

    const rapor = `${formatliTarih} Yunus Motorize Şube Müdürlüğü
Gün İçi Durum Raporu

${faaliyet}

Toplam ${gbt} Şahsa GBT yapılmış, ${islem} şahıs hakkında adli/idari işlem uygulanmıştır.
Ayrıca yapılan aramalarda ${eleGecirilenText}`;

    const modalContent = document.getElementById('modal-content');
    modalContent.innerText = rapor;
    
    const modal = document.getElementById('gs-modal');
    modal.style.display = "flex";
}

// --- TOAST VE LOKAL KAYIT SİSTEMİ ---
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function saveState() {
    if (!document.getElementById('inp-json')) return;
    localStorage.setItem('ictima_json', document.getElementById('inp-json').value);
    
    // Radyo buton seçimlerini kaydet
    let selections = {};
    if (typeof yData !== 'undefined') {
        yData.forEach((p, i) => {
            const rad = document.querySelector(`input[name="r_${i}"]:checked`);
            if(rad) selections[p.name] = rad.value;
        });
    }
    localStorage.setItem('ictima_selections', JSON.stringify(selections));

    // Gün sonu kayıtları
    if(document.getElementById('gs-tarih')) {
        localStorage.setItem('gs_tarih', document.getElementById('gs-tarih').value);
        localStorage.setItem('gs_faaliyet', document.getElementById('gs-faaliyet').value);
        localStorage.setItem('gs_gbt', document.getElementById('gs-gbt').value);
        localStorage.setItem('gs_islem', document.getElementById('gs-islem').value);
        localStorage.setItem('gs_ele', document.getElementById('gs-ele').value);
    }
}

function loadState() {
    // Gün sonu verilerini getir
    if(document.getElementById('gs-tarih')) {
        const gsTarih = localStorage.getItem('gs_tarih');
        if (gsTarih) document.getElementById('gs-tarih').value = gsTarih;
        else document.getElementById('gs-tarih').value = new Date().toISOString().split('T')[0];

        const gsFaaliyet = localStorage.getItem('gs_faaliyet');
        if (gsFaaliyet) document.getElementById('gs-faaliyet').value = gsFaaliyet;

        const gsGbt = localStorage.getItem('gs_gbt');
        if (gsGbt) document.getElementById('gs-gbt').value = gsGbt;

        const gsIslem = localStorage.getItem('gs_islem');
        if (gsIslem) document.getElementById('gs-islem').value = gsIslem;

        const gsEle = localStorage.getItem('gs_ele');
        if (gsEle) document.getElementById('gs-ele').value = gsEle;
    }

    const savedJson = localStorage.getItem('ictima_json');
    const savedIzin = localStorage.getItem('ictima_izinler');
    if (savedIzin) {
        try { izinData = JSON.parse(savedIzin); } catch(e){}
    }
    
    if (savedJson && savedJson.trim() !== '') {
        document.getElementById('inp-json').value = savedJson;
        try {
            yData = JSON.parse(savedJson);
            yData.sort((a,b) => a.name.localeCompare(b.name));
            const list = document.getElementById('m-list');
            list.innerHTML = "";
            const savedSels = JSON.parse(localStorage.getItem('ictima_selections') || '{}');
            
            yData.forEach((p, i) => {
                let v = savedSels[p.name] || 'yok';
                
                let today = new Date().toISOString().split('T')[0];
                if (izinData[p.name] && izinData[p.name] >= today) {
                    v = 'izinli';
                }

                let g = v === 'gelen' ? 'checked' : '';
                let m = v === 'mazeret' ? 'checked' : '';
                let iz = v === 'izinli' ? 'checked' : '';
                let yk = v === 'yok' ? 'checked' : '';
                let iDate = izinData[p.name] || '';

                list.innerHTML += `
                <div class="row">
                    <span class="name">${p.name}</span>
                    <input type="date" class="izin-date" title="İzin Bitiş Tarihi" onchange="setIzin('${p.name}', this.value)" value="${iDate}">
                    <div class="opts">
                        <input type="radio" name="r_${i}" id="g_${i}" value="gelen" ${g} onchange="statsYok()"><label for="g_${i}">Gelen</label>
                        <input type="radio" name="r_${i}" id="m_${i}" value="mazeret" ${m} onchange="statsYok()"><label for="m_${i}">Mazeret</label>
                        <input type="radio" name="r_${i}" id="i_${i}" value="izinli" ${iz} onchange="statsYok()"><label for="i_${i}">İzinli</label>
                        <input type="radio" name="r_${i}" id="y_${i}" value="yok" ${yk} onchange="statsYok()"><label for="y_${i}">Yok</label>
                    </div>
                </div>`;
            });
            document.getElementById('btn-rep').style.display = "block";
            statsYok();
        } catch(e) {}
    }
    
    if(document.getElementById('guide-role-select')) {
        updateGuideCode();
    }
}

document.addEventListener('DOMContentLoaded', loadState);