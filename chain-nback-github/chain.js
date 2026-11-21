// N-back de cadeia — memória de trabalho + dedução relacional (módulo separado; chave própria lglab.chain.v1)
// Em cada jogada aparece uma pista «X vem antes de Y». A resposta junta a pista atual com a de há N jogadas
// e responde Sim (as duas pistas garantem a afirmação) ou Não (não garantem).
'use strict';
(function () {
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = (n) => Math.floor(Math.random() * n);
// ---------- ícones (SVG em traço, herdam a cor; substituem os emoji, que mudam de aspeto em cada sistema) ----------
const ICONS = {
  candle: '<path d="M12 2.6c-1.7 2-1.7 3.8 0 4.9 1.7-1.1 1.7-2.9 0-4.9Z" fill="currentColor" stroke="none"/><rect x="9.4" y="9.2" width="5.2" height="10.6" rx="1.2"/><path d="M6.5 21h11"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4M7 17l-3 3M3 19l2 2"/>',
  skull: '<path d="M16 20.5a2 2 0 0 0 1.6-3.2 8 8 0 1 0-11.2 0A2 2 0 0 0 8 20.5"/><path d="M8.5 20.5V22h7v-1.5"/><circle cx="9" cy="12.2" r="1.4" fill="currentColor"/><circle cx="15" cy="12.2" r="1.4" fill="currentColor"/><path d="m12 15.6-.8 1.6h1.6z" fill="currentColor"/>',
  crown: '<path d="M3 17.5h18M4.5 17.5 3 7.5l5 3.8 4-6.3 4 6.3 5-3.8-1.5 10"/><path d="M5 20.5h14"/>',
  music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/>',
  musicOff: '<path d="M9 18V9.5M9 5.5l11-2V13"/><circle cx="6.5" cy="18" r="2.6"/><path d="m3 3 18 18"/>',
  play: '<path d="M7.5 4.6v14.8L19.4 12z" fill="currentColor" stroke="none"/>',
  star: '<path d="M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z" fill="currentColor" stroke="none"/>',
  recall: '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3L3.5 8.3"/><path d="M3.5 3.5v4.8h4.8"/>',
  hourglass: '<path d="M6 2.5h12M6 21.5h12"/><path d="M7.2 2.5c0 4.8 4.8 5.8 4.8 9.5s-4.8 4.7-4.8 9.5M16.8 2.5c0 4.8-4.8 5.8-4.8 9.5s4.8 4.7 4.8 9.5"/>',
  pause: '<rect x="6.2" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="13.8" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  sliders: '<path d="M20 7h-8.5M13 17H4"/><circle cx="7.5" cy="7" r="2.8"/><circle cx="16.5" cy="17" r="2.8"/>',
  chart: '<path d="M3.5 3.5v17h17"/><path d="m7.5 15 4-4.2 3 3 5-6.3"/>',
  book: '<path d="M12 6.3C9.3 4.4 5.8 4.2 2.6 5.4v13.3c3.2-1.2 6.7-1 9.4.9 2.7-1.9 6.2-2.1 9.4-.9V5.4c-3.2-1.2-6.7-1-9.4.9Z"/><path d="M12 6.3v13.3"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  cards: '<rect x="3.5" y="5" width="11" height="15.5" rx="2"/><path d="M14.5 7.4l4.6 1.3a2 2 0 0 1 1.4 2.4l-2.5 9.4a2 2 0 0 1-2.4 1.4L9.6 20.5"/><path d="M9 10.5l1.4 2.2L9 15l-1.4-2.3z" fill="currentColor" stroke="none"/>',
  flame: '<path d="M12 2.8c3.6 3.4 6 6.3 6 10.2a6 6 0 0 1-12 0c0-2.4 1.2-4.2 2.6-5.6.2 1.7 1 2.8 2.2 3.4C10.6 8 11 5.4 12 2.8Z"/>' };
const ic = (n, size = 18, cls = '') => `<svg class="cx-ic ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- textos ----------
const TX = {
  pt: {
    nav: 'N-back de cadeia', back: 'Menu', title: 'N-back de cadeia',
    dur: 'Sessão', durBlock: '1 bloco', durMin: '{m} min', qpace: 'Tempo por pergunta', qFree: 'Livre', qAuto: 'Adaptativo', nPick: 'N', nAuto: 'Auto',
    autoSub2: 'Nível {l} · {d} · {s} · {q}', sessOne: 'um bloco', sessMin: 'sessão de {m} min', qFreeL: 'perguntas sem limite de tempo', qAutoL: 'tempo por pergunta adaptativo ({t} s)',
    sessLeft: '{t}', sessBanner: 'Sessão: faltam {t}', nextIn: 'Próximo bloco em {s} s', nextNow: 'Próximo bloco', endSess: 'Terminar a sessão', quitBlock: 'Terminar o bloco',
    sessTitle: 'A última vela apagou-se', sessTitleQuit: 'Saíste da cripta', sessStats: '{b} {bw} · {ok} de {n} certas ({p}%) · melhor série: {best}', sessLvl: 'Nível: {a} → {c}', sessRate: 'Pontuação média: {r} por minuto', newSess: 'Nova sessão',
    loreTitle: 'O Arquivo dos Reis Mortos',
    lore: ['Sob a cidade, os reis-esqueleto guardam a ordem da sua linhagem. Ninguém a escreveu: só a recordam, fragmento a fragmento, no escuro.',
      'Cada fragmento é uma pista — quem veio antes, quem veio depois; nas salas mais fundas, linhagens inteiras («todos os…», «alguns…») e juramentos condicionais («se…»). Lê-a e guarda-a: assim que chega a seguinte, desvanece-se.',
      'Os reis perguntam então por uma verdade. Só a podes jurar — Sim — se a pista de agora e a pista de há {n} {jj} a garantirem juntas. Se a ordem fica envolta em sombra, ou se elas dizem o contrário, responde Não.',
      'Os fragmentos mentem na forma, nunca na ordem: «é seguido por», «não precede», «não é verdade que…» — o mesmo caminho por corredores tortos. Desconfia também do fragmento errado: só conta o de há {n} {jj}.',
      '{lives}', '{dur}'],
    loreDurBlock: 'Esta vigília dura um ciclo de fragmentos.', loreDurMin: 'Tens {m} minutos na cripta. Quando a última vela se apagar, a vigília termina.',
    music: 'Música', musicOn: 'Música ligada — clica para desligar (M)', musicOff: 'Música desligada — clica para ligar (M)', musicVol: 'Volume da música',
    lives: 'Velas', rankT: 'Classificação', ladder: { free: 'Livre', timed: 'Com tempo', duel: 'Duelos' },
    ranks: ['Acólito', 'Escriba', 'Guardião', 'Arquivista', 'Cavaleiro da Cripta', 'Necromante', 'Senhor dos Ossos', 'Rei Morto'],
    win: 'Vitória', ptsWin: '+{d} pontos de honra · {l}', ptsLoss: '−{d} pontos de honra · {l}', unrated: 'Ronda sem classificação: não chegou ao fim.',
    rankUp: '▲ Nova patente: {r}', rankDown: '▼ Desceste a {r}', toNext: 'faltam {d} para {r}', topRank: 'patente máxima', rankLine: '{r} · {p} pontos',
    deathT: 'Pereceste na cripta', deathSub: 'A terceira vela apagou-se na jogada {i}. Os reis não perdoam juramentos falsos.', deathWhy: 'Onde a sombra te apanhou',
    deathRise: 'Erguer-me de novo', deathReport: 'Ver o relatório completo', deathLvl: 'A cripta recua-te para o nível {l}.',
    tip: { eLure: 'Juntaste a pista errada — só conta a de há {n} {jj}.', eDir: 'Juraste uma ordem que as pistas desmentem.', eOver: 'Juraste sem ligação: as duas pistas não se tocavam.', eMiss: 'Negaste uma verdade: as duas pistas formavam cadeia.', eTime: 'O tempo esgotou-se antes do teu juramento.', eOppX: 'As pistas garantiam exatamente o contrário.', eMissX: 'Negaste uma conclusão que as duas pistas garantiam.', fMissMT: '«Se P, Q» e «não Q» garantem «não P» — modus tollens.',
      fIllConv: '«Todos os A são B» não garante «todos os B são A» (nem «alguns A não são B» garante «alguns B não são A»).', fSomeAll: 'Uma pista sobre alguns não diz nada sobre todos.',
      fSomeNot: 'Saber que alguns são não diz se há algum que não seja (e vice-versa).', fUndMid: 'A classe que liga as pistas nunca foi dita por inteiro: as outras duas podem cair em partes diferentes dela.',
      fIllicit: 'A conclusão fala de uma classe inteira de que as pistas só diziam parte.', fTwoNeg: 'Duas pistas negativas só dizem o que fica de fora — não ligam nada.',
      fQual: 'Com uma pista negativa, a conclusão tem de ser negativa; com duas afirmativas, tem de ser afirmativa.', fNoLinkS: 'As pistas não partilham a classe que ligaria os termos da pergunta.',
      fInvalidS: 'Estas duas pistas não chegam para esta conclusão.', fAC: '«Se P, Q» e «Q» não garantem P: Q pode acontecer por outra razão.', fDA: '«Se P, Q» e «não P» não garantem «não Q».',
      fConv: '«Se P, Q» não garante «se Q, P»: Q é necessário para P, não suficiente.', fChain: 'As condições não se encadeiam: o consequente de uma tinha de ser o antecedente da outra.',
      fNoLinkC: 'As pistas não falam do que a pergunta pede.', fInvalidC: 'A condicional não se aplica nesta direção.',
      fAffDisj: '«P ou Q» e «P» não garantem «não Q»: o «ou» deixa que sejam os dois.', fNoLinkD: 'As pistas não falam do que a pergunta pede.', fInvalidD: 'Estas duas pistas não chegam para esta conclusão.', fNegQ: 'O contrário de «todos são» é «alguns não são», não «nenhum é».' },
    domT: 'Modo de treino', domL: { mix: 'Variado', ord: 'Raciocínio gramatical', syl: 'Silogismos', cond: 'Condicionais', disj: 'Disjunções', bias: 'Viés de crença' },
    domD: { mix: 'Cada bloco muda de tipo e de nível; às vezes mistura tipos no mesmo bloco', ord: 'Ordem: antes, depois, passiva, negações', syl: 'Classes: todos, nenhum, alguns', cond: 'Se…, então…, só se, a menos que', disj: 'G ou K: «ou» é pelo menos um — podem ser os dois', bias: 'Silogismos com palavras reais: julga a lógica, não se soa verdadeiro' },
    mixShort: 'cada tipo com o seu nível', relD: { disj: ['«ou» e factos', '+ «ou ambos», ordem trocada', '+ «se não…», «não é verdade que…»'], bias: ['palavras reais, formas básicas', '+ variantes («qualquer», «nem todos»)', '+ variantes («qualquer», «nem todos»)'], syl: ['formas básicas (todos, nenhum, alguns)', '+ variantes («qualquer», «nem todos», «há… que»)', '+ armadilhas («só os…», «não é verdade que…»)'], cond: ['«se…, …» e factos', '+ «então», «sempre que», «basta», contrapositiva', '+ «só se», «é preciso que», «a menos que»'] }, autoSubMix: '{lv} · {s} · {q}', mixLv: 'níveis: gramatical {o} · silogismos {y} · condicionais {c} · disjunções {d} · viés {b}', sessLvlD: '{d}: nível {a} → {c}',
    domTip: 'Ordem: antes/depois · Classes: «todos», «nenhum», «alguns» (silogismos) · Condições: «se…, então…» · Misturadas: alterna os tipos (em 2-back ou mais, cada fio de pistas tem o seu tipo).',
    falT: 'As tuas falácias mais frequentes', falSess: 'Falácias desta sessão: {f}',
    eOppX: 'Juraste o contrário', eMissX: 'Conclusão válida negada', fMissMT: 'Modus tollens não visto',
    fIllConv: 'Conversão ilícita', fSomeAll: 'De «alguns» para «todos»', fSomeNot: '«Alguns são» ≠ «alguns não são»', fUndMid: 'Termo médio não distribuído', fIllicit: 'Termo ilícito (maior/menor)',
    fTwoNeg: 'Duas pistas negativas', fQual: 'Qualidade trocada', fNoLinkS: 'Sem classe de ligação', fInvalidS: 'Silogismo inválido',
    fAC: 'Afirmar o consequente', fDA: 'Negar o antecedente', fConv: 'Condicional invertida', fChain: 'Cadeia de condições partida', fNoLinkC: 'Condições sem ligação', fInvalidC: 'Condicional mal aplicada',
    xYes: 'Sim. {d}', xOpp: 'Não: segue-se o contrário. {d}', xUnk: 'Não: não dá para saber. Armadilha: {f} — {t}',
    rMP: 'Modus ponens: «se P, Q» e «P» garantem «Q».', rMT: 'Modus tollens: «se P, Q» e «não Q» garantem «não P».',
    rHS: 'Silogismo hipotético: as condições encadeiam-se (o consequente de uma é o antecedente da outra, às vezes pela contrapositiva).',
    rCP: 'Contraposição: «se P, Q» equivale a «se não Q, não P».', rX: 'As duas pistas juntas garantem-no.', rXo: 'As duas pistas juntas garantem o contrário.',
    rSyl: 'As duas pistas ligam-se pela classe {m} e garantem a conclusão.', rSylOne: 'Uma das pistas já o diz, por outras palavras.',
    fAffDisj: 'Afirmar um disjunto', fNoLinkD: 'Disjunções sem ligação', fInvalidD: 'Disjunção mal aplicada', fNegQ: 'Negação mal feita',
    rDS: 'Silogismo disjuntivo: «P ou Q» e «não P» garantem «Q».', rRES: 'As duas disjunções juntam-se: o que uma exclui, a outra obriga.', belNote: ' (No mundo real a conclusão {b}, mas aqui só conta a lógica.)', belT: 'parece verdadeira', belF: 'parece falsa',
    sessPts: 'Honra nesta sessão: {d} · {l}',
    loreLives: 'Levas três velas. Cada juramento falso apaga uma; quando as três se apagam, a ronda acaba e perdes honra. Chegar ao fim dá-te honra — mais quanto mais fundo fores na cripta. Livre e Com tempo são classificações separadas.',
    loreKeys: '← Sim · Não →   ·   P para te esconderes (pausa)', loreGo: 'Entrar na cripta', loreSkip: 'Saltar esta introdução nas próximas sessões',
    intro: 'Aparece uma pista de cada vez e a anterior desaparece. Em cada jogada, junta a pista nova à de há N jogadas e responde: as duas pistas garantem a afirmação? Sim, se a garantem. Não, se não garantem — porque se segue o contrário ou porque não dá para saber. Só contam essas duas pistas.',
    exTitle: 'Exemplo em 2-back · «Não» = não garantido (o contrário ou «não dá para saber»)',
    ex: [['A vem antes de B.', 'Memorizas.'], ['D é seguido por C.', 'Memorizas (= D antes de C).'], ['C não vem antes de B.', '«Garantem que A antecede C?» Sim: «C não vem antes de B» = B antes de C; com a pista 1, A < B < C.'], ['A precede E.', '«Garantem que E sucede a D?» Não: com a pista 2 (D < C), A < E e D < C não se ligam — não dá para saber. Só conta a pista de há 2 jogadas.']],
    level: 'Nível', letters: '{k} letras', nback: '{n}-back', pace: 'Ritmo', paceFree: 'Livre', paceS: '{s} s por jogada', autoBtn: 'Modo adaptativo', autoSub: 'Nível {l} · {d} · tempo {t} s por jogada — o nível e o tempo sobem e descem sozinhos', manual: 'Escolher eu (nível e ritmo)', startManual: 'Começar com estas definições', how: 'Como funciona (exemplo)', paceAuto: 'Adaptativo', paceAutoS: 'adaptativo · {s} s', autoSum: 'Tempo por jogada: {a} s → {b} s ({d})', faster: 'mais rápido', slower: 'mais lento', same: 'igual', autoTip: 'Adaptativo: cada acerto encurta o tempo, cada erro alarga-o; o tempo passa para o bloco seguinte.',
    start: 'Começar o bloco', resume: 'Continuar o bloco', discard: 'Descartar',
    hist: 'Últimos blocos', none: 'Ainda não fizeste nenhum bloco.',
    move: 'Jogada {i} de {n}', agoN: 'Pista de há {n} {jj}', remember: 'lembra-te dela', thenT: 'As duas juntas garantem que…', clueNow: 'Pista nova', memo: 'Memoriza esta pista', reviewK: 'Revisão antes de retomar · {i} de {n}',
    clue: '{p} vem antes de {q}.', qLong: 'Com a pista de há {n} {jj}:', jj1: 'jogada', jjN: 'jogadas',
    claim: '{p} antes de {q}?', pairT: 'Memoriza: vais juntá-la à pista de daqui a {n} {jj}.', aT: 'Sim', aF: 'Não', aTs: '', aFs: '', askG: 'As duas pistas garantem que', recall1: 'Recorda a pista anterior', recallN: 'Recorda a pista de há {n} jogadas', okRun: '✓ Certo · {n} seguidas', next: 'Seguinte', pause: 'Pausar',
    rowClaim: '«{p} antes de {q}»', vT: 'Sim. {d}', vFopp: 'Não: segue-se o contrário. {d}', vFunk: 'Não: não dá para saber. {d}',
    paused: 'Pausado', pausedTxt: 'Ao retomar, revês {what} pela ordem original antes de continuar. A revisão fica marcada no resumo.', cont: 'Retomar', quit: 'Terminar o bloco',
    ok: '✓ Certo!', bad: '✗', streak: 'Série ×{n}', timeout: 'Tempo esgotado',
    sumTitle: 'Bloco terminado', score: '{ok} de {n} certas · Melhor série: {b}', up: '▲ Sobes para o nível {l}: {d}.', down: '▼ Desces para o nível {l} para consolidar.', hold: 'Ficas no nível {l}.',
    resumed: 'Retomaste o bloco {n}× com revisão das pistas (ajuda de memória).',
    errs: 'Tipos de erro', eLure: 'Pista errada', eDir: 'Direção trocada', eOver: 'Concluíste sem ligação', eMiss: 'Ligação não vista', eTime: 'Tempo esgotado',
    review: 'Jogada a jogada', again: 'Outro bloco', menuBtn: 'Voltar ao modo',
    you: 'Respondeste: {a}', right: 'Certo: {a}', noAns: 'sem resposta',
    xLure: 'A tua resposta faria sentido com a pista {l}. Nesta jogada contava a pista {p}.',
    dDirect: 'A pista {p} já diz «{a} antes de {b}».',
    dChain: '{a} antes de {m} e {m} antes de {b} (pistas {i} e {j}) → {a} antes de {b}.',
    dUnkOne: 'A pista {p} liga {a} a {m}, mas a outra não liga {m} a {o}. Para concluir, a pista {q} teria de ser «{m} vem antes de {o}» ou «{o} vem antes de {m}».',
    dUnkTwo: 'Uma pista liga {x} a {m} e a outra liga {y} a {w}, mas {m} e {w} não se ligam. Faltava uma pista entre eles.',
    dUnkNone: 'Nenhuma das duas pistas fala de {x} nem de {y}.',
    dUnkSame: 'As duas pistas ligam {t} a outras letras ({a} e {b}), mas nenhuma chega a {o}.',
    pistas: 'Pistas {i} e {j}', lvlDesc: '{n}-back · {k} letras · {r}',
    rel: ['12 formas (antes, depois, precede, sucede, passiva…)', '+ negações', '+ «não é verdade que…» e dupla negação', '+ afirmações compostas'],
    F: {
      b: '{p} vem antes de {q}', a: '{p} vem depois de {q}', pr: '{p} precede {q}', fo: '{p} segue-se a {q}', an: '{p} antecede {q}', vs: '{p} vem a seguir a {q}',
      ss: '{p} sucede a {q}', la: '{p} ocupa um lugar anterior ao de {q}', lp: '{p} ocupa um lugar posterior ao de {q}',
      pp: '{p} é precedido por {q}', pf: '{p} é seguido por {q}', pa: '{p} é antecedido por {q}',
      nb: '{p} não vem antes de {q}', na: '{p} não vem depois de {q}', npr: '{p} não precede {q}', nfo: '{p} não se segue a {q}', nan: '{p} não antecede {q}',
      nvs: '{p} não vem a seguir a {q}', npp: '{p} não é precedido por {q}', npf: '{p} não é seguido por {q}', npa: '{p} não é antecedido por {q}',
      tb: 'não é verdade que {p} venha depois de {q}', ta: 'não é verdade que {p} venha antes de {q}', tp: 'não é verdade que {p} preceda {q}', tf: 'não é verdade que {p} se siga a {q}',
      dn: 'não é verdade que {p} não venha antes de {q}', dna: 'não é verdade que {p} não venha depois de {q}' },
    rate: 'Pontuação: {r} por minuto (certas − erradas, só o tempo a responder)', best: 'Melhor pontuação: {r}/min',
    and: ' e ', eq: '= {p} antes de {q}', vF0: 'Não.', vT0: 'Sim.',
    pYes: 'garantido', pOpp: 'segue-se o contrário', pUnk: 'não dá para saber com estas duas pistas',
    negNote: 'Cada letra ocupa um lugar diferente: «A não vem antes de B» quer dizer que A vem depois de B. Atenção à passiva: «A é seguido por B» quer dizer que A vem antes de B; «A não é seguido por B» diz o contrário. Nos níveis altos, a afirmação pode ter duas partes («… e …»): a resposta só é Sim se as duas partes forem garantidas.',
    sound: 'Som', on: 'Ligado', off: 'Desligado', stroop: 'Stroop', stroopTip: 'A afirmação aparece a verde ou a vermelho ao acaso. Ignora a cor: só conta o que as pistas garantem.',
    stroopSum: 'Stroop · cor coincidente: {a}/{b} · cor contrária: {c}/{d}',
    keys: 'Teclado: ← Sim · → Não (ou S / N). Nas pistas a memorizar, qualquer seta ou Enter segue. P pausa. Enter começa o bloco.'
  },
  en: {
    nav: 'Chain N-back', back: 'Menu', title: 'Chain N-back',
    dur: 'Session', durBlock: '1 block', durMin: '{m} min', qpace: 'Time per question', qFree: 'Free', qAuto: 'Adaptive', nPick: 'N', nAuto: 'Auto',
    autoSub2: 'Level {l} · {d} · {s} · {q}', sessOne: 'one block', sessMin: '{m}-min session', qFreeL: 'no time limit per question', qAutoL: 'adaptive time per question ({t} s)',
    sessLeft: '{t}', sessBanner: 'Session: {t} left', nextIn: 'Next block in {s} s', nextNow: 'Next block', endSess: 'End the session', quitBlock: 'End the block',
    sessTitle: 'The last candle has gone out', sessTitleQuit: 'You left the crypt', sessStats: '{b} {bw} · {ok} of {n} correct ({p}%) · best streak: {best}', sessLvl: 'Level: {a} → {c}', sessRate: 'Average score: {r} per minute', newSess: 'New session',
    loreTitle: 'The Archive of the Dead Kings',
    lore: ['Beneath the city, the skeleton kings guard the order of their bloodline. No one wrote it down: they only remember it, fragment by fragment, in the dark.',
      'Each fragment is a clue — who came before, who came after; in the deeper halls, whole bloodlines ("all…", "some…") and conditional oaths ("if…"). Read it and keep it: as soon as the next one arrives, it fades.',
      'Then the kings ask about a truth. You may swear to it — Yes — only if the clue of now and the clue from {n} {jj} ago guarantee it together. If the order stays in shadow, or they say the opposite, answer No.',
      'The fragments lie in form, never in order: "is followed by", "does not precede", "it is not true that…" — the same path through crooked halls. Beware the wrong fragment too: only the one from {n} {jj} ago counts.',
      '{lives}', '{dur}'],
    loreDurBlock: 'This vigil lasts one cycle of fragments.', loreDurMin: 'You have {m} minutes in the crypt. When the last candle goes out, the vigil ends.',
    music: 'Music', musicOn: 'Music on — click to turn off (M)', musicOff: 'Music off — click to turn on (M)', musicVol: 'Music volume',
    lives: 'Candles', rankT: 'Ranking', ladder: { free: 'Free', timed: 'Timed', duel: 'Duels' },
    ranks: ['Acolyte', 'Scribe', 'Warden', 'Archivist', 'Crypt Knight', 'Necromancer', 'Lord of Bones', 'Dead King'],
    win: 'Victory', ptsWin: '+{d} honour · {l}', ptsLoss: '−{d} honour · {l}', unrated: 'Unranked round: it didn\'t reach the end.',
    rankUp: '▲ New rank: {r}', rankDown: '▼ Down to {r}', toNext: '{d} to {r}', topRank: 'top rank', rankLine: '{r} · {p} points',
    deathT: 'You perished in the crypt', deathSub: 'The third candle went out on move {i}. The kings do not forgive false oaths.', deathWhy: 'Where the shadow caught you',
    deathRise: 'Rise again', deathReport: 'See the full report', deathLvl: 'The crypt pushes you back to level {l}.',
    tip: { eLure: 'You combined the wrong clue — only the one from {n} {jj} ago counts.', eDir: 'You swore to an order the clues contradict.', eOver: 'You swore without a link: the two clues didn\'t touch.', eMiss: 'You denied a truth: the two clues formed a chain.', eTime: 'Time ran out before your oath.', eOppX: 'The clues guaranteed exactly the opposite.', eMissX: 'You denied a conclusion the two clues guaranteed.', fMissMT: '"If P, Q" and "not Q" guarantee "not P" — modus tollens.',
      fIllConv: '"All A are B" does not guarantee "all B are A" (nor does "some A are not B" guarantee "some B are not A").', fSomeAll: 'A clue about some says nothing about all.',
      fSomeNot: 'Knowing that some are doesn\'t tell you whether any are not (and vice versa).', fUndMid: 'The class linking the clues was never stated in full: the other two can sit in different parts of it.',
      fIllicit: 'The conclusion talks about a whole class the clues only covered in part.', fTwoNeg: 'Two negative clues only say what is left out — they link nothing.',
      fQual: 'With a negative clue the conclusion must be negative; with two affirmative clues it must be affirmative.', fNoLinkS: 'The clues don\'t share the class that would link the terms of the question.',
      fInvalidS: 'These two clues are not enough for this conclusion.', fAC: '"If P, Q" and "Q" don\'t guarantee P: Q can happen for another reason.', fDA: '"If P, Q" and "not P" don\'t guarantee "not Q".',
      fConv: '"If P, Q" doesn\'t guarantee "if Q, P": Q is necessary for P, not sufficient.', fChain: 'The conditions don\'t chain: the consequent of one had to be the antecedent of the other.',
      fNoLinkC: 'The clues don\'t talk about what the question asks.', fInvalidC: 'The conditional doesn\'t apply in this direction.',
      fAffDisj: '"P or Q" and "P" don\'t guarantee "not Q": "or" allows both.', fNoLinkD: 'The clues don\'t talk about what the question asks.', fInvalidD: 'These two clues are not enough for this conclusion.', fNegQ: 'The opposite of "all are" is "some are not", not "none are".' },
    domT: 'Training mode', domL: { mix: 'Varied', ord: 'Grammatical reasoning', syl: 'Syllogisms', cond: 'Conditionals', disj: 'Disjunctions', bias: 'Belief bias' },
    domD: { mix: 'Each block changes type and level; sometimes mixes types in one block', ord: 'Order: before, after, passive, negations', syl: 'Classes: all, no, some', cond: 'If…, then…, only if, unless', disj: 'G or K: "or" means at least one — maybe both', bias: 'Syllogisms with real words: judge the logic, not whether it sounds true' },
    mixShort: 'each type keeps its own level', relD: { disj: ['"or" and facts', '+ "or both", swapped order', '+ "if not…", "it is not the case that…"'], bias: ['real words, basic forms', '+ variants ("every", "not all")', '+ variants ("every", "not all")'], syl: ['basic forms (all, no, some)', '+ variants ("every", "not all", "there are… that")', '+ traps ("only… are", "it is not true that…")'], cond: ['"if…, …" and facts', '+ "then", "whenever", "is enough", contrapositive', '+ "only if", "must", "unless"'] }, autoSubMix: '{lv} · {s} · {q}', mixLv: 'levels: grammatical {o} · syllogisms {y} · conditionals {c} · disjunctions {d} · bias {b}', sessLvlD: '{d}: level {a} → {c}',
    domTip: 'Order: before/after · Classes: "all", "no", "some" (syllogisms) · Conditions: "if…, then…" · Mixed: alternates the types (at 2-back or more, each thread of clues keeps its own type).',
    falT: 'Your most frequent fallacies', falSess: 'Fallacies this session: {f}',
    eOppX: 'Swore the opposite', eMissX: 'Denied a valid conclusion', fMissMT: 'Missed modus tollens',
    fIllConv: 'Illicit conversion', fSomeAll: 'From "some" to "all"', fSomeNot: '"Some are" ≠ "some are not"', fUndMid: 'Undistributed middle', fIllicit: 'Illicit major/minor term',
    fTwoNeg: 'Two negative clues', fQual: 'Wrong quality', fNoLinkS: 'No linking class', fInvalidS: 'Invalid syllogism',
    fAC: 'Affirming the consequent', fDA: 'Denying the antecedent', fConv: 'Reversed conditional', fChain: 'Broken chain of conditions', fNoLinkC: 'Unlinked conditions', fInvalidC: 'Misapplied conditional',
    xYes: 'Yes. {d}', xOpp: 'No: the opposite follows. {d}', xUnk: 'No: you can\'t tell. Trap: {f} — {t}',
    rMP: 'Modus ponens: "if P, Q" and "P" guarantee "Q".', rMT: 'Modus tollens: "if P, Q" and "not Q" guarantee "not P".',
    rHS: 'Hypothetical syllogism: the conditions chain (the consequent of one is the antecedent of the other, sometimes via the contrapositive).',
    rCP: 'Contraposition: "if P, Q" is the same as "if not Q, not P".', rX: 'The two clues together guarantee it.', rXo: 'The two clues together guarantee the opposite.',
    rSyl: 'The two clues link through the class {m} and guarantee the conclusion.', rSylOne: 'One of the clues already says it, in other words.',
    fAffDisj: 'Affirming a disjunct', fNoLinkD: 'Unlinked disjunctions', fInvalidD: 'Misapplied disjunction', fNegQ: 'Wrong negation',
    rDS: 'Disjunctive syllogism: "P or Q" and "not P" guarantee "Q".', rRES: 'The two disjunctions combine: what one rules out, the other forces.', belNote: ' (In the real world the conclusion {b}, but here only the logic counts.)', belT: 'sounds true', belF: 'sounds false',
    sessPts: 'Honour this session: {d} · {l}',
    loreLives: 'You carry three candles. Each false oath puts one out; when all three are out, the round ends and you lose honour. Reaching the end earns honour — more the deeper you go. Free and Timed are separate rankings.',
    loreKeys: '← Yes · No →   ·   P to hide (pause)', loreGo: 'Enter the crypt', loreSkip: 'Skip this introduction in future sessions',
    intro: 'One clue appears at a time and the previous one disappears. On each move, combine the new clue with the one from N moves ago and answer: do the two clues guarantee the statement? Yes if they do. No if they don\'t — because the opposite follows or because you can\'t tell. Only those two clues count.',
    exTitle: 'Example in 2-back · "No" = not guaranteed (the opposite, or can\'t tell)',
    ex: [['A comes before B.', 'Memorise.'], ['D is followed by C.', 'Memorise (= D before C).'], ['C does not come before B.', '"Do they guarantee A goes before C?" Yes: "C does not come before B" = B before C; with clue 1, A < B < C.'], ['A precedes E.', '"Do they guarantee E succeeds D?" No: with clue 2 (D < C), A < E and D < C don\'t connect — can\'t tell. Only the clue from 2 moves ago counts.']],
    level: 'Level', letters: '{k} letters', nback: '{n}-back', pace: 'Pace', paceFree: 'Free', paceS: '{s} s per move', autoBtn: 'Adaptive mode', autoSub: 'Level {l} · {d} · {t} s per move — level and time go up and down on their own', manual: 'Choose myself (level and pace)', startManual: 'Start with these settings', how: 'How it works (example)', paceAuto: 'Adaptive', paceAutoS: 'adaptive · {s} s', autoSum: 'Time per move: {a} s → {b} s ({d})', faster: 'faster', slower: 'slower', same: 'same', autoTip: 'Adaptive: each correct answer shortens the time, each error lengthens it; the time carries over to the next block.',
    start: 'Start the block', resume: 'Continue the block', discard: 'Discard',
    hist: 'Recent blocks', none: 'No blocks yet.',
    move: 'Move {i} of {n}', agoN: 'Clue from {n} {jj} ago', remember: 'recall it', thenT: 'Together, do they guarantee that…', clueNow: 'New clue', memo: 'Memorise this clue', reviewK: 'Review before resuming · {i} of {n}',
    clue: '{p} comes before {q}.', qLong: 'With the clue from {n} {jj} ago:', jj1: 'move', jjN: 'moves',
    claim: '{p} before {q}?', pairT: 'Memorise: you\'ll combine it with the clue {n} {jj} from now.', aT: 'Yes', aF: 'No', aTs: '', aFs: '', askG: 'Do the two clues guarantee that', recall1: 'Recall the previous clue', recallN: 'Recall the clue from {n} moves ago', okRun: '✓ Correct · {n} in a row', next: 'Next', pause: 'Pause',
    rowClaim: '"{p} before {q}"', vT: 'Yes. {d}', vFopp: 'No: the opposite follows. {d}', vFunk: 'No: you can\'t tell. {d}',
    paused: 'Paused', pausedTxt: 'When you resume, you review {what} in the original order before continuing. The review is noted in the summary.', cont: 'Resume', quit: 'End the block',
    ok: '✓ Correct!', bad: '✗', streak: 'Streak ×{n}', timeout: 'Time up',
    sumTitle: 'Block finished', score: '{ok} of {n} correct · Best streak: {b}', up: '▲ Up to level {l}: {d}.', down: '▼ Down to level {l} to consolidate.', hold: 'You stay at level {l}.',
    resumed: 'You resumed the block {n}× with a clue review (memory help).',
    errs: 'Error types', eLure: 'Wrong clue', eDir: 'Direction swapped', eOver: 'Concluded without a link', eMiss: 'Missed the link', eTime: 'Time up',
    review: 'Move by move', again: 'Another block', menuBtn: 'Back to the mode',
    you: 'You answered: {a}', right: 'Correct: {a}', noAns: 'no answer',
    xLure: 'Your answer would make sense with clue {l}. On this move, clue {p} counted.',
    dDirect: 'Clue {p} already says "{a} before {b}".',
    dChain: '{a} before {m} and {m} before {b} (clues {i} and {j}) → {a} before {b}.',
    dUnkOne: 'Clue {p} links {a} to {m}, but the other doesn\'t link {m} to {o}. To conclude, clue {q} would have to be "{m} comes before {o}" or "{o} comes before {m}".',
    dUnkTwo: 'One clue links {x} to {m} and the other links {y} to {w}, but {m} and {w} aren\'t linked. A clue between them was missing.',
    dUnkNone: 'Neither clue mentions {x} or {y}.',
    dUnkSame: 'Both clues link {t} to other letters ({a} and {b}), but neither reaches {o}.',
    pistas: 'Clues {i} and {j}', lvlDesc: '{n}-back · {k} letters · {r}',
    rel: ['12 forms (before, after, precedes, succeeds, passive…)', '+ negations', '+ "it is not true that…" and double negation', '+ compound statements'],
    F: {
      b: '{p} comes before {q}', a: '{p} comes after {q}', pr: '{p} precedes {q}', fo: '{p} follows {q}', an: '{p} goes before {q}', vs: '{p} comes later than {q}',
      ss: '{p} succeeds {q}', la: '{p} is placed earlier than {q}', lp: '{p} is placed later than {q}',
      pp: '{p} is preceded by {q}', pf: '{p} is followed by {q}', pa: '{p} has {q} before it',
      nb: '{p} does not come before {q}', na: '{p} does not come after {q}', npr: '{p} does not precede {q}', nfo: '{p} does not follow {q}', nan: '{p} does not go before {q}',
      nvs: '{p} does not come later than {q}', npp: '{p} is not preceded by {q}', npf: '{p} is not followed by {q}', npa: '{p} does not have {q} before it',
      tb: 'it is not true that {p} comes after {q}', ta: 'it is not true that {p} comes before {q}', tp: 'it is not true that {p} precedes {q}', tf: 'it is not true that {p} follows {q}',
      dn: 'it is not true that {p} does not come before {q}', dna: 'it is not true that {p} does not come after {q}' },
    rate: 'Score: {r} per minute (correct − wrong, answering time only)', best: 'Best score: {r}/min',
    and: ' and ', eq: '= {p} before {q}', vF0: 'No.', vT0: 'Yes.',
    pYes: 'guaranteed', pOpp: 'the opposite follows', pUnk: 'can\'t tell from these two clues',
    negNote: 'Each letter has its own place: "A does not come before B" means A comes after B. Watch the passive: "A is followed by B" means A comes before B; "A is not followed by B" says the opposite. At higher levels the statement can have two parts ("… and …"): the answer is Yes only if both parts are guaranteed.',
    sound: 'Sound', on: 'On', off: 'Off', stroop: 'Stroop', stroopTip: 'The statement appears in green or red at random. Ignore the colour: only what the clues guarantee counts.',
    stroopSum: 'Stroop · matching colour: {a}/{b} · clashing colour: {c}/{d}',
    keys: 'Keyboard: ← Yes · → No (or Y / N). On clues to memorise, any arrow or Enter moves on. P pauses. Enter starts the block.'
  }
};
const lang = () => (window.LGApp && window.LGApp.lang && window.LGApp.lang()) === 'en' ? 'en' : 'pt';
const tt = (k, v) => { let s = TX[lang()][k]; if (typeof s !== 'string') return s; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };

// ---------- estado ----------
const KEY = 'lglab.chain.v1';
const S = (() => { let d; try { d = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { d = {}; } d.lvl = d.lvl || 1; d.hist = d.hist || []; if (d.dur == null) d.dur = 10; if (!d.apace) d.apace = 'free'; if (d.nFix == null) d.nFix = 0; if (d.lore == null) d.lore = true; d.rank = d.rank || { free: 800, timed: 800 }; if (d.rank.duel == null) d.rank.duel = 800; d.duels = d.duels || {}; d.wason = d.wason || { lvl: 1, best: 1, hist: [] }; d.music = d.music || { on: true, vol: .45 }; if (d.mpace == null) d.mpace = d.pace && d.pace > 0 ? d.pace : 0; d.pace = d.pace || 0; d.autoT = d.autoT || 6; if (d.sound == null) d.sound = true; d.stroop = !!d.stroop; if (!d.dom) d.dom = 'mix'; if (!d.lvls) d.lvls = { ord: d.lvl || 1, syl: 1, cond: 1 }; for (const k of ['disj', 'bias']) if (!d.lvls[k]) d.lvls[k] = 1; d.fal = d.fal || {}; return d; })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

// níveis: N, número de letras, frequência de armadilhas e tipo de relação
// rel 1 só «antes» · 2 «antes»/«depois» · 3 + «não» · 4 + afirmações compostas («… e …»)
const LEVELS = [null,
  { n: 1, k: 6, lure: .3, rel: 1 }, { n: 2, k: 6, lure: .35, rel: 1 }, { n: 2, k: 6, lure: .4, rel: 2 }, { n: 2, k: 7, lure: .45, rel: 3 }, { n: 2, k: 7, lure: .45, rel: 4 },
  { n: 2, k: 8, lure: .5, rel: 4 }, { n: 3, k: 7, lure: .45, rel: 2 }, { n: 3, k: 7, lure: .5, rel: 3 }, { n: 3, k: 8, lure: .5, rel: 4 }, { n: 3, k: 8, lure: .55, rel: 4 },
  { n: 3, k: 9, lure: .6, rel: 4 }, { n: 4, k: 9, lure: .6, rel: 4 },
  ...[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => ({ n, k: 9, lure: .6, rel: 4 }))];   // níveis 13–23: 5-back a 15-back
const MAXL = LEVELS.length - 1, MOVES = 20, PACES = [-1, 0, 8, 5];   // -1 = adaptativo
const fmtS = (x) => (Math.round(x * 10) / 10).toLocaleString(lang() === 'pt' ? 'pt-PT' : 'en-GB');
const paceSecs = () => R.pace === -1 ? R.autoT : R.pace;
const paceLabel = () => R.pace === -1 ? tt('paceAutoS', { s: fmtS(R.autoT) }) : R.pace ? tt('paceS', { s: R.pace }) : tt('paceFree');

// ---------- lógica: o que se deduz de duas pistas sobre o par-alvo ----------
// pista = [p, q] → «p vem antes de q»
function derive(c1, c2, X, Y) {
  for (const [c, k] of [[c1, 0], [c2, 1]]) {
    if (c[0] === X && c[1] === Y) return { a: 'xy', how: 'direct', k };
    if (c[0] === Y && c[1] === X) return { a: 'yx', how: 'direct', k };
  }
  for (const [e1, e2, k1, k2] of [[c1, c2, 0, 1], [c2, c1, 1, 0]]) {
    if (e1[1] === e2[0]) {
      const a = e1[0], b = e2[1];
      if (a === X && b === Y) return { a: 'xy', how: 'chain', m: e1[1], k1, k2 };
      if (a === Y && b === X) return { a: 'yx', how: 'chain', m: e1[1], k1, k2 };
    }
  }
  return { a: 'unk' };
}
const contradicts = (a, b) => a && b && a[0] === b[1] && a[1] === b[0];
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

// gera vários blocos e fica com o primeiro bem equilibrado e variado:
// Verdadeiro e Falso perto de metade cada, e afirmações sobre pares de letras sempre diferentes
function makeBlock(lvl, nFix) {
  let best = null, bestSc = -1;
  const streams = domStreams(nFix || LEVELS[lvl].n), X = streams.some(d => d !== 'ord');
  for (let t = 0; t < (X ? 8 : 30); t++) {
    const b = X ? makeBlockX(lvl, nFix ? Object.assign({}, LEVELS[lvl], { n: nFix }) : LEVELS[lvl], streams) : makeBlock1(lvl, nFix);
    const ev = b.moves.filter(m => m.parts || m.cl), T = ev.filter(m => m.truth).length;
    const pairsSeen = new Set(ev.map(m => m.key || m.parts[0].f.slice().sort().join('')));
    const bal = Math.min(T, ev.length - T) / ev.length, varie = pairsSeen.size / ev.length;
    if (bal >= .44 && varie >= (b.doms && b.doms.some(d => d !== 'ord') ? .45 : .6)) return b;
    const sc = bal * 2 + varie;
    if (sc > bestSc) { best = b; bestSc = sc; }
  }
  return best;
}
// quantas respostas iguais seguidas no fim (só jogadas com pergunta)
const runOf = (moves) => { let v = null, n = 0; for (let j = moves.length - 1; j >= 0; j--) { const m = moves[j]; if (m.truth == null && m.ans == null) continue; const t = m.truth != null ? m.truth : m.ans === 'xy'; if (v === null) v = t; if (t !== v) break; n++; } return { v, n }; };
// letras sem confusões visuais (sem I, O, Q, W, Y)
const ALPHA = 'ABCDEFGHJKLMNPRSTVXZ'.split('');
function makeBlock1(lvl, nFix) {
  const L = nFix ? Object.assign({}, LEVELS[lvl], { n: nFix }) : LEVELS[lvl], letters = shuffle(ALPHA).slice(0, L.k).sort();
  const pairs = []; for (const p of letters) for (const q of letters) if (p !== q) pairs.push([p, q]);
  const moves = [], cnt = { t: 0, f: 0 };
  const recentClues = () => moves.slice(-4).map(m => m.c);
  const recentClaims = () => moves.slice(-4).filter(m => m.f).map(m => m.f.slice().sort().join(''));
  // variedade: pistas e letras usadas há pouco ficam menos prováveis
  const wClue = (c) => { let x = 1; const rec = recentClues();
    if (rec.some(r => same(r, c))) x *= .05; if (rec.some(r => contradicts(r, c))) x *= .3;
    for (const l of c) x *= Math.pow(.6, rec.filter(r => r.includes(l)).length);
    return x; };
  const pickW = (opts, wf) => { const tot = opts.reduce((s, o) => s + wf(o), 0); let r = Math.random() * tot; for (const o of opts) { r -= wf(o); if (r <= 0) return o; } return opts[opts.length - 1]; };
  const M = Math.max(MOVES, L.n + 16);
  for (let i = 0; i < M; i++) {
    if (i < L.n) { moves.push({ c: pickW(pairs, wClue) }); continue; }
    const base = moves[i - L.n].c;
    const lureIdx = L.n >= 2 ? i - 1 : (i - 2 >= 0 ? i - 2 : null);
    const lureC = lureIdx != null ? moves[lureIdx].c : null;
    // todas as combinações (pista atual, afirmação): a afirmação usa uma letra da pista atual («âncora»), no mesmo lugar,
    // e outra letra W; assim o sentido da afirmação nunca denuncia a resposta e a resposta depende de lembrar a pista antiga
    const opts = [];
    for (const c of pairs) {
      if (same(c, base) || contradicts(c, base)) continue;
      for (const k of [0, 1]) for (const W of letters) {
        if (W === c[0] || W === c[1]) continue;
        const f = k === 0 ? [c[0], W] : [W, c[1]];
        const a = derive(c, base, f[0], f[1]).a;
        const la = lureC && !contradicts(c, lureC) ? derive(c, lureC, f[0], f[1]).a : null;
        opts.push({ c, f, truth: a === 'xy', ans: a, lureDiff: la != null && (la === 'xy') !== (a === 'xy'), wInBase: base.includes(W), direct: same(f, base) });
      }
    }
    const run = runOf(moves), wantT = run.n >= 3 ? (Math.random() < .8 ? !run.v : run.v) : cnt.t - cnt.f < 0 ? Math.random() < .7 : cnt.t - cnt.f > 0 ? Math.random() < .3 : Math.random() < .5;
    const wantLure = lureC && Math.random() < L.lure;
    let pool = opts.filter(o => o.truth === wantT && (!wantLure || o.lureDiff));
    if (!pool.length) pool = opts.filter(o => o.truth === wantT);
    if (!pool.length) pool = opts;
    const rc = recentClaims();
    const o = pickW(pool, (o) => wClue(o.c) * (o.direct ? .1 : 1) * (!o.truth && o.wInBase ? 6 : 1) * (rc.includes(o.f.slice().sort().join('')) ? .15 : 1));
    cnt[o.truth ? 't' : 'f']++;
    moves.push({ c: o.c, f: o.f, ans: o.ans, base: i - L.n, lc: lureIdx });
  }
  // formas das frases: «depois de», «precede», passiva e «não» dizem o mesmo facto de outra maneira (facto [p, q] = p antes de q)
  const WF = FORMS_BY_REL[Math.min(L.rel, 3)];
  const pickF = (...avoid) => { const ok = WF.filter(x => !avoid.includes(x)); return ok[rnd(ok.length)]; };
  const holds = (parts, c1, c2) => parts.every(pt => derive(c1, c2, pt.f[0], pt.f[1]).a === 'xy');
  for (const m of moves) {
    m.w = pickF(moves[moves.indexOf(m) - 1] && moves[moves.indexOf(m) - 1].w);
    if (!m.f) continue;
    const base = moves[m.base].c;
    const parts = [{ f: m.f, w: pickF(m.w) }];
    // composta: junta um facto da pista antiga (ou o seu contrário); só é verdadeira se as duas partes o forem
    if (L.rel >= 4 && Math.random() < .5 && !same(base, m.f) && !contradicts(base, m.f)) {
      const t2 = m.truth !== false && derive(m.c, base, m.f[0], m.f[1]).a === 'xy' ? true : Math.random() < .5;
      parts.push({ f: t2 ? base.slice() : [base[1], base[0]], w: pickF(m.w, parts[0].w) });
      if (Math.random() < .5) parts.reverse();
    }
    m.parts = parts;
    m.truth = holds(parts, m.c, base);
    const lt = m.lc != null && !contradicts(m.c, moves[m.lc].c) ? holds(parts, m.c, moves[m.lc].c) : null;
    if (lt != null && lt !== m.truth) { m.lureIdx = m.lc; m.lureTruth = lt; } else { m.lureIdx = null; m.lureTruth = null; }
  }
  if (S.stroop) for (const m of moves) if (m.parts) m.col = Math.random() < .5 ? 'g' : 'r';
  return { lvl, n: L.n, k: L.k, rel: L.rel, letters, stroop: !!S.stroop, moves, i: 0, ans: [], streak: 0, best: 0, ok: 0, resumes: 0, pace: S.pace, started: Date.now(), tf: 3 };
}

// ================= tipos de pista: ordem, classes (silogismos categóricos) e condições (condicionais) =================
// ideias da lógica clássica — regras de validade do silogismo, modus ponens/tollens e falácias formais; todas as frases são geradas aqui
const DOMS = ['ord', 'syl', 'cond', 'disj', 'bias'];
const isX = (m) => !!m && (m.dom === 'syl' || m.dom === 'cond' || m.dom === 'disj' || m.dom === 'bias');
const isSyl = (d) => d === 'syl' || d === 'bias';
const pickOne = (a) => a[rnd(a.length)];
const sampleW = (arr, wf, n) => { const pool = arr.map(o => ({ o, w: wf(o) })).filter(x => x.w > 0), out = [];
  while (out.length < n && pool.length) { const tot = pool.reduce((t, x) => t + x.w, 0); let r = Math.random() * tot, k = 0; for (; k < pool.length - 1; k++) { r -= pool[k].w; if (r <= 0) break; } out.push(pool[k].o); pool.splice(k, 1); }
  return out; };
// ---- classes: {t: A todos · E nenhum · I alguns · O alguns-não, s, p}
const SYL_T = ['A', 'E', 'I', 'O'], SYL_NEG = { A: 'O', E: 'I', I: 'E', O: 'A' };
// modelo por regiões (cada região = combinação de classes): as universais esvaziam regiões, as particulares pedem uma região viva
function sylSat(st, terms, imp) {
  const R2 = 1 << terms.length, bit = (x) => 1 << terms.indexOf(x), alive = [];
  for (let r = 0; r < R2; r++) alive.push(st.every(q => !((q.t === 'A' && (r & bit(q.s)) && !(r & bit(q.p))) || (q.t === 'E' && (r & bit(q.s)) && (r & bit(q.p))))));
  const need = st.filter(q => q.t === 'I' || q.t === 'O').map(q => (r) => (r & bit(q.s)) && (q.t === 'I' ? (r & bit(q.p)) : !(r & bit(q.p))));
  if (imp) for (const x of terms) need.push((r) => r & bit(x));
  return need.every(f => alive.some((a, r) => a && f(r)));
}
// 'xy' garantido · 'yx' o contrário · 'unk' não dá para saber · null = pistas incompatíveis ou depende de haver ou não membros (evitado)
const SYL_MEMO = new Map();
function sylEv(prem, cl) {
  const mk = prem.concat([cl]).map(q => q.t + q.s + q.p).join('|'); if (SYL_MEMO.has(mk)) return SYL_MEMO.get(mk);
  if (SYL_MEMO.size > 20000) SYL_MEMO.clear();
  const r = sylEv0(prem, cl); SYL_MEMO.set(mk, r); return r;
}
function sylEv0(prem, cl) {
  const terms = [...new Set(prem.concat([cl]).flatMap(q => [q.s, q.p]))], out = [];
  for (const imp of [false, true]) {
    if (!sylSat(prem, terms, imp)) return null;
    const yes = !sylSat(prem.concat([{ t: SYL_NEG[cl.t], s: cl.s, p: cl.p }]), terms, imp), no = !sylSat(prem.concat([cl]), terms, imp);
    out.push(yes ? 'xy' : no ? 'yx' : 'unk');
  }
  return out[0] === out[1] ? out[0] : null;
}
const sylHas = (q, x) => q.s === x || q.p === x;
const sylDist = (q, x) => (q.t === 'A' && q.s === x) || (q.t === 'E' && sylHas(q, x)) || (q.t === 'O' && q.p === x);
const sylNegQ = (q) => q.t === 'E' || q.t === 'O';
// que regra do silogismo foi quebrada (para nomear a falácia quando se jura uma conclusão que não se segue)
function sylFal(c, base, cl) {
  const imm = [c, base].find(q => sylHas(q, cl.s) && sylHas(q, cl.p));
  if (imm) {
    const conv = imm.s === cl.p;
    if ((imm.t === 'A' && cl.t === 'A' && conv) || (imm.t === 'O' && cl.t === 'O' && conv)) return 'fIllConv';
    if (imm.t === 'O' && cl.t === 'E') return 'fNegQ';
    if ((imm.t === 'I' || imm.t === 'O') && (cl.t === 'A' || cl.t === 'E')) return 'fSomeAll';
    if ((imm.t === 'I' && cl.t === 'O') || (imm.t === 'O' && cl.t === 'I')) return 'fSomeNot';
    if (imm.t === 'O' && cl.t === 'E') return 'fNegQ';
    if (imm.t === 'I' && cl.t === 'A') return 'fSomeAll';
    return 'fInvalidS';
  }
  const mids = [c.s, c.p].filter(x => sylHas(base, x));
  if (mids.length !== 1 || !(sylHas(c, cl.s) || sylHas(c, cl.p)) || !(sylHas(base, cl.s) || sylHas(base, cl.p))) return 'fNoLinkS';
  const M = mids[0], prem = [c, base];
  if (prem.every(sylNegQ)) return 'fTwoNeg';
  if (!prem.some(q => sylDist(q, M))) return 'fUndMid';
  for (const x of [cl.s, cl.p]) if (sylDist(cl, x) && !prem.some(q => sylHas(q, x) && sylDist(q, x))) return 'fIllicit';
  if (prem.some(sylNegQ) !== sylNegQ(cl)) return 'fQual';
  return 'fInvalidS';
}
// ---- condições: literal {a, n (negado)}; pista {k:'if', a, b} = «se a, então b» ou {k:'fact', l}
const litEq = (x, y) => x.a === y.a && x.n === y.n, litNot = (l) => ({ a: l.a, n: !l.n });
const condAtoms = (q) => q.k === 'if' || q.k === 'or' || q.k === 'iff' ? [q.a.a, q.b.a] : [q.l.a];
function condEv(prem, cl) {
  const atoms = [...new Set(prem.concat([cl]).flatMap(condAtoms))];
  const val = (l, row) => !!((row >> atoms.indexOf(l.a)) & 1) !== l.n;
  const hold = (q, row) => q.k === 'if' ? (!val(q.a, row) || val(q.b, row)) : q.k === 'or' ? (val(q.a, row) || val(q.b, row)) : q.k === 'iff' ? val(q.a, row) === val(q.b, row) : val(q.l, row);
  let any = false, all = true, some = false;
  for (let row = 0; row < (1 << atoms.length); row++) { if (!prem.every(q => hold(q, row))) continue; any = true; if (hold(cl, row)) some = true; else all = false; }
  return !any ? null : all ? 'xy' : some ? 'unk' : 'yx';
}
function condRule(c, base, cl) {
  const prem = [c, base], fact = prem.find(q => q.k === 'fact'), cond = prem.find(q => q.k === 'if');
  if (cl.k === 'fact' && fact && cond) { if (litEq(fact.l, cond.a) && litEq(cl.l, cond.b)) return 'MP'; if (litEq(fact.l, litNot(cond.b)) && litEq(cl.l, litNot(cond.a))) return 'MT'; }
  if (cl.k === 'if' && !fact) return prem.some(q => condEv([q], cl) === 'xy') ? 'CP' : 'HS';
  return '';
}
function condFal(c, base, cl) {
  const prem = [c, base], fact = prem.find(q => q.k === 'fact'), cond = prem.find(q => q.k === 'if');
  const share = condAtoms(c).some(x => condAtoms(base).includes(x));
  if (cl.k === 'fact') {
    if (fact && cond) {
      if (litEq(fact.l, cond.b) && litEq(cl.l, cond.a)) return 'fAC';
      if (litEq(fact.l, litNot(cond.a)) && litEq(cl.l, litNot(cond.b))) return 'fDA';
      if (condAtoms(cond).includes(fact.l.a)) return 'fInvalidC';
    }
    return 'fNoLinkC';
  }
  if (condEv(prem, { k: 'if', a: cl.b, b: cl.a }) === 'xy') return 'fConv';
  return share ? 'fChain' : 'fNoLinkC';
}
// ---- frases (formas por nível: 1 básicas · 2 + variantes · 3 + armadilhas de linguagem)
const SYL_F = [
  { id: 'a1', t: 'A', rel: 1, pt: (s, p) => `todos os ${s} são ${p}`, en: (s, p) => `all ${s} are ${p}` },
  { id: 'a2', t: 'A', rel: 2, pt: (s, p) => `qualquer ${s} é ${p}`, en: (s, p) => `every ${s} is ${p}` },
  { id: 'a3', t: 'A', rel: 3, pt: (s, p) => `só os ${p} são ${s}`, en: (s, p) => `only ${p} are ${s}` },
  { id: 'a4', t: 'A', rel: 3, pt: (s, p) => `nenhum ${s} deixa de ser ${p}`, en: (s, p) => `no ${s} fails to be ${p}` },
  { id: 'e1', t: 'E', rel: 1, pt: (s, p) => `nenhum ${s} é ${p}`, en: (s, p) => `no ${s} is ${p}` },
  { id: 'e2', t: 'E', rel: 2, pt: (s, p) => `nenhum ${p} é ${s}`, en: (s, p) => `no ${p} is ${s}` },
  { id: 'e3', t: 'E', rel: 2, pt: (s, p) => `não há ${s} que sejam ${p}`, en: (s, p) => `there are no ${s} that are ${p}` },
  { id: 'e4', t: 'E', rel: 3, pt: (s, p) => `não é verdade que algum ${s} seja ${p}`, en: (s, p) => `it is not true that some ${s} are ${p}` },
  { id: 'i1', t: 'I', rel: 1, pt: (s, p) => `alguns ${s} são ${p}`, en: (s, p) => `some ${s} are ${p}` },
  { id: 'i2', t: 'I', rel: 2, pt: (s, p) => `alguns ${p} são ${s}`, en: (s, p) => `some ${p} are ${s}` },
  { id: 'i3', t: 'I', rel: 2, pt: (s, p) => `há ${s} que são ${p}`, en: (s, p) => `there are ${s} that are ${p}` },
  { id: 'i4', t: 'I', rel: 3, pt: (s, p) => `pelo menos um ${s} é ${p}`, en: (s, p) => `at least one ${s} is ${p}` },
  { id: 'o1', t: 'O', rel: 1, pt: (s, p) => `alguns ${s} não são ${p}`, en: (s, p) => `some ${s} are not ${p}` },
  { id: 'o2', t: 'O', rel: 2, pt: (s, p) => `nem todos os ${s} são ${p}`, en: (s, p) => `not all ${s} are ${p}` },
  { id: 'o3', t: 'O', rel: 3, pt: (s, p) => `há ${s} que não são ${p}`, en: (s, p) => `there are ${s} that are not ${p}` },
  { id: 'o4', t: 'O', rel: 3, pt: (s, p) => `não é verdade que todos os ${s} sejam ${p}`, en: (s, p) => `it is not true that all ${s} are ${p}` }];
const LIT = {
  pt: { ind: (l) => `${l.a} ${l.n ? 'não ' : ''}acontece`, sub: (l) => `${l.a} ${l.n ? 'não ' : ''}aconteça`, inf: (l) => `${l.a} ${l.n ? 'não ' : ''}acontecer` },
  en: { ind: (l) => `${l.a} ${l.n ? 'does not happen' : 'happens'}`, to: (l) => `${l.a} ${l.n ? 'not ' : ''}to happen`, ing: (l) => `${l.a} ${l.n ? 'not ' : ''}happening`, must: (l) => `${l.a} must ${l.n ? 'not ' : ''}happen` } };
const COND_F = [
  { id: 'c1', k: 'if', rel: 1, pt: (a, b, L) => `se ${L.ind(a)}, ${L.ind(b)}`, en: (a, b, L) => `if ${L.ind(a)}, ${L.ind(b)}` },
  { id: 'c2', k: 'if', rel: 2, pt: (a, b, L) => `se ${L.ind(a)}, então ${L.ind(b)}`, en: (a, b, L) => `if ${L.ind(a)}, then ${L.ind(b)}` },
  { id: 'c3', k: 'if', rel: 2, pt: (a, b, L) => `sempre que ${L.ind(a)}, ${L.ind(b)}`, en: (a, b, L) => `whenever ${L.ind(a)}, ${L.ind(b)}` },
  { id: 'c4', k: 'if', rel: 2, pt: (a, b, L) => `basta ${L.inf(a)} para ${L.inf(b)}`, en: (a, b, L) => `${L.ing(a)} is enough for ${L.to(b)}` },
  { id: 'c5', k: 'if', rel: 2, pt: (a, b, L) => `se ${L.ind(litNot(b))}, ${L.ind(litNot(a))}`, en: (a, b, L) => `if ${L.ind(litNot(b))}, ${L.ind(litNot(a))}` },
  { id: 'c6', k: 'if', rel: 3, pt: (a, b, L) => `${L.ind(a)} só se ${L.ind(b)}`, en: (a, b, L) => `${L.ind(a)} only if ${L.ind(b)}` },
  { id: 'c7', k: 'if', rel: 3, pt: (a, b, L) => `para ${L.inf(a)}, é preciso que ${L.sub(b)}`, en: (a, b, L) => `for ${L.to(a)}, ${L.must(b)}` },
  { id: 'c8', k: 'if', rel: 3, pt: (a, b, L) => `${L.ind(b)} a menos que ${L.sub(litNot(a))}`, en: (a, b, L) => `${L.ind(b)} unless ${L.ind(litNot(a))}` },
  { id: 'c9', k: 'if', rel: 3, pt: (a, b, L) => `${L.ind(litNot(a))} a não ser que ${L.sub(b)}`, en: (a, b, L) => `${L.ind(litNot(a))} unless ${L.ind(b)}` },
  { id: 'c10', k: 'if', rel: 2, pt: (a, b, L) => `${L.ind(b)} se ${L.inf(a)}`, en: (a, b, L) => `${L.ind(b)} if ${L.ind(a)}` },
  { id: 'c11', k: 'if', rel: 3, ok: (q) => q.a.n, pt: (a, b, L) => `sem que ${L.sub(litNot(a))}, ${L.ind(b)}`, en: (a, b, L) => `without ${L.ing(litNot(a))}, ${L.ind(b)}` },
  { id: 'b1', k: 'iff', rel: 3, pt: (a, b, L) => `${L.ind(a)} se e só se ${L.ind(b)}`, en: (a, b, L) => `${L.ind(a)} if and only if ${L.ind(b)}` },
  { id: 'f1', k: 'fact', rel: 1, pt: (l, _, L) => L.ind(l), en: (l, _, L) => L.ind(l) },
  { id: 'f2', k: 'fact', rel: 2, pt: (l, _, L) => `é verdade que ${L.ind(l)}`, en: (l, _, L) => `it is true that ${L.ind(l)}` },
  { id: 'f3', k: 'fact', rel: 3, pt: (l, _, L) => `é falso que ${L.sub(litNot(l))}`, en: (l, _, L) => `it is false that ${L.ind(litNot(l))}` }];
// ---- disjunções: {k:'or', a, b} = «a ou b» (inclusivo: pelo menos um, podem ser os dois)
function disjRule(c, base, cl) {
  const prem = [c, base], or = prem.find(q => q.k === 'or'), fact = prem.find(q => q.k === 'fact');
  if (cl.k === 'fact' && or && fact && ((litEq(fact.l, litNot(or.a)) && litEq(cl.l, or.b)) || (litEq(fact.l, litNot(or.b)) && litEq(cl.l, or.a)))) return 'DS';
  if (cl.k === 'or' && !fact) return 'RES';
  return '';
}
function disjFal(c, base, cl) {
  const prem = [c, base], or = prem.find(q => q.k === 'or'), fact = prem.find(q => q.k === 'fact');
  if (cl.k === 'fact' && or && fact && ((litEq(fact.l, or.a) && litEq(cl.l, litNot(or.b))) || (litEq(fact.l, or.b) && litEq(cl.l, litNot(or.a))))) return 'fAffDisj';
  return condAtoms(c).some(x => condAtoms(base).includes(x)) ? 'fInvalidD' : 'fNoLinkD';
}
const falOf = (dom, c, base, cl) => isSyl(dom) ? sylFal(c, base, cl) : dom === 'disj' ? disjFal(c, base, cl) : condFal(c, base, cl);
const DISJ_F = [
  { id: 'o1', k: 'or', rel: 1, pt: (a, b, L) => `${L.ind(a)} ou ${L.ind(b)}`, en: (a, b, L) => `${L.ind(a)} or ${L.ind(b)}` },
  { id: 'o2', k: 'or', rel: 2, pt: (a, b, L) => `${L.ind(b)} ou ${L.ind(a)}`, en: (a, b, L) => `${L.ind(b)} or ${L.ind(a)}` },
  { id: 'o3', k: 'or', rel: 2, pt: (a, b, L) => `${L.ind(a)} ou ${L.ind(b)}, ou ambos`, en: (a, b, L) => `${L.ind(a)} or ${L.ind(b)}, or both` },
  { id: 'o4', k: 'or', rel: 3, pt: (a, b, L) => `se ${L.ind(litNot(a))}, ${L.ind(b)}`, en: (a, b, L) => `if ${L.ind(litNot(a))}, ${L.ind(b)}` },
  { id: 'o5', k: 'or', rel: 3, pt: (a, b, L) => `não é verdade que ${L.sub(litNot(a))} e ${L.sub(litNot(b))}`, en: (a, b, L) => `it is not the case that ${L.ind(litNot(a))} and ${L.ind(litNot(b))}` },
  { id: 'f1', k: 'fact', rel: 1, pt: (l, _, L) => L.ind(l), en: (l, _, L) => L.ind(l) },
  { id: 'f2', k: 'fact', rel: 2, pt: (l, _, L) => `é verdade que ${L.ind(l)}`, en: (l, _, L) => `it is true that ${L.ind(l)}` },
  { id: 'f3', k: 'fact', rel: 3, pt: (l, _, L) => `é falso que ${L.sub(litNot(l))}`, en: (l, _, L) => `it is false that ${L.ind(litNot(l))}` }];
// ---- viés de crença: os silogismos de sempre, mas com classes reais; «parece verdadeiro» calcula-se com conjuntos de exemplos
// (1 corvo, 2 coruja, 4 lobo, 8 cavalo, 16 gato, 32 espada, 64 machado, 128 arco, 256 carvalho, 512 rosa, 1024 rubi)
const NOUNS = {
  corvos: [1, { pl: 'corvos', sg: 'corvo', g: 'm' }, { pl: 'ravens', sg: 'raven', a: 'a' }],
  corujas: [2, { pl: 'corujas', sg: 'coruja', g: 'f' }, { pl: 'owls', sg: 'owl', a: 'an' }],
  aves: [3, { pl: 'aves', sg: 'ave', g: 'f' }, { pl: 'birds', sg: 'bird', a: 'a' }],
  lobos: [4, { pl: 'lobos', sg: 'lobo', g: 'm' }, { pl: 'wolves', sg: 'wolf', a: 'a' }],
  cavalos: [8, { pl: 'cavalos', sg: 'cavalo', g: 'm' }, { pl: 'horses', sg: 'horse', a: 'a' }],
  gatos: [16, { pl: 'gatos', sg: 'gato', g: 'm' }, { pl: 'cats', sg: 'cat', a: 'a' }],
  mamiferos: [28, { pl: 'mamíferos', sg: 'mamífero', g: 'm' }, { pl: 'mammals', sg: 'mammal', a: 'a' }],
  animais: [31, { pl: 'animais', sg: 'animal', g: 'm' }, { pl: 'animals', sg: 'animal', a: 'an' }],
  predadores: [22, { pl: 'predadores', sg: 'predador', g: 'm' }, { pl: 'predators', sg: 'predator', a: 'a' }],
  espadas: [32, { pl: 'espadas', sg: 'espada', g: 'f' }, { pl: 'swords', sg: 'sword', a: 'a' }],
  machados: [64, { pl: 'machados', sg: 'machado', g: 'm' }, { pl: 'axes', sg: 'axe', a: 'an' }],
  armas: [224, { pl: 'armas', sg: 'arma', g: 'f' }, { pl: 'weapons', sg: 'weapon', a: 'a' }],
  metal: [96, { pl: 'objetos de metal', sg: 'objeto de metal', g: 'm' }, { pl: 'metal objects', sg: 'metal object', a: 'a' }],
  arvores: [256, { pl: 'árvores', sg: 'árvore', g: 'f' }, { pl: 'trees', sg: 'tree', a: 'a' }],
  plantas: [768, { pl: 'plantas', sg: 'planta', g: 'f' }, { pl: 'plants', sg: 'plant', a: 'a' }],
  vivos: [799, { pl: 'seres vivos', sg: 'ser vivo', g: 'm' }, { pl: 'living things', sg: 'living thing', a: 'a' }],
  joias: [1024, { pl: 'pedras preciosas', sg: 'pedra preciosa', g: 'f' }, { pl: 'gems', sg: 'gem', a: 'a' }] };
const nounOf = (nm, x) => { const n = NOUNS[nm && nm[x]] || NOUNS.aves; return lang() === 'pt' ? n[1] : n[2]; };
const sylBel = (q, nm) => { const a = NOUNS[nm[q.s]][0], b = NOUNS[nm[q.p]][0];
  return q.t === 'A' ? (a & ~b) === 0 : q.t === 'E' ? (a & b) === 0 : q.t === 'I' ? (a & b) !== 0 : (a & ~b) !== 0; };
const ptG = (n, m, f) => n.g === 'f' ? f : m;
const BIAS_F = [
  { id: 'a1', t: 'A', rel: 1, pt: (S, P) => `${ptG(S, 'todos os', 'todas as')} ${S.pl} são ${P.pl}`, en: (S, P) => `all ${S.pl} are ${P.pl}` },
  { id: 'a2', t: 'A', rel: 2, pt: (S, P) => `qualquer ${S.sg} é ${ptG(P, 'um', 'uma')} ${P.sg}`, en: (S, P) => `every ${S.sg} is ${P.a} ${P.sg}` },
  { id: 'e1', t: 'E', rel: 1, pt: (S, P) => `${ptG(S, 'nenhum', 'nenhuma')} ${S.sg} é ${ptG(P, 'um', 'uma')} ${P.sg}`, en: (S, P) => `no ${S.sg} is ${P.a} ${P.sg}` },
  { id: 'e3', t: 'E', rel: 2, pt: (S, P) => `não há ${S.pl} que sejam ${P.pl}`, en: (S, P) => `there are no ${S.pl} that are ${P.pl}` },
  { id: 'i1', t: 'I', rel: 1, pt: (S, P) => `${ptG(S, 'alguns', 'algumas')} ${S.pl} são ${P.pl}`, en: (S, P) => `some ${S.pl} are ${P.pl}` },
  { id: 'i3', t: 'I', rel: 2, pt: (S, P) => `há ${S.pl} que são ${P.pl}`, en: (S, P) => `there are ${S.pl} that are ${P.pl}` },
  { id: 'o1', t: 'O', rel: 1, pt: (S, P) => `${ptG(S, 'alguns', 'algumas')} ${S.pl} não são ${P.pl}`, en: (S, P) => `some ${S.pl} are not ${P.pl}` },
  { id: 'o2', t: 'O', rel: 2, pt: (S, P) => `nem ${ptG(S, 'todos os', 'todas as')} ${S.pl} são ${P.pl}`, en: (S, P) => `not all ${S.pl} are ${P.pl}` }];
const FSETS = { syl: () => SYL_F, cond: () => COND_F, disj: () => DISJ_F, bias: () => BIAS_F };
const xForm = (dom, id) => FSETS[dom]().find(f => f.id === id);
const xFormsFor = (dom, q, rel, claim) => (isSyl(dom) ? FSETS[dom]().filter(f => f.t === q.t) : FSETS[dom]().filter(f => f.k === q.k && (!f.ok || f.ok(q)) && (!claim || (q.k === 'if') || (q.k === 'or' && (f.id === 'o1' || f.id === 'o2')) || f.id === 'f1'))).filter(f => f.rel <= rel);
const xCanon = (dom, q) => isSyl(dom) ? q.t.toLowerCase() + '1' : q.k === 'if' ? 'c1' : q.k === 'or' ? 'o1' : q.k === 'iff' ? 'b1' : 'f1';
function xText(dom, q, id, nm) {
  const f = xForm(dom, id) || xForm(dom, xCanon(dom, q)), lg = lang();
  if (dom === 'bias') return f[lg](nounOf(nm, q.s), nounOf(nm, q.p));
  if (dom === 'syl') return f[lg](q.s, q.p);
  return q.k === 'if' || q.k === 'or' || q.k === 'iff' ? f[lg](q.a, q.b, LIT[lg]) : f[lg](q.l, null, LIT[lg]);
}
const hlLetters = (h) => h.replace(/\b([A-Z])\b/g, '<b class="lx">$1</b>');
const qPlain = (mv) => isX(mv) ? cap(xText(mv.dom, mv.cl, mv.cw, mv.nm)) : claimPlain(mv.parts);
const qHtml = (mv) => isX(mv) ? `${esc(tt('askG'))} ${mv.dom === 'bias' ? esc(xText(mv.dom, mv.cl, mv.cw, mv.nm)) : hlLetters(esc(xText(mv.dom, mv.cl, mv.cw)))}?` : claimHtml(mv.parts);
// explicação de uma jogada de classes/condições
function whyX(mv) {
  const base = R.moves[mv.base].c, c = mv.c, cl = mv.cl;
  const bel = mv.dom === 'bias' && mv.bel != null ? tt('belNote', { b: tt(mv.bel ? 'belT' : 'belF') }) : '';
  if (mv.ans === 'unk') { const f = falOf(mv.dom, c, base, cl); return tt('xUnk', { f: tt(f), t: tt('tip')[f] }) + bel; }
  let d;
  if (isSyl(mv.dom)) {
    const one = [c, base].some(q => sylEv([q], cl) === mv.ans);
    const mid = [c.s, c.p].find(x => sylHas(base, x));
    d = one ? tt('rSylOne') : mid ? tt('rSyl', { m: mv.dom === 'bias' ? nounOf(mv.nm, mid).pl : mid }) : tt(mv.ans === 'xy' ? 'rX' : 'rXo');
  } else { const r = mv.ans === 'xy' ? (mv.dom === 'disj' ? disjRule(c, base, cl) : condRule(c, base, cl)) : ''; d = r ? tt('r' + r) : tt(mv.ans === 'xy' ? 'rX' : 'rXo'); }
  return tt(mv.ans === 'xy' ? 'xYes' : 'xOpp', { d }) + bel;
}
// geradores por tipo: devolvem todas as jogadas possíveis (pista nova + pergunta) a partir da pista de há N jogadas
const DX = {
  ord: {
    first: (L) => { const a = shuffle(L); return [a[0], a[1]]; }, ck: (c) => c.join(''),
    opts(L, base, lure) {
      const out = [];
      for (const p of L) for (const q of L) { if (p === q) continue; const c = [p, q]; if (same(c, base) || contradicts(c, base)) continue;
        for (const k of [0, 1]) for (const W of L) { if (W === p || W === q) continue;
          const f = k === 0 ? [p, W] : [W, q], a = derive(c, base, f[0], f[1]).a;
          const la = lure && !contradicts(c, lure) ? derive(c, lure, f[0], f[1]).a : null;
          out.push({ c, f, ans: a, truth: a === 'xy', lureDiff: la != null && (la === 'xy') !== (a === 'xy'), wInBase: base.includes(W), mem: same(f, base), key: f.slice().sort().join('') }); } }
      return out;
    } },
  syl: {
    first: (L) => { const a = shuffle(L); return { t: pickOne(SYL_T), s: a[0], p: a[1] }; }, ck: (q) => q.t + q.s + q.p,
    // o que se vê sem memória: tipo da pista nova, tipo da pergunta e onde a letra da pista entra na pergunta
    cell: (c, cl) => c.t + cl.t + (cl.s === c.s ? 'ss' : cl.s === c.p ? 'ps' : cl.p === c.s ? 'sp' : 'pp'),
    opts(L, base, lure) {
      const all = []; for (const t of SYL_T) for (const s of L) for (const p of L) if (s !== p) all.push({ t, s, p });
      const bT = [base.s, base.p];
      const cur = sampleW(all, (c) => { if (c.t === base.t && c.s === base.s && c.p === base.p) return 0; const sh = bT.filter(x => sylHas(c, x)).length; return sh === 1 ? 1 : sh === 2 ? .12 : .3; }, 12);
      const out = [];
      for (const c of cur) { const outside = L.filter(W => !sylHas(c, W) && !bT.includes(W)), Ws = bT.filter(W => !sylHas(c, W)).concat(outside.length && Math.random() < .3 ? [pickOne(outside)] : []);
      for (const x of [c.s, c.p]) for (const W of Ws) {
        for (const t of SYL_T) for (const [s, p] of [[x, W], [W, x]]) {
          const cl = { t, s, p }, ans = sylEv([c, base], cl); if (ans == null) continue;
          const la = lure ? sylEv([c, lure], cl) : null, mb = sylEv([base], cl);
          out.push({ c, cl, ans, truth: ans === 'xy', lureDiff: la != null && (la === 'xy') !== (ans === 'xy'), wInBase: bT.includes(W), mem: mb != null && mb !== 'unk', key: 'S' + [s, p].sort().join(''), fk: ans === 'unk' ? sylFal(c, base, cl) : '' }); } } }
      return out;
    } },
  cond: {
    first: (L) => { const a = shuffle(L); return Math.random() < .8 ? { k: 'if', a: { a: a[0], n: Math.random() < .3 }, b: { a: a[1], n: Math.random() < .3 } } : { k: 'fact', l: { a: a[0], n: Math.random() < .5 } }; },
    ck: (q) => q.k === 'if' || q.k === 'iff' ? q.k + q.a.a + q.a.n + q.b.a + q.b.n : 'f' + q.l.a + q.l.n,
    cell: (c, cl) => { const lits = c.k === 'if' || c.k === 'iff' ? [['a', c.a], ['b', c.b]] : [['f', c.l]], cl2 = cl.k === 'if' ? [cl.a, cl.b] : [cl.l];
      return c.k + cl.k + cl2.map(l => { const h = lits.find(([, x]) => x.a === l.a); return h ? h[0] + (h[1].n === l.n ? '=' : '~') : 'o'; }).join(''); },
    opts(L, base, lure, rel) {
      const all = [];
      for (const x of L) for (const y of L) if (x !== y) for (const nx of [false, true]) for (const ny of [false, true]) all.push({ k: 'if', a: { a: x, n: nx }, b: { a: y, n: ny } });
      if (rel >= 3) for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) for (const ny of [false, true]) all.push({ k: 'iff', a: { a: L[i], n: false }, b: { a: L[j], n: ny } });
      if (base.k !== 'fact') for (const x of L) for (const n of [false, true]) all.push({ k: 'fact', l: { a: x, n } });
      const bA = condAtoms(base);
      const cur = sampleW(all, (c) => { const sh = condAtoms(c).filter(x => bA.includes(x)).length;
        if (c.k === 'fact') return sh ? 2.2 : .05;
        if (c.k === 'iff') return sh === 1 ? .35 : .03;
        if (base.k === 'fact') return sh ? 1 : .1;
        return (sh === 1 ? 1 : sh === 2 ? .1 : .25) * (c.a.n && c.b.n ? .5 : 1); }, 14);
      const out = [];
      for (const c of cur) {
        const U = [...new Set(condAtoms(c).concat(bA))], cls = [];
        for (const x of U) for (const n of [false, true]) cls.push({ k: 'fact', l: { a: x, n } });
        for (const x of U) for (const y of U) if (x !== y) for (const nx of [false, true]) for (const ny of [false, true]) cls.push({ k: 'if', a: { a: x, n: nx }, b: { a: y, n: ny } });
        for (const cl of cls) {
          if (condEv([c], cl) !== 'unk') continue;
          const ans = condEv([c, base], cl); if (ans == null) continue;
          const la = lure ? condEv([c, lure], cl) : null, mb = condEv([base], cl);
          const fresh = condAtoms(cl).some(x => bA.includes(x) && !condAtoms(c).includes(x));
          out.push({ c, cl, ans, truth: ans === 'xy', lureDiff: la != null && (la === 'xy') !== (ans === 'xy'), wInBase: fresh, mem: mb != null && mb !== 'unk', key: 'C' + condAtoms(cl).slice().sort().join('') + cl.k, fk: ans === 'unk' ? condFal(c, base, cl) : '', rule: ans === 'xy' ? condRule(c, base, cl) : '' });
        }
      }
      return out;
    } },
  disj: {
    first: (L) => { const a = shuffle(L); return Math.random() < .8 ? { k: 'or', a: { a: a[0], n: Math.random() < .25 }, b: { a: a[1], n: Math.random() < .25 } } : { k: 'fact', l: { a: a[0], n: Math.random() < .5 } }; },
    ck: (q) => q.k === 'or' ? 'o' + q.a.a + q.a.n + q.b.a + q.b.n : 'f' + q.l.a + q.l.n,
    cell: (c, cl) => { const lits = c.k === 'or' ? [['a', c.a], ['b', c.b]] : [['f', c.l]], cl2 = cl.k === 'or' ? [cl.a, cl.b] : [cl.l];
      return c.k + cl.k + cl2.map(l => { const h = lits.find(([, x]) => x.a === l.a); return h ? (h[0] === 'f' ? 'f' : 'd') + (h[1].n === l.n ? '=' : '~') : 'o'; }).join(''); },
    opts(L, base, lure) {
      const all = [];
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) for (const nx of [false, true]) for (const ny of [false, true]) all.push({ k: 'or', a: { a: L[i], n: nx }, b: { a: L[j], n: ny } });
      if (base.k === 'or') for (const x of L) for (const n of [false, true]) all.push({ k: 'fact', l: { a: x, n } });
      const bA = condAtoms(base);
      const cur = sampleW(all, (c) => { const sh = condAtoms(c).filter(x => bA.includes(x)).length;
        if (c.k === 'fact') return sh ? 2.4 : .05;
        if (base.k === 'fact') return sh ? 1 : .1;
        return (sh === 1 ? 1 : sh === 2 ? .1 : .25) * (c.a.n && c.b.n ? .5 : 1); }, 14);
      const out = [];
      for (const c of cur) {
        const U = [...new Set(condAtoms(c).concat(bA))], cls = [];
        for (const x of U) for (const n of [false, true]) cls.push({ k: 'fact', l: { a: x, n } });
        for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) for (const nx of [false, true]) for (const ny of [false, true]) cls.push({ k: 'or', a: { a: U[i], n: nx }, b: { a: U[j], n: ny } });
        for (const cl of cls) {
          if (condEv([c], cl) !== 'unk') continue;
          const ans = condEv([c, base], cl); if (ans == null) continue;
          const la = lure ? condEv([c, lure], cl) : null, mb = condEv([base], cl);
          const fresh = condAtoms(cl).some(x => bA.includes(x) && !condAtoms(c).includes(x));
          out.push({ c, cl, ans, truth: ans === 'xy', lureDiff: la != null && (la === 'xy') !== (ans === 'xy'), wInBase: fresh, mem: mb != null && mb !== 'unk', key: 'D' + condAtoms(cl).slice().sort().join('') + cl.k, fk: ans === 'unk' ? disjFal(c, base, cl) : '', rule: ans === 'xy' ? disjRule(c, base, cl) : '' });
        }
      }
      return out;
    } },
  bias: {
    first: (L) => DX.syl.first(L), ck: (q) => q.t + q.s + q.p, cell: (c, cl) => 'b' + DX.syl.cell(c, cl),
    opts: (L, base, lure) => DX.syl.opts(L, base, lure) } };
// tipo de pista de cada «fio»: em N-back, a jogada i junta-se à i−N, por isso cada fio (i mod N) guarda o seu tipo
function domStreams(n) {
  const P = S.plan || { dom: S.dom === 'mix' ? 'ord' : S.dom };
  if (!P.mixed) return Array(n).fill(P.dom);
  const sh = shuffle(DOMS); return Array.from({ length: n }, (_, k) => sh[k % 3]);
}
// cada modo tem o seu nível adaptativo; no Variado, cada bloco escolhe o tipo (mais vezes o menos treinado) e usa o nível desse tipo
const mixLvl = () => Math.min(...DOMS.map(d => S.lvls[d]));
function planBlock() {
  for (const d of DOMS) if (!LEVELS[S.lvls[d]]) S.lvls[d] = 1;
  if (S.dom !== 'mix') { S.plan = { dom: S.dom, mixed: false, fresh: true }; S.lvl = S.lvls[S.dom]; return; }
  const rec = S.hist.slice(-6).flatMap(h => h.doms || ['ord']), last = S.plan && !S.plan.mixed ? S.plan.dom : null;
  const w = DOMS.map(d => (d === last ? .35 : 1) / (1 + rec.filter(x => x === d).length));
  let r = Math.random() * w.reduce((a, b) => a + b, 0), k = 0; for (; k < DOMS.length - 1; k++) { r -= w[k]; if (r <= 0) break; }
  const mixed = (S.nFix || LEVELS[mixLvl()].n) >= 2 && Math.random() < .35;
  S.plan = { dom: DOMS[k], mixed, fresh: true };
  S.lvl = mixed ? mixLvl() : S.lvls[DOMS[k]];
}
function makeBlockX(lvl, L, streams) {
  const letters = shuffle(ALPHA).slice(0, Math.min(L.k, 6)).sort(), rel = Math.min(L.rel, 3);
  const nm = {}; if (streams.includes('bias')) { const ks = shuffle(Object.keys(NOUNS)); letters.forEach((l, k) => nm[l] = ks[k]); }
  const belCnt = { tt: 0, tf: 0, ft: 0, ff: 0 };
  const moves = [], cnt = { t: 0, f: 0 }, M = Math.max(MOVES, L.n + 16);
  const pickW = (opts, wf) => { const tot = opts.reduce((t, o) => t + wf(o), 0); let r = Math.random() * tot; for (const o of opts) { r -= wf(o); if (r <= 0) return o; } return opts[opts.length - 1]; };
  for (let i = 0; i < M; i++) {
    const d = streams[i % L.n], D = DX[d];
    if (i < L.n) { moves.push({ dom: d, nm: d === 'bias' ? nm : undefined, c: D.first(letters) }); continue; }
    const base = moves[i - L.n].c, li = L.n >= 2 ? i - 1 : (i >= 2 ? i - 2 : null);
    const lure = li != null && moves[li].dom === d ? moves[li].c : null;
    const opts = D.opts(letters, base, lure, rel);
    const run = runOf(moves), wantT = run.n >= 3 ? (Math.random() < .8 ? !run.v : run.v) : cnt.t - cnt.f < 0 ? Math.random() < .7 : cnt.t - cnt.f > 0 ? Math.random() < .3 : Math.random() < .5;
    const wantLure = lure && Math.random() < L.lure;
    const same0 = (o) => d !== 'ord' && JSON.stringify(o.cl) === JSON.stringify(base);
    let pool = opts.filter(o => o.truth === wantT && !same0(o) && (!wantLure || o.lureDiff));
    if (!pool.length) pool = opts.filter(o => o.truth === wantT && !same0(o));
    if (!pool.length) pool = opts;
    const rec = moves.slice(-4), rc = rec.filter(m => m.dom === d).map(m => D.ck(m.c)), rk = rec.map(m => m.key).filter(Boolean);
    // cada tipo de armadilha (ou de regra válida) com a mesma probabilidade, seja quantas forem as opções de cada um
    const grp = (o) => o.fk || (o.truth ? 'T' + (o.rule || '') : 'O'), gc = {}; for (const x of pool) gc[grp(x)] = (gc[grp(x)] || 0) + 1;
    // anti-atalho: cada padrão visível (sem a pista antiga) fica perto de metade Sim, metade Não ao longo dos blocos
    const CT = S.cell = S.cell || {}, bal = (o) => { const z = CT[d + D.cell(o.c, o.cl)] || [0, 0]; return Math.pow((z[o.truth ? 0 : 1] + 1) / (z[o.truth ? 1 : 0] + 1), 2); };
    if (d === 'bias') for (const x of pool) x.bel = sylBel(x.cl, nm);
    const belW = (o) => { if (d !== 'bias') return 1; const k = (o.truth ? 't' : 'f'), same = belCnt[k + (o.bel ? 't' : 'f')], other = belCnt[k + (o.bel ? 'f' : 't')]; return Math.pow((other + 1) / (same + 1), 2); };
    const o = pickW(pool, (o) => belW(o) * (rc.includes(D.ck(o.c)) ? .05 : 1) * (o.mem ? (d === 'ord' ? .1 : .08) : 1) * (rk.includes(o.key) ? .15 : 1)
      * (d === 'ord' ? (!o.truth && o.wInBase ? 6 : 1) : (o.fk && /NoLink/.test(o.fk) ? .4 : 1) / gc[grp(o)] * bal(o)));
    if (d !== 'ord') { const ck = d + D.cell(o.c, o.cl), z = CT[ck] = CT[ck] || [0, 0]; z[o.truth ? 1 : 0]++; if (z[0] + z[1] > 60) { z[0] = Math.round(z[0] / 2); z[1] = Math.round(z[1] / 2); } }
    cnt[o.truth ? 't' : 'f']++; if (d === 'bias') belCnt[(o.truth ? 't' : 'f') + (o.bel ? 't' : 'f')]++;
    moves.push({ dom: d, nm: d === 'bias' ? nm : undefined, bel: d === 'bias' ? o.bel : undefined, c: o.c, cl: o.cl, f: o.f, ans: o.ans, truth: o.truth, key: o.key, base: i - L.n, lureIdx: lure && o.lureDiff ? li : null, lureTruth: lure && o.lureDiff ? !o.truth : null });
  }
  // formas das frases
  const WF = FORMS_BY_REL[rel];
  moves.forEach((m, j) => {
    const pv = moves[j - 1];
    if (m.dom === 'ord') {
      const ok = WF.filter(x => !pv || x !== pv.w); m.w = ok[rnd(ok.length)];
      if (m.f) { const ok2 = WF.filter(x => x !== m.w); m.parts = [{ f: m.f, w: ok2[rnd(ok2.length)] }]; }
      return;
    }
    const fs = xFormsFor(m.dom, m.c, rel, false), fs2 = fs.filter(f => !pv || f.id !== pv.w);
    m.w = pickOne(fs2.length ? fs2 : fs).id;
    if (m.cl) { const cs = xFormsFor(m.dom, m.cl, rel, true), cs2 = cs.filter(f => f.id !== m.w); m.cw = pickOne(cs2.length ? cs2 : cs).id; }
  });
  if (S.stroop) for (const m of moves) if (m.parts || m.cl) m.col = Math.random() < .5 ? 'g' : 'r';
  return { lvl, n: L.n, k: letters.length, rel: L.rel, letters, doms: streams, stroop: !!S.stroop, moves, i: 0, ans: [], streak: 0, best: 0, ok: 0, resumes: 0, pace: S.pace, started: Date.now(), tf: 3 };
}

// formas por tipo de relação: 1 afirmativas (12) · 2 + negações · 3 + «não é verdade que» e dupla negação
const F_AFF = ['b', 'a', 'pr', 'fo', 'an', 'vs', 'ss', 'la', 'lp', 'pp', 'pf', 'pa'];
const F_NEG = ['nb', 'na', 'npr', 'nfo', 'nan', 'nvs', 'npp', 'npf', 'npa'];
const F_NOT = ['tb', 'ta', 'tp', 'tf', 'dn', 'dna'];
const FORMS_BY_REL = [null, F_AFF, F_AFF.concat(F_NEG), F_AFF.concat(F_NEG, F_NOT)];

// pergunta completa: «As duas pistas garantem que F vem antes de H?» (letras em destaque, sem caixas)
const claimHtml = (parts) => { const body = parts.map(pt => { const v = wordPQ(pt.f, pt.w); return esc(fill(pt.w, pt.f, '\u0001', '\u0002')).replace('\u0001', `<b class="lx">${v.p}</b>`).replace('\u0002', `<b class="lx">${v.q}</b>`); }).join(esc(tt('and')));
  // depois de «que», o pronome vem antes do verbo: «que M se segue a G»
  return `${esc(tt('askG'))} ${lang() === 'pt' ? body.split('segue-se a').join('se segue a') : body}?`; };

// ---------- classificação: pontos de honra por modo (Livre e Com tempo separados), tipo Elo ----------
const LIVES = 3;
const RANK_AT = [0, 900, 1000, 1100, 1200, 1300, 1450, 1600];
const rankIdx = (p) => { let k = 0; RANK_AT.forEach((t, i) => { if (p >= t) k = i; }); return k; };
const rankName = (p) => tt('ranks')[rankIdx(p)];
const ladderOf = (pace) => pace ? 'timed' : 'free';
// dificuldade de uma ronda: o nível, mais o N se estiver fixo acima/abaixo do nível
const diffOf = (lvl, n) => 800 + 100 * lvl + (n - LEVELS[lvl].n) * 120;
function rankBar(lad) {
  const p = S.rank[lad], k = rankIdx(p), nxt = RANK_AT[k + 1];
  const pct = nxt == null ? 100 : Math.round((p - RANK_AT[k]) / (nxt - RANK_AT[k]) * 100);
  return `<div class="cx-rank"><span class="cx-rlad">${tt('ladder')[lad]}</span><b>${esc(tt('ranks')[k])}</b><span class="cx-rpts">${Math.round(p)}</span>
    <div class="cx-rbar"><i style="width:${Math.max(3, Math.min(100, pct))}%"></i></div><small>${nxt == null ? tt('topRank') : esc(tt('toNext', { d: Math.ceil(nxt - p), r: tt('ranks')[k + 1] }))}</small></div>`;
}


// ---------- música de fundo: ficheiro em loop (art/music.mp3), com volume por WebAudio (funciona também no iPhone) ----------
const MUS = { el: null, gain: null, playing: false };
// faixas: a página pode limitar as disponíveis (os sites públicos só levam a faixa celta, livre de direitos)
const TRACKS = [{ id: 'os', name: 'Ornstein & Smough', url: 'art/music-os.mp3' }, { id: 'celtic', name: { pt: 'Celta', en: 'Celtic' }, url: 'art/music.mp3' }]
  .filter(t => !window.LG_MUSIC_TRACKS || window.LG_MUSIC_TRACKS.includes(t.id));
const trackOf = () => TRACKS.find(t => t.id === S.music.track) || TRACKS[0];
const trackName = (t) => typeof t.name === 'string' ? t.name : t.name[lang()];
function setTrack(id) {
  S.music.track = id; save();
  if (MUS.el) { const was = MUS.playing; MUS.el.src = trackOf().url; if (was) MUS.el.play().catch(() => { }); }
}
function musBuild() {
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  if (MUS.gain) return;
  const a = new Audio(trackOf().url); a.loop = true; a.preload = 'none';
  MUS.el = a; MUS.gain = AC.createGain(); MUS.gain.gain.value = 0;
  AC.createMediaElementSource(a).connect(MUS.gain); MUS.gain.connect(AC.destination);
}
function musicStart() {
  if (!S.music.on || document.hidden) return;
  const r = root(); if (!r || r.hidden) return;
  try {
    musBuild(); if (AC.state === 'suspended') AC.resume();
    if (!MUS.playing) { MUS.playing = true; MUS.el.play().catch(() => { MUS.playing = false; }); }
    MUS.gain.gain.setTargetAtTime(S.music.vol, AC.currentTime, .6);
  } catch { }
}
function musicStop(quick) {
  if (!MUS.gain || !MUS.playing) return;
  MUS.playing = false; MUS.gain.gain.setTargetAtTime(0, AC.currentTime, quick ? .08 : .3);
  setTimeout(() => { if (!MUS.playing && MUS.el) MUS.el.pause(); }, quick ? 400 : 1500);
}
// ao sair do modo (ex.: voltar ao menu da Logic Games Lab), a música cala-se
setInterval(() => { if (MUS.playing) { const r = root(); if (!r || r.hidden) musicStop(true); } }, 1000);
function musicToggle() { S.music.on = !S.music.on; save(); if (S.music.on) musicStart(); else musicStop(); const w = $('.cx-music'); if (w) { w.classList.toggle('on', S.music.on); const b = w.querySelector('.cx-mbtn'); if (b) b.title = S.music.on ? tt('musicOn') : tt('musicOff'); } }
// os browsers só deixam tocar som depois de um toque ou tecla: a música arranca à primeira interação no modo
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { const r = root(); if (r && !r.hidden && S.music.on && !MUS.playing) musicStart(); }, true));
document.addEventListener('visibilitychange', () => { if (document.hidden) musicStop(true); else { const r = root(); if (r && !r.hidden) musicStart(); } });
const musicWidget = () => `<div class="cx-music ${S.music.on ? 'on' : ''}"><button class="cx-mbtn" title="${esc(S.music.on ? tt('musicOn') : tt('musicOff'))}" aria-label="${esc(tt('music'))}"><span class="on">${ic('music', 18)}</span><span class="off">${ic('musicOff', 18)}</span></button>${TRACKS.length > 1 ? `<select class="cx-mtrack" aria-label="${esc(tt('music'))}">${TRACKS.map(t => `<option value="${t.id}" ${t.id === trackOf().id ? 'selected' : ''}>${esc(trackName(t))}</option>`).join('')}</select>` : ''}<input class="cx-mvol" type="range" min="0" max="100" value="${Math.round(S.music.vol * 100)}" aria-label="${esc(tt('musicVol'))}"></div>`;

// ---------- sons ----------
let AC = null;
function beep(ok) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t0 = AC.currentTime, g = AC.createGain(); g.connect(AC.destination);
    const notes = ok ? [[880, 0, .09], [1320, .08, .16]] : [[180, 0, .22]];
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(ok ? .18 : .22, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + (ok ? .26 : .3));
    for (const [f, st, dur] of notes) { const o = AC.createOscillator(); o.type = ok ? 'sine' : 'square'; o.frequency.setValueAtTime(f, t0 + st); o.connect(g); o.start(t0 + st); o.stop(t0 + st + dur); }
  } catch { }
}

// ---------- ecrã ----------
let R = null, VIEW = 'intro', LOCK = false, TIMER = null, TICK = null, STAMP = null, SESS = null, NEXTT = null, PEND = true;
const fmtClock = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const root = () => $('#chain');
function open() { window.LGApp.show('chain'); if (S.run && S.run.tf !== 3) { S.run = null; save(); } if (!LEVELS[S.lvl]) S.lvl = 1; R = S.run || null; SESS = R && S.sess ? S.sess : null; if (!R) S.sess = null; if (SESS) SESS.last = 0; VIEW = 'intro'; render(); }
// uma forma de dizer o facto [P, Q] (P antes de Q): b «P antes de Q» · a «Q depois de P» · nb «Q não vem antes de P» · na «P não vem depois de Q»
const QP = new Set(['a', 'fo', 'vs', 'ss', 'lp', 'pp', 'pa', 'nb', 'npr', 'nan', 'npf', 'ta', 'tp', 'dna']);   // formas em que a primeira letra dita é a que vem depois
const wordPQ = (f, w) => QP.has(w) ? { p: f[1], q: f[0] } : { p: f[0], q: f[1] };
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const fill = (w, f, P = '{p}', Q = '{q}') => { const v = wordPQ(f, w); return tt('F')[w].replace('{p}', P === '{p}' ? v.p : P).replace('{q}', Q === '{q}' ? v.q : Q); };
const clueTxt = (m) => (isX(m) ? cap(xText(m.dom, m.c, m.w, m.nm)) : cap(fill(m.w || 'b', m.c))) + '.';
const partPlain = (pt) => fill(pt.w, pt.f);
const partHtml = (pt) => { const v = wordPQ(pt.f, pt.w); return esc(fill(pt.w, pt.f, '\u0001', '\u0002')).replace('\u0001', `<span class="lt">${v.p}</span>`).replace('\u0002', `<span class="lt">${v.q}</span>`); };
const claimPlain = (parts) => cap(parts.map(partPlain).join(tt('and')));
const tfTxt = (a) => a == null ? tt('noAns') : a ? tt('aT') : tt('aF');
// afirmação com as letras em peças: «[A] antes de [C]?» ou «[A] antes de [C] e [B] depois de [D]?»
const claimHtmlOld = (parts) => parts.map((pt, k) => { const h = partHtml(pt); let t = k === 0 && !h.startsWith('<') ? h.charAt(0).toUpperCase() + h.slice(1) : h; if (k === parts.length - 1) t = t.replace(/(<span class="lt">[^<]*<\/span>)$/, '<span class="nw">$1?</span>'); return `<span class="pt">${t}</span>`; }).join(`<span class="and">${esc(tt('and'))}</span>`);
const lvlDesc = (l, dom) => { const L = LEVELS[l] || LEVELS[1], x = ['syl', 'cond', 'disj', 'bias'].includes(dom);
  return tt('lvlDesc', { n: L.n, k: x ? Math.min(L.k, 6) : L.k, r: x ? tt('relD')[dom][Math.min(L.rel, 3) - 1] : tt('rel')[L.rel - 1] }); };
const oneDom = (ds) => ds && new Set(ds).size === 1 ? ds[0] : 'ord';
function render() {
  clearTimeout(TIMER);
  const r = root(); if (!r) return;
  document.body.classList.toggle('chain-dim', VIEW === 'play' || VIEW === 'pause');
  clearInterval(NEXTT);
  r.innerHTML = `<div class="cx-bg" aria-hidden="true"><div class="cx-bgimg"><i class="fl" style="left:26.9%;top:88.2%"></i><i class="fl f2" style="left:76.4%;top:85.8%"></i></div></div><div class="bar">${VIEW === 'intro' && window.LGApp && window.LGApp.standalone ? '' : `<button class="btn small ghost" id="chBack">${ic('back', 16)} ${VIEW === 'intro' ? tt('back') : esc(hm('home'))}</button>`}<span class="title">${tt('title')}</span><span class="spacer"></span>
    
    ${VIEW === 'play' ? `<button class="btn small ghost" id="chPause">${ic('pause', 14)} ${tt('pause')}</button>` : ''}</div><div class="ch-wrap" id="chMain"></div>${musicWidget()}`;
  ({ intro, play, pause, summary, lore, sessend, death, tut, duels, duelend, cards }[VIEW])($('#chMain'));
  const mw = r.querySelector('.cx-music');
  if (mw) { mw.querySelector('.cx-mbtn').onclick = (e) => { e.stopPropagation(); musicToggle(); };
    const vol = mw.querySelector('.cx-mvol'); vol.oninput = () => { S.music.vol = vol.value / 100; if (S.music.vol > 0 && !S.music.on) musicToggle(); if (MUS.gain && MUS.playing) MUS.gain.gain.setTargetAtTime(S.music.vol, AC.currentTime, .05); };
    vol.onchange = () => save();
    const tr = mw.querySelector('.cx-mtrack'); if (tr) tr.onchange = () => { setTrack(tr.value); if (!S.music.on) musicToggle(); }; }
  if ($('#chBack')) $('#chBack').onclick = () => { if (VIEW === 'intro') { window.LGApp.goMenu(); return; } if (VIEW === 'play') { pauseRun(); return; } VIEW = 'intro'; render(); };
  const pb = $('#chPause'); if (pb) pb.onclick = pauseRun;
}
// ================= duelos: adversários simulados (lógicos históricos) =================
// Cada adversário joga exatamente o mesmo bloco que tu. É simulado — tem precisão, ritmo e fraquezas fixas — e isso é dito no ecrã.
// A honra de duelo é Elo puro contra a classificação de cada um.
const DUX = {
  pt: {
    btn: 'Duelos no Arquivo', btnSub: '8 lógicos históricos · honra de duelo: {p} · {r}', title: 'Duelos no Arquivo',
    lead: 'Desafia um dos guardiões. Ele joga o mesmo bloco que tu — as mesmas pistas, as mesmas perguntas. Ganha quem acertar mais; em empate, quem for mais rápido. Se as tuas três velas se apagarem, perdes o duelo.',
    honest: 'Os adversários são simulados: cada um tem uma precisão, um ritmo e fraquezas fixas (incluindo as falácias em que costuma cair). A honra de duelo sobe ou desce contra a classificação de cada um, como no xadrez.',
    challenge: 'Desafiar', rematch: 'Revanche', other: 'Outro adversário', report: 'Ver relatório', record: '{w}V · {l}D', beaten: 'Vencido', setting: '{m} · {n}-back · nível {l}',
    you: 'Tu', win: 'Vitória', loss: 'Derrota', vs: 'contra', scoreL: 'certas', timeL: 'Tempo a responder: tu {a} · {b} {c}', tieTime: 'Empate nas certas — decide o tempo.',
    died: 'As tuas três velas apagaram-se antes do fim.', pts: '{d} honra de duelo', botErr: 'Onde {b} tropeçou', botClean: '{b} não errou nenhuma.', botNote: 'jogada {j}',
    live: '{b} {x} · tu {y}', ladder: 'Duelos',
    bots: {
      prot: ['Protágoras', 'o Sofista', 'Jura depressa e com confiança — e cai em quase todas as armadilhas.'],
      zeno: ['Zenão de Eleia', 'o dos Paradoxos', 'Domina a ordem das coisas; perde o fio nas condições.'],
      socr: ['Sócrates', 'o que Pergunta', 'Lento e cuidadoso. Raramente jura algo que não esteja garantido.'],
      chry: ['Crisipo', 'o Estoico', 'Mestre das condicionais. Tropeça nas classes.'],
      arst: ['Aristóteles', 'o do Silogismo', 'Pai do silogismo. Em 3-back, a pista certa às vezes escapa-lhe.'],
      carr: ['Lewis Carroll', 'o dos Enigmas', 'Adora silogismos com armadilhas de linguagem — e quase não cai nelas.'],
      bool: ['George Boole', 'o Algebrista', 'Quase sem falácias. O ponto fraco é o relógio.'],
      freg: ['Gottlob Frege', 'o Último Guardião', '4-back com tudo misturado. Precisão de máquina.'] }
  },
  en: {
    btn: 'Duels in the Archive', btnSub: '8 historical logicians · duel honour: {p} · {r}', title: 'Duels in the Archive',
    lead: 'Challenge one of the guardians. They play the same block as you — the same clues, the same questions. Most correct answers wins; on a tie, the faster one. If your three candles go out, you lose the duel.',
    honest: 'The opponents are simulated: each has a fixed accuracy, pace and set of weaknesses (including the fallacies they tend to fall for). Your duel honour goes up or down against each one\'s rating, as in chess.',
    challenge: 'Challenge', rematch: 'Rematch', other: 'Another opponent', report: 'See the report', record: '{w}W · {l}L', beaten: 'Defeated', setting: '{m} · {n}-back · level {l}',
    you: 'You', win: 'Victory', loss: 'Defeat', vs: 'vs', scoreL: 'correct', timeL: 'Answering time: you {a} · {b} {c}', tieTime: 'Tied on correct answers — time decides.',
    died: 'Your three candles went out before the end.', pts: '{d} duel honour', botErr: 'Where {b} stumbled', botClean: '{b} made no mistakes.', botNote: 'move {j}',
    live: '{b} {x} · you {y}', ladder: 'Duels',
    bots: {
      prot: ['Protagoras', 'the Sophist', 'Swears fast and confidently — and falls for nearly every trap.'],
      zeno: ['Zeno of Elea', 'of the Paradoxes', 'Masters the order of things; loses the thread in conditions.'],
      socr: ['Socrates', 'the Questioner', 'Slow and careful. Rarely swears to anything that isn\'t guaranteed.'],
      chry: ['Chrysippus', 'the Stoic', 'Master of conditionals. Stumbles on classes.'],
      arst: ['Aristotle', 'of the Syllogism', 'Father of the syllogism. At 3-back, the right clue sometimes slips away.'],
      carr: ['Lewis Carroll', 'of the Puzzles', 'Loves syllogisms with language traps — and hardly ever falls for them.'],
      bool: ['George Boole', 'the Algebraist', 'Almost no fallacies. His weak spot is the clock.'],
      freg: ['Gottlob Frege', 'the Last Guardian', '4-back with everything mixed. Machine-like precision.'] }
  }
};
const du = (k, v) => { let x = DUX[lang()][k]; if (typeof x === 'string' && v) for (const [a, b] of Object.entries(v)) x = x.split('{' + a + '}').join(b); return x; };
// acc: precisão base · spec: ajuste por tipo · trap: ajuste nas perguntas-armadilha («não dá para saber») · lure: perda quando há pista-isco · secs: ritmo
const BOTS = [
  { id: 'prot', r: 850, lvl: 1, mode: 'mix', acc: .78, spec: {}, trap: -.2, lure: .05, secs: 2.6, tier: 'bronze',
    look: { hair: 'curly', beard: 'short', drape: 'toga' } },
  { id: 'zeno', r: 950, lvl: 3, mode: 'ord', acc: .82, spec: { cond: -.12 }, trap: -.04, lure: .06, secs: 4.2, tier: 'bronze',
    look: { hair: 'long', beard: 'medium', band: 1, drape: 'toga' } },
  { id: 'socr', r: 1050, lvl: 4, mode: 'mix', acc: .82, spec: {}, trap: .08, lure: .04, secs: 9, tier: 'bronze',
    look: { hair: 'bald', beard: 'round', nose: 'snub', drape: 'toga' } },
  { id: 'chry', r: 1150, lvl: 6, mode: 'cond', acc: .87, spec: { cond: .05, syl: -.1 }, trap: 0, lure: .05, secs: 6, tier: 'silver',
    look: { hair: 'short', beard: 'long', drape: 'toga' } },
  { id: 'arst', r: 1250, lvl: 8, mode: 'syl', acc: .88, spec: { syl: .04 }, trap: .02, lure: .09, secs: 6, tier: 'silver',
    look: { hair: 'short', beard: 'trim', laurel: 1, drape: 'toga' } },
  { id: 'carr', r: 1350, lvl: 9, mode: 'syl', acc: .9, spec: { syl: .03 }, trap: .04, lure: .06, secs: 5, tier: 'silver',
    look: { hair: 'wavy', beard: 'none', hat: 1, drape: 'coat' } },
  { id: 'bool', r: 1450, lvl: 10, mode: 'mix', acc: .92, spec: {}, trap: .03, lure: .04, secs: 10.5, tier: 'gold',
    look: { hair: 'recede', beard: 'chops', drape: 'coat' } },
  { id: 'freg', r: 1600, lvl: 12, mode: 'mix', acc: .94, spec: {}, trap: .02, lure: .03, secs: 7, tier: 'gold',
    look: { hair: 'bald', beard: 'full', drape: 'coat' } }];
const botOf = (id) => BOTS.find(b => b.id === id);
const botName = (b) => du('bots')[b.id][0];

// ---------- retratos: bustos gravados como numa moeda (bronze, prata, ouro) ----------
const METAL = { bronze: ['#e9b985', '#a96f3e', '#55341a'], silver: ['#f3f5f8', '#aab0ba', '#585d67'], gold: ['#f8e1a0', '#c9a14c', '#74531c'] };
let AVN = 0;
const AV_HAIR = {
  short: ['M67 31C66.5 21.5 59 15.5 50 15.6C37 15.8 27.5 25.5 26.6 39C25.8 51 29.5 63 36.6 71.2L41.2 69C37.8 62.5 36.8 55 39.6 48.6C41.6 44 45.8 41.4 50.4 40.6C55.4 36.4 60.8 33.2 67 31Z', ['M62 24C55 22 46 23 39 29', 'M64 28C57 27 48 29 42 35', 'M33 36C31 46 32 56 36 64', 'M55 19C47 18 38 22 33 30']],
  long: ['M67 31C66.5 21.5 59 15.5 50 15.6C37 15.8 27.5 25.5 26.6 39C25.6 54 27.5 72 31.5 86L43.5 86C38.5 74 37 60 39.6 48.6C41.6 44 45.8 41.4 50.4 40.6C55.4 36.4 60.8 33.2 67 31Z', ['M62 24C55 22 46 23 39 29', 'M33 38C30.5 54 32 70 35.5 82', 'M38 44C36 56 36.5 68 39.5 80', 'M55 19C47 18 38 22 33 30']],
  bald: ['M41 45.5C34.5 46.5 30.5 51.5 30.8 59C31 64.5 33.5 68.5 37 71.5L41.4 68.8C38.6 64 38.4 56.4 42 50.6Z', ['M34 52C33.5 58 35 63 37.5 67']],
  recede: ['M51 19C40 20 30.5 28 28.6 40C27.4 51 30.4 62 36.8 71.2L41.4 68.8C38 62.5 37.2 55 40 48.6C41 46 42.4 44 44.4 42.6C43 34 45.6 25.6 51 19Z', ['M45 24C38 28 33 35 32 45', 'M33 50C32.5 58 34.5 64 37.5 68', 'M40 30C36.5 35 35 41 35 47']],
  wavy: ['M60 22C50 18.5 36 21 30 33C26.5 42 27 54 30.5 64C31.8 67.5 33.5 70 35.5 72.2L40.8 69C37.8 62.6 37.2 55 40.2 48.4C42.2 44.2 46.2 41.6 50.6 40.6C52 34 55 27 60 22Z', ['M34 34C31 42 31 52 33.5 60', 'M38.5 30C35.5 38 35.2 46 36.5 52', 'M44 26C41 31 40 37 40.5 42']] };
const AV_BEARD = {
  short: ['M47.2 55.5C48.6 64.5 55 72.5 63.2 73.6C67.4 74 69.4 70.8 68.6 66.4C68.2 64.2 67 62.6 65.6 61.8C61.4 63.4 56.4 62.8 52.8 59.4C50.6 57.6 48.8 56.2 47.2 55.5Z', ['M52 63C54 66 57 69 61 70.5', 'M50.5 59.5C52 63 54 66.5 57 69']],
  medium: ['M46.8 55C47.6 66 53 78.5 61 83C66.5 85.5 70.4 81 69.4 74C68.9 70 68.2 67 67.4 65C66.6 63 65.8 62.2 65 61.9C60.8 63.4 56 62.8 52.6 59.4C50.4 57.4 48.6 55.8 46.8 55Z', ['M51 61C53 69 57 76 62 80', 'M55 63C57 70 60 76 64.5 79.5', 'M60.5 64.5C62.5 70 64.5 74.5 67 77']],
  round: ['M45.8 53.5C44.6 66 50 80.5 59.5 86C66.5 89.5 72.5 84 71.6 75.5C71 70.5 69.5 66.5 67.6 63.6C66.6 62.4 65.8 62 65 61.9C60.8 63.4 56 62.8 52.6 59.4C50 57 47.8 54.6 45.8 53.5Z', ['M49.5 60C51 70 55 79 61 84', 'M54.5 63C56.5 71 60 78 65 82.5', 'M60.5 64.5C63 71 66 76 69 79', 'M47.5 57C47.5 63 49 69 51.5 74']],
  long: ['M47 55C48 67 52.5 80 58 92C59.5 95.5 61.5 97.5 63 97C66.5 94 69.5 86 69.6 76C69.7 71 68.6 67 67.4 64.8C66.6 63 65.8 62.2 65 61.9C60.8 63.4 56 62.8 52.6 59.4C50.4 57.4 48.6 55.8 47 55Z', ['M51.5 62C53.5 73 56.5 83 60.5 92', 'M56 64C58.5 74 61 83 63.5 91', 'M61 65C63.5 73 65.5 80 66.5 87']],
  trim: ['M48 57C49.6 64 54.8 70 61.8 71.6C66.6 72.4 68.8 69.8 68.2 66C67.8 64 66.8 62.6 65.6 61.9C61.4 63.3 56.4 62.8 52.8 59.6C51 58.2 49.4 57.4 48 57Z', ['M52.5 62C54.5 65 57.5 67.5 61 69']],
  full: ['M45.8 53.5C44.6 68 48.5 84 56 96C58.5 99.5 61.5 100.5 64 99C69.5 94 72.5 84 72 74.5C71.6 69.5 69.8 65.8 67.6 63.6C66.6 62.4 65.8 62 65 61.9C60.8 63.4 56 62.8 52.6 59.4C50 57 47.8 54.6 45.8 53.5Z', ['M49.5 60C51 73 54.5 85 59.5 95', 'M54.5 63C56.5 74 60 85 63.5 94', 'M60.5 64.5C63 73 66 81 68.5 88', 'M47.5 57C47.5 65 49 73 52 80']],
  chops: ['M44.2 46.5C42.6 55 44.4 63 49.4 69C51.4 71.2 53.6 71.8 55 70.6C52.4 65.2 50.8 58.6 50.4 51.6C48.4 49.8 46.4 48 44.2 46.5Z', ['M46.5 53C47 59 49 64.5 52 68.5', 'M48.8 52C49.2 58 50.6 63 53 67']] };
// busto gravado de perfil, como numa moeda antiga
function avatar(look, tier, size, label) {
  const L = look || {}, Mt = METAL[tier] || METAL.bronze, k = 'av' + (++AVN), ink = '#24170b', F = `url(#${k}m)`;
  const ln = (d, w = 1.2, o = .7, tr = '') => `<path d="${d}"${tr} fill="none" stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
  const sh = (d) => `<path d="${d}" fill="${F}" stroke="${ink}" stroke-width=".8" stroke-opacity=".6"/>`;
  const nose = L.nose === 'snub' ? 'L70.2 51.2C70.6 52.6 70 53.8 68.6 54.2' : 'L72.6 52.6C72.4 53.9 71.2 54.6 69.6 54.8';
  const head = `M37 72C29.5 66 25.5 53 27.5 40C29.5 27 39 17.5 52 17C61 16.8 66.5 22.5 67.3 31C67.6 35 66.8 38.5 67.6 42.2${nose}C68.6 55.2 68.3 56 68.6 56.8C69 57.6 68.8 58.2 68 58.6L67.2 58.9C67.9 59.6 67.8 60.9 66.8 61.6C66.2 62.4 66.4 63.6 67 64.8C67.6 67.6 66 70.3 62.4 71C58.6 71.6 55.6 71.8 53.6 73.4L54.8 82L37.2 82Z`;
  const body = 'M37.2 80.5L54.8 80.5C66 84 78 89 85 101L15 101C21 90 29 84 37.2 80.5Z';
  const must = 'M64.6 56.2C66.6 55.4 68.8 55.6 69.8 56.8C70.4 57.8 70 58.6 69 58.9C67.6 58.4 66 58.3 64.8 58.8C63.6 58.6 63.6 57 64.6 56.2Z';
  let back = '', front = '';
  if (L.hair === 'curly') { back += sh(AV_HAIR.short[0]); for (const [x, y] of [[63.5, 27], [58.5, 21.5], [52, 18.5], [45, 18.5], [38.5, 22], [33.5, 28], [30, 35.5], [28.6, 43.5], [29.6, 51.5], [32, 59], [35, 66]]) back += `<circle cx="${x}" cy="${y}" r="4.3" fill="${F}" stroke="${ink}" stroke-width=".8" stroke-opacity=".6"/>` + ln(`M${x - 1.8} ${y + .8}q1.8 -2.6 3.6 0`, .9, .55); }
  else if (AV_HAIR[L.hair]) { const [d, st] = AV_HAIR[L.hair]; back += sh(d) + st.map(x => ln(x, .9, .5)).join(''); }
  front += ln('M57.6 43.6C59.4 42.6 61.6 42.4 63.4 43.4', 1.1, .75) + ln('M58.2 44.6C60 45.6 61.8 45.6 63.2 44.6', .9, .55) + `<circle cx="61.2" cy="44.4" r=".9" fill="${ink}" opacity=".85"/>`
    + ln('M56.2 40.4C59.6 38.6 63.4 38.6 66.6 40.6', 1.5, .6) + ln('M48.6 44.2C44.2 44.4 43 49.4 44.4 53.4C45.4 56.2 48 56.6 49.2 55', 1.2, .75) + ln('M46.6 47.6C45.8 49.4 46.2 51.4 47.6 52.4', .9, .55)
    + ln(L.nose === 'snub' ? 'M66.4 51.8C67.2 52.8 68.2 53 69 52.6' : 'M68 53.4C69 54.2 70.2 54.3 71.2 53.8', .9, .6) + ln('M62 40.6C63.6 46 66.8 50 68.6 51.8', .6, .25);
  if (!L.beard || L.beard === 'none' || L.beard === 'chops') front += ln('M64.8 58.7L67.6 58.8', 1, .7) + ln('M59.6 66.6C61.6 67.8 63.8 67.8 65.4 66.8', .9, .35) + ln('M53.4 59.4C55 62 57.4 64 60.2 64.8', .7, .25);
  if (AV_BEARD[L.beard]) { const [d, st] = AV_BEARD[L.beard]; front += sh(d) + st.map(x => ln(x, .9, .5)).join(''); if (L.beard !== 'chops') front += sh(must) + ln('M65.4 57.4C66.6 57 68 57.2 69 57.9', .7, .5); }
  if (L.band) front += ln('M31 33.5C40 27.5 52 25 66.4 29.8', 2.4, .7);
  if (L.laurel) for (const [x, y, r] of [[30, 41, -75], [31.5, 34, -55], [36, 27.5, -35], [42.5, 22.5, -18], [50, 20, 0], [57.5, 20.5, 18], [63.5, 24.5, 40]])
    front += `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="1.9" transform="rotate(${r} ${x} ${y})" fill="${F}" stroke="${ink}" stroke-width=".8" stroke-opacity=".7"/>` + ln(`M${x - 3} ${y}L${x + 3} ${y}`, .6, .45, ` transform="rotate(${r} ${x} ${y})"`);
  if (L.hat) front += sh('M35.5 2L61.5 2L62.8 26.5L34.2 26.5Z') + ln('M34.8 20.5L62.4 20.5', 2.4, .7) + sh('M24.5 26.8C38 22.6 60 22.4 72.5 26.2L71.2 30.4C58.6 27.4 38.6 27.6 25.8 31.4Z') + ln('M37.6 4L36.8 19', .8, .35);
  const drape = L.drape === 'coat' ? sh('M47.5 80.6L55 86.5L61 81.4L58.6 80.4L55 83.4L50.2 80.2Z') + ln('M55 86.5L62.5 101', 1.4) + ln('M55 86.5L47.5 101', 1.4) + ln('M30 92C34 95 37 98 38 101', .9, .4)
    : ln('M24.5 91C40 85 59 89 73 100', 1.4, .75) + ln('M30.5 96C42 91.5 55 94 63 101', .9, .45) + ln('M41 82C47 89 51 95 52.5 101', 1, .5);
  return `<svg class="cx-av" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(label || '')}"><defs><linearGradient id="${k}m" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${Mt[0]}"/><stop offset=".55" stop-color="${Mt[1]}"/><stop offset="1" stop-color="${Mt[2]}"/></linearGradient>
    <radialGradient id="${k}b" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#2b231a"/><stop offset="1" stop-color="#0a0806"/></radialGradient><clipPath id="${k}c"><circle cx="50" cy="50" r="42.4"/></clipPath></defs>
    <circle cx="50" cy="50" r="47" fill="url(#${k}b)" stroke="${F}" stroke-width="3.4"/><circle cx="50" cy="50" r="43.2" fill="none" stroke="${Mt[1]}" stroke-width=".7" opacity=".6"/>
    <g clip-path="url(#${k}c)">${back}${sh(body)}${drape}${sh(head)}${front}</g></svg>`;
}
// o jogador: um vulto encapuzado com uma vela
function youAvatar(size) {
  const k = 'av' + (++AVN), [m1, m2, m3] = METAL.bronze;
  return `<svg class="cx-av" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(du('you'))}">
    <defs><linearGradient id="${k}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m1}"/><stop offset=".55" stop-color="${m2}"/><stop offset="1" stop-color="${m3}"/></linearGradient>
    <radialGradient id="${k}b" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#2a2219"/><stop offset="1" stop-color="#0b0907"/></radialGradient>
    <radialGradient id="${k}f" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffb84d" stop-opacity="0"/></radialGradient>
    <clipPath id="${k}c"><circle cx="50" cy="50" r="42.5"/></clipPath></defs>
    <circle cx="50" cy="50" r="47" fill="url(#${k}b)" stroke="url(#${k}m)" stroke-width="3.2"/>
    <g clip-path="url(#${k}c)">
      <path d="M50 17C33 17 25 34 25 51C25 66 21 82 15 99L85 99C79 82 75 66 75 51C75 34 67 17 50 17Z" fill="url(#${k}m)" stroke="#2b1d0f" stroke-opacity=".55" stroke-width=".9"/>
      <path d="M50 29C40 29 35.5 40 35.5 51C35.5 61 42 69 50 69C58 69 64.5 61 64.5 51C64.5 40 60 29 50 29Z" fill="#0d0a07"/>
      <path d="M50 17C44 25 41 36 41 50M50 17C56 25 59 36 59 50" fill="none" stroke="#2b1d0f" stroke-opacity=".45" stroke-width="1.1"/>
      <circle cx="44.5" cy="51" r="1.5" fill="#f3cf7a"/><circle cx="55.5" cy="51" r="1.5" fill="#f3cf7a"/>
      <rect x="47.5" y="79" width="5" height="13" rx="1" fill="#e9dcc0"/><path d="M50 71c-2.5 3-2.5 6 0 8c2.5-2 2.5-5 0-8Z" fill="#ffcf6b"/><circle cx="50" cy="75" r="9" fill="url(#${k}f)"/>
    </g></svg>`;
}
const botAv = (b, size) => avatar(b.look, b.tier, size, botName(b));

// ---------- o adversário joga o bloco ----------
function botPlay(b, blk) {
  const ans = [], t = [];
  blk.moves.forEach((m, j) => {
    if (!(m.cl || m.parts)) return;
    let p = b.acc + (m.dom === 'bias' && m.bel !== m.truth ? -.1 : 0) + (b.spec[m.dom || 'ord'] || 0) - (m.lureIdx != null ? b.lure : 0) - (m.parts && m.parts.length > 1 ? .04 : 0) + (m.ans === 'unk' ? b.trap : -b.trap / 3);
    p = Math.max(.5, Math.min(.985, p));
    ans[j] = Math.random() < p ? m.truth : !m.truth;
    t[j] = Math.round(b.secs * (.6 + Math.random() * .8) * 10) / 10;
  });
  return { id: b.id, ans, t };
}
function startDuel(id) {
  const b = botOf(id); if (!b) return;
  clearInterval(NEXTT); SESS = null; S.sess = null;
  const n = LEVELS[b.lvl].n, keep = S.plan;
  S.plan = b.mode === 'mix' ? { dom: pickOne(DOMS), mixed: n >= 2 } : { dom: b.mode, mixed: false };
  R = makeBlock(b.lvl, 0); S.plan = keep && Object.assign(keep, { fresh: false });
  R.pace = 0; R.auto = false; R.autoT = R.autoT0 = S.autoT; R.duel = botPlay(b, R);
  S.run = R; save(); VIEW = 'play'; render();
}
const duelLive = () => { const D = R.duel; let x = 0; for (let j = R.n; j < R.i; j++) if (D.ans[j] === R.moves[j].truth) x++; return x; };
function finishDuelBlock(died) {
  const evalIdx = R.moves.map((_, j) => j).filter(j => j >= R.n && j < Math.max(R.i, R.n) && R.ans[j] !== undefined);
  const n = evalIdx.length, ok = evalIdx.filter(j => R.ans[j] === R.moves[j].truth).length;
  const errs = {}; for (const j of evalIdx) if (R.ans[j] !== R.moves[j].truth) { const e = errType(R.moves[j], R.ans[j]); errs[e] = (errs[e] || 0) + 1; }
  for (const [e, v] of Object.entries(errs)) if (e[0] === 'f') S.fal[e] = (S.fal[e] || 0) + v;
  const rate = R.tAct ? Math.round((ok - (n - ok)) / (R.tAct / 60000) * 10) / 10 : null;
  R.done = true; R.result = { n, ok, l0: R.lvl, l1: R.lvl, errs, full: R.i >= R.moves.length, evalIdx, rate, died: !!died, rk: null, diedAt: R.i };
  S.hist.push({ when: Date.now(), doms: R.doms || ['ord'], lvl: R.lvl, n, ok, best: R.best, errs, full: R.result.full, rate, died: !!died, duel: R.duel.id });
  S.hist = S.hist.slice(-100); S.run = null;
  finishDuel(died, R.result);
}
function finishDuel(died, base) {
  const D = R.duel, b = botOf(D.id), q = R.moves.map((_, j) => j).filter(j => j >= R.n);
  const botOk = q.filter(j => D.ans[j] === R.moves[j].truth).length, botT = q.reduce((a, j) => a + (D.t[j] || 0), 0), youT = (R.tAct || 0) / 1000;
  const full = R.i >= R.moves.length;
  const win = !died && full && (base.ok > botOk || (base.ok === botOk && youT <= botT));
  const before = S.rank.duel, E = 1 / (1 + Math.pow(10, (b.r - before) / 400)), delta = Math.round(32 * ((win ? 1 : 0) - E)) || (win ? 1 : -1);
  S.rank.duel = before + delta;
  const rec = S.duels[b.id] = S.duels[b.id] || { w: 0, l: 0 }; rec[win ? 'w' : 'l']++;
  const tie = !died && full && base.ok === botOk;
  R.result.duel = { win, tie, botOk, botT, youT, before, after: before + delta, delta, n: q.length, up: rankIdx(before + delta) > rankIdx(before), down: rankIdx(before + delta) < rankIdx(before) };
  save(); VIEW = 'duelend'; render();
}
const fmtSec = (x) => x >= 60 ? Math.floor(x / 60) + ':' + String(Math.round(x % 60)).padStart(2, '0') : fmtS(x) + ' s';
const modeName = (b) => b.mode === 'mix' ? tt('domL').mix : tt('domL')[b.mode];
function duels(m) {
  const pts = Math.round(S.rank.duel);
  m.innerHTML = `<div class="cx-duels"><h2 class="cx-dtitle">${esc(du('title'))}</h2><p class="cx-dlead">${esc(du('lead'))}</p>
    ${rankBar('duel')}
    <div class="cx-roster">${BOTS.map(b => { const d = du('bots')[b.id], rec = S.duels[b.id], L = LEVELS[b.lvl];
      return `<article class="cx-foe ${b.tier} ${rec && rec.w ? 'beaten' : ''}">
        <div class="cx-foeav">${botAv(b, 92)}${rec && rec.w ? `<span class="cx-laurel" title="${esc(du('beaten'))}">${ic('star', 10)} ${esc(du('beaten'))}</span>` : ''}</div>
        <h3>${esc(d[0])}</h3><p class="cx-epi">${esc(d[1])}</p><b class="cx-elo">${b.r}</b>
        <p class="cx-style">${esc(d[2])}</p>
        <p class="cx-set">${esc(du('setting', { m: modeName(b), n: L.n, l: b.lvl }))}</p>
        ${rec ? `<p class="cx-rec">${esc(du('record', { w: rec.w, l: rec.l }))}</p>` : ''}
        <button class="cx-chal" data-duel="${b.id}">${ic('swords', 16)} ${esc(du('challenge'))}</button></article>`; }).join('')}</div>
    <p class="cx-honest">${esc(du('honest'))}</p></div>`;
  m.querySelectorAll('[data-duel]').forEach(x => x.onclick = () => startDuel(x.dataset.duel));
}
function duelend(m) {
  const r = R.result, X = r.duel, b = botOf(R.duel.id), d = du('bots')[b.id];
  const q = R.moves.map((_, j) => j).filter(j => j >= R.n);
  const strip = (arr, who) => `<div class="cx-strip"><span>${esc(who)}</span><div style="grid-template-columns:repeat(${q.length},1fr)">${q.map(j => { const a = arr[j]; return `<i class="${a === undefined ? '' : a === R.moves[j].truth ? 'hit' : 'miss'}"></i>`; }).join('')}</div></div>`;
  const botMiss = q.filter(j => R.duel.ans[j] !== R.moves[j].truth);
  m.innerHTML = `<div class="cx-duelend ${X.win ? 'won' : 'lost'}"><div class="cx-faceoff">
      <div class="cx-side">${youAvatar(112)}<b>${esc(du('you'))}</b><span class="cx-big">${r.ok}</span></div>
      <div class="cx-vs"><h2>${esc(X.win ? du('win') : du('loss'))}</h2><small>${esc(du('vs'))}</small></div>
      <div class="cx-side">${botAv(b, 112)}<b>${esc(d[0])}</b><span class="cx-big">${X.botOk}</span></div></div>
    <p class="cx-dsub">${esc(r.died ? du('died') : X.tie ? du('tieTime') : '')}</p>
    <p class="small">${esc(du('timeL', { a: fmtSec(X.youT), b: d[0], c: fmtSec(X.botT) }))}</p>
    <p class="cx-sumrank ${X.delta > 0 ? 'up' : 'down'}">${esc(du('pts', { d: (X.delta > 0 ? '+' : '') + X.delta }))}${X.up ? ' · ' + esc(tt('rankUp', { r: rankName(X.after) })) : X.down ? ' · ' + esc(tt('rankDown', { r: rankName(X.after) })) : ''}</p>
    ${rankBar('duel')}
    ${strip(R.ans, du('you'))}${strip(R.duel.ans, d[0])}
    <h3>${esc(du('botErr', { b: d[0] }))}</h3>
    ${botMiss.length ? `<div class="cx-dlist">${botMiss.map(j => { const et = errType(R.moves[j], R.duel.ans[j]); return `<div><b>${j + 1}</b><span>«${esc(qPlain(R.moves[j]))}» · ${esc(d[0])}: ${esc(tfTxt(R.duel.ans[j]))} · ${esc(tt('right', { a: tfTxt(R.moves[j].truth) }))} <em class="cx-fal">${esc(tt(et))}</em></span></div>`; }).join('')}</div>` : `<p class="muted">${esc(du('botClean', { b: d[0] }))}</p>`}
    <div class="row cx-duelacts"><button class="cx-go" data-act="go">${ic('swords', 16)} ${esc(du('rematch'))} ↵</button><button class="btn ghost" data-act="others">${esc(du('other'))}</button><button class="btn ghost" data-act="report">${esc(du('report'))}</button></div></div>`;
  const go = m.querySelector('[data-act=go]'); go.focus({ preventScroll: true });
  go.onclick = () => startDuel(b.id);
  m.querySelector('[data-act=others]').onclick = () => { R = null; VIEW = 'duels'; render(); };
  m.querySelector('[data-act=report]').onclick = () => { VIEW = 'summary'; render(); };
}
// ícones dos modos de treino
const MODE_IC = {
  disj: '<path d="M12 21v-7.5M12 13.5 5.5 4M12 13.5 18.5 4"/><circle cx="12" cy="13.5" r="1.6" fill="currentColor"/>',
  bias: '<path d="M12 3.5v17M7.5 20.5h9M4.5 7.5h15M4.5 7.5 2 13.5a2.6 2.6 0 0 0 5 0zM19.5 7.5 17 13.5a2.6 2.6 0 0 0 5 0z"/>',
  mix: '<path d="M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z"/>',
  ord: '<rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>',
  syl: '<circle cx="9" cy="12" r="6.2"/><circle cx="15" cy="12" r="6.2"/>',
  cond: '<text x="2" y="16.5" font-size="11" font-family="Georgia,serif" font-style="italic" stroke="none" fill="currentColor">p</text><path d="M8.5 12.5h9m-3.5-3.5 3.5 3.5-3.5 3.5"/><text x="18.5" y="16.5" font-size="11" font-family="Georgia,serif" font-style="italic" stroke="none" fill="currentColor">q</text>' };
const modeIcon = (v) => `<svg class="cx-mic" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MODE_IC[v]}</svg>`;

// ================= Cartas do Arquivo: tarefa de seleção de Wason, adaptativa =================
// Cada selo tem um símbolo de um lado e uma cor do outro. Uma regra liga os dois; vês quatro lados e escolhes o que virar.
// Tem de se virar uma carta se, e só se, o lado escondido puder tornar a regra falsa.
const WX = {
  pt: { title: 'Cartas do Arquivo', sub: 'Que selos tens de virar para pôr a regra à prova?', round: 'Ronda {i} de {n}', rule: 'Regra do arquivo',
    instr: 'Cada selo tem um símbolo de um lado e uma cor do outro. Escolhe só os que tens de virar para saber se a regra é cumprida — nem mais, nem menos.',
    after: 'Os selos foram virados. Vê porque cada um contava ou não.', turn: 'Virar os escolhidos', back: 'Outro lado', ok: 'Certo!', bad: 'Não exatamente.',
    must: 'Tens de virar: se o outro lado {d}, a regra quebra-se.', no: 'Não precisas: seja qual for o outro lado, a regra mantém-se.',
    vMust: 'era preciso', vMiss: 'faltou', vExtra: 'desnecessária', vOk: 'não era precisa', next: 'Seguinte', broke: 'quebra a regra',
    endT: 'As cartas foram lidas', score: '{ok} de {n} certas', up: 'Sobes para o nível {l}.', down: 'Desces para o nível {l}.', hold: 'Ficas no nível {l}.', again: 'Mais cartas', errsT: 'Onde tropeçaste',
    eIs: 'for {y}', eIsNot: 'não for {y}', cHas: 'tiver {x}', cHasNot: 'não tiver {x}',
    wConfirm: 'Viés de confirmação', wIrrel: 'Carta irrelevante', wMissC: 'Refutação esquecida', wMissE: 'Caso esquecido',
    tips: { wConfirm: 'Viraste uma carta que só podia confirmar a regra. Uma regra testa-se procurando o que a pode refutar.', wIrrel: 'A regra não diz nada sobre esse selo: seja qual for o outro lado, ela mantém-se.',
      wMissC: 'Faltou a cor que pode esconder o caso proibido — é o modus tollens.', wMissE: 'Faltou o símbolo cujo verso pode quebrar a regra.' },
    lvlD: ['«se…, então…»', '+ «todos os selos com…»', '+ «só se»', '+ consequente negado', '+ antecedente negado', '+ «a menos que»', '+ «se e só se»'] },
  en: { title: 'Archive Cards', sub: 'Which seals must you turn to put the rule to the test?', round: 'Round {i} of {n}', rule: 'Rule of the archive',
    instr: 'Each seal has a symbol on one side and a colour on the other. Pick only the ones you must turn to know whether the rule holds — no more, no fewer.',
    after: 'The seals were turned. See why each one mattered or not.', turn: 'Turn the chosen ones', back: 'Other side', ok: 'Correct!', bad: 'Not quite.',
    must: 'Turn it: if the other side {d}, the rule breaks.', no: 'No need: whatever is on the other side, the rule holds.',
    vMust: 'needed', vMiss: 'missed', vExtra: 'unnecessary', vOk: 'not needed', next: 'Next', broke: 'breaks the rule',
    endT: 'The cards have been read', score: '{ok} of {n} correct', up: 'Up to level {l}.', down: 'Down to level {l}.', hold: 'You stay at level {l}.', again: 'More cards', errsT: 'Where you stumbled',
    eIs: 'is {y}', eIsNot: 'is not {y}', cHas: 'bears {x}', cHasNot: 'does not bear {x}',
    wConfirm: 'Confirmation bias', wIrrel: 'Irrelevant card', wMissC: 'Missed refutation', wMissE: 'Missed case',
    tips: { wConfirm: 'You turned a card that could only confirm the rule. A rule is tested by looking for what could refute it.', wIrrel: 'The rule says nothing about that seal: whatever is on the other side, it holds.',
      wMissC: 'You missed the colour that could hide the forbidden case — that is modus tollens.', wMissE: 'You missed the symbol whose back could break the rule.' },
    lvlD: ['"if…, then…"', '+ "every seal with…"', '+ "only if"', '+ negated consequent', '+ negated antecedent', '+ "unless"', '+ "if and only if"'] } };
const wx = (k, v) => { let x = WX[lang()][k]; if (typeof x === 'string' && v) for (const [a, b] of Object.entries(v)) x = x.split('{' + a + '}').join(b); return x; };
const W_EMB = [{ id: 'crown', ic: 'crown', pt: 'coroa', ptA: 'uma coroa', en: 'crown', enA: 'a crown' }, { id: 'skull', ic: 'skull', pt: 'caveira', ptA: 'uma caveira', en: 'skull', enA: 'a skull' },
  { id: 'candle', ic: 'candle', pt: 'vela', ptA: 'uma vela', en: 'candle', enA: 'a candle' }, { id: 'swords', ic: 'swords', pt: 'espadas', ptA: 'duas espadas', en: 'swords', enA: 'crossed swords' }];
const W_COL = [{ id: 'gold', pt: 'dourado', en: 'gold' }, { id: 'silver', pt: 'prateado', en: 'silver' }, { id: 'crimson', pt: 'carmesim', en: 'crimson' }, { id: 'black', pt: 'negro', en: 'black' }];
const W_RULES = {
  if: { lvl: 1, f: (e, c) => !e || c, pt: (X, Y) => `Se um selo tem ${X.ptA}, o verso é ${Y.pt}.`, en: (X, Y) => `If a seal bears ${X.enA}, its back is ${Y.en}.` },
  all: { lvl: 2, f: (e, c) => !e || c, pt: (X, Y) => `Todos os selos com ${X.ptA} têm o verso ${Y.pt}.`, en: (X, Y) => `Every seal with ${X.enA} has a ${Y.en} back.` },
  only: { lvl: 3, f: (e, c) => !e || c, pt: (X, Y) => `Um selo só tem ${X.ptA} se o verso for ${Y.pt}.`, en: (X, Y) => `A seal bears ${X.enA} only if its back is ${Y.en}.` },
  ifnot: { lvl: 4, f: (e, c) => !e || !c, pt: (X, Y) => `Se um selo tem ${X.ptA}, o verso não é ${Y.pt}.`, en: (X, Y) => `If a seal bears ${X.enA}, its back is not ${Y.en}.` },
  neg: { lvl: 5, f: (e, c) => e || c, pt: (X, Y) => `Se um selo não tem ${X.ptA}, o verso é ${Y.pt}.`, en: (X, Y) => `If a seal does not bear ${X.enA}, its back is ${Y.en}.` },
  unless: { lvl: 6, f: (e, c) => !e || c, pt: (X, Y) => `Um selo não tem ${X.ptA}, a menos que o verso seja ${Y.pt}.`, en: (X, Y) => `A seal does not bear ${X.enA} unless its back is ${Y.en}.` },
  iff: { lvl: 7, f: (e, c) => e === c, pt: (X, Y) => `Um selo tem ${X.ptA} se e só se o verso for ${Y.pt}.`, en: (X, Y) => `A seal bears ${X.enA} if and only if its back is ${Y.en}.` } };
const W_MAX = 7, W_N = 8;
const embOf = (id) => W_EMB.find(e => e.id === id), colOf = (id) => W_COL.find(c => c.id === id);
function wRound(lvl) {
  const types = Object.keys(W_RULES).filter(k => W_RULES[k].lvl <= lvl), t = Math.random() < .45 ? types[types.length - 1] : pickOne(types), f = W_RULES[t].f;
  const [X, Z] = shuffle(W_EMB), [Y, Wc] = shuffle(W_COL);
  const cards = shuffle([{ side: 'e', v: true }, { side: 'e', v: false }, { side: 'c', v: true }, { side: 'c', v: false }]);
  for (const c of cards) { c.fal = [true, false].filter(h => c.side === 'e' ? !f(c.v, h) : !f(h, c.v)); c.must = c.fal.length > 0; c.hid = Math.random() < .5; }
  return { t, X: X.id, Z: Z.id, Y: Y.id, W: Wc.id, cards, sel: [], done: false };
}
let WG = null;
function openCards() { const l = S.wason.lvl; WG = { lvl: l, i: 0, ok: 0, errs: {}, rounds: [wRound(l)] }; VIEW = 'cards'; render(); }
function wTurn() {
  const r = WG.rounds[WG.i]; if (!r || r.done || !r.sel.length) return;
  r.done = true; r.ok = r.cards.every((c, k) => c.must === r.sel.includes(k)); if (r.ok) WG.ok++;
  r.errs = [];
  r.cards.forEach((c, k) => { const s1 = r.sel.includes(k); if (s1 && !c.must) r.errs.push(c.side === 'c' ? 'wConfirm' : 'wIrrel'); if (!s1 && c.must) r.errs.push(c.side === 'c' ? 'wMissC' : 'wMissE'); });
  for (const e of r.errs) WG.errs[e] = (WG.errs[e] || 0) + 1;
  beep(r.ok); if (!r.ok && navigator.vibrate) { try { navigator.vibrate(60); } catch { } }
  render();
}
function wNext() {
  WG.i++;
  if (WG.i < W_N) { WG.rounds.push(wRound(WG.lvl)); render(); return; }
  const l0 = WG.lvl, l1 = WG.ok >= 7 ? Math.min(W_MAX, l0 + 1) : WG.ok <= 4 ? Math.max(1, l0 - 1) : l0;
  S.wason.lvl = l1; S.wason.best = Math.max(S.wason.best || 1, l1);
  S.wason.hist = (S.wason.hist || []).concat([{ when: Date.now(), lvl: l0, ok: WG.ok, n: W_N, errs: WG.errs }]).slice(-50);
  WG.end = { l0, l1 }; save(); render();
}
function cardFace(r, c) {
  const X = embOf(c.side === 'e' ? (c.v ? r.X : r.Z) : null), C = colOf(c.side === 'c' ? (c.v ? r.Y : r.W) : null), lg = lang();
  return c.side === 'e' ? `<span class="cx-wemb">${ic(X.ic, 50)}</span><b>${esc(cap(X[lg]))}</b>` : `<span class="cx-swatch ${C.id}"></span><b>${esc(cap(C[lg]))}</b>`;
}
function cardBack(r, c) {
  const lg = lang();
  if (c.side === 'e') { const C = colOf(c.hid ? r.Y : r.W); return `<span class="cx-swatch sm ${C.id}"></span>${esc(cap(C[lg]))}`; }
  const X = embOf(c.hid ? r.X : r.Z); return `${ic(X.ic, 16)} ${esc(cap(X[lg]))}`;
}
function cards(m) {
  if (WG.end) {
    const { l0, l1 } = WG.end;
    m.innerHTML = `<div class="cx-duelend ${WG.ok >= 7 ? 'won' : ''}"><div class="cx-crest" aria-hidden="true">${ic('cards', 46)}</div><div class="cx-vs"><h2>${esc(wx('endT'))}</h2></div>
      <p class="cx-side"><span class="cx-big">${WG.ok}/${W_N}</span></p>
      <p class="ch-lvl ${l1 > l0 ? 'cx-up' : ''}">${esc(l1 > l0 ? wx('up', { l: l1 }) : l1 < l0 ? wx('down', { l: l1 }) : wx('hold', { l: l1 }))}</p>
      <p class="cx-desc">${esc(tt('level'))} ${l1}: ${esc(WX[lang()].lvlD.slice(0, l1).join(' '))}</p>
      ${Object.keys(WG.errs).length ? `<h3>${esc(wx('errsT'))}</h3><div class="cx-dlist">${Object.entries(WG.errs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div><b>${v}×</b><span><em class="cx-fal">${esc(wx(k))}</em><small>${esc(WX[lang()].tips[k])}</small></span></div>`).join('')}</div>` : ''}
      <div class="row cx-duelacts"><button class="cx-go" data-act="go">${ic('cards', 18)} ${esc(wx('again'))} ↵</button><button class="btn ghost" data-act="home">${esc(hm('home'))}</button></div></div>`;
    m.querySelector('[data-act=go]').onclick = openCards; m.querySelector('[data-act=home]').onclick = () => { WG = null; VIEW = 'intro'; render(); };
    m.querySelector('[data-act=go]').focus({ preventScroll: true });
    return;
  }
  const r = WG.rounds[WG.i], X = embOf(r.X), Y = colOf(r.Y), lg = lang(), rule = W_RULES[r.t][lg](X, Y);
  const track = Array.from({ length: W_N }, (_, j) => { const q = WG.rounds[j]; return `<i class="${q && q.done ? (q.ok ? 'hit' : 'miss') : ''}${j === WG.i ? ' now' : ''}"></i>`; }).join('');
  const desc = (c) => { const h = c.fal[0]; return c.side === 'e' ? wx(h ? 'eIs' : 'eIsNot', { y: Y[lg] }) : wx(h ? 'cHas' : 'cHasNot', { x: lg === 'pt' ? X.ptA : X.enA }); };
  const verdict = (c, k) => { const s1 = r.sel.includes(k); return c.must ? (s1 ? ['good', '✓ ' + wx('vMust')] : ['bad', '✗ ' + wx('vMiss')]) : (s1 ? ['bad', '✗ ' + wx('vExtra')] : ['good', '✓ ' + wx('vOk')]); };
  m.innerHTML = `<div class="cx cx-wgame">
    <div class="cx-head"><span class="cx-meta">${esc(wx('title'))} · ${esc(tt('level'))} ${WG.lvl} · ${esc(wx('round', { i: WG.i + 1, n: W_N }))}</span><span class="cx-right cx-wscore">${ic('cards', 16)} <b>${WG.ok}</b></span></div>
    <div class="cx-track" aria-hidden="true" style="grid-template-columns:repeat(${W_N},1fr)">${track}</div>
    <div class="cx-rule"><span class="cx-lab">${esc(wx('rule'))}</span><p>${esc(rule)}</p></div>
    <p class="cx-winstr">${esc(wx(r.done ? 'after' : 'instr'))}</p>
    <div class="cx-wcards">${r.cards.map((c, k) => { const v = r.done ? verdict(c, k) : null, broke = r.done && !W_RULES[r.t].f(c.side === 'e' ? c.v : c.hid, c.side === 'c' ? c.v : c.hid);
      return `<button class="cx-wcard ${c.side === 'c' ? 'colside' : 'embside'} ${r.sel.includes(k) ? 'sel' : ''} ${r.done ? 'rev ' + (c.must ? 'must' : '') : ''}" data-wcard="${k}" aria-pressed="${r.sel.includes(k)}" ${r.done ? 'disabled' : ''}>
        <kbd>${k + 1}</kbd><span class="cx-wfront">${cardFace(r, c)}</span>
        ${r.done ? `<span class="cx-wback"><small>${esc(wx('back'))}</small>${cardBack(r, c)}${broke ? `<em class="cx-broke">${esc(wx('broke'))}</em>` : ''}</span><span class="cx-wv ${v[0]}">${esc(v[1])}</span>` : ''}</button>`; }).join('')}</div>
    ${r.done ? `<div class="cx-tutfb ${r.ok ? 'ok' : 'bad'}"><b>${esc(r.ok ? wx('ok') : wx('bad'))}</b>${r.errs.length ? `<div class="cx-werrs">${[...new Set(r.errs)].map(e => `<em class="cx-fal" title="${esc(WX[lang()].tips[e])}">${esc(wx(e))}</em>`).join(' ')}</div>` : ''}
        <ul class="cx-wwhy">${r.cards.map((c, k) => `<li><b>${k + 1}</b> ${esc(c.must ? wx('must', { d: desc(c) }) : wx('no'))}</li>`).join('')}</ul></div>
      <div class="ch-acts one"><button class="ch-next" data-act="wnext"><span>${esc(wx('next'))}</span><kbd>Enter</kbd></button></div>`
    : `<div class="ch-acts one"><button class="cx-btn cx-wturn" data-act="wturn" ${r.sel.length ? '' : 'disabled'}>${ic('recall', 16)} ${esc(wx('turn'))} <kbd>Enter</kbd></button></div>`}
  </div>`;
  m.querySelectorAll('[data-wcard]').forEach(b => b.onclick = () => { const k = +b.dataset.wcard; r.sel = r.sel.includes(k) ? r.sel.filter(x => x !== k) : r.sel.concat([k]); render(); });
  const t = m.querySelector('[data-act=wturn]'); if (t) t.onclick = wTurn;
  const n = m.querySelector('[data-act=wnext]'); if (n) { n.onclick = wNext; n.focus({ preventScroll: true }); }
}

