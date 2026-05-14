// Enhanced Risk Management System - Shared Constants

const RISK_PROBABILITY_INFO = {
    1: {
        label: 'Peu probable',
        text: 'L’événement ne s’est pas produit au cours des 5 dernières années. Il n’est pas attendu au cours des 5 prochaines années.'
    },
    2: {
        label: 'Modérément probable',
        text: 'Événement survenu une fois au cours des 5 dernières années. Événement susceptible de se produire une fois au cours des 5 prochaines années.'
    },
    3: {
        label: 'Probable',
        text: 'Événement survenu une fois au cours de l’année passée. Événement susceptible de se produire une fois dans l’année à venir.'
    },
    4: {
        label: 'Très probable',
        text: 'Événement survenu plusieurs fois au cours de l’année passée. Événement attendu une ou plusieurs fois dans l’année à venir.'
    }
};

const RISK_IMPACT_INFO = {
    1: {
        label: 'Faible',
        text: "<p><strong>Financier (base CA 1 Md $)</strong></p><ul><li>&lt; 250 k$</li></ul><p><strong>Réputationnel</strong></p><ul><li>plainte client VIP isolée</li></ul><p><strong>Opérationnel</strong></p><ul><li>retard service isolé</li></ul><p><strong>Juridique</strong></p><ul><li>réclamation contractuelle</li></ul><p><strong>Humain</strong></p><ul><li>inconfort client/staff</li></ul>"
    },
    2: {
        label: 'Modéré',
        text: "<p><strong>Financier (base CA 1 Md $)</strong></p><ul><li>250 k$ à 2,5 M$</li></ul><p><strong>Réputationnel</strong></p><ul><li>impact sur partenaire palace</li></ul><p><strong>Opérationnel</strong></p><ul><li>incident séjour VIP</li></ul><p><strong>Juridique</strong></p><ul><li>contrôle autorité locale</li></ul><p><strong>Humain</strong></p><ul><li>atteinte limitée à la sécurité</li></ul>"
    },
    3: {
        label: 'Élevé',
        text: "<p><strong>Financier (base CA 1 Md $)</strong></p><ul><li>2,5 M$ à 25 M$</li></ul><p><strong>Réputationnel</strong></p><ul><li>crise média régionale</li></ul><p><strong>Opérationnel</strong></p><ul><li>rupture fournisseur clé</li></ul><p><strong>Juridique</strong></p><ul><li>contentieux multi-juridictions</li></ul><p><strong>Humain</strong></p><ul><li>dommage physique ou psychologique sérieux</li></ul>"
    },
    4: {
        label: 'Critique',
        text: "<p><strong>Financier (base CA 1 Md $)</strong></p><ul><li>≥ 25 M$</li></ul><p><strong>Réputationnel</strong></p><ul><li>atteinte internationale à la marque Al Hiyad</li></ul><p><strong>Opérationnel</strong></p><ul><li>interruption d’activité multi-marchés</li></ul><p><strong>Juridique</strong></p><ul><li>sanctions, interdiction d’opérer ou poursuites pénales</li></ul><p><strong>Humain</strong></p><ul><li>risque vital ou atteinte grave à une personne</li></ul>"
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
