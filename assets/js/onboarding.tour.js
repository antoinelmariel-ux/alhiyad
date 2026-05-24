(function () {
    function switchAndWait(tabName) {
        if (typeof window.switchTab === 'function') {
            window.switchTab(tabName);
        }
        return new Promise((resolve) => window.setTimeout(resolve, 220));
    }

    function waitForElement(selector, timeout = 3000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                    return;
                }
                if (Date.now() - start >= timeout) {
                    resolve(null);
                    return;
                }
                window.setTimeout(check, 120);
            };
            check();
        });
    }

    function startOnboardingTour() {
        if (!window.driver || typeof window.driver.js?.driver !== 'function') {
            alert('Driver.js n\'est pas chargé. Vérifiez la connexion internet.');
            return;
        }

        const tour = window.driver.js.driver({
            showProgress: true,
            animate: true,
            stagePadding: 8,
            nextBtnText: 'Suivant',
            prevBtnText: 'Précédent',
            doneBtnText: 'Terminer',
            steps: [
                { element: '#tour-tab-dashboard', popover: { title: 'Tableau de bord', description: 'Vision globale des KPIs de risque.' } },
                { element: '#tour-tab-interviews', popover: { title: 'Entretiens', description: 'Collectez et exploitez les verbatims d’interviews.' } },
                { element: '#tour-tab-matrix', popover: { title: 'Matrice des risques', description: 'On va maintenant détailler cet onglet clé.' }, onNextClick: async () => { await switchAndWait('matrix'); tour.moveNext(); } },
                { element: '#matrixGridBrut', popover: { title: 'Matrice du risque brut', description: 'Position initiale des risques avant prise en compte de la maîtrise.' } },
                { element: '#matrixGridNet', popover: { title: 'Matrice du risque net', description: 'Vue du risque après niveau de maîtrise actuel.' } },
                { element: '#matrixGridPost', popover: { title: 'Matrice après plan d’action', description: 'Projection de risque résiduel attendu après actions.' } },
                { element: '#tour-tab-risks', popover: { title: 'Registre des risques', description: 'Passons au détail d’un risque individuel.', side: 'bottom' }, onNextClick: async () => { await switchAndWait('risks'); tour.moveNext(); } },
                { element: '#risksTableBody tr:first-child .action-btn[title="Voir"]', popover: { title: 'Voir un risque', description: 'Cliquez sur Voir pour ouvrir la fiche complète.' }, onNextClick: async () => {
                    const btn = await waitForElement('#risksTableBody tr:first-child .action-btn[title="Voir"]');
                    if (btn) btn.click();
                    await waitForElement('#riskViewModal.show', 2500);
                    tour.moveNext();
                } },
                { element: '#riskViewModal .risk-view-evolution-section', popover: { title: 'Lecture détaillée du risque', description: 'Retrouvez la matrice d’évolution et les informations générales / scoring.' } },
                { element: '#riskViewModal .btn.btn-primary', popover: { title: 'Modifier ce risque', description: 'Le bouton Modifier ouvre la configuration complète du risque.' }, onNextClick: async () => {
                    const editBtn = document.querySelector('#riskViewModal .btn.btn-primary');
                    if (editBtn) editBtn.click();
                    await waitForElement('#riskModal.show', 2500);
                    tour.moveNext();
                } },
                { element: '#riskModal #riskTheme', popover: { title: 'Configuration – Thématique', description: 'Choisissez la thématique et les champs métiers associés.' } },
                { element: '#riskModal #riskMatrixEditBrut', popover: { title: 'Configuration – Matrice brute', description: 'Ajustez probabilité/impact directement dans la matrice brute.' } },
                { element: '#riskModal #mitigationSlider', popover: { title: 'Configuration – Niveau de maîtrise', description: 'Simulez l’effet des contrôles sur le risque net.' } },
                { element: '#tour-tab-controls', popover: { title: 'Contrôles & atténuation', description: 'Catalogue et pilotage des contrôles.' }, onNextClick: async () => { closeModal('riskModal'); await switchAndWait('controls'); tour.moveNext(); } },
                { element: '#tour-tab-plans', popover: { title: 'Plans d’action', description: 'Suivi opérationnel des remédiations.' } },
                { element: '#tour-tab-legends', popover: { title: 'Légendes', description: 'Référentiel de lecture des scores et niveaux.' } }
            ]
        });

        tour.drive();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const button = document.getElementById('startOnboardingTourBtn');
        if (button) {
            button.addEventListener('click', startOnboardingTour);
        }
        window.startOnboardingTour = startOnboardingTour;
    });
})();