// ---------- tutorial guiado (1-back, passos fixos, com a pista antiga primeiro à vista e depois escondida) ----------
const TUTX = {
  pt: {
    btn: 'Tutorial guiado', sub: '4 minutos · ordem, classes e condições — aprende a juntar as pistas antes de entrares na cripta', rec: 'Recomendado',
    step: 'Passo {i} de {n}', old: 'Pista anterior (há 1 jogada)', now: 'Pista nova', hidden: 'Escondida — lembra-te dela', peek: 'espreitar',
    q: 'As duas pistas garantem que {q}?', ok: 'Certo!', bad: 'Não exatamente.', cont: 'Continuar', title: 'Como se joga',
    s: [
      { t: 'As letras são só nomes — como pessoas numa fila. Não há ordem alfabética: a ordem está escondida e só a conheces pelas pistas. Cada pista diz quem vem antes de quem.', memo: 'Guarda-a como uma mini-linha: G → B. Na próxima jogada vais precisar dela.' },
      { t: 'Chegou uma pista nova. Junta-a à anterior: se partilham uma letra, formam uma cadeia.', why: 'A letra B liga as duas pistas: G → B → K. Logo G vem antes de K — Sim.' },
      { t: 'Agora a pista anterior é a da jogada passada (B → K). Junta-a à nova.', why: 'B e M vêm ambos antes de K, mas nada diz qual dos dois vem primeiro. Não dá para saber → Não. «Não» também quer dizer «não garantido».' },
      { t: 'Atenção às palavras: «D vem depois de K» é o mesmo que K → D.', why: 'M → K e K → D formam a cadeia M → K → D. Sim.' },
      { t: 'Como no jogo a sério, a pista anterior agora está escondida. Lembras-te dela?', why: 'A pista escondida era «D vem depois de K» (K → D). Com D → S fica K → D → S. Sim.' },
      { t: 'Cuidado com a negação. «S não vem antes de P» quer dizer P → S.', why: 'A anterior era D → S. D e P vêm ambos antes de S: não dá para saber quem vem primeiro → Não.' },
      { t: 'Outro tipo de pista: classes. «Todos os G são K» quer dizer que cada G está dentro de K — não que cada K seja G.', memo: 'Guarda-a como G ⊂ K.' },
      { t: 'Junta a pista nova à anterior: as classes encaixam umas nas outras?', why: 'Cada G é K e cada K é M: logo cada G é M. Sim.' },
      { t: 'Agora a anterior é «todos os K são M». Atenção à armadilha mais famosa dos silogismos.', why: 'K e P estão ambos dentro de M, mas podem estar em partes diferentes de M. É a falácia do termo médio não distribuído → Não.' },
      { t: 'Último tipo: condições. «Se G acontece, K acontece»: G basta para K, e K é necessário para G.', memo: 'Guarda-a como G → K.' },
      { t: 'K aconteceu. Isso garante G?', why: 'K pode ter acontecido por outra razão. Concluir G é afirmar o consequente → Não.' },
      { t: 'A anterior é «K acontece». Junta-a à nova condição.', why: 'A condição cumpre-se (K acontece), logo M acontece: modus ponens. Sim.' }
    ],
    endT: 'Já sabes jogar', end: ['Em cada jogada: lembra a pista de há N jogadas, junta-a à nova, e vê se formam uma cadeia na direção da pergunta. Sim só quando está garantido.',
      'Em 2-back ou mais, mantém na cabeça uma fila com as últimas N mini-linhas: em cada jogada usas a mais antiga e acrescentas a nova.',
      'Diz as mini-linhas em voz baixa (“G antes de B”) — ajuda a guardá-las.',
      'Em «Modo de treino» escolhes Raciocínio gramatical, Silogismos, Condicionais ou Variado. Quando cais numa armadilha, o relatório diz-te o nome da falácia.'],
    go: 'Modo adaptativo', back: 'Voltar à entrada', again: 'Repetir tutorial'
  },
  en: {
    btn: 'Guided tutorial', sub: '4 minutes · order, classes and conditions — learn to combine clues before you enter the crypt', rec: 'Recommended',
    step: 'Step {i} of {n}', old: 'Previous clue (1 move ago)', now: 'New clue', hidden: 'Hidden — remember it', peek: 'peek',
    q: 'Do the two clues guarantee that {q}?', ok: 'Correct!', bad: 'Not quite.', cont: 'Continue', title: 'How to play',
    s: [
      { t: 'Letters are just names — like people in a queue. There is no alphabetical order: the order is hidden and you only learn it from the clues. Each clue says who comes before whom.', memo: 'Hold it as a mini-line: G → B. You will need it on the next move.' },
      { t: 'A new clue arrived. Combine it with the previous one: if they share a letter, they form a chain.', why: 'The letter B links both clues: G → B → K. So G comes before K — Yes.' },
      { t: 'Now the previous clue is the one from the last move (B → K). Combine it with the new one.', why: 'B and M both come before K, but nothing says which of them comes first. You can\'t tell → No. "No" also means "not guaranteed".' },
      { t: 'Watch the wording: "D comes after K" is the same as K → D.', why: 'M → K and K → D make the chain M → K → D. Yes.' },
      { t: 'As in the real game, the previous clue is now hidden. Do you remember it?', why: 'The hidden clue was "D comes after K" (K → D). With D → S you get K → D → S. Yes.' },
      { t: 'Careful with negation. "S does not come before P" means P → S.', why: 'The previous clue was D → S. D and P both come before S: you can\'t tell which is first → No.' },
      { t: 'Another kind of clue: classes. "All G are K" means every G sits inside K — not that every K is a G.', memo: 'Hold it as G ⊂ K.' },
      { t: 'Combine the new clue with the previous one: do the classes nest?', why: 'Every G is K and every K is M: so every G is M. Yes.' },
      { t: 'Now the previous clue is "all K are M". Watch out for the most famous syllogism trap.', why: 'K and P are both inside M, but they can sit in different parts of M. This is the undistributed middle fallacy → No.' },
      { t: 'Last kind: conditions. "If G happens, K happens": G is enough for K, and K is necessary for G.', memo: 'Hold it as G → K.' },
      { t: 'K happened. Does that guarantee G?', why: 'K may have happened for another reason. Concluding G is affirming the consequent → No.' },
      { t: 'The previous clue is "K happens". Combine it with the new condition.', why: 'The condition is met (K happens), so M happens: modus ponens. Yes.' }
    ],
    endT: 'You know how to play', end: ['On every move: recall the clue from N moves ago, combine it with the new one, and check whether they form a chain in the direction of the question. Yes only when it is guaranteed.',
      'At 2-back or more, keep a queue of the last N mini-lines in your head: each move you use the oldest one and add the new one.',
      'Say the mini-lines quietly ("G before B") — it helps you hold them.',
      'Under "Training mode" you pick Grammatical reasoning, Syllogisms, Conditionals or Varied. When you fall into a trap, the report names the fallacy.'],
    go: 'Adaptive mode', back: 'Back to the entrance', again: 'Repeat tutorial'
  }
};
// cada passo: pista nova, pista anterior (a nova do passo anterior), pergunta, resposta e a linha a desenhar
const TUT = [
  { now: { pt: 'G vem antes de B.', en: 'G comes before B.' } },
  { now: { pt: 'B vem antes de K.', en: 'B comes before K.' }, q: { pt: 'G vem antes de K', en: 'G comes before K' }, ans: true, line: 'G → B → K' },
  { now: { pt: 'M vem antes de K.', en: 'M comes before K.' }, q: { pt: 'B vem antes de M', en: 'B comes before M' }, ans: false, line: 'B → K ← M' },
  { now: { pt: 'D vem depois de K.', en: 'D comes after K.' }, q: { pt: 'M vem antes de D', en: 'M comes before D' }, ans: true, line: 'M → K → D' },
  { now: { pt: 'D vem antes de S.', en: 'D comes before S.' }, q: { pt: 'K vem antes de S', en: 'K comes before S' }, ans: true, line: 'K → D → S', hide: true },
  { now: { pt: 'S não vem antes de P.', en: 'S does not come before P.' }, q: { pt: 'D vem antes de P', en: 'D comes before P' }, ans: false, line: 'D → S ← P', hide: true },
  { now: { pt: 'Todos os G são K.', en: 'All G are K.' }, fresh: true },
  { now: { pt: 'Todos os K são M.', en: 'All K are M.' }, q: { pt: 'todos os G são M', en: 'all G are M' }, ans: true, line: 'G ⊂ K ⊂ M' },
  { now: { pt: 'Todos os P são M.', en: 'All P are M.' }, q: { pt: 'todos os K são P', en: 'all K are P' }, ans: false, line: 'K ⊂ M ⊃ P' },
  { now: { pt: 'Se G acontece, K acontece.', en: 'If G happens, K happens.' }, fresh: true },
  { now: { pt: 'K acontece.', en: 'K happens.' }, q: { pt: 'G acontece', en: 'G happens' }, ans: false, line: 'G → K · K ⇏ G' },
  { now: { pt: 'Se K acontece, M acontece.', en: 'If K happens, M happens.' }, q: { pt: 'M acontece', en: 'M happens' }, ans: true, line: 'K → M · K ⇒ M' }
];
const ut = (k, v) => { let x = TUTX[lang()][k]; if (v) for (const [a, b] of Object.entries(v)) x = x.split('{' + a + '}').join(b); return x; };
let TS = { k: 0, done: null, peek: false };
function openTut() { TS = { k: 0, done: null, peek: false }; VIEW = 'tut'; render(); }
function tutAnswer(a) {
  const st = TUT[TS.k]; if (!st.q || TS.done) return;
  TS.done = { a, ok: a === st.ans }; if (S.sound) beep(TS.done.ok);
  if (navigator.vibrate && !TS.done.ok) try { navigator.vibrate(120); } catch { }
  render();
}
function tutNext() { if (TS.k >= TUT.length) return; TS.k++; TS.done = null; TS.peek = false; render(); }
function tut(m) {
  const L = lang(), k = TS.k;
  if (k >= TUT.length) {
    m.innerHTML = `<div class="cx-lore"><div class="cx-lorecard cx-tut"><div class="cx-crest" aria-hidden="true">${ic('candle', 42)}</div><h2>${esc(ut('endT'))}</h2>
      ${ut('end').map(x => `<p>${esc(x)}</p>`).join('')}
      <button class="cx-go" data-act="go">${ic('play', 16)} ${esc(ut('go'))}</button>
      <div class="row cx-tutrow"><button class="btn ghost" data-act="tback">${esc(ut('back'))}</button><button class="btn ghost" data-act="tagain">${esc(ut('again'))}</button></div></div></div>`;
    S.tutDone2 = true; save();
    const go = m.querySelector('[data-act=go]'); go.focus({ preventScroll: true });
    go.onclick = () => beginSession(true);
    m.querySelector('[data-act=tback]').onclick = () => { VIEW = 'intro'; render(); };
    m.querySelector('[data-act=tagain]').onclick = openTut;
    return;
  }
  const st = TUT[k], tx = ut('s')[k], prev = k > 0 && !st.fresh ? TUT[k - 1].now[L] : null, d = TS.done;
  const oldCard = prev ? (st.hide && !TS.peek && !d
    ? `<div class="cx-card hid"><span class="cx-lab">${esc(ut('old'))}</span><div class="ch-clue">?</div><small class="cx-hint">${esc(ut('hidden'))}</small><button class="btn small ghost cx-peek" data-act="peek">${ic('eye', 14)} ${esc(ut('peek'))}</button></div>`
    : `<div class="cx-card"><span class="cx-lab">${esc(ut('old'))}</span><div class="ch-clue">${esc(prev)}</div></div>`) : '';
  const nowCard = `<div class="cx-card cur"><span class="cx-lab">${esc(st.q ? ut('now') : tt('memo'))}</span><div class="ch-clue">${esc(st.now[L])}</div>${st.q ? '' : `<small class="cx-hint">${esc(tx.memo)}</small>`}</div>`;
  let low;
  if (!st.q) low = `<div class="ch-acts one"><button class="ch-next" data-act="tnext"><span>${esc(ut('cont'))}</span><kbd>Enter</kbd></button></div>`;
  else if (!d) low = `<div class="cx-claimcard"><p class="ch-claim q">${esc(ut('q', { q: st.q[L] }))}</p></div>
      <div class="ch-acts two yn"><button class="ch-ans tf-t" data-tf="1"><kbd>←</kbd><span>${tt('aT')}</span></button><button class="ch-ans tf-f" data-tf="0"><span>${tt('aF')}</span><kbd>→</kbd></button></div>`;
  else low = `<div class="cx-tutfb ${d.ok ? 'ok' : 'bad'}"><b>${esc(d.ok ? ut('ok') : ut('bad'))} ${esc(tt('aT') === 'Sim' ? 'Resposta: ' : 'Answer: ')}${esc(st.ans ? tt('aT') : tt('aF'))}</b>
      <div class="cx-tline">${esc(st.line)}</div><p>${esc(tx.why)}</p></div>
      <div class="ch-acts one"><button class="ch-next" data-act="tnext"><span>${esc(ut('cont'))}</span><kbd>Enter</kbd></button></div>`;
  m.innerHTML = `<div class="cx cx-tutplay"><div class="cx-head"><span class="cx-meta">${esc(ut('title'))} · 1-back · ${esc(ut('step', { i: k + 1, n: TUT.length }))}</span></div>
    <div class="cx-track" aria-hidden="true" style="grid-template-columns:repeat(${TUT.length},1fr)">${TUT.map((_, j) => `<i class="${j < k ? 'hit' : ''}${j === k ? ' now' : ''}"></i>`).join('')}</div>
    <p class="cx-tuttext">${esc(tx.t)}</p>
    <div class="cx-tutcards">${oldCard}${nowCard}</div>${low}</div>`;
  m.querySelectorAll('[data-tf]').forEach(b => b.onclick = () => tutAnswer(b.dataset.tf === '1'));
  const nx = m.querySelector('[data-act=tnext]'); if (nx) { nx.onclick = tutNext; nx.focus({ preventScroll: true }); }
  const pk = m.querySelector('[data-act=peek]'); if (pk) pk.onclick = () => { TS.peek = true; render(); };
}

