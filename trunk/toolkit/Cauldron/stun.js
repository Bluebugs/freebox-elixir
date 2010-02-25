/*
 * Démonstration de l'usage de TClientSocket en mode UDP
 * résolution de l'adresse IPv4 par le protocol STUN
 *
 * (c)2010, Paul TOTH <tothpaul@free.fr>
 */

elx.include('Cauldron.js');

// quelques infos à l'écran
var text = new TText('Recherche de votre adresse IP', 10, 10, 0xFF00FF, 'Vera', 22);
var resp = new TText('...', 10, 40, 0xFFFF00, 'Vera', 22)


// paramètres de STUN
STUN_DEFAULT_PORT = 3478;
TRANS_ID = elx.usid().substr(0, 16); // devrait être en binaire...
                                     // on ne prend que les 16 premiers caractères

// requête STUN simpliste
request = "\x00\x01\x00\x00" + TRANS_ID;

// création d'un socket
stun = new TClientSocket();

// définition du traitement onData (le seul nécessaire en UDP)
stun.onData = function(event) {
  // est-ce bien une réponse STUN ?
  if (event.data.substr(0, 2) != "\x01\x01") {
    elx.print('not a STUN response\n');
  } else
  // avec notre identifiant ?
  if (event.data.substr(4, 16) != TRANS_ID) {
    elx.print('TRANS_ID error\n');
  } else {
   // parcourir les réponses
    var x = 20;
    while (x < event.size) {
     // code et taille des infos sur 2 fois 2 octets
      var code = 256 * event.data.charCodeAt(x++) + event.data.charCodeAt(x++);
      var size = 256 * event.data.charCodeAt(x++) + event.data.charCodeAt(x++);
     // code 1 sur 8 octets = adresses
      if (code == 1 && size == 8) { // STUN_MAPPED_ADDRESS
        var code = 256 * event.data.charCodeAt(x++) + event.data.charCodeAt(x++);
        if (code == 1) { // IPv4
         // numéro de port
          var port = 256 * event.data.charCodeAt(x++) + event.data.charCodeAt(x++);
         // adresse IP
          var ip = '';
          for (var i = 0 ; i < 4; i++) {
            if (i>0) ip+='.';
            ip += event.data.charCodeAt(x++).toString();
          }
         // réponse à notre question :)
          resp.setText(ip+':'+port);
          break;
        }
      }
      x+=size;
    }
  }
}
// "connexion" vers un serveur STUN en UDP
stun.connect(ECORE_CON_REMOTE_UDP, 'stun.ekiga.net', STUN_DEFAULT_PORT);

// envoyer notre requête
stun.send(request);

// pour quitter, n'importe quelle touche
screen.onKeyup = function() {
  screen.quit();
}

// c'est parti !
screen.main();