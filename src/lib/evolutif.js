// Scénarios évolutifs : la situation change N minutes après le début de l'exercice.
export const evoList = (sc) => (sc.evolutif ? [...(sc.evolutions || [])].sort((a, b) => (Number(a.delai) || 0) - (Number(b.delai) || 0)) : []);

// Questions actives : disponibles dès le départ ou après une évolution vue, et pas encore remplacées.
export const qaActives = (sc, sess) => {
  if (!sc.evolutif) return sc.qa;
  const ev = sess?.evo || {};
  return sc.qa.filter((x) => (!x.evo || ev[x.evo]) && (!x.fin || !ev[x.fin]));
};

// Questions essentielles prises en compte : celles disponibles à un moment de l'exercice.
export const essentielles = (sc, sess) =>
  sc.qa.filter((x) => x.essentielle && (!sc.evolutif || !x.evo || (sess?.evo || {})[x.evo]));

export const nbQuestions = (sess) => sess.log.filter((l) => !l.sys).length;
