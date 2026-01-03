document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Initialization and Setup ---
    const { jsPDF } = window.jspdf;

    // Elements
    const particlesContainer = document.getElementById('particles');
    const cursor = document.getElementById('cursor');
    const cursorTrail = document.getElementById('cursor-trail');
    const alertContainer = document.getElementById('alert-container');

    // Form Elements
    const inputTitle = document.getElementById('input-title');
    const inputAuthor = document.getElementById('input-author');
    const inputDate = document.getElementById('input-date');
    const inputContent = document.getElementById('input-content');
    const inputFooter = document.getElementById('input-footer');
    const btnGenerate = document.getElementById('btn-generate');
    const btnClear = document.getElementById('btn-clear');

    // Preview Elements
    const previewTitle = document.getElementById('preview-title');
    const previewAuthor = document.getElementById('preview-author');
    const previewDate = document.getElementById('preview-date');
    const previewContent = document.getElementById('preview-content');
    const previewFooter = document.getElementById('preview-footer');

    // Set Default Date
    const today = new Date().toISOString().split('T')[0];
    inputDate.value = today;
    updatePreview();

    // --- 2. Particle Generation ---
    function createParticles() {
        const particleCount = 25;
        const colors = ['#00f2ff', '#ff00ff', '#ffffff', '#00ff88'];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            // Random properties
            const size = Math.random() * 4 + 2; // 2px to 6px
            const left = Math.random() * 100;
            const duration = Math.random() * 10 + 10; // 10s to 20s
            const delay = Math.random() * 5;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `-${delay}s`; // Negative delay to start immediately

            particlesContainer.appendChild(particle);
        }
    }
    createParticles();

    // --- 3. Custom Cursor Logic ---
    let mouseX = 0;
    let mouseY = 0;
    let trailX = 0;
    let trailY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Instant cursor update
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    });

    // Laggy trail animation loop
    function animateCursor() {
        // Smooth easing for trail
        trailX += (mouseX - trailX) * 0.1;
        trailY += (mouseY - trailY) * 0.1;

        cursorTrail.style.left = `${trailX}px`;
        cursorTrail.style.top = `${trailY}px`;

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Cursor hover effects
    const interactiveElements = document.querySelectorAll('button, input, textarea');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('hover-active'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('hover-active'));
    });

    // --- 4. Real-Time Preview Updates ---
    function updatePreview() {
        previewTitle.textContent = inputTitle.value || 'DOCUMENT TITLE';
        previewAuthor.textContent = inputAuthor.value || 'Author Name';
        previewDate.textContent = inputDate.value || 'Date';

        // Handle line breaks in preview for content
        const contentText = inputContent.value || 'Content body will appear here as you type. The layout mimics the final PDF output.';
        previewContent.innerText = contentText; // innerText preserves newlines

        previewFooter.textContent = inputFooter.value || 'Footer notes';
    }

    // Attach listeners
    [inputTitle, inputAuthor, inputDate, inputContent, inputFooter].forEach(el => {
        el.addEventListener('input', updatePreview);
    });

    // --- 5. Alert System ---
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.classList.add('alert');
        alert.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
        alert.textContent = message;

        alertContainer.appendChild(alert);

        // Remove after animation (3.5s total)
        setTimeout(() => {
            alert.remove();
        }, 3500);
    }

    // --- 6. Form Validation ---
    function validateForm() {
        if (!inputTitle.value.trim()) {
            showAlert('Error: Title is required', 'error');
            inputTitle.focus();
            return false;
        }
        if (!inputContent.value.trim()) {
            showAlert('Error: Content is required', 'error');
            inputContent.focus();
            return false;
        }
        return true;
    }

    // --- 7. Generate PDF ---
    btnGenerate.addEventListener('click', () => {
        if (!validateForm()) return;

        try {
            const doc = new jsPDF();

            // Settings
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxLineWidth = pageWidth - (margin * 2);
            let yPos = 20;

            // Title
            doc.setFont("helvetica", "bold"); // Standard font for PDF needed unless we load custom font to jsPDF
            doc.setFontSize(26); // Slightly larger than screen to look good
            doc.text(inputTitle.value, pageWidth / 2, yPos, { align: "center" });

            yPos += 10;

            // Author | Date
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            const metaText = `${inputAuthor.value} | ${inputDate.value}`;
            doc.text(metaText, pageWidth / 2, yPos, { align: "center" });

            yPos += 10;

            // Horizontal Line
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);

            yPos += 10;

            // Content
            doc.setFontSize(12);

            // Split text to fit width
            // handle intentional line breaks
            const paragraphs = inputContent.value.split('\n');

            paragraphs.forEach(para => {
                const splitText = doc.splitTextToSize(para, maxLineWidth);

                // check if we need new page
                if (yPos + (splitText.length * 7) > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.text(splitText, margin, yPos);
                yPos += (splitText.length * 7); // Line height approximation

                // Add some space between paragraphs
                yPos += 5;
            });

            // Divider
            yPos += 5;
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;

            // Footer
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(100);
            const footerText = inputFooter.value;
            const splitFooter = doc.splitTextToSize(footerText, maxLineWidth);
            doc.text(splitFooter, pageWidth / 2, yPos, { align: "center" });

            // Save
            const filename = `document_${Date.now()}.pdf`;
            doc.save(filename);

            showAlert('Success! PDF Generated.', 'success');

        } catch (error) {
            console.error(error);
            showAlert('Failed to generate PDF.', 'error');
        }
    });

    // --- 8. Clear Form ---
    btnClear.addEventListener('click', () => {
        inputTitle.value = '';
        inputAuthor.value = '';
        inputDate.value = today;
        inputContent.value = '';
        inputFooter.value = '';

        updatePreview();
        showAlert('Form Cleared', 'success');

        // Animation effect for clear
        document.querySelector('.preview-container').style.opacity = '0.5';
        setTimeout(() => {
            document.querySelector('.preview-container').style.opacity = '1';
        }, 300);
    });
});
