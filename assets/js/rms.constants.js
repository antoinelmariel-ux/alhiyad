// Enhanced Risk Management System - Shared Constants

const RISK_PROBABILITY_INFO = {
    1: {
        label: 'Peu probable',
        text: 'Pourrait survenir une fois tous les 5 ans en l’absence de mesures de maîtrise.'
    },
    2: {
        label: 'Moyennement probable',
        text: 'Pourrait survenir une fois tous les 3 ans en l’absence de mesures de maîtrise.'
    },
    3: {
        label: 'Probable',
        text: 'Pourrait survenir une fois par an en l’absence de mesures de maîtrise.'
    },
    4: {
        label: 'Très probable',
        text: 'Pourrait survenir plusieurs fois au cours de l’année en l’absence de mesures de maîtrise.'
    }
};

const RISK_IMPACT_INFO = {
    1: {
        label: 'Faible',
        text: "<p><strong>Financier</strong></p><ul><li>&lt; 5% des bénéfices</li></ul><p><strong>Juridique</strong></p><ul><li>Sanction interne disciplinaire envers un collaborateur</li></ul><p><strong>Réputationnel</strong></p><ul><li>Mécontentement isolé, sans exposition externe</li></ul><p><strong>Opérationnel</strong></p><ul><li>Perturbation ponctuelle, résolue localement</li></ul><p><strong>Humain</strong></p><ul><li>Malaise ponctuel et baisse limitée de motivation sans impact durable</li></ul>"
    },
    2: {
        label: 'Modéré',
        text: "<p><strong>Financier</strong></p><ul><li>&lt; 10% des bénéfices</li></ul><p><strong>Juridique</strong></p><ul><li>Procédure judiciaire ou administrative à l’échelle d’un collaborateur</li></ul><p><strong>Réputationnel</strong></p><ul><li>Réclamation client sensible, risque de bouche-à-oreille négatif dans un cercle restreint</li></ul><p><strong>Opérationnel</strong></p><ul><li>Désorganisation locale ou sur plusieurs missions ; intervention HQ</li></ul><p><strong>Humain</strong></p><ul><li>Tensions récurrentes et désengagement individuel nécessitant une intervention managériale</li></ul>"
    },
    3: {
        label: 'Fort',
        text: "<p><strong>Financier</strong></p><ul><li>&lt; 25% des bénéfices</li></ul><p><strong>Juridique</strong></p><ul><li>Sanctions à l’échelle d’une filiale</li></ul><p><strong>Réputationnel</strong></p><ul><li>Atteinte à l’image auprès de clients B2B ou clients VIP ; début d’exposition externe</li></ul><p><strong>Opérationnel</strong></p><ul><li>Désorganisation importante d’une filiale, d’un service ou d’un portefeuille client</li></ul><p><strong>Humain</strong></p><ul><li>Dégradation du climat de travail, absentéisme, conflit ouvert</li></ul>"
    },
    4: {
        label: 'Critique',
        text: "<p><strong>Financier</strong></p><ul><li>≥ 25% des bénéfices</li></ul><p><strong>Juridique</strong></p><ul><li>Poursuites pénales majeures, interdiction d’opérer ou sanctions lourdes</li></ul><p><strong>Réputationnel</strong></p><ul><li>Forte exposition médiatique ; perte de confiance durable des clients</li></ul><p><strong>Opérationnel</strong></p><ul><li>Arrêt prolongé d’une activité critique ou rupture systémique du modèle opérationnel</li></ul><p><strong>Humain</strong></p><ul><li>Désengagement collectif, départs multiples et perte durable d’attractivité employeur</li></ul>"
    }
};

const RISK_STATE_CONFIG = {
    brut: {
        label: 'Risque brut aggravé',
        probInput: 'probBrut',
        impactInput: 'impactBrut',
        scoreElement: 'scoreBrut',
        coordElement: 'coordBrut',
        pointClass: 'brut',
        symbol: 'B',
        matrixId: 'riskMatrixEditBrut',
        gridId: 'riskMatrixEditGridBrut',
        descriptionContainer: 'matrixDescriptionBrut'
    },
    net: {
        label: 'Risque net',
        probInput: 'probNet',
        impactInput: 'impactNet',
        scoreElement: 'scoreNet',
        coordElement: 'coordNet',
        pointClass: 'net',
        symbol: 'N',
        matrixId: null,
        gridId: null,
        descriptionContainer: 'matrixDescriptionNet',
        sliderId: 'netMitigationSlider',
        mitigationInputId: 'mitigationEffectiveness',
        marksId: 'netMitigationMarks',
        percentLabelId: 'netMitigationPercentLabel',
        severityLabelId: 'netSeverityLabel'
    },
    post: {
        label: 'Risque net après plan d’action',
        probInput: 'probPost',
        impactInput: 'impactPost',
        scoreElement: 'scorePost',
        coordElement: 'coordPost',
        pointClass: 'post',
        symbol: 'P',
        matrixId: null,
        gridId: null,
        descriptionContainer: 'matrixDescriptionPost',
        sliderId: 'postActionMitigationSlider',
        mitigationInputId: 'postActionMitigationEffectiveness',
        marksId: 'postActionMitigationMarks',
        percentLabelId: 'postActionMitigationPercentLabel',
        severityLabelId: 'postActionSeverityLabel'
    }
};

