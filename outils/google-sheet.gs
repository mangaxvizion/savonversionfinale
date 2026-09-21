/**
 * CURASOAP — enregistre chaque commande dans une feuille Google
 * et vous envoie un e-mail à chaque nouvelle commande.
 *
 * MODE D'EMPLOI (5 minutes) :
 * 1. Allez sur sheets.google.com → créez une feuille vide, nommez-la « Commandes CuraSoap ».
 * 2. Menu Extensions → Apps Script. Effacez tout le code, collez CE fichier en entier, cliquez sur 💾.
 * 3. Cliquez sur « Déployer » → « Nouveau déploiement » → roue dentée → « Application Web ».
 *      - Exécuter en tant que : Moi
 *      - Qui a accès : Tout le monde
 *    Cliquez « Déployer », puis « Autoriser l'accès » (compte Google → Avancé → Accéder → Autoriser).
 * 4. Copiez l'URL de l'application Web (elle finit par /exec).
 * 5. Dans js/script.js, collez cette URL dans  const ORDERS_ENDPOINT = '...';  puis republiez le site.
 * 6. Faites une commande de test sur le site : la ligne apparaît dans la feuille et l'e-mail arrive
 *    (vérifiez aussi les courriers indésirables la première fois).
 *
 * Après toute modification de ce code : Déployer → Gérer les déploiements → ✏️ → Nouvelle version.
 */

const SHEET_NAME = 'Commandes';

// Chaque commande est envoyée par e-mail :
//  - à VOTRE adresse Google (le compte qui déploie ce script)
//  - avec une copie aux adresses ci-dessous (ajoutez-en d'autres entre les crochets, séparées par des virgules)
const COPY_TO = ['Kendrickosus@gmail.com'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(['Date', 'Offre', 'Total', 'Pays', 'Nom', 'Téléphone', 'Ville / quartier', 'Repère', 'Provenance', 'Appareil']);
      sh.getRange('F:F').setNumberFormat('@');   // le téléphone reste du texte (+229…)
      sh.setFrozenRows(1);
    }
    sh.appendRow([new Date(), d.offre, d.total, d.pays, d.nom, d.telephone, d.ville, d.repere, d.provenance, d.appareil]);

    // e-mail de notification : à vous + copie(s)
    const owner = Session.getEffectiveUser().getEmail();
    const copies = COPY_TO.filter(function (a) { return a && a.toLowerCase() !== owner.toLowerCase(); });
    const mail = {
      to: owner,
      name: 'CuraSoap commandes',
      subject: '🛒 Nouvelle commande CuraSoap — ' + d.nom + ' (' + d.total + ')',
      body:
        'Nouvelle commande reçue sur le site.\n\n' +
        'Offre : ' + d.offre + '\n' +
        'Total : ' + d.total + '\n' +
        'Pays : ' + d.pays + '\n\n' +
        'Nom : ' + d.nom + '\n' +
        'Téléphone : ' + d.telephone + '\n' +
        'Ville / quartier : ' + d.ville + '\n' +
        'Repère : ' + d.repere + '\n\n' +
        'Provenance : ' + d.provenance + '\n' +
        'Toutes les commandes sont aussi dans votre feuille Google (onglet « ' + SHEET_NAME + ' »).'
    };
    if (copies.length) mail.cc = copies.join(',');
    MailApp.sendEmail(mail);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('erreur : ' + err);
  }
}

// Ouvrir l'URL /exec dans un navigateur affiche ce message : le déploiement fonctionne.
function doGet() {
  return ContentService.createTextOutput('CuraSoap — enregistrement des commandes actif.');
}
