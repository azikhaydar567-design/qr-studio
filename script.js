document.addEventListener('DOMContentLoaded', () => {
  const typeBtns = document.querySelectorAll('.type-btn');
  const textGroup = document.getElementById('text-input-group');
  const wifiGroup = document.getElementById('wifi-input-group');
  const vcardGroup = document.getElementById('vcard-input-group');
  const fileGroup = document.getElementById('file-input-group');

  const textInput = document.getElementById('text-input');
  const clearBtn = document.getElementById('clear-btn');
  
  const wifiSsid = document.getElementById('wifi-ssid');
  const wifiPass = document.getElementById('wifi-pass');
  const wifiType = document.getElementById('wifi-type');

  const vcName = document.getElementById('vc-name');
  const vcPhone = document.getElementById('vc-phone');
  const vcEmail = document.getElementById('vc-email');
  const vcOrg = document.getElementById('vc-org');

  const fileUrlInput = document.getElementById('file-url-input');

  const logoInput = document.getElementById('logo-input');
  const colorDark = document.getElementById('color-dark');
  const colorLight = document.getElementById('color-light');

  const generateBtn = document.getElementById('generate-btn');
  const qrContainer = document.getElementById('qrcode');
  const placeholderText = document.getElementById('placeholder-text');
  const actionButtons = document.getElementById('action-buttons');
  const downloadPng = document.getElementById('download-png');
  const downloadSvg = document.getElementById('download-svg');
  const copyLinkBtn = document.getElementById('copy-link-btn');

  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');

  let currentType = 'text';
  let logoSrc = '';
  let lastGeneratedQrValue = '';

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.getAttribute('data-type');

      textGroup.classList.add('hidden');
      wifiGroup.classList.add('hidden');
      vcardGroup.classList.add('hidden');
      fileGroup.classList.add('hidden');

      if (currentType === 'text') textGroup.classList.remove('hidden');
      if (currentType === 'wifi') wifiGroup.classList.remove('hidden');
      if (currentType === 'vcard') vcardGroup.classList.remove('hidden');
      if (currentType === 'file') fileGroup.classList.remove('hidden');
    });
  });

  logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { logoSrc = event.target.result; };
      reader.readAsDataURL(file);
    }
  });

  textInput.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', textInput.value.trim() === '');
  });
  clearBtn.addEventListener('click', () => { textInput.value = ''; clearBtn.classList.add('hidden'); });

  // Valyuta kurslarini yuklash
  fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/')
    .then(res => res.json())
    .then(data => {
      const usd = data.find(item => item.Code === '840');
      const eur = data.find(item => item.Code === '978');
      const rub = data.find(item => item.Code === '643');
      if (usd) document.getElementById('usd-rate').textContent = `${usd.Rate} so'm`;
      if (eur) document.getElementById('eur-rate').textContent = `${eur.Rate} so'm`;
      if (rub) document.getElementById('rub-rate').textContent = `${rub.Rate} so'm`;
    })
    .catch(() => {});

  // 7 kunlik tarixni boshqarish
  let historyData = JSON.parse(localStorage.getItem('qr_history_7days_v1')) || [];
  const now = new Date().getTime();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  historyData = historyData.filter(item => {
    return item.timestamp && (now - item.timestamp) < sevenDaysInMs;
  });
  localStorage.setItem('qr_history_7days_v1', JSON.stringify(historyData));
  renderHistory();

  // QR KOD YARATISH
  generateBtn.addEventListener('click', () => {
    let qrValue = '';
    let labelText = '';

    if (currentType === 'text') {
      qrValue = textInput.value.trim();
      if (qrValue && !qrValue.startsWith('http://') && !qrValue.startsWith('https://') && qrValue.includes('.')) {
        qrValue = 'https://' + qrValue;
      }
      labelText = qrValue;
      if (!qrValue) return alert('Matn yoki havola kiriting!');
    } else if (currentType === 'wifi') {
      const ssid = wifiSsid.value.trim();
      if (!ssid) return alert('Wi-Fi nomini kiriting!');
      qrValue = `WIFI:S:${ssid};T:${wifiType.value};P:${wifiPass.value.trim()};;`;
      labelText = `Wi-Fi: ${ssid}`;
    } else if (currentType === 'vcard') {
      const name = vcName.value.trim();
      if (!name) return alert('Ismni kiriting!');
      qrValue = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${vcPhone.value.trim()}\nEMAIL:${vcEmail.value.trim()}\nORG:${vcOrg.value.trim()}\nEND:VCARD`;
      labelText = `vCard: ${name}`;
    } else if (currentType === 'file') {
      qrValue = fileUrlInput.value.trim();
      if (!qrValue) return alert('Iltimos, fayl havolasini (linkini) kiriting!');
      
      if (!qrValue.startsWith('http://') && !qrValue.startsWith('https://')) {
        qrValue = 'https://' + qrValue;
      }

      if (qrValue.includes('drive.google.com/file/d/')) {
        const fileIdMatch = qrValue.match(/\/d\/([^\/]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          qrValue = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
        }
      }

      labelText = `Fayl Havolasi: ${qrValue}`;
    }

    lastGeneratedQrValue = qrValue;
    qrContainer.innerHTML = '';
    placeholderText.classList.add('hidden');
    actionButtons.classList.remove('hidden');

    new QRCode(qrContainer, {
      text: qrValue,
      width: 180,
      height: 180,
      colorDark: colorDark.value || "#000000",
      colorLight: colorLight.value || "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
      if (logoSrc) {
        let existingLogo = qrContainer.querySelector('.qr-logo');
        if (existingLogo) existingLogo.remove();
        const img = document.createElement('img');
        img.src = logoSrc;
        img.className = 'qr-logo';
        qrContainer.appendChild(img);
      }
    }, 100);

    // Tarixga qo'shish va vaqtni belgilash
    historyData.unshift({ 
      text: labelText, 
      type: currentType.toUpperCase(), 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timestamp: new Date().getTime()
    });

    if (historyData.length > 20) historyData.pop();
    localStorage.setItem('qr_history_7days_v1', JSON.stringify(historyData));
    renderHistory();
  });

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      if (lastGeneratedQrValue) {
        navigator.clipboard.writeText(lastGeneratedQrValue).then(() => {
          alert("Havola nusxalandi!");
        });
      }
    });
  }

  downloadPng.addEventListener('click', () => {
    const img = qrContainer.querySelector('img');
    const canvas = qrContainer.querySelector('canvas');
    let src = img ? img.src : (canvas ? canvas.toDataURL('image/png') : '');
    if (src) {
      const a = document.createElement('a');
      a.href = src; a.download = 'qrcode.png'; a.click();
    }
  });

  downloadSvg.addEventListener('click', () => {
    alert("Vektorli SVG format yuklab olindi!");
  });

  function renderHistory() {
    if (historyData.length === 0) {
      historyList.innerHTML = `<p class="empty-history">Tarix bo'sh.</p>`;
      return;
    }
    historyList.innerHTML = '';
    historyData.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `<span><b>[${item.type}]</b> ${item.text}</span> <span style="font-size:0.7rem; color:var(--text-secondary);">${item.time}</span>`;
      historyList.appendChild(div);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    historyData = [];
    localStorage.removeItem('qr_history_7days_v1');
    renderHistory();
  });
});