const MITIGATION_EFFECTIVENESS_DESCRIPTIONS = Object.freeze({
    inefficace: `
        <p><strong>Gouvernance</strong></p>
        <ul>
<li>Aucun engagement de la direction</li>
<li>Aucun principe d’éthique et de conformité communiqué ou appliqué</li>
<li>Aucune fonction éthique et conformité dédiée</li>
<li>Aucun reporting ni suivi des sujets éthique et conformité</li>
        </ul>
        <p><strong>Procédures et contrôles</strong></p>
        <ul>
<li>Absence de procédures ou de processus</li>
<li>Processus inefficaces ou non pertinents, non mis en œuvre ou non communiqués</li>
<li>Absence de contrôles</li>
<li>Contrôles inefficaces, non pertinents ou non appliqués</li>
</ul>
<p><strong>Formation</strong></p>
<ul>
<li>Absence de formation ou de sensibilisation</li>
<li>Formation inefficace ou non pertinente</li>
<li>Taux de formation très faible (≤ 20 %)</li>
</ul>
    `,
    insuffisant: `
        <p><strong>Gouvernance</strong></p>
        <ul>
<li>Engagement informel de la direction</li>
<li>Communication limitée, informelle ou partielle sur l’adhésion aux principes d’éthique et de conformité</li>
<li>Aucune équipe officiellement responsable de la fonction éthique et conformité</li>
<li>Suivi informel des sujets éthique et conformité sans reporting à la direction</li>
</ul>
<p><strong>Procédures et contrôles</strong></p>
<ul>
<li>Processus informels (sans procédure formalisée), partiellement communiqués oralement et partiellement mis en œuvre</li>
<li>Contrôles ad hoc, non formalisés et partiellement mis en œuvre</li>
</ul>
<p><strong>Formation</strong></p>
<ul>
<li>Formation ou sensibilisation informelle, ad hoc et/ou partielle des collaborateurs et nouveaux arrivants</li>
<li>Taux de formation faible (entre 20 % et 50 %)</li>
</ul>
    `,
    ameliorable: `
        <p><strong>Gouvernance</strong></p>
        <ul>
<li>Engagement formel mais passif de la direction (réactif sur demande, appropriation proactive limitée)</li>
<li>Communications irrégulières sur les principes d’éthique et de conformité (pas de plan de communication dédié)</li>
<li>Équipe éthique et conformité assumant aussi d’autres responsabilités ; aucun comité dédié</li>
<li>Reporting irrégulier à la direction sur le suivi des actions</li>
</ul>
<p><strong>Procédures et contrôles</strong></p>
<ul>
<li>Procédures partiellement formalisées, communiquées, mises en œuvre, suivies et/ou auditées</li>
<li>Mises à jour irrégulières des procédures</li>
<li>Contrôles partiellement formalisés ou documentés, sans actions correctives systématiques ni revues/audits réguliers</li>
</ul>
<p><strong>Formation</strong></p>
<ul>
<li>Formation standard pour tous les collaborateurs (pas de ciblage spécifique des populations les plus exposées)</li>
<li>Plan de formation absent ou non mis à jour</li>
<li>Taux de réalisation de la formation perfectible (entre 50 % et 90 %)</li>
<li>Absence de relances systématiques auprès des collaborateurs</li>
</ul>
    `,
    efficace: `
        <p><strong>Gouvernance</strong></p>
        <ul>
<li>Engagement actif de la direction avec forte implication dans le suivi et la prise de décision</li>
<li>Communications régulières sur l’adhésion aux principes d’éthique et de conformité (plan de communication défini)</li>
<li>Équipe éthique et conformité dédiée et comité actif en place</li>
<li>Reporting régulier à la direction sur le suivi des actions</li>
</ul>
<p><strong>Procédures et contrôles</strong></p>
<ul>
<li>Procédures systématiquement formalisées, communiquées, mises en œuvre, suivies et auditées</li>
<li>Contrôles systématiques, formalisés et documentés avec actions correctives, revues internes et audits</li>
</ul>
<p><strong>Formation</strong></p>
<ul>
<li>Formations régulières, ciblées et adaptées aux groupes concernés, avec priorité au présentiel pour les populations les plus exposées</li>
<li>Plan de formation établi par groupe cible, intégrant les nouveaux arrivants et définissant les fréquences de formation</li>
<li>Taux de formation élevé (≥ 90 %)</li>
</ul>
    `
});


window.RISK_PROBABILITY_INFO = RISK_PROBABILITY_INFO;
window.RISK_IMPACT_INFO = RISK_IMPACT_INFO;
window.RISK_STATE_CONFIG = RISK_STATE_CONFIG;
window.MITIGATION_EFFECTIVENESS_DESCRIPTIONS = MITIGATION_EFFECTIVENESS_DESCRIPTIONS;
