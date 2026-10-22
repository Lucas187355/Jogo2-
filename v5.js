'use strict';
// Expansão V5: mantém o motor narrativo e as funcionalidades V1-V4.
const V5_SLOTS='lendaV5_slots',V5_ACTIVE='lendaV5_active';
const V5_DERBIES=[['Flamengo','Vasco'],['Flamengo','Fluminense'],['Flamengo','Botafogo'],['Corinthians','Palmeiras'],['Corinthians','São Paulo'],['Palmeiras','São Paulo'],['Santos','São Paulo'],['Grêmio','Internacional'],['Atlético-MG','Cruzeiro'],['Bahia','Vitória'],['Ceará','Fortaleza'],['Sport','Santa Cruz'],['Athletico-PR','Coritiba']];
const V5_WORLD=['Real Madrid','Manchester City','Bayern de Munique','Paris Saint-Germain','Inter de Milão','Barcelona','Chelsea','Flamengo','Palmeiras','Botafogo','River Plate','Boca Juniors','Al Ahly','Mamelodi Sundowns','Urawa Reds','Al Hilal'];
const V5_POTENTIAL_ATTRS=['finalizacao','passe','drible','velocidade','defesa','fisico'];
function v5Slots(){try{return JSON.parse(localStorage.getItem(V5_SLOTS))||{}}catch{return {}}}
function v5Active(){return Math.max(1,Math.min(5,Number(localStorage.getItem(V5_ACTIVE))||1))}
function v5Init(){if(!state)return null;const p=state.player;let v=state.v5;if(!v){v=state.v5={potential:Math.min(96,Math.max(74,calcOvr()+rand(13,24))),coachLast:'',coachStyle:pick(['Exigente','Motivador','Tático','Formador']),seasonLogs:[],worldHistory:[],worldStage:0,worldRound:0,worldOpponents:[],worldResults:[],worldYear:0,qualifierPoints:0,nationalTrust:50,negotiations:[],lastNewsDay:'',classicWins:0,classicGames:0,careerRecords:{bestGoals:0,bestOverall:calcOvr()}}}v.potential=Math.max(calcOvr(),Math.min(99,v.potential||75));v.seasonLogs ||= [];v.worldHistory ||= [];v.worldResults ||= [];v.negotiations ||= [];v.careerRecords ||= {bestGoals:0,bestOverall:calcOvr()};return v}
function v5AddNews(head,body){addNews(head,body)}
function v5ClubsForWorld(){const team=state.player.club;const pool=V5_WORLD.filter(c=>c!==team);if(!pool.includes(team))pool.push(team);return pool}
function v5StartWorld(){const v=v5Init();if(v.worldYear===state.year)return;v.worldYear=state.year;v.worldRound=0;v.worldResults=[];v.worldStage=0;const all=v5ClubsForWorld().filter(n=>n!==state.player.club);v.worldOpponents=[all[0],all[3],all[6],all[9]].filter(Boolean);v5AddNews('🌍 Mundial de Clubes',`O ${state.player.club} vai disputar um Mundial fictício com fase de grupos e mata-mata.`)}
function v5WorldPlay(){if(!state||state.retired||live||waitingStory)return;const v=v5Init();if(v.worldYear!==state.year)v5StartWorld();if(v.worldRound>=4){alert('O Mundial desta temporada já terminou.');return}const opp=v.worldOpponents[v.worldRound],home=rand(0,4),away=rand(0,3),won=home>away;v.worldResults.push({opp,home,away,won,round:v.worldRound+1});v.worldRound++;if(won){state.player.moraleFans=clamp(state.player.moraleFans+4);v.nationalTrust=clamp(v.nationalTrust+2)}else{state.player.moraleFans=clamp(state.player.moraleFans-2)}v5AddNews('🌍 Mundial de Clubes',`${state.player.club} ${home} × ${away} ${opp} — ${won?'vitória':'jogo encerrado'}.`);if(v.worldRound===4){const wins=v.worldResults.filter(x=>x.won).length;const title=wins>=3;if(title){state.player.titles.push({name:'Mundial de Clubes',year:state.year,club:state.player.club});state.player.moraleFans=clamp(state.player.moraleFans+12)}v.worldHistory.push({year:state.year,wins,champion:title,club:state.player.club});v5AddNews(title?'🏆 Campeão mundial!':'Fim da campanha no Mundial',title?`${state.player.club} conquista o Mundial de Clubes!`:`${state.player.club} encerrou a campanha com ${wins} vitórias.`)}save();render()}
function v5CoachTalk(kind){if(!state||state.retired)return;const v=v5Init();if(v.coachLast===state.date){alert('Você já conversou com o treinador hoje.');return}const changes={work:[9,2,'prometeu se dedicar mais aos treinos'],chance:[-3,5,'pediu uma oportunidade como titular'],rest:[3,0,'conversou sobre recuperação física']}[kind];if(!changes)return;v.coachLast=state.date;state.player.moraleCoach=clamp(state.player.moraleCoach+changes[0]);state.player.moraleFans=clamp(state.player.moraleFans+changes[1]);if(kind==='rest')state.player.energy=clamp(state.player.energy+8);v5AddNews('💬 Reunião com o treinador',`${state.player.name} ${changes[2]}.`);save();render()}
function v5Offer(){if(!state||state.retired)return;const v=v5Init();const c=CLUBS.filter(x=>x.name!==state.player.club);const chosen=pick(c);const salary=rand(12,45)*1000+calcOvr()*700;v.negotiations.unshift({club:chosen.name,salary,years:rand(2,4),bonus:salary*2,created:state.date});v.negotiations=v.negotiations.slice(0,3);v5AddNews('💰 Oferta de contrato',`${chosen.name} apresentou uma proposta ao empresário de ${state.player.name}.`);save();render()}
function v5Negotiate(i,action){const v=v5Init(),o=v.negotiations[i];if(!o||state.retired)return;if(action==='counter'){o.salary=Math.round(o.salary*1.12);o.bonus=Math.round(o.bonus*0.9);o.countered=true;v5AddNews('🤝 Contraproposta',`${state.player.name} pediu um salário maior ao ${o.club}.`)}else if(action==='accept'){const team=o.club;const salary=o.salary;v.negotiations=[];transfer(team);ensureV2();state.v2.contract.salary=salary;state.v2.contract.years=o.years;v5AddNews('📝 Contrato assinado',`${state.player.name} fechou com ${team} por ${salary.toLocaleString('pt-BR')} por mês (valor fictício).`)}else{v.negotiations.splice(i,1);v5AddNews('📩 Oferta recusada',`${state.player.name} decidiu permanecer no clube atual.`)}save();render()}
function v5SeasonFinish(){const v=v5Init(),p=state.player;const s=state.v2?.seasonStats?.[String(state.year)]||{};const log={year:state.year,club:p.club,ovr:calcOvr(),games:s.apps||0,goals:s.goals||0,assists:s.assists||0,titles:p.titles.filter(t=>t.year===state.year).map(t=>t.name),coach:p.moraleCoach,fans:p.moraleFans};if(!v.seasonLogs.some(x=>x.year===log.year))v.seasonLogs.push(log);v.careerRecords.bestGoals=Math.max(v.careerRecords.bestGoals,log.goals);v.careerRecords.bestOverall=Math.max(v.careerRecords.bestOverall,log.ovr);const old=v.potential;v.potential=Math.max(calcOvr(),clamp(v.potential+(log.games>=15&&log.goals>=8?2:log.games<6?-1:0),60,99));if(v.potential>old)v5AddNews('📈 Potencial em alta',`${p.name} chamou atenção dos olheiros e seu potencial cresceu.`);v.qualifierPoints=0;v.nationalTrust=clamp(v.nationalTrust+(log.games>=10?5:-2));}
function v5WorldRender(){const v=v5Init();const remaining=v.worldYear===state.year?v.worldOpponents[v.worldRound]:null;return `<p>Mundial fictício da temporada ${state.year} • ${v.worldRound||0}/4 jogos concluídos</p><p>${v.worldYear!==state.year?'A campanha desta temporada ainda não começou.':v.worldRound>=4?'Campanha concluída.':`Próximo adversário: <b>${esc(remaining||'A definir')}</b>`}</p><button class="primary" onclick="v5WorldPlay()" ${state.retired||v.worldRound>=4&&v.worldYear===state.year?'disabled':''}>🌍 Disputar jogo do Mundial</button><div class="v5rows">${v.worldResults.map(r=>`<p>Rodada ${r.round}: ${esc(state.player.club)} ${r.home} × ${r.away} ${esc(r.opp)}</p>`).join('')}</div><p>Histórico: ${v.worldHistory.map(x=>`${x.year}: ${x.champion?'🏆 Campeão':'Participação'} (${x.wins} vitórias)`).join(' • ')||'Nenhum Mundial encerrado'}</p>`}
function v5Render(){if(!state||!$('v5Page'))return;const v=v5Init(),p=state.player;const f=currentFixture(),rival=f?(f.home===p.club?f.away:f.home):null;const classic=V5_DERBIES.some(x=>x.includes(p.club)&&x.includes(rival));$('v5World').innerHTML=v5WorldRender();$('v5Potential').innerHTML=`<p>Overall atual: <b>${calcOvr()}</b> • Potencial estimado: <b>${v.potential}</b></p><p>O potencial pode crescer com temporadas de destaque. Treinamentos continuam sendo a principal forma de evoluir atributos.</p><p>Recorde de overall: ${v.careerRecords.bestOverall}</p>`;$('v5National').innerHTML=`<p>Confiança na seleção: <b>${v.nationalTrust}/100</b> • Pontos em eliminatórias simuladas: ${v.qualifierPoints}</p><p>Partidas e convocações internacionais continuam disponíveis na aba Glória & Seleção. Boas atuações aumentam a confiança.</p>`;$('v5Derby').innerHTML=`<p>Próximo rival: <b>${esc(rival||'Sem jogo marcado')}</b> ${classic?'🔥 CLÁSSICO!':''}</p><p>Clássicos disputados: ${v.classicGames} • Vitórias: ${v.classicWins}</p><p>Jogos contra rivais aumentam a pressão e o impacto na moral da torcida.</p>`;$('v5Coach').innerHTML=`<p>Estilo do técnico: <b>${esc(v.coachStyle)}</b> • Confiança: ${p.moraleCoach}/100</p><div class="buttonrow"><button class="secondary" onclick="v5CoachTalk('work')">Prometer dedicação</button><button class="secondary" onclick="v5CoachTalk('chance')">Pedir titularidade</button><button class="secondary" onclick="v5CoachTalk('rest')">Pedir descanso</button></div><p class="muted">${v.coachLast===state.date?'Você já conversou hoje.':'Uma conversa por dia.'}</p>`;$('v5Negotiation').innerHTML=`<button class="secondary" onclick="v5Offer()">📨 Procurar nova proposta</button>`+v.negotiations.map((o,i)=>`<div class="v5offer"><b>${esc(o.club)}</b><p>Salário: R$ ${o.salary.toLocaleString('pt-BR')}/mês • ${o.years} anos • Luvas: R$ ${o.bonus.toLocaleString('pt-BR')}</p><div class="buttonrow"><button class="primary" onclick="v5Negotiate(${i},'accept')">Aceitar</button><button class="secondary" onclick="v5Negotiate(${i},'counter')" ${o.countered?'disabled':''}>Contraproposta</button><button class="secondary" onclick="v5Negotiate(${i},'reject')">Recusar</button></div></div>`).join('');$('v5History').innerHTML=v.seasonLogs.length?`<div class="tablewrap"><table><thead><tr><th>Ano</th><th>Clube</th><th>OVR</th><th>Jogos</th><th>Gols</th><th>Assist.</th><th>Títulos</th></tr></thead><tbody>${v.seasonLogs.map(x=>`<tr><td>${x.year}</td><td>${esc(x.club)}</td><td>${x.ovr}</td><td>${x.games}</td><td>${x.goals}</td><td>${x.assists}</td><td>${esc(x.titles.join(', ')||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<p>As temporadas encerradas aparecerão aqui.</p>';$('v5News').innerHTML=state.news.slice(0,8).map(x=>`<article class="newsitem"><small>${formatDate(x.date)}</small><h4>${esc(x.head)}</h4><p>${esc(x.body)}</p></article>`).join('');v5RenderSaves()}
function v5RenderSaves(){const el=$('v5Saves');if(!el)return;const slots=v5Slots(),active=v5Active();el.innerHTML=Array.from({length:5},(_,i)=>{const n=i+1;let data;try{data=JSON.parse(slots[n])}catch{}return `<div class="v5offer"><h3>Save ${n} ${active===n?'• ATIVO':''}</h3><p>${data?.player?`${esc(data.player.name)} • ${esc(data.player.club)} • ${data.year}`:'Vazio'}</p><div class="buttonrow"><button class="secondary" onclick="v5SelectSlot(${n})">${data?'Carregar':'Criar carreira'}</button><button class="secondary" onclick="v5ExportSlot(${n})" ${!data?'disabled':''}>Exportar</button><button class="secondary" onclick="v5DeleteSlot(${n})" ${!data?'disabled':''}>Excluir</button></div></div>`}).join('')+`<div class="v5offer"><h3>Importar save</h3><input type="file" accept=".json,application/json" id="v5ImportFile"><button class="secondary" onclick="v5ImportSlot()">Importar no save ativo</button></div>`}
function v5SelectSlot(n){if(n===v5Active())return;const slots=v5Slots();if(!confirm(`Trocar para o save ${n}? A página será recarregada.`))return;localStorage.setItem(V5_ACTIVE,String(n));if(slots[n])localStorage.setItem(KEY,slots[n]);else localStorage.removeItem(KEY);location.reload()}
function v5DeleteSlot(n){if(!confirm(`Excluir o save ${n}? Esta ação não pode ser desfeita.`))return;const slots=v5Slots();delete slots[n];localStorage.setItem(V5_SLOTS,JSON.stringify(slots));if(n===v5Active()){localStorage.removeItem(KEY);location.reload()}else v5RenderSaves()}
function v5ExportSlot(n){const slots=v5Slots(),s=slots[n];if(!s)return;const a=document.createElement('a'),blob=new Blob([s],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=`lenda-do-gramado-save-${n}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function v5ImportSlot(){const f=$('v5ImportFile')?.files?.[0];if(!f)return alert('Escolha um arquivo JSON.');const reader=new FileReader();reader.onload=()=>{try{const x=JSON.parse(reader.result);if(x.version!==1||!x.player||!Array.isArray(x.fixtures))throw Error('Formato inválido');if(!confirm('Substituir a carreira ativa pelo arquivo importado?'))return;const slots=v5Slots(),s=JSON.stringify(x);slots[v5Active()]=s;localStorage.setItem(V5_SLOTS,JSON.stringify(slots));localStorage.setItem(KEY,s);location.reload()}catch(e){alert('Não foi possível importar este save: '+e.message)}};reader.readAsText(f)}
// Salva cada carreira em seu próprio slot sem mudar a compatibilidade da chave antiga.
const v5SaveBase=save;
save=function(){v5SaveBase();if(!state)return;try{const slots=v5Slots();slots[v5Active()]=JSON.stringify(state);localStorage.setItem(V5_SLOTS,JSON.stringify(slots))}catch(e){}};
const v5FinishBase=finishMatch;
finishMatch=function(h,a,actions){const f=currentFixture();const comp=f?.comp||'',home=f?.home,away=f?.away,year=state?.year;v5FinishBase(h,a,actions);if(!state||!f?.played)return;const v=v5Init(),p=state.player;const other=home===p.club?away:home;const classic=V5_DERBIES.some(x=>x.includes(p.club)&&x.includes(other));if(classic){v.classicGames++;const win=(home===p.club?h>a:a>h);if(win){v.classicWins++;p.moraleFans=clamp(p.moraleFans+8)}else p.moraleFans=clamp(p.moraleFans-4);v5AddNews('🔥 Clássico disputado',`${p.club} enfrentou ${other} em ${comp}. A torcida ${win?'comemorou':'ficou na expectativa'}.`)}v.nationalTrust=clamp(v.nationalTrust+(actions?.goals?2:0)+(actions?.assists?1:0));v.careerRecords.bestOverall=Math.max(v.careerRecords.bestOverall,calcOvr());save();render()};
const v5NextSeasonBase=nextSeason;
nextSeason=function(){if(!state)return;v5SeasonFinish();v5NextSeasonBase();save();render()};
const v5RenderBase=render;
render=function(){if(!state)return;v5Init();v5RenderBase();v5Render()};
const v5SwitchBase=switchPage;
switchPage=function(name){v5SwitchBase(name);if(name==='v5'||name==='saves')v5Render()};

// Calendário com adversários variados e turno/returno para o clube do jogador.
const v5FixturesBase=allFixturesForClub;
allFixturesForClub=function(team,startDate){
 const result=v5FixturesBase(team,startDate),c=club(team);
 if(!c)return result;
 const league=c.division==='Europa'?'Liga Europeia':c.division==='América do Sul'?'Liga Sul-Americana':`Brasileirão Série ${c.division}`;
 const st=stateCompetition(c.state);
 const leaguePool=(state.groups[league]||[]).filter(n=>n!==team);
 const statePool=(state.groups[st]||[]).filter(n=>n!==team);
 const shuffled=a=>a.slice().sort(()=>Math.random()-.5);
 const l=shuffled(leaguePool),regional=shuffled(statePool);
 let li=0,ri=0;
 for(const f of result){
  const isRegional=f.comp===st,opp=isRegional?regional[ri++%Math.max(1,regional.length)]:l[li++%Math.max(1,l.length)];
  if(!opp)continue;
  const home=(isRegional?ri:li)%2===1;
  f.home=home?team:opp;f.away=home?opp:team;
 }
 return result.filter(f=>f.home!==f.away);
};
const v5NextDayBase=nextDay;
nextDay=function(){
 if(!state)return;
 const before=state.date;v5NextDayBase();
 if(state.date===before)return;
 const v=v5Init(),p=state.player;
 if(state.date.slice(-2)==='15'&&v.lastNewsDay!==state.date){
  v.lastNewsDay=state.date;
  const headlines=[
   ['Mercado agitado',`Clubes monitoram atletas da Série ${club(p.club)?.division||'A'} e preparam ofertas para a próxima janela.`],
   ['Torcida de olho',`A torcida do ${p.club} avalia a campanha do time e cobra dedicação nos treinos.`],
   ['Olheiros observam',`${p.name} aparece nos relatórios de desempenho dos observadores.`],
   ['Seleções se preparam',`As seleções iniciam a preparação para as próximas datas internacionais.`]
  ];
  const item=pick(headlines);v5AddNews(item[0],item[1]);
 }
 if(state.date.slice(-2)==='20'&&[3,6,9,11].includes(Number(state.date.slice(5,7)))){
  const good=calcOvr()>=72&&p.moraleCoach>=55;
  v.qualifierPoints+=good?rand(1,3):rand(0,1);
  v.nationalTrust=clamp(v.nationalTrust+(good?3:-1));
  v5AddNews('🇧🇷 Eliminatórias',good?`${p.name} foi observado pela comissão técnica após mais uma rodada das eliminatórias.`:'A seleção disputou uma rodada das eliminatórias; seu jogador ainda busca espaço.');
 }
 save();render();
};

if(!localStorage.getItem(V5_ACTIVE))localStorage.setItem(V5_ACTIVE,'1');
if(state){v5Init();save();render()}