// ---------- ecrã inicial: herói + três separadores (Jogar · Progresso · Definições) ----------
const HMX = {
  pt: { tag: 'Memória e dedução. Junta cada pista à de há N jogadas e jura só o que está garantido.', home: 'Entrada', tabs: ['Jogar', 'Progresso', 'Definições'],
    newHere: 'Primeira vez na cripta?', tutCta: 'Fazer o tutorial', change: 'Alterar', levels: 'Nível por modo', best: 'Melhor pontuação', streak: 'Dias seguidos',
    loreOpt: 'Introdução antes de jogar', musicVol: 'Volume da música', manualT: 'Jogo livre: escolhe tu o nível e o ritmo', keysT: 'Teclado', fixed: 'Fixo', recent: 'Últimos blocos', play: 'Jogar' },
  en: { tag: 'Memory and deduction. Combine each clue with the one from N moves ago and swear only to what is guaranteed.', home: 'Home', tabs: ['Play', 'Progress', 'Settings'],
    newHere: 'First time in the crypt?', tutCta: 'Take the tutorial', change: 'Change', levels: 'Level per mode', best: 'Best score', streak: 'Day streak',
    loreOpt: 'Intro before playing', musicVol: 'Music volume', manualT: 'Free play: choose the level and pace yourself', keysT: 'Keyboard', fixed: 'Fixed', recent: 'Recent blocks', play: 'Play' } };
