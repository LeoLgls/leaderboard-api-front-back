# Écarts constatés au branchement

On a branché le front et le back, écrits chacun de leur côté à partir du contrat de Loris.

## Ce qui a marché du premier coup

Le format des données. Le front accepte les réponses du back, pour `season` comme pour
`today` : mêmes champs, mêmes types, `team` à `null` quand il n'y a pas d'équipe. Les
erreurs ont aussi la même forme `{ code, message }` des deux côtés, et le front affiche
bien le message d'une erreur 400.

## Ce qui ne marche pas

1. **Le jeton.** Le contrat prévoit un 401 mais ne dit pas comment s'authentifier. Le
   front n'envoie rien, le back attend `Authorization: Bearer <id du joueur>`. Résultat :
   le front reçoit un 401 à chaque appel. La ligne « Vous » (`isCurrentPlayer`) ne peut
   pas s'afficher non plus, puisqu'elle dépend de qui est connecté.

2. **Le CORS.** Le front tourne sur son propre serveur de développement et appelle le back
   à une autre adresse. Le back n'envoie aucun en-tête CORS et répond 404 à la requête de
   vérification (`OPTIONS`) que le navigateur envoie dès qu'il y a un jeton. Le navigateur
   bloquerait donc les appels. Le front n'a pas non plus de proxy configuré, donc son
   appel par défaut vers `/leaderboard` n'atteint pas le back.

## Pourquoi c'est arrivé

Dans les deux cas, le contrat ne disait rien : ni comment envoyer le jeton, ni l'adresse de
base de l'API. Chacun a fait un choix raisonnable de son côté, et les deux choix ne se
rencontrent pas.
