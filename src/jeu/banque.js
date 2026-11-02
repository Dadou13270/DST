// Questions du jeu Trivial pompiers : c = thème (0 à 5), o = réponses, a = indices des bonnes réponses.
export default [
{
"c": 0,
"q": "Selon le GDO, quelle définition correspond à un incendie ?",
"o": [
"Un feu dont le développement n'est pas maîtrisé dans l'espace et dans le temps",
"Un feu limité à un seul local",
"Tout feu qui produit des fumées",
"Un feu éteint par un moyen hydraulique"
],
"a": [
0
],
"e": "GDO Incendies de structures, ch. 1 §1.1 : le feu est un processus de combustion auto-entretenu dont le développement est maîtrisé ; l'incendie est un feu dont le développement n'est pas maîtrisé dans l'espace et dans le temps.",
"n": 1
},
{
"c": 0,
"q": "Un feu développé dans des pièces meublées est, en plein développement, systématiquement limité par :",
"o": [
"La ventilation",
"Le combustible",
"La température extérieure",
"Le débit d'extinction"
],
"a": [
0
],
"e": "GDO ch. 1 §1.6 : les feux développés en structure abritant des pièces meublées sont systématiquement limités par la ventilation (FLV). Maîtriser les ouvrants conditionne donc l'évolution du feu.",
"n": 3
},
{
"c": 0,
"q": "Quel est le facteur déclencheur d'un backdraft ?",
"o": [
"L'apport de comburant (air) dans un local confiné",
"L'apport d'une source d'énergie d'activation",
"La projection d'eau dans les fumées",
"Le refroidissement des parois"
],
"a": [
0
],
"e": "GDO ch. 1 §1.7.2 : le facteur déclencheur est l'apport de comburant, l'énergie suffisante étant déjà présente dans la pièce (fenêtre brisée, ouverture de porte, dégradation de toiture).",
"n": 2
},
{
"c": 0,
"q": "Quels signes peuvent annoncer un backdraft ? (plusieurs réponses)",
"o": [
"Fumées épaisses accumulées jusqu'au sol, de couleur brun-jaune",
"Dépôts noirs huileux sur les vitrages",
"Sorties et entrées de fumées en alternance (pulsations)",
"Flammes vives visibles par toutes les ouvertures",
"Fumées blanches, claires et sans pression"
],
"a": [
0,
1,
2
],
"e": "GDO ch. 1 §1.7.4 : fumées épaisses brun/jaune (gaz de pyrolyse), dépôts noirs huileux, alternance de sorties et d'entrées de fumées (pulsations parfois audibles). Le backdraft peut être peu visible sur les indicateurs de chaleur dans les bâtiments basse consommation.",
"n": 2
},
{
"c": 0,
"q": "Vrai ou faux ? Une inflammation de gaz de combustion (FGI) peut se produire même avec des fumées refroidies.",
"o": [
"Vrai",
"Faux"
],
"a": [
0
],
"e": "GDO ch. 1 §1.7.3 : la FGI peut se produire avec des fumées dites froides ; les fumées peuvent être transportées par les vides, gaines, cages et faux plafonds, et s'enflammer loin du foyer.",
"n": 2
},
{
"c": 0,
"q": "Quel indicateur de fumées est un signe avant-coureur d'embrasement généralisé éclair (flashover) ?",
"o": [
"Épaississement du plafond de fumées qui envahit plus de la moitié de la hauteur et s'assombrit vers le noir",
"Fumées blanches et peu abondantes",
"Disparition totale des fumées",
"Fumées claires, sorties à faible vitesse"
],
"a": [
0
],
"e": "GDO ch. 1 §1.7.4 : suies noires, envahissement de plus de la moitié de la hauteur du volume, épaississement du plafond de fumées et assombrissement vers le noir ; écoulements vers l'intérieur en partie basse de l'ouvrant (« respiration du feu »).",
"n": 3
},
{
"c": 1,
"q": "Quelle stabilité au feu minimale la réglementation (ERP et Code du travail) impose-t-elle aux bâtiments, structure et plancher, en conditions normales d'exploitation ?",
"o": [
"15 minutes",
"30 minutes",
"60 minutes",
"90 minutes"
],
"a": [
1
],
"e": "GDO ch. 1 §2 : stabilité au feu minimale de 30 minutes. Travaux, vétusté, malfaçon ou installations précaires peuvent l'altérer.",
"n": 3
},
{
"c": 1,
"q": "Vrai ou faux ? Un bâtiment basse consommation, très étanche et isolé, accélère l'apparition des phénomènes thermiques.",
"o": [
"Vrai",
"Faux"
],
"a": [
0
],
"e": "GDO ch. 1 §1.7 et §3 : les enceintes isolées deviennent rapidement limitées par la ventilation ; le risque de backdraft est accru dans les bâtiments basse consommation, et la chaleur y est moins visible sur les indicateurs.",
"n": 2
},
{
"c": 1,
"q": "Sur un feu confiné, peu flamboyant car sous-ventilé, quel critère doit caractériser l'opération ?",
"o": [
"La maîtrise du risque de backdraft et de FGI, plus que la rapidité",
"La rapidité d'engagement à tout prix",
"L'ouverture immédiate de toutes les issues",
"La ventilation maximale dès l'arrivée"
],
"a": [
0
],
"e": "GDO ch. 1 §3.3 (feu naissant) : un feu peu flamboyant parce que sous-ventilé n'est pas un feu naissant ; la rapidité n'est plus un critère d'efficacité et de sécurité, la maîtrise du risque d'explosion (backdraft ou FGI) doit caractériser l'opération.",
"n": 3
},
{
"c": 1,
"q": "Dans un immeuble de plusieurs étages, que dit le GDO de l'accès par l'extérieur ?",
"o": [
"Passé une certaine hauteur, l'accès par l'extérieur n'est plus possible",
"Il est toujours possible avec une échelle à coulisse",
"Il est interdit en toutes circonstances",
"Il n'est utile qu'au rez-de-chaussée"
],
"a": [
0
],
"e": "GDO ch. 1 §3.3 (superstructure) : propagation verticale, personnes piégées, vent plus fort en hauteur, souvent un seul escalier ; passé une certaine hauteur, l'accès par l'extérieur n'est plus possible, et l'accès aux étages au-dessus d'un feu développé présente un risque significatif.",
"n": 2
},
{
"c": 1,
"q": "Quels sont les trois critères indissociables du choix tactique du COS ? (plusieurs réponses)",
"o": [
"L'évolution de la situation",
"La sécurité",
"Les moyens disponibles",
"Le coût de l'intervention",
"La valeur du bâtiment"
],
"a": [
0,
1,
2
],
"e": "GDO ch. 2 §II.1 : évolution de la situation, sécurité et moyens disponibles, appréciés in situ par le COS qui s'appuie sur les chefs d'agrès ou chefs d'équipe. Le chef d'agrès est donc un acteur de cette analyse.",
"n": 3
},
{
"c": 1,
"q": "Comment se font les actions offensives à l'intérieur d'un volume en feu ?",
"o": [
"Systématiquement en binôme, avec si possible un binôme de sécurité",
"Seul, pour aller plus vite",
"En trinôme obligatoire",
"Indifféremment seul ou en binôme"
],
"a": [
0
],
"e": "GDO ch. 2 §II.2 : les actions offensives à l'intérieur d'un volume se font systématiquement en binôme ; dès que possible, le COS met en place les conditions de sécurité adaptées, notamment un binôme de sécurité.",
"n": 2
},
{
"c": 1,
"q": "Qu'est-ce qu'une « attaque d'atténuation » ?",
"o": [
"Une attaque extérieure préalable à l'attaque intérieure, pour réduire significativement l'intensité du feu",
"Un repli des équipes hors du bâtiment",
"Une ventilation naturelle des fumées",
"Une surveillance du feu sans engagement d'eau"
],
"a": [
0
],
"e": "GDO ch. 2 §II.2 (transition) : l'attaque d'atténuation est une attaque extérieure préalable à une attaque intérieure ; le « repli défensif » est un repli avec la lance dans la circulation commune après détérioration de la situation.",
"n": 3
},
{
"c": 2,
"q": "Sur autoroute, quelle mission n'incombe PAS aux sapeurs-pompiers ?",
"o": [
"La régulation de la circulation, le changement de voie et la fermeture de l'autoroute",
"Le balisage d'urgence en attendant l'exploitant",
"La sécurité du personnel engagé",
"La désincarcération et la lutte contre l'incendie"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 22 : la régulation, le changement de voie de circulation, la circulation ou la fermeture de l'autoroute n'incombent pas aux sapeurs-pompiers (forces de l'ordre et gestionnaire de réseau). Les sapeurs-pompiers coordonnent les secours (COS), assurent le balisage d'urgence en attendant l'exploitant, la sécurité du personnel, le secours et la désincarcération.",
"n": 1
},
{
"c": 2,
"q": "Que recouvre la règle des « 3P » ?",
"o": [
"Protection sur-accident ; protection incendie, explosion et chimique ; protection des intervenants",
"Prévenir, protéger, porter secours",
"Périmètre, panneaux, protection des victimes",
"Positionner, pomper, protéger"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), annexe B, p. 30 : les 3P sont la protection sur-accident, la protection contre l'incendie, l'explosion et le risque chimique, et la protection des intervenants.",
"n": 2
},
{
"c": 2,
"q": "Quelles actions font partie de la règle des « 5i » appliquée à un véhicule accidenté ? (plusieurs réponses)",
"o": [
"Identifier le véhicule et son énergie",
"Interdire de toucher, sectionner ou déplacer",
"Immobiliser le véhicule (moteur arrêté, frein de parc, position P)",
"Isoler l'énergie de traction",
"Inonder l'habitacle",
"Inverser le sens de circulation"
],
"a": [
0,
1,
2,
3
],
"e": "GDOD Secours routier (v1, 14/05/2025), annexe B, p. 30 : identification, inspection, interdiction (toucher, sectionner, déplacer), immobilisation (moteur arrêté, frein de parc, position P) et isolement de l'énergie de traction.",
"n": 3
},
{
"c": 2,
"q": "Dans l'ordre des opérations de secours routier, que signifie « S3D » ?",
"o": [
"Stabiliser, Dégarnir, Dessiner, Distance",
"Sécuriser, Désincarcérer, Dégager, Documenter",
"Signaler, Déblayer, Dépanner, Dévier",
"Stabiliser, Découper, Dégager, Déposer"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), annexe B, p. 30-31 : après la reconnaissance, les 3P, les 5i et les 2P (prise en charge et protection de la victime et du secouriste), vient le S3D (Stabiliser, Dégarnir, Dessiner, Distance), puis les 2D (Découper, Dégager).",
"n": 3
},
{
"c": 2,
"q": "Quelles distances de sécurité respecter vis-à-vis d'un airbag non déployé ?",
"o": [
"30 cm du latéral, 60 cm du conducteur, 90 cm du passager",
"90 cm du latéral, 60 cm du conducteur, 30 cm du passager",
"60 cm de tous les airbags",
"10 cm du latéral, 30 cm du conducteur, 60 cm du passager"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), annexe B, p. 31 : 30 cm de l'airbag latéral, 60 cm de l'airbag du conducteur, 90 cm de celui du passager. Un airbag non déployé peut se déclencher lors de la découpe ou de la manipulation (cartouches de gaz, système pyrotechnique).",
"n": 3
},
{
"c": 2,
"q": "Que désigne la zone d'exclusion (rouge) ?",
"o": [
"Une zone de danger absolu : la circulation doit être coupée si un accès est nécessaire",
"Une zone de mise en sécurité des impliqués et des personnels en attente",
"Une zone à risque élevé, fréquentée seulement si strictement nécessaire",
"Une zone de stationnement des engins"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 17 : zone d'exclusion (rouge) = zone de danger absolu ; zone contrôlée (orange) = risque élevé, à ne fréquenter que si strictement nécessaire ; zone de soutien (verte) = risque acceptable, mise en sécurité des impliqués et des personnels en attente.",
"n": 1
},
{
"c": 2,
"q": "Quelle règle s'applique au balisage d'approche ?",
"o": [
"Ne jamais poser un panneau ou un cône de balisage isolément sur une voie",
"Poser un cône unique au milieu de la voie",
"Baliser uniquement après l'arrivée des forces de l'ordre",
"Poser les panneaux sur la voie de gauche exclusivement"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 18 : le balisage d'approche utilise un panneau lumineux sur la BAU ou le bas-côté ; ne jamais poser un panneau ou un cône de balisage isolément sur une voie.",
"n": 3
},
{
"c": 2,
"q": "Sur autoroute en cas de congestion, par où les engins doivent-ils progresser ?",
"o": [
"Par la bande d'arrêt d'urgence (BAU)",
"Par la voie de gauche, en contresens si besoin",
"En faisant demi-tour pour contourner",
"Uniquement par la voie centrale"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 21 : progresser par les voies normales si l'une des deux est libre ; en cas de congestion, progresser par la BAU. Ne jamais faire demi-tour sur l'autoroute, ne jamais l'emprunter à contresens. Attention : la BAU peut être encombrée.",
"n": 2
},
{
"c": 2,
"q": "Sur autoroute, que ne faut-il jamais faire ? (plusieurs réponses)",
"o": [
"Faire demi-tour sur l'autoroute",
"Emprunter l'autoroute à contresens",
"Progresser par la BAU en cas de congestion",
"Utiliser les feux de détresse en entrant par un portail de service"
],
"a": [
0,
1
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 19 et 21 : ne jamais faire demi-tour sur l'autoroute, ne jamais l'emprunter à contresens. Progresser par la BAU en cas de congestion est la règle, et les feux de détresse sont utilisés à l'entrée par un portail de service.",
"n": 2
},
{
"c": 2,
"q": "Que matérialise un double cône de Lübeck dans le balisage de position ?",
"o": [
"La fin de la zone tampon et le début de la zone de travail",
"La fin de la zone de travail et le début de la zone de stationnement",
"Le début de la zone d'approche",
"La limite de la zone de soutien"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 17-18 : la zone tampon se situe après la zone d'approche et avant la zone de travail ; un double cône de Lübeck matérialise la fin de la zone tampon et le début de la zone de travail.",
"n": 3
},
{
"c": 2,
"q": "Quels équipements sont prévus pour l'intervention de secours routier ? (plusieurs réponses)",
"o": [
"Tenue de feu complète, sans cagoule de feu",
"Casque avec lunettes",
"Masque FFP2 pour la découpe d'un pare-brise",
"Cagoule de feu obligatoire en toute circonstance",
"Casque sans protection oculaire"
],
"a": [
0,
1,
2
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 11 : tenue de feu complète sans cagoule de feu, casque avec lunettes, protection faciale baissée si possible, masque FFP2 pour la découpe de pare-brise. Le port des EPI est obligatoire quelle que soit l'action à mener. Gants 1000 V en dotation collective pour débrancher les service plugs.",
"n": 2
},
{
"c": 2,
"q": "Qu'est-ce qui distingue une victime « incarcérée » d'une victime « piégée » ?",
"o": [
"L'incarcérée est bloquée avec compression et lésions sous-jacentes ; la piégée est retenue par la déformation sans lésion de compression",
"La piégée est toujours inconsciente",
"L'incarcérée peut sortir seule du véhicule",
"Il n'y a aucune différence"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 12 et 28 : la victime piégée est retenue par la déformation de l'habitacle, sans lésion liée à la compression, et n'a souvent pas besoin d'être médicalisée ; la victime incarcérée est bloquée avec compression et lésions sous-jacentes, ce qui impose le SMUR et la désincarcération.",
"n": 3
},
{
"c": 2,
"q": "Dans le message d'ambiance du premier engin, quelle formulation est à proscrire pour décrire la violence du choc ?",
"o": [
"« Énergie cinétique faible ou forte »",
"La vitesse estimée",
"La violence du choc",
"Le nombre et la position des victimes"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), p. 16 : le message d'ambiance du premier engin est prépondérant ; la notion d'« énergie cinétique faible ou forte » est à proscrire au profit de la vitesse estimée ou de la violence du choc.",
"n": 3
},
{
"c": 2,
"q": "Pour une survie optimale du blessé grave, dans quel délai idéal doit se faire sa prise en charge ?",
"o": [
"Dans l'heure qui suit l'accident",
"Dans les 6 heures",
"Dans les 24 heures",
"Il n'y a pas de délai à respecter"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), annexe A, p. 26 : la « golden période » suppose une prise en charge dans l'heure qui suit l'accident, d'où l'importance d'un engagement rapide et d'un message de renseignement précis.",
"n": 3
},
{
"c": 2,
"q": "Que signifie « stabiliser » un véhicule accidenté avant la désincarcération ?",
"o": [
"Figer le véhicule pour sécuriser la désincarcération",
"Le remorquer hors de la voie",
"Couper uniquement la batterie",
"Dégager les victimes sans calage"
],
"a": [
0
],
"e": "GDOD Secours routier (v1, 14/05/2025), annexe A, p. 27 : la stabilisation consiste à figer le véhicule pour sécuriser la désincarcération ; elle précède le dégarnissage (repérage des zones de découpe et de danger) dans le S3D.",
"n": 2
},
{
"c": 3,
"q": "Selon le GDO, quel est le danger principal d'une intervention en présence de gaz ?",
"o": [
"La fuite de gaz",
"Le bruit de la détente du gaz",
"La température du réseau de distribution",
"L'humidité des locaux"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.2 : le danger principal est la fuite de gaz. L'action doit prévenir le risque d'explosion et limiter les dégâts, et l'anticipation du COS est impérative.",
"n": 1
},
{
"c": 3,
"q": "Que représente la limite inférieure d'explosivité (LIE) d'un gaz ?",
"o": [
"La concentration minimale en volume dans le mélange au-dessus de laquelle il peut être enflammé",
"La concentration maximale au-dessus de laquelle il ne s'enflamme plus",
"La température minimale d'inflammation",
"La pression minimale de stockage"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §2.2 : la LIE est la concentration minimale en volume au-dessus de laquelle le mélange peut être enflammé ; la LSE est la concentration maximale en dessous de laquelle il peut l'être. Chaque gaz a sa propre plage d'explosivité.",
"n": 3
},
{
"c": 3,
"q": "Quelle est la plage d'explosivité du méthane (gaz naturel de ville) ?",
"o": [
"5 % à 15 %",
"1,5 % à 8,5 %",
"2,2 % à 9,5 %",
"2,3 % à 83 %"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §2.1 : méthane 5 % à 15 % (densité 0,55, plus léger que l'air) ; butane 1,5 % à 8,5 % (densité 2) ; propane 2,2 % à 9,5 % (densité 1,53) ; acétylène 2,3 % à 83 %.",
"n": 3
},
{
"c": 3,
"q": "Les gaz sont qualifiés de « plus lourds » ou « plus légers » que l'air. Que doit retenir le chef d'agrès en intervention ?",
"o": [
"Il faut s'attendre à avoir du gaz partout, quelle que soit sa densité",
"Le méthane s'accumule toujours au sol",
"Le butane et le propane montent toujours au plafond",
"La densité ne joue aucun rôle dans l'analyse"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §2.1 : les gaz plus lourds et plus légers le sont en condition de laboratoire ; en intervention, il faut s'attendre à avoir du gaz partout. Les mouvements d'air et les cheminements (ventilation, ouverture de porte) font varier les concentrations (§1.2).",
"n": 1
},
{
"c": 3,
"q": "Qu'est-ce qu'un BLEVE ?",
"o": [
"L'explosion d'un gaz liquéfié stocké lorsque son enveloppe se rompt brusquement",
"L'explosion d'un nuage de vapeurs en milieu non confiné",
"Une combustion lente sans flamme",
"La décomposition d'un gaz dissous dans un solvant"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §2.4 : le BLEVE est l'explosion d'un gaz liquéfié stocké quand l'enveloppe rompt brusquement (fragilisation thermique ou mécanique, hausse de pression interne). Ce phénomène est souvent concomitant à un incendie.",
"n": 3
},
{
"c": 3,
"q": "Qu'est-ce qu'un UVCE ?",
"o": [
"L'explosion, en milieu non confiné, d'un nuage de vapeurs inflammables",
"L'explosion d'un réservoir sous pression",
"La détonation d'un mélange en milieu confiné uniquement",
"L'inflammation d'une flamme pilote"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §2.3 : UVCE = explosion en milieu non confiné d'un nuage de vapeurs inflammables ; elle peut résulter d'une fuite de gaz sur réseau.",
"n": 3
},
{
"c": 3,
"q": "Qui fixe les contours effectifs du zonage opérationnel (zones rouge, orange, verte) lors d'une intervention gaz ?",
"o": [
"Le COS, selon la reconnaissance (effets dominos, configuration) et sa capacité à tenir le périmètre",
"Le gestionnaire de réseau seul",
"Le conducteur de l'engin",
"Les forces de l'ordre uniquement"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.3 : trois zones (exclusion rouge, contrôlée orange, de soutien verte). Le COS fixe leurs contours selon la reconnaissance et sa capacité à tenir le périmètre ; des mesures d'explosimétrie permettent de vérifier la pertinence de la zone d'exclusion (§3.2).",
"n": 3
},
{
"c": 3,
"q": "Dans l'ordre indicatif des principes opérationnels, où positionner les engins ?",
"o": [
"En principe avant l'adresse",
"Devant l'adresse, au plus près de la fuite",
"Après l'adresse, dans l'axe de la rue",
"Sans consigne particulière"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.2 : l'ordre indicatif (modifiable sur ordre du COS) commence par le positionnement des engins, en principe avant l'adresse, puis le contact avec GrDF, la vérification des EPI, la zone d'exclusion, l'explosimétrie et le moyen hydraulique (LDV 500 à minima).",
"n": 3
},
{
"c": 3,
"q": "En cas de fuite sur une bouteille de gaz, quelle zone d'exclusion minimale mettre en place ?",
"o": [
"50 m",
"10 m",
"25 m",
"200 m"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.6 : fuite sur bouteille = zone d'exclusion de 50 m minimum ; bouteille soumise à un incendie ou à la chaleur = 100 m minimum ; bouteille d'acétylène soumise à la chaleur ou à un choc violent = 200 m minimum.",
"n": 3
},
{
"c": 3,
"q": "Une bouteille de gaz est soumise à un incendie ou à la chaleur. Quelle zone d'exclusion minimale ?",
"o": [
"100 m",
"50 m",
"20 m",
"300 m"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.6 : 100 m minimum, avec contrôle de la température à la caméra thermique ; danger si déformation visible ou température supérieure à 80 °C. Même si le gaz brûle, le risque d'explosion ne doit pas être exclu.",
"n": 3
},
{
"c": 3,
"q": "Une bouteille d'acétylène est soumise à la chaleur ou à un choc violent. Quelle zone d'exclusion minimale ?",
"o": [
"200 m",
"50 m",
"100 m",
"30 m"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §2.6 et §3.6 : 200 m minimum. L'acétylène (gaz dissous dans l'acétone, odeur d'ail, bouteille marron clair) peut se décomposer dès que la bouteille dépasse 65 °C, avec risque d'éclatement.",
"n": 3
},
{
"c": 3,
"q": "Une bouteille de gaz est soumise à la chaleur. Quelles actions sont conformes au GDO ? (plusieurs réponses)",
"o": [
"Contrôler sa température à la caméra thermique",
"La refroidir au jet diffusé d'attaque",
"Ne pas la déplacer si sa température dépasse 50 °C",
"La refroidir au jet droit",
"La déplacer pour l'éloigner dès que possible"
],
"a": [
0,
1,
2
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.6 : contrôle à la caméra thermique, refroidissement au jet diffusé d'attaque (jet droit interdit), pas de déplacement si la bouteille dépasse 50 °C. Les sapeurs-pompiers ne manipulent une bouteille de gaz qu'en cas d'absolue nécessité.",
"n": 3
},
{
"c": 3,
"q": "Lors d'une coupure de gaz, vous trouvez une vanne déjà fermée. Que faites-vous ?",
"o": [
"Je ne l'ouvre pas",
"Je l'ouvre pour tester l'installation",
"Je l'ouvre puis la referme",
"Je laisse la décision au propriétaire"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.5 : lorsqu'une coupure est effectuée, la signaler avec le bandeau adéquat et ne jamais rouvrir la vanne ; lorsqu'une vanne est trouvée fermée, il ne faut pas l'ouvrir.",
"n": 3
},
{
"c": 3,
"q": "Sur un feu avec énergies présentes, quelle est la priorité du premier COS ?",
"o": [
"S'assurer que les énergies (gaz et électricité) sont coupées",
"Établir un établissement d'attaque sans attendre",
"Faire évacuer uniquement le voisinage",
"Attendre l'arrivée du gestionnaire de réseau"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §3.5 : en cas d'incendie, la priorité du premier COS est de s'assurer que les énergies sont coupées (gaz et électricité). Plus une fuite dure, plus le risque d'explosion augmente : le barrage du gaz doit être rapide.",
"n": 3
},
{
"c": 3,
"q": "Sur une installation de propane en citerne chez un particulier (distribution particulière), qui est habilité à intervenir sur le réseau ?",
"o": [
"Seul le fournisseur de gaz ; les sapeurs-pompiers peuvent fermer le robinet de sortie de citerne",
"GrDF, qui est compétent sur tous les réseaux",
"N'importe quel artisan",
"Les forces de l'ordre"
],
"a": [
0
],
"e": "GDO Interventions en présence de gaz (déc. 2021), §1.4 : GRDF ou les exploitants ne sont pas compétents sur ce type de réseau ; seul le fournisseur de gaz est habilité à intervenir (son nom figure près de la citerne). Les sapeurs-pompiers peuvent fermer le robinet de sortie de citerne.",
"n": 3
},
{
"c": 5,
"q": "Que signifie le sigle SOIEC dans la méthode de raisonnement tactique ?",
"o": [
"Situation, Objectifs, Idées de manœuvre, Exécution, Commandement",
"Sécurité, Observation, Information, Évaluation, Compte rendu",
"Situation, Organisation, Intervention, Engagement, Contrôle",
"Secours, Objectifs, Itinéraire, Extinction, Commandement"
],
"a": [
0
],
"e": "SOIEC : Situation, Objectifs, Idées de manœuvre, Exécution, Commandement. C'est l'ossature de l'ordre initial donné par le chef.",
"n": 1
},
{
"c": 0,
"q": "Quels sont les trois éléments du triangle du feu ? (plusieurs réponses)",
"o": [
"Un combustible",
"Un comburant",
"Une énergie d'activation",
"Un agent extincteur"
],
"a": [
0,
1,
2
],
"e": "Il n'y a combustion que si un combustible, un comburant (le plus souvent l'oxygène de l'air) et une énergie d'activation sont réunis. Supprimer l'un des trois éteint le feu.",
"n": 1
},
{
"c": 0,
"q": "Un feu de liquides ou de solides liquéfiables (essence, alcool, huile minérale) est un feu de classe :",
"o": [
"A",
"B",
"C",
"D"
],
"a": [
1
],
"e": "A : solides, B : liquides, C : gaz, D : métaux, F : huiles et graisses de cuisson.",
"n": 1
},
{
"c": 0,
"q": "Quel agent extincteur faut-il proscrire sur un feu de friteuse (huile de cuisson en feu, classe F) ?",
"o": [
"Le jet d'eau",
"Une couverture anti-feu humide",
"Un extincteur adapté aux feux de classe F",
"Un couvercle posé sur le récipient"
],
"a": [
0
],
"e": "L'eau projetée sur de l'huile en feu se vaporise brutalement et projette l'huile enflammée : risque de brûlures graves et d'extension du feu.",
"n": 1
},
{
"c": 4,
"q": "Quel est le débit minimal normalisé d'un poteau d'incendie en défense extérieure contre l'incendie ?",
"o": [
"30 m³/h sous 1 bar",
"60 m³/h sous 1 bar",
"120 m³/h sous 5 bars",
"240 m³/h sous 10 bars"
],
"a": [
1
],
"e": "Un point d'eau incendie doit fournir au moins 60 m³/h sous une pression dynamique d'au moins 1 bar (référence de la DECI).",
"n": 2
},
{
"c": 4,
"q": "Face à une victime adulte en arrêt cardiaque, quelles actions correspondent à la chaîne de survie ? (plusieurs réponses)",
"o": [
"Alerter les secours",
"Pratiquer des compressions thoraciques",
"Utiliser un défibrillateur dès que possible",
"Donner à boire pour réveiller la victime"
],
"a": [
0,
1,
2
],
"e": "Alerter, masser sans attendre (environ 100 à 120 compressions par minute, thorax enfoncé de 5 à 6 cm chez l'adulte) et défibriller le plus tôt possible.",
"n": 2
},
{
"c": 4,
"q": "Une victime est inconsciente mais respire normalement. Quelle conduite à tenir ?",
"o": [
"La placer en position latérale de sécurité (PLS) et surveiller sa respiration",
"La laisser sur le dos, tête en arrière",
"L'asseoir pour faciliter sa respiration",
"Débuter immédiatement des compressions thoraciques"
],
"a": [
0
],
"e": "La PLS maintient les voies aériennes libres et évite l'étouffement par les vomissements ou la chute de la langue. On surveille la respiration en attendant les renforts.",
"n": 1
},
{
"c": 1,
"q": "Avant tout engagement, quelle est la première préoccupation d'un chef d'équipe ?",
"o": [
"La sécurité de son équipe et la sienne",
"La rapidité d'extinction à tout prix",
"La sauvegarde des biens matériels",
"La préparation du compte rendu"
],
"a": [
0
],
"e": "On ne s'engage que si les risques sont identifiés et maîtrisés : la sécurité des personnels prime sur toute autre considération, y compris la sauvegarde des biens.",
"n": 1
},
{
"c": 0,
"q": "Sur une étiquette de produit dangereux, que signifie le pictogramme « flamme au-dessus d'un cercle » ?",
"o": [
"Produit inflammable",
"Produit comburant",
"Produit explosif",
"Produit corrosif"
],
"a": [
1
],
"e": "La flamme au-dessus d'un cercle désigne un produit comburant : il peut provoquer ou aggraver un incendie en libérant de l'oxygène. La flamme seule désigne un produit inflammable.",
"n": 2
},
{
"c": 5,
"q": "À quoi sert le message d'ambiance transmis à l'arrivée sur les lieux ?",
"o": [
"Rendre compte au CODIS de la situation observée et des premières actions engagées",
"Demander la fin de l'intervention",
"Transmettre le bilan définitif des victimes",
"Informer la presse et les riverains"
],
"a": [
0
],
"e": "Le message d'ambiance donne dès l'arrivée une image claire de la situation (ce que l'on voit) et des premières décisions, pour que la chaîne de commandement et le CODIS anticipent les moyens.",
"n": 1
},
{
"c": 4,
"q": "Devant une victime qui saigne abondamment, quel est le premier geste ?",
"o": [
"Comprimer directement la plaie",
"Poser un garrot en premier réflexe",
"Donner à boire à la victime",
"Nettoyer la plaie à l'eau"
],
"a": [
0
],
"e": "En cas d'hémorragie externe, on commence par comprimer directement l'endroit qui saigne, puis on alerte.",
"n": 1
},
{
"c": 4,
"q": "Une victime est inconsciente mais respire. Quelle position adopter ?",
"o": [
"Position latérale de sécurité (PLS)",
"Sur le dos, jambes surélevées",
"Assise adossée à un mur",
"Debout soutenue"
],
"a": [
0
],
"e": "La PLS libère les voies aériennes et évite l'inhalation des vomissements.",
"n": 1
},
{
"c": 4,
"q": "Quelles sont les trois fonctions vitales surveillées lors d'un bilan ?",
"o": [
"Conscience, ventilation, circulation",
"Température, pouls, tension",
"Vue, ouïe, parole",
"Douleur, couleur, température"
],
"a": [
0
],
"e": "Détresses neurologique, respiratoire et circulatoire.",
"n": 1
},
{
"c": 4,
"q": "Quel est le rythme des compressions thoraciques chez l'adulte ?",
"o": [
"100 à 120 par minute",
"40 à 60 par minute",
"60 à 80 par minute",
"150 à 180 par minute"
],
"a": [
0
],
"e": "Compressions de 5 à 6 cm de profondeur, thorax relâché complètement entre chaque compression.",
"n": 1
},
{
"c": 4,
"q": "En réanimation cardio-pulmonaire de l'adulte, quel est le rapport compressions / insufflations ?",
"o": [
"30 compressions pour 2 insufflations",
"15 compressions pour 2 insufflations",
"5 compressions pour 1 insufflation",
"50 compressions pour 5 insufflations"
],
"a": [
0
],
"e": "Cycle de 30 compressions pour 2 insufflations.",
"n": 2
},
{
"c": 4,
"q": "Que signifie DAE ?",
"o": [
"Défibrillateur automatisé externe",
"Dispositif d'alerte d'équipe",
"Détecteur d'arrêt expiratoire",
"Dispositif d'aspiration endotrachéale"
],
"a": [
0
],
"e": "Il analyse le rythme cardiaque et délivre un choc seulement si nécessaire.",
"n": 1
},
{
"c": 4,
"q": "Vrai ou faux ? Un objet planté dans une plaie doit être retiré immédiatement.",
"o": [
"Vrai",
"Faux"
],
"a": [
1
],
"e": "On ne retire jamais un objet planté : il peut limiter le saignement. On l'immobilise et on alerte.",
"n": 1
},
{
"c": 5,
"q": "Que signifie SOIEC ?",
"o": [
"Situation, Objectifs, Idées de manœuvre, Exécution, Commandement",
"Sécurité, Organisation, Information, Évaluation, Contrôle",
"Secours, Ordres, Intervention, Engagement, Compte rendu",
"Situation, Ordres, Idées, Engins, Communication"
],
"a": [
0
],
"e": "Méthode de raisonnement tactique du chef d'agrès.",
"n": 1
},
{
"c": 5,
"q": "Que signifie COS ?",
"o": [
"Commandant des opérations de secours",
"Chef d'opérations spécialisées",
"Centre opérationnel de secours",
"Coordinateur des opérations sanitaires"
],
"a": [
0
],
"e": "Il dirige l'ensemble des opérations sur le terrain.",
"n": 1
},
{
"c": 5,
"q": "Que signifie CODIS ?",
"o": [
"Centre opérationnel départemental d'incendie et de secours",
"Commandement des opérations de défense incendie et sauvetage",
"Comité de direction des interventions de secours",
"Centre d'organisation et de dispatching des intervenants"
],
"a": [
0
],
"e": "Il coordonne les moyens de secours à l'échelle du département.",
"n": 1
},
{
"c": 5,
"q": "Que signifie CTA ?",
"o": [
"Centre de traitement de l'alerte",
"Chef de transmission d'agrès",
"Commandement tactique avancé",
"Centre technique d'appui"
],
"a": [
0
],
"e": "Il reçoit les appels et déclenche les secours.",
"n": 1
},
{
"c": 5,
"q": "Quelles sont les quatre parties d'un message d'ambiance ?",
"o": [
"Je suis, je vois, je fais, je demande",
"Qui, quoi, où, quand",
"Situation, mission, exécution, soutien",
"Alerte, reconnaissance, action, bilan"
],
"a": [
0
],
"e": "Position, constat, actions engagées, demande de moyens.",
"n": 2
},
{
"c": 5,
"q": "Dans la méthode SOIEC, que représente le « C » ?",
"o": [
"Commandement",
"Combustible",
"Compte rendu",
"Circulation"
],
"a": [
0
],
"e": "Organisation du commandement, des liaisons et des transmissions.",
"n": 1
}
]