const hm = (k) => HMX[lang()][k];
let HT = 'play';
// dias seguidos com pelo menos um bloco
const dayStreak = () => { const days = new Set(S.hist.map(h => new Date(h.when).toDateString())); let n = 0; const d = new Date(); if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1); while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); } return n; };
const seg = (attr, opts, cur) => `<div class="cx-seg" role="group">${opts.map(([v, label]) => `<button class="${String(v) === String(cur) ? 'on' : ''}" aria-pressed="${String(v) === String(cur)}" data-${attr}="${v}">${label}</button>`).join('')}</div>`;
function autoSubTxt(L) {
  return S.dom === 'mix' ? tt('autoSubMix', { lv: tt('mixLv', { o: S.lvls.ord, y: S.lvls.syl, c: S.lvls.cond, d: S.lvls.disj, b: S.lvls.bias }), s: S.dur ? tt('sessMin', { m: S.dur }) : tt('sessOne'), q: S.apace === 'auto' ? tt('qAutoL', { t: fmtS(S.autoT) }) : tt('qFreeL') })
    : tt('level') + ' ' + L + ' · ' + (S.nFix ? lvlDesc(L, S.dom).replace(/^\d+-back/, S.nFix + '-back') : lvlDesc(L, S.dom));
}
function intro(m) {
  const L = S.dom === 'mix' ? mixLvl() : S.lvls[S.dom];
  const bestRate = S.hist.some(h => h.rate != null && h.full) ? Math.max(...S.hist.filter(h => h.rate != null && h.full).map(h => h.rate)) : null;
  const loc = lang() === 'pt' ? 'pt-PT' : 'en-GB', streak = dayStreak();
  const playTab = () => `
    ${R && !R.done ? `<div class="cx-resume"><span>${ic('recall', 18)} <b>${tt('resume')}</b> · ${R.i}/${R.moves.length}${R.duel ? ' · ' + esc(botName(botOf(R.duel.id))) : ''}</span><span class="cx-resacts"><button class="cx-btn sm" data-act="resume">${tt('cont')}</button><button class="cx-btn ghost sm" data-act="discard">${tt('discard')}</button></span></div>` : ''}
    ${!S.tutDone2 ? `<button class="cx-nudge" data-act="tut">${ic('candle', 24)}<span><b>${esc(hm('newHere'))}</b><small>${esc(ut('sub'))}</small></span><em>${esc(hm('tutCta'))} ${ic('arrow', 14)}</em></button>` : ''}
    <div class="cx-modes" role="group" aria-label="${esc(tt('domT'))}"><span class="ch-lab">${tt('domT')}</span>${['mix', 'ord', 'syl', 'cond', 'disj', 'bias'].map(v => `<button class="cx-mode ${v === S.dom ? 'on' : ''}" data-dom="${v}" aria-pressed="${v === S.dom}">${modeIcon(v)}<b>${esc(tt('domL')[v])}</b><span>${esc(tt('domD')[v])}</span><i>${v === 'mix' ? esc(tt('mixShort')) : esc(tt('level')) + ' ' + S.lvls[v]}</i></button>`).join('')}</div>
    <button class="cx-cta" data-act="auto"><span class="cx-ctaic">${ic('play', 28)}</span><span class="cx-ctatxt"><b>${tt('autoBtn')}</b><small>${esc(autoSubTxt(L))}</small></span><kbd>Enter</kbd></button>
    <div class="cx-quick"><span>${ic('hourglass', 14)} ${esc(S.dur ? tt('sessMin', { m: S.dur }) : tt('sessOne'))}</span><span>${esc(S.apace === 'auto' ? tt('qAutoL', { t: fmtS(S.autoT) }) : tt('qFreeL'))}</span><span>N · ${S.nFix ? S.nFix + '-back' : esc(tt('nAuto'))}</span><button class="cx-link" data-tab="set">${ic('sliders', 14)} ${esc(hm('change'))}</button></div>
    <div class="cx-duo">
      <button class="cx-tile duel" data-act="duels"><span class="cx-duelavs">${[0, 2, 4, 7].map(k => botAv(BOTS[k], 46)).join('')}</span><b>${ic('swords', 17)} ${esc(du('btn'))}</b><small>${esc(du('btnSub', { p: Math.round(S.rank.duel), r: rankName(S.rank.duel) }))}</small></button>
      <button class="cx-tile" data-act="cards"><span class="cx-tileic">${ic('cards', 28)}</span><b>${esc(wx('title'))}</b><small>${esc(wx('sub'))} · ${esc(tt('level'))} ${S.wason.lvl}</small></button>
      <button class="cx-tile" data-act="tut"><span class="cx-tileic">${ic('book', 30)}</span><b>${esc(ut('btn'))}</b><small>${esc(ut('sub'))}</small></button>
    </div>`;
  const statsTab = () => `
    <div class="cx-ranks">${rankBar('free')}${rankBar('timed')}${rankBar('duel')}</div>
    <div class="cx-statrow">
      ${DOMS.map(d => `<div class="cx-stat">${modeIcon(d)}<b>${S.lvls[d]}</b><small>${esc(tt('domL')[d])}</small></div>`).join('')}
      <div class="cx-stat">${ic('cards', 26)}<b>${S.wason.lvl}</b><small>${esc(wx('title'))}</small></div>
      <div class="cx-stat">${ic('flame', 26)}<b>${streak}</b><small>${esc(hm('streak'))}</small></div>
      ${bestRate != null ? `<div class="cx-stat">${ic('chart', 26)}<b>${bestRate.toLocaleString(loc)}</b><small>${esc(hm('best'))} /min</small></div>` : ''}
    </div>
    ${Object.keys(S.fal).length ? `<div class="cx-falbox"><span class="ch-lab">${tt('falT')}</span><div class="ch-errs">${Object.entries(S.fal).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `<span class="chip" title="${esc(tt('tip')[k] || '')}">${esc(tt(k))} · ${v}</span>`).join('')}</div></div>` : ''}
    <span class="ch-lab cx-center">${esc(hm('recent'))}</span>
    ${S.hist.length ? `<div class="ch-hist">${S.hist.slice(-8).reverse().map(h => `<div><span>${new Date(h.when).toLocaleDateString(loc)}</span><span>${h.duel && botOf(h.duel) ? ic('swords', 13) + ' ' + esc(botName(botOf(h.duel))) + ' · ' : ''}${h.doms ? esc([...new Set(h.doms)].map(d => tt('domL')[d]).join(' + ')) + ' · ' : ''}${esc(tt('level'))} ${h.lvl}</span><b>${h.ok}/${h.n}</b><span>${h.rate != null ? h.rate + '/min' : '×' + h.best}</span></div>`).join('')}</div>` : `<p class="muted cx-center">${tt('none')}</p>`}
    `;
  const setTab = () => `
    <div class="cx-setlist">
      <div class="cx-setrow"><span>${tt('dur')}</span>${seg('dur', [0, 5, 10, 15, 20, 30].map(v => [v, v ? tt('durMin', { m: v }) : tt('durBlock')]), S.dur)}</div>
      <div class="cx-setrow"><span>${tt('qpace')}</span>${seg('apace', [['free', tt('qFree')], ['auto', tt('qAuto')]], S.apace)}</div>
      <div class="cx-setrow"><span>N</span><div class="cx-nrow">${seg('nmode', [['auto', tt('nAuto')], ['fix', hm('fixed')]], S.nFix ? 'fix' : 'auto')}${S.nFix ? `<div class="cx-step"><button data-nstep="-1" aria-label="−">${ic('minus', 16)}</button><b>${S.nFix}-back</b><button data-nstep="1" aria-label="+">${ic('plus', 16)}</button></div>` : ''}</div></div>
      <div class="cx-setrow"><span>${tt('sound')}</span>${seg('sound', [[1, tt('on')], [0, tt('off')]], S.sound ? 1 : 0)}</div>
      <div class="cx-setrow"><span title="${esc(tt('stroopTip'))}">${tt('stroop')}</span>${seg('stroop', [[0, tt('off')], [1, tt('on')]], S.stroop ? 1 : 0)}</div>
      <div class="cx-setrow"><span>${esc(hm('loreOpt'))}</span>${seg('lore', [[1, tt('on')], [0, tt('off')]], S.lore ? 1 : 0)}</div>
      <div class="cx-setrow"><span>${esc(hm('musicVol'))}</span><input class="cx-range" type="range" min="0" max="100" value="${Math.round(S.music.vol * 100)}" data-vol aria-label="${esc(hm('musicVol'))}"></div>
    </div>
    <details class="cx-acc"><summary>${ic('sliders', 16)} ${esc(hm('manualT'))}</summary>
      <div class="cx-setlist">
        <div class="cx-setrow"><span>${tt('level')}</span><div class="cx-step"><button data-lstep="-1" aria-label="−">${ic('minus', 16)}</button><b>${L}</b><button data-lstep="1" aria-label="+">${ic('plus', 16)}</button></div></div>
        <p class="cx-desc">${esc(lvlDesc(L, S.dom))}</p>
        <div class="cx-setrow"><span>${tt('pace')}</span>${seg('pace', PACES.filter(x => x !== -1).map(x => [x, x ? tt('paceS', { s: x }) : tt('paceFree')]), S.mpace)}</div>
      </div>
      <button class="cx-btn" data-act="start">${ic('play', 16)} ${tt('startManual')}</button>
    </details>
    <details class="cx-acc"><summary>${ic('book', 16)} ${tt('how')}</summary>
      <p class="cx-desc">${esc(tt('negNote'))}</p>
      <div class="ch-ex"><div class="ch-exh">${esc(tt('exTitle'))}</div>${tt('ex').map(([c, d], i) => `<div class="ch-exr"><b>${i + 1}</b><span class="ch-exc">${esc(c)}</span><span>${esc(d)}</span></div>`).join('')}</div>
    </details>
    <p class="cx-keys">${esc(tt('keys'))}</p>`;
  m.innerHTML = `<div class="cx-home">
    <header class="cx-hero"><div class="cx-herocrest">${ic('crown', 30)}</div><h1>${esc(tt('loreTitle'))}</h1><p>${esc(hm('tag'))}</p>
      <div class="cx-herochips"><span class="cx-hchip">${ic('star', 13)} ${esc(rankName(S.rank.free))} · ${Math.round(S.rank.free)}</span><span class="cx-hchip">${ic('swords', 13)} ${esc(rankName(S.rank.duel))} · ${Math.round(S.rank.duel)}</span>${streak ? `<span class="cx-hchip">${ic('flame', 13)} ${streak}</span>` : ''}</div></header>
    <nav class="cx-tabs" role="tablist">${['play', 'stats', 'set'].map((t, i) => `<button role="tab" aria-selected="${HT === t}" class="${HT === t ? 'on' : ''}" data-tab="${t}">${ic(['play', 'chart', 'sliders'][i], 16)}<span>${esc(hm('tabs')[i])}</span></button>`).join('')}</nav>
    <section class="cx-pane" role="tabpanel">${HT === 'stats' ? statsTab() : HT === 'set' ? setTab() : playTab()}</section></div>`;
  const go = () => render();
  m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { HT = b.dataset.tab; go(); const t = $('.cx-tabs'); if (t) t.scrollIntoView({ block: 'nearest' }); });
  const setLvl = (v) => { v = Math.max(1, Math.min(MAXL, v)); S.lvl = v; if (S.dom === 'mix') DOMS.forEach(d => S.lvls[d] = v); else S.lvls[S.dom] = v; save(); };
  const keepAcc = (fn) => () => { const st = [...m.querySelectorAll('details')].map(d => d.open); fn(); go(); const ds = $('#chMain').querySelectorAll('details'); st.forEach((o, k) => { if (ds[k]) ds[k].open = o; }); };
  m.querySelectorAll('[data-lstep]').forEach(b => b.onclick = keepAcc(() => setLvl(L + +b.dataset.lstep)));
  m.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { S.dur = +b.dataset.dur; save(); go(); });
  m.querySelectorAll('[data-apace]').forEach(b => b.onclick = () => { S.apace = b.dataset.apace; save(); go(); });
  m.querySelectorAll('[data-dom]').forEach(b => b.onclick = () => { S.dom = b.dataset.dom; save(); go(); });
  m.querySelectorAll('[data-nmode]').forEach(b => b.onclick = () => { S.nFix = b.dataset.nmode === 'fix' ? (S.nFix || LEVELS[L].n) : 0; save(); go(); });
  m.querySelectorAll('[data-nstep]').forEach(b => b.onclick = () => { S.nFix = Math.max(1, Math.min(15, (S.nFix || 1) + +b.dataset.nstep)); save(); go(); });
  m.querySelectorAll('[data-sound]').forEach(b => b.onclick = () => { S.sound = b.dataset.sound === '1'; save(); if (S.sound) beep(true); go(); });
  m.querySelectorAll('[data-stroop]').forEach(b => b.onclick = () => { S.stroop = b.dataset.stroop === '1'; save(); go(); });
  m.querySelectorAll('[data-lore]').forEach(b => b.onclick = () => { S.lore = b.dataset.lore === '1'; save(); go(); });
  m.querySelectorAll('[data-pace]').forEach(b => b.onclick = keepAcc(() => { S.mpace = +b.dataset.pace; save(); }));
  const vol = m.querySelector('[data-vol]'); if (vol) { vol.oninput = () => { S.music.vol = vol.value / 100; if (MUS.gain && MUS.playing) MUS.gain.gain.setTargetAtTime(S.music.vol, AC.currentTime, .05); const w = $('.cx-mvol'); if (w) w.value = vol.value; }; vol.onchange = () => save(); }
  const a = (k) => m.querySelector(`[data-act=${k}]`);
  if (a('auto')) a('auto').onclick = () => beginSession(true);
  if (a('duels')) a('duels').onclick = () => { VIEW = 'duels'; render(); };
  if (a('cards')) a('cards').onclick = openCards;
  if (a('start')) a('start').onclick = () => beginSession(false);
  m.querySelectorAll('[data-act=tut]').forEach(b => b.onclick = openTut);
  const main = a('resume') || a('auto'); if (main) main.focus({ preventScroll: true });
  if (a('resume')) a('resume').onclick = () => { if (R.duel) { VIEW = 'play'; R.review = reviewList(); render(); return; } R.review = reviewList(); if (R.review) R.resumes++; save(); VIEW = 'play'; render(); };
  if (a('discard')) a('discard').onclick = () => { R = null; S.run = null; SESS = null; S.sess = null; save(); render(); };
}
function beginSession(auto) { PEND = auto; planBlock(); if (S.lore) { VIEW = 'lore'; render(); } else startSession(auto); }
function startSession(auto) {
  SESS = S.dur ? { auto, total: S.dur * 60000, left: S.dur * 60000, blocks: [], lvl0: S.lvl, lvls0: Object.assign({}, S.lvls), last: 0 } : null;
  S.sess = SESS; startRun(auto);
}
// introdução sombria, com as regras dentro da história
function lore(m) {
  const n = S.nFix || LEVELS[S.lvl].n, jj = n === 1 ? tt('jj1') : tt('jjN');
  const dur = S.dur ? tt('loreDurMin', { m: S.dur }) : tt('loreDurBlock');
  m.innerHTML = `<div class="cx-lore"><div class="cx-lorecard">
    <div class="cx-crest" aria-hidden="true">${ic('crown', 42)}</div><h2>${esc(tt('loreTitle'))}</h2>
    ${tt('lore').map((x, k, arr) => `<p class="${k === arr.length - 1 ? 'last' : ''}">${esc(x.split('{n}').join(n).split('{jj}').join(jj).split('{lives}').join(tt('loreLives')).split('{dur}').join(dur))}</p>`).join('')}
    <p class="cx-lorekeys">${esc(tt('loreKeys'))}</p>
    <button class="cx-go" data-act="go">${ic('swords', 18)} ${tt('loreGo')}</button>
    <label class="cx-skip"><input type="checkbox" id="cxSkip"> ${esc(tt('loreSkip'))}</label></div></div>`;
  const go = m.querySelector('[data-act=go]'); go.focus({ preventScroll: true });
  go.onclick = () => { if ($('#cxSkip').checked) { S.lore = false; save(); } startSession(PEND); };
}
function startRun(auto) { if (auto === undefined) auto = S.lastAuto !== false; S.lastAuto = auto; if (!S.plan || !S.plan.fresh) planBlock(); S.plan.fresh = false; R = makeBlock(S.lvl, S.nFix); R.pace = auto ? (S.apace === 'auto' ? -1 : 0) : S.mpace; R.auto = auto; R.autoT = R.autoT0 = S.autoT; S.run = R; save(); VIEW = 'play'; render(); }
const reviewList = () => { const out = []; for (let j = Math.max(0, R.i - R.n); j < R.i; j++) out.push(j); return out.length ? { list: out, k: 0 } : null; };
function pauseRun() { if (!R || R.done) return; clearTimeout(TIMER); R.pausedAt = R.i; save(); VIEW = 'pause'; render(); }
function pause(m) {
  m.innerHTML = `<div class="ch-card ch-paused"><div class="ch-kick">${tt('paused')}</div><p>${esc(tt('pausedTxt', { what: lang() === 'pt' ? (R.n === 1 ? 'a última pista' : `as últimas ${R.n} pistas`) : (R.n === 1 ? 'the last clue' : `the last ${R.n} clues`) }))}</p>
    <div class="row" style="justify-content:center"><button class="btn primary" data-act="cont">${tt('cont')}</button><button class="btn ghost" data-act="quit">${SESS ? tt('quitBlock') : tt('quit')}</button>${SESS ? `<button class="btn ghost" data-act="quitS">${tt('endSess')}</button>` : ''}</div></div>`;
  m.querySelector('[data-act=cont]').onclick = () => { R.review = reviewList(); if (R.review) R.resumes++; save(); VIEW = 'play'; render(); };
  m.querySelector('[data-act=quit]').onclick = () => finish();
  const qs = m.querySelector('[data-act=quitS]'); if (qs) qs.onclick = () => { SESS.quit = true; finish(true); };
}
function play(m) {
  const i = R.i, mv = R.moves[i], rv = R.review;
  const jj = R.n === 1 ? tt('jj1') : tt('jjN');
  // linha de jogadas: uma marca por jogada (a memorizar, certa, errada, atual, por fazer)
  const track = R.moves.map((x, j) => {
    const a = R.ans[j], cls = j < R.n ? 'mem' : a === undefined ? '' : a === x.truth ? 'hit' : 'miss';
    return `<i class="${cls}${j === i && !rv ? ' now' : ''}"></i>`; }).join('');
  const head = `<div class="cx-head"><span class="cx-meta">${esc(tt('nback', { n: R.n }))} · ${esc(tt('move', { i: String(i + 1).padStart(2, '0'), n: R.moves.length }))} · ${esc(paceLabel())}</span>
    <span class="cx-right">${R.duel ? `<span class="cx-live" title="${esc(botName(botOf(R.duel.id)))}">${botAv(botOf(R.duel.id), 26)}<b>${duelLive()}</b><i>:</i><b>${R.ok}</b>${youAvatar(26)}</span>` : ''}<span class="cx-lives" title="${tt('lives')}">${[0, 1, 2].map(k => `<i class="${k < (R.err || 0) ? 'out' : ''}">${ic('candle', 20)}</i>`).join('')}</span>${SESS ? `${ic('hourglass', 15, 'cx-sessic')}<b id="cxSess" class="cx-sess">${esc(tt('sessLeft', { t: fmtClock(SESS.left) }))}</b>` : ''}<span class="ch-streak ${R.streak >= 3 ? 'on' : ''}">${R.streak >= 3 ? esc(tt('streak', { n: R.streak })) : ''}</span></span></div>
    <div class="cx-track" aria-hidden="true" style="grid-template-columns:repeat(${R.moves.length},1fr)">${track}</div>`;
  const nextBtn = (act) => `<div class="ch-acts one"><button class="ch-next" data-act="${act}"><span>${tt('next')}</span><kbd>Enter</kbd></button></div>`;
  let body;
  if (rv) {
    const j = rv.list[rv.k];
    body = `<div class="cx-solo"><div class="cx-card cur rev" id="chCard"><span class="cx-lab">${esc(tt('reviewK', { i: rv.k + 1, n: rv.list.length }))}</span>
      <div class="ch-clue">${esc(clueTxt(R.moves[j]))}</div><small class="cx-hint">${esc(tt('move', { i: j + 1, n: R.moves.length }))}</small></div></div>${nextBtn('rnext')}`;
  } else if (i < R.n) {
    body = `<div class="cx-solo"><div class="cx-card cur" id="chCard"><span class="cx-lab">${tt('memo')}</span>
      <div class="ch-clue">${esc(clueTxt(mv))}</div><small class="cx-hint">${esc(tt('pairT', { n: R.n, jj }))}</small></div></div>${nextBtn('mnext')}`;
  } else {
    body = `<div class="cx-solo q"><p class="cx-recall">${ic('recall', 15)} ${esc(R.n === 1 ? tt('recall1') : tt('recallN', { n: R.n }))}</p>
        <div class="cx-card cur" id="chCard"><span class="cx-lab">${tt('clueNow')}</span><div class="ch-clue">${esc(clueTxt(mv))}</div></div></div>
      <div class="cx-claimcard"><p class="ch-claim q ${mv.parts && mv.parts.length > 1 ? 'two' : ''} ${mv.col ? 'col-' + mv.col : ''}">${qHtml(mv)}</p></div>
      <div class="ch-acts two yn"><button class="ch-ans tf-t" data-tf="1"><kbd>←</kbd><span>${tt('aT')}</span></button><button class="ch-ans tf-f" data-tf="0"><span>${tt('aF')}</span><kbd>→</kbd></button></div>
      ${R.pace ? `<div class="ch-timerow"><div class="ch-time"><span id="chTime" style="animation-duration:${paceSecs()}s"></span></div><b id="chSecs">${fmtS(paceSecs())} s</b></div>` : ''}`;
  }
  m.innerHTML = `<div class="cx">${head}${body}</div>`;
  m.querySelectorAll('[data-tf]').forEach(b => b.onclick = () => answer(b.dataset.tf === '1', b));
  const nx = m.querySelector('.ch-next'); if (nx) { nx.onclick = () => advanceNoAnswer(); nx.focus(); }
  if (!rv && i >= R.n) R.shown = Date.now();
  if (!rv && i >= R.n && R.pace) {
    const total = paceSecs(), t0 = Date.now();
    TIMER = setTimeout(() => answer(null, null), total * 1000);
    clearInterval(TICK); TICK = setInterval(() => { const el = $('#chSecs'); if (!el || LOCK) { clearInterval(TICK); return; } el.textContent = fmtS(Math.max(0, total - (Date.now() - t0) / 1000)) + ' s'; }, 100);
  }
}
function advanceNoAnswer() {
  if (LOCK) return;
  if (R.review) { R.review.k++; if (R.review.k >= R.review.list.length) R.review = null; save(); render(); return; }
  R.i++; save(); render();
}
function answer(a, btn) {
  if (LOCK || !R || R.review || R.i < R.n || VIEW !== 'play') return;
  clearTimeout(TIMER); LOCK = true;
  const mv = R.moves[R.i], ok = a === mv.truth;
  R.ans[R.i] = a; if (R.shown) { R.tAct = (R.tAct || 0) + Math.min(60000, Date.now() - R.shown); R.shown = 0; }
  if (ok) { R.ok++; R.streak++; R.best = Math.max(R.best, R.streak); } else { R.streak = 0; R.err = (R.err || 0) + 1; const c = document.querySelectorAll('.cx-lives i')[R.err - 1]; if (c) c.classList.add('out'); }
  if (R.pace === -1) { R.autoT = Math.max(1.5, Math.min(10, R.autoT * (ok ? .92 : 1.2))); S.autoT = R.autoT; }
  save(); beep(ok);
  if (!ok && navigator.vibrate) { try { navigator.vibrate((R.err || 0) >= LIVES ? [90, 60, 180] : 60); } catch { } }   // telemóvel: vibração curta no erro, mais longa ao morrer
  const mark = document.querySelector('.cx-track i.now'); if (mark) { mark.classList.add(ok ? 'hit' : 'miss'); }
  // selo: aparece junto ao botão escolhido (ou da resposta certa, se o tempo acabou)
  const target = btn || document.querySelector(`[data-tf="${mv.truth ? 1 : 0}"]`);
  const card = $('#chCard');
  if (target) {
    target.classList.add(ok ? 'good' : a ? 'badpick' : 'shown');
    STAMP = document.createElement('div'); STAMP.className = 'ch-stamp ' + (ok ? 'ok' : 'no');
    STAMP.innerHTML = ok ? `<b>${R.streak >= 3 ? esc(tt('okRun', { n: R.streak })) : tt('ok').replace('!', '')}</b>` : `<b>${a ? tt('bad') : esc(tt('timeout'))}</b>`;
    target.appendChild(STAMP);
  }
  const sk = document.querySelector('.ch-streak'); if (sk) { sk.textContent = R.streak >= 3 ? tt('streak', { n: R.streak }) : ''; sk.classList.toggle('on', R.streak >= 3); }
  if (ok && card && R.streak >= 5 && R.streak % 5 === 0) card.classList.add('glow');
  setTimeout(() => { LOCK = false; R.i++; if ((R.err || 0) >= LIVES) finish(false, true); else if (R.i >= R.moves.length) finish(); else { save(); render(); } }, ok ? 620 : (R.err >= LIVES ? 900 : 720));
}
function errType(mv, a) {
  if (a == null) return 'eTime';
  if (mv.lureTruth != null && a === mv.lureTruth) return 'eLure';
  if (isX(mv)) { const base = R.moves[mv.base].c;
    if (a === true) return mv.ans === 'yx' ? 'eOppX' : falOf(mv.dom, mv.c, base, mv.cl);
    return mv.dom === 'cond' && condRule(mv.c, base, mv.cl) === 'MT' ? 'fMissMT' : 'eMissX'; }
  if (a === true) return mv.ans === 'unk' ? 'eOver' : 'eDir';
  return 'eMiss';
}
function finish(endSess, died) {
  clearTimeout(TIMER);
  if (R.duel) return finishDuelBlock(died);
  const evalIdx = R.moves.map((_, j) => j).filter(j => j >= R.n && j < Math.max(R.i, R.n) && R.ans[j] !== undefined);
  const n = evalIdx.length, ok = evalIdx.filter(j => R.ans[j] === R.moves[j].truth).length;
  const errs = {}; for (const j of evalIdx) if (R.ans[j] !== R.moves[j].truth) { const e = errType(R.moves[j], R.ans[j]); errs[e] = (errs[e] || 0) + 1; }
  for (const [e, v] of Object.entries(errs)) if (e[0] === 'f') { S.fal[e] = (S.fal[e] || 0) + v; if (SESS) { SESS.fal = SESS.fal || {}; SESS.fal[e] = (SESS.fal[e] || 0) + v; } }
  const full = R.i >= R.moves.length, pct = n ? ok / n : 0, l0 = R.lvl;
  const rate = R.tAct ? Math.round((ok - (n - ok)) / (R.tAct / 60000) * 10) / 10 : null;
  let l1 = l0;
  if (died) l1 = Math.max(1, l0 - 1);
  else if (full && n >= 10) { if (pct >= .85) l1 = Math.min(MAXL, l0 + (pct >= .95 && l0 <= 5 ? 2 : 1)); else if (pct < .6) l1 = Math.max(1, l0 - 1); }
  // honra: só rondas decididas (vitória até ao fim, ou morte) contam; cada modo tem a sua classificação
  let rk = null;
  if (died || full) {
    const lad = ladderOf(R.pace), before = S.rank[lad], E = 1 / (1 + Math.pow(10, (diffOf(l0, R.n) - before) / 400));
    const delta = died ? -Math.max(5, Math.round(32 * E)) : Math.max(3, Math.round(32 * (1 - E)));
    S.rank[lad] = before + delta;
    rk = { lad, before, after: before + delta, delta, up: rankIdx(before + delta) > rankIdx(before), down: rankIdx(before + delta) < rankIdx(before) };
  }
  S.lvl = l1;
  for (const d of new Set(R.doms || ['ord'])) S.lvls[d] = Math.max(1, Math.min(MAXL, (S.lvls[d] || 1) + (l1 - l0)));
  S.hist.push({ when: Date.now(), doms: R.doms || ['ord'], lvl: l0, n, ok, best: R.best, errs, resumes: R.resumes, pace: R.pace, autoT: R.pace === -1 ? Math.round(R.autoT * 10) / 10 : null, full, stroop: !!R.stroop, rate, died: !!died, lad: rk && rk.lad, delta: rk && rk.delta });
  S.hist = S.hist.slice(-100);
  R.done = true; R.result = { n, ok, l0, l1, errs, full, evalIdx, rate, died: !!died, rk, diedAt: R.i };
  S.run = null;
  if (SESS) { SESS.blocks.push({ doms: R.doms || ['ord'], n, ok, l0, l1, rate, best: R.best, delta: rk ? rk.delta : 0, lad: rk && rk.lad }); if ((endSess || SESS.left <= 0) && !died) { S.sess = null; save(); VIEW = 'sessend'; render(); return; } S.sess = SESS; }
  if (died) { save(); VIEW = 'death'; render(); return; }
  save();
  VIEW = 'summary'; render();
}
function explain(mv, j, X, Y) {
  const bi = mv.base, base = R.moves[bi].c, c = mv.c, d = derive(c, base, X, Y);
  const num = (k) => (k === 0 ? j : bi) + 1;   // k=0 → pista atual
  if (d.how === 'direct') { const cc = d.k === 0 ? c : base; return tt('dDirect', { p: num(d.k), a: cc[0], b: cc[1] }); }
  if (d.how === 'chain') { const e1 = d.k1 === 0 ? c : base, e2 = d.k2 === 0 ? c : base; return tt('dChain', { a: e1[0], m: d.m, b: e2[1], i: num(d.k1), j: num(d.k2) }); }
  // indeterminado: o que faltava
  const touch = (e, t) => e[0] === t || e[1] === t;
  const other = (e, t) => e[0] === t ? e[1] : e[0];
  const tc = [c, base].map((e, k) => ({ e, k, x: touch(e, X), y: touch(e, Y) }));
  const one = tc.filter(z => z.x || z.y);
  if (!one.length) return tt('dUnkNone', { x: X, y: Y });
  if (one.length === 1) { const z = one[0], a = z.x ? X : Y, o = z.x ? Y : X; return tt('dUnkOne', { p: num(z.k), a, m: other(z.e, a), o, q: num(1 - z.k) }); }
  const zx = one.find(z => z.x), zy = one.find(z => z.y && z !== zx);
  if (zx && zy) return tt('dUnkTwo', { x: X, y: Y, m: other(zx.e, X), w: other(zy.e, Y) });
  const t0 = one[0].x ? X : Y; return tt('dUnkSame', { t: t0, a: other(one[0].e, t0), b: other(one[1].e, t0), o: t0 === X ? Y : X });
}
// explicação de uma parte da afirmação: garantida, o contrário, ou não dá para saber
function partWhy(pt, mv, j) {
  const bi = mv.base, base = R.moves[bi].c, c = mv.c, P = pt.f[0], Q = pt.f[1];
  const num = (k) => (k === 0 ? j : bi) + 1;
  const how = (d, a, b) => d.how === 'direct' ? tt('dDirect', { p: num(d.k), a, b }) : tt('dChain', { a: (d.k1 === 0 ? c : base)[0], m: d.m, b: (d.k2 === 0 ? c : base)[1], i: num(d.k1), j: num(d.k2) });
  const d = derive(c, base, P, Q);
  const head = `${d.a === 'xy' ? '✓' : '✗'} «${esc(partPlain(pt))}»: `;
  if (d.a === 'xy') return head + esc(tt('pYes') + '. ' + how(d, P, Q));
  if (d.a === 'yx') return head + esc(tt('pOpp') + '. ' + how(d, Q, P));
  return head + esc(tt('pUnk') + '.');
}
function stroopLine(r) {
  if (!R.stroop) return '';
  const st = { c: [0, 0], i: [0, 0] };
  for (const j of r.evalIdx) { const mv = R.moves[j]; if (!mv.col) continue; const k = (mv.col === 'g') === mv.truth ? 'c' : 'i'; st[k][1]++; if (R.ans[j] === mv.truth) st[k][0]++; }
  return `<p class="small">${esc(tt('stroopSum', { a: st.c[0], b: st.c[1], c: st.i[0], d: st.i[1] }))}</p>`;
}
// janela de morte: o que falhou, porquê, e a honra perdida
function death(m) {
  const r = R.result, jj = R.n === 1 ? tt('jj1') : tt('jjN');
  const wrong = r.evalIdx.filter(j => R.ans[j] !== R.moves[j].truth);
  const sessOver = SESS && SESS.left <= 0;
  m.innerHTML = `<div class="cx-death"><div class="cx-deathcard">
    <div class="cx-skull" aria-hidden="true">${ic('skull', 56)}</div><h2>${esc(tt('deathT'))}</h2>
    <p class="cx-dsub">${esc(tt('deathSub', { i: r.diedAt }))}</p>
    ${r.rk ? `<p class="cx-dpts">${esc(tt('ptsLoss', { d: -r.rk.delta, l: tt('ladder')[r.rk.lad] }))}${r.rk.down ? ` · <span>${esc(tt('rankDown', { r: rankName(r.rk.after) }))}</span>` : ''}</p>` : ''}
    ${r.l1 < r.l0 ? `<p class="cx-dlvl">${esc(tt('deathLvl', { l: r.l1 }))}</p>` : ''}
    <h3>${tt('deathWhy')}</h3>
    <div class="cx-dlist">${wrong.map(j => { const mv = R.moves[j], et = errType(mv, R.ans[j]);
      return `<div><b>${j + 1}</b><span>«${esc(qPlain(mv))}» → ${esc(tfTxt(mv.truth))}${et[0] === 'f' ? ` <em class="cx-fal">${esc(tt(et))}</em>` : ''}<small>${esc(tt('tip')[et].split('{n}').join(R.n).split('{jj}').join(jj))}</small></span></div>`; }).join('')}</div>
    ${r.rk ? rankBar(r.rk.lad) : ''}
    <div class="row" style="justify-content:center;margin-top:16px"><button class="cx-go" data-act="rise">${sessOver ? tt('newSess') : tt('deathRise')} ↵</button><button class="btn ghost" data-act="report">${tt('deathReport')}</button></div>
  </div></div>`;
  const rise = m.querySelector('[data-act=rise]'); rise.focus({ preventScroll: true });
  rise.onclick = () => { if (sessOver) { VIEW = 'sessend'; render(); return; } startRun(SESS ? SESS.auto : R.auto !== false); };
  m.querySelector('[data-act=report]').onclick = () => { VIEW = 'summary'; render(); };
}
function summary(m) {
  const r = R.result;
  const lvlLine = r.l1 > r.l0 ? tt('up', { l: r.l1, d: lvlDesc(r.l1, oneDom(R.doms)) }) : r.l1 < r.l0 ? tt('down', { l: r.l1 }) : tt('hold', { l: r.l1 });
  const rows = r.evalIdx.map(j => {
    const mv = R.moves[j], a = R.ans[j], ok = a === mv.truth, bi = mv.base;
    const claim = '«' + esc(qPlain(mv)) + '»';
    const why = isX(mv) ? esc(whyX(mv)) : mv.parts.length === 1
      ? esc(tt(mv.truth ? 'vT' : mv.ans === 'unk' ? 'vFunk' : 'vFopp', { d: explain(mv, j, mv.parts[0].f[0], mv.parts[0].f[1]) }))
      : esc(tt(mv.truth ? 'vT0' : 'vF0')) + '<br>' + mv.parts.map(pt => partWhy(pt, mv, j)).join('<br>');
    const clueSpan = (m, k) => `<span><i>${k + 1}</i>${esc(clueTxt(m))}${isX(m) ? (m.w !== xCanon(m.dom, m.c) ? ` <small class="muted">(= ${esc(xText(m.dom, m.c, xCanon(m.dom, m.c), m.nm))})</small>` : '') : (m.w || 'b') !== 'b' ? ` <small class="muted">(${esc(tt('eq', { p: m.c[0], q: m.c[1] }))})</small>` : ''}</span>`;
    const clues = `<div class="ch-pair">${clueSpan(R.moves[bi], bi)}<span>+</span>${clueSpan(mv, j)}</div>`;
    if (ok) return `<details class="ch-row ok"><summary>✓ <b>${j + 1}</b> · ${claim} → ${esc(tfTxt(mv.truth))}</summary>${clues}<p>${why}</p></details>`;
    const et = errType(mv, a);
    return `<details class="ch-row bad" open><summary>✗ <b>${j + 1}</b> · ${claim} · ${esc(tt('you', { a: tfTxt(a) }))} · ${esc(tt('right', { a: tfTxt(mv.truth) }))} <span class="ch-et">${esc(tt(et))}</span></summary>${clues}
      ${et === 'eLure' ? `<p class="ch-lure">${esc(tt('xLure', { l: mv.lureIdx + 1, p: bi + 1 }))}</p>` : ''}<p>${why}</p></details>`;
  }).join('');
  m.innerHTML = `<div class="ch-sum">
    <div class="ch-card ch-sumcard"><div class="ch-kick"><span></span>${tt('sumTitle')}<span></span></div><div class="ch-big">${r.ok}/${r.n}</div>
      <p>${esc(tt('score', { ok: r.ok, n: r.n, b: R.best }))}</p>${r.rate != null ? `<p class="small">${esc(tt('rate', { r: r.rate.toLocaleString(lang() === 'pt' ? 'pt-PT' : 'en-GB') }))}</p>` : ''}<p class="ch-lvl ${r.l1 > r.l0 ? 'cx-up' : ''}">${esc(lvlLine)}</p>${r.rk ? `<p class="cx-sumrank ${r.rk.delta > 0 ? 'up' : 'down'}">${esc(r.rk.delta > 0 ? tt('win') + ' · ' + tt('ptsWin', { d: r.rk.delta, l: tt('ladder')[r.rk.lad] }) : tt('ptsLoss', { d: -r.rk.delta, l: tt('ladder')[r.rk.lad] }))}${r.rk.up ? ' · ' + esc(tt('rankUp', { r: rankName(r.rk.after) })) : r.rk.down ? ' · ' + esc(tt('rankDown', { r: rankName(r.rk.after) })) : ''}</p>${rankBar(r.rk.lad)}` : (R.duel && r.duel ? `<p class="cx-sumrank ${r.duel.delta > 0 ? 'up' : 'down'}">${ic('swords', 15)} ${esc(botName(botOf(R.duel.id)))} ${r.duel.botOk} · ${esc(du('you'))} ${r.ok} · ${esc(du('pts', { d: (r.duel.delta > 0 ? '+' : '') + r.duel.delta }))}</p>` : `<p class="muted small">${esc(tt('unrated'))}</p>`)}
      ${R.resumes ? `<p class="muted small">${esc(tt('resumed', { n: R.resumes }))}</p>` : ''}${stroopLine(r)}${R.pace === -1 && R.autoT0 ? `<p class="small">${esc(tt('autoSum', { a: fmtS(R.autoT0), b: fmtS(R.autoT), d: R.autoT < R.autoT0 - .05 ? tt('faster') : R.autoT > R.autoT0 + .05 ? tt('slower') : tt('same') }))}</p>` : ''}</div>
    ${Object.keys(r.errs).length ? `<h3 class="ch-h3">${tt('errs')}</h3><div class="ch-errs">${Object.entries(r.errs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="chip">${esc(tt(k))} · ${v}</span>`).join('')}</div>` : ''}
    <h3 class="ch-h3">${tt('review')}</h3><div class="ch-rows">${rows}</div>
    <div class="row" style="margin-top:16px"><button class="btn primary" data-act="again">${tt('again')}</button><button class="btn ghost" data-act="intro">${tt('menuBtn')}</button></div></div>`;
  m.querySelector('[data-act=again]').onclick = () => R.duel ? startDuel(R.duel.id) : startRun(R.auto !== false);
  if (SESS) {
    const bn = document.createElement('div'); bn.className = 'cx-sessbar';
    bn.innerHTML = `<span>${esc(tt('sessBanner', { t: fmtClock(SESS.left) }))}</span><span id="cxNextIn"></span><button class="btn primary" data-act="snext">${tt('nextNow')} ↵</button><button class="btn ghost" data-act="send">${tt('endSess')}</button>`;
    m.prepend(bn);
    const again = m.querySelector('[data-act=again]'); if (again) again.style.display = 'none';
    let left = 8; const tick = () => { const el = $('#cxNextIn'); if (el) el.textContent = tt('nextIn', { s: left }); if (left-- <= 0) { clearInterval(NEXTT); startRun(SESS.auto); } };
    tick(); NEXTT = setInterval(tick, 1000);
    const stop = () => { clearInterval(NEXTT); const el = $('#cxNextIn'); if (el) el.textContent = ''; };
    m.querySelectorAll('.ch-rows, .ch-errs').forEach(x => x.addEventListener('click', stop));
    bn.querySelector('[data-act=snext]').onclick = () => { clearInterval(NEXTT); startRun(SESS.auto); };
    bn.querySelector('[data-act=send]').onclick = () => { clearInterval(NEXTT); SESS.quit = true; S.sess = null; save(); VIEW = 'sessend'; render(); };
    bn.querySelector('[data-act=snext]').focus({ preventScroll: true });
  }
  m.querySelector('[data-act=intro]').onclick = () => { clearInterval(NEXTT); R = null; if (SESS) { SESS = null; S.sess = null; save(); } VIEW = 'intro'; render(); };
}
// fim da sessão: o que fizeste nos minutos todos
function sessend(m) {
  const X = SESS || { blocks: [], lvl0: S.lvl }, B = X.blocks, n = B.reduce((a, b) => a + b.n, 0), ok = B.reduce((a, b) => a + b.ok, 0);
  const rates = B.filter(b => b.rate != null).map(b => b.rate), best = Math.max(0, ...B.map(b => b.best));
  m.innerHTML = `<div class="cx-lore"><div class="cx-lorecard end"><div class="cx-crest" aria-hidden="true">${ic('candle', 42)}</div><h2>${esc(X.quit ? tt('sessTitleQuit') : tt('sessTitle'))}</h2>
    <p class="cx-big">${ok}/${n}</p>
    <p>${esc(tt('sessStats', { bw: B.length === 1 ? (lang() === 'pt' ? 'bloco' : 'block') : (lang() === 'pt' ? 'blocos' : 'blocks'), b: B.length, ok, n, p: n ? Math.round(ok / n * 100) : 0, best }))}</p>
    <p>${X.lvls0 ? esc(DOMS.filter(d => B.some(b => (b.doms || ['ord']).includes(d))).map(d => tt('sessLvlD', { d: tt('domL')[d], a: X.lvls0[d], c: S.lvls[d] })).join(' · ')) : esc(tt('sessLvl', { a: X.lvl0, c: S.lvl }))}</p>
    ${X.fal && Object.keys(X.fal).length ? `<p class="small">${esc(tt('falSess', { f: Object.entries(X.fal).sort((a, b) => b[1] - a[1]).map(([k, v]) => tt(k) + (v > 1 ? ' ×' + v : '')).join(' · ') }))}</p>` : ''}
    ${B.some(b => b.lad) ? `<p class="cx-sumrank ${B.reduce((a, b) => a + (b.delta || 0), 0) >= 0 ? 'up' : 'down'}">${esc(tt('sessPts', { d: (B.reduce((a, b) => a + (b.delta || 0), 0) >= 0 ? '+' : '') + B.reduce((a, b) => a + (b.delta || 0), 0), l: tt('ladder')[B.find(b => b.lad).lad] }))}</p>${rankBar(B.find(b => b.lad).lad)}` : ''}
    ${rates.length ? `<p>${esc(tt('sessRate', { r: (Math.round(rates.reduce((a, b) => a + b, 0) / rates.length * 10) / 10).toLocaleString(lang() === 'pt' ? 'pt-PT' : 'en-GB') }))}</p>` : ''}
    <div class="row" style="justify-content:center;margin-top:14px"><button class="cx-go" data-act="new">${tt('newSess')}</button><button class="btn ghost" data-act="back">${tt('menuBtn')}</button></div></div></div>`;
  SESS = null; S.sess = null; save();
  const nb = m.querySelector('[data-act=new]'); nb.focus({ preventScroll: true });
  nb.onclick = () => { R = null; beginSession(S.lastAuto !== false); };
  m.querySelector('[data-act=back]').onclick = () => { R = null; VIEW = 'intro'; render(); };
}
// teclado: ← (ou S/Y/1) Sim, → (ou N/2) Não; setas/Enter seguem nas pistas a memorizar; P pausa
document.addEventListener('keydown', (e) => {
  const r = root(); if (!r || r.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  if (VIEW === 'intro' && e.key === 'Enter' && !(e.target.closest && e.target.closest('#chain button'))) { const b = r.querySelector('[data-act=resume]') || r.querySelector('[data-act=auto]'); if (b) { e.preventDefault(); b.click(); } return; }
  if ((VIEW === 'lore' || VIEW === 'sessend' || VIEW === 'death' || VIEW === 'duelend') && e.key === 'Enter' && !(e.target.closest && e.target.closest('#chain button, #chain input'))) { const b = r.querySelector('[data-act=go], [data-act=new], [data-act=rise]'); if (b) { e.preventDefault(); b.click(); } return; }
  if ((e.key === 'm' || e.key === 'M') && !(e.target.closest && e.target.closest('input, textarea'))) { e.preventDefault(); musicToggle(); return; }
  if (VIEW === 'cards' && WG && !WG.end) {
    const r = WG.rounds[WG.i];
    if (/^[1-4]$/.test(e.key) && !r.done) { e.preventDefault(); const b = root().querySelector(`[data-wcard="${+e.key - 1}"]`); if (b) b.click(); return; }
    if (e.key === 'Enter' && !(e.target.closest && e.target.closest('#chain button'))) { e.preventDefault(); if (r.done) wNext(); else wTurn(); return; }
    return;
  }
  if (VIEW === 'cards' && WG && WG.end && e.key === 'Enter' && !(e.target.closest && e.target.closest('#chain button'))) { e.preventDefault(); openCards(); return; }
  if (VIEW === 'tut') {
    const K = { ArrowLeft: 1, s: 1, S: 1, y: 1, Y: 1, '1': 1, ArrowRight: 0, n: 0, N: 0, '2': 0 };
    const nx = r.querySelector('[data-act=tnext]');
    if (nx && (e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow'))) { e.preventDefault(); if (!e.repeat) nx.click(); return; }
    if (e.key in K && r.querySelector('[data-tf]')) { e.preventDefault(); if (!e.repeat) tutAnswer(K[e.key] === 1); return; }
    if (e.key === 'Enter') { const g = r.querySelector('[data-act=go]'); if (g && !(e.target.closest && e.target.closest('#chain button'))) { e.preventDefault(); g.click(); } }
    return;
  }
  if (VIEW !== 'play') return;
  const KEYTF = { ArrowLeft: 1, s: 1, S: 1, y: 1, Y: 1, v: 1, V: 1, '1': 1, ArrowRight: 0, n: 0, N: 0, f: 0, F: 0, '2': 0 };
  const nx = r.querySelector('.ch-next');
  if (nx && (e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow'))) { e.preventDefault(); if (!e.repeat) advanceNoAnswer(); return; }
  if (e.key in KEYTF) { const b = r.querySelector(`[data-tf="${KEYTF[e.key]}"]`); if (b) { e.preventDefault(); if (!e.repeat) answer(KEYTF[e.key] === 1, b); } return; }
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); pauseRun(); }
});
// ao sair do ecrã a meio de um bloco, fica pausado (retoma com revisão)
document.addEventListener('visibilitychange', () => { if (document.hidden && VIEW === 'play' && R && !R.review && !LOCK) pauseRun(); });

setInterval(() => {
  const now = Date.now();
  if (!SESS || VIEW !== 'play' || document.hidden || !R || R.done) { if (SESS) SESS.last = 0; return; }
  if (SESS.last) SESS.left -= now - SESS.last;
  SESS.last = now;
  const el = $('#cxSess'); if (el) { el.textContent = tt('sessLeft', { t: fmtClock(SESS.left) }); el.classList.toggle('low', SESS.left < 60000); }
  if (SESS.left <= 0 && !LOCK) { SESS.left = 0; S.sess = SESS; finish(true); }
}, 250);
window.LGChain = { open, label: () => tt('nav'), meta: () => rankName(S.rank.free), _derive: derive, _make: makeBlock, _x: { sylEv, condEv, sylFal, condFal, condRule, xText, DX, setDom: (d) => { S.dom = d; planBlock(); }, plan: planBlock, S: () => S, botPlay: (b, k) => botPlay(b, k), BOTS: () => BOTS, wRound: (l) => wRound(l), W_RULES: () => W_RULES }, _mus: () => ({ MUS, AC }) };
})();
