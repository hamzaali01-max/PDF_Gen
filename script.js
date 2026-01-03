document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & State ---
    const APP_STATE_KEY = 'antigravity_pdf_v2_state';

    // Default State
    const defaultState = {
        meta: {
            title: '',
            author: '',
            date: new Date().toISOString().split('T')[0],
        },
        settings: {
            template: 'professional',
            fontTitle: 'Orbitron',
            fontBody: 'Rajdhani',
            colorTitle: '#000000',
            colorBody: '#000000',
            fontSize: 'medium',
        },
        content: {
            pages: [{ id: 'page_1', content: '' }],
            footer: ''
        },
        images: [],
        stats: { words: 0, chars: 0, readingTime: 0 },
        goal: 0
    };

    let state = loadState() || JSON.parse(JSON.stringify(defaultState));
    let history = [];
    const MAX_HISTORY = 10;
    let exportFormat = 'pdf';

    // --- DOM Elements ---
    const elems = {
        title: document.getElementById('input-title'),
        author: document.getElementById('input-author'),
        template: document.getElementById('select-template'),
        footer: document.getElementById('input-footer'),
        fontTitle: document.getElementById('font-title'),
        fontBody: document.getElementById('font-body'),
        colorTitle: document.getElementById('color-title'),
        colorBody: document.getElementById('color-body'),
        fontSize: document.getElementById('font-size'),
        btnResetStyle: document.getElementById('btn-reset-style'),
        customizationPanel: document.getElementById('customization-panel'),
        toggleCustomization: document.getElementById('toggle-customization'),
        imagesPanel: document.getElementById('images-panel'),
        toggleImages: document.getElementById('toggle-images'),
        statWords: document.getElementById('stat-words'),
        statChars: document.getElementById('stat-chars'),
        statTime: document.getElementById('stat-time'),
        statPages: document.getElementById('stat-pages'),
        pagesContainer: document.getElementById('pages-container'),
        btnAddPage: document.getElementById('btn-add-page'),
        previewWrapper: document.getElementById('preview-container-wrapper'),
        btnGenerate: document.getElementById('btn-generate'),
        exportOptions: document.querySelectorAll('.export-option'),
        btnCopy: document.getElementById('btn-copy'),
        btnHistory: document.getElementById('btn-version-history'),
        btnNew: document.getElementById('btn-new-doc'),
        btnPrint: document.getElementById('btn-preview-print'),
        alertContainer: document.getElementById('alert-container'),
        versionModal: document.getElementById('version-modal'),
        versionList: document.getElementById('version-list'),
        tableModal: document.getElementById('table-modal'),
        tableRows: document.getElementById('table-rows'),
        tableCols: document.getElementById('table-cols'),
        btnInsertTable: document.getElementById('btn-insert-table'),
        closeModals: document.querySelectorAll('.close-modal'),
        imageInput: document.getElementById('image-input'),
        uploadZone: document.getElementById('image-upload-zone'),
        imageList: document.getElementById('image-list')
    };

    init();

    function init() {
        setupRippleEffect();
        setupEventListeners();
        renderUI();
        startAutoSave();
    }

    function setupEventListeners() {
        if (elems.title) elems.title.addEventListener('input', (e) => updateState('meta.title', e.target.value));
        if (elems.author) elems.author.addEventListener('input', (e) => updateState('meta.author', e.target.value));
        if (elems.footer) elems.footer.addEventListener('input', (e) => updateState('content.footer', e.target.value));
        if (elems.template) elems.template.addEventListener('change', (e) => updateState('settings.template', e.target.value));
        if (elems.fontTitle) elems.fontTitle.addEventListener('change', (e) => updateState('settings.fontTitle', e.target.value));
        if (elems.fontBody) elems.fontBody.addEventListener('change', (e) => updateState('settings.fontBody', e.target.value));
        if (elems.colorTitle) elems.colorTitle.addEventListener('input', (e) => updateState('settings.colorTitle', e.target.value));
        if (elems.colorBody) elems.colorBody.addEventListener('input', (e) => updateState('settings.colorBody', e.target.value));
        if (elems.fontSize) elems.fontSize.addEventListener('change', (e) => updateState('settings.fontSize', e.target.value));

        if (elems.btnResetStyle) elems.btnResetStyle.addEventListener('click', () => {
            state.settings = JSON.parse(JSON.stringify(defaultState.settings));
            renderUI();
            saveState();
            showAlert('Styles Reset', 'success');
        });

        if (elems.toggleCustomization) elems.toggleCustomization.addEventListener('click', () => {
            elems.customizationPanel.classList.toggle('collapsed');
            elems.toggleCustomization.classList.toggle('active');
        });
        if (elems.toggleImages) elems.toggleImages.addEventListener('click', () => {
            elems.imagesPanel.classList.toggle('collapsed');
            elems.toggleImages.classList.toggle('active');
        });

        if (elems.btnAddPage) elems.btnAddPage.addEventListener('click', () => {
            state.content.pages.push({ id: `page_${Date.now()}`, content: '' });
            renderUI(); saveState();
        });

        const toolbar = document.querySelector('.toolbar');
        if (toolbar) toolbar.addEventListener('click', handleToolbarClick);

        elems.exportOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                elems.exportOptions.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                exportFormat = btn.dataset.format;
            });
        });

        if (elems.btnGenerate) elems.btnGenerate.addEventListener('click', handleDownload);
        if (elems.btnCopy) elems.btnCopy.addEventListener('click', handleCopy);
        if (elems.btnPrint) elems.btnPrint.addEventListener('click', handlePrint);

        elems.closeModals.forEach(btn => btn.addEventListener('click', () => {
            elems.versionModal.classList.add('hidden');
            elems.tableModal.classList.add('hidden');
        }));

        if (elems.btnInsertTable) elems.btnInsertTable.addEventListener('click', insertTable);

        if (elems.uploadZone) elems.uploadZone.addEventListener('click', () => elems.imageInput.click());
        if (elems.imageInput) elems.imageInput.addEventListener('change', handleImageUpload);
        if (elems.uploadZone) elems.uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); elems.uploadZone.style.background = 'rgba(79, 70, 229, 0.05)'; });
        if (elems.uploadZone) elems.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) handleImageUpload({ target: { files: e.dataTransfer.files } });
        });

        if (elems.btnHistory) elems.btnHistory.addEventListener('click', showHistory);
        if (elems.btnNew) elems.btnNew.addEventListener('click', () => {
            if (confirm('Start new document?')) {
                state = JSON.parse(JSON.stringify(defaultState));
                renderUI(); saveState();
            }
        });
    }

    function setupRippleEffect() {
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('ripple-btn') || e.target.closest('.ripple-btn')) {
                const button = e.target.classList.contains('ripple-btn') ? e.target : e.target.closest('.ripple-btn');
                const circle = document.createElement('span');
                const diameter = Math.max(button.clientWidth, button.clientHeight);
                const radius = diameter / 2;
                const rect = button.getBoundingClientRect();
                circle.style.width = circle.style.height = `${diameter}px`;
                circle.style.left = `${e.clientX - rect.left - radius}px`;
                circle.style.top = `${e.clientY - rect.top - radius}px`;
                circle.classList.add('ripple');
                const existingRipple = button.getElementsByClassName('ripple')[0];
                if (existingRipple) existingRipple.remove();
                button.appendChild(circle);
            }
        });
    }

    function updateState(path, value) {
        const keys = path.split('.');
        let obj = state;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = value;

        if (path.startsWith('settings.')) updatePreviewStyles();
        else if (path.startsWith('meta') || path.startsWith('content')) { renderPreviewContent(); updateStats(); }
    }

    function loadState() { const s = localStorage.getItem(APP_STATE_KEY); return s ? JSON.parse(s) : null; }
    function saveState() {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
        if (document.getElementById('save-status')) document.getElementById('save-status').textContent = `Saved ${new Date().toLocaleTimeString()}`;
        if (history.length === 0 || Date.now() - history[history.length - 1].timestamp > 60000) {
            history.push({ timestamp: Date.now(), data: JSON.parse(JSON.stringify(state)) });
            if (history.length > MAX_HISTORY) history.shift();
        }
    }
    function startAutoSave() { setInterval(saveState, 30000); }

    function renderUI() {
        if (elems.title) elems.title.value = state.meta.title;
        if (elems.author) elems.author.value = state.meta.author;
        if (elems.template) elems.template.value = state.settings.template;
        if (elems.footer) elems.footer.value = state.content.footer;
        if (elems.fontTitle) elems.fontTitle.value = state.settings.fontTitle;
        if (elems.fontBody) elems.fontBody.value = state.settings.fontBody;
        if (elems.colorTitle) elems.colorTitle.value = state.settings.colorTitle;
        if (elems.colorBody) elems.colorBody.value = state.settings.colorBody;
        if (elems.fontSize) elems.fontSize.value = state.settings.fontSize;

        renderPageInputs();
        renderPreviewContent();
        updatePreviewStyles();
        updateStats();
        renderImageList();
    }

    function renderPageInputs() {
        if (!elems.pagesContainer) return;
        elems.pagesContainer.innerHTML = '';
        state.content.pages.forEach((page, index) => {
            const div = document.createElement('div');
            div.className = 'input-group mt-2';
            div.innerHTML = `<label>PAGE ${index + 1} <span class="delete-page" data-idx="${index}" style="float:right; cursor:pointer; color:#EF4444;"><i class="fas fa-trash"></i></span></label>`;

            const txt = document.createElement('textarea');
            txt.rows = 8;
            txt.placeholder = `Page ${index + 1} content...`;
            txt.value = page.content;
            txt.addEventListener('input', (e) => { state.content.pages[index].content = e.target.value; renderPreviewContent(); updateStats(); });
            txt.addEventListener('focus', () => window.lastFocusedInput = txt);

            const delBtn = div.querySelector('.delete-page');
            if (state.content.pages.length > 1) {
                delBtn.addEventListener('click', () => { if (confirm('Remove page?')) { state.content.pages.splice(index, 1); renderUI(); saveState(); } });
            } else delBtn.style.display = 'none';

            div.appendChild(txt);
            elems.pagesContainer.appendChild(div);
        });
    }

    function renderPreviewContent() {
        if (!elems.previewWrapper) return;
        elems.previewWrapper.innerHTML = '';
        const headerImgs = state.images.filter(i => i.position === 'header');
        const footerImgs = state.images.filter(i => i.position === 'footer');

        state.content.pages.forEach((page, index) => {
            const paper = document.createElement('div');
            paper.className = 'paper';
            let html = '';

            headerImgs.forEach(img => html += `<img src="${img.data}" style="max-width:100%; max-height:80px; display:block; margin:0 auto 15px;">`);

            if (index === 0) {
                html += `<h1 class="preview-doc-title">${state.meta.title || 'Untitled Document'}</h1><p class="preview-doc-meta">${state.meta.author || ''} ${state.meta.date ? '| ' + state.meta.date : ''}</p><hr class="preview-divider">`;
            }

            html += `<div class="preview-body">${parseMarkdown(page.content)}</div>`;

            html += `<div class="preview-doc-footer">`;
            if (footerImgs.length) {
                html += `<div style="text-align:center; margin-bottom:10px;">`;
                footerImgs.forEach(img => html += `<img src="${img.data}" style="max-height:50px; display:inline-block; margin:5px;">`);
                html += `</div>`;
            }
            html += `<span>${state.content.footer}</span> <span style="float:right">${index + 1}/${state.content.pages.length}</span></div>`;

            paper.innerHTML = html;
            elems.previewWrapper.appendChild(paper);
        });
    }

    function updatePreviewStyles() {
        if (!elems.previewWrapper) return;
        elems.previewWrapper.className = `template-${state.settings.template}`;
        document.querySelectorAll('.paper').forEach(paper => {
            const title = paper.querySelector('.preview-doc-title'); if (title) { title.style.fontFamily = state.settings.fontTitle; title.style.color = state.settings.colorTitle; }
            const body = paper.querySelector('.preview-body'); if (body) {
                body.style.fontFamily = state.settings.fontBody;
                body.style.color = state.settings.colorBody;
                body.style.fontSize = { small: '12px', medium: '15px', large: '18px', xl: '22px' }[state.settings.fontSize];
            }
        });
    }

    function updateStats() {
        let text = state.content.pages.map(p => p.content).join(' ');
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        if (elems.statWords) elems.statWords.textContent = words;
        if (elems.statChars) elems.statChars.textContent = text.length;
        if (elems.statTime) elems.statTime.textContent = `${Math.ceil(words / 200)}m`;
        if (elems.statPages) elems.statPages.textContent = state.content.pages.length;
    }

    function parseMarkdown(text) {
        if (!text) return '';
        let html = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/__(.*?)__/g, '<u>$1</u>');
        if (html.includes('- ')) html = html.replace(/<br>- (.*)/g, '<br>• $1');
        state.images.filter(i => i.position === 'inline').forEach(img => {
            const ph = `[IMG:${img.name}]`;
            if (html.includes(ph)) html = html.replace(ph, `<img src="${img.data}" style="max-width:100%; display:block; margin: 10px auto;">`);
        });
        return html;
    }

    function handleToolbarClick(e) {
        const btn = e.target.closest('.tool-btn');
        if (!btn || !window.lastFocusedInput) return;
        const tool = btn.dataset.tool;
        const input = window.lastFocusedInput;
        const start = input.selectionStart, end = input.selectionEnd, text = input.value;
        let newText = text;

        if (tool === 'bold') newText = text.slice(0, start) + `**${text.slice(start, end)}**` + text.slice(end);
        if (tool === 'italic') newText = text.slice(0, start) + `*${text.slice(start, end)}*` + text.slice(end);
        if (tool === 'underline') newText = text.slice(0, start) + `__${text.slice(start, end)}__` + text.slice(end);
        if (tool === 'list-ul') newText = text.slice(0, start) + `\n- ${text.slice(start, end)}` + text.slice(end);
        if (tool === 'list-ol') newText = text.slice(0, start) + `\n1. ${text.slice(start, end)}` + text.slice(end);
        if (tool === 'hr') newText = text.slice(0, start) + `\n---\n` + text.slice(end);
        if (tool === 'table') { elems.tableModal.classList.remove('hidden'); return; }

        input.value = newText;
        input.dispatchEvent(new Event('input'));
    }

    function insertTable() {
        const r = elems.tableRows.value, c = elems.tableCols.value;
        let s = '\n', b = '+' + '-'.repeat(10), h = '|   Head   ';
        let row = b.repeat(c) + '+\n', col = h.repeat(c) + '|\n';
        s += row; for (let i = 0; i < r; i++) s += col + row;
        const inp = window.lastFocusedInput; if (inp) { inp.value += s; inp.dispatchEvent(new Event('input')); }
        elems.tableModal.classList.add('hidden');
    }

    function handleImageUpload(e) {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = ev => {
            state.images.push({ id: Date.now(), name: f.name, data: ev.target.result, position: 'inline' });
            renderImageList();
            if (window.lastFocusedInput) { window.lastFocusedInput.value += `\n[IMG:${f.name}]\n`; window.lastFocusedInput.dispatchEvent(new Event('input')); }
        };
        r.readAsDataURL(f);
    }

    function renderImageList() {
        if (!elems.imageList) return;
        elems.imageList.innerHTML = '';
        state.images.forEach(img => {
            const d = document.createElement('div'); d.className = 'image-item';
            d.innerHTML = `<img src="${img.data}" class="image-preview-thumb"> <div style="flex:1; margin:0 10px; font-size:12px">${img.name}<br><select class="pos-sel" style="background:var(--white); color:var(--text-main); border:1px solid var(--border); border-radius:4px;"><option value="inline" ${img.position == 'inline' ? 'selected' : ''}>Inline</option><option value="header" ${img.position == 'header' ? 'selected' : ''}>Header</option><option value="footer" ${img.position == 'footer' ? 'selected' : ''}>Footer</option></select></div><i class="fas fa-trash" style="cursor:pointer; color:#EF4444;"></i>`;
            d.querySelector('.fa-trash').addEventListener('click', () => { state.images = state.images.filter(i => i.id !== img.id); renderImageList(); renderUI(); });
            d.querySelector('.pos-sel').addEventListener('change', e => { img.position = e.target.value; renderUI(); });
            elems.imageList.appendChild(d);
        });
    }

    function handleDownload() {
        if (exportFormat === 'pdf') {
            generatePDF();
        } else if (exportFormat === 'txt') {
            const txt = `Title: ${state.meta.title}\nAuthor: ${state.meta.author}\nDate: ${state.meta.date}\n\n` + state.content.pages.map(p => p.content).join('\n\n--- PAGE BREAK ---\n\n') + `\n\nFooter: ${state.content.footer}`;
            downloadFile(txt, 'text/plain', 'txt');
        } else if (exportFormat === 'html') {
            let html = `<html><head><style>body{font-family:sans-serif; max-width:800px; margin:0 auto; padding:20px;} .page{border:1px solid #ccc; padding:40px; margin-bottom:20px; box-shadow:0 0 10px #eee;} .break{page-break-after:always;}</style></head><body>`;
            html += elems.previewWrapper.innerHTML;
            html += `</body></html>`;
            downloadFile(html, 'text/html', 'html');
        }
    }

    function downloadFile(content, mime, ext) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${state.meta.title || 'document'}.${ext}`;
        a.click(); URL.revokeObjectURL(url);
        showAlert('Downloaded!', 'success');
    }

    function handleCopy() {
        const txt = state.content.pages.map(p => p.content).join('\n\n');
        navigator.clipboard.writeText(txt).then(() => showAlert('Copied to Clipboard!', 'success'));
    }

    function handlePrint() {
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>Print</title><link rel="stylesheet" href="style.css"><style>body{background:#fff; color:#000; overflow:visible;} .paper{box-shadow:none; border:1px solid #eee; margin:20px auto;}</style></head><body>`);
        w.document.write(elems.previewWrapper.innerHTML);
        w.document.write(`</body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 500);
    }

    async function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fontMap = { 'Orbitron': 'helvetica', 'Playfair Display': 'times', 'Roboto Slab': 'courier', 'Montserrat': 'helvetica', 'Rajdhani': 'helvetica', 'Open Sans': 'helvetica', 'Lato': 'helvetica', 'Merriweather': 'times' };
        const titleFont = fontMap[state.settings.fontTitle] || 'helvetica';
        const bodyFont = fontMap[state.settings.fontBody] || 'helvetica';
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();
        const M = 20;

        const headerImgs = state.images.filter(i => i.position === 'header');
        const footerImgs = state.images.filter(i => i.position === 'footer');

        state.content.pages.forEach((page, i) => {
            if (i > 0) doc.addPage();
            let y = 20;

            headerImgs.forEach(img => {
                const p = doc.getImageProperties(img.data);
                const h = 40, w = (p.width * h) / p.height;
                doc.addImage(img.data, 'JPEG', (W - w) / 2, y, w, h);
                y += h + 10;
            });

            if (i === 0) {
                doc.setFont(titleFont, "bold"); doc.setFontSize(24); doc.setTextColor(state.settings.colorTitle);
                doc.text(state.meta.title, W / 2, y, { align: "center" }); y += 10;
                doc.setFont(bodyFont, "normal"); doc.setFontSize(12); doc.setTextColor(100);
                doc.text(`${state.meta.author} | ${state.meta.date}`, W / 2, y, { align: "center" }); y += 10;
                doc.line(M, y, W - M, y); y += 15;
            }

            doc.setFontSize({ small: 10, medium: 12, large: 14, xl: 16 }[state.settings.fontSize]);
            doc.setTextColor(state.settings.colorBody);

            const lines = page.content.split('\n');
            lines.forEach(line => {
                const imgMatch = line.match(/\[IMG:(.*?)\]/);
                if (imgMatch) {
                    const img = state.images.find(im => im.name === imgMatch[1] && im.position === 'inline');
                    if (img) {
                        const p = doc.getImageProperties(img.data);
                        const w = Math.min(W - M * 2, 100), h = (p.height * w) / p.width;
                        if (y + h > H - 30) { doc.addPage(); y = 20; }
                        doc.addImage(img.data, 'JPEG', M, y, w, h); y += h + 10;
                        return;
                    }
                }

                if (line.trim().startsWith('+') || line.trim().startsWith('|')) doc.setFont('courier', 'normal');
                else doc.setFont(bodyFont, 'normal');

                if (y > H - 30) { doc.addPage(); y = 20; }
                // Strip md
                const plain = line.replace(/(\*\*|__|[*])/g, '');
                const split = doc.splitTextToSize(plain, W - M * 2);
                doc.text(split, M, y);
                y += split.length * 6 + 2;
            });

            let fy = H - 30;
            footerImgs.forEach(img => {
                const p = doc.getImageProperties(img.data);
                const h = 30, w = (p.width * h) / p.height;
                doc.addImage(img.data, 'JPEG', (W - w) / 2, fy - h, w, h); fy -= h + 5;
            });

            doc.setFont(bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(150);
            doc.text(`${state.content.footer} - Page ${i + 1}`, W / 2, H - 10, { align: "center" });
        });
        doc.save(`${state.meta.title || 'document'}.pdf`);
        showAlert('PDF Generated', 'success');
    }

    // --- Utilities ---
    function showAlert(msg, type) {
        if (!elems.alertContainer) return;
        const div = document.createElement('div');
        div.className = `alert alert-${type}`;
        div.innerHTML = type === 'success' ? `<i class="fas fa-check-circle"></i> ${msg}` : `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        elems.alertContainer.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    function showHistory() {
        if (!elems.versionList) return;
        elems.versionList.innerHTML = '';
        if (history.length === 0) {
            elems.versionList.innerHTML = '<p style="padding:20px; text-align:center; color:#666;">No history available.</p>';
        } else {
            history.slice().reverse().forEach((h, i) => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.style.cssText = 'padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;';
                item.innerHTML = `<div><strong>${new Date(h.timestamp).toLocaleTimeString()}</strong><br><span style="font-size:12px; color:#666">${h.data.meta.title || 'Untitled'}</span></div> <button class="btn btn-small btn-secondary btn-restore" style="height:auto; padding:5px 10px;">Restore</button>`;
                item.querySelector('.btn-restore').addEventListener('click', () => {
                    state = JSON.parse(JSON.stringify(h.data));
                    renderUI();
                    saveState();
                    elems.versionModal.classList.add('hidden');
                    showAlert('Version Restored', 'success');
                });
                elems.versionList.appendChild(item);
            });
        }
        elems.versionModal.classList.remove('hidden');
    }
});
