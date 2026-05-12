// Enhanced Risk Management System - Shared Constants

const RISK_PROBABILITY_INFO = {
    1: {
        label: 'Unlikely',
        text: 'Event has not occurred in the past 5 years. Event not expected to occur in the next 5 years.'
    },
    2: {
        label: 'Moderately likely',
        text: 'Event that has occurred once in the past 5 years. Event that may occur once in the next 5 years.'
    },
    3: {
        label: 'Likely',
        text: 'Event that has occurred once in the past year. Event that may occur once in the coming year.'
    },
    4: {
        label: 'Very likely',
        text: 'Event that occurred several times in the past year. Event expected to occur once or more times in the coming year.'
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
        label: 'Aggravated Gross Risk',
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
        label: 'Net Risk',
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
        label: 'Post Action Plan Net Risk',
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
        <p><strong>Governance</strong></p>
        <ul>
<li>No management commitment</li>
<li>No ethics and compliance principles communicated or enforced</li>
<li>No dedicated ethics and compliance function</li>
<li>No reporting or monitoring of ethics and compliance topics</li>
        </ul>
        <p><strong>Procedures and controls</strong></p>
        <ul>
<li>Lack of procedures/processes</li>
<li>Ineffective or irrelevant processes, not implemented or not communicated</li>
<li>Lack of controls</li>
<li>Ineffective, irrelevant, or unenforced controls</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Lack of training or awareness</li>
<li>Ineffective or irrelevant training</li>
<li>Very low training rate (≤ 20%)</li>
</ul>
    `,
    insuffisant: `
        <p><strong>Governance</strong></p>
        <ul>
<li>Informal commitment from management</li>
<li>Limited, informal, or partial communication regarding adherence to ethics and compliance principles</li>
<li>No team officially responsible for the ethics and compliance function</li>
<li>Informal monitoring of ethics and compliance issues with no reporting to management</li>
</ul>
<p><strong>Procedures and controls</strong></p>
<ul>
<li>Informal processes (no formalized procedures), partially communicated verbally and partially implemented</li>
<li>Ad hoc, non-formalized controls that are partially implemented</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Informal (verbal), ad hoc, and/or partial training or awareness-raising for employees and new hires</li>
<li>Low training rate (between 20% and 50%)</li>
</ul>
    `,
    ameliorable: `
        <p><strong>Governance</strong></p>
        <ul>
<li>Formal/passive management commitment (reactive upon request, limited proactive ownership)</li>
<li>Irregular communications on ethics and compliance principles (no dedicated communication plan)</li>
<li>Ethics and compliance team also handling other responsibilities; no dedicated committee</li>
<li>Irregular reporting to management on action follow-up</li>
</ul>
<p><strong>Procedures and controls</strong></p>
<ul>
<li>Procedures partially formalized, communicated, implemented, monitored, and/or audited</li>
<li>Irregular updates to procedures</li>
<li>Controls partially formalized/documented, without systematic corrective actions or regular reviews/audits</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Standard training for all employees (no specific targeting of most exposed groups)</li>
<li>No training plan established or not updated</li>
<li>Training completion rate could be improved (between 50% and 90%)</li>
<li>Lack of systematic follow-ups with employees</li>
</ul>
    `,
    efficace: `
        <p><strong>Governance</strong></p>
        <ul>
<li>Active management commitment with strong involvement in monitoring and decision-making</li>
<li>Regular communications on adherence to ethics and compliance principles (defined communication plan)</li>
<li>Dedicated ethics and compliance team and an active committee in place</li>
<li>Regular reporting to management on action monitoring</li>
</ul>
<p><strong>Procedures and controls</strong></p>
<ul>
<li>Procedures systematically formalized, communicated, implemented, monitored, and audited</li>
<li>Systematic, formalized, and documented controls with corrective actions, internal reviews, and audits</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Regular, targeted training tailored to specific groups, prioritizing in-person sessions for most exposed populations</li>
<li>Training plan established by target groups, integrating new hires and defining training frequencies</li>
<li>High training rate (≥ 90%)</li>
</ul>
    `
});


window.RISK_PROBABILITY_INFO = RISK_PROBABILITY_INFO;
window.RISK_IMPACT_INFO = RISK_IMPACT_INFO;
window.RISK_STATE_CONFIG = RISK_STATE_CONFIG;
window.MITIGATION_EFFECTIVENESS_DESCRIPTIONS = MITIGATION_EFFECTIVENESS_DESCRIPTIONS;